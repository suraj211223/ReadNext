<script>
  import Button from './Button.svelte';
  let email = '';
  let submitted = false;
  function subscribe() {
    if (email) submitted = true;
  }
</script>

<footer class="footer">
  <div class="container">
    <div class="top">
      <div class="brand">
        <span class="wordmark">ReadNext</span>
        <p class="tagline">From the paragraph in front of you to your next five papers.</p>
      </div>

      <nav class="cols" aria-label="Footer">
        <div class="col">
          <h4 class="mono">Product</h4>
          <a href="#how">How it works</a>
          <a href="#demo">Demo</a>
          <a href="#sources">Sources</a>
        </div>
        <div class="col">
          <h4 class="mono">Project</h4>
          <a href="#top">About</a>
          <a href="#sources">Tech stack</a>
          <a href="#how">Roadmap</a>
        </div>
        <div class="col">
          <h4 class="mono">Links</h4>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://api.semanticscholar.org" target="_blank" rel="noopener noreferrer"
            >Semantic Scholar API</a
          >
        </div>
      </nav>
    </div>

    <form class="capture" on:submit|preventDefault={subscribe}>
      {#if submitted}
        <p class="thanks mono">Thanks — you're on the list.</p>
      {:else}
        <input
          type="email"
          placeholder="you@university.edu"
          aria-label="Email address"
          bind:value={email}
          required
        />
        <Button variant="primary" type="submit">Keep me posted</Button>
      {/if}
    </form>

  </div>
</footer>

<style>
  /* High-contrast close: force dark band even in light mode (UI §9.2).
     Re-map the ink-derived tokens to the cream band colour so children
     (the CTA button) render light-on-dark in light mode too — otherwise
     their offset "back" shadow is a dark ink that vanishes on the band. */
  .footer {
    --border: #f4f1ea;
    --shadow: 6px 6px 0 0 #f4f1ea;
    --shadow-sm: 3px 3px 0 0 #f4f1ea;
    --shadow-lg: 10px 10px 0 0 #f4f1ea;
    background: #1f1e1c;
    color: #f4f1ea;
    border-top: var(--bw) solid #f4f1ea;
    padding: clamp(3rem, 7vw, 5rem) 0 2rem;
  }
  .top {
    display: grid;
    grid-template-columns: 1.4fr 2fr;
    gap: 2rem;
  }
  .wordmark {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(2.5rem, 6vw, 4rem);
    line-height: 1;
  }
  .tagline {
    max-width: 32ch;
    opacity: 0.8;
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .col h4 {
    color: #c6f24e;
    margin: 0 0 0.4rem;
  }
  .col a {
    text-decoration: none;
    opacity: 0.85;
  }
  .col a:hover {
    opacity: 1;
    text-decoration: underline;
    text-decoration-thickness: 2px;
  }
  .capture {
    display: flex;
    gap: 0.75rem;
    margin: 2.5rem 0;
    flex-wrap: wrap;
  }
  .capture input {
    flex: 1 1 260px;
    border: var(--bw) solid #f4f1ea;
    border-radius: var(--radius);
    background: transparent;
    color: #f4f1ea;
    padding: 0.85rem 1rem;
    font-family: var(--font-body);
    font-size: 1rem;
    box-shadow: 6px 6px 0 0 #f4f1ea;
  }
  .capture input::placeholder {
    color: #c9c5ba;
  }
  .thanks {
    color: #c6f24e;
  }
  @media (max-width: 760px) {
    .top {
      grid-template-columns: 1fr;
    }
  }
</style>
