<script lang="ts">
  import type { Options } from '../core/options'
  import { setOptions } from '../core/storage'
  import { app } from '../ui/state.svelte'
  import ImportExport from './ImportExport.svelte'
  import SyncSection from './SyncSection.svelte'

  const update = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOptions({ ...app.opts, [key]: value })

  interface ToggleDef {
    key: keyof Options
    label: string
    desc?: string
  }

  const storingToggles: ToggleDef[] = [
    { key: 'ignorePinned', label: 'Skip pinned tabs', desc: 'Pinned browser tabs are left open when storing.' },
    { key: 'excludeIllegalURL', label: 'Skip browser-internal pages', desc: 'about:, chrome:, file: and similar URLs are not stored.' },
    { key: 'removeDuplicate', label: 'Remove duplicate tabs within a list' },
    { key: 'addHistory', label: 'Keep stored tabs in browser history', desc: 'Stored tabs stay findable from the address bar.' },
    { key: 'pinNewList', label: 'Pin new lists', desc: 'Pinned lists are protected from automatic removal (e.g. by the restore-latest shortcut).' },
  ]

  const menuToggles: ToggleDef[] = [
    {
      key: 'pageContext',
      label: 'Show in page right-click menu',
      desc: 'Adds an “Even Better OneTab” submenu when right-clicking a webpage. Off, the actions only appear when right-clicking the toolbar icon.',
    },
    {
      key: 'allContext',
      label: 'Show on links, images and selections too',
      desc: 'Include the menu when right-clicking a link, image, video, or selected text — not just empty page area.',
    },
  ]
</script>

