<script lang="ts">
  import { app, applyTheme, initState } from '../ui/state.svelte'
  import Header from './Header.svelte'
  import ListsPage from './ListsPage.svelte'
  import SettingsPage from './SettingsPage.svelte'
  import Toast from './Toast.svelte'

  initState()

  $effect(() => {
    if (app.loaded) applyTheme(app.opts.theme)
  })

  const routeFromHash = () => (location.hash.startsWith('#/settings') ? 'settings' : 'lists')
  let route = $state(routeFromHash())

  $effect(() => {
    const onHashChange = () => (route = routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })
</script>

<div class="shell">
  <Header {route} />
  <main>
    {#if route === 'settings'}
      <SettingsPage />
    {:else}
      <ListsPage />
    {/if}
  </main>
</div>
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
</style>
