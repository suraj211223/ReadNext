"""MIME-based ingestion router.

Routes an uploaded file to the correct extraction path (instructions.md §5):
PDFs → PyMuPDF/pdfplumber, images → EasyOCR/Tesseract. Both paths converge on a
single unified raw-text string.
"""
from __future__ import annotations

from typing import Tuple

from services.ocr import extract_image_text
from services.pdf_parser import extract_pdf_text

PDF_TYPES = {"application/pdf", "application/x-pdf"}
IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/tiff",
    "image/bmp",
}

PDF_EXTENSIONS = (".pdf",)
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp")


class UnsupportedFileType(ValueError):
    """Raised when a file is neither a supported PDF nor image."""


def _looks_like_pdf(data: bytes) -> bool:
    return data[:5] == b"%PDF-"


def resolve_kind(content_type: str | None, filename: str | None, data: bytes) -> str:
    """Return ``"pdf"`` or ``"image"`` for the given upload.

    Resolution order: explicit MIME type → filename extension → magic bytes.
    """
    ct = (content_type or "").split(";")[0].strip().lower()
    if ct in PDF_TYPES:
        return "pdf"
    if ct in IMAGE_TYPES:
        return "image"

    name = (filename or "").lower()
    if name.endswith(PDF_EXTENSIONS):
        return "pdf"
    if name.endswith(IMAGE_EXTENSIONS):
        return "image"

    # Last resort: sniff magic bytes (PDF only — images vary too much to be safe).
    if _looks_like_pdf(data):
        return "pdf"

    raise UnsupportedFileType(
        f"Unsupported file type (content_type={content_type!r}, filename={filename!r})"
    )


def extract_text(
    data: bytes, content_type: str | None = None, filename: str | None = None
) -> Tuple[str, str]:
    """Extract unified raw text from an uploaded file.

    Returns ``(text, method)`` where ``method`` is one of
    ``pymupdf|pdfplumber|easyocr|tesseract``.
    """
    kind = resolve_kind(content_type, filename, data)
    if kind == "pdf":
        return extract_pdf_text(data)
    return extract_image_text(data)
