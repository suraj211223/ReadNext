'use strict';

/**
 * Cross-tier integration test (Block 6).
 *
 * Spawns the REAL FastAPI engine (uvicorn) and drives the full gateway chain:
 *   gateway /api/process -> engine /extract (real OCR/PDF + KeyBERT/RAKE) -> S2AG (mocked).
 *
 * Only Semantic Scholar is mocked (no network / no API key needed). The engine
 * runs as a genuine separate process, so this exercises the actual HTTP boundary.
 *
 * Skips automatically if the engine virtualenv isn't present.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const nock = require('nock');
const request = require('supertest');

const ENGINE_PORT = 8123;
const ENGINE_URL = `http://127.0.0.1:${ENGINE_PORT}`;
const PROC_DIR = path.resolve(__dirname, '../../processing');
const VENV_PY = path.join(PROC_DIR, 'venv/bin/python');
const FIXTURE_PDF = path.join(PROC_DIR, 'tests/fixtures/sample.pdf');

const hasEngine = fs.existsSync(VENV_PY) && fs.existsSync(FIXTURE_PDF);
const describeMaybe = hasEngine ? describe : describe.skip;

function waitForHealth(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(`${url}/health`, (res) => {
          res.resume();
          if (res.statusCode === 200) return resolve();
          retry();
        })
        .on('error', retry);
    };
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error('engine did not become healthy'));
      setTimeout(tick, 500);
    };
    tick();
  });
}

describeMaybe('end-to-end: gateway -> real engine -> mocked S2AG', () => {
  let engine;
  let app;
  let config;

  beforeAll(async () => {
    // Point the gateway at the test engine BEFORE requiring config/app.
    process.env.FASTAPI_URL = ENGINE_URL;
    process.env.NODE_ENV = 'test';
    process.env.S2AG_API_KEY = '';

    engine = spawn(
      VENV_PY,
      ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(ENGINE_PORT)],
      { cwd: PROC_DIR, stdio: 'ignore' }
    );

    await waitForHealth(ENGINE_URL, 60000);

    config = require('../config');
    app = require('../app').createApp();

    // Let localhost (the engine) through; intercept only Semantic Scholar.
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  }, 70000);

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    if (engine) engine.kill('SIGTERM');
  });

  it('returns real keyphrases and mocked papers for a PDF upload', async () => {
    nock(config.s2ag.baseUrl)
      .get('/paper/search')
      .query(true)
      .reply(200, {
        data: [
          {
            paperId: 'abc123',
            title: 'Attention Is All You Need',
            authors: [{ authorId: '1', name: 'Ashish Vaswani' }],
            year: 2017,
            citationCount: 98423,
            venue: 'NeurIPS'
          }
        ]
      });

    const res = await request(app)
      .post('/api/process')
      .attach('file', FIXTURE_PDF, { contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    // Real engine produced 5-7 keyphrases from the Transformer abstract.
    expect(res.body.keyphrases.length).toBeGreaterThanOrEqual(5);
    expect(res.body.keyphrases.length).toBeLessThanOrEqual(7);
    expect(res.body.keyphrases.join(' ').toLowerCase()).toMatch(/transformer|attention|language|bert/);
    expect(['pymupdf', 'pdfplumber']).toContain(res.body.method);
    // Mocked S2AG paper flowed back through.
    expect(res.body.papers[0].title).toBe('Attention Is All You Need');
  }, 60000);
});
