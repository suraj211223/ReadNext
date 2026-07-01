"""Unit tests for Block 1 — ingestion (PDF parse, OCR, MIME router)."""
from __future__ import annotations

import pytest

from services import ingestion
from services.ingestion import UnsupportedFileType, resolve_kind
from services.pdf_parser import extract_pdf_text


class TestMimeRouter:
    def test_pdf_by_content_type(self):
        assert resolve_kind("application/pdf", None, b"") == "pdf"

    def test_image_by_content_type(self):
        assert resolve_kind("image/png", None, b"") == "image"

    def test_content_type_with_charset_suffix(self):
        assert resolve_kind("application/pdf; charset=binary", None, b"") == "pdf"

    def test_pdf_by_extension(self):
        assert resolve_kind(None, "paper.PDF", b"") == "pdf"

    def test_image_by_extension(self):
        assert resolve_kind("application/octet-stream", "shot.jpeg", b"") == "image"

    def test_pdf_by_magic_bytes(self):
        assert resolve_kind(None, None, b"%PDF-1.7\n...") == "pdf"

    def test_unsupported_raises(self):
        with pytest.raises(UnsupportedFileType):
            resolve_kind("text/plain", "notes.txt", b"hello")


class TestPdfExtraction:
    def test_extracts_text_layer(self, sample_pdf_bytes):
        text, method = extract_pdf_text(sample_pdf_bytes)
        assert "Transformer" in text
        assert method in ("pymupdf", "pdfplumber")
        assert len(text.strip()) > 0

    def test_empty_payload_raises(self):
        with pytest.raises(ValueError):
            extract_pdf_text(b"")

    def test_garbage_payload_raises(self):
        with pytest.raises(ValueError):
            extract_pdf_text(b"not a real pdf at all")


class TestImageExtraction:
    def test_ocr_reads_image(self, sample_image_bytes):
        text, method = ingestion.extract_text(
            sample_image_bytes, content_type="image/png", filename="shot.png"
        )
        assert method in ("easyocr", "tesseract")
        # OCR is fuzzy; assert it recovered a recognisable token.
        assert any(tok in text.lower() for tok in ("transformer", "attention", "language"))


class TestUnifiedRouter:
    def test_pdf_round_trip(self, sample_pdf_bytes):
        text, method = ingestion.extract_text(
            sample_pdf_bytes, content_type="application/pdf", filename="x.pdf"
        )
        assert "Transformer" in text
        assert method in ("pymupdf", "pdfplumber")
