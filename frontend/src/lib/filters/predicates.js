/**
 * Pure, UI-independent matching functions — one per filter dimension (task §12).
 * Each takes a paper and the active selection for its dimension and returns a
 * boolean. They never throw on null/undefined fields.
 *
 * Combination logic lives in applyFilters.js:
 *   - across dimensions: AND
 *   - within a dimension (multiple selections): OR
 *
 * A paper shape (from the gateway, backend/services/s2ag.js → normalizePaper):
 *   { paperId, title, abstract, authors:[{authorId,name}], year, citationCount, url, venue }
 * Note: `authors` is an array of OBJECTS ({name}), and the corpus has `venue`
 * (used as "publisher") — there is no separate `publisher`/`domains` field.
 */

/** @typedef {import('./types.js').Paper} Paper */
/** @typedef {import('./types.js').FilterState} FilterState */

/**
 * Lowercase, strip punctuation, collapse whitespace. Used for author matching.
 * @param {*} name
 * @returns {string}
 */
export function normalizeAuthor(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lowercase + collapse whitespace. Used for exact publisher (venue) matching.
 * @param {*} venue
 * @returns {string}
 */
export function normalizeVenue(venue) {
  return String(venue ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The list of author display names on a paper (defensive against shapes).
 * @param {Paper} [paper]
 * @returns {string[]}
 */
export function paperAuthorNames(paper) {
  const authors = paper?.authors;
  if (!Array.isArray(authors)) return [];
  return /** @type {string[]} */ (
    authors
      .map((a) => (typeof a === 'string' ? a : a?.name))
      .filter((n) => typeof n === 'string' && n.trim().length > 0)
  );
}

/**
 * A dimension is "active" only when it carries at least one real selection.
 * @param {Partial<FilterState>} [state]
 * @returns {boolean}
 */
export function isYearActive({ yearMin, yearMax } = {}) {
  return yearMin != null || yearMax != null;
}

/**
 * Year — inclusive on both ends. When the dimension is active and the paper has
 * no usable year, it is EXCLUDED (task §12 missing-field rule).
 * @param {Paper} paper
 * @param {Partial<FilterState>} [state]
 * @returns {boolean}
 */
export function matchesYear(paper, { yearMin = null, yearMax = null } = {}) {
  if (yearMin == null && yearMax == null) return true;
  const y = Number(paper?.year);
  if (!Number.isFinite(y)) return false;
  if (yearMin != null && y < yearMin) return false;
  if (yearMax != null && y > yearMax) return false;
  return true;
}

/**
 * Author — case-insensitive substring match on ANY author name (OR within the
 * dimension). Selections are normalised for comparison; the original strings are
 * kept for display elsewhere. A paper with no authors is excluded when active.
 * @param {Paper} paper
 * @param {string[]} [selected]
 * @returns {boolean}
 */
export function matchesAuthors(paper, selected = []) {
  const needles = (selected || []).map(normalizeAuthor).filter(Boolean);
  if (needles.length === 0) return true;
  const names = paperAuthorNames(paper).map(normalizeAuthor);
  if (names.length === 0) return false;
  return needles.some((needle) => names.some((name) => name.includes(needle)));
}

/**
 * Publisher (venue) — case-insensitive substring match on the normalised value
 * (OR within the dimension). Substring (rather than exact) matching keeps the
 * filter usable across searches: S2AG reports venues inconsistently (e.g.
 * "Nature" vs "Nature Medicine"), so an exact match combined with a fresh,
 * year-narrowed result set almost always collapsed to zero. A paper with no
 * venue is excluded when the dimension is active.
 * @param {Paper} paper
 * @param {string[]} [selected]
 * @returns {boolean}
 */
export function matchesPublisher(paper, selected = []) {
  const needles = (selected || []).map(normalizeVenue).filter(Boolean);
  if (needles.length === 0) return true;
  const venue = normalizeVenue(paper?.venue);
  if (!venue) return false;
  return needles.some((needle) => venue.includes(needle) || needle.includes(venue));
}
