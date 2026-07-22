'use strict';

const nock = require('nock');
const config = require('../config');
const s2ag = require('../services/s2ag');

const BASE = config.s2ag.baseUrl;

describe('s2ag service', () => {
  beforeEach(() => {
    s2ag._cache.clear();
    nock.cleanAll();
  });
  afterAll(() => nock.restore());

  describe('buildQuery', () => {
    it('joins keyphrases with spaces and trims blanks', () => {
      expect(s2ag.buildQuery(['transformer attention', ' bert ', ''])).toBe(
        'transformer attention bert'
      );
    });
    it('returns empty string for no keyphrases', () => {
      expect(s2ag.buildQuery([])).toBe('');
    });
  });

  describe('normalizePaper', () => {
    it('fills defaults and synthesises url from paperId', () => {
      const p = s2ag.normalizePaper({ paperId: 'abc', title: 'T' });
      expect(p.url).toContain('abc');
      expect(p.authors).toEqual([]);
      expect(p.citationCount).toBe(0);
    });
  });

  describe('searchPapers', () => {
    it('returns normalised papers from S2AG', async () => {
      nock(BASE)
        .get('/paper/search')
        .query(true)
        .reply(200, {
          data: [
            {
              paperId: 'abc123',
              title: 'Attention Is All You Need',
              abstract: 'We propose the Transformer...',
              authors: [{ authorId: '1', name: 'Ashish Vaswani' }],
              year: 2017,
              citationCount: 98423,
              url: 'https://www.semanticscholar.org/paper/abc123',
              venue: 'NeurIPS',
            },
          ],
        });

      const { query, papers } = await s2ag.searchPapers(['transformer attention'], 5);
      expect(query).toBe('transformer attention');
      expect(papers).toHaveLength(1);
      expect(papers[0].title).toBe('Attention Is All You Need');
      expect(papers[0].authors[0].name).toBe('Ashish Vaswani');
    });

    it('short-circuits with empty result when no keyphrases', async () => {
      const res = await s2ag.searchPapers([], 5);
      expect(res).toEqual({ query: '', papers: [] });
    });

    it('drops malformed papers without paperId', async () => {
      nock(BASE)
        .get('/paper/search')
        .query(true)
        .reply(200, { data: [{ title: 'no id' }, { paperId: 'x', title: 'ok' }] });
      const { papers } = await s2ag.searchPapers(['deep learning'], 5);
      expect(papers).toHaveLength(1);
      expect(papers[0].paperId).toBe('x');
    });

    it('maps a persistent 429 to a rate-limit error after exhausting retries', async () => {
      // Retry-After: 0 keeps the retries instant so the test stays fast.
      nock(BASE)
        .get('/paper/search')
        .query(true)
        .times(4) // initial call + 3 retries
        .reply(429, {}, { 'Retry-After': '0' });
      await expect(s2ag.searchPapers(['nlp'], 5)).rejects.toMatchObject({
        status: 429,
        code: 'S2AG_SEARCH_FAILED',
      });
    });

    it('retries a transient 429 and succeeds', async () => {
      const scope = nock(BASE)
        .get('/paper/search')
        .query(true)
        .reply(429, {}, { 'Retry-After': '0' }) // first attempt: rate-limited
        .get('/paper/search')
        .query(true)
        .reply(200, { data: [{ paperId: 'r1', title: 'Recovered' }] }); // retry: ok

      const { papers } = await s2ag.searchPapers(['transient limit'], 5);
      expect(papers).toHaveLength(1);
      expect(papers[0].title).toBe('Recovered');
      expect(scope.isDone()).toBe(true); // both interceptors consumed
    });

    it('caches identical queries (one upstream call)', async () => {
      const scope = nock(BASE)
        .get('/paper/search')
        .query(true)
        .once()
        .reply(200, { data: [{ paperId: 'p1', title: 'Cached' }] });

      await s2ag.searchPapers(['cache me'], 5);
      const second = await s2ag.searchPapers(['cache me'], 5);
      expect(second.papers[0].title).toBe('Cached');
      expect(scope.isDone()).toBe(true); // only the single mocked call was consumed
    });
  });
});
