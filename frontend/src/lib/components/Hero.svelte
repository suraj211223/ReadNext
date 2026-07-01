<script>
  import { onMount } from 'svelte';
  import Button from './Button.svelte';

  let mounted = false;
  let mx = 0;
  let my = 0;

  const headline = 'From the paragraph in front of you to the five papers you should read next.';
  const words = headline.split(' ');

  onMount(() => {
    mounted = true;
  });

  function onMouseMove(e) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mx = (e.clientX - cx) / cx;
    my = (e.clientY - cy) / cy;
  }
</script>

<svelte:window on:mousemove={onMouseMove} />

<header id="top" class="hero">
  <div class="container hero-grid">
    <div class="hero-text">
      <p class="mono kicker" class:in={mounted}>NLP · S2AG · REAL-TIME</p>
      <h1 class="title">
        {#each words as word, i}
          <span class="word-mask"
            ><span
              class="word"
              class:in={mounted}
              style="transition-delay: {60 * i}ms">{word}&nbsp;</span
            ></span
          >
        {/each}
      </h1>
      <p class="subhead" class:in={mounted}>
        Upload a PDF or a screenshot — get the five papers you should read next, ranked by
        Semantic Scholar.
      </p>
      <div class="cta" class:in={mounted}>
        <Button variant="primary" href="#demo">Try it now</Button>
        <Button href="#how">See how it works</Button>
      </div>
    </div>

    <div class="hero-art" aria-hidden="true">
      <div class="shape circle" style="transform: translate({mx * -18}px, {my * -18}px)"></div>
      <div class="shape square" style="transform: translate({mx * 24}px, {my * 16}px)"></div>
      <div class="paper p1" style="transform: rotate(-6deg) translate({mx * 12}px, {my * 12}px)">
        <div class="pl"></div><div class="pl short"></div><div class="pl"></div>
      </div>
      <div class="paper p2" style="transform: rotate(5deg) translate({mx * -14}px, {my * -10}px)">
        <div class="pl"></div><div class="pl"></div><div class="pl short"></div>
      </div>
    </div>
  </div>
</header>

<style>
  .hero {
    padding: clamp(7rem, 14vw, 11rem) 0 clamp(3rem, 8vw, 6rem);
    overflow: hidden;
  }
  .hero-grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 2rem;
    align-items: center;
  }
  .kicker {
    color: var(--text-muted);
    opacity: 0;
    transform: translateY(8px);
    transition: opacity var(--dur-slow) var(--ease-snap), transform var(--dur-slow) var(--ease-snap);
  }
  .kicker.in {
    opacity: 1;
    transform: none;
  }
  .title {
    font-size: clamp(3rem, 8vw, 7rem);
    font-weight: 900;
    line-height: 0.95;
    margin: 1rem 0 1.5rem;
  }
  .word-mask {
    display: inline-block;
    overflow: hidden;
    vertical-align: bottom;
  }
  .word {
    display: inline-block;
    transform: translateY(110%);
    transition: transform var(--dur-slow) var(--ease-snap);
  }
  .word.in {
    transform: translateY(0);
  }
  .subhead {
    font-size: 1.15rem;
    max-width: 48ch;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity var(--dur-slow) var(--ease-snap) 360ms;
  }
  .subhead.in {
    opacity: 1;
  }
  .cta {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    flex-wrap: wrap;
    opacity: 0;
    transform: scale(0.96);
    transition: opacity var(--dur) var(--ease-snap) 460ms, transform var(--dur) var(--ease-snap) 460ms;
  }
  .cta.in {
    opacity: 1;
    transform: none;
  }

  .hero-art {
    position: relative;
    height: 360px;
  }
  .shape {
    position: absolute;
    border: var(--bw) solid var(--border);
    box-shadow: var(--shadow);
    background: var(--accent);
  }
  .circle {
    width: 120px;
    height: 120px;
    border-radius: 999px;
    top: 10%;
    right: 16%;
  }
  .square {
    width: 90px;
    height: 90px;
    border-radius: var(--radius);
    bottom: 8%;
    left: 6%;
  }
  .paper {
    position: absolute;
    width: 180px;
    height: 230px;
    background: var(--card);
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }
  .p1 {
    top: 6%;
    left: 18%;
  }
  .p2 {
    bottom: 4%;
    right: 8%;
  }
  .pl {
    height: 12px;
    background: var(--surface-2);
    border: 2px solid var(--border);
    border-radius: 6px;
  }
  .pl.short {
    width: 60%;
  }

  @media (max-width: 900px) {
    .hero-grid {
      grid-template-columns: 1fr;
    }
    .hero-art {
      display: none;
    }
  }
</style>
