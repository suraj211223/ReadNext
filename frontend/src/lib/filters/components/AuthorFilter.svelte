<script>
  import { filters } from '../store.js';
  import { normalizeAuthor } from '../predicates.js';

  /** Distinct author display names derived from the current corpus. @type {string[]} */
  export let options = [];

  let query = '';
  let debounced = '';
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let timer;

  // Debounce the free-text input by ~250ms (task §12) before recomputing matches.
  function onInput(e) {
    query = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => (debounced = query), 250);
  }

  $: selected = $filters.authors;
  $: needle = normalizeAuthor(debounced);
  $: suggestions = needle
    ? options
        .filter((o) => normalizeAuthor(o).includes(needle) && !selected.includes(o))
        .slice(0, 8)
    : [];

  function add(name) {
    const v = (name ?? '').trim();
    if (!v || selected.includes(v)) return;
    filters.toggleAuthor(v);
    query = '';
    debounced = '';
  }

  function onKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Enter accepts the top suggestion, else adds the free-text value.
      add(suggestions[0] ?? query);
    }
  }
</script>

<fieldset class="author">
  <legend>Author</legend>

  <input
    type="text"
    value={query}
    on:input={onInput}
    on:keydown={onKeydown}
    placeholder="Type an author name…"
    aria-label="Filter by author (type to search, Enter to add)"
    autocomplete="off"
  />

  {#if suggestions.length}
    <ul class="suggest" role="listbox" aria-label="Author suggestions">
      {#each suggestions as s}
        <li>
          <button type="button" on:click={() => add(s)}>{s}</button>
        </li>
      {/each}
    </ul>
  {:else if debounced.trim()}
    <p class="freetext mono">
      Press Enter to filter by “{query.trim()}”
    </p>
  {/if}
</fieldset>

<style>
  .author {
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 0.75rem 0.75rem;
    margin: 0;
    position: relative;
  }
  legend {
    font-weight: 800;
    padding: 0 0.4rem;
  }
  input {
    width: 100%;
    border: 2px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    padding: 0.45rem 0.55rem;
    font-family: var(--font-body);
  }
  .suggest {
    list-style: none;
    margin: 0.4rem 0 0;
    padding: 0;
    border: 2px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--card);
  }
  .suggest button {
    display: block;
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--text);
    padding: 0.4rem 0.6rem;
    cursor: pointer;
    font: inherit;
  }
  .suggest button {
    transition:
      transform var(--dur-fast) var(--ease-snap),
      box-shadow var(--dur-fast) var(--ease-snap);
  }
  .suggest button:hover,
  .suggest button:focus-visible {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .suggest button:active {
    transform: var(--press-pill);
  }
  .freetext {
    /* Higher-contrast ink, one step larger, sentence case. */
    color: var(--text);
    font-size: 0.88rem;
    text-transform: none;
    letter-spacing: 0;
    margin: 0.4rem 0 0;
  }
</style>
