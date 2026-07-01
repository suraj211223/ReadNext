"""Recommendation-relevance metrics (instructions.md §9).

- **Precision@K** — fraction of the top-K results judged relevant. Target P@5 ≥ 0.80.
- **NDCG@K** — Normalised Discounted Cumulative Gain; rewards relevant hits ranked
  nearer the top. Target NDCG ≥ 0.75.

Relevance labels are graded integers (0 = irrelevant, higher = more relevant);
binary labels (0/1) are a valid special case.
"""
from __future__ import annotations

import math
from typing import List


def precision_at_k(relevances: List[float], k: int = 5) -> float:
    """Fraction of the top-K items with a positive relevance label."""
    if k <= 0:
        return 0.0
    topk = relevances[:k]
    if not topk:
        return 0.0
    hits = sum(1 for r in topk if r > 0)
    return hits / k


def dcg_at_k(relevances: List[float], k: int) -> float:
    dcg = 0.0
    for i, rel in enumerate(relevances[:k]):
        # rank position is i+1; discount by log2(rank+1)
        dcg += (2**rel - 1) / math.log2(i + 2)
    return dcg


def ndcg_at_k(relevances: List[float], k: int = 5) -> float:
    """NDCG@K = DCG@K / ideal-DCG@K. Returns 0.0 when there are no positives."""
    ideal = sorted(relevances, reverse=True)
    idcg = dcg_at_k(ideal, k)
    if idcg == 0:
        return 0.0
    return dcg_at_k(relevances, k) / idcg


def mean_precision_at_k(queries: List[List[float]], k: int = 5) -> float:
    if not queries:
        return 0.0
    return sum(precision_at_k(q, k) for q in queries) / len(queries)


def mean_ndcg_at_k(queries: List[List[float]], k: int = 5) -> float:
    if not queries:
        return 0.0
    return sum(ndcg_at_k(q, k) for q in queries) / len(queries)
