<script lang="ts">
  import { cubicOut } from 'svelte/easing'
  import { fly } from 'svelte/transition'
  import { applyLocale, t } from '../i18n/i18n.svelte'
  import { app, applyTheme, initState } from '../ui/state.svelte'
  import { timeAgo } from '../ui/time'
  import Header from './Header.svelte'
  import HistoryPage from './HistoryPage.svelte'
  import ListsPage from './ListsPage.svelte'
  import SettingsPage from './SettingsPage.svelte'
  import Toast from './Toast.svelte'

  initState()

  $effect(() => {
    if (app.loaded) applyTheme(app.opts.theme)
  })

  $effect(() => {
    if (app.loaded) applyLocale(app.opts.locale)
  })

  const routeFromHash = () => {
    if (location.hash.startsWith('#/settings')) return 'settings'
    if (location.hash.startsWith('#/history')) return 'history'
    return 'lists'
  }
  let route = $state(routeFromHash())

  $effect(() => {
    const onHashChange = () => (route = routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })

  // Once the page is scrolled, a top mask fades content out under the bar instead
  // of a hard cut. Off at the very top so the first heading stays crisp.
  let scrolled = $state(false)
  $effect(() => {
    route // reset when the route changes (fresh page starts at the top)
    scrolled = false
  })

  const totalTabs = $derived(app.lists.reduce((sum, list) => sum + list.tabs.length, 0))

  const syncStatus = $derived.by(() => {
    if (!app.syncConfig.enabled) return null
    if (app.syncState.error) return { kind: 'error' as const, text: t('sync.statusError') }
    if (app.syncState.lastPushAt) return { kind: 'ok' as const, text: t('sync.statusSynced', { time: timeAgo(app.syncState.lastPushAt) }) }
    return { kind: 'ok' as const, text: t('sync.statusOn') }
  })
</script>

<div class="shell" class:comfortable={app.opts.density === 'comfortable'}>
  <Header {route} />
  <main class:scrolled onscroll={e => (scrolled = e.currentTarget.scrollTop > 6)}>
    {#key route}
      <div class="route" in:fly={{ y: 8, duration: 170, easing: cubicOut }}>
        {#if route === 'settings'}
          <SettingsPage />
        {:else if route === 'history'}
          <HistoryPage />
        {:else}
          <ListsPage />
        {/if}
      </div>
    {/key}
  </main>
</div>

<a class="corner-status" href="#/settings" title={t('nav.settings')}>
  {#if syncStatus}
    <span class="dot" class:error={syncStatus.kind === 'error'}></span>
    <span>{syncStatus.text}</span>
    <span class="sep">·</span>
  {/if}
  <span>{t('status.lists', { n: app.lists.length })} · {t('status.tabs', { n: totalTabs })}</span>
</a>
<Toast />

<style>
  /* the page itself never scrolls; only <main> does */
  :global(html),
  :global(body) {
    height: 100%;
    overflow: hidden;
  }

  .shell {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  /* content dissolves under the top bar once scrolled, rather than a hard edge */
  main.scrolled {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 34px);
    mask-image: linear-gradient(to bottom, transparent 0, #000 34px);
  }

  .corner-status {
    position: fixed;
    right: 14px;
    bottom: 12px;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--bg);
    font-size: 11.5px;
    color: var(--text-3);
    text-decoration: none;
    opacity: 0.85;
  }

  .corner-status:hover {
    opacity: 1;
    color: var(--text-2);
    text-decoration: none;
    background: var(--surface-2);
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4caf78;
  }

  .dot.error {
    background: var(--danger);
  }

  .sep {
    opacity: 0.6;
  }
</style>
