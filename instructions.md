# Contextual Research Recommender — Build Instructions

> **For: Claude Code**
> This file is the single source of truth for building the application. Read it fully before writing code. Build in the phased order described in **§8 Delivery Plan**. Do not skip the acceptance checks at the end of each phase.

---

## 1. What We're Building

An **NLP-powered Smart Reading Companion**. The user uploads a PDF or a screenshot of what they're reading; the system extracts the text, distills it into 5–7 keyphrases, queries the Semantic Scholar Academic Graph (S2AG), and returns a ranked grid of the most relevant papers to read next.

**Core promise:** *From the paragraph in front of you to the five papers you should read next — in one step.*

**End-to-end latency target:** < 4 seconds from upload to rendered recommendations (using the `all-MiniLM-L6-v2` model).

---

## 2. Architecture (Three-Tier Pipeline)

Each tier owns a single responsibility and communicates over a clean boundary.

```
┌─────────────┐   multipart POST     ┌──────────────┐   POST /extract    ┌──────────────┐
│   FRONTEND  │  /api/process        │ API GATEWAY  │   (httpx, internal)│  NLP ENGINE  │
│  Svelte+Vite│ ───────────────────▶ │  Express.js  │ ──────────────────▶│   FastAPI    │
│   :5173     │                      │    :3000     │                    │    :8000     │
│ upload + grid│ ◀─────────────────── │ broker/proxy │ ◀───────────────── │ OCR/parse/kw │
└─────────────┘   ranked papers JSON └──────┬───────┘   keyphrases JSON   └──────────────┘
                                            │ REST GET, x-api-key
                                            ▼
                                    ┌────────────────┐
                                    │  S2AG (Semantic│
                                    │  Scholar API)  │
                                    └────────────────┘
```

| Tier | Tech | Port | Responsibility |
|------|------|------|----------------|
| Frontend UI | Svelte + Vite | 5173 | File upload UI + reactive paper card grid |
| API Gateway | Express.js (Node 18+) | 3000 | Routing, file proxy, **S2AG auth broker** (holds the API key) |
| NLP Engine | FastAPI (Python 3.10+) | 8000 | OCR, PDF parse, keyword extraction. **Never publicly exposed.** |
| External | Semantic Scholar S2AG | — | Paper search + metadata |

**Security rule:** The S2AG API key lives **only** in the Gateway. The NLP engine is internal-only. The frontend never sees the key.

---

## 3. Tech Stack (authoritative)

| Component | Library / Framework | Duty |
|-----------|--------------------|------|
| Frontend | Svelte + Vite | File upload, reactive paper card grid |
| API Gateway | Express.js (Node 18+) | Routing, file proxy, S2AG auth broker |
| Processing Node | FastAPI (Python 3.10+) | OCR, PDF parse, keyword extraction |
| OCR Engine | EasyOCR | Image / screenshot → text |
| PDF Parser | PyMuPDF (`fitz`) | Structured PDF text extraction |
| Keyword Extractor | KeyBERT (primary) + RAKE (fallback) | Distill text to 5–7 keyphrases |
| Embeddings | sentence-transformers `all-MiniLM-L6-v2` | Semantic vectors for KeyBERT |
| Preprocessing | spaCy | Stop-word filtering, n-grams (1–3) |
| Paper Search | Semantic Scholar (S2AG) | Academic search + metadata |

Gateway↔Engine transport uses **`httpx`** (Python side) over internal REST.

---

## 4. Repository Layout

