<script>
  import { hidden, hiddenCount } from './store.js';
  import { showToast } from '../ui/toast.js';

  // Collapsed by default — it's a secondary, occasional-use panel.
  let open = false;

  /** @param {{ id:string, title?:string }} p */
  function unhidePaper(p) {
    hidden.unhidePaper(p.id);
    showToast(`Restored “${p.title}”`, {
      actionLabel: 'Undo',
      action: () => hidden.hidePaper({ paperId: p.id, title: p.title }),
    });
  }

  /** @param {{ name:string }} a */
  function unhideAuthor(a) {
    hidden.unhideAuthor(a.name);
    showToast(`Restored ${a.name}`, {
      actionLabel: 'Undo',
      action: () => hidden.hideAuthor(a.name),
    });
  }

  function clearAll() {
    const prev = hidden.clear();
    showToast('Cleared your hidden list', {
      actionLabel: 'Undo',
      action: () => hidden.restore(prev),
    });
  }
</script>

<section class="panel" aria-label="Hidden papers and authors">
  <header>
    <button
      type="button"
      class="toggle"
      on:click={() => (open = !open)}
      aria-expanded={open}
      aria-controls="hidden-body"
    >
      <span class="caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
      Hidden
      <span class="badge">{$hiddenCount}</span>
    </button>
  </header>

  {#if open}
    <div class="body" id="hidden-body">
      {#if $hiddenCount === 0}
        <div class="empty-box" role="note">
          <span class="pixels" aria-hidden="true">▚▚ ░░ ▚▚</span>
          <p class="empty">
            Nothing hidden yet. Use the “⋯” menu on any result to hide a paper or author.
          </p>
        </div>
      {:else}
        {#if $hidden.papers.length}
          <div class="group">
            <p class="group-h mono">Papers</p>
            <ul class="list">
              {#each $hidden.papers as p (p.id)}
                <li class="item">
                  <span class="label" title={p.title}>{p.title}</span>
                  <button
                    type="button"
                    class="x"
                    on:click={() => unhidePaper(p)}
                    aria-label={`Un-hide ${p.title}`}>✕</button
                  >
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if $hidden.authors.length}
          <div class="group">
            <p class="group-h mono">Authors</p>
            <ul class="list">
              {#each $hidden.authors as a (a.name)}
                <li class="item">
                  <span class="label" title={a.name}>{a.name}</span>
                  <button
                    type="button"
                    class="x"
                    on:click={() => unhideAuthor(a)}
                    aria-label={`Un-hide ${a.name}`}>✕</button
                  >
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <button type="button" class="clear" on:click={clearAll}>Clear all hidden</button>
      {/if}
    </div>
  {/if}
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
    align-items: center;
    justify-content: space-between;
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: none;
    background: transparent;
    color: var(--text);
    font-family: var(--font-display, inherit);
    font-weight: 800;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0.2rem 0;
  }
  .badge {
    border: 2px solid var(--border);
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 0.8rem;
    font-weight: 800;
    min-width: 1.4rem;
    text-align: center;
    padding: 0.05rem 0.4rem;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .group-h {
    margin: 0 0 0.35rem;
    color: var(--text);
    text-transform: none;
    letter-spacing: 0;
    font-size: 0.82rem;
    font-weight: 700;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    padding: 0.25rem 0.3rem 0.25rem 0.5rem;
  }
  .label {
    flex: 1;
    min-width: 0;
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .x {
    flex: none;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card);
    color: var(--text);
    cursor: pointer;
    font-weight: 800;
    line-height: 1;
    padding: 0.1rem 0.4rem;
    transition:
      transform var(--dur-fast) var(--ease-snap),
      box-shadow var(--dur-fast) var(--ease-snap);
  }
  .x:active {
    transform: var(--press-pill);
    box-shadow: var(--shadow-pressed);
  }
  .empty-box {
    display: flex;
    flex-direction: column;
    align-items: center;
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
    font-size: 0.82rem;
    text-transform: none;
    letter-spacing: 0;
    margin: 0;
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
