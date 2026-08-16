import { writable } from 'svelte/store';

/**
 * A single transient toast (snackbar) at a time. Used for undoable actions like
 * hiding a paper/author: the toast carries an optional action button.
 *
 * @typedef {{ message:string, actionLabel:string|null, action:(()=>void)|null }} Toast
 */

/** @type {import('svelte/store').Writable<Toast|null>} */
export const toast = writable(null);

/** @type {ReturnType<typeof setTimeout>|undefined} */
let timer;

/**
 * Show a toast, replacing any current one. Auto-dismisses after `duration` ms
 * (pass 0 to keep it until dismissed).
 * @param {string} message
 * @param {{ actionLabel?:string, action?:()=>void, duration?:number }} [opts]
 */
export function showToast(message, opts = {}) {
  const { actionLabel = null, action = null, duration = 6000 } = opts;
  clearTimeout(timer);
  toast.set({ message, actionLabel, action });
  if (duration > 0) timer = setTimeout(() => toast.set(null), duration);
}

export function dismissToast() {
  clearTimeout(timer);
  toast.set(null);
}
