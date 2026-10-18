import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError, APITimeoutError

load_dotenv(Path(__file__).resolve().parent / ".env")

import ai_service
import provider_service
from schemas import AssistantRequest, AssistantResponse, Provider, Trade, WorkerApplication

logger = logging.getLogger(__name__)
app = FastAPI(title="KaajBondhu API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173").split(","),
    allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health():
    try:
        mode = ai_service.ai_mode()
    except ValueError as error:
        raise HTTPException(503, str(error)) from error
    return {"status": "ok", "ai_mode": mode}


@app.get("/api/areas", response_model=list[str])
def areas():
    return list(provider_service.AREAS)


@app.post("/api/assistant", response_model=AssistantResponse)
def assistant(payload: AssistantRequest):
    try:
        return ai_service.analyze(payload)
    except APITimeoutError as error:
        raise HTTPException(504, "The AI took too long. Please try again.") from error
    except (APIError, ValueError, IndexError, AttributeError) as error:
        logger.warning("Assistant failed: %s", type(error).__name__)
        raise HTTPException(503, "The AI service is unavailable or returned an invalid answer. Check the backend AI configuration or try again.") from error


@app.get("/api/providers", response_model=list[Provider])
def providers(trade: Trade | None = None, area: str = Query(default="", max_length=100), available: bool | None = None, limit: int | None = Query(default=None, ge=1, le=100)):
    try:
        return provider_service.find_providers(trade, area, available, limit)
    except (OSError, ValueError) as error:
        raise HTTPException(503, "Worker records could not be loaded. Please try again.") from error


@app.post("/api/workers", response_model=Provider, status_code=201)
def register_worker(payload: WorkerApplication):
    try:
        return provider_service.register_worker(payload)
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
    except OSError as error:
        raise HTTPException(503, "Your listing could not be saved. Please try again.") from error