```
research-recommender/
├── instructions.md            # this file
├── README.md
├── docker-compose.yml         # optional, brings up all three tiers
├── .env.example
│
├── frontend/                  # Svelte + Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.svelte
│       ├── lib/
│       │   ├── api.js         # talks to gateway /api/process
│       │   ├── Uploader.svelte
│       │   ├── PaperCard.svelte
│       │   └── PaperGrid.svelte
│       └── main.js
│
├── gateway/                   # Express.js
│   ├── package.json
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/process.js  # POST /api/process
│   │   ├── services/engine.js # proxy to NLP engine
│   │   └── services/s2ag.js   # Semantic Scholar client (holds key)
│   └── .env                   # NOT committed
│
└── engine/                    # FastAPI
    ├── requirements.txt
    ├── app/
    │   ├── main.py            # FastAPI app, POST /extract
    │   ├── ingestion/
    │   │   ├── pdf.py         # PyMuPDF
    │   │   └── ocr.py         # EasyOCR
    │   ├── nlp/
    │   │   ├── preprocess.py  # spaCy
    │   │   └── keywords.py    # KeyBERT + RAKE
    │   └── schemas.py         # pydantic models
    └── tests/
```

---

## 5. The Data Journey (5 Stages)

Implement the pipeline as these five sequential stages:

1. **Document Ingestion** — user uploads a PDF or pastes/uploads a screen capture.
2. **Text Extraction** — route by MIME type: PyMuPDF parses PDFs (reads embedded text layer, preserves reading order — deterministic, millisecond-scale); EasyOCR reads images (deep-learning OCR, GPU-accelerated, robust to varied fonts).
3. **Keyword Distillation** — KeyBERT compresses text to 5–7 keyphrases; RAKE is the statistical fallback for long / low-signal text.
4. **S2AG Search Query** — keyphrases become a query against the Semantic Scholar graph.
5. **Card Recommendation** — ranked papers render as a structured card grid.

Both extraction paths converge on a **single unified raw-text string** before reaching the NLP core.

---

## 6. API Contracts

### 6.1 Client → Gateway
```
POST /api/process
Content-Type: multipart/form-data
Body: file=<PDF or image>
```
**Response 200:**
```json
{
  "keyphrases": ["transformer attention mechanism", "BERT language model", "..."],
  "papers": [
    {
      "paperId": "abc123",
      "title": "Attention Is All You Need",
      "abstract": "…",
      "authors": [{ "name": "Ashish Vaswani", "authorId": "..." }],
      "year": 2017,
      "citationCount": 100000,
      "url": "https://www.semanticscholar.org/paper/abc123",
      "venue": "NeurIPS"
    }
  ]
}
```

### 6.2 Gateway → NLP Engine (internal)
```
POST /extract  (httpx, never publicly exposed)
Content-Type: multipart/form-data
Body: file=<PDF or image>
```
**Response 200:**
```json
{
  "text": "unified raw text string…",
  "keyphrases": ["...", "..."],
  "method": "pymupdf" | "easyocr",
  "extractor": "keybert" | "rake"
}
```

### 6.3 Gateway → S2AG
```
GET https://api.semanticscholar.org/graph/v1/paper/search?query=<keyphrases>&fields=title,abstract,authors,year,citationCount,url,venue&limit=10
Headers: { "x-api-key": "<S2AG_KEY>" }
```
Other endpoints available if needed:
`GET /graph/v1/paper/{id}` · `GET /graph/v1/author/{id}`

**Why keyword search:** relevance-ranked by S2's own embeddings, tolerant of paraphrase/synonymy, higher precision than raw title match, and the authenticated key lifts rate limits.

---

## 7. Environment & Setup

`.env.example`:
```
# Gateway
PORT=3000
ENGINE_URL=http://localhost:8000
S2AG_API_KEY=your_semantic_scholar_key_here
S2AG_BASE=https://api.semanticscholar.org/graph/v1

# Engine
ENGINE_PORT=8000
KEYBERT_MODEL=all-MiniLM-L6-v2
```

**Run each tier (dev):**
```bash
# Engine
cd engine && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000

# Gateway
cd gateway && npm install && npm run dev      # listens on :3000

# Frontend
cd frontend && npm install && npm run dev     # Vite on :5173
```

