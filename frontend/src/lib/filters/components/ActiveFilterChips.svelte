<script>
  import { filters, filtersActive } from '../store.js';

  // Flatten the active state into a list of removable chips so the user always
  // knows what the assistant can currently "see" (task §12).
  $: chips = buildChips($filters);

  function buildChips(s) {
    const out = [];
    if (s.yearMin != null || s.yearMax != null) {
      const label =
        s.yearMin != null && s.yearMax != null
          ? `${s.yearMin}–${s.yearMax}`
          : s.yearMin != null
            ? `≥ ${s.yearMin}`
            : `≤ ${s.yearMax}`;
      out.push({ dim: 'year', value: null, label: `Year ${label}` });
    }
    for (const a of s.authors || []) out.push({ dim: 'authors', value: a, label: `Author: ${a}` });
    for (const p of s.publishers || [])
      out.push({ dim: 'publishers', value: p, label: `Publisher: ${p}` });
    return out;
  }

  function removeChip(chip) {
    if (chip.dim === 'year') filters.clearDimension('year');
    else filters.remove(chip.dim, chip.value);
  }
</script>

{#if $filtersActive}
  <div class="chiprow" aria-label="Active filters">
    {#each chips as chip}
      <span class="chip">
        {chip.label}
        <button
          type="button"
          class="x"
          on:click={() => removeChip(chip)}
          aria-label={`Remove filter ${chip.label}`}>✕</button
        >
      </span>
    {/each}
    <button type="button" class="clear" on:click={() => filters.clear()}>Clear all</button>
  </div>
{/if}

<style>
  .chiprow {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
    /* Badges and Clear-all read from the left, flush with the search bar's
       inner edge. */
    justify-content: flex-start;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 0.15rem 0.2rem 0.15rem 0.6rem;
    font-size: 0.86rem;
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 700;
    transition:
      transform var(--dur-fast) var(--ease-snap),
      box-shadow var(--dur-fast) var(--ease-snap);
  }
  .chip:active {
    transform: var(--press-pill);
    box-shadow: var(--shadow-pressed);
  }
  .chip .x {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-weight: 800;
    line-height: 1;
    padding: 0 0.35rem;
  }
  .clear {
    border: 2px solid var(--border);
    background: var(--card);
    color: var(--text);
    border-radius: var(--radius-pill);
    padding: 0.15rem 0.7rem;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.86rem;
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
