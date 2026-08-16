<script>
  import { filters } from '../store.js';

  /** Distinct publisher (venue) values derived from the current corpus. @type {string[]} */
  export let options = [];

  $: selected = $filters.publishers;
</script>

<fieldset class="publisher">
  <legend>Publisher</legend>

  {#if options.length}
    <div class="chips" role="group" aria-label="Filter by publisher">
      {#each options as opt}
        <label class="chip" class:on={selected.includes(opt)}>
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            on:change={() => filters.togglePublisher(opt)}
          />
          <span>{opt}</span>
        </label>
      {/each}
    </div>
  {:else}
    <div class="empty-box" role="note">
      <span class="pixels" aria-hidden="true">▚▚ ░░ ▚▚</span>
      <p class="empty">No publishers in the current results yet.</p>
    </div>
  {/if}
</fieldset>

<style>
  .publisher {
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 0.75rem 0.75rem;
    margin: 0;
  }
  legend {
    font-weight: 800;
    padding: 0 0.4rem;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    max-height: 8.5rem;
    overflow-y: auto;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 0.2rem 0.6rem;
    cursor: pointer;
    font-size: 0.85rem;
    background: var(--surface);
    transition:
      transform var(--dur-fast) var(--ease-snap),
      box-shadow var(--dur-fast) var(--ease-snap);
  }
  .chip.on {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .chip:active {
    transform: var(--press-pill);
    box-shadow: var(--shadow-pressed);
  }
  .chip input {
    accent-color: currentColor;
  }
  /* Empty state: dashed placeholder box with a pixel-style motif instead of a
     bare line of capitalised text. */
  .empty-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    border: var(--border-dash);
    border-radius: var(--radius-sm);
    padding: 0.9rem 0.75rem;
    text-align: center;
  }
  .pixels {
    font-family: var(--font-mono);
    font-size: 1.05rem;
    letter-spacing: 0.15em;
    color: var(--text);
    line-height: 1;
  }
  .empty {
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    text-transform: none;
    letter-spacing: 0;
    margin: 0;
  }
</style>
