<script lang="ts">
  import { t } from '../i18n/i18n.svelte'
  import { setSyncConfig } from '../core/storage'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { fullTime, timeAgo } from '../ui/time'
  import { toast } from '../ui/toast.svelte'
  import { act } from './actions'

  let tokenDraft = $state('')
  let gistIdDraft = $state('')
  let busy = $state(false)

  const connected = $derived(Boolean(app.syncConfig.gistId && app.syncConfig.gistToken))

  const connect = async () => {
    const token = tokenDraft.trim()
    const gistId = gistIdDraft.trim()
    if (!token) return
    busy = true
    const { ok } = await act<{ gistId: string }>({ type: 'sync-setup', token, gistId: gistId || undefined })
    busy = false
    if (ok) {
      tokenDraft = ''
      gistIdDraft = ''
      toast(gistId ? t('sync.connectedMerged') : t('sync.connectedUploaded'))
    }
  }

  const toggleEnabled = (enabled: boolean) => setSyncConfig({ ...app.syncConfig, enabled })

  const syncNow = async () => {
    busy = true
    await act({ type: 'sync-push' }, t('sync.syncedToast'))
    busy = false
  }

  const pull = async () => {
    busy = true
    const { ok, result } = await act<{ count: number }>({ type: 'sync-pull' })
    busy = false
    if (ok && result) toast(t('sync.mergedToast', { n: result.count }))
  }

  const disconnect = () => {
    if (!confirm(t('sync.disconnectConfirm'))) return
    setSyncConfig({ enabled: false, gistToken: '', gistId: '' })
  }

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    toast(t('sync.copiedToast', { label }))
  }
</script>

<section>
  <h2>{t('sync.heading')}</h2>
  <div class="card">
    {#if !connected}
      <p class="intro">
        {t('sync.introBefore')}<strong>{t('sync.introGist')}</strong>{t('sync.introAfter')}
      </p>
      <ol class="steps">
        <li>
          <a
            href="https://github.com/settings/tokens/new?scopes=gist&description=Better+OneTab+Sync"
            target="_blank"
            rel="noreferrer">{t('sync.step1Link')}</a
          >
          {t('sync.step1Before')}<code>gist</code>{t('sync.step1After')}
        </li>
        <li>{t('sync.step2')}</li>
        <li>
          {t('sync.step3')}
        </li>
      </ol>
      <div class="connect">
        <input
          class="text-input"
          type="password"
          placeholder={t('sync.tokenPlaceholder')}
          bind:value={tokenDraft}
          onkeydown={e => e.key === 'Enter' && connect()}
        />
        <input
          class="text-input"
          type="text"
          placeholder={t('sync.gistIdPlaceholder')}
          bind:value={gistIdDraft}
          onkeydown={e => e.key === 'Enter' && connect()}
        />
        <button class="btn primary" disabled={busy || !tokenDraft.trim()} onclick={connect}>{t('sync.connect')}</button>
      </div>
    {:else}
      <label class="row">
        <div class="text">
          <div class="label">{t('sync.autoLabel')}</div>
          <div class="desc">
            {t('sync.autoDescBefore')}<a href={`https://gist.github.com/${app.syncConfig.gistId}`} target="_blank" rel="noreferrer">{t('sync.autoDescLink')}</a>{t('sync.autoDescAfter')}
          </div>
        </div>
        <input
          type="checkbox"
          class="switch"
          checked={app.syncConfig.enabled}
          onchange={e => toggleEnabled(e.currentTarget.checked)}
        />
      </label>

      <div class="row">
        <div class="text">
          <div class="label">{t('sync.statusLabel')}</div>
          <div class="desc">
            {#if app.syncState.error}
              <span class="error">{app.syncState.error}</span>
            {:else if app.syncState.lastPushAt}
              {t('sync.lastSynced', { ago: timeAgo(app.syncState.lastPushAt), time: fullTime(app.syncState.lastPushAt) })}
            {:else}
              {t('sync.notSyncedYet')}
            {/if}
          </div>
        </div>
        <div class="btn-group">
          <button class="btn" disabled={busy} onclick={syncNow}>
            <Icon name="refresh" size={14} /> {t('sync.syncNow')}
          </button>
          <button class="btn" disabled={busy} onclick={pull}>
            <Icon name="download" size={14} /> {t('sync.mergeFromGist')}
          </button>
        </div>
      </div>

      <div class="row">
        <div class="text">
          <div class="label">{t('sync.mobileLabel')}</div>
          <div class="desc">
            {t('sync.mobileDescBefore')}<a href="https://bphirsh.github.io/even-better-onetab/viewer/" target="_blank" rel="noreferrer">{t('sync.mobileDescLink')}</a>{t('sync.mobileDescAfter')}
          </div>
        </div>
        <div class="btn-group">
          <button class="btn" title={t('sync.copyTokenTitle')} onclick={() => copy(t('sync.tokenName'), app.syncConfig.gistToken)}>
            <Icon name="copy" size={13} /> {t('sync.tokenName')}
          </button>
          <button class="btn" title={t('sync.copyGistIdTitle')} onclick={() => copy(t('sync.gistIdName'), app.syncConfig.gistId)}>
            <Icon name="copy" size={13} /> {t('sync.gistIdName')}
          </button>
        </div>
      </div>

      <div class="row">
        <div class="text">
          <div class="label">{t('sync.disconnectLabel')}</div>
          <div class="desc">{t('sync.disconnectDesc')}</div>
        </div>
        <button class="btn danger" onclick={disconnect}>{t('sync.disconnect')}</button>
      </div>
    {/if}
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
    margin: 12px 0 4px;
  }

  .steps {
    margin: 8px 0 12px;
    padding-left: 20px;
    color: var(--text-2);
  }

  .steps li {
    margin: 4px 0;
  }

  .connect {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 14px;
  }

  .connect .btn {
    align-self: flex-end;
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
    overflow-wrap: anywhere;
  }

  .error {
    color: var(--danger);
  }

  .btn-group {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  code {
    background: var(--surface-2);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 12px;
  }

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
</style>
