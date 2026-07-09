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
</script>

<div class="page">
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
    padding: 16px 24px 60px;
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