`engine/requirements.txt` should include: `fastapi`, `uvicorn[standard]`, `python-multipart`, `pymupdf`, `easyocr`, `keybert`, `rake-nltk`, `sentence-transformers`, `spacy`, `httpx`, `pydantic`.

---

## 8. Delivery Plan (build in this order)

### Phase 1 · Ingestion
Build PDF parsing + OCR pipeline producing unified text output.
- [ ] `engine/ingestion/pdf.py`: PyMuPDF extracts ordered text from a PDF.
- [ ] `engine/ingestion/ocr.py`: EasyOCR extracts text from an image.
- [ ] MIME-based router selects the correct path automatically.
- **Accept:** Given a sample PDF and a sample screenshot, both yield a non-empty unified text string.

### Phase 2 · NLP Core
Build the KeyBERT / RAKE keyphrase distillation engine.
- [ ] spaCy preprocessing: stop-word filtering, n-grams (1–3).
- [ ] KeyBERT with `all-MiniLM-L6-v2`, cosine-similarity ranking → 5–7 keyphrases.
- [ ] RAKE fallback for long / low-signal text.
- [ ] `POST /extract` returns text + keyphrases.
- **Accept:** The Transformer abstract yields keyphrases like "transformer attention mechanism", "BERT language model".

### Phase 3 · S2AG Integration
Search querying, ranking & card-grid rendering.
- [ ] `gateway/services/s2ag.js`: query `/paper/search` with `x-api-key`, request the fields in §6.1.
- [ ] `gateway/routes/process.js`: orchestrate file → engine → S2AG → JSON.
- [ ] Frontend `Uploader`, `PaperGrid`, `PaperCard`; reactive grid renders results.
- **Accept:** Uploading a PDF in the browser renders a grid of real Semantic Scholar papers.

### Phase 4 · Eval & Polish
CER / NDCG evaluation, caching & UI refinement.
- [ ] Evaluation scripts (see §9).
- [ ] Cache identical extraction/search requests.
- [ ] Loading states, error handling, empty/no-result states, responsive grid.
- **Accept:** Eval scripts run and report metrics; UI handles errors gracefully; latency < 4s on a clean PDF.

---

## 9. Validation & Metrics

**Extraction quality — Character Error Rate (CER):**
```
CER = (S + D + I) / N
```
Substitutions + Deletions + Insertions over total reference characters, benchmarked against a hand-labelled OCR ground-truth set. **Target: CER < 5% on clean captures.**

**Recommendation relevance:**
- **Precision@K** — fraction of top-K papers judged relevant. **Target: P@5 ≥ 0.80.**
- **NDCG** — Normalised Discounted Cumulative Gain; rewards relevant hits ranked nearer the top (ordering quality, not just set membership). **Target: NDCG ≥ 0.75.**

Provide a small labelled fixture set so these can be computed reproducibly.

---

## 10. Scope Guardrails

**In scope:** PDF text extraction (PyMuPDF), digital screenshot OCR (EasyOCR), real-time keyword distillation (KeyBERT/RAKE), S2AG metadata fetching & ranking, responsive paper card-grid UI.

**Out of scope (do NOT build):** full-text PDF hosting/storage, citation-graph traversal, user accounts / auth / saved libraries, offline on-device inference, handwritten & multi-language OCR.

Keep the MVP fast, testable, and demonstrable. When in doubt, choose the smaller surface area.

---

## 11. Definition of Done

- All three tiers run locally via the commands in §7.
- Uploading a born-digital PDF **or** a screenshot returns a ranked grid of real S2AG papers.
- End-to-end latency < 4s on a clean PDF.
- Keyphrase count stays within 5–7.
- S2AG key never leaves the gateway; engine is not publicly reachable.
- Eval scripts report CER, P@5, and NDCG against the fixture set.
- README documents setup, env vars, and the request flow.

---

*Note: Not affiliated with or endorsed by the Allen Institute for AI. Semantic Scholar / S2AG is used via its public API.*