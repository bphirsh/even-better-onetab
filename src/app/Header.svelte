<script lang="ts">
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { filters } from './filters.svelte'

  let { route }: { route: string } = $props()

  const tagCounts = $derived.by(() => {
    const counts = new Map<string, number>()
    for (const list of app.lists) {
      for (const tag of list.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  })

  const toggleTag = (tag: string) => (filters.tag = filters.tag === tag ? null : tag)
  const toggleRoute = (target: 'settings' | 'history') =>
    (location.hash = route === target ? '#/' : `#/${target}`)

  // --- expandable search ---
  let searchOpen = $state(false)
  let searchInput: HTMLInputElement | undefined = $state()

  const openSearch = () => {
    searchOpen = true
    requestAnimationFrame(() => searchInput?.focus())
  }

  const onSearchBlur = () => {
    if (!filters.query.trim()) searchOpen = false
  }

  const onSearchKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      filters.query = ''
      searchOpen = false
      searchInput?.blur()
    }
  }
</script>

<header>
  <div class="bar">
    <img class="wordmark" src="/icons/wordmark-transparent.png" alt="Even Better OneTab" />

    {#if route === 'lists' && tagCounts.length > 0}
      <div class="tags">
        {#each tagCounts as [tag, count] (tag)}
          <button class="tag-chip" class:active={filters.tag === tag} onclick={() => toggleTag(tag)}>
            {tag}
            <span class="count">{count}</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="spacer"></div>

    {#if route === 'lists'}
      <div class="search" class:open={searchOpen || filters.query}>
        <button class="icon-btn" title="Search" aria-label="Search" onclick={openSearch}>
          <Icon name="search" size={16} />
        </button>
        <input
          class="search-input"
          type="text"
          placeholder="Search tabs…"
          bind:this={searchInput}
          bind:value={filters.query}
          onblur={onSearchBlur}
          onkeydown={onSearchKeydown}
        />
        {#if filters.query}
          <button class="icon-btn" aria-label="Clear search" onclick={() => ((filters.query = ''), searchInput?.focus())}>
            <Icon name="x" size={14} />
          </button>
        {/if}
      </div>
    {/if}

    <button
      class="icon-btn nav-btn"
      class:active={route === 'history'}
      title="Deleted history"
      aria-label="Deleted history"
      onclick={() => toggleRoute('history')}
    >
      <Icon name="restore" size={16} />
    </button>
    <button
      class="icon-btn nav-btn"
      class:active={route === 'settings'}
      title="Settings"
      aria-label="Settings"
      onclick={() => toggleRoute('settings')}
    >
      <Icon name="settings" size={16} />
    </button>
  </div>
</header>

<style>
  header {
    flex-shrink: 0;
    background: var(--bg);
  }

  .bar {
    max-width: 820px;
    margin: 0 auto;
    padding: 10px 24px 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wordmark {
    width: 118px;
    height: auto;
    flex-shrink: 0;
  }

  :global([data-theme='dark']) .wordmark {
    /* dark text → light; hue-rotate restores the blues */
    filter: invert(1) hue-rotate(180deg);
  }

  .tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    min-width: 0;
    margin-left: 8px;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--text-2);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
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
    font-size: 11px;
  }

  .tag-chip.active .count {
    color: inherit;
    opacity: 0.7;
  }

  .spacer {
    flex: 1;
  }

  .search {
    display: flex;
    align-items: center;
    width: 30px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    overflow: hidden;
    transition: width 0.22s ease, border-color 0.22s ease, background 0.22s ease;
    flex-shrink: 0;
  }

  .search.open {
    width: 230px;
    border-color: var(--border);
    background: var(--surface);
  }

  .search.open:focus-within {
    border-color: var(--accent);
  }

  .search-input {
    flex: 1;
    min-width: 0;
    padding: 5px 0;
    border: none;
    outline: none;
    background: none;
    color: var(--text);
  }

  .nav-btn {
    width: 30px;
    height: 30px;
  }

  .nav-btn.active {
    background: var(--accent-soft);
    color: var(--accent);
  }
</style>
