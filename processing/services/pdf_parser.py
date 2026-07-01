"""PDF text extraction.

Primary engine: **PyMuPDF** (``fitz``) — reads the embedded text layer in reading
order, deterministic and millisecond-scale (instructions.md §2/§3).

Fallback: **pdfplumber** — used when PyMuPDF is unavailable or yields no text
(e.g. an unusual encoding). This keeps ingestion robust across environments.
"""
from __future__ import annotations

import logging
from typing import Tuple

logger = logging.getLogger(__name__)


def _extract_pymupdf(data: bytes) -> str:
    import fitz  # PyMuPDF

    parts: list[str] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            parts.append(page.get_text("text"))
    return "\n".join(parts)


def _extract_pdfplumber(data: bytes) -> str:
    import io

    import pdfplumber

    parts: list[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            parts.append(page.extract_text() or "")
    return "\n".join(parts)


def extract_pdf_text(data: bytes) -> Tuple[str, str]:
    """Return ``(text, method)`` for a PDF byte stream.

    Tries PyMuPDF first; falls back to pdfplumber if PyMuPDF is missing or
    returns empty text. Raises :class:`ValueError` if no text can be recovered.
    """
    if not data:
        raise ValueError("Empty PDF payload")

    text = ""
    method = "pymupdf"
    try:
        text = _extract_pymupdf(data)
    except ImportError:
        logger.warning("PyMuPDF not available, falling back to pdfplumber")
        text = ""
    except Exception as exc:  # noqa: BLE001 - corrupt PDF, try fallback
        logger.warning("PyMuPDF failed (%s), falling back to pdfplumber", exc)
        text = ""

    if not text.strip():
        try:
            text = _extract_pdfplumber(data)
            method = "pdfplumber"
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"Could not parse PDF: {exc}") from exc

    if not text.strip():
        raise ValueError("PDF contained no extractable text layer")

    return text, method
