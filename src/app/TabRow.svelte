<script lang="ts">
  import type { TabItem } from '../core/types'
  import type { Options } from '../core/options'
  import Icon from '../ui/Icon.svelte'

  let {
    tab,
    display,
    hideFavicon,
    onOpen,
    onRemove,
  }: {
    tab: TabItem
    display: Options['itemDisplay']
    hideFavicon: boolean
    onOpen: () => void
    onRemove: () => void
  } = $props()

  let faviconFailed = $state(false)

  const domain = $derived.by(() => {
    try {
      return new URL(tab.url).hostname
    } catch {
      return ''
    }
  })

  const letter = $derived((tab.title || domain || '?').charAt(0).toUpperCase())
</script>

<div class="row" role="button" tabindex="0" onclick={onOpen} onkeydown={e => e.key === 'Enter' && onOpen()}>
  {#if !hideFavicon}
    {#if tab.favIconUrl && !faviconFailed}
      <img class="favicon" src={tab.favIconUrl} alt="" onerror={() => (faviconFailed = true)} />
    {:else}
      <span class="favicon fallback">{letter}</span>
    {/if}
  {/if}

  {#if display === 'url'}
    <span class="url only">{tab.url}</span>
  {:else}
    <span class="title">{tab.title || tab.url}</span>
    {#if display === 'title-and-url'}
      <span class="url">{domain || tab.url}</span>
    {/if}
  {/if}

  {#if tab.pinned}
    <span class="pinned" title="Was pinned"><Icon name="pin" size={11} /></span>
  {/if}

  <button
    class="remove"
    title="Remove from list"
    aria-label="Remove from list"
    onclick={e => {
      e.stopPropagation()
      onRemove()
    }}
  >
    <Icon name="x" size={13} />
  </button>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px 6px 34px;
    border-radius: 7px;
    cursor: pointer;
    min-width: 0;
  }

  .row:hover {
    background: var(--surface-hover);
  }

  :global([data-theme='dark']) .row:hover {
    background: var(--surface-2);
  }

  .favicon {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .favicon.fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--text-3);
    font-size: 10px;
    font-weight: 600;
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
  }

  .url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-3);
    font-size: 12px;
    flex: 1;
    min-width: 60px;
  }

  .url.only {
    color: var(--text-2);
    font-size: 13px;
  }

  .pinned {
    display: inline-flex;
    color: var(--text-3);
    flex-shrink: 0;
  }

  .remove {
    display: none;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    color: var(--text-3);
    flex-shrink: 0;
  }

  .row:hover .remove {
    display: inline-flex;
  }

  .remove:hover {
    color: var(--danger);
    background: var(--surface-2);
  }
</style>
