import { normalizeAuthor, normalizeVenue, paperAuthorNames } from './predicates.js';

/** @typedef {import('./types.js').Paper} Paper */

/**
 * Derive the distinct facet options (authors, publishers) from a set of papers.
 * Options are computed FROM the corpus, never hardcoded (task §12). Because this
 * app's chat replaces its result set on every search, the "corpus" here is the
 * latest result set; facets refresh alongside it.
 *
 * Dedupe is on the normalised value, but the first-seen ORIGINAL string is kept
 * for display. Year range bounds are returned too, to seed the slider.
 *
 * @param {Paper[]} papers
 * @returns {{ authors:string[], publishers:string[], yearBounds:{min:number|null,max:number|null} }}
 */
export function deriveFacets(papers) {
  /** @type {Map<string,string>} */
  const authors = new Map(); // normalised → original display string
  /** @type {Map<string,string>} */
  const publishers = new Map();
  /** @type {number|null} */
  let minYear = null;
  /** @type {number|null} */
  let maxYear = null;

  for (const p of Array.isArray(papers) ? papers : []) {
    for (const name of paperAuthorNames(p)) {
      const key = normalizeAuthor(name);
      if (key && !authors.has(key)) authors.set(key, name.trim());
    }
    const venue = typeof p?.venue === 'string' ? p.venue.trim() : '';
    if (venue) {
      const key = normalizeVenue(venue);
      if (key && !publishers.has(key)) publishers.set(key, venue);
    }
    const y = Number(p?.year);
    if (Number.isFinite(y)) {
      minYear = minYear == null ? y : Math.min(minYear, y);
      maxYear = maxYear == null ? y : Math.max(maxYear, y);
    }
  }

  /** @param {string} a @param {string} b */
  const byLocale = (a, b) => a.localeCompare(b);
  return {
    authors: [...authors.values()].sort(byLocale),
    publishers: [...publishers.values()].sort(byLocale),
    yearBounds: { min: minYear, max: maxYear },
  };
}
