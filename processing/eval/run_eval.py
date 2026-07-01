"""Reproducible evaluation runner (instructions.md §9).

Computes:
  * Corpus CER over the extraction fixtures           (target < 5%)
  * Mean Precision@5 over the relevance fixtures       (target >= 0.80)
  * Mean NDCG@5 over the relevance fixtures            (target >= 0.75)

Usage:
    python -m eval.run_eval
    python eval/run_eval.py --fixtures eval/fixtures
"""
from __future__ import annotations

import argparse
import json
import os
import sys

# Allow running both as a module (-m eval.run_eval) and as a script.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from eval.cer import corpus_cer  # noqa: E402
from eval.ranking import mean_ndcg_at_k, mean_precision_at_k  # noqa: E402

CER_TARGET = 0.05
P_AT_5_TARGET = 0.80
NDCG_TARGET = 0.75


def _load(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def run(fixtures_dir: str) -> dict:
    extraction = _load(os.path.join(fixtures_dir, "extraction.json"))
    relevance = _load(os.path.join(fixtures_dir, "relevance.json"))

    cer_value = corpus_cer(extraction["pairs"])
    query_rels = [q["relevances"] for q in relevance["queries"]]
    p_at_5 = mean_precision_at_k(query_rels, k=5)
    ndcg = mean_ndcg_at_k(query_rels, k=5)

    return {
        "cer": cer_value,
        "precision_at_5": p_at_5,
        "ndcg_at_5": ndcg,
        "n_extraction_pairs": len(extraction["pairs"]),
        "n_queries": len(query_rels),
    }


def _status(value: float, target: float, lower_is_better: bool) -> str:
    ok = value <= target if lower_is_better else value >= target
    return "PASS" if ok else "FAIL"


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate extraction + ranking quality")
    parser.add_argument(
        "--fixtures",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures"),
        help="Path to the fixtures directory",
    )
    args = parser.parse_args()

    m = run(args.fixtures)

    print("=" * 56)
    print("  Smart Reading Companion — Evaluation Report")
    print("=" * 56)
    print(f"  Extraction pairs : {m['n_extraction_pairs']}")
    print(f"  Ranking queries  : {m['n_queries']}")
    print("-" * 56)
    print(
        f"  CER             : {m['cer']:.4f}  (target < {CER_TARGET:.2f})  "
        f"[{_status(m['cer'], CER_TARGET, True)}]"
    )
    print(
        f"  Precision@5     : {m['precision_at_5']:.4f}  (target >= {P_AT_5_TARGET:.2f})  "
        f"[{_status(m['precision_at_5'], P_AT_5_TARGET, False)}]"
    )
    print(
        f"  NDCG@5          : {m['ndcg_at_5']:.4f}  (target >= {NDCG_TARGET:.2f})  "
        f"[{_status(m['ndcg_at_5'], NDCG_TARGET, False)}]"
    )
    print("=" * 56)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
