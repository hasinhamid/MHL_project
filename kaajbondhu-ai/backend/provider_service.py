import json
import os
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from threading import Lock
from uuid import uuid4

from schemas import Provider, Trade, WorkerApplication

ROOT = Path(__file__).resolve().parent
AREAS: dict[str, list[str]] = json.loads((ROOT / "areas.json").read_text())
WORKERS_FILE = Path(os.getenv("WORKERS_FILE", str(ROOT / "registered_workers.json")))
WRITE_LOCK = Lock()


def canonical_area(area: str) -> str:
    return next((name for name in AREAS if name.casefold() == area.strip().casefold()), area.strip())


def load_registered() -> list[Provider]:
    if not WORKERS_FILE.exists():
        return []
    return [Provider.model_validate(item) for item in json.loads(WORKERS_FILE.read_text())]


def load_providers() -> list[Provider]:
    seeds = [Provider.model_validate(item) for item in json.loads((ROOT / "providers.json").read_text())]
    return seeds + load_registered()


def find_providers(trade: Trade | None = None, area: str = "", available: bool | None = None, limit: int | None = None) -> list[Provider]:
    area = canonical_area(area)
    matches = []
    for provider in load_providers():
        if trade is not None and provider.trade != trade:
            continue
        if available is not None and provider.available != available:
            continue
        if not area:
            provider.coverage = "unspecified"
            provider.match_reason = "Choose a neighborhood to see local matches"
        elif area in provider.areas:
            provider.coverage = "local"
            provider.match_reason = f"Serves {area}"
        elif any(neighbor in provider.areas for neighbor in AREAS.get(area, [])):
            provider.coverage = "adjacent"
            provider.match_reason = f"Serves an area next to {area}; confirm travel with the worker"
        else:
            provider.coverage = "other"
            provider.match_reason = "Outside your selected area — confirm service coverage"
        matches.append(provider)
    priority = {"local": 0, "adjacent": 1, "other": 2, "unspecified": 0}
    matches.sort(key=lambda p: (priority[p.coverage], not p.available, -p.experience_years, p.id))
    return matches[:limit] if limit is not None else matches


def register_worker(application: WorkerApplication) -> Provider:
    areas = list(dict.fromkeys(canonical_area(area) for area in application.areas))
    if any(area not in AREAS for area in areas):
        raise ValueError("Choose service areas from the supported neighborhoods")
    provider = Provider(
        **application.model_dump(exclude={"areas"}),
        areas=areas, id=f"w-{uuid4().hex}", available=True, source="registered",
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    with WRITE_LOCK:
        workers = load_registered()
        if any(p.phone == provider.phone and p.trade == provider.trade for p in workers):
            raise ValueError("This phone number is already registered for that trade")
        workers.append(provider)
        WORKERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        temporary = None
        try:
            with NamedTemporaryFile(mode="w", encoding="utf-8", dir=WORKERS_FILE.parent, delete=False) as file:
                temporary = Path(file.name)
                json.dump([p.model_dump(mode="json") for p in workers], file, indent=2, ensure_ascii=False)
                file.flush()
                os.fsync(file.fileno())
            temporary.replace(WORKERS_FILE)
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
    return provider
