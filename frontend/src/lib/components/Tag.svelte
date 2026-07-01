<script>
  /** filled = accent background (keyphrases); outline = metadata chips */
  export let variant = 'outline';
</script>

<span class="tag tag--{variant} mono"><slot /></span>

<style>
  .tag {
    display: inline-block;
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 0.2rem 0.55rem;
    line-height: 1.4;
    white-space: nowrap;
  }
  .tag--filled {
    background: var(--accent);
    color: var(--accent-ink);
    border-color: var(--accent-ink);
  }
  .tag--outline {
    background: transparent;
    color: var(--text-muted);
  }
</style>
