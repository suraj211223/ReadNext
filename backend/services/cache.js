'use strict';

/**
 * Minimal TTL cache used to memoise identical extraction / search calls
 * (instructions.md §8 Phase 4). Not an LRU — entries simply expire after `ttlMs`.
 */
class TTLCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
    return value;
  }

  clear() {
    this.store.clear();
  }
}

module.exports = { TTLCache };
