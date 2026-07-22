<script>
  import { tick } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import PaperGrid from '$lib/components/PaperGrid.svelte';
  import Tag from '$lib/components/Tag.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { searchByKeyword, processFile, validateFile, ApiError } from '$lib/api';

  // Results are hard-capped at 5 to stay well under Semantic Scholar's rate limit.
  const MAX_RESULTS = 5;
  // Client-side cooldown between sends — a second line of defence against
  // overcalling the API on top of the gateway's own rate limiter.
  const COOLDOWN_MS = 4000;

  /** @type {{ id:number, role:'user'|'bot', kind:'text'|'result'|'error', text?:string, file?:string, result?:any }[]} */
  let messages = [
    {
      id: 0,
      role: 'bot',
      kind: 'text',
      text: 'Hi! Type a topic or keyword, or attach a paper (PDF / image), and I’ll pull up to 5 related papers.',
    },
  ];

  let input = '';
  let file = null;
  let error = '';
  let sending = false;
  let cooldownUntil = 0;
  let now = Date.now();
  let thread; // scroll container
  let nextId = 1;

  // Tick a clock so the cooldown countdown updates.
  setInterval(() => (now = Date.now()), 250);
  $: cooling = now < cooldownUntil;
  $: cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  $: canSend = !sending && !cooling && (input.trim().length > 0 || !!file);

  function pickFile(e) {
    error = '';
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const msg = validateFile(f);
    if (msg) {
      error = msg;
      file = null;
      return;
    }
    file = f;
  }

  function clearFile() {
    file = null;
    error = '';
  }

  async function scrollToEnd() {
    await tick();
    if (thread) thread.scrollTop = thread.scrollHeight;
  }

  function push(msg) {
    messages = [...messages, { id: nextId++, ...msg }];
    scrollToEnd();
  }

  async function send() {
    if (!canSend) return;
    error = '';
    const text = input.trim();
    const hasFile = !!file;
    const sentFile = file;

    // Echo the user's message.
    push({
      role: 'user',
      kind: 'text',
      text: hasFile ? text || 'Find papers related to this document' : text,
      file: hasFile ? sentFile.name : undefined,
    });

    input = '';
    file = null;
    sending = true;
    const thinkingId = nextId++;
    messages = [...messages, { id: thinkingId, role: 'bot', kind: 'text', text: '…' }];
    await scrollToEnd();

    try {
      const result = hasFile
        ? await processFile(sentFile, { maxResults: MAX_RESULTS })
        : await searchByKeyword(text, { maxResults: MAX_RESULTS });

      messages = messages.filter((m) => m.id !== thinkingId);
      push({ role: 'bot', kind: 'result', result });
    } catch (e) {
      messages = messages.filter((m) => m.id !== thinkingId);
      push({
        role: 'bot',
        kind: 'error',
        text: e instanceof ApiError ? e.message : 'Something went wrong. Please try again.',
      });
    } finally {
      sending = false;
      cooldownUntil = Date.now() + COOLDOWN_MS;
    }
  }

  function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }
</script>

<svelte:head>
  <title>Paper Chat — ReadNext</title>
</svelte:head>

