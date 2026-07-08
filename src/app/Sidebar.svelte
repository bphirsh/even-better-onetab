<script lang="ts">
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { timeAgo } from '../ui/time'
  import { filters } from './filters.svelte'

  let { route }: { route: string } = $props()

  const tagCounts = $derived.by(() => {
    const counts = new Map<string, number>()
    for (const list of app.lists) {
      for (const tag of list.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  })

  const totalTabs = $derived(app.lists.reduce((sum, list) => sum + list.tabs.length, 0))

  const selectTag = (tag: string) => {
    filters.tag = filters.tag === tag ? null : tag
    if (route !== 'lists') location.hash = '#/'
  }

  const syncStatus = $derived.by(() => {
    if (!app.syncConfig.enabled) return null
    if (app.syncState.error) return { kind: 'error' as const, text: 'Sync error' }
    if (app.syncState.lastPushAt) return { kind: 'ok' as const, text: `Synced ${timeAgo(app.syncState.lastPushAt)}` }
    return { kind: 'ok' as const, text: 'Sync enabled' }
  })
</script>

<aside>
  <div class="brand">
    <img src="/icons/icon_48.png" alt="" width="26" height="26" />
    <span>Better OneTab</span>
  </div>

  <nav>
    <a href="#/" class="nav-item" class:active={route === 'lists'}>
      <Icon name="layers" size={16} />
      <span>Lists</span>
      <span class="count">{app.lists.length}</span>
    </a>
    <a href="#/settings" class="nav-item" class:active={route === 'settings'}>
      <Icon name="settings" size={16} />
      <span>Settings</span>
    </a>
  </nav>

  {#if tagCounts.length > 0}
    <div class="section-label">Tags</div>
    <nav class="tags">
      {#each tagCounts as [tag, count] (tag)}
        <button class="nav-item" class:active={filters.tag === tag} onclick={() => selectTag(tag)}>
          <Icon name="tag" size={14} />
          <span class="tag-name">{tag}</span>
          <span class="count">{count}</span>
        </button>
      {/each}
    </nav>
  {/if}

  <div class="spacer"></div>

  <div class="footer">
    {#if syncStatus}
      <div class="sync-status" class:error={syncStatus.kind === 'error'}>
        <span class="dot"></span>
        <span>{syncStatus.text}</span>
      </div>
    {/if}
    <div class="stats">{app.lists.length} lists · {totalTabs} tabs</div>
  </div>
</aside>

<style>
  aside {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    padding: 16px 12px;
    border-right: 1px solid var(--border);
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 10px 16px;
    font-size: 15px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    color: var(--text-2);
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    min-width: 0;
  }

  .nav-item:hover {
    background: var(--surface-hover);
    color: var(--text);
    text-decoration: none;
  }

  :global([data-theme='dark']) .nav-item:hover {
    background: var(--surface-2);
  }

  .nav-item.active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .count {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-3);
  }

  .tag-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .section-label {
    margin: 18px 10px 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
  }

  .tags {
    overflow-y: auto;
  }

  .spacer {
    flex: 1;
  }

  .footer {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sync-status {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: var(--text-2);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4caf78;
  }

  .sync-status.error .dot {
    background: var(--danger);
  }

  .stats {
    font-size: 12px;
    color: var(--text-3);
  }
</style>
