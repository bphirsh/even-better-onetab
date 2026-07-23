<script lang="ts">
  import type { Options } from '../core/options'
  import { registeredLocales, t } from '../i18n/i18n.svelte'
  import { LOCALES } from '../i18n/locales'
  import { setOptions } from '../core/storage'
  import { app } from '../ui/state.svelte'
  // optional feature — see src/feature-background/README.md
  import BackgroundSection from '../feature-background/BackgroundSection.svelte'
  import ImportExport from './ImportExport.svelte'
  import ShortcutsSection from './ShortcutsSection.svelte'
  import SyncSection from './SyncSection.svelte'
  import TabRow from './TabRow.svelte'

  const demoTabs = [
    { url: 'https://en.wikipedia.org/wiki/Forest', title: 'Forest - Wikipedia', favIconUrl: 'https://en.wikipedia.org/favicon.ico' },
    { url: 'https://brianhirsh.com', title: 'Brian Hirsh', favIconUrl: 'https://brianhirsh.com/favicon-32x32.png' },
  ]

  const version = chrome.runtime.getManifest().version
  const languages = LOCALES.filter(l => registeredLocales().includes(l.code))

  const update = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOptions({ ...app.opts, [key]: value })

  interface ToggleDef {
    key: keyof Options
    labelKey: string
    descKey?: string
  }

  const storingToggles: ToggleDef[] = [
    { key: 'ignorePinned', labelKey: 'settings.storing.ignorePinned.label', descKey: 'settings.storing.ignorePinned.desc' },
    { key: 'excludeIllegalURL', labelKey: 'settings.storing.excludeIllegalURL.label', descKey: 'settings.storing.excludeIllegalURL.desc' },
    { key: 'removeDuplicate', labelKey: 'settings.storing.removeDuplicate.label' },
    { key: 'pinGroupList', labelKey: 'settings.storing.pinGroupList.label', descKey: 'settings.storing.pinGroupList.desc' },
  ]

  const menuToggles: ToggleDef[] = [
    {
      key: 'pageContext',
      labelKey: 'settings.toolbar.pageContext.label',
      descKey: 'settings.toolbar.pageContext.desc',
    },
    {
      key: 'allContext',
      labelKey: 'settings.toolbar.allContext.label',
      descKey: 'settings.toolbar.allContext.desc',
    },
  ]
</script>

