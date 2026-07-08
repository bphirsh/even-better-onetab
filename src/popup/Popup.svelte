<script lang="ts">
  import { send } from '../core/messages'
  import Icon from '../ui/Icon.svelte'
  import { app, applyTheme, initState } from '../ui/state.svelte'
  import { timeAgo } from '../ui/time'

  initState()

  $effect(() => {
    if (app.loaded) applyTheme(app.opts.theme)
  })

  const recent = $derived(app.lists.slice(0, 6))

  const store = async (which: 'all' | 'selected') => {
    await send({ type: 'store-tabs', which })
    window.close()
  }

  const restore = async (id: string) => {
    await send({ type: 'restore-list', id })
    window.close()
  }

  const openLists = async () => {
    await send({ type: 'open-lists' })
    window.close()
  }

  const listLabel = (title: string, count: number) =>
    title || `${count} tab${count === 1 ? '' : 's'}`
</script>

<main>
  <div class="actions">
    <button class="action" onclick={() => store('all')}>
      <Icon name="archive" size={17} />
      <span>Store all tabs</span>
    </button>
    <button class="action" onclick={() => store('selected')}>
      <Icon name="download" size={17} />
      <span>Store selected tabs</span>
    </button>
  </div>

  {#if recent.length > 0}
    <div class="section-label">Recent lists</div>
    <div class="recent">
      {#each recent as list (list._id)}
        <button class="recent-item" title="Restore this list" onclick={() => restore(list._id)}>
          <span class="recent-title">{listLabel(list.title, list.tabs.length)}</span>
          {#if list.title}
            <span class="recent-count">{list.tabs.length}</span>
          {/if}
          <span class="recent-time">{timeAgo(list.time)}</span>
          <span class="restore-icon"><Icon name="restore" size={14} /></span>
        </button>
      {/each}
    </div>
  {:else if app.loaded}
    <div class="empty">No stored tabs yet</div>
  {/if}

  <button class="footer" onclick={openLists}>
    <Icon name="layers" size={15} />
    <span>Open Better OneTab</span>
  </button>
</main>

<style>
  main {
    width: 300px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .action {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    text-align: left;
  }

  .action:hover {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .section-label {
    margin: 8px 10px 2px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
  }

  .recent {
    display: flex;
    flex-direction: column;
  }

  .recent-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    text-align: left;
    min-width: 0;
  }

  .recent-item:hover {
    background: var(--surface-hover);
  }

  :global([data-theme='dark']) .recent-item:hover {
    background: var(--surface-2);
  }

  .recent-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent-count,
  .recent-time {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--text-3);
  }

  .restore-icon {
    display: none;
    color: var(--accent);
  }

  .recent-item:hover .restore-icon {
    display: inline-flex;
  }

  .recent-item:hover .recent-time {
    display: none;
  }

  .empty {
    padding: 14px 10px;
    color: var(--text-3);
    text-align: center;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
    padding: 9px;
    border-top: 1px solid var(--border);
    color: var(--text-2);
    font-weight: 500;
  }

  .footer:hover {
    color: var(--accent);
  }
</style>
