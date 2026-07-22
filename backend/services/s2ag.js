'use strict';

const axios = require('axios');

const config = require('../config');
const { TTLCache } = require('./cache');

const cache = new TTLCache(config.cacheTtlMs);

// Semantic Scholar's per-key limit is ~1 req/sec, so bursts of distinct queries
// intermittently 429. Rather than surface that as a hard error, we retry a few
// times with backoff, honouring the server's Retry-After when it sends one.
const RETRY_ATTEMPTS = 3; // retries after the first try (up to 4 requests total)
const RETRY_BASE_MS = 500; // exponential base when no Retry-After header is given
const RETRY_CAP_MS = 8000; // never wait longer than this between attempts

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 429 (rate limit) and 5xx (transient upstream) are worth retrying; other 4xx
// are caller errors and won't improve on a retry.
function isRetriableStatus(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

// Prefer the server's Retry-After (seconds); otherwise exponential backoff.
function retryDelayMs(err, attempt) {
  const retryAfter = err.response?.headers?.['retry-after'];
  if (retryAfter != null) {
    const secs = parseInt(retryAfter, 10);
    if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, RETRY_CAP_MS);
  }
  return Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_CAP_MS);
}

/**
 * Build the Semantic Scholar paper-search query string from keyphrases.
 * Keyphrases are space-joined; S2's relevance ranking tolerates the loose query
 * (instructions.md §6.3 "Why keyword search").
 */
function buildQuery(keyphrases) {
  return (keyphrases || []).map((k) => String(k).trim()).filter(Boolean).join(' ');
}

/**
 * Normalise a raw S2AG paper object to the response schema (instructions.md §6.1).
 */
function normalizePaper(p) {
  return {
    paperId: p.paperId,
    title: p.title || 'Untitled',
    abstract: p.abstract || null,
    authors: Array.isArray(p.authors)
      ? p.authors.map((a) => ({ authorId: a.authorId || null, name: a.name }))
      : [],
    year: p.year ?? null,
    citationCount: p.citationCount ?? 0,
    url: p.url || (p.paperId ? `https://www.semanticscholar.org/paper/${p.paperId}` : null),
    venue: p.venue || null,
  };
}

/**
 * Query S2AG /paper/search with the gateway-held API key.
 *
 * @param {string[]} keyphrases
 * @param {number}   limit
 * @returns {Promise<{query: string, papers: object[]}>}
 */
async function searchPapers(keyphrases, limit = config.s2ag.defaultLimit) {
  const query = buildQuery(keyphrases);
  if (!query) return { query: '', papers: [] };

  const cacheKey = `${query}::${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const headers = {};
  if (config.s2ag.apiKey) headers['x-api-key'] = config.s2ag.apiKey;

  let resp;
  for (let attempt = 0; ; attempt++) {
    try {
      resp = await axios.get(`${config.s2ag.baseUrl}/paper/search`, {
        params: { query, fields: config.s2ag.fields, limit },
        headers,
        timeout: 20000,
      });
      break;
    } catch (err) {
      const status = err.response?.status;
      // Transient (rate-limit / upstream) failures: back off and try again.
      if (status != null && isRetriableStatus(status) && attempt < RETRY_ATTEMPTS) {
        await sleep(retryDelayMs(err, attempt));
        continue;
      }
      if (err.response) {
        const e = new Error(
          status === 429
            ? 'Semantic Scholar rate limit reached — try again shortly'
            : 'Semantic Scholar search failed'
        );
        e.status = status === 429 ? 429 : 502;
        e.code = 'S2AG_SEARCH_FAILED';
        throw e;
      }
      const e = new Error('Semantic Scholar is unreachable');
      e.status = 503;
      e.code = 'S2AG_UNAVAILABLE';
      throw e;
    }
  }

  const papers = (resp.data && Array.isArray(resp.data.data) ? resp.data.data : [])
    .filter((p) => p && p.paperId)
    .map(normalizePaper);

  return cache.set(cacheKey, { query, papers });
}

module.exports = { searchPapers, buildQuery, normalizePaper, _cache: cache };
