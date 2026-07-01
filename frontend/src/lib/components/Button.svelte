<script>
  /** @type {'primary' | 'default'} */
  export let variant = 'default';
  /** @type {'button' | 'submit'} */
  export let type = 'button';
  export let href = null;
  export let disabled = false;
</script>

{#if href}
  <a class="btn btn--{variant}" {href} role="button" {...$$restProps}>
    <slot />
  </a>
{:else}
  <button class="btn btn--{variant}" {type} {disabled} on:click {...$$restProps}>
    <slot />
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    color: var(--text);
    box-shadow: var(--shadow);
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 1rem;
    padding: 0.85rem 1.5rem;
    cursor: pointer;
    text-decoration: none;
    transition:
      transform var(--dur-fast) var(--ease-snap),
      box-shadow var(--dur-fast) var(--ease-snap);
  }
  .btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-lg);
  }
  .btn:active {
    transform: var(--press);
    box-shadow: var(--shadow-sm);
  }
  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-sm);
  }
  .btn--primary {
    background: var(--accent);
    color: var(--accent-ink);
  }
</style>
