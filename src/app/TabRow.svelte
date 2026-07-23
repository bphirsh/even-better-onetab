<script lang="ts">
  import type { TabItem } from '../core/types'
  import type { Options } from '../core/options'
  import { GROUP_COLORS } from '../ui/colors'
  import Icon from '../ui/Icon.svelte'
  import { t } from '../i18n/i18n.svelte'

  let {
    tab,
    display,
    hideFavicon,
    removeVisible = 'hover',
    onOpen,
    onRemove,
  }: {
    tab: TabItem
    display: Options['itemDisplay']
    hideFavicon: boolean
    /** Whether the remove button shows always or only on row hover. */
    removeVisible?: 'hover' | 'always'
    /** keep = true when a modifier (cmd/ctrl) is held, meaning "don't remove". */
    onOpen: (keep: boolean) => void
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

<div
  class="row"
  role="button"
  tabindex="0"
  onclick={e => onOpen(e.metaKey || e.ctrlKey)}
  onkeydown={e => e.key === 'Enter' && onOpen(e.metaKey || e.ctrlKey)}
>
  {#if !hideFavicon}
    {#if tab.favIconUrl && !faviconFailed}
      <img class="favicon" src={tab.favIconUrl} alt="" onerror={() => (faviconFailed = true)} />
    {:else}
      <span class="favicon fallback">{letter}</span>
    {/if}
  {/if}

  {#if tab.group}
    <span
      class="group"
      class:unnamed={!tab.group.title}
      style:--gc={GROUP_COLORS[tab.group.color] ?? GROUP_COLORS.grey}
      title={t('tab.group', { title: tab.group.title || t('tab.unnamed') })}
    >{tab.group.title}</span>
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
    <span class="pinned" title={t('tab.wasPinned')}><Icon name="pin" size={11} /></span>
  {/if}

  <button
    class="remove"
    class:always={removeVisible === 'always'}
    title={t('tab.remove')}
    aria-label={t('tab.remove')}
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

  :global(.comfortable) .row {
    padding-top: 10px;
    padding-bottom: 10px;
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

  .group {
    flex-shrink: 0;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 1px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--gc) 18%, transparent);
    color: var(--gc);
    font-size: 11.5px;
    font-weight: 600;
  }

  .group.unnamed {
    width: 9px;
    height: 9px;
    padding: 0;
    border-radius: 50%;
    background: var(--gc);
  }

  .remove {
    /* stays in layout while invisible so the row doesn't resize on hover */
    display: inline-flex;
    visibility: hidden;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    color: var(--text-3);
    flex-shrink: 0;
  }

  .row:hover .remove,
  .remove.always {
    visibility: visible;
  }

  .remove:hover {
    color: var(--danger);
    background: var(--surface-2);
  }
</style>
