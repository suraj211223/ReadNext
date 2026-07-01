<script>
  import PaperCard from './PaperCard.svelte';
  /** @type {object[]} */
  export let papers = [];
</script>

<div class="grid">
  {#each papers as paper (paper.paperId || paper.title)}
    <PaperCard {paper} />
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
</style>
