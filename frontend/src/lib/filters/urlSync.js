import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';

/**
 * URL-query-param persistence for the filter state (task §12): filtered views
 * are shareable and survive a page reload. Params are preferred over local
 * storage exactly so a URL can be copied and reopened elsewhere.
 *
 * Encoding:
 *   ymin, ymax   inclusive year bounds (integers)
 *   author       one param per selected author (repeatable)
 *   pub          one param per selected publisher (repeatable)
 */

/** @typedef {import('./types.js').FilterState} FilterState */

const KEYS = ['ymin', 'ymax', 'author', 'pub'];

/**
 * @param {number|string|null} v
 * @returns {number|null}
 */
function toYear(v) {
  if (v == null || v === '') return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a FilterState out of URL search params.
 * @param {URLSearchParams} params
 * @returns {FilterState}
 */
export function parseFilters(params) {
  return {
    yearMin: toYear(params.get('ymin')),
    yearMax: toYear(params.get('ymax')),
    authors: params.getAll('author').filter(Boolean),
    publishers: params.getAll('pub').filter(Boolean),
  };
}

/**
 * Fold a FilterState onto an existing URLSearchParams instance, leaving any
 * unrelated params untouched. Returns the same instance for convenience.
 * @param {FilterState} state
 * @param {URLSearchParams} [base]
 * @returns {URLSearchParams}
 */
export function writeFilters(state, base = new URLSearchParams()) {
  for (const k of KEYS) base.delete(k);
  if (state.yearMin != null) base.set('ymin', String(state.yearMin));
  if (state.yearMax != null) base.set('ymax', String(state.yearMax));
  for (const a of state.authors || []) base.append('author', a);
  for (const p of state.publishers || []) base.append('pub', p);
  return base;
}

/**
 * Two-way bind a filter store to the URL. Seeds the store from the current URL,
 * then mirrors every later change back into the query string (via SvelteKit's
 * shallow `replaceState`, so no navigation / load re-run). No-op during SSR.
 *
 * @param {{ set:(v:FilterState)=>void, subscribe:(fn:(v:FilterState)=>void)=>()=>void }} store
 * @returns {() => void} unsubscribe
 */
export function initUrlSync(store) {
  if (!browser) return () => {};

  // 1) Seed from the URL so a reloaded / shared link restores the view.
  store.set(parseFilters(new URLSearchParams(window.location.search)));

  // 2) Mirror subsequent changes back to the URL. Skip the first (immediate)
  //    emit, which is just the value we seeded above.
  let first = true;
  return store.subscribe((state) => {
    if (first) {
      first = false;
      return;
    }
    const params = writeFilters(state, new URLSearchParams(window.location.search));
    const qs = params.toString();
    replaceState(`${window.location.pathname}${qs ? `?${qs}` : ''}`, {});
  });
}
