'use strict';

const express = require('express');
const multer = require('multer');

const config = require('../config');
const { extractKeyphrases } = require('../services/engine');
const { searchPapers, buildYearParam } = require('../services/s2ag');

const router = express.Router();

// The engine returns 5–7 multi-word keyphrases. Handing those long phrases to
// S2AG's relevance search over-constrains the match and returns zero papers.
// Instead we break the keyphrases into their individual content words, dedupe,
// and query with the top few — short, high-signal terms that S2AG ranks well.
const SEARCH_WORD_COUNT = 6;
const MIN_WORD_LEN = 3; // keeps acronyms (mri, ecg, dna) but drops stray fragments

// Small function-word set to drop generic tokens that leak in from phrases.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'was', 'were', 'with', 'that', 'this', 'from',
  'into', 'onto', 'via', 'per', 'its', 'their', 'these', 'those', 'such', 'than',
  'then', 'also', 'may', 'can', 'not', 'but', 'out', 'off', 'all', 'any', 'one',
  'two', 'three', 'using', 'used', 'use', 'give', 'gives', 'given', 'great',
]);

/**
 * Flatten keyphrases into a de-duplicated list of the top content words.
 * @param {string[]} keyphrases
 * @param {number} limit
 * @returns {string[]}
 */
function queryWords(keyphrases, limit = SEARCH_WORD_COUNT) {
  const seen = new Set();
  const words = [];
  for (const kp of keyphrases || []) {
    for (const w of String(kp).toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length < MIN_WORD_LEN || STOPWORDS.has(w) || seen.has(w)) continue;
      seen.add(w);
      words.push(w);
      if (words.length >= limit) return words;
    }
  }
  return words;
}

const ACCEPTED = new Set([
  'application/pdf',
  'application/x-pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/tiff',
  'image/bmp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (req, file, cb) => {
    if (ACCEPTED.has(file.mimetype)) return cb(null, true);
    const e = new Error(`Unsupported file type: ${file.mimetype}`);
    e.status = 415;
    e.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(e);
  },
});

/**
 * POST /api/process
 * multipart/form-data: file=<PDF|image>, maxResults?=<number>
 *
 * Orchestrates: file -> NLP engine (/extract) -> S2AG search -> JSON (§6.1).
 */
router.post('/process', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      code: 'NO_FILE',
      message: 'No file was uploaded under field "file".',
    });
  }

  const maxResults = Math.min(
    Math.max(parseInt(req.body.maxResults, 10) || 5, 1),
    config.s2ag.defaultLimit
  );

  const { buffer, originalname, mimetype } = req.file;

  // Year is the one filter dimension applied at retrieval time (task §12). The
  // author/publisher dimensions are applied client-side on the returned set.
  const year = buildYearParam(req.body.yearMin, req.body.yearMax);

  // 1) Extract unified text + keyphrases from the internal engine.
  const extraction = await extractKeyphrases(buffer, originalname, mimetype);
  const keyphrases = extraction.keyphrases || [];

  // 2) Query Semantic Scholar with the gateway-held key. We search with the top
  // individual content words (not the long phrases); the full keyphrase set is
  // still returned below for display.
  const { query, papers } = await searchPapers(queryWords(keyphrases), maxResults, { year });

  // 3) Shape the public response (instructions.md §6.1).
  return res.json({
    status: 'success',
    keyphrases,
    query,
    method: extraction.method,
    extractor: extraction.extractor,
    total_results: papers.length,
    papers,
  });
});

// Hard cap on results for the keyword chat endpoint — S2AG is rate-limited, so
// we never ask for more than five papers per query.
const SEARCH_MAX_RESULTS = 5;

/**
 * POST /api/search
 * JSON body: { query: string, maxResults?: number }
 *
 * Keyword search used by the chat page: the user types a phrase (no NLP engine
 * involved) and we hand it straight to Semantic Scholar, capped at 5 results.
 */
router.post('/search', express.json(), async (req, res) => {
  const query = typeof req.body.query === 'string' ? req.body.query.trim() : '';
  if (!query) {
    return res.status(400).json({
      status: 'error',
      code: 'EMPTY_QUERY',
      message: 'Enter a keyword or phrase to search for.',
    });
  }

  const maxResults = Math.min(
    Math.max(parseInt(req.body.maxResults, 10) || SEARCH_MAX_RESULTS, 1),
    SEARCH_MAX_RESULTS
  );

  // Year filter (task §12) is pushed into the S2AG query; author/publisher are
  // applied client-side on the result set.
  const year = buildYearParam(req.body.yearMin, req.body.yearMax);

  // A comma is an explicit term separator: "heart,stenosis" is treated as two
  // distinct search terms rather than one literal token. We split on commas,
  // trim, and drop empties; a plain phrase (no comma) stays a single term.
  const terms = query
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const searchTerms = terms.length ? terms : [query];

  const { query: usedQuery, papers } = await searchPapers(searchTerms, maxResults, { year });

  return res.json({
    status: 'success',
    keyphrases: searchTerms,
    query: usedQuery,
    method: 'keyword',
    total_results: papers.length,
    papers,
  });
});

module.exports = router;
