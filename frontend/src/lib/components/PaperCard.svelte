<script>
  import Card from './Card.svelte';
  import Tag from './Tag.svelte';
  import { hidden } from '$lib/hidden/store.js';
  import { showToast } from '$lib/ui/toast.js';

  /** @type {{paperId?:string,title:string,abstract?:string,authors?:{name:string}[],year?:number,citationCount?:number,venue?:string,url?:string}} */
  export let paper;
  /** compact = mini preview used in the scrolling band */
  export let compact = false;
  /** hideable = show the "⋯" menu to hide this paper / its authors (chat results) */
  export let hideable = false;

  let menuOpen = false;

  $: authorLine = (paper.authors || []).map((a) => a.name).slice(0, 3).join(', ');
  // The authors offered in the hide menu — the same few shown in the author line.
  $: menuAuthors = /** @type {string[]} */ (
    (paper.authors || []).map((a) => a?.name).filter(Boolean).slice(0, 3)
  );

  function hideThisPaper() {
    menuOpen = false;
    const id = paper.paperId;
    if (!id) return;
    hidden.hidePaper(paper);
    showToast(`Hid “${paper.title}”`, {
      actionLabel: 'Undo',
      action: () => hidden.unhidePaper(id),
    });
  }

  /** @param {string} name */
  function hideThisAuthor(name) {
    menuOpen = false;
    hidden.hideAuthor(name);
    showToast(`Hid papers by ${name}`, {
      actionLabel: 'Undo',
      action: () => hidden.unhideAuthor(name),
    });
  }
  $: cites =
    paper.citationCount != null
      ? paper.citationCount >= 1000
        ? `${Math.round(paper.citationCount / 1000)}k cites`
        : `${paper.citationCount} cites`
      : null;
</script>

<Card as="article">
  <div class="card-head">
    <h3 class="title">
      {#if paper.url}
        <a href={paper.url} target="_blank" rel="noopener noreferrer">{paper.title}</a>
      {:else}
        {paper.title}
      {/if}
    </h3>

    {#if hideable}
      <div class="card-actions">
        <button
          type="button"
          class="menu-btn"
          on:click={() => (menuOpen = !menuOpen)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title="Hide options"
          aria-label="Hide this paper or its authors"
        >⋯</button>

        {#if menuOpen}
          <!-- Click-catcher so tapping anywhere else closes the menu. -->
          <button
            type="button"
            class="backdrop"
            tabindex="-1"
            aria-hidden="true"
            on:click={() => (menuOpen = false)}
          ></button>
          <div class="menu-pop" role="menu">
            <button type="button" role="menuitem" on:click={hideThisPaper}>Hide this paper</button>
            {#each menuAuthors as name}
              <button type="button" role="menuitem" on:click={() => hideThisAuthor(name)}>
                Hide {name}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if authorLine}
    <p class="authors">{authorLine}</p>
  {/if}

  {#if !compact && paper.abstract}
    <p class="abstract">{paper.abstract}</p>
  {/if}

  <div class="meta">
    {#if paper.year}<Tag>{paper.year}</Tag>{/if}
    {#if paper.venue}<Tag wrap>{paper.venue}</Tag>{/if}
    {#if cites}<Tag>{cites}</Tag>{/if}
  </div>

  {#if paper.paperId}
    <p class="pid mono">{paper.paperId.slice(0, 12)}</p>
  {/if}
</Card>

<style>
  .card-head {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .title {
    flex: 1;
    min-width: 0;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 0;
  }
  .card-actions {
    position: relative;
    flex: none;
  }
  .menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card);
    color: var(--text);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1;
    transition:
      transform var(--dur-fast) var(--ease-snap),
      box-shadow var(--dur-fast) var(--ease-snap);
  }
  .menu-btn:hover {
    transform: translate(-1px, -1px);
  }
  .menu-btn:active {
    transform: var(--press-pill);
    box-shadow: var(--shadow-pressed);
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
    border: none;
    background: transparent;
    cursor: default;
  }
  .menu-pop {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 21;
    display: flex;
    flex-direction: column;
    min-width: 12rem;
    max-width: 16rem;
    border: var(--bw) solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .menu-pop button {
    text-align: left;
    border: none;
    border-bottom: 2px solid var(--border);
    background: transparent;
    color: var(--text);
    padding: 0.5rem 0.7rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .menu-pop button:last-child {
    border-bottom: none;
  }
  .menu-pop button:hover,
  .menu-pop button:focus-visible {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .title a {
    text-decoration: none;
  }
  .title a:hover {
    text-decoration: underline;
    text-decoration-thickness: 3px;
    text-underline-offset: 3px;
  }
  .authors {
    color: var(--text-muted);
    font-size: 0.95rem;
    margin: 0 0 0.75rem;
  }
  .abstract {
    font-size: 0.95rem;
    margin: 0 0 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pid {
    margin: 0.75rem 0 0;
    color: var(--text-muted);
    opacity: 0.7;
  }
</style>
