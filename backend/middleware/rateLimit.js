'use strict';

/**
 * Minimal in-memory rate limiter (fixed window per client IP).
 *
 * Guards the gateway — and, transitively, the Semantic Scholar API — against
 * bursts of requests that would trip S2AG's own 429 limit. Deliberately
 * dependency-free (no express-rate-limit) to keep the install footprint small.
 * Fine for a single-process dev/demo gateway; swap for a shared store if the
 * gateway is ever scaled horizontally.
 *
 * @param {{ windowMs?: number, max?: number, message?: string }} [opts]
 */
function rateLimit(opts = {}) {
  const windowMs = opts.windowMs ?? 60 * 1000;
  const max = opts.max ?? 20;
  const message =
    opts.message || 'Too many requests — slow down and try again shortly.';

  /** @type {Map<string, { count: number, reset: number }>} */
  const hits = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.connection?.remoteAddress || 'unknown';

    let entry = hits.get(key);
    if (!entry || now > entry.reset) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);

      // Opportunistically evict expired entries so the map can't grow forever.
      if (hits.size > 5000) {
        for (const [k, v] of hits) {
          if (now > v.reset) hits.delete(k);
        }
      }
    }

    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.reset - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        status: 'error',
        code: 'RATE_LIMITED',
        message,
        retryAfter,
      });
    }

    return next();
  };
}

module.exports = { rateLimit };
