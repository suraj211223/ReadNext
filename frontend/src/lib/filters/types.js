/**
 * Shared JSDoc typedefs for the filter layer (task §12).
 * This module exports nothing at runtime — it exists so the other filter
 * modules can `import('./types.js').Paper` etc. under checkJs.
 */

/**
 * @typedef {Object} Author
 * @property {string} name
 * @property {string} [authorId]
 */

/**
 * A paper as shaped by the gateway (backend/services/s2ag.js → normalizePaper).
 * @typedef {Object} Paper
 * @property {string} [paperId]
 * @property {string} [title]
 * @property {string|null} [abstract]
 * @property {Array<Author|string>} [authors]
 * @property {number|null} [year]
 * @property {number} [citationCount]
 * @property {string|null} [url]
 * @property {string|null} [venue]
 */

/**
 * @typedef {Object} FilterState
 * @property {number|null} yearMin
 * @property {number|null} yearMax
 * @property {string[]} authors
 * @property {string[]} publishers
 */

export {};
