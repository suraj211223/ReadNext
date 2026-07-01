'use strict';

const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');

const config = require('../config');
const { TTLCache } = require('./cache');

const cache = new TTLCache(config.cacheTtlMs);

/**
 * Forward an uploaded file to the internal NLP engine's POST /extract and return
 * the parsed `{ text, keyphrases, method, extractor }` payload.
 *
 * Identical files (by SHA-256 of their bytes) are served from a short-lived cache.
 *
 * @param {Buffer} buffer        raw file bytes
 * @param {string} filename      original filename (drives MIME routing on the engine)
 * @param {string} mimetype      content-type of the upload
 */
async function extractKeyphrases(buffer, filename, mimetype) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const cached = cache.get(hash);
  if (cached) return cached;

  const form = new FormData();
  form.append('file', buffer, { filename: filename || 'upload', contentType: mimetype });

  let resp;
  try {
    resp = await axios.post(`${config.engineUrl}/extract`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000,
    });
  } catch (err) {
    if (err.response) {
      const detail =
        (err.response.data && (err.response.data.detail || err.response.data.message)) ||
        'Engine extraction failed';
      const e = new Error(detail);
      e.status = err.response.status === 415 || err.response.status === 422 ? err.response.status : 502;
      e.code = 'EXTRACTION_FAILED';
      throw e;
    }
    const e = new Error('NLP engine is unreachable');
    e.status = 503;
    e.code = 'ENGINE_UNAVAILABLE';
    throw e;
  }

  return cache.set(hash, resp.data);
}

module.exports = { extractKeyphrases, _cache: cache };
