<script>
  import Button from './Button.svelte';
  import PaperGrid from './PaperGrid.svelte';
  import Tag from './Tag.svelte';
  import { processFile, validateFile, ApiError } from '$lib/api';

  let file = null;
  let dragOver = false;
  let status = 'idle'; // idle | loading | done | error
  let error = '';
  let result = null;

  function pick(f) {
    error = '';
    const msg = validateFile(f);
    if (msg) {
      error = msg;
      file = null;
      return;
    }
    file = f;
  }

  function onInput(e) {
    const f = e.target.files && e.target.files[0];
    if (f) pick(f);
  }
  function onDrop(e) {
    e.preventDefault();
    dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) pick(f);
  }

  async function submit() {
    if (!file) {
      error = 'Choose a PDF or image first.';
      return;
    }
    status = 'loading';
    error = '';
    result = null;
    try {
      result = await processFile(file, { maxResults: 5 });
      status = 'done';
    } catch (e) {
      status = 'error';
      error = e instanceof ApiError ? e.message : 'Something went wrong.';
    }
  }

  function reset() {
    file = null;
    result = null;
    status = 'idle';
    error = '';
  }
</script>

<section id="demo" class="band band--alt">
  <div class="container">
    <p class="mono">Live demo</p>
    <h2 class="section-h2">Drop a paper. Get your next five.</h2>

    <div
      class="dropzone"
      class:over={dragOver}
      on:dragover|preventDefault={() => (dragOver = true)}
      on:dragleave={() => (dragOver = false)}
      on:drop={onDrop}
      role="button"
      tabindex="0"
    >
      <input
        id="file-input"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
        on:change={onInput}
      />
      <label for="file-input" class="drop-label">
        <span class="drop-glyph">⬑</span>
        <strong>{file ? file.name : 'Drag a PDF or screenshot here'}</strong>
        <span class="hint">or click to browse · PDF, PNG, JPG, WebP · max 15 MB</span>
      </label>
    </div>

    {#if error}
      <p class="error" role="alert">⚠ {error}</p>
    {/if}

    <div class="actions">
      <Button variant="primary" on:click={submit} disabled={status === 'loading' || !file}>
        {status === 'loading' ? 'Analyzing…' : 'Find papers'}
      </Button>
      {#if file || result}
        <Button on:click={reset}>Reset</Button>
      {/if}
    </div>

    {#if status === 'loading'}
      <div class="skeleton-grid" aria-live="polite" aria-busy="true">
        {#each Array(5) as _}
          <div class="skeleton"></div>
        {/each}
      </div>
    {/if}

    {#if status === 'done' && result}
      {#if result.keyphrases?.length}
        <div class="keyphrases">
          <span class="mono">Keyphrases:</span>
          {#each result.keyphrases as kp}
            <Tag variant="filled">{kp}</Tag>
          {/each}
        </div>
      {/if}

      {#if result.papers?.length}
        <PaperGrid papers={result.papers} />
      {:else}
        <p class="empty">No matching papers found. Try a more text-rich page.</p>
      {/if}
    {/if}
  </div>
</section>

<style>
  .dropzone {
    position: relative;
    border: var(--bw) dashed var(--border);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    padding: clamp(2rem, 6vw, 4rem);
    text-align: center;
    transition: transform var(--dur-fast) var(--ease-snap), box-shadow var(--dur-fast) var(--ease-snap);
  }
  .dropzone.over {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-lg);
    border-style: solid;
    background: var(--card-2);
  }
  input[type='file'] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .drop-label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
  }
  .drop-glyph {
    font-size: 2.5rem;
  }
  .hint {
    color: var(--text-muted);
    font-size: 0.9rem;
  }
  .error {
    color: var(--accent-ink);
    background: var(--accent);
    border: 2px solid var(--accent-ink);
    border-radius: var(--radius);
    padding: 0.6rem 1rem;
    margin-top: 1rem;
    font-weight: 700;
    display: inline-block;
  }
  .actions {
    display: flex;
    gap: 1rem;
    margin: 1.5rem 0;
  }
  .keyphrases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .keyphrases .mono {
    color: var(--text-muted);
  }
  .empty {
    color: var(--text-muted);
    font-style: italic;
  }
  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  .skeleton {
    height: 200px;
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: repeating-linear-gradient(
      90deg,
      var(--card),
      var(--card) 12px,
      var(--card-2) 12px,
      var(--card-2) 24px
    );
    box-shadow: var(--shadow-sm);
    animation: pulse 1.2s var(--ease-snap) infinite alternate;
  }
  @keyframes pulse {
    to {
      opacity: 0.55;
    }
  }
</style>
