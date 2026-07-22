"""
Fetch specific paper details from the Semantic Scholar API.

Usage:
    python Fetch_Paper.py                       # interactive mode — prompts for input
    python Fetch_Paper.py "attention is all you need"   # search by title
    python Fetch_Paper.py 10.1038/s41586-021-03819-2    # lookup by DOI
    python Fetch_Paper.py 204e3073870fae3d05bcbc2f6a8e263d9b72e776  # lookup by S2 paper ID
"""

import os
import sys
import time
import threading

import requests

# Load the API key from the environment (.env) rather than hardcoding a secret.
# python-dotenv is optional — if it's installed we read the project .env files,
# otherwise we fall back to whatever is already exported in the environment.
try:
    from dotenv import load_dotenv

    _here = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(_here, ".env"))
    load_dotenv(os.path.join(_here, "backend", ".env"))
except ImportError:
    pass

API_KEY = os.environ.get("S2AG_API_KEY", "").strip()
BASE_URL = os.environ.get(
    "S2AG_BASE_URL", "https://api.semanticscholar.org/graph/v1"
).rstrip("/")
FIELDS = "title,abstract,authors,year"

# Result cap. Semantic Scholar is rate-limited, so we keep the number of papers
# returned per search small (instructions: "keep the limit to 5").
DEFAULT_LIMIT = 5

# Only send the key header when we actually have one; an empty/blank key would
# otherwise be rejected. Without a key we call S2AG unauthenticated (lower limit).
HEADERS = {"x-api-key": API_KEY} if API_KEY else {}

# ── Client-side rate limiting ─────────────────────────────────
# Semantic Scholar's shared pool allows roughly 1 request/second. We serialise
# our own calls behind a minimum interval so a burst of lookups can't hammer the
# API and trip a 429. On a 429 we honour Retry-After and retry once.
MIN_INTERVAL_SEC = 1.1
MAX_RETRIES = 1

_rate_lock = threading.Lock()
_last_call_ts = 0.0


def _throttle() -> None:
    """Block until at least MIN_INTERVAL_SEC has passed since the last request."""
    global _last_call_ts
    with _rate_lock:
        wait = MIN_INTERVAL_SEC - (time.monotonic() - _last_call_ts)
        if wait > 0:
            time.sleep(wait)
        _last_call_ts = time.monotonic()


def _get(url: str, params: dict) -> requests.Response:
    """GET helper that applies the rate limit and retries once on a 429."""
    for attempt in range(MAX_RETRIES + 1):
        _throttle()
        resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
        if resp.status_code == 429 and attempt < MAX_RETRIES:
            retry_after = int(resp.headers.get("Retry-After", "5") or "5")
            print(f"  ⏳ Rate limited (429) — waiting {retry_after}s before retrying…")
            time.sleep(max(retry_after, 1))
            continue
        return resp
    return resp


def normalize_doi(query: str) -> str:
    """
    Extract a bare DOI from any input:
    - Already a bare DOI starting with '10.' → returned as-is
    - Any https:// or http:// URL containing '10.' → extract from '10.' onwards
    - Anything else → returned unchanged
    """
    q = query.strip()
    # If it's a URL, find the DOI portion (starts with '10.')
    if q.lower().startswith(("https://", "http://")):
        idx = q.find("10.")
        if idx != -1:
            return q[idx:]
    return q


def looks_like_doi(query: str) -> bool:
    """Check if the query looks like a DOI (starts with '10.')."""
    return query.strip().startswith("10.")


def looks_like_s2_id(query: str) -> bool:
    """Check if the query looks like a 40-char hex Semantic Scholar paper ID."""
    q = query.strip()
    return len(q) == 40 and all(c in "0123456789abcdef" for c in q.lower())


def fetch_by_id(paper_id: str) -> dict | None:
    """
    Fetch a single paper by its Semantic Scholar paper ID or DOI.
    For DOIs, prefix with 'DOI:'.
    """
    url = f"{BASE_URL}/paper/{paper_id}"
    params = {"fields": FIELDS}
    resp = _get(url, params)

    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 404:
        print("  ℹ  Paper not found — it may not be indexed by Semantic Scholar yet.")
        return None
    elif resp.status_code == 429:
        print("  ⏳ Rate limited (429) — too many requests. Wait 30–60 seconds and try again.")
        return None
    else:
        print(f"  ⚠ API error {resp.status_code}: {resp.text}")
        return None


def search_by_title(title: str, limit: int = DEFAULT_LIMIT) -> list[dict]:
    """Search for papers matching a title string (capped at DEFAULT_LIMIT)."""
    limit = max(1, min(limit, DEFAULT_LIMIT))
    url = f"{BASE_URL}/paper/search"
    params = {
        "query": title,
        "fields": FIELDS,
        "limit": limit,
    }
    resp = _get(url, params)

    if resp.status_code == 200:
        data = resp.json()
        return data.get("data", [])
    else:
        print(f"  ⚠ API error {resp.status_code}: {resp.text}")
        return []


def print_paper(paper: dict, index: int | None = None) -> None:
    """Pretty-print a single paper."""
    prefix = f"Paper {index}" if index is not None else "Paper"
    print(f"\n{'─' * 60}")
    print(f"  📄 {prefix}")
    print(f"{'─' * 60}")
    print(f"  Title   : {paper.get('title', 'N/A')}")
    print(f"  Year    : {paper.get('year', 'N/A')}")

    authors = paper.get("authors", [])
    if authors:
        names = ", ".join(a.get("name", "?") for a in authors)
        print(f"  Authors : {names}")
    else:
        print("  Authors : N/A")

    abstract = paper.get("abstract")
    if abstract:
        # Wrap long abstracts for readability
        print(f"  Abstract: {abstract.strip()}")
    else:
        print("  Abstract: N/A")


def lookup(query: str) -> None:
    """Route the query to the right API endpoint and print results."""
    query = normalize_doi(query.strip())  # handle full DOI URLs
    if not query:
        print("❌ Empty query. Please enter a DOI, paper ID, or title.")
        return

    # --- Try DOI ---
    if looks_like_doi(query):
        print(f"\n🔍 Looking up DOI: {query}")
        paper = fetch_by_id(f"DOI:{query}")
        if paper:
            print_paper(paper)
        else:
            print("  ❌ No paper found for that DOI.")
        return

    # --- Try S2 Paper ID ---
    if looks_like_s2_id(query):
        print(f"\n🔍 Looking up Semantic Scholar ID: {query}")
        paper = fetch_by_id(query)
        if paper:
            print_paper(paper)
        else:
            print("  ❌ No paper found for that ID.")
        return

    # --- Fallback: Title search ---
    print(f"\n🔍 Searching for: \"{query}\"")
    results = search_by_title(query)
    if results:
        print(f"  Found {len(results)} result(s):\n")
        for i, paper in enumerate(results, 1):
            print_paper(paper, index=i)
    else:
        print("  ❌ No papers found matching that query.")


# ── Main ──────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # CLI argument mode
        user_query = " ".join(sys.argv[1:])
        lookup(user_query)
    else:
        # Interactive mode
        print("╔══════════════════════════════════════════════════════════╗")
        print("║     Semantic Scholar Paper Lookup                       ║")
        print("║     Enter a DOI, Paper ID, or title to search           ║")
        print("║     Type 'quit' to exit                                 ║")
        print("╚══════════════════════════════════════════════════════════╝")

        while True:
            print()
            user_query = input("🔎 Enter query: ").strip()
            if user_query.lower() in ("quit", "exit", "q"):
                print("👋 Goodbye!")
                break
            lookup(user_query)
