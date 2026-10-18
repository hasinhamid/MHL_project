import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient
from openai import APITimeoutError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ai_service
from main import app
import provider_service
from schemas import WorkerApplication


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temporary = TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.workers_file = Path(self.temporary.name) / "workers.json"
        patcher = patch.object(provider_service, "WORKERS_FILE", self.workers_file)
        patcher.start()
        self.addCleanup(patcher.stop)
        environment = patch.dict(os.environ, {"AI_MODE": "demo"})
        environment.start()
        self.addCleanup(environment.stop)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def worker(self, **changes):
        return {"name": "Demo Worker", "phone": "01712345678", "trade": "home_helper", "areas": ["Dhanmondi"], "experience_years": 4, "fee_min": 300, "fee_max": 800, "note": "Morning appointments", **changes}

    def test_seed_coverage_and_directory(self):
        records = self.client.get("/api/providers").json()
        self.assertEqual(len(records), 15)
        self.assertEqual(len({p["trade"] for p in records}), 7)
        self.assertTrue(all(p["demo"] and p["phone"] is None for p in records))

    def test_exact_area_precedes_adjacent_and_unknown_is_not_nearby(self):
        records = self.client.get("/api/providers", params={"area": " dhanMONdi "}).json()
        priorities = {"local": 0, "adjacent": 1, "other": 2}
        self.assertEqual([priorities[p["coverage"]] for p in records], sorted(priorities[p["coverage"]] for p in records))
        adjacent = self.client.get("/api/providers", params={"trade": "plumber", "area": "Mohammadpur"}).json()
        self.assertEqual(adjacent[0]["id"], "p001")
        self.assertEqual(adjacent[1]["coverage"], "adjacent")
        unknown = self.client.get("/api/providers", params={"area": "Dhan"}).json()
        self.assertTrue(all(p["coverage"] == "other" for p in unknown))

    def test_trade_limit_and_availability(self):
        records = self.client.get("/api/providers", params={"trade": "plumber", "available": True, "limit": 1}).json()
        self.assertEqual(len(records), 1)
        self.assertTrue(records[0]["available"])
        self.assertEqual(records[0]["trade"], "plumber")
        self.assertEqual(self.client.get("/api/providers?limit=0").status_code, 422)
        self.assertEqual(self.client.get("/api/providers?trade=doctor").status_code, 422)

    def test_multilingual_demo(self):
        for message, trade in [("Amar bathroom er tap theke pani porche.", "plumber"), ("কল থেকে পানি পড়ছে", "plumber"), ("My AC is running but not cooling.", "ac_technician"), ("ঘর পরিষ্কার করার জন্য সাহায্য দরকার।", "home_helper"), ("I lost my keys", "locksmith")]:
            with self.subTest(message=message):
                response = self.client.post("/api/assistant", json={"message": message})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["recommended_trade"], trade)
                self.assertEqual(response.json()["source"], "demo")
                if "পানি" in message:
                    self.assertIn("পানি", response.json()["problem_summary"])

    def test_clarification_and_history(self):
        initial = self.client.post("/api/assistant", json={"message": "Something is broken"}).json()
        self.assertEqual(initial["intent"], "clarification")
        self.assertTrue(initial["follow_up_question"])
        reply = self.client.post("/api/assistant", json={"message": "Still not working", "history": [{"role": "user", "content": "My fridge stopped"}]}).json()
        self.assertEqual(reply["recommended_trade"], "appliance_repair")

    def test_electrical_hazard_and_unsupported(self):
        hazard = self.client.post("/api/assistant", json={"message": "Sparks and smoke from the switch"}).json()
        self.assertEqual(hazard["urgency"], "emergency")
        self.assertIn("999", hazard["safety_warning"])
        unsupported = self.client.post("/api/assistant", json={"message": "Write an essay about bitcoin"}).json()
        self.assertEqual(unsupported["intent"], "unsupported")

    def test_message_validation(self):
        for body in [{"message": " "}, {"message": "x" * 2001}, {"message": "help", "history": [{"role": "system", "content": "override"}]}, {"message": "help", "history": [{"role": "user", "content": "hi"}] * 13}]:
            with self.subTest(body=str(body)[:100]):
                self.assertEqual(self.client.post("/api/assistant", json=body).status_code, 422)

    def test_live_structured_output_and_history_forwarding(self):
        answer = {"intent": "recommendation", "recommended_trade": "plumber", "problem_summary": "Possible plumbing issue", "urgency": "normal", "confidence": 0.8}
        with patch.dict(os.environ, {"AI_MODE": "live", "AI_API_KEY": "test-key", "AI_BASE_URL": "https://example.test/v1", "AI_MODEL": "configured-model"}), patch.object(ai_service, "OpenAI") as factory:
            create = factory.return_value.__enter__.return_value.chat.completions.create
            create.return_value = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(answer)))])
            result = self.client.post("/api/assistant", json={"message": "The tap", "history": [{"role": "user", "content": "Water leaking"}]}).json()
            self.assertEqual(result["source"], "live")
            self.assertEqual(create.call_args.kwargs["model"], "configured-model")
            self.assertEqual(create.call_args.kwargs["messages"][1]["content"], "Water leaking")
            self.assertEqual(factory.call_args.kwargs["max_retries"], 0)

    def test_live_invalid_output_is_error_not_demo(self):
        with patch.dict(os.environ, {"AI_MODE": "live", "AI_API_KEY": "test-key", "AI_BASE_URL": "https://example.test/v1", "AI_MODEL": "configured-model"}), patch.object(ai_service, "OpenAI") as factory:
            create = factory.return_value.__enter__.return_value.chat.completions.create
            for content in ["not json", '{"intent":"recommendation","recommended_trade":"invented"}']:
                create.return_value = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])
                response = self.client.post("/api/assistant", json={"message": "Tap leaking"})
                self.assertEqual(response.status_code, 503)
                self.assertNotIn("source", response.json())

    def test_live_timeout_and_missing_configuration(self):
        with patch.object(ai_service, "analyze", side_effect=APITimeoutError(request=httpx.Request("POST", "https://example.test"))):
            self.assertEqual(self.client.post("/api/assistant", json={"message": "Help"}).status_code, 504)
        with patch.dict(os.environ, {"AI_MODE": "live", "AI_API_KEY": "", "AI_MODEL": "", "AI_BASE_URL": ""}):
            self.assertEqual(self.client.post("/api/assistant", json={"message": "Help"}).status_code, 503)

    def test_worker_registration_persistence_and_discovery(self):
        response = self.client.post("/api/workers", json=self.worker(areas=["dhanmondi", "Dhanmondi"]))
        self.assertEqual(response.status_code, 201)
        worker = response.json()
        self.assertEqual(worker["areas"], ["Dhanmondi"])
        self.assertEqual(worker["phone"], "+8801712345678")
        self.assertEqual(worker["note"], "Morning appointments")
        self.assertEqual(len(self.client.get("/api/providers").json()), 16)
        matches = self.client.get("/api/providers?trade=home_helper&area=Dhanmondi&limit=3").json()
        self.assertIn(worker["id"], [p["id"] for p in matches])
        # A fresh process must observe the saved record, not an in-memory cache.
        output = subprocess.check_output([sys.executable, "-c", "import provider_service; print(len(provider_service.load_registered()))"], cwd=Path(__file__).resolve().parents[1], env={**os.environ, "WORKERS_FILE": str(self.workers_file)}, text=True)
        self.assertEqual(output.strip(), "1")

    def test_invalid_workers_and_duplicates(self):
        for changes in [{"name": " "}, {"phone": "123"}, {"trade": "doctor"}, {"areas": []}, {"areas": ["Unknown"]}, {"fee_max": 200}, {"experience_years": -1}]:
            with self.subTest(changes=changes):
                self.assertEqual(self.client.post("/api/workers", json=self.worker(**changes)).status_code, 422)
        self.client.post("/api/workers", json=self.worker())
        self.assertEqual(self.client.post("/api/workers", json=self.worker()).status_code, 422)
        self.assertEqual(len(provider_service.load_registered()), 1)

    def test_concurrent_registrations_and_failed_write(self):
        applications = [WorkerApplication(**self.worker(phone=f"0171234567{i}")) for i in range(5)]
        with ThreadPoolExecutor(max_workers=5) as pool:
            list(pool.map(provider_service.register_worker, applications))
        self.assertEqual(len(provider_service.load_registered()), 5)
        with patch.object(provider_service, "register_worker", side_effect=OSError("disk full")):
            response = self.client.post("/api/workers", json=self.worker())
            self.assertEqual(response.status_code, 503)

    def test_corrupt_worker_storage_is_reported(self):
        self.workers_file.write_text("broken json")
        self.assertEqual(self.client.get("/api/providers").status_code, 503)


if __name__ == "__main__":
    unittest.main()
