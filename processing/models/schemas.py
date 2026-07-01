"""Pydantic models for the processing node's public contract.

The gateway calls ``POST /extract`` and receives an :class:`ExtractResponse`.
"""
from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field

ExtractionMethod = Literal["pymupdf", "pdfplumber", "easyocr", "tesseract"]
KeywordExtractor = Literal["keybert", "rake"]


class ExtractResponse(BaseModel):
    """Unified extraction + keyphrase result (instructions.md §6.2)."""

    text: str = Field(..., description="Unified raw text string from the document")
    keyphrases: List[str] = Field(
        default_factory=list, description="5–7 distilled keyphrases"
    )
    method: ExtractionMethod = Field(
        ..., description="Which extraction path produced the text"
    )
    extractor: KeywordExtractor = Field(
        ..., description="Which keyword engine produced the keyphrases"
    )
    raw_text_length: int = Field(0, description="Character count of the raw text")


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    code: str
    message: str
    details: str | None = None