<div class="page">
  <h1>{t('settings.title')}</h1>

  <section>
    <h2>{t('settings.appearance.heading')}</h2>
    <div class="card">
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.language.label')}</div>
        </div>
        <select
          class="select lang-select"
          aria-label={t('settings.language.label')}
          value={app.opts.locale}
          onchange={e => update('locale', e.currentTarget.value)}
        >
          <option value="auto">{t('settings.language.auto')}</option>
          {#each languages as loc (loc.code)}
            <option value={loc.code}>{loc.label}</option>
          {/each}
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.appearance.theme.label')}</div>
        </div>
        <select class="select" aria-label={t('settings.appearance.theme.label')} value={app.opts.theme} onchange={e => update('theme', e.currentTarget.value as Options['theme'])}>
          <option value="auto">{t('settings.appearance.theme.auto')}</option>
          <option value="light">{t('settings.appearance.theme.light')}</option>
          <option value="dark">{t('settings.appearance.theme.dark')}</option>
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.appearance.density.label')}</div>
        </div>
        <select class="select" aria-label={t('settings.appearance.density.label')} value={app.opts.density} onchange={e => update('density', e.currentTarget.value as Options['density'])}>
          <option value="compact">{t('settings.appearance.density.compact')}</option>
          <option value="comfortable">{t('settings.appearance.density.comfortable')}</option>
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.appearance.pinnedPosition.label')}</div>
        </div>
        <select
          class="select"
          aria-label={t('settings.appearance.pinnedPosition.label')}
          value={app.opts.pinnedPosition}
          onchange={e => update('pinnedPosition', e.currentTarget.value as Options['pinnedPosition'])}
        >
          <option value="top">{t('settings.appearance.pinnedPosition.top')}</option>
          <option value="bottom">{t('settings.appearance.pinnedPosition.bottom')}</option>
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.appearance.tabDisplay.label')}</div>
        </div>
        <select class="select" aria-label={t('settings.appearance.tabDisplay.label')} value={app.opts.itemDisplay} onchange={e => update('itemDisplay', e.currentTarget.value as Options['itemDisplay'])}>
          <option value="title-and-url">{t('settings.appearance.tabDisplay.titleAndUrl')}</option>
          <option value="title">{t('settings.appearance.tabDisplay.title')}</option>
          <option value="url">{t('settings.appearance.tabDisplay.url')}</option>
        </select>
      </div>
      <label class="row">
        <div class="text">
          <div class="label">{t('settings.appearance.hideFavicon.label')}</div>
        </div>
        <input
          type="checkbox"
          class="switch"
          checked={app.opts.hideFavicon}
          onchange={e => update('hideFavicon', e.currentTarget.checked)}
        />
      </label>
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.appearance.listActions.label')}</div>
          <div class="desc">{t('settings.appearance.listActions.desc')}</div>
        </div>
        <select
          class="select"
          aria-label={t('settings.appearance.listActions.label')}
          value={app.opts.listActions}
          onchange={e => update('listActions', e.currentTarget.value as Options['listActions'])}
        >
          <option value="hover">{t('settings.appearance.showOnHover')}</option>
          <option value="always">{t('settings.appearance.alwaysShow')}</option>
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.appearance.tabRemove.label')}</div>
          <div class="desc">{t('settings.appearance.tabRemove.desc')}</div>
        </div>
        <select
          class="select"
          aria-label={t('settings.appearance.tabRemove.label')}
          value={app.opts.tabRemove}
          onchange={e => update('tabRemove', e.currentTarget.value as Options['tabRemove'])}
        >
          <option value="hover">{t('settings.appearance.showOnHover')}</option>
          <option value="always">{t('settings.appearance.alwaysShow')}</option>
        </select>
      </div>
      <!-- inert keeps the decorative demo rows out of the tab order and off assistive tech -->
      <div class="demo" inert aria-hidden="true">
        {#each demoTabs as tab (tab.url)}
          <TabRow {tab} display={app.opts.itemDisplay} hideFavicon={app.opts.hideFavicon} onOpen={() => {}} onRemove={() => {}} />
        {/each}
      </div>
    </div>
  </section>

  <BackgroundSection />

  <section>
    <h2>{t('settings.storing.heading')}</h2>
    <div class="card">
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.storing.openListPage.label')}</div>
        </div>
        <select
          class="select"
          aria-label={t('settings.storing.openListPage.label')}
          value={app.opts.openListPage}
          onchange={e => update('openListPage', e.currentTarget.value as Options['openListPage'])}
        >
          <option value="all-stored">{t('settings.storing.openListPage.allStored')}</option>
          <option value="always">{t('settings.storing.openListPage.always')}</option>
          <option value="if-absent">{t('settings.storing.openListPage.ifAbsent')}</option>
          <option value="never">{t('settings.storing.openListPage.never')}</option>
        </select>
      </div>
      {#each storingToggles as toggle (toggle.key)}
        <label class="row">
          <div class="text">
            <div class="label">{t(toggle.labelKey)}</div>
            {#if toggle.descKey}<div class="desc">{t(toggle.descKey)}</div>{/if}
          </div>
          <input
            type="checkbox"
            class="switch"
            checked={app.opts[toggle.key] as boolean}
            onchange={e => update(toggle.key, e.currentTarget.checked as never)}
          />
        </label>
      {/each}
    </div>
  </section>

  <section>
    <h2>{t('settings.opening.heading')}</h2>
    <div class="card">
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.opening.itemClick.label')}</div>
          <div class="desc">{t('settings.opening.itemClick.desc')}</div>
        </div>
        <select
          class="select"
          aria-label={t('settings.opening.itemClick.label')}
          value={app.opts.itemClickAction}
          onchange={e => update('itemClickAction', e.currentTarget.value as Options['itemClickAction'])}
        >
          <option value="open-and-remove">{t('settings.opening.itemClick.openAndRemove')}</option>
          <option value="open">{t('settings.opening.itemClick.open')}</option>
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.opening.openList.label')}</div>
          <div class="desc">{t('settings.opening.openList.desc')}</div>
        </div>
        <select
          class="select"
          aria-label={t('settings.opening.openList.label')}
          value={app.opts.openListAction}
          onchange={e => update('openListAction', e.currentTarget.value as Options['openListAction'])}
        >
          <option value="open-and-remove">{t('settings.opening.openList.openAndRemove')}</option>
          <option value="open">{t('settings.opening.openList.open')}</option>
        </select>
      </div>
      <label class="row">
        <div class="text">
          <div class="label">{t('settings.opening.focusOpenedTab.label')}</div>
          <div class="desc">{t('settings.opening.focusOpenedTab.desc')}</div>
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
          <div class="label">{t('settings.opening.restorePosition.label')}</div>
        </div>
        <select
          class="select"
          aria-label={t('settings.opening.restorePosition.label')}
          value={app.opts.restorePosition}
          onchange={e => update('restorePosition', e.currentTarget.value as Options['restorePosition'])}
        >
          <option value="end">{t('settings.opening.restorePosition.end')}</option>
          <option value="start">{t('settings.opening.restorePosition.start')}</option>
          <option value="new-window">{t('settings.opening.restorePosition.newWindow')}</option>
        </select>
      </div>
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.opening.trashRetention.label')}</div>
          <div class="desc">{t('settings.opening.trashRetention.desc')}</div>
        </div>
        <select
          class="select"
          aria-label={t('settings.opening.trashRetention.label')}
          value={app.opts.trashRetention}
          onchange={e => update('trashRetention', e.currentTarget.value as Options['trashRetention'])}
        >
          <option value="immediately">{t('settings.opening.trashRetention.immediately')}</option>
          <option value="day">{t('settings.opening.trashRetention.day')}</option>
          <option value="week">{t('settings.opening.trashRetention.week')}</option>
          <option value="month">{t('settings.opening.trashRetention.month')}</option>
        </select>
      </div>
    </div>
  </section>

  <section>
    <h2>{t('settings.toolbar.heading')}</h2>
    <div class="card">
      <div class="row">
        <div class="text">
          <div class="label">{t('settings.toolbar.browserAction.label')}</div>
          <div class="desc">
            {#if app.opts.browserAction !== 'popup'}
              {t('settings.toolbar.browserAction.descNonPopup')}
            {:else}
              {t('settings.toolbar.browserAction.descPopup')}
            {/if}
          </div>
        </div>
        <select
          class="select"
          aria-label={t('settings.toolbar.browserAction.label')}
          value={app.opts.browserAction}
          onchange={e => update('browserAction', e.currentTarget.value as Options['browserAction'])}
        >
          <option value="popup">{t('settings.toolbar.browserAction.popup')}</option>
          <option value="store-selected">{t('settings.toolbar.browserAction.storeSelected')}</option>
          <option value="store-all">{t('settings.toolbar.browserAction.storeAll')}</option>
          <option value="show-list">{t('settings.toolbar.browserAction.showList')}</option>
        </select>
      </div>
      {#each menuToggles as toggle (toggle.key)}
        <label class="row">
          <div class="text">
            <div class="label">{t(toggle.labelKey)}</div>
            {#if toggle.descKey}<div class="desc">{t(toggle.descKey)}</div>{/if}
          </div>
          <input
            type="checkbox"
            class="switch"
            checked={app.opts[toggle.key] as boolean}
            disabled={toggle.key === 'allContext' && !app.opts.pageContext}
            onchange={e => update(toggle.key, e.currentTarget.checked as never)}
          />
        </label>
      {/each}
    </div>
  </section>

  <ShortcutsSection />
  <SyncSection />
  <ImportExport />

  <p class="support">
    {t('settings.footer.madeWith')}<br />
    <a class="btn primary coffee" href="https://github.com/sponsors/bphirsh" target="_blank" rel="noreferrer">
      {t('settings.footer.coffee')}
    </a>
  </p>
  <p class="version">
    {t('settings.footer.version', { version })}
    <span class="sep">·</span>
    <a href="https://bphirsh.github.io/even-better-onetab/privacy/" target="_blank" rel="noreferrer">{t('settings.footer.privacy')}</a>
  </p>
</div>

<style>
  .page {
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 24px 17px;
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

  /* Fixed size so the control doesn't jump when the language (and thus the
     "Auto…" option's length) changes. It's a flex item, so a plain width is
     ignored — pin the flex-basis and forbid grow/shrink. */
  .lang-select {
    flex: 0 0 210px;
  }

  .desc {
    font-size: 12.5px;
    color: var(--text-2);
    margin-top: 2px;
  }

  .demo {
    margin: 12px 0 14px;
    padding: 6px 8px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg);
    pointer-events: none;
  }

  /* demo rows don't need the list page's expansion indent */
  .demo :global(.row) {
    padding-left: 8px;
  }

  .support {
    text-align: center;
    font-size: 12.5px;
    color: var(--text-3);
    margin: 4px 0 0;
  }

  .version {
    text-align: center;
    font-size: 11.5px;
    color: var(--text-3);
    /* large gap so the version sits low on the page, level with the corner
       sync/counts pill once Settings is fully scrolled */
    margin: 48px 0 0;
  }

  .version .sep {
    opacity: 0.5;
    margin: 0 4px;
  }

  .version a {
    color: var(--text-3);
  }

  .version a:hover {
    color: var(--text-2);
  }

  .coffee {
    margin-top: 10px;
    font-size: 13px;
  }

  .coffee:hover {
    text-decoration: none;
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
