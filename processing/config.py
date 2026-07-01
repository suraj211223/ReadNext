"""Central configuration for the NLP processing node.

Values are read from the environment (and a local ``.env`` file). The processing
node is internal-only; it holds no secrets — the S2AG API key lives exclusively
in the Express gateway.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # NLP model config
    keybert_model: str = "all-MiniLM-L6-v2"
    spacy_model: str = "en_core_web_sm"

    # Keyword distillation bounds (instructions.md §1: 5–7 keyphrases)
    min_keywords: int = 5
    max_keywords: int = 7

    # n-gram range for candidate keyphrases (1–3 per instructions §2/§8)
    ngram_min: int = 1
    ngram_max: int = 3

    # If extracted text is longer than this many characters, prefer the RAKE
    # statistical fallback (cheaper on long / low-signal text).
    rake_char_threshold: int = 6000

    # OCR config
    tesseract_cmd: str | None = None  # path to the tesseract binary, if non-standard


@lru_cache
def get_settings() -> Settings:
    return Settings()
