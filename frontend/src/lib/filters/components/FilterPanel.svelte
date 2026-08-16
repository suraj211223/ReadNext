<script>
  import { filters, filtersActive } from '../store.js';
  import YearRangeFilter from './YearRangeFilter.svelte';
  import AuthorFilter from './AuthorFilter.svelte';
  import PublisherFilter from './PublisherFilter.svelte';

  /**
   * Facets derived from the latest result set (authors, publishers, yearBounds).
   * @type {{ authors:string[], publishers:string[], yearBounds:{ min:number|null, max:number|null } }}
   */
  export let facets = { authors: [], publishers: [], yearBounds: { min: null, max: null } };
  /** Live count of papers matching the active filters in the latest result set. */
  export let matched = 0;
  /** Total papers in the latest result set (before client-side filtering). */
  export let total = 0;
  /** Whether any search has produced a result set yet. */
  export let hasResults = false;

  const thisYear = new Date().getFullYear();
  $: yearMin = facets?.yearBounds?.min ?? 1900;
  $: yearMax = facets?.yearBounds?.max ?? thisYear;
</script>

<section class="panel" aria-label="Filters">
  <header>
    <h2 class="title">
      Filters
      {#if $filtersActive}<span class="dot" aria-hidden="true"></span>{/if}
    </h2>

    <!-- Result count, announced to assistive tech (task §12 aria-live). -->
    <p class="count" role="status" aria-live="polite">
      {#if hasResults}
        {#if $filtersActive}
          Showing {matched} of {total} paper{total === 1 ? '' : 's'}
        {:else}
          {total} paper{total === 1 ? '' : 's'}
        {/if}
      {:else}
        No results yet
      {/if}
    </p>
  </header>

  <div class="body">
    <!-- Upper bound is hard-capped at the current year — you can't filter to a
         year that hasn't happened yet. -->
    <YearRangeFilter min={Math.min(1900, yearMin)} max={thisYear} />
    <AuthorFilter options={facets.authors} />
    <PublisherFilter options={facets.publishers} />

    {#if $filtersActive}
      <button type="button" class="clear" on:click={() => filters.clear()}>
        Clear all filters
      </button>
    {/if}
  </div>
</section>

<style>
  .panel {
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow-sm);
    padding: 0.6rem 0.75rem;
  }
  header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    margin-bottom: 0.75rem;
  }
  .title {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    color: var(--text);
    font-family: var(--font-display, inherit);
    font-weight: 800;
    font-size: 1.1rem;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent-ink, currentColor);
  }
  .count {
    margin: 0;
    /* Sentence case + higher-contrast ink so the live count reads clearly. */
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 0.92rem;
    text-transform: none;
    letter-spacing: 0;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .clear {
    align-self: start;
    border: 2px solid var(--border);
    background: var(--surface);
    color: var(--text);
    border-radius: var(--radius-pill);
    padding: 0.3rem 0.9rem;
    cursor: pointer;
    font-weight: 700;
    box-shadow: var(--shadow-sm);
    transition:
      transform var(--dur-fast) var(--ease-snap),
      box-shadow var(--dur-fast) var(--ease-snap);
  }
  .clear:hover {
    transform: translate(-1px, -1px);
  }
  .clear:active {
    transform: var(--press-pill);
    box-shadow: var(--shadow-pressed);
  }
</style>
