"""Unit tests for Block 5 — evaluation metrics (CER, P@K, NDCG)."""
from __future__ import annotations

import os

from eval.cer import cer, corpus_cer, levenshtein
from eval.ranking import (
    dcg_at_k,
    mean_ndcg_at_k,
    mean_precision_at_k,
    ndcg_at_k,
    precision_at_k,
)
from eval.run_eval import run


class TestCER:
    def test_identical_is_zero(self):
        assert cer("hello world", "hello world") == 0.0

    def test_levenshtein_basic(self):
        assert levenshtein("kitten", "sitting") == 3

    def test_single_substitution(self):
        # one wrong char ("hallo") out of 5 reference chars ("hello")
        assert cer("hallo", "hello") == 1 / 5

    def test_empty_reference_empty_prediction(self):
        assert cer("", "") == 0.0

    def test_empty_reference_nonempty_prediction(self):
        assert cer("x", "") == 1.0

    def test_corpus_aggregates(self):
        pairs = [
            {"prediction": "hello", "reference": "hello"},
            {"prediction": "wxrld", "reference": "world"},
        ]
        # 1 edit over 10 reference chars
        assert corpus_cer(pairs) == 1 / 10


class TestPrecision:
    def test_all_relevant(self):
        assert precision_at_k([1, 1, 1, 1, 1], 5) == 1.0

    def test_partial(self):
        assert precision_at_k([1, 0, 1, 0, 0], 5) == 0.4

    def test_k_larger_than_list(self):
        assert precision_at_k([1, 1], 5) == 2 / 5


class TestNDCG:
    def test_perfect_ranking_is_one(self):
        assert ndcg_at_k([2, 1, 0], 3) == 1.0

    def test_reversed_is_less_than_one(self):
        assert ndcg_at_k([0, 1, 2], 3) < 1.0

    def test_all_zero_is_zero(self):
        assert ndcg_at_k([0, 0, 0], 3) == 0.0

    def test_dcg_monotonic_with_position(self):
        # a relevant item ranked first beats the same item ranked last
        assert dcg_at_k([1, 0, 0], 3) > dcg_at_k([0, 0, 1], 3)

    def test_means(self):
        qs = [[1, 1, 0, 0, 0], [1, 0, 0, 0, 0]]
        assert 0 < mean_precision_at_k(qs, 5) < 1
        assert 0 < mean_ndcg_at_k(qs, 5) <= 1


class TestRunner:
    def test_run_against_fixtures_meets_targets(self):
        fixtures = os.path.join(os.path.dirname(__file__), "..", "eval", "fixtures")
        m = run(os.path.abspath(fixtures))
        assert m["cer"] < 0.05
        assert m["precision_at_5"] >= 0.80
        assert m["ndcg_at_5"] >= 0.75
