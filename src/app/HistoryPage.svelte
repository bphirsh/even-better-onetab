<script lang="ts">
  import type { TabItem, TabList, TrashEntry, TrashTabEntry } from '../core/types'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { timeAgo } from '../ui/time'
  import { toast } from '../ui/toast.svelte'
  import { act } from './actions'

  type FeedEntry = { kind: 'list'; entry: TrashEntry } | { kind: 'tab'; entry: TrashTabEntry }

  const feed = $derived(
    [
      ...app.trash.map(entry => ({ kind: 'list', entry }) as FeedEntry),
      ...app.tabTrash.map(entry => ({ kind: 'tab', entry }) as FeedEntry),
    ].sort((a, b) => b.entry.deletedAt - a.entry.deletedAt),
  )

  const CAP = 10
  let showAll = $state(false)
  const visible = $derived(showAll ? feed : feed.slice(0, CAP))

  const retentionNote = $derived(
    ({
      immediately: 'New deletions are removed immediately.',
      day: 'Kept for 1 day, then cleared.',
      week: 'Kept for 1 week, then cleared.',
      month: 'Kept for 1 month, then cleared.',
    })[app.opts.trashRetention],
  )

  // lists start expanded; clicking collapses
  let collapsed = $state<Record<string, boolean>>({})
  const toggle = (key: string) => (collapsed[key] = !collapsed[key])

  const domain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  const openTab = (url: string) => chrome.tabs.create({ url, active: app.opts.focusOpenedTab })

  const recover = async (id: string) => {
    const { ok } = await act({ type: 'trash-restore', id })
    if (ok) toast('List recovered — it’s back in Lists')
  }

  const recoverTab = async (id: string) => {
    const { ok } = await act({ type: 'tab-trash-restore', id })
    if (ok) toast('Tab recovered — it’s back in its list')
  }

  const deleteListForever = async (entry: TrashEntry) => {
    const copy = $state.snapshot(entry) as TrashEntry
    const { ok } = await act({ type: 'trash-delete', id: entry.list._id, deletedAt: entry.deletedAt })
    if (ok) toast('List permanently deleted', 'info', { label: 'Undo', fn: () => act({ type: 'trash-put', entry: copy }) })
  }

  const deleteTabForever = async (entry: TrashTabEntry) => {
    const copy = $state.snapshot(entry) as TrashTabEntry
    const { ok } = await act({ type: 'tab-trash-delete', id: entry.id })
    if (ok) toast('Tab permanently deleted', 'info', { label: 'Undo', fn: () => act({ type: 'tab-trash-put', entry: copy }) })
  }

  const clearAll = async () => {
    const trash = $state.snapshot(app.trash) as TrashEntry[]
    const tabTrash = $state.snapshot(app.tabTrash) as TrashTabEntry[]
    const { ok } = await act({ type: 'trash-clear' })
    if (ok) toast('History cleared', 'info', { label: 'Undo', fn: () => act({ type: 'trash-put-all', trash, tabTrash }) })
  }
</script>

