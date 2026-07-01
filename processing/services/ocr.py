"""Image / screenshot OCR.

Primary engine (per instructions.md §3): **EasyOCR** — deep-learning OCR robust to
varied fonts. EasyOCR has heavy native dependencies and may be unavailable on some
Python versions, so this module falls back to **pytesseract** (Tesseract 5.x),
which is already provisioned in the dev environment. Either path converges on the
same unified raw-text string the NLP core consumes.
"""
from __future__ import annotations

import io
import logging
from functools import lru_cache
from typing import Tuple

logger = logging.getLogger(__name__)


@lru_cache
def _easyocr_reader():
    """Lazily build (and cache) an EasyOCR reader, or return ``None``."""
    try:
        import easyocr  # type: ignore

        return easyocr.Reader(["en"], gpu=False)
    except Exception as exc:  # noqa: BLE001 - any import/runtime failure → fallback
        logger.info("EasyOCR unavailable (%s); using Tesseract fallback", exc)
        return None


def _ocr_easyocr(data: bytes) -> str:
    reader = _easyocr_reader()
    if reader is None:
        raise RuntimeError("EasyOCR not available")
    # detail=0 returns plain strings in reading order.
    lines = reader.readtext(data, detail=0, paragraph=True)
    return "\n".join(lines)


def _ocr_tesseract(data: bytes) -> str:
    import pytesseract
    from PIL import Image

    from config import get_settings

    settings = get_settings()
    if settings.tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

    image = Image.open(io.BytesIO(data))
    # Normalise mode so Tesseract handles PNG transparency / palettes cleanly.
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    return pytesseract.image_to_string(image)


def extract_image_text(data: bytes) -> Tuple[str, str]:
    """Return ``(text, method)`` for an image byte stream.

    Tries EasyOCR first; falls back to Tesseract. Raises :class:`ValueError`
    when neither engine recovers any text.
    """
    if not data:
        raise ValueError("Empty image payload")

    text = ""
    method = "easyocr"
    try:
        text = _ocr_easyocr(data)
    except Exception as exc:  # noqa: BLE001 - EasyOCR missing or failed
        logger.info("EasyOCR path failed (%s); trying Tesseract", exc)
        text = ""

    if not text.strip():
        try:
            text = _ocr_tesseract(data)
            method = "tesseract"
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"OCR failed: {exc}") from exc

    if not text.strip():
        raise ValueError("OCR produced no readable text")

    return text, method
