"""Shared pytest fixtures for the processing node test-suite.

Running ``pytest`` from the ``processing/`` directory puts it on ``sys.path`` so
that ``config``, ``services`` and ``models`` import as top-level modules — matching
how ``uvicorn main:app`` runs in production.
"""
from __future__ import annotations

import io
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

SAMPLE_TEXT = (
    "The dominant sequence transduction models are based on complex recurrent or "
    "convolutional neural networks. We propose the Transformer, a model "
    "architecture relying entirely on an attention mechanism. The Transformer "
    "attention mechanism and BERT language model have advanced natural language "
    "processing through semantic similarity embeddings and fine-tuning of "
    "pre-trained models."
)


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    """A born-digital PDF carrying :data:`SAMPLE_TEXT` in its text layer."""
    import fitz

    doc = fitz.open()
    page = doc.new_page()
    # insert_textbox wraps within the rect so the full SAMPLE_TEXT is captured
    # (plain insert_text would run a single line off the page edge).
    rect = fitz.Rect(72, 72, page.rect.width - 72, page.rect.height - 72)
    page.insert_textbox(rect, SAMPLE_TEXT, fontsize=11)
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def sample_image_bytes() -> bytes:
    """A PNG screenshot rendering a short, OCR-friendly line of text."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", (1100, 200), color="white")
    draw = ImageDraw.Draw(img)
    text = "Transformer attention mechanism for language models"

    # A larger TrueType font OCRs far more reliably than the tiny default bitmap
    # font; probe a few common system paths and degrade gracefully.
    font = None
    for path in (
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        try:
            font = ImageFont.truetype(path, 44)
            break
        except OSError:
            continue
    draw.text((30, 70), text, fill="black", font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
