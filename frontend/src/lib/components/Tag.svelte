<script>
  /** filled = accent background (keyphrases); outline = metadata chips */
  export let variant = 'outline';
  /** allow the chip to wrap onto multiple lines (e.g. long venue names) */
  export let wrap = false;
</script>

<span class="tag tag--{variant} mono" class:tag--wrap={wrap}><slot /></span>

<style>
  .tag {
    display: inline-block;
    max-width: 100%;
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 0.2rem 0.55rem;
    line-height: 1.4;
    white-space: nowrap;
  }
  .tag--wrap {
    white-space: normal;
    overflow-wrap: anywhere;
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
