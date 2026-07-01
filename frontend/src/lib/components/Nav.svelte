<script>
  import ThemeToggle from './ThemeToggle.svelte';
  import Button from './Button.svelte';

  let scrolled = false;
  let revealed = false;
  let mobileOpen = false;

  const onScroll = () => {
    scrolled = window.scrollY > 24;
    if (scrolled) mobileOpen = false;
  };

  $: expanded = !scrolled || revealed;

  const links = [
    { href: '#papers', label: 'Community' },
    { href: '#how', label: 'How it works' },
    { href: '#sources', label: 'Sources' },
    { href: '#demo', label: 'Demo' }
  ];
</script>

<svelte:window on:scroll={onScroll} />

<nav class="nav" class:expanded class:collapsed={!expanded} aria-label="Primary">
  {#if expanded}
    <div class="nav-inner">
      <a class="logo" href="#top">
        <span class="logo-glyph">◳</span>
        <span class="logo-text">ReadNext</span>
      </a>
      <ul class="links">
        {#each links as l}
          <li><a href={l.href}>{l.label}</a></li>
        {/each}
      </ul>
      <div class="actions">
        <ThemeToggle />
        <Button variant="primary">Sign in</Button>
      </div>
      <button
        class="burger"
        aria-label="Open menu"
        aria-expanded={mobileOpen}
        on:click={() => (mobileOpen = !mobileOpen)}>≡</button
      >
    </div>
  {:else}
    <button class="nav-dot" aria-label="Open menu" on:click={() => (revealed = true)}>
      ◳
    </button>
  {/if}
</nav>

{#if mobileOpen}
  <div class="sheet">
    {#each links as l}
      <a href={l.href} on:click={() => (mobileOpen = false)}>{l.label}</a>
    {/each}
    <div class="sheet-actions">
      <ThemeToggle />
      <Button variant="primary">Sign in</Button>
    </div>
  </div>
{/if}

<style>
  .nav {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    border: var(--bw) solid var(--border);
    background: var(--card);
    box-shadow: var(--shadow);
    overflow: hidden;
    transition:
      width var(--dur) var(--ease-snap),
      height var(--dur) var(--ease-snap),
      border-radius var(--dur) var(--ease-snap),
      padding var(--dur) var(--ease-snap);
  }
  .nav.expanded {
    width: min(1160px, 92vw);
    border-radius: var(--radius);
    padding: 0.5rem 1rem;
  }
  .nav.collapsed {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    padding: 0;
  }
  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1.25rem;
    text-decoration: none;
  }
  .logo-glyph {
    font-size: 1.4rem;
  }
  .links {
    display: flex;
    gap: 1.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .links a {
    text-decoration: none;
    font-weight: 500;
  }
  .links a:hover {
    text-decoration: underline;
    text-decoration-thickness: 3px;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .nav-dot {
    width: 56px;
    height: 56px;
    border: none;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 1.5rem;
    cursor: pointer;
  }
  .burger {
    display: none;
    background: none;
    border: none;
    color: var(--text);
    font-size: 1.6rem;
    cursor: pointer;
  }
  .sheet {
    position: fixed;
    inset: 88px 4vw auto;
    z-index: 99;
    background: var(--card);
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .sheet a {
    text-decoration: none;
    font-weight: 700;
    padding: 0.5rem 0;
  }
  .sheet-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  @media (max-width: 720px) {
    .links,
    .actions {
      display: none;
    }
    .burger {
      display: block;
    }
  }
</style>
