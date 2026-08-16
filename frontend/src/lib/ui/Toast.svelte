<script>
  import { toast, dismissToast } from './toast.js';

  function runAction() {
    const a = $toast?.action;
    dismissToast();
    if (a) a();
  }
</script>

{#if $toast}
  <div class="toast" role="status" aria-live="polite">
    <span class="msg">{$toast.message}</span>
    {#if $toast.actionLabel && $toast.action}
      <button type="button" class="action" on:click={runAction}>{$toast.actionLabel}</button>
    {/if}
    <button type="button" class="close" on:click={dismissToast} aria-label="Dismiss">✕</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: 1.5rem;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: min(560px, 92vw);
    border: var(--bw) solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    color: var(--text);
    box-shadow: var(--shadow);
    padding: 0.7rem 0.9rem;
    font-size: 0.95rem;
    font-weight: 600;
  }
  .msg {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .action {
    flex: none;
    border: 2px solid var(--border);
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: var(--accent-ink);
    padding: 0.25rem 0.8rem;
    cursor: pointer;
    font-weight: 800;
    transition:
      transform var(--dur-fast) var(--ease-snap),
      box-shadow var(--dur-fast) var(--ease-snap);
  }
  .action:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-sm);
  }
  .action:active {
    transform: var(--press-pill);
    box-shadow: var(--shadow-pressed);
  }
  .close {
    flex: none;
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font-weight: 800;
    line-height: 1;
    padding: 0.1rem 0.2rem;
  }
</style>
