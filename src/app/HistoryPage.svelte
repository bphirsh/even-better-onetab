<script lang="ts">
  import type { TabList } from '../core/types'
  import { colorOf } from '../ui/colors'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { timeAgo } from '../ui/time'
  import { toast } from '../ui/toast.svelte'
  import { act } from './actions'

  const archived = $derived(app.lists.filter(l => l.archived))

  const retentionLabel = $derived(
    ({ immediately: 'removed immediately', day: 'kept for 1 day', week: 'kept for 1 week', month: 'kept for 1 month' })[
      app.opts.trashRetention
    ],
  )

  let expanded = $state<Record<string, boolean>>({})
  const toggle = (key: string) => (expanded[key] = !expanded[key])

  const label = (list: TabList) => list.title || `${list.tabs.length} tab${list.tabs.length === 1 ? '' : 's'}`

  const domain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  const openTab = (url: string) => chrome.tabs.create({ url, active: app.opts.focusOpenedTab })

  const unarchive = (id: string) => act({ type: 'list-update', id, patch: { archived: false } }, 'Moved back to Lists')

  const openList = (id: string) => act({ type: 'restore-list', id })

  const deleteList = async (list: TabList) => {
    if (app.opts.alertRemoveList && !confirm(`Delete “${label(list)}”?`)) return
    const { ok } = await act({ type: 'list-remove', id: list._id })
    if (ok) toast(app.opts.trashRetention === 'immediately' ? 'List deleted' : 'List deleted — recoverable below')
  }

  const recover = async (id: string) => {
    const { ok } = await act({ type: 'trash-restore', id })
    if (ok) toast('List recovered — it’s back in Lists')
  }
</script>

{#snippet tabsPreview(list: TabList)}
  <div class="tab-list">
    {#each list.tabs as tab, i (i)}
      <button class="tab" title={tab.url} onclick={() => openTab(tab.url)}>
        <span class="tab-title">{tab.title || tab.url}</span>
        <span class="tab-domain">{domain(tab.url)}</span>
      </button>
    {/each}
  </div>
{/snippet}

<div class="page">
  <h1>Archive &amp; history</h1>

  <section>
    <h2>Archived</h2>
    {#if archived.length === 0}
      <p class="empty">Nothing archived. Archiving hides a list from the main page without deleting it — find it in a list’s ⋯ menu.</p>
    {:else}
      <div class="card">
        {#each archived as list (list._id)}
          <div class="entry">
            <div
              class="row"
              role="button"
              tabindex="0"
              onclick={() => toggle(list._id)}
              onkeydown={e => e.key === 'Enter' && toggle(list._id)}
            >
              <span class="chevron" class:open={expanded[list._id]}><Icon name="chevron" size={14} /></span>
              <span class="color-dot" style:background={colorOf(list.color) ?? 'var(--border)'}></span>
              <div class="text">
                <div class="label" class:untitled={!list.title}>{label(list)}</div>
                <div class="desc">{list.tabs.length} tab{list.tabs.length === 1 ? '' : 's'} · stored {timeAgo(list.time)}</div>
              </div>
              <div class="actions">
                <button class="btn" onclick={e => (e.stopPropagation(), openList(list._id))}>Open</button>
                <button class="btn" onclick={e => (e.stopPropagation(), unarchive(list._id))}>
                  <Icon name="upload" size={13} /> Unarchive
                </button>
                <button
                  class="btn danger"
                  title="Delete list"
                  aria-label="Delete list"
                  onclick={e => (e.stopPropagation(), deleteList(list))}
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
            {#if expanded[list._id]}
              {@render tabsPreview(list)}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section>
    <h2>Recently deleted</h2>
    {#if app.opts.trashRetention === 'immediately' && app.trash.length === 0}
      <p class="empty">Deleted lists are removed immediately — change “Deleted lists are” in Settings to keep them recoverable here.</p>
    {:else if app.trash.length === 0}
      <p class="empty">No deleted lists. Deleted lists are {retentionLabel} on this device.</p>
    {:else}
      <div class="card">
        {#each app.trash as entry (entry.list._id + entry.deletedAt)}
          {@const key = entry.list._id + entry.deletedAt}
          <div class="entry">
            <div
              class="row"
              role="button"
              tabindex="0"
              onclick={() => toggle(key)}
              onkeydown={e => e.key === 'Enter' && toggle(key)}
            >
              <span class="chevron" class:open={expanded[key]}><Icon name="chevron" size={14} /></span>
              <span class="color-dot" style:background={colorOf(entry.list.color) ?? 'var(--border)'}></span>
              <div class="text">
                <div class="label" class:untitled={!entry.list.title}>{label(entry.list)}</div>
                <div class="desc">{entry.list.tabs.length} tab{entry.list.tabs.length === 1 ? '' : 's'} · deleted {timeAgo(entry.deletedAt)}</div>
              </div>
              <div class="actions">
                <button class="btn" onclick={e => (e.stopPropagation(), recover(entry.list._id))}>
                  <Icon name="restore" size={13} /> Recover
                </button>
              </div>
            </div>
            {#if expanded[key]}
              {@render tabsPreview(entry.list)}
            {/if}
          </div>
        {/each}
      </div>
      {#if app.opts.trashRetention === 'immediately'}
        <p class="note">New deletions are removed immediately — these entries disappear when the page reloads.</p>
      {:else}
        <p class="note">Deleted lists are {retentionLabel} on this device, then cleared automatically.</p>
      {/if}
    {/if}
  </section>
</div>

<style>
  .page {
    max-width: 640px;
    margin: 0 auto;
    padding: 18px 24px 80px;
  }

  h1 {
    font-size: 20px;
    margin: 0 0 18px;
    letter-spacing: -0.01em;
  }

  section {
    margin-bottom: 26px;
  }

  h2 {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
    margin: 0 0 8px 2px;
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

  .color-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .text {
    min-width: 0;
    flex: 1;
  }

  .label {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .label.untitled {
    color: var(--text-2);
  }

  .desc {
    font-size: 12px;
    color: var(--text-3);
  }

  .actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .actions .btn {
    padding: 5px 10px;
    font-size: 12.5px;
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

  .empty,
  .note {
    color: var(--text-3);
    font-size: 13px;
    margin: 4px 2px;
  }
</style>
