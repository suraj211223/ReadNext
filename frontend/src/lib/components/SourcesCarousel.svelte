<script>
  import { onMount, onDestroy } from 'svelte';
  import Card from './Card.svelte';
  import Tag from './Tag.svelte';
  import { sources } from '$lib/sampleData';

  let index = 0;
  let paused = false;
  let timer;

  const count = sources.length;
  const next = () => (index = (index + 1) % count);
  const prev = () => (index = (index - 1 + count) % count);
  const go = (i) => (index = i);

  onMount(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer = setInterval(() => {
      if (!paused) next();
    }, 4000);
    // Even under reduced motion we still advance (UI §10), just without slide easing.
    return () => clearInterval(timer);
  });
  onDestroy(() => clearInterval(timer));

  function onKey(e) {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  }
</script>

<section id="sources" class="band">
  <div class="container">
    <p class="mono">Powered by</p>
    <h2 class="section-h2">The stack behind the recommendations</h2>

    <div
      class="carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label="Data sources and technology"
      tabindex="0"
      on:mouseenter={() => (paused = true)}
      on:mouseleave={() => (paused = false)}
      on:focusin={() => (paused = true)}
      on:focusout={() => (paused = false)}
      on:keydown={onKey}
    >
      <div class="viewport">
        <div
          class="track"
          style="--count: {count}; width: {count * 100}%; transform: translateX(calc(-{index} * 100% / {count}));"
        >
          {#each sources as s, i}
            <div class="slide" aria-hidden={i !== index}>
              <Card>
                <span class="name">{s.name}</span>
                <p class="role">{s.role}</p>
                <Tag variant="filled">{s.tag}</Tag>
              </Card>
            </div>
          {/each}
        </div>
      </div>

      <div class="controls">
        <button class="ctl" aria-label="Previous source" on:click={prev}>‹</button>
        <div class="dots" role="tablist">
          {#each sources as _, i}
            <button
              class="dot"
              class:active={i === index}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to source ${i + 1}`}
              on:click={() => go(i)}
            ></button>
          {/each}
        </div>
        <button class="ctl" aria-label="Next source" on:click={next}>›</button>
      </div>
    </div>

  </div>
</section>

<style>
  .viewport {
    overflow: hidden;
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    background: var(--card-2);
  }
  .track {
    display: flex;
    transition: transform var(--dur) var(--ease-snap);
  }
  .slide {
    flex: 0 0 calc(100% / var(--count));
    padding: 1.5rem;
    box-sizing: border-box;
  }
  .name {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.6rem;
    display: block;
    margin-bottom: 0.5rem;
  }
  .role {
    color: var(--text-muted);
    margin: 0 0 1rem;
  }
  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.25rem;
  }
  .ctl {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    color: var(--text);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-snap), box-shadow var(--dur-fast) var(--ease-snap);
  }
  .ctl:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow);
  }
  .ctl:active {
    transform: var(--press);
    box-shadow: none;
  }
  .dots {
    display: flex;
    gap: 0.5rem;
  }
  .dot {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border);
    background: var(--card);
    cursor: pointer;
    padding: 0;
  }
  .dot.active {
    background: var(--accent);
  }
  .disclaimer {
    margin-top: 1.25rem;
    color: var(--text-muted);
    opacity: 0.8;
    font-size: 0.7rem;
  }
</style>
