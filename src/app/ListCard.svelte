<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import type { TabItem, TabList } from '../core/types'
  import { COLOR_NAMES, LIST_COLORS, colorOf } from '../ui/colors'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { timeAgo } from '../ui/time'
  import { toast } from '../ui/toast.svelte'
  import { act } from './actions'
  import { startAutoScroll, stopAutoScroll } from './dnd-autoscroll'
  import TabRow from './TabRow.svelte'

  let {
    list,
    canDrag = false,
    onHandleDown = () => {},
  }: { list: TabList; canDrag?: boolean; onHandleDown?: () => void } = $props()

  interface TabDndItem {
    id: string
    tab: TabItem
  }

  let tabItems = $state<TabDndItem[]>([])
  let draggingTabs = $state(false)

  $effect(() => {
    const items = list.tabs.map((tab, i) => ({ id: `${list._id}:${i}:${tab.url}`, tab }))
    if (!draggingTabs) tabItems = items
  })

  const onConsider = (e: CustomEvent<DndEvent<TabDndItem>>) => {
    draggingTabs = true
    startAutoScroll()
    tabItems = e.detail.items
  }

  const onFinalize = (e: CustomEvent<DndEvent<TabDndItem>>) => {
    tabItems = e.detail.items
    draggingTabs = false
    stopAutoScroll()
    act({ type: 'list-update', id: list._id, patch: { tabs: tabItems.map(i => i.tab) } })
  }

  // --- title editing ---
  let editingTitle = $state(false)
  let titleDraft = $state('')

  const startTitleEdit = () => {
    titleDraft = list.title
    editingTitle = true
  }

  const commitTitle = () => {
    if (!editingTitle) return
    editingTitle = false
    if (titleDraft !== list.title) act({ type: 'list-update', id: list._id, patch: { title: titleDraft.trim() } })
  }

  // --- tags editing ---
  let editingTags = $state(false)
  let tagsDraft = $state('')

  const startTagsEdit = () => {
    tagsDraft = list.tags.join(', ')
    editingTags = true
    menuOpen = false
  }

  const commitTags = () => {
    if (!editingTags) return
    editingTags = false
    const tags = [...new Set(tagsDraft.split(',').map(t => t.trim()).filter(Boolean))]
    act({ type: 'list-update', id: list._id, patch: { tags } })
  }

  // --- menu ---
  let menuOpen = $state(false)
  let menuEl: HTMLElement | undefined = $state()

  const onWindowClick = (e: MouseEvent) => {
    if (menuOpen && menuEl && !menuEl.contains(e.target as Node)) menuOpen = false
  }

  const toggleExpand = () => act({ type: 'list-update', id: list._id, patch: { expand: !list.expand } })
  const togglePin = () => {
    menuOpen = false
    act({ type: 'list-update', id: list._id, patch: { pinned: !list.pinned } })
  }

  const setColor = (color: string) => {
    menuOpen = false
    act({ type: 'list-update', id: list._id, patch: { color } })
  }

  /** Captures the list and its position so an undo can put it right back. */
  const captureForUndo = () => ({
    copy: $state.snapshot(list) as TabList,
    index: Math.max(0, app.lists.findIndex(l => l._id === list._id)),
  })

  const undoAction = ({ copy, index }: ReturnType<typeof captureForUndo>) => ({
    label: 'Undo',
    fn: () => act({ type: 'list-add', list: copy, index }),
  })

  const restore = async (newWindow = false, remove = false) => {
    menuOpen = false
    if (!remove) {
      act({ type: 'restore-list', id: list._id, newWindow })
      return
    }
    const captured = captureForUndo()
    const { ok } = await act({ type: 'restore-list', id: list._id, newWindow, remove: true })
    if (ok) toast('List restored & removed', 'info', undoAction(captured))
  }

  const removeListNow = async () => {
    menuOpen = false
    if (app.opts.alertRemoveList && !confirm(`Delete “${list.title || `${list.tabs.length} tabs`}”?`)) return
    const captured = captureForUndo()
    const { ok } = await act({ type: 'list-remove', id: list._id })
    if (ok) toast('List deleted', 'info', undoAction(captured))
  }

  const copyMarkdown = async () => {
    menuOpen = false
    const escapeTitle = (s: string) => s.replace(/[\[\]]/g, m => '\\' + m)
    const lines = list.tabs.map(t => `- [${escapeTitle(t.title || t.url)}](${t.url})`)
    const text = (list.title ? `## ${list.title}\n\n` : '') + lines.join('\n') + '\n'
    await navigator.clipboard.writeText(text)
    toast('Copied as Markdown')
  }

  const openTab = (index: number) => {
    const tab = list.tabs[index]
    if (!tab) return
    // single tabs follow the same "Open tabs in" setting as list restores
    if (app.opts.restorePosition === 'new-window') {
      chrome.windows.create({ url: tab.url, focused: app.opts.focusOpenedTab })
    } else {
      chrome.tabs.create({
        url: tab.url,
        active: app.opts.focusOpenedTab,
        ...(app.opts.restorePosition === 'start' ? { index: 0 } : {}),
      })
    }
    if (app.opts.itemClickAction === 'open-and-remove') {
      const tabs = list.tabs.filter((_, i) => i !== index)
      act({ type: 'list-update', id: list._id, patch: { tabs } })
    }
  }

  const removeTab = (index: number) => {
    const tab = list.tabs[index]
    if (!tab) return
    // explicit deletion goes through the SW so the tab lands in History's tab trash
    act({ type: 'tab-remove', listId: list._id, index, url: tab.url })
  }

  const accent = $derived(colorOf(list.color))
