'use strict';

require('dotenv').config();

/**
 * Centralised, validated configuration for the API gateway.
 * The S2AG API key lives ONLY here (instructions.md §2 security rule) and is
 * never forwarded to the frontend or logged.
 */
const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Internal NLP processing node
  engineUrl: process.env.FASTAPI_URL || process.env.ENGINE_URL || 'http://localhost:8000',

  // Semantic Scholar Academic Graph
  s2ag: {
    apiKey: process.env.S2AG_API_KEY || '', // empty => unauthenticated (lower rate limit)
    baseUrl: process.env.S2AG_BASE_URL || 'https://api.semanticscholar.org/graph/v1',
    fields: 'title,abstract,authors,year,citationCount,url,venue',
    defaultLimit: 10,
  },

  // Upload guard rails
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES || `${15 * 1024 * 1024}`, 10),

  // Simple in-memory cache TTL (ms) for identical engine/search calls (Phase 4)
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || `${5 * 60 * 1000}`, 10),
};

module.exports = config;
