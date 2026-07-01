import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia; provide a minimal stub for components
// that probe prefers-color-scheme / prefers-reduced-motion.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  });
}
