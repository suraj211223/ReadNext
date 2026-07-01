'use strict';

const express = require('express');
const multer = require('multer');

const config = require('../config');
const { extractKeyphrases } = require('../services/engine');
const { searchPapers } = require('../services/s2ag');

const router = express.Router();

const ACCEPTED = new Set([
  'application/pdf',
  'application/x-pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/tiff',
  'image/bmp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (req, file, cb) => {
    if (ACCEPTED.has(file.mimetype)) return cb(null, true);
    const e = new Error(`Unsupported file type: ${file.mimetype}`);
    e.status = 415;
    e.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(e);
  },
});

/**
 * POST /api/process
 * multipart/form-data: file=<PDF|image>, maxResults?=<number>
 *
 * Orchestrates: file -> NLP engine (/extract) -> S2AG search -> JSON (§6.1).
 */
router.post('/process', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      code: 'NO_FILE',
      message: 'No file was uploaded under field "file".',
    });
  }

  const maxResults = Math.min(
    Math.max(parseInt(req.body.maxResults, 10) || 5, 1),
    config.s2ag.defaultLimit
  );

  const { buffer, originalname, mimetype } = req.file;

  // 1) Extract unified text + keyphrases from the internal engine.
  const extraction = await extractKeyphrases(buffer, originalname, mimetype);
  const keyphrases = extraction.keyphrases || [];

  // 2) Query Semantic Scholar with the gateway-held key.
  const { query, papers } = await searchPapers(keyphrases, maxResults);

  // 3) Shape the public response (instructions.md §6.1).
  return res.json({
    status: 'success',
    keyphrases,
    query,
    method: extraction.method,
    extractor: extraction.extractor,
    total_results: papers.length,
    papers,
  });
});

module.exports = router;
