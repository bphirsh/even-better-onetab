<script lang="ts">
  import { flip } from 'svelte/animate'
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import { t } from '../i18n/i18n.svelte'
  import type { TabList } from '../core/types'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { act } from './actions'
  import { startAutoScroll, stopAutoScroll } from './dnd-autoscroll'
  import { filters, filtersActive } from './filters.svelte'
  import ListCard from './ListCard.svelte'

  // keep the FLIP reflow in step with the dnd library's own flip timing
  const flipMs = 150

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
    const filtered = app.lists.filter(matches)
    const pinned = filtered.filter(l => l.pinned)
    const rest = filtered.filter(l => !l.pinned)
    const ordered = app.opts.pinnedPosition === 'bottom' ? [...rest, ...pinned] : [...pinned, ...rest]
    if (!dragging) dndItems = ordered.map(list => ({ id: list._id, list }))
  })

  const canReorder = $derived(!filtersActive())

  const onConsider = (e: CustomEvent<DndEvent<ListItem>>) => {
    dragging = true
    startAutoScroll()
    dndItems = e.detail.items
  }

  const onFinalize = (e: CustomEvent<DndEvent<ListItem>>) => {
    dndItems = e.detail.items
    dragging = false
    stopAutoScroll()
    // the dropped arrangement becomes the stored order; the pinned group
    // re-floats on top of it, so within-group order is what the drag decides
    act({ type: 'lists-set-order', ids: dndItems.map(i => i.id) })
  }
</script>

<div class="page">
  {#if app.loaded && app.lists.length === 0}
    <div class="empty">
      <Icon name="layers" size={40} />
      <h2>{t('lists.empty.title')}</h2>
      <p>{t('lists.empty.lead')}</p>
      <ul class="ways">
        <li><span class="k">{t('lists.empty.toolbarLabel')}</span> {t('lists.empty.toolbar')}</li>
        <li><span class="k">{t('lists.empty.rightClickLabel')}</span> {t('lists.empty.rightClick')}</li>
        <li><span class="k">{t('lists.empty.keyboardLabel')}</span> {t('lists.empty.keyboard')}</li>
      </ul>
    </div>
  {:else if app.loaded && dndItems.length === 0}
    <div class="empty">
      <p>{t('lists.noMatch')}</p>
    </div>
  {:else}
    <div
      class="lists"
      use:dndzone={{ items: dndItems, type: 'list', flipDurationMs: 150, dragDisabled: !canReorder, dropTargetStyle: {} }}
      onconsider={onConsider}
      onfinalize={onFinalize}
    >
      {#each dndItems as item (item.id)}
        <div class="list-wrap" animate:flip={{ duration: flipMs }}>
          <ListCard list={item.list} canDrag={canReorder} />
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

  :global(.comfortable) .lists {
    gap: 18px;
  }

  .list-wrap {
    outline: none;
    /* the dnd library inline-styles cursor: grab on every item; only the
       grip should advertise dragging (!important beats the inline style) */
    cursor: auto !important;
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

  .ways {
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
    max-width: 380px;
  }

  .ways li {
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.5;
  }

  .ways .k {
    display: inline-block;
    min-width: 74px;
    margin-right: 8px;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    text-align: center;
  }
</style>
