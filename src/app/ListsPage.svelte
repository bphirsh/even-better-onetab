<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import type { TabList } from '../core/types'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { act } from './actions'
  import { filters, filtersActive } from './filters.svelte'
  import ListCard from './ListCard.svelte'

  interface ListItem {
    id: string
    list: TabList
  }

  const matches = (list: TabList) => {
    if (filters.tag && !list.tags.includes(filters.tag)) return false
    const q = filters.query.trim().toLowerCase()
    if (!q) return true
    if (list.title.toLowerCase().includes(q)) return true
    return list.tabs.some(t => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q))
  }

  let dndItems = $state<ListItem[]>([])
  let dragging = $state(false)

  $effect(() => {
    const items = app.lists.filter(matches).map(list => ({ id: list._id, list }))
    if (!dragging) dndItems = items
  })

  const canReorder = $derived(!filtersActive())
  let dragDisabled = $state(true)

  const startDrag = () => {
    if (canReorder) dragDisabled = false
  }

  const onConsider = (e: CustomEvent<DndEvent<ListItem>>) => {
    dragging = true
    dndItems = e.detail.items
  }

  const onFinalize = (e: CustomEvent<DndEvent<ListItem>>) => {
    dndItems = e.detail.items
    dragging = false
    dragDisabled = true
    const id = String(e.detail.info.id)
    const toIndex = dndItems.findIndex(i => i.id === id)
    if (toIndex >= 0) act({ type: 'lists-reorder', id, toIndex })
  }

  const storeAll = () => act({ type: 'store-tabs', which: 'all' })
</script>

<div class="page">
  <div class="toolbar">
    <div class="search">
      <Icon name="search" size={15} />
      <input
        class="search-input"
        type="text"
        placeholder="Search tabs…"
        bind:value={filters.query}
      />
      {#if filters.query}
        <button class="icon-btn" aria-label="Clear search" onclick={() => (filters.query = '')}>
          <Icon name="x" size={14} />
        </button>
      {/if}
    </div>
    {#if filters.tag}
      <button class="tag-chip" onclick={() => (filters.tag = null)}>
        <Icon name="tag" size={12} />
        {filters.tag}
        <Icon name="x" size={12} />
      </button>
    {/if}
    <div class="spacer"></div>
    <button class="btn primary" onclick={storeAll}>
      <Icon name="archive" size={15} />
      Store all tabs
    </button>
  </div>

  {#if app.loaded && app.lists.length === 0}
    <div class="empty">
      <Icon name="layers" size={40} />
      <h2>No stored tabs yet</h2>
      <p>Click “Store all tabs” or use the toolbar button to save your open tabs here.</p>
    </div>
  {:else if app.loaded && dndItems.length === 0}
    <div class="empty">
      <p>Nothing matches your filter.</p>
    </div>
  {:else}
    <div
      class="lists"
      use:dndzone={{ items: dndItems, type: 'list', flipDurationMs: 150, dragDisabled, dropTargetStyle: {} }}
      onconsider={onConsider}
      onfinalize={onFinalize}
    >
      {#each dndItems as item (item.id)}
        <div class="list-wrap">
          <ListCard list={item.list} canDrag={canReorder} onHandleDown={startDrag} />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 820px;
    margin: 0 auto;
    padding: 0 24px 60px;
  }

  .toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 0 12px;
    background: var(--bg);
  }

  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 1 340px;
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
    padding: 8px 0;
    border: none;
    outline: none;
    background: none;
    color: var(--text);
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 13px;
    font-weight: 500;
  }

  .spacer {
    flex: 1;
  }

  .lists {
    display: flex;
    flex-direction: column;
    gap: 12px;
    outline: none;
  }

  .list-wrap {
    outline: none;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 80px 0;
    color: var(--text-3);
    text-align: center;
  }

  .empty h2 {
    margin: 10px 0 0;
    font-size: 17px;
    color: var(--text-2);
  }

  .empty p {
    margin: 0;
    max-width: 360px;
  }
</style>
