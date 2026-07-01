"""spaCy-based text preprocessing for keyphrase extraction.

Provides stop-word filtering and light normalisation. The spaCy model is loaded
lazily and cached so importing this module stays cheap (instructions.md §3/§8).
"""
from __future__ import annotations

import logging
import re
from functools import lru_cache

logger = logging.getLogger(__name__)

_WHITESPACE_RE = re.compile(r"\s+")


@lru_cache
def _nlp():
    """Load (and cache) the spaCy pipeline; fall back to a blank English model.

    The full ``en_core_web_sm`` model gives proper stop-word lists and lemmas.
    If it is not installed we degrade to spaCy's blank English tokenizer, which
    still tokenises and carries a default stop-word set.
    """
    import spacy

    from config import get_settings

    name = get_settings().spacy_model
    try:
        return spacy.load(name, disable=["ner", "parser"])
    except OSError:
        logger.warning("spaCy model %s missing; using blank 'en' tokenizer", name)
        return spacy.blank("en")


def clean_text(text: str) -> str:
    """Collapse whitespace and strip control noise from raw extracted text."""
    if not text:
        return ""
    text = text.replace("\x00", " ")
    return _WHITESPACE_RE.sub(" ", text).strip()


def filter_stopwords(text: str) -> str:
    """Return ``text`` with stop-words, punctuation and pure digits removed.

    Used to feed cleaner candidate material to RAKE / KeyBERT.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return ""
    doc = _nlp()(cleaned)
    tokens = [
        tok.text
        for tok in doc
        if not tok.is_stop and not tok.is_punct and not tok.is_space and not tok.like_num
    ]
    return " ".join(tokens)


def content_tokens(text: str) -> list[str]:
    """Lower-cased alphabetic content tokens (stop-words removed)."""
    cleaned = clean_text(text)
    if not cleaned:
        return []
    doc = _nlp()(cleaned)
    return [
        tok.text.lower()
        for tok in doc
        if tok.is_alpha and not tok.is_stop and len(tok.text) > 2
    ]
