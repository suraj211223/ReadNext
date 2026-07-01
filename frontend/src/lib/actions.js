/**
 * Svelte action: add an `in-view` class once the element scrolls into view
 * (UI_INSTRUCTIONS §10 — IntersectionObserver, fire once, threshold 0.15).
 * Respects prefers-reduced-motion by revealing immediately.
 */
export function reveal(node, { delay = 0 } = {}) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || typeof IntersectionObserver === 'undefined') {
    node.classList.add('in-view');
    return {};
  }

  node.style.transitionDelay = `${delay}ms`;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          node.classList.add('in-view');
          observer.unobserve(node);
        }
      });
    },
    { threshold: 0.15 }
  );
  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
