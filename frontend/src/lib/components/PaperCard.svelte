<script>
  import Card from './Card.svelte';
  import Tag from './Tag.svelte';

  /** @type {{paperId?:string,title:string,abstract?:string,authors?:{name:string}[],year?:number,citationCount?:number,venue?:string,url?:string}} */
  export let paper;
  /** compact = mini preview used in the scrolling band */
  export let compact = false;

  $: authorLine = (paper.authors || []).map((a) => a.name).slice(0, 3).join(', ');
  $: cites =
    paper.citationCount != null
      ? paper.citationCount >= 1000
        ? `${Math.round(paper.citationCount / 1000)}k cites`
        : `${paper.citationCount} cites`
      : null;
</script>

<Card as="article">
  <h3 class="title">
    {#if paper.url}
      <a href={paper.url} target="_blank" rel="noopener noreferrer">{paper.title}</a>
    {:else}
      {paper.title}
    {/if}
  </h3>

  {#if authorLine}
    <p class="authors">{authorLine}</p>
  {/if}

  {#if !compact && paper.abstract}
    <p class="abstract">{paper.abstract}</p>
  {/if}

  <div class="meta">
    {#if paper.year}<Tag>{paper.year}</Tag>{/if}
    {#if paper.venue}<Tag>{paper.venue}</Tag>{/if}
    {#if cites}<Tag>{cites}</Tag>{/if}
  </div>

  {#if paper.paperId}
    <p class="pid mono">{paper.paperId.slice(0, 12)}</p>
  {/if}
</Card>

<style>
  .title {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 0.5rem;
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
