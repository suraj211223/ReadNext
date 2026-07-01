<script>
  export let as = 'div';
  export let interactive = true;
</script>

<svelte:element this={as} class="card" class:interactive {...$$restProps}>
  <slot />
</svelte:element>

<style>
  .card {
    background: var(--card);
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 1.5rem;
    transition:
      transform var(--dur) var(--ease-snap),
      box-shadow var(--dur) var(--ease-snap);
  }
  .card.interactive:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-lg);
  }
</style>
