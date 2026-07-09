<script lang="ts">
  import { dismissToast, toasts } from '../ui/toast.svelte'

  const runAction = (id: number, fn: () => void) => {
    dismissToast(id)
    fn()
  }
</script>

{#if toasts.items.length > 0}
  <div class="toasts">
    {#each toasts.items as item (item.id)}
      <div class="toast" class:error={item.kind === 'error'}>
        <span>{item.text}</span>
        {#if item.action}
          <button class="action" onclick={() => runAction(item.id, item.action!.fn)}>
            {item.action.label}
          </button>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .toasts {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 100;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 9px 16px;
    border-radius: var(--radius-sm);
    background: var(--text);
    color: var(--bg);
    font-weight: 500;
    box-shadow: var(--shadow-lg);
    max-width: 70vw;
  }

  .toast.error {
    background: var(--danger);
    color: #fff;
  }

  .action {
    color: inherit;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    margin-right: -8px;
    border-radius: 5px;
  }

  .action:hover {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