</script>

<svelte:window onclick={onWindowClick} />

<section class="card" style:--list-accent={accent ?? 'transparent'}>
  <header>
    {#if canDrag}
      <button
        class="icon-btn grip"
        aria-label="Drag to reorder"
        onmousedown={onHandleDown}
        ontouchstart={onHandleDown}
      >
        <Icon name="grip" size={14} />
      </button>
    {/if}

    <button class="icon-btn chevron" class:collapsed={!list.expand} aria-label="Expand or collapse" onclick={toggleExpand}>
      <Icon name="chevron" size={16} />
    </button>

    {#if editingTitle}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="title-input"
        type="text"
        placeholder="List title"
        autofocus
        bind:value={titleDraft}
        onblur={commitTitle}
        onkeydown={e => {
          if (e.key === 'Enter') commitTitle()
          if (e.key === 'Escape') (titleDraft = list.title), commitTitle()
        }}
      />
    {:else}
      <button class="title" class:untitled={!list.title} onclick={startTitleEdit} title="Click to rename">
        <span class="title-text">{list.title || 'Untitled'}</span>
      </button>
    {/if}

    {#if list.pinned}
      <span class="pin-badge" title="Pinned"><Icon name="pin" size={13} /></span>
    {/if}

    <span class="meta">{list.tabs.length} tab{list.tabs.length === 1 ? '' : 's'} · {timeAgo(list.time)}</span>

    <div class="actions">
      <button class="open-btn" title="Open all tabs in this list" onclick={() => restore()}>Open</button>
      <button class="icon-btn delete-btn" title="Delete list" aria-label="Delete list" onclick={removeListNow}>
        <Icon name="trash" size={15} />
      </button>
      <div class="dropdown" bind:this={menuEl}>
        <button class="icon-btn" title="More" onclick={() => (menuOpen = !menuOpen)}>
          <Icon name="more" size={15} />
        </button>
        {#if menuOpen}
          <div class="menu">
            <button class="menu-item" onclick={() => restore(true)}>
              <Icon name="external" size={14} /> Open in new window
            </button>
            <button class="menu-item" onclick={() => restore(false, true)}>
              <Icon name="restore" size={14} /> Open &amp; remove
            </button>
            <div class="menu-sep"></div>
            <button class="menu-item" onclick={togglePin}>
              <Icon name="pin" size={14} />
              {list.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button class="menu-item" onclick={startTagsEdit}>
              <Icon name="tag" size={14} /> Edit tags
            </button>
            <button class="menu-item" onclick={copyMarkdown}>
              <Icon name="copy" size={14} /> Copy as Markdown
            </button>
            <div class="menu-sep"></div>
            <div class="swatches">
              {#each COLOR_NAMES as name (name)}
                <button
                  class="swatch"
                  class:active={list.color === name}
                  style:background={name ? LIST_COLORS[name] : 'var(--surface-2)'}
                  title={name || 'No color'}
                  aria-label={name || 'No color'}
                  onclick={() => setColor(name)}
                ></button>
              {/each}
            </div>
            <div class="menu-sep"></div>
            <button class="menu-item danger" onclick={removeListNow}>
              <Icon name="trash" size={14} /> Delete list
            </button>
          </div>
        {/if}
      </div>
    </div>
  </header>

  {#if editingTags}
    <div class="tags-editor">
      <Icon name="tag" size={13} />
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="tags-input"
        type="text"
        placeholder="Comma-separated tags"
        autofocus
        bind:value={tagsDraft}
        onblur={commitTags}
        onkeydown={e => {
          if (e.key === 'Enter') commitTags()
          if (e.key === 'Escape') (tagsDraft = list.tags.join(', ')), commitTags()
        }}
      />
    </div>
  {:else if list.tags.length > 0}
    <div class="tags">
      {#each list.tags as tag (tag)}
        <button class="tag" onclick={startTagsEdit}>{tag}</button>
      {/each}
    </div>
  {/if}

  {#if list.expand}
    <div
      class="tabs"
      use:dndzone={{
        items: tabItems,
        type: 'tab',
        flipDurationMs: 120,
        dropTargetStyle: { outline: '2px dashed var(--border)', outlineOffset: '-2px', borderRadius: '8px' },
      }}
      onconsider={onConsider}
      onfinalize={onFinalize}
    >
      {#each tabItems as item, index (item.id)}
        <TabRow
          tab={item.tab}
          display={app.opts.itemDisplay}
          hideFavicon={app.opts.hideFavicon}
          onOpen={() => openTab(index)}
          onRemove={() => removeTab(index)}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--list-accent);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 6px 10px 8px;
  }

  header {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
  }

  .grip {
    cursor: grab;
    color: var(--text-3);
  }

  .chevron :global(svg) {
    transition: transform 0.15s ease;
  }

  .chevron.collapsed :global(svg) {
    transform: rotate(-90deg);
  }

  .title {
    font-weight: 600;
    font-size: 14px;
    padding: 4px 6px;
    border-radius: 6px;
    overflow: hidden;
    white-space: nowrap;
    max-width: 40%;
  }

  .title-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .title:hover {
    background: var(--surface-2);
  }

  /* untitled: collapsed to nothing so the meta sits where a name would be;
     hovering the card slides a ghost "Untitled" in smoothly */
  .title.untitled {
    color: var(--text-3);
    font-weight: 500;
    max-width: 0;
    padding-left: 0;
    padding-right: 0;
    opacity: 0;
    transition: max-width 0.22s ease, opacity 0.18s ease, padding 0.22s ease;
  }

  .card:hover .title.untitled,
  .title.untitled:focus-visible {
    max-width: 90px;
    padding-left: 6px;
    padding-right: 6px;
    opacity: 1;
  }

  .title-input {
    font-weight: 600;
    font-size: 14px;
    padding: 4px 6px;
    border: 1px solid var(--accent);
    border-radius: 6px;
    background: var(--surface);
    outline: none;
    width: 40%;
  }

  .pin-badge {
    display: inline-flex;
    color: var(--accent);
  }

  .meta {
    font-size: 12px;
    color: var(--text-3);
    white-space: nowrap;
  }

  .actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  .card:hover .actions,
  .dropdown:has(.menu) {
    opacity: 1;
  }

  .open-btn {
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--accent);
  }

  .open-btn:hover {
    background: var(--accent-soft);
  }

  .delete-btn:hover {
    color: var(--danger);
  }

  /* comfortable density */
  :global(.comfortable) .card {
    padding: 10px 14px 12px;
  }

  :global(.comfortable) header {
    min-height: 42px;
  }

  .dropdown {
    position: relative;
  }

  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    z-index: 20;
    min-width: 210px;
    padding: 5px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 10px;
    border-radius: 6px;
    text-align: left;
    color: var(--text);
  }

  .menu-item:hover {
    background: var(--surface-2);
  }

  .menu-item.danger {
    color: var(--danger);
  }

  .menu-sep {
    height: 1px;
    margin: 4px 6px;
    background: var(--border);
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 10px;
  }

  .swatch {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid transparent;
    flex-shrink: 0;
  }

  .swatch.active {
    border-color: var(--text);
  }

  .swatch:hover {
    transform: scale(1.15);
  }

  .tags,
  .tags-editor {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 2px 8px 6px 34px;
  }

  .tag {
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--text-2);
    font-size: 12px;
    font-weight: 500;
  }

  .tag:hover {
    background: var(--border);
  }

  .tags-editor {
    color: var(--text-3);
  }

  .tags-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--accent);
    border-radius: 6px;
    background: var(--surface);
    outline: none;
    font-size: 13px;
  }

  .tabs {
    display: flex;
    flex-direction: column;
    padding: 2px 0;
    min-height: 8px;
    outline: none;
  }
</style>
