<script>
  import { onDestroy } from 'svelte';
  import { filters } from '../store.js';

  /** Absolute bounds for the sliders. Seeded from corpus facets when available. */
  export let min = 1900;
  export let max = new Date().getFullYear();

  // Clamp helpers keep the two bounds ordered and inside [min, max].
  const clamp = (v) => Math.min(max, Math.max(min, Math.trunc(Number(v))));

  // Sliders commit this long after the last drag so the paper grid doesn't
  // thrash mid-drag. Number inputs do NOT use this — they commit only on blur /
  // Enter (see below) so a half-typed year is never clamped out from under you.
  const DEBOUNCE_MS = 300;

  // Local, instantly-updating view of the two bounds. Inputs render from these;
  // the store commit happens on blur/Enter (typing) or debounced (dragging).
  let loView = $filters.yearMin;
  let hiView = $filters.yearMax;
  let editing = false;
  let lastTouched = null; // 'lo' | 'hi' — used to keep the pair ordered on commit
  let timer;

  // Mirror external store changes (URL restore, Clear-all, chip removal) into the
  // view — but never while the user is mid-edit, or we'd fight their input.
  $: if (!editing) {
    loView = $filters.yearMin;
    hiView = $filters.yearMax;
  }

  // Positions of the two thumbs as a % of the track, for the chartreuse fill that
  // is painted strictly between them. Falls back to the track ends when a bound
  // is unset, and tolerates the mid-typing string values in loView/hiView.
  const pct = (v, fallback) => {
    const n = v === '' || v == null ? fallback : Number(v);
    const clamped = Math.min(max, Math.max(min, Number.isFinite(n) ? n : fallback));
    return ((clamped - min) / Math.max(1, max - min)) * 100;
  };
  $: loPct = pct(loView, min);
  $: hiPct = pct(hiView, max);

  function commit() {
    editing = false;
    clearTimeout(timer);
    let lo = loView === '' || loView == null ? null : clamp(loView);
    let hi = hiView === '' || hiView == null ? null : clamp(hiView);
    // Keep the range ordered without yanking the handle the user just moved.
    if (lo != null && hi != null && lo > hi) {
      if (lastTouched === 'hi') lo = hi;
      else hi = lo;
    }
    // Reflect the normalised values straight back into the view.
    loView = lo;
    hiView = hi;
    filters.setYear(lo, hi);
  }

  // Number inputs: track each keystroke locally but DON'T commit — otherwise a
  // partial year like "20" (en route to 2015) gets clamped up to the min bound
  // and stomps what the user is typing. Commit happens on blur / Enter instead.
  function typeLo(v) {
    editing = true;
    loView = v;
    lastTouched = 'lo';
  }
  function typeHi(v) {
    editing = true;
    hiView = v;
    lastTouched = 'hi';
  }

  // Sliders only ever produce in-range values, so commit them live (debounced).
  function dragLo(v) {
    editing = true;
    loView = v;
    lastTouched = 'lo';
    schedule();
  }
  function dragHi(v) {
    editing = true;
    hiView = v;
    lastTouched = 'hi';
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(commit, DEBOUNCE_MS);
  }

  function onNumberKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  }

  onDestroy(() => clearTimeout(timer));
</script>

<fieldset class="year">
  <legend>Year</legend>

  <div class="inputs">
    <label>
      <span class="mono lbl">From</span>
      <input
        type="number"
        inputmode="numeric"
        placeholder={String(min)}
        {min}
        {max}
        value={loView ?? ''}
        on:input={(e) => typeLo(e.target.value)}
        on:blur={commit}
        on:keydown={onNumberKeydown}
        aria-label="Minimum year"
      />
    </label>
    <span class="dash" aria-hidden="true">–</span>
    <label>
      <span class="mono lbl">To</span>
      <input
        type="number"
        inputmode="numeric"
        placeholder={String(max)}
        {min}
        {max}
        value={hiView ?? ''}
        on:input={(e) => typeHi(e.target.value)}
        on:blur={commit}
        on:keydown={onNumberKeydown}
        aria-label="Maximum year"
      />
    </label>
  </div>

  <!-- Single shared track, two overlaid thumbs. The chartreuse fill spans only
       the region between the two thumbs. -->
  <div class="dual">
    <div class="track" aria-hidden="true">
      <div class="fill" style="left:{loPct}%; right:{100 - hiPct}%"></div>
    </div>
    <input
      class="brutal-range"
      type="range"
      {min}
      {max}
      value={loView ?? min}
      on:input={(e) => dragLo(e.target.value)}
      aria-label="Minimum year slider"
    />
    <input
      class="brutal-range"
      type="range"
      {min}
      {max}
      value={hiView ?? max}
      on:input={(e) => dragHi(e.target.value)}
      aria-label="Maximum year slider"
    />
  </div>
</fieldset>

<style>
  .year {
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 0.75rem 0.75rem;
    margin: 0;
  }
  legend {
    font-weight: 800;
    padding: 0 0.4rem;
  }
  .inputs {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
  }
  .lbl {
    /* Sentence case (not uppercased) + higher-contrast ink, one step larger. */
    color: var(--text);
    font-size: 0.82rem;
    text-transform: none;
    letter-spacing: 0;
  }
  input[type='number'] {
    width: 100%;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    padding: 0.4rem 0.5rem;
    font-family: var(--font-mono);
  }
  .dash {
    padding-bottom: 0.5rem;
    font-weight: 800;
  }

  /* ── Neobrutal single-track dual-thumb slider ────────────────────────────
     One shared hard-edged track. Two <input type=range> are stacked on top of
     it; only their thumbs receive pointer events, so both handles stay
     independently draggable. The chartreuse fill lives inside the track and is
     bounded left/right by the two thumb positions, so it appears strictly
     BETWEEN the thumbs. Range internals need vendor pseudo-elements, so the
     thumb is styled twice (WebKit + Firefox). */
  .dual {
    position: relative;
    height: 28px;
    margin-top: 0.9rem;
  }
  .track {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    height: 10px;
    background: var(--surface-2);
    border: var(--bw) solid var(--border);
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--accent);
  }

  .brutal-range {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    /* Let clicks fall through to the track/fill; only the thumbs are live. */
    pointer-events: none;
  }
  .brutal-range:focus {
    outline: none;
  }
  .brutal-range:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--accent-ink);
    outline-offset: 2px;
  }

  /* Transparent tracks — the visible block line is the shared .track element. */
  .brutal-range::-webkit-slider-runnable-track {
    height: 28px;
    background: transparent;
    border: none;
  }
  .brutal-range::-moz-range-track {
    height: 28px;
    background: transparent;
    border: none;
  }

  /* Thumb — the square green draggable button. */
  .brutal-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    pointer-events: auto;
    width: 20px;
    height: 20px;
    background: var(--accent);
    border: var(--bw) solid var(--border);
    border-radius: 0;
    box-shadow: var(--shadow-sm);
    /* Centre the 20px thumb inside the 28px track. */
    margin-top: 4px;
  }
  .brutal-range::-webkit-slider-thumb:active {
    transform: var(--press-pill);
    box-shadow: var(--shadow-pressed);
  }
  .brutal-range::-moz-range-thumb {
    pointer-events: auto;
    width: 20px;
    height: 20px;
    background: var(--accent);
    border: var(--bw) solid var(--border);
    border-radius: 0;
    box-shadow: var(--shadow-sm);
  }
  .brutal-range:active::-moz-range-thumb {
    transform: var(--press-pill);
    box-shadow: var(--shadow-pressed);
  }
</style>