<div class="page">
  <h1>Settings</h1>

  <section>
    <h2>Appearance</h2>
    <div class="card">
      <div class="row">
        <div class="text">
          <div class="label">Theme</div>
        </div>
        <select class="select" value={app.opts.theme} onchange={e => update('theme', e.currentTarget.value as Options['theme'])}>
          <option value="auto">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">Density</div>
        </div>
        <select class="select" value={app.opts.density} onchange={e => update('density', e.currentTarget.value as Options['density'])}>
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">Tab display</div>
        </div>
        <select class="select" value={app.opts.itemDisplay} onchange={e => update('itemDisplay', e.currentTarget.value as Options['itemDisplay'])}>
          <option value="title-and-url">Title and domain</option>
          <option value="title">Title only</option>
          <option value="url">URL only</option>
        </select>
      </div>
      <label class="row">
        <div class="text">
          <div class="label">Hide favicons</div>
        </div>
        <input
          type="checkbox"
          class="switch"
          checked={app.opts.hideFavicon}
          onchange={e => update('hideFavicon', e.currentTarget.checked)}
        />
      </label>
    </div>
  </section>

  <section>
    <h2>Storing tabs</h2>
    <div class="card">
      <div class="row">
        <div class="text">
          <div class="label">Storing opens the list page</div>
        </div>
        <select
          class="select"
          value={app.opts.openListPage}
          onchange={e => update('openListPage', e.currentTarget.value as Options['openListPage'])}
        >
          <option value="all-stored">When all tabs are stored</option>
          <option value="always">When any tabs are stored</option>
          <option value="if-absent">If not open in current window</option>
          <option value="never">Never</option>
        </select>
      </div>
      {#each storingToggles as t (t.key)}
        <label class="row">
          <div class="text">
            <div class="label">{t.label}</div>
            {#if t.desc}<div class="desc">{t.desc}</div>{/if}
          </div>
          <input
            type="checkbox"
            class="switch"
            checked={app.opts[t.key] as boolean}
            onchange={e => update(t.key, e.currentTarget.checked as never)}
          />
        </label>
      {/each}
    </div>
  </section>

  <section>
    <h2>Opening tabs</h2>
    <div class="card">
      <div class="row">
        <div class="text">
          <div class="label">Clicking a stored tab</div>
        </div>
        <select
          class="select"
          value={app.opts.itemClickAction}
          onchange={e => update('itemClickAction', e.currentTarget.value as Options['itemClickAction'])}
        >
          <option value="open-and-remove">Opens it and removes it from the list</option>
          <option value="open">Opens it and keeps it in the list</option>
        </select>
      </div>
      <label class="row">
        <div class="text">
          <div class="label">Switch to the opened tab</div>
          <div class="desc">Off, clicked tabs open in the background and you stay on this page.</div>
        </div>
        <input
          type="checkbox"
          class="switch"
          checked={app.opts.focusOpenedTab}
          onchange={e => update('focusOpenedTab', e.currentTarget.checked)}
        />
      </label>
      <div class="row">
        <div class="text">
          <div class="label">Open tabs in</div>
        </div>
        <select
          class="select"
          value={app.opts.restorePosition}
          onchange={e => update('restorePosition', e.currentTarget.value as Options['restorePosition'])}
        >
          <option value="end">The end of the current window</option>
          <option value="start">The start of the current window</option>
          <option value="new-window">A new window</option>
        </select>
      </div>
      <label class="row">
        <div class="text">
          <div class="label">Confirm before deleting a list</div>
          <div class="desc">Deletions can be undone, and stay recoverable in History for 30 days.</div>
        </div>
        <input
          type="checkbox"
          class="switch"
          checked={app.opts.alertRemoveList}
          onchange={e => update('alertRemoveList', e.currentTarget.checked)}
        />
      </label>
    </div>
  </section>

  <section>
    <h2>Toolbar &amp; menus</h2>
    <div class="card">
      <div class="row">
        <div class="text">
          <div class="label">Clicking the toolbar button</div>
          <div class="desc">
            {#if app.opts.browserAction !== 'popup'}
              Without the popup, recent lists are reachable from the list page and right-click menu.
            {:else}
              The popup has store buttons and your recent lists.
            {/if}
          </div>
        </div>
        <select
          class="select"
          value={app.opts.browserAction}
          onchange={e => update('browserAction', e.currentTarget.value as Options['browserAction'])}
        >
          <option value="popup">Opens the popup</option>
          <option value="store-selected">Stores selected tabs</option>
          <option value="store-all">Stores all tabs</option>
          <option value="show-list">Opens the list page</option>
        </select>
      </div>
      {#each menuToggles as t (t.key)}
        <label class="row">
          <div class="text">
            <div class="label">{t.label}</div>
            {#if t.desc}<div class="desc">{t.desc}</div>{/if}
          </div>
          <input
            type="checkbox"
            class="switch"
            checked={app.opts[t.key] as boolean}
            disabled={t.key === 'allContext' && !app.opts.pageContext}
            onchange={e => update(t.key, e.currentTarget.checked as never)}
          />
        </label>
      {/each}
      <div class="hint">
        Keyboard shortcuts can be configured at
        <code>brave://extensions/shortcuts</code> (or <code>chrome://extensions/shortcuts</code>).
      </div>
    </div>
  </section>

  <SyncSection />
  <ImportExport />

  <p class="support">
    Made with ❤️ in NYC<br />
    <a href="https://github.com/sponsors/bphirsh" target="_blank" rel="noreferrer">☕ Buy me a coffee.</a>
  </p>
</div>

<style>
  .page {
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 24px 80px;
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
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }

  .row:last-child {
    border-bottom: none;
  }

  .text {
    min-width: 0;
  }

  .label {
    font-weight: 500;
  }

  .desc {
    font-size: 12.5px;
    color: var(--text-2);
    margin-top: 2px;
  }

  .hint {
    padding: 12px 0;
    font-size: 12.5px;
    color: var(--text-2);
  }

  .support {
    text-align: center;
    font-size: 12.5px;
    color: var(--text-3);
    margin: 4px 0 0;
  }

  code {
    background: var(--surface-2);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 12px;
  }

  /* switch */
  .switch {
    appearance: none;
    width: 36px;
    height: 21px;
    border-radius: 999px;
    background: var(--border);
    position: relative;
    cursor: pointer;
    transition: background 0.15s ease;
    flex-shrink: 0;
    margin: 0;
  }

  .switch::after {
    content: '';
    position: absolute;
    top: 2.5px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease;
  }

  .switch:checked {
    background: var(--accent);
  }

  .switch:checked::after {
    transform: translateX(14px);
  }

  .switch:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
