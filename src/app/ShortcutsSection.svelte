<script lang="ts">
  import { t } from '../i18n/i18n.svelte'

  // Chrome only lets the *user* bind command shortcuts, at the browser's shortcuts
  // page — there's no API to set or clear them from here. So this surfaces the
  // current bindings and deep-links to that page, which is the only place they
  // can actually be changed.
  let commands = $state<chrome.commands.Command[]>([])
  $effect(() => {
    chrome.commands.getAll().then(list => (commands = list.filter(c => c.description)))
  })

  // Only the shortcuts a user has actually assigned are worth a row; the rest
  // collapse into a single count so the box stays short.
  const setCommands = $derived(commands.filter(c => c.shortcut))
  const unsetCount = $derived(commands.length - setCommands.length)

  // Brave redirects chrome://extensions to brave://; either resolves this path.
  const openShortcuts = () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
</script>

<section>
  <h2>{t('shortcuts.title')}</h2>
  <div class="card">
    <div class="intro">{t('shortcuts.intro')}</div>
    {#each setCommands as command (command.name)}
      <div class="row">
        <div class="label">{t('shortcuts.cmd.' + command.name)}</div>
        <kbd>{command.shortcut}</kbd>
      </div>
    {/each}
    <div class="row action">
      {#if unsetCount > 0}
        <span class="unset">{t('shortcuts.notSet', { n: unsetCount })}</span>
      {/if}
      <button class="btn primary" onclick={openShortcuts}>{t('shortcuts.set')}</button>
    </div>
  </div>
</section>

<style>
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

  .intro {
    padding: 12px 0;
    font-size: 12.5px;
    color: var(--text-2);
    border-bottom: 1px solid var(--border);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 11px 0;
    border-bottom: 1px solid var(--border);
  }

  .row:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 500;
    min-width: 0;
  }

  kbd {
    font: 500 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-bottom-width: 2px;
    border-radius: 6px;
    background: var(--surface-2);
    color: var(--text);
    white-space: nowrap;
  }

  .unset {
    font-size: 12.5px;
    color: var(--text-3);
  }

  /* count on the left, button on the right; button alone stays right-aligned */
  .row.action {
    justify-content: space-between;
  }
</style>
