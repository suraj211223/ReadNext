import { writable, derived } from 'svelte/store';
import { EMPTY_FILTERS, hasActiveFilters } from './applyFilters.js';

/**
 * The active filter state — the single source of truth for the paper set the
 * chat operates on (task §12). Uses Svelte's built-in store; no new state
 * library is introduced. URL persistence is layered on in a later phase.
 */
function createFilterStore() {
  const { subscribe, set, update } = writable({ ...EMPTY_FILTERS });

  return {
    subscribe,
    set,

    /**
     * Replace the inclusive year range. Pass null to clear a bound.
     * @param {number|string|null} yearMin
     * @param {number|string|null} yearMax
     */
    setYear(yearMin, yearMax) {
      update((s) => ({ ...s, yearMin: coerceYear(yearMin), yearMax: coerceYear(yearMax) }));
    },

    /**
     * Toggle a single author selection (stored as the original display string).
     * @param {string} name
     */
    toggleAuthor(name) {
      update((s) => ({ ...s, authors: toggle(s.authors, name) }));
    },

    /**
     * Toggle a single publisher (venue) selection.
     * @param {string} name
     */
    togglePublisher(name) {
      update((s) => ({ ...s, publishers: toggle(s.publishers, name) }));
    },

    /**
     * Remove one selected value from whichever dimension it belongs to.
     * @param {'authors'|'publishers'} dimension
     * @param {string} value
     */
    remove(dimension, value) {
      update((s) => ({ ...s, [dimension]: (s[dimension] || []).filter((v) => v !== value) }));
    },

    /**
     * Clear one dimension back to neutral.
     * @param {'year'|'authors'|'publishers'} dimension
     */
    clearDimension(dimension) {
      update((s) =>
        dimension === 'year'
          ? { ...s, yearMin: null, yearMax: null }
          : { ...s, [dimension]: [] }
      );
    },

    /** Reset every dimension — restores the full corpus / original chat behaviour. */
    clear() {
      set({ ...EMPTY_FILTERS });
    },
  };
}

/**
 * @param {string[]} list
 * @param {string} value
 * @returns {string[]}
 */
function toggle(list, value) {
  const arr = list || [];
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

/**
 * @param {number|string|null} v
 * @returns {number|null}
 */
function coerceYear(v) {
  if (v == null || v === '') return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : null;
}

export const filters = createFilterStore();

/** Convenience: reactive boolean for "is anything filtering right now". */
export const filtersActive = derived(filters, ($f) => hasActiveFilters($f));
