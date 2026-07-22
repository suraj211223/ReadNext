"""Unit tests for Block 2 — spaCy preprocessing."""
from __future__ import annotations

from utils.preprocess import (
    clean_text,
    content_tokens,
    filter_stopwords,
    is_content_phrase,
)


class TestCleanText:
    def test_collapses_whitespace(self):
        assert clean_text("a   b\n\t c") == "a b c"

    def test_strips_null_bytes(self):
        assert "\x00" not in clean_text("a\x00b")

    def test_empty(self):
        assert clean_text("") == ""
        assert clean_text(None) == ""  # type: ignore[arg-type]

    def test_rejoins_line_broken_hyphenation(self):
        # "struc-\ntures" and "sep-\ntal" must not leak fragments like "tures".
        assert clean_text("micro struc-\ntures") == "micro structures"
        assert clean_text("the sep-\n  tal array") == "the septal array"

    def test_keeps_intraline_hyphens(self):
        # A genuine compound (no line break) stays hyphenated.
        assert clean_text("state-of-the-art model") == "state-of-the-art model"


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


class TestContentPhrase:
    def test_keeps_noun_phrases(self):
        assert is_content_phrase("reticular collagen network")
        assert is_content_phrase("various interventional therapies")

    def test_rejects_verb_led_filler(self):
        # These are exactly the junk RAKE surfaced from a noisy medical PDF.
        assert not is_content_phrase("take great care")
        assert not is_content_phrase("positively influence immediate")

    def test_rejects_empty(self):
        assert not is_content_phrase("")
