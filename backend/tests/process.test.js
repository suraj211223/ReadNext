'use strict';

const request = require('supertest');
const nock = require('nock');

const config = require('../config');
const { createApp } = require('../app');
const engine = require('../services/engine');
const s2ag = require('../services/s2ag');

const app = createApp();
const ENGINE = config.engineUrl;
const S2AG = config.s2ag.baseUrl;

const PDF_BYTES = Buffer.from('%PDF-1.7\nfake pdf body for testing\n%%EOF');

function mockEngine(keyphrases = ['transformer attention', 'bert language model']) {
  return nock(ENGINE)
    .post('/extract')
    .reply(200, {
      text: 'unified raw text',
      keyphrases,
      method: 'pymupdf',
      extractor: 'keybert',
      raw_text_length: 16,
    });
}

function mockS2AG(papers = [{ paperId: 'abc', title: 'Attention Is All You Need' }]) {
  return nock(S2AG).get('/paper/search').query(true).reply(200, { data: papers });
}

describe('POST /api/process', () => {
  beforeEach(() => {
    engine._cache.clear();
    s2ag._cache.clear();
    nock.cleanAll();
  });
  afterAll(() => nock.restore());

  it('orchestrates engine + S2AG into the response schema', async () => {
    mockEngine();
    mockS2AG();

    const res = await request(app)
      .post('/api/process')
      .attach('file', PDF_BYTES, { filename: 'paper.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.keyphrases).toContain('transformer attention');
    expect(res.body.papers).toHaveLength(1);
    expect(res.body.papers[0].title).toBe('Attention Is All You Need');
    expect(res.body.total_results).toBe(1);
  });

  it('rejects a request with no file (400)', async () => {
    const res = await request(app).post('/api/process');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('NO_FILE');
  });

  it('rejects an unsupported file type (415)', async () => {
    const res = await request(app)
      .post('/api/process')
      .attach('file', Buffer.from('hello'), { filename: 'n.txt', contentType: 'text/plain' });
    expect(res.status).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('propagates engine unavailability as 503', async () => {
    nock(ENGINE).post('/extract').replyWithError({ code: 'ECONNREFUSED' });
    const res = await request(app)
      .post('/api/process')
      .attach('file', PDF_BYTES, { filename: 'p.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('ENGINE_UNAVAILABLE');
  });

  it('does not forward the S2AG api key to the client', async () => {
    mockEngine();
    mockS2AG();
    const res = await request(app)
      .post('/api/process')
      .attach('file', PDF_BYTES, { filename: 'p.pdf', contentType: 'application/pdf' });
    expect(JSON.stringify(res.body)).not.toMatch(/api[_-]?key/i);
  });

  it('clamps maxResults to the configured ceiling', async () => {
    mockEngine();
    let capturedLimit;
    nock(S2AG)
      .get('/paper/search')
      .query((q) => {
        capturedLimit = q.limit;
        return true;
      })
      .reply(200, { data: [] });

    await request(app)
      .post('/api/process')
      .field('maxResults', '999')
      .attach('file', PDF_BYTES, { filename: 'p.pdf', contentType: 'application/pdf' });

    expect(Number(capturedLimit)).toBeLessThanOrEqual(config.s2ag.defaultLimit);
  });

  it('searches S2AG with individual content words, but returns the full phrases', async () => {
    const many = [
      'reticular collagen network',
      'radiopaque dye injected',
      'the great care', // stop-words ("the", "great") must be dropped
    ];
    mockEngine(many);
    let capturedQuery;
    nock(S2AG)
      .get('/paper/search')
      .query((q) => {
        capturedQuery = q.query;
        return true;
      })
      .reply(200, { data: [] });

    const res = await request(app)
      .post('/api/process')
      .attach('file', PDF_BYTES, { filename: 'p.pdf', contentType: 'application/pdf' });

    // Phrases are flattened to deduped, lower-cased content words (max 6);
    // stop-words like "the"/"great" and duplicates are stripped.
    expect(capturedQuery).toBe('reticular collagen network radiopaque dye injected');
    // ...yet the full phrase set is still surfaced to the client for display.
    expect(res.body.keyphrases).toEqual(many);
  });

  it('health endpoint responds', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
