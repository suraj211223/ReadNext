"""Character Error Rate (CER) for extraction quality (instructions.md §9).

    CER = (S + D + I) / N

where S, D, I are substitutions, deletions and insertions (Levenshtein edit
operations) between the predicted text and the reference, and N is the number of
characters in the reference. Target: CER < 5% on clean captures.
"""
from __future__ import annotations

from typing import List


def levenshtein(a: str, b: str) -> int:
    """Edit distance between two strings (S + D + I count)."""
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)

    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        cur = [i]
        for j, cb in enumerate(b, start=1):
            cost = 0 if ca == cb else 1
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost))
        prev = cur
    return prev[-1]


def _normalize(s: str) -> str:
    """Collapse whitespace so layout differences don't dominate the score."""
    return " ".join(s.split())


def cer(prediction: str, reference: str, normalize: bool = True) -> float:
    """Character Error Rate for a single (prediction, reference) pair."""
    if normalize:
        prediction = _normalize(prediction)
        reference = _normalize(reference)
    if not reference:
        return 0.0 if not prediction else 1.0
    return levenshtein(prediction, reference) / len(reference)


def corpus_cer(pairs: List[dict]) -> float:
    """Aggregate CER over many pairs: total edits / total reference chars.

    Each pair is ``{"prediction": str, "reference": str}``.
    """
    total_edits = 0
    total_chars = 0
    for p in pairs:
        pred = _normalize(p["prediction"])
        ref = _normalize(p["reference"])
        total_edits += levenshtein(pred, ref)
        total_chars += len(ref)
    if total_chars == 0:
        return 0.0
    return total_edits / total_chars
