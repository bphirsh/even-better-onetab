<script lang="ts">
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { timeAgo } from '../ui/time'
  import { act } from './actions'
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

  const syncStatus = $derived.by(() => {
    if (!app.syncConfig.enabled) return null
    if (app.syncState.error) return { kind: 'error' as const, text: 'Sync error' }
    if (app.syncState.lastPushAt) return { kind: 'ok' as const, text: `Synced ${timeAgo(app.syncState.lastPushAt)}` }
    return { kind: 'ok' as const, text: 'Sync enabled' }
  })

  const storeAll = () => act({ type: 'store-tabs', which: 'all' })
  const toggleTag = (tag: string) => (filters.tag = filters.tag === tag ? null : tag)
  const toggleSettings = () => (location.hash = route === 'settings' ? '#/' : '#/settings')
</script>

<header>
  <div class="bar">
    <img class="wordmark" src="/icons/wordmark-transparent.png" alt="Even Better OneTab" />
    {#if route === 'lists'}
      <div class="search">
        <Icon name="search" size={15} />
        <input class="search-input" type="text" placeholder="Search tabs…" bind:value={filters.query} />
        {#if filters.query}
          <button class="icon-btn" aria-label="Clear search" onclick={() => (filters.query = '')}>
            <Icon name="x" size={14} />
          </button>
        {/if}
      </div>
      <button class="btn primary" onclick={storeAll}>
        <Icon name="archive" size={15} />
        Store all tabs
      </button>
    {:else}
      <div class="spacer"></div>
    {/if}
    <button
      class="icon-btn gear"
      title={route === 'settings' ? 'Back to lists' : 'Settings'}
      aria-label={route === 'settings' ? 'Back to lists' : 'Settings'}
      onclick={toggleSettings}
    >
      <Icon name={route === 'settings' ? 'x' : 'settings'} size={17} />
    </button>
  </div>

  {#if route === 'lists'}
    <div class="subbar">
      <div class="tags">
        {#each tagCounts as [tag, count] (tag)}
          <button class="tag-chip" class:active={filters.tag === tag} onclick={() => toggleTag(tag)}>
            <Icon name="tag" size={11} />
            {tag}
            <span class="count">{count}</span>
          </button>
        {/each}
      </div>
      <div class="status">
        {#if syncStatus}
          <span class="dot" class:error={syncStatus.kind === 'error'}></span>
          <span>{syncStatus.text}</span>
          <span class="sep">·</span>
        {/if}
        <span>{app.lists.length} lists · {totalTabs} tabs</span>
      </div>
    </div>
  {/if}
</header>

<style>
  header {
    flex-shrink: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .bar,
  .subbar {
    max-width: 820px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bar {
    padding-top: 14px;
    padding-bottom: 10px;
  }

  .wordmark {
    width: 148px;
    height: auto;
    flex-shrink: 0;
  }

  :global([data-theme='dark']) .wordmark {
    /* dark text → light; hue-rotate restores the blues */
    filter: invert(1) hue-rotate(180deg);
  }

  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-3);
  }

  .search:focus-within {
    border-color: var(--accent);
  }

  .search-input {
    flex: 1;
    min-width: 0;
    padding: 7px 0;
    border: none;
    outline: none;
    background: none;
    color: var(--text);
  }

  .spacer {
    flex: 1;
  }

  .gear {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
  }

  .subbar {
    padding-bottom: 10px;
    min-height: 26px;
  }

  .tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--text-2);
    font-size: 12.5px;
    font-weight: 500;
  }

  .tag-chip:hover {
    background: var(--border);
  }

  .tag-chip.active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .tag-chip .count {
    color: var(--text-3);
    font-size: 11.5px;
  }

  .tag-chip.active .count {
    color: inherit;
    opacity: 0.7;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    font-size: 12px;
    color: var(--text-3);
    white-space: nowrap;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4caf78;
  }

  .dot.error {
    background: var(--danger);
  }

  .sep {
    opacity: 0.6;
  }
</style>
