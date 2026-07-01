"""FastAPI application entry point for the NLP processing node.

Internal-only service (instructions.md §2): performs OCR / PDF parsing and
keyphrase distillation. Run with:

    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""
from __future__ import annotations

import logging

from fastapi import FastAPI

from config import get_settings
from routers.extract import router as extract_router

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="Smart Reading Companion — Processing Node",
    description="OCR, PDF parsing, and keyphrase distillation (internal service).",
    version="1.0.0",
)

app.include_router(extract_router, tags=["extract"])


@app.get("/health", tags=["meta"])
def health() -> dict:
    """Liveness probe used by the gateway and orchestration."""
    return {
        "status": "ok",
        "keybert_model": settings.keybert_model,
        "spacy_model": settings.spacy_model,
    }
