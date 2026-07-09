<script lang="ts">
  import { setSyncConfig } from '../core/storage'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { fullTime, timeAgo } from '../ui/time'
  import { toast } from '../ui/toast.svelte'
  import { act } from './actions'

  let tokenDraft = $state('')
  let busy = $state(false)

  const connected = $derived(Boolean(app.syncConfig.gistId && app.syncConfig.gistToken))

  const connect = async () => {
    const token = tokenDraft.trim()
    if (!token) return
    busy = true
    const { ok } = await act<{ gistId: string }>({ type: 'sync-setup', token })
    busy = false
    if (ok) {
      tokenDraft = ''
      toast('Sync connected — lists uploaded to your private gist')
    }
  }

  const toggleEnabled = (enabled: boolean) => setSyncConfig({ ...app.syncConfig, enabled })

  const syncNow = async () => {
    busy = true
    await act({ type: 'sync-push' }, 'Synced to gist')
    busy = false
  }

  const pull = async () => {
    busy = true
    const { ok, result } = await act<{ count: number }>({ type: 'sync-pull' })
    busy = false
    if (ok && result) toast(`Merged with the gist — ${result.count} lists`)
  }

  const disconnect = () => {
    if (!confirm('Disconnect sync? The gist itself is not deleted.')) return
    setSyncConfig({ enabled: false, gistToken: '', gistId: '' })
  }
</script>

<section>
  <h2>Sync &amp; mobile</h2>
  <div class="card">
    {#if !connected}
      <p class="intro">
        Sync your lists to a <strong>private GitHub Gist</strong>. Changes upload automatically, the
        gist keeps version history as a backup, and you can read your tabs from a phone with the
        mobile viewer.
      </p>
      <ol class="steps">
        <li>
          <a
            href="https://github.com/settings/tokens/new?scopes=gist&description=Better+OneTab+Sync"
            target="_blank"
            rel="noreferrer">Create a GitHub token</a
          >
          with only the <code>gist</code> scope.
        </li>
        <li>Paste it here — a private gist is created for you.</li>
      </ol>
      <div class="connect">
        <input
          class="text-input"
          type="password"
          placeholder="GitHub token (ghp_… or github_pat_…)"
          bind:value={tokenDraft}
          onkeydown={e => e.key === 'Enter' && connect()}
        />
        <button class="btn primary" disabled={busy || !tokenDraft.trim()} onclick={connect}>Connect</button>
      </div>
    {:else}
      <label class="row">
        <div class="text">
          <div class="label">Automatic sync</div>
          <div class="desc">
            Uploads to
            <a href={`https://gist.github.com/${app.syncConfig.gistId}`} target="_blank" rel="noreferrer">your private gist</a>
            shortly after every change, and merges from it on browser startup. Newer edits win;
            deletions sync too.
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
          <div class="label">Status</div>
          <div class="desc">
            {#if app.syncState.error}
              <span class="error">{app.syncState.error}</span>
            {:else if app.syncState.lastPushAt}
              Last synced {timeAgo(app.syncState.lastPushAt)} ({fullTime(app.syncState.lastPushAt)})
            {:else}
              Not synced yet
            {/if}
          </div>
        </div>
        <div class="btn-group">
          <button class="btn" disabled={busy} onclick={syncNow}>
            <Icon name="refresh" size={14} /> Sync now
          </button>
          <button class="btn" disabled={busy} onclick={pull}>
            <Icon name="download" size={14} /> Merge from gist
          </button>
        </div>
      </div>

      <div class="row">
        <div class="text">
          <div class="label">Mobile viewer</div>
          <div class="desc">
            Open the viewer page on your phone, paste the same token and gist id
            (<code>{app.syncConfig.gistId}</code>), and your lists are readable anywhere. See the
            <a href="https://github.com/bphirsh/better-onetab#mobile-viewer" target="_blank" rel="noreferrer">setup guide</a>.
          </div>
        </div>
        <span class="phone-icon"><Icon name="phone" size={18} /></span>
      </div>

      <div class="row">
        <div class="text">
          <div class="label">Disconnect</div>
          <div class="desc">Removes the token from this browser. The gist is kept.</div>
        </div>
        <button class="btn danger" onclick={disconnect}>Disconnect</button>
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
    gap: 8px;
    padding-bottom: 14px;
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

  .phone-icon {
    color: var(--text-3);
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
