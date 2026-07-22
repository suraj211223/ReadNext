"""Keyphrase distillation.

Primary: **KeyBERT** with the ``all-MiniLM-L6-v2`` sentence-transformer, cosine
ranked, n-grams 1–3 (instructions.md §3/§8).

Fallback: **RAKE** (rake-nltk) — a fast statistical extractor used when the text is
long / low-signal, or when KeyBERT is unavailable (e.g. the embedding model can't
be loaded offline). Either way we return 5–7 deduplicated keyphrases.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import List, Tuple

from config import get_settings
from utils.preprocess import clean_text, content_tokens, is_content_phrase

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Model loading (cached)
# --------------------------------------------------------------------------- #
@lru_cache
def _keybert_model():
    """Build and cache a KeyBERT model, or return ``None`` if unavailable."""
    try:
        from keybert import KeyBERT
        from sentence_transformers import SentenceTransformer

        st = SentenceTransformer(get_settings().keybert_model)
        return KeyBERT(model=st)
    except Exception as exc:  # noqa: BLE001 - missing model / no network → fallback
        logger.warning("KeyBERT unavailable (%s); RAKE will be used", exc)
        return None


@lru_cache
def _ensure_nltk():
    """Ensure NLTK's stopword + punkt data for RAKE; ignore download failures."""
    try:
        import nltk

        for pkg, path in (
            ("stopwords", "corpora/stopwords"),
            ("punkt", "tokenizers/punkt"),
            ("punkt_tab", "tokenizers/punkt_tab"),
        ):
            try:
                nltk.data.find(path)
            except LookupError:
                nltk.download(pkg, quiet=True)
    except Exception as exc:  # noqa: BLE001
        logger.info("NLTK data setup skipped (%s)", exc)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _dedupe(phrases: List[str]) -> List[str]:
    """Case-insensitive de-duplication that also drops phrases subsumed by an
    already-kept phrase (e.g. drop "attention" if "attention mechanism" is kept)."""
    kept: List[str] = []
    seen: set[str] = set()
    for p in phrases:
        norm = " ".join(p.lower().split())
        if not norm or norm in seen:
            continue
        if any(norm in k or k in norm for k in seen):
            # keep the longer, more specific phrase
            if any(norm in k for k in seen):
                continue
        seen.add(norm)
        kept.append(p.strip())
    return kept


def _clamp(phrases: List[str], lo: int, hi: int) -> List[str]:
    return phrases[:hi] if len(phrases) >= lo else phrases


def _normalize(phrases: List[str]) -> List[str]:
    """Lower-case and collapse internal whitespace so downstream queries and the
    UI never show ALL-CAPS/ragged phrases (e.g. from uppercase PDF regions)."""
    out: List[str] = []
    for p in phrases:
        norm = " ".join(str(p).lower().split())
        if norm:
            out.append(norm)
    return out


# --------------------------------------------------------------------------- #
# Extractors
# --------------------------------------------------------------------------- #
def keybert_keyphrases(text: str, top_n: int) -> List[str]:
    model = _keybert_model()
    if model is None:
        raise RuntimeError("KeyBERT model not available")

    s = get_settings()
    pairs = model.extract_keywords(
        text,
        keyphrase_ngram_range=(s.ngram_min, s.ngram_max),
        stop_words="english",
        use_mmr=True,           # maximal-marginal-relevance → diverse phrases
        diversity=0.6,
        top_n=top_n,
    )
    return [kw for kw, _score in pairs]


def rake_keyphrases(text: str, top_n: int) -> List[str]:
    _ensure_nltk()
    from rake_nltk import Rake

    rake = Rake(max_length=get_settings().ngram_max)
    rake.extract_keywords_from_text(text)
    ranked = rake.get_ranked_phrases()
    if ranked:
        return ranked[:top_n]

    # Degenerate fallback: most frequent content tokens.
    from collections import Counter

    counts = Counter(content_tokens(text))
    return [w for w, _ in counts.most_common(top_n)]


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #
def extract_keyphrases(text: str) -> Tuple[List[str], str]:
    """Return ``(keyphrases, extractor)`` with 5–7 phrases.

    Chooses RAKE for long/low-signal text or when KeyBERT is unavailable;
    otherwise uses KeyBERT. Always falls back to RAKE on KeyBERT errors.
    """
    s = get_settings()
    cleaned = clean_text(text)
    if not cleaned:
        return [], "rake"

    long_text = len(cleaned) > s.rake_char_threshold
    extractor = "keybert"
    # Over-fetch: the content-phrase filter below discards junk candidates, so we
    # need a deeper pool to still land 5–7 good phrases.
    pool_n = s.max_keywords * 3
    phrases: List[str] = []

    if not long_text and _keybert_model() is not None:
        try:
            phrases = keybert_keyphrases(cleaned, top_n=pool_n)
        except Exception as exc:  # noqa: BLE001
            logger.warning("KeyBERT extraction failed (%s); using RAKE", exc)
            phrases = []

    if not phrases:
        extractor = "rake"
        phrases = rake_keyphrases(cleaned, top_n=pool_n)

    phrases = _normalize(phrases)
    # Prefer noun-phrase-like candidates; keep the rejects as backfill so we
    # never starve below min_keywords when the filter is aggressive.
    kept = [p for p in phrases if is_content_phrase(p)]
    ordered = kept + [p for p in phrases if p not in kept]

    ordered = _dedupe(ordered)
    ordered = _clamp(ordered, s.min_keywords, s.max_keywords)
    return ordered, extractor
