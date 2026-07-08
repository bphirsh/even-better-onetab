<script lang="ts">
  import { app, applyTheme, initState } from '../ui/state.svelte'
  import ListsPage from './ListsPage.svelte'
  import SettingsPage from './SettingsPage.svelte'
  import Sidebar from './Sidebar.svelte'
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

<div class="layout">
  <Sidebar {route} />
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
  .layout {
    display: flex;
    min-height: 100vh;
  }

  main {
    flex: 1;
    min-width: 0;
  }
</style>
