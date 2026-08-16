/**
 * Client for the Express gateway (instructions.md §6.1).
 * The browser only ever talks to the gateway at /api/process — never the engine
 * or S2AG directly, and never sees the API key.
 */

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

/**
 * Validate a file before upload. Returns an error string, or null if OK.
 * @param {File} file
 * @param {number} [maxBytes]
 */
export function validateFile(file, maxBytes = 15 * 1024 * 1024) {
  if (!file) return 'Please choose a PDF or image file.';
  const okType =
    ACCEPTED_TYPES.includes(file.type) || /\.(pdf|png|jpe?g|webp)$/i.test(file.name || '');
  if (!okType) return 'Unsupported file type. Upload a PDF or an image (PNG/JPG/WebP).';
  if (file.size > maxBytes) return 'File is too large (max 15 MB).';
  return null;
}

/**
 * @typedef {{ yearMin:number|null, yearMax:number|null, authors:string[], publishers:string[] }} FilterState
 */

/**
 * Append the active filter state to an outbound payload so answers can be
 * attributed to the correct subset (task §12). Year is honoured server-side by
 * the gateway; author/publisher are echoed for attribution and applied client-side.
 * @param {(name:string, value:string)=>void} append
 * @param {FilterState} [filters]
 */
function appendFilters(append, filters) {
  if (!filters) return;
  if (filters.yearMin != null) append('yearMin', String(filters.yearMin));
  if (filters.yearMax != null) append('yearMax', String(filters.yearMax));
  if (filters.authors?.length) append('authors', JSON.stringify(filters.authors));
  if (filters.publishers?.length) append('publishers', JSON.stringify(filters.publishers));
}

/**
 * Upload a file to the gateway and return the ranked recommendations.
 * @param {File} file
 * @param {{ maxResults?: number, filters?: FilterState, fetch?: typeof fetch }} [opts]
 * @returns {Promise<{keyphrases: string[], papers: object[], method?: string, extractor?: string}>}
 */
export async function processFile(file, opts = {}) {
  const { maxResults = 5, filters, fetch: fetchImpl = globalThis.fetch } = opts;

  const validationError = validateFile(file);
  if (validationError) throw new ApiError(validationError, 'VALIDATION', 400);

  const form = new FormData();
  form.append('file', file);
  form.append('maxResults', String(maxResults));
  appendFilters((k, v) => form.append(k, v), filters);

  let resp;
  try {
    resp = await fetchImpl('/api/process', { method: 'POST', body: form });
  } catch (e) {
    throw new ApiError('Could not reach the server. Is the gateway running?', 'NETWORK', 0);
  }

  let body = {};
  try {
    body = await resp.json();
  } catch (e) {
    /* non-JSON body */
  }

  if (!resp.ok || body.status === 'error') {
    throw new ApiError(
      body.message || `Request failed (${resp.status})`,
      body.code || 'REQUEST_FAILED',
      resp.status
    );
  }

  return body;
}

/**
 * Keyword search via the gateway (chat page). Sends a typed phrase — no file —
 * and returns up to 5 ranked papers.
 * @param {string} query
 * @param {{ maxResults?: number, filters?: FilterState, fetch?: typeof fetch }} [opts]
 * @returns {Promise<{keyphrases: string[], papers: object[], method?: string}>}
 */
export async function searchByKeyword(query, opts = {}) {
  const { maxResults = 5, filters, fetch: fetchImpl = globalThis.fetch } = opts;

  const q = (query || '').trim();
  if (!q) throw new ApiError('Enter a keyword or phrase to search for.', 'VALIDATION', 400);

  const payload = { query: q, maxResults };
  if (filters?.yearMin != null) payload.yearMin = filters.yearMin;
  if (filters?.yearMax != null) payload.yearMax = filters.yearMax;
  if (filters?.authors?.length) payload.authors = filters.authors;
  if (filters?.publishers?.length) payload.publishers = filters.publishers;

  let resp;
  try {
    resp = await fetchImpl('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw new ApiError('Could not reach the server. Is the gateway running?', 'NETWORK', 0);
  }

  let body = {};
  try {
    body = await resp.json();
  } catch (e) {
    /* non-JSON body */
  }

  if (!resp.ok || body.status === 'error') {
    throw new ApiError(
      body.message || `Request failed (${resp.status})`,
      body.code || 'REQUEST_FAILED',
      resp.status
    );
  }

  return body;
}
