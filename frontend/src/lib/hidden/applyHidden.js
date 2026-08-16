import { normalizeAuthor, paperAuthorNames } from '../filters/predicates.js';

/** @typedef {import('../filters/types.js').Paper} Paper */
/** @typedef {{ papers:{id:string}[], authors:{name:string}[] }} HiddenState */

/**
 * True when this paper is on the user's hidden list — either the exact paper
 * (by id) or because one of its authors is hidden. Author matching is on the
 * normalised name and is EXACT (not substring), so hiding "J. Smith" never
 * silently swallows a different "Smith".
 *
 * @param {Paper} paper
 * @param {HiddenState} [hidden]
 * @returns {boolean}
 */
export function isPaperHidden(paper, hidden) {
  if (!paper || !hidden) return false;

  if (paper.paperId && (hidden.papers || []).some((p) => p.id === paper.paperId)) return true;

  const hiddenAuthors = new Set(
    (hidden.authors || []).map((a) => normalizeAuthor(a.name)).filter(Boolean)
  );
  if (hiddenAuthors.size === 0) return false;

  return paperAuthorNames(paper).map(normalizeAuthor).some((n) => hiddenAuthors.has(n));
}

/**
 * Remove every hidden paper from a result set. Pure; returns a new array and
 * never mutates the input. Returns a shallow copy untouched when nothing is
 * hidden (the common case).
 *
 * @param {Paper[]} papers
 * @param {HiddenState} [hidden]
 * @returns {Paper[]}
 */
export function applyHidden(papers, hidden) {
  if (!Array.isArray(papers)) return [];
  const nPapers = hidden?.papers?.length ?? 0;
  const nAuthors = hidden?.authors?.length ?? 0;
  if (nPapers === 0 && nAuthors === 0) return papers.slice();
  return papers.filter((p) => !isPaperHidden(p, hidden));
}
