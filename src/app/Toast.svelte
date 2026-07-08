<script lang="ts">
  import { toasts } from '../ui/toast.svelte'
</script>

{#if toasts.items.length > 0}
  <div class="toasts">
    {#each toasts.items as item (item.id)}
      <div class="toast" class:error={item.kind === 'error'}>{item.text}</div>
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
</style>
