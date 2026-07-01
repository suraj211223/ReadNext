<script>
  import { theme, toggleTheme } from '$lib/theme';
  $: isDark = $theme === 'dark';
</script>

<button
  class="toggle"
  class:dark={isDark}
  on:click={toggleTheme}
  role="switch"
  aria-checked={isDark}
  aria-label="Toggle dark mode"
>
  <span class="knob">{isDark ? '🌙' : '☀️'}</span>
</button>

<style>
  .toggle {
    position: relative;
    width: 64px;
    height: 34px;
    border: var(--bw) solid var(--border);
    border-radius: 999px;
    background: var(--card);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    padding: 0;
    transition: box-shadow var(--dur-fast) var(--ease-snap);
  }
  .toggle:active {
    transform: var(--press);
    box-shadow: none;
  }
  .knob {
    position: absolute;
    top: 50%;
    left: 3px;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    font-size: 0.8rem;
    border: 2px solid var(--border);
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 2px 2px 0 0 var(--ink);
    transition: left var(--dur) var(--ease-snap), transform var(--dur) var(--ease-snap);
  }
  .toggle.dark .knob {
    left: calc(100% - 27px);
    transform: translateY(-50%) rotate(360deg);
  }
</style>
