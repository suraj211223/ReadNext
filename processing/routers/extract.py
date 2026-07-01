"""POST /extract router — the processing node's only public-to-gateway endpoint.

Accepts a multipart file, routes by MIME type to the right extractor, distills
keyphrases, and returns the unified :class:`ExtractResponse` (instructions.md §6.2).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from models.schemas import ExtractResponse
from services.ingestion import UnsupportedFileType, extract_text
from services.keywords import extract_keyphrases

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/extract", response_model=ExtractResponse)
async def extract(file: UploadFile = File(...)) -> ExtractResponse:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file upload")

    try:
        text, method = extract_text(
            data, content_type=file.content_type, filename=file.filename
        )
    except UnsupportedFileType as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except ValueError as exc:
        # No readable text recovered from a supported file type.
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected extraction failure")
        raise HTTPException(status_code=500, detail="Extraction failed") from exc

    keyphrases, extractor = extract_keyphrases(text)

    return ExtractResponse(
        text=text,
        keyphrases=keyphrases,
        method=method,
        extractor=extractor,
        raw_text_length=len(text),
    )
