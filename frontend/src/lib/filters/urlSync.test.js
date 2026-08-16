import { describe, it, expect, vi } from 'vitest';

// initUrlSync depends on SvelteKit's $app modules; stub them so the pure
// parse/write helpers (and the seed/mirror wiring) can be tested in jsdom.
vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ replaceState: vi.fn() }));

import { parseFilters, writeFilters, initUrlSync } from './urlSync.js';
import { replaceState } from '$app/navigation';

describe('parseFilters / writeFilters', () => {
  it('round-trips a populated filter state through the query string', () => {
    const state = { yearMin: 2019, yearMax: 2023, authors: ['John Smith', 'Ada L.'], publishers: ['IEEE'] };
    const qs = writeFilters(state).toString();
    expect(parseFilters(new URLSearchParams(qs))).toEqual(state);
  });

  it('omits inactive dimensions entirely', () => {
    expect(writeFilters({ yearMin: null, yearMax: null, authors: [], publishers: [] }).toString()).toBe('');
  });

  it('leaves unrelated query params untouched', () => {
    const base = new URLSearchParams('tab=chat&ymin=1999');
    const out = writeFilters({ yearMin: 2010, yearMax: null, authors: [], publishers: [] }, base);
    expect(out.get('tab')).toBe('chat');
    expect(out.get('ymin')).toBe('2010'); // overwritten, not duplicated
    expect(out.getAll('ymin')).toEqual(['2010']);
  });

  it('coerces a garbage year to null', () => {
    expect(parseFilters(new URLSearchParams('ymin=abc')).yearMin).toBeNull();
  });
});

describe('initUrlSync', () => {
  it('seeds the store from the URL and mirrors later changes back', () => {
    window.history.replaceState({}, '', '/chat?ymin=2019&ymax=2023&pub=IEEE');

    let current;
    const subs = [];
    const store = {
      set: (v) => (current = v),
      subscribe: (fn) => {
        subs.push(fn);
        fn(current); // emulate Svelte's immediate emit
        return () => {};
      },
    };

    const unsub = initUrlSync(store);

    // Seeded from the URL.
    expect(current).toEqual({ yearMin: 2019, yearMax: 2023, authors: [], publishers: ['IEEE'] });

    // A later change is written to the URL (first immediate emit was skipped).
    replaceState.mockClear();
    current = { yearMin: 2000, yearMax: null, authors: ['Smith'], publishers: [] };
    subs[0](current);
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState.mock.calls[0][0]).toContain('ymin=2000');
    expect(replaceState.mock.calls[0][0]).toContain('author=Smith');

    unsub();
  });
});
