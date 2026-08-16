import { describe, it, expect } from 'vitest';
import {
  matchesYear,
  matchesAuthors,
  matchesPublisher,
  normalizeAuthor,
  normalizeVenue,
  paperAuthorNames,
  isYearActive,
} from './predicates.js';
import { applyFilters, hasActiveFilters, EMPTY_FILTERS } from './applyFilters.js';
import { deriveFacets } from './facets.js';

const paper = (over = {}) => ({
  paperId: 'p',
  title: 'T',
  year: 2020,
  venue: 'NeurIPS',
  authors: [{ name: 'John Smith' }, { name: 'Ada Lovelace' }],
  ...over,
});

describe('normalisation', () => {
  it('lowercases, strips punctuation and collapses whitespace for authors', () => {
    expect(normalizeAuthor('  J.  Smith! ')).toBe('j smith');
    expect(normalizeAuthor(null)).toBe('');
  });
  it('lowercases and collapses whitespace for venues', () => {
    expect(normalizeVenue('  IEEE   Access ')).toBe('ieee access');
    expect(normalizeVenue(undefined)).toBe('');
  });
  it('reads author names defensively (objects or strings)', () => {
    expect(paperAuthorNames({ authors: [{ name: 'A' }, 'B', { name: '' }, null] })).toEqual([
      'A',
      'B',
    ]);
    expect(paperAuthorNames({})).toEqual([]);
    expect(paperAuthorNames(undefined)).toEqual([]);
  });
});

describe('matchesYear', () => {
  it('is a no-op (true) when the dimension is inactive', () => {
    expect(matchesYear(paper({ year: 1990 }), {})).toBe(true);
    expect(isYearActive({})).toBe(false);
  });
  it('matches inclusively on both ends', () => {
    expect(matchesYear(paper({ year: 2019 }), { yearMin: 2019, yearMax: 2023 })).toBe(true); // normal match
    expect(matchesYear(paper({ year: 2023 }), { yearMin: 2019, yearMax: 2023 })).toBe(true);
  });
  it('does not match outside the range', () => {
    expect(matchesYear(paper({ year: 2018 }), { yearMin: 2019, yearMax: 2023 })).toBe(false); // no match
  });
  it('excludes a paper with a missing/invalid year when active', () => {
    expect(matchesYear(paper({ year: null }), { yearMin: 2000 })).toBe(false); // missing field
    expect(matchesYear(paper({ year: undefined }), { yearMax: 2000 })).toBe(false);
  });
});

describe('matchesAuthors', () => {
  it('is a no-op (true) with no selections', () => {
    expect(matchesAuthors(paper(), [])).toBe(true);
  });
  it('matches case-insensitively as a substring on any author', () => {
    expect(matchesAuthors(paper(), ['smith'])).toBe(true); // normal match
    expect(matchesAuthors(paper(), ['LOVELACE'])).toBe(true);
  });
  it('normalises variants so "J. Smith" matches "John Smith" is not implied, but tokens are', () => {
    // Substring semantics: "smith" matches, a full variant "jane smith" does not.
    expect(matchesAuthors(paper(), ['jane smith'])).toBe(false); // no match
  });
  it('is OR across multiple selected authors', () => {
    expect(matchesAuthors(paper(), ['nobody', 'lovelace'])).toBe(true); // multi-value OR
  });
  it('excludes a paper with no authors when active', () => {
    expect(matchesAuthors({ authors: [] }, ['smith'])).toBe(false); // missing field
    expect(matchesAuthors({}, ['smith'])).toBe(false);
  });
});

describe('matchesPublisher', () => {
  it('is a no-op (true) with no selections', () => {
    expect(matchesPublisher(paper(), [])).toBe(true);
  });
  it('matches on the exact normalised value', () => {
    expect(matchesPublisher(paper({ venue: 'NeurIPS' }), ['neurips'])).toBe(true); // normal match
    expect(matchesPublisher(paper({ venue: 'IEEE' }), ['neurips'])).toBe(false); // no match
  });
  it('is OR across multiple selected publishers', () => {
    expect(matchesPublisher(paper({ venue: 'IEEE' }), ['neurips', 'IEEE'])).toBe(true); // multi-value OR
  });
  it('excludes a paper with no venue when active', () => {
    expect(matchesPublisher(paper({ venue: null }), ['ieee'])).toBe(false); // missing field
  });
});

describe('applyFilters (composition)', () => {
  const corpus = [
    paper({ paperId: '1', year: 2020, venue: 'NeurIPS', authors: [{ name: 'John Smith' }] }),
    paper({ paperId: '2', year: 2015, venue: 'IEEE', authors: [{ name: 'J. Smith' }] }),
    paper({ paperId: '3', year: null, venue: 'IEEE', authors: [{ name: 'Alice Wong' }] }),
    paper({ paperId: '4', year: 2023, venue: null, authors: [{ name: 'Bob Lee' }] }),
  ];

  it('returns the full corpus (a copy) when nothing is active', () => {
    const out = applyFilters(corpus, EMPTY_FILTERS);
    expect(out).toHaveLength(4);
    expect(out).not.toBe(corpus);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it('ANDs across dimensions and ORs within one', () => {
    const out = applyFilters(corpus, {
      yearMin: 2019,
      yearMax: 2023,
      authors: [],
      publishers: ['IEEE', 'NeurIPS'],
    });
    // year 2019–2023 AND (IEEE OR NeurIPS) → only paper 1 (paper 4 has no venue).
    expect(out.map((p) => p.paperId)).toEqual(['1']);
  });

  it('never throws on null/undefined papers', () => {
    expect(() => applyFilters([null, undefined, {}], { publishers: ['x'] })).not.toThrow();
    expect(applyFilters(null, EMPTY_FILTERS)).toEqual([]);
  });
});

describe('deriveFacets', () => {
  it('derives distinct, sorted authors/publishers and year bounds from the corpus', () => {
    const facets = deriveFacets([
      { authors: [{ name: 'John Smith' }], venue: 'NeurIPS', year: 2020 },
      { authors: [{ name: 'john smith' }], venue: 'IEEE', year: 2015 }, // dup author (normalised)
      { authors: [{ name: 'Ada Lovelace' }], venue: 'NeurIPS', year: 2023 }, // dup venue
    ]);
    expect(facets.authors).toEqual(['Ada Lovelace', 'John Smith']);
    expect(facets.publishers).toEqual(['IEEE', 'NeurIPS']);
    expect(facets.yearBounds).toEqual({ min: 2015, max: 2023 });
  });
});
