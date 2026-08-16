import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { normalizeAuthor } from '../filters/predicates.js';

/**
 * The user's personal "hidden" list — papers and authors they never want to see
 * in results. Unlike the filter state (which lives in the URL so a view is
 * shareable), this is a persistent *personal preference*, so it is stored in
 * localStorage and reloaded on every visit. It is applied client-side as a
 * global exclusion pass on top of the normal filters (see applyHidden.js).
 *
 * Shape:
 *   { papers:  [{ id, title, ts }],   // hidden by paperId
 *     authors: [{ name, ts }] }       // hidden by (normalised) author name
 */

/** @typedef {{ id:string, title?:string, ts?:number }} HiddenPaper */
/** @typedef {{ name:string, ts?:number }} HiddenAuthor */
/** @typedef {{ papers:HiddenPaper[], authors:HiddenAuthor[] }} HiddenState */

const KEY = 'readnext:hidden:v1';

/** @returns {HiddenState} */
function empty() {
  return { papers: [], authors: [] };
}

/**
 * Read + sanitise the persisted list. Returns empty during SSR.
 * @returns {HiddenState}
 */
function load() {
  if (!browser) return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    return {
      papers: Array.isArray(parsed?.papers)
        ? parsed.papers.filter((/** @type {HiddenPaper} */ p) => p && p.id)
        : [],
      authors: Array.isArray(parsed?.authors)
        ? parsed.authors.filter((/** @type {HiddenAuthor} */ a) => a && a.name)
        : [],
    };
  } catch {
    return empty();
  }
}

function createHiddenStore() {
  const { subscribe, set, update } = writable(load());

  // Persist every change (browser only). Fired immediately with the seeded
  // value too, which is a harmless write-back of what we just read.
  if (browser) {
    subscribe((state) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        /* quota / private-mode — hiding just won't persist this session */
      }
    });
  }

  const stamp = () => Date.now();

  return {
    subscribe,
    set,

    /**
     * Hide a single paper by id. No-op if it has no id or is already hidden.
     * @param {{ paperId?:string, title?:string }} paper
     */
    hidePaper(paper) {
      const id = paper?.paperId;
      if (!id) return;
      update((s) =>
        s.papers.some((p) => p.id === id)
          ? s
          : { ...s, papers: [{ id, title: paper.title || 'Untitled', ts: stamp() }, ...s.papers] }
      );
    },

    /**
     * Hide an author by name — hides every paper they appear on.
     * @param {string} name
     */
    hideAuthor(name) {
      const key = normalizeAuthor(name);
      if (!key) return;
      update((s) =>
        s.authors.some((a) => normalizeAuthor(a.name) === key)
          ? s
          : { ...s, authors: [{ name: String(name).trim(), ts: stamp() }, ...s.authors] }
      );
    },

    /** @param {string} id */
    unhidePaper(id) {
      update((s) => ({ ...s, papers: s.papers.filter((p) => p.id !== id) }));
    },

    /** @param {string} name */
    unhideAuthor(name) {
      const key = normalizeAuthor(name);
      update((s) => ({ ...s, authors: s.authors.filter((a) => normalizeAuthor(a.name) !== key) }));
    },

    /**
     * Replace the whole list — used to undo a "Clear all".
     * @param {HiddenState} snapshot
     */
    restore(snapshot) {
      if (snapshot && Array.isArray(snapshot.papers) && Array.isArray(snapshot.authors)) {
        set({ papers: [...snapshot.papers], authors: [...snapshot.authors] });
      }
    },

    /** Clear everything, returning the previous state so the caller can offer undo. */
    clear() {
      let prev = empty();
      update((s) => {
        prev = s;
        return empty();
      });
      return prev;
    },
  };
}

export const hidden = createHiddenStore();

/** Reactive total count of hidden papers + authors. */
export const hiddenCount = derived(
  hidden,
  ($h) => ($h.papers?.length ?? 0) + ($h.authors?.length ?? 0)
);
