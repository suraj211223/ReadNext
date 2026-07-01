"""Engine-level integration tests for POST /extract (Block 2 wiring)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_extract_pdf(sample_pdf_bytes):
    resp = client.post(
        "/extract",
        files={"file": ("paper.pdf", sample_pdf_bytes, "application/pdf")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["method"] in ("pymupdf", "pdfplumber")
    assert body["extractor"] in ("keybert", "rake")
    assert 5 <= len(body["keyphrases"]) <= 7
    assert body["raw_text_length"] > 0
    assert "Transformer" in body["text"]


def test_extract_image(sample_image_bytes):
    resp = client.post(
        "/extract",
        files={"file": ("shot.png", sample_image_bytes, "image/png")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["method"] in ("easyocr", "tesseract")
    assert len(body["text"]) > 0


def test_extract_empty_file_rejected():
    resp = client.post("/extract", files={"file": ("empty.pdf", b"", "application/pdf")})
    assert resp.status_code == 400


def test_extract_unsupported_type_rejected():
    resp = client.post(
        "/extract", files={"file": ("notes.txt", b"hello world", "text/plain")}
    )
    assert resp.status_code == 415
