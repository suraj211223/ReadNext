import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Resolve the initial theme: stored choice → prefers-color-scheme → light.
 */
function initialTheme() {
  if (!browser) return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const theme = writable(initialTheme());

if (browser) {
  theme.subscribe((value) => {
    document.documentElement.setAttribute('data-theme', value);
    try {
      localStorage.setItem('theme', value);
    } catch (e) {
      /* ignore storage failures (e.g. private mode) */
    }
  });
}

export function toggleTheme() {
  theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
}
