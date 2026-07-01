"""Unit tests for Block 2 — spaCy preprocessing."""
from __future__ import annotations

from utils.preprocess import clean_text, content_tokens, filter_stopwords


class TestCleanText:
    def test_collapses_whitespace(self):
        assert clean_text("a   b\n\t c") == "a b c"

    def test_strips_null_bytes(self):
        assert "\x00" not in clean_text("a\x00b")

    def test_empty(self):
        assert clean_text("") == ""
        assert clean_text(None) == ""  # type: ignore[arg-type]


class TestStopwords:
    def test_removes_common_stopwords(self):
        out = filter_stopwords("the model is based on the attention mechanism").lower()
        assert "the" not in out.split()
        assert "attention" in out
        assert "mechanism" in out

    def test_content_tokens_lowercased_and_filtered(self):
        toks = content_tokens("The Transformer uses Attention, 123 times!")
        assert "transformer" in toks
        assert "attention" in toks
        assert "123" not in toks
        assert "the" not in toks
