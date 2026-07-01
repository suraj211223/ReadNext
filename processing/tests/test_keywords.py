"""Unit tests for Block 2 — keyphrase distillation (KeyBERT + RAKE)."""
from __future__ import annotations

import pytest

from conftest import SAMPLE_TEXT
from services import keywords
from services.keywords import _clamp, _dedupe, extract_keyphrases, rake_keyphrases


class TestHelpers:
    def test_dedupe_case_insensitive(self):
        assert _dedupe(["Attention", "attention", "BERT"]) == ["Attention", "BERT"]

    def test_dedupe_drops_subsumed_shorter(self):
        out = _dedupe(["attention mechanism", "attention"])
        assert out == ["attention mechanism"]

    def test_clamp_caps_at_high(self):
        assert _clamp(list("abcdefghij"), 5, 7) == list("abcdefg")

    def test_clamp_keeps_when_below_low(self):
        assert _clamp(["a", "b"], 5, 7) == ["a", "b"]


class TestRake:
    def test_rake_returns_phrases(self):
        phrases = rake_keyphrases(SAMPLE_TEXT, top_n=7)
        assert len(phrases) > 0
        assert all(isinstance(p, str) for p in phrases)


class TestExtractKeyphrases:
    def test_count_within_5_to_7(self):
        phrases, extractor = extract_keyphrases(SAMPLE_TEXT)
        assert 5 <= len(phrases) <= 7, phrases
        assert extractor in ("keybert", "rake")

    def test_phrases_are_relevant(self):
        phrases, _ = extract_keyphrases(SAMPLE_TEXT)
        blob = " ".join(phrases).lower()
        # The Transformer abstract should surface these concepts (Phase 2 accept).
        assert any(t in blob for t in ("transformer", "attention", "language", "bert"))

    def test_empty_text(self):
        phrases, extractor = extract_keyphrases("")
        assert phrases == []

    def test_long_text_uses_rake(self, monkeypatch):
        # Force the long-text branch with a small threshold; expect RAKE.
        from config import get_settings

        monkeypatch.setenv("RAKE_CHAR_THRESHOLD", "10")
        get_settings.cache_clear()
        try:
            phrases, extractor = extract_keyphrases(SAMPLE_TEXT)
            assert extractor == "rake"
            assert 5 <= len(phrases) <= 7
        finally:
            # Always reset so the patched threshold can't leak into other tests.
            get_settings.cache_clear()
