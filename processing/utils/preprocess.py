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
# Words split across a line break by PDF layout: "struc-\ntures" -> "structures".
_DEHYPHEN_RE = re.compile(r"(?<=\w)-\s*\n\s*(?=\w)")

# Parts of speech a good, searchable keyphrase is built from.
_LEADING_NONCONTENT_POS = {"VERB", "ADV", "ADP", "AUX", "PART", "CCONJ", "SCONJ"}


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
    """Collapse whitespace and strip control noise from raw extracted text.

    Also rejoins words hyphenated across a line break ("struc-\\ntures" ->
    "structures"); PDF extractors emit these verbatim and they otherwise leak
    into keyphrases as fragments like "tures" or "tal".
    """
    if not text:
        return ""
    text = text.replace("\x00", " ")
    text = _DEHYPHEN_RE.sub("", text)
    return _WHITESPACE_RE.sub(" ", text).strip()


def is_content_phrase(phrase: str) -> bool:
    """Heuristic: keep noun-phrase-like candidates, drop verb/adverb-led filler.

    Statistical extractors (RAKE) happily surface phrases like "take great care"
    or "positively influence immediate" — grammatical but useless as search
    terms. We keep a phrase only when it is anchored by a noun, does not lead
    with a verb/adverb/preposition, and contains no finite verb. POS tagging is
    done on a lower-cased copy so ALL-CAPS source text doesn't skew the tags.

    If the POS model is unavailable (blank spaCy pipeline), we can't judge and
    keep the phrase rather than guess.
    """
    phrase = (phrase or "").strip()
    if not phrase:
        return False
    tagged = [t for t in _nlp()(phrase.lower()) if t.is_alpha]
    if not tagged or not any(t.pos_ for t in tagged):
        return True  # no POS info (blank model) -> don't second-guess
    if any(t.pos_ == "VERB" for t in tagged):
        return False
    if tagged[0].pos_ in _LEADING_NONCONTENT_POS:
        return False
    return any(t.pos_ in {"NOUN", "PROPN"} for t in tagged)


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
