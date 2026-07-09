<script lang="ts">
  import type { TabList } from '../core/types'
  import { colorOf } from '../ui/colors'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { timeAgo } from '../ui/time'
  import { toast } from '../ui/toast.svelte'
  import { act } from './actions'

  const archived = $derived(app.lists.filter(l => l.archived))

  const label = (list: TabList) => list.title || `${list.tabs.length} tab${list.tabs.length === 1 ? '' : 's'}`

  const unarchive = (id: string) => act({ type: 'list-update', id, patch: { archived: false } }, 'Moved back to Lists')

  const openList = (id: string) => act({ type: 'restore-list', id })

  const deleteList = async (list: TabList) => {
    if (app.opts.alertRemoveList && !confirm(`Delete “${label(list)}”?`)) return
    const { ok } = await act({ type: 'list-remove', id: list._id })
    if (ok) toast('List deleted — recoverable below for 30 days')
  }

  const recover = async (id: string) => {
    const { ok } = await act({ type: 'trash-restore', id })
    if (ok) toast('List recovered — it’s back in Lists')
  }
</script>

<div class="page">
  <h1>Archive &amp; history</h1>

  <section>
    <h2>Archived</h2>
    {#if archived.length === 0}
      <p class="empty">Nothing archived. Archiving hides a list from the main page without deleting it — find it in a list’s ⋯ menu.</p>
    {:else}
      <div class="card">
        {#each archived as list (list._id)}
          <div class="row">
            <span class="color-dot" style:background={colorOf(list.color) ?? 'var(--border)'}></span>
            <div class="text">
              <div class="label" class:untitled={!list.title}>{label(list)}</div>
              <div class="desc">{list.tabs.length} tab{list.tabs.length === 1 ? '' : 's'} · stored {timeAgo(list.time)}</div>
            </div>
            <div class="actions">
              <button class="btn" onclick={() => openList(list._id)}>Open</button>
              <button class="btn" onclick={() => unarchive(list._id)}>
                <Icon name="upload" size={13} /> Unarchive
              </button>
              <button class="btn danger" title="Delete list" aria-label="Delete list" onclick={() => deleteList(list)}>
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section>
    <h2>Recently deleted</h2>
    {#if app.trash.length === 0}
      <p class="empty">No deleted lists. Deleted lists are kept here for 30 days (on this device only).</p>
    {:else}
      <div class="card">
        {#each app.trash as entry (entry.list._id + entry.deletedAt)}
          <div class="row">
            <span class="color-dot" style:background={colorOf(entry.list.color) ?? 'var(--border)'}></span>
            <div class="text">
              <div class="label" class:untitled={!entry.list.title}>{label(entry.list)}</div>
              <div class="desc">{entry.list.tabs.length} tab{entry.list.tabs.length === 1 ? '' : 's'} · deleted {timeAgo(entry.deletedAt)}</div>
            </div>
            <div class="actions">
              <button class="btn" onclick={() => recover(entry.list._id)}>
                <Icon name="restore" size={13} /> Recover
              </button>
            </div>
          </div>
        {/each}
      </div>
      <p class="note">Deleted lists are kept for 30 days on this device, then cleared automatically.</p>
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

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }

  .row:last-child {
    border-bottom: none;
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

  .empty,
  .note {
    color: var(--text-3);
    font-size: 13px;
    margin: 4px 2px;
  }
</style>