{#snippet favicon(tab: TabItem)}
  <span class="fav">
    {#if tab.favIconUrl}
      <img
        src={tab.favIconUrl}
        alt=""
        loading="lazy"
        onerror={e => {
          const img = e.currentTarget as HTMLImageElement
          if (img.parentElement) img.parentElement.textContent = (tab.title || tab.url).charAt(0).toUpperCase()
        }}
      />
    {:else}
      {(tab.title || tab.url).charAt(0).toUpperCase()}
    {/if}
  </span>
{/snippet}

{#snippet tabsPreview(list: TabList)}
  <div class="tab-list">
    {#each list.tabs as tab, i (i)}
      <button class="tab" title={tab.url} onclick={() => openTab(tab.url)}>
        {@render favicon(tab)}
        <span class="tab-title">{tab.title || tab.url}</span>
        <span class="tab-domain">{domain(tab.url)}</span>
      </button>
    {/each}
  </div>
{/snippet}

<div class="page">
  <div class="page-head">
    <h1>Recently Deleted</h1>
    {#if feed.length > 0}
      <button class="btn danger" onclick={clearAll}>
        <Icon name="trash" size={13} /> Clear all
      </button>
    {/if}
  </div>

  {#if feed.length === 0}
    {#if app.opts.trashRetention === 'immediately'}
      <p class="empty">Deleted items are removed immediately — change “Deleted lists are” in Settings to keep them recoverable here.</p>
    {:else}
      <p class="empty">Nothing here. Deleted lists and tabs land here so you can recover them.</p>
    {/if}
  {:else}
    <div class="card">
      {#each visible as item (item.kind + (item.kind === 'list' ? item.entry.list._id + item.entry.deletedAt : item.entry.id))}
        {#if item.kind === 'list'}
          {@const entry = item.entry}
          {@const key = entry.list._id + entry.deletedAt}
          <div class="entry">
            <div
              class="row"
              role="button"
              tabindex="0"
              onclick={() => toggle(key)}
              onkeydown={e => e.key === 'Enter' && toggle(key)}
            >
              <span class="chevron" class:open={!collapsed[key]}><Icon name="chevron" size={14} /></span>
              <div class="label">{entry.list.title}</div>
              <span class="deleted-when">Deleted {timeAgo(entry.deletedAt)}</span>
              <div class="actions slide">
                <button
                  class="icon-btn"
                  title="Recover list"
                  aria-label="Recover list"
                  onclick={e => (e.stopPropagation(), recover(entry.list._id))}
                >
                  <Icon name="restore" size={15} />
                </button>
                <button
                  class="icon-btn del"
                  title="Delete permanently"
                  aria-label="Delete permanently"
                  onclick={e => (e.stopPropagation(), deleteListForever(entry))}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
            {#if !collapsed[key]}
              {@render tabsPreview(entry.list)}
            {/if}
          </div>
        {:else}
          {@const entry = item.entry}
          <div class="entry">
            <div class="tab-entry">
              <button
                class="tab"
                title={`${entry.tab.url} — from “${entry.listTitle || 'Untitled'}”, deleted ${timeAgo(entry.deletedAt)}`}
                onclick={() => openTab(entry.tab.url)}
              >
                {@render favicon(entry.tab)}
                <span class="tab-title">{entry.tab.title || entry.tab.url}</span>
                <span class="tab-domain">{domain(entry.tab.url)}</span>
              </button>
              <span class="deleted-when">Deleted {timeAgo(entry.deletedAt)}</span>
              <div class="actions slide">
                <button class="icon-btn" title="Recover tab" aria-label="Recover tab" onclick={() => recoverTab(entry.id)}>
                  <Icon name="restore" size={15} />
                </button>
                <button
                  class="icon-btn del"
                  title="Delete permanently"
                  aria-label="Delete permanently"
                  onclick={() => deleteTabForever(entry)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </div>
    {#if feed.length > CAP && !showAll}
      <button class="see-all" onclick={() => (showAll = true)}>See all ({feed.length})</button>
    {/if}
    <p class="note">{retentionNote}</p>
  {/if}
</div>

<style>
  .page {
    max-width: 640px;
    margin: 0 auto;
    padding: 18px 24px 80px;
  }

  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 18px;
  }

  h1 {
    font-size: 20px;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 4px 16px;
  }

  .entry {
    border-bottom: 1px solid var(--border);
  }

  .entry:last-child {
    border-bottom: none;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }

  .tab-entry {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 0;
  }

  .tab-entry .tab {
    flex: 1;
    min-width: 0;
  }

  .deleted-when {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--text-3);
    white-space: nowrap;
  }

  /* actions slide in on hover; at rest the row text extends into their space */
  .actions.slide {
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-width 0.18s ease, opacity 0.15s ease;
  }

  .entry:hover .actions.slide,
  .actions.slide:focus-within {
    max-width: 64px;
    opacity: 1;
  }

  .chevron {
    display: inline-flex;
    color: var(--text-3);
    flex-shrink: 0;
  }

  .chevron :global(svg) {
    transition: transform 0.15s ease;
    transform: rotate(-90deg);
  }

  .chevron.open :global(svg) {
    transform: rotate(0deg);
  }

  .fav {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--text-3);
    font-size: 10px;
    font-weight: 600;
    overflow: hidden;
  }

  .fav img {
    width: 16px;
    height: 16px;
    border-radius: 3px;
  }

  .label {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .actions .del:hover {
    color: var(--danger);
  }

  .tab-list {
    display: flex;
    flex-direction: column;
    padding: 0 0 10px 24px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 8px;
    border-radius: 6px;
    text-align: left;
    min-width: 0;
    cursor: pointer;
  }

  .tab:hover {
    background: var(--surface-hover);
  }

  :global([data-theme='dark']) .tab:hover {
    background: var(--surface-2);
  }

  .tab-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tab-domain {
    flex-shrink: 1;
    min-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--text-3);
  }

  .see-all {
    display: block;
    margin: 8px auto 0;
    padding: 5px 14px;
    border-radius: var(--radius-sm);
    color: var(--accent);
    font-size: 12.5px;
    font-weight: 600;
  }

  .see-all:hover {
    background: var(--accent-soft);
  }

  .empty,
  .note {
    color: var(--text-3);
    font-size: 13px;
    margin: 4px 2px;
  }

  .note {
    margin-top: 10px;
    text-align: center;
  }
</style>