<div class="page">
  <header class="topbar">
    <a class="logo" href="/">
      <span class="logo-glyph">◳</span>
      <span>ReadNext</span>
    </a>
    <div class="top-actions">
      <span class="mono badge">Max {MAX_RESULTS} / query</span>
      <ThemeToggle />
    </div>
  </header>

  <main class="chat">
    <div class="thread" bind:this={thread} aria-live="polite">
      {#each messages as m (m.id)}
        <div class="row" class:me={m.role === 'user'}>
          <div
            class="bubble"
            class:me={m.role === 'user'}
            class:err={m.kind === 'error'}
            class:result={m.kind === 'result'}
          >
            {#if m.kind === 'text' || m.kind === 'error'}
              {#if m.file}
                <span class="file-chip">📎 {m.file}</span>
              {/if}
              {#if m.text}<p class="bubble-text">{m.text}</p>{/if}
            {:else if m.kind === 'result'}
              {#if m.result.keyphrases?.length}
                <div class="keyphrases">
                  <span class="mono">Keywords:</span>
                  {#each m.result.keyphrases as kp}
                    <Tag variant="filled">{kp}</Tag>
                  {/each}
                </div>
              {/if}
              {#if m.result.papers?.length}
                <p class="bubble-text">Here are your {m.result.papers.length} paper(s):</p>
                <PaperGrid papers={m.result.papers} />
              {:else}
                <p class="bubble-text">No matching papers found. Try a different keyword.</p>
              {/if}
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if error}
      <p class="error" role="alert">⚠ {error}</p>
    {/if}

    <form class="composer" on:submit|preventDefault={send}>
      {#if file}
        <div class="attached">
          <span class="file-chip">📎 {file.name}</span>
          <button type="button" class="x" on:click={clearFile} aria-label="Remove file">✕</button>
        </div>
      {/if}
      <div class="composer-row">
        <label class="attach" title="Attach a PDF or image">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
            on:change={pickFile}
          />
          📎
        </label>
        <textarea
          bind:value={input}
          on:keydown={onKeydown}
          rows="1"
          placeholder="Type a keyword or topic…"
        ></textarea>
        <Button variant="primary" type="submit" disabled={!canSend}>
          {#if sending}Searching…{:else if cooling}Wait {cooldownLeft}s{:else}Send{/if}
        </Button>
      </div>
      <p class="hint mono">
        Enter to send · Shift+Enter for a new line · rate-limited to protect the Semantic Scholar API
      </p>
    </form>
  </main>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--surface);
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem clamp(1rem, 4vw, 2rem);
    background: var(--card);
    border-bottom: var(--bw) solid var(--border);
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1.2rem;
    text-decoration: none;
  }
  .logo-glyph {
    font-size: 1.35rem;
  }
  .top-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .badge {
    border: 2px solid var(--border);
    border-radius: 999px;
    padding: 0.25rem 0.7rem;
    background: var(--accent);
    color: var(--accent-ink);
  }

  .chat {
    flex: 1;
    width: min(1180px, 96vw);
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    padding: 1.25rem 0;
    gap: 1rem;
  }
  .thread {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
    min-height: 55vh;
  }
  .row {
    display: flex;
    justify-content: flex-start;
  }
  .row.me {
    justify-content: flex-end;
  }
  .bubble {
    max-width: 85%;
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow-sm);
    padding: 0.85rem 1rem;
  }
  /* Result bubbles hold the paper grid — let them use the full width. */
  .bubble.result {
    max-width: 100%;
    width: 100%;
  }
  .bubble.me {
    background: var(--accent);
    color: var(--accent-ink);
    max-width: 80%;
  }
  .bubble.err {
    background: var(--card);
    border-color: var(--accent-ink);
    box-shadow: 3px 3px 0 0 var(--accent);
  }
  .bubble-text {
    margin: 0 0 0.4rem;
    white-space: pre-wrap;
  }
  .bubble-text:last-child {
    margin-bottom: 0;
  }
  .file-chip {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    border: 2px solid currentColor;
    border-radius: 8px;
    padding: 0.15rem 0.5rem;
    margin-bottom: 0.4rem;
  }
  .keyphrases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .keyphrases .mono {
    color: var(--text-muted);
  }

  .error {
    color: var(--accent-ink);
    background: var(--accent);
    border: 2px solid var(--accent-ink);
    border-radius: var(--radius);
    padding: 0.5rem 0.9rem;
    font-weight: 700;
    margin: 0 0.5rem;
  }

  .composer {
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    padding: 0.75rem;
  }
  .attached {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .attached .x {
    border: 2px solid var(--border);
    background: var(--card);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 800;
    padding: 0.1rem 0.45rem;
    color: var(--text);
  }
  .composer-row {
    display: flex;
    align-items: flex-end;
    gap: 0.6rem;
  }
  .attach {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    flex: none;
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    font-size: 1.25rem;
  }
  .attach:hover {
    transform: translate(-1px, -1px);
  }
  .attach input {
    display: none;
  }
  textarea {
    flex: 1;
    resize: none;
    max-height: 160px;
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.5;
    padding: 0.7rem 0.85rem;
  }
  .hint {
    color: var(--text-muted);
    margin: 0.6rem 0 0;
    text-transform: none;
    letter-spacing: 0;
  }
</style>
