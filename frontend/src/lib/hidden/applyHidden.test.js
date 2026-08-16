import { describe, it, expect } from 'vitest';
import { applyHidden, isPaperHidden } from './applyHidden.js';

const paper = (over = {}) => ({
  paperId: 'p1',
  title: 'A Paper',
  authors: [{ name: 'John Smith' }],
  year: 2020,
  venue: 'NeurIPS',
  ...over,
});

const state = (over = {}) => ({ papers: [], authors: [], ...over });

describe('isPaperHidden', () => {
  it('is false when nothing is hidden', () => {
    expect(isPaperHidden(paper(), state())).toBe(false);
  });

  it('hides a paper by exact id', () => {
    expect(isPaperHidden(paper({ paperId: 'p1' }), state({ papers: [{ id: 'p1' }] }))).toBe(true);
    expect(isPaperHidden(paper({ paperId: 'p2' }), state({ papers: [{ id: 'p1' }] }))).toBe(false);
  });

  it('hides a paper when one of its authors is hidden (normalised, exact)', () => {
    const s = state({ authors: [{ name: 'john  smith' }] });
    expect(isPaperHidden(paper({ authors: [{ name: 'John Smith' }] }), s)).toBe(true);
    // A different author is not swept up.
    expect(isPaperHidden(paper({ authors: [{ name: 'Jane Smith' }] }), s)).toBe(false);
  });

  it('does not hide a paper with no authors when only authors are hidden', () => {
    expect(isPaperHidden(paper({ authors: [] }), state({ authors: [{ name: 'John Smith' }] }))).toBe(
      false
    );
  });
});

describe('applyHidden', () => {
  it('returns a copy untouched when nothing is hidden', () => {
    const papers = [paper({ paperId: 'a' }), paper({ paperId: 'b' })];
    const out = applyHidden(papers, state());
    expect(out).toHaveLength(2);
    expect(out).not.toBe(papers);
  });

  it('removes hidden papers and papers by hidden authors', () => {
    const papers = [
      paper({ paperId: 'a', authors: [{ name: 'Ada' }] }),
      paper({ paperId: 'b', authors: [{ name: 'Bob' }] }),
      paper({ paperId: 'c', authors: [{ name: 'Cara' }] }),
    ];
    const out = applyHidden(papers, state({ papers: [{ id: 'a' }], authors: [{ name: 'Cara' }] }));
    expect(out.map((p) => p.paperId)).toEqual(['b']);
  });

  it('tolerates non-array input', () => {
    expect(applyHidden(/** @type {any} */ (null), state())).toEqual([]);
  });
});
