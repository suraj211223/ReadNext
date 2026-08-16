import { matchesYear, matchesAuthors, matchesPublisher, isYearActive } from './predicates.js';

/** @typedef {import('./types.js').Paper} Paper */
/** @typedef {import('./types.js').FilterState} FilterState */

/**
 * The neutral state: nothing selected → the full corpus passes through.
 * @type {FilterState}
 */
export const EMPTY_FILTERS = Object.freeze({
  yearMin: null,
  yearMax: null,
  authors: [],
  publishers: [],
});

/**
 * True when at least one dimension is actively constraining the set.
 * @param {FilterState} [state]
 * @returns {boolean}
 */
export function hasActiveFilters(state = EMPTY_FILTERS) {
  return (
    isYearActive(state) ||
    (state.authors?.length ?? 0) > 0 ||
    (state.publishers?.length ?? 0) > 0
  );
}

/**
 * Compose the per-dimension predicates: AND across dimensions, OR within each.
 * A pure function of (papers, state) — the single source of truth for what the
 * chat operates on. Returns a new array; never mutates the input.
 *
 * @param {Paper[]} papers
 * @param {FilterState} [state]
 * @returns {Paper[]}
 */
export function applyFilters(papers, state = EMPTY_FILTERS) {
  if (!Array.isArray(papers)) return [];
  if (!hasActiveFilters(state)) return papers.slice();
  return papers.filter(
    (p) =>
      matchesYear(p, state) &&
      matchesAuthors(p, state.authors) &&
      matchesPublisher(p, state.publishers)
  );
}
