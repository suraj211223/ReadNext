<script>
  import PaperCard from './PaperCard.svelte';
  import { reveal } from '$lib/actions';
  import { samplePapers } from '$lib/sampleData';

  // Duplicate the list so the marquee can loop seamlessly.
  const rowA = [...samplePapers, ...samplePapers];
  const rowB = [...samplePapers.slice().reverse(), ...samplePapers.slice().reverse()];
</script>

<section id="papers" class="band band--alt">
  <div class="container">
    <p class="mono">Papers surface as you read</p>
    <h2 class="section-h2" use:reveal>A living stream of research</h2>
  </div>

  <div class="marquee" aria-hidden="true">
    <div class="track track--left">
      {#each rowA as paper, i}
        <div class="cell"><PaperCard {paper} compact /></div>
      {/each}
    </div>
  </div>
  <div class="marquee" aria-hidden="true">
    <div class="track track--right">
      {#each rowB as paper, i}
        <div class="cell"><PaperCard {paper} compact /></div>
      {/each}
    </div>
  </div>
</section>

<style>
  .marquee {
    overflow: hidden;
    margin-top: 1.5rem;
    padding: 0.5rem 0;
  }
  .track {
    display: flex;
    gap: 1.5rem;
    width: max-content;
    padding-inline: 0.75rem;
  }
  .track--left {
    animation: scroll-left 38s linear infinite;
  }
  .track--right {
    animation: scroll-right 44s linear infinite;
  }
  .marquee:hover .track {
    animation-play-state: paused;
  }
  .cell {
    width: 300px;
    flex: 0 0 auto;
  }
  @keyframes scroll-left {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
  @keyframes scroll-right {
    from {
      transform: translateX(-50%);
    }
    to {
      transform: translateX(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .track {
      animation: none;
      flex-wrap: nowrap;
      overflow-x: auto;
    }
  }
</style>
