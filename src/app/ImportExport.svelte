<script lang="ts">
  import { t } from '../i18n/i18n.svelte'
  import { createSnapshot, parseSnapshot } from '../core/lists'
  import Icon from '../ui/Icon.svelte'
  import { app } from '../ui/state.svelte'
  import { toast } from '../ui/toast.svelte'
  import { act } from './actions'

  let fileInput: HTMLInputElement | undefined = $state()
  let importMode: 'merge' | 'replace' = 'merge'

  const exportJson = () => {
    const snapshot = createSnapshot(app.lists)
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `even-better-onetab-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pickFile = (mode: 'merge' | 'replace') => {
    importMode = mode
    fileInput?.click()
  }

  const onFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const imported = parseSnapshot(JSON.parse(await file.text()))
      if (imported.length === 0) {
        toast(t('backup.noListsFound'), 'error')
        return
      }
      if (importMode === 'replace') {
        if (!confirm(t('backup.replaceConfirm', { n: imported.length }))) return
        await act({ type: 'lists-replace', lists: imported }, t('backup.importedToast', { n: imported.length }))
      } else {
        await act(
          { type: 'lists-replace', lists: [...imported, ...app.lists] },
          t('backup.importedToast', { n: imported.length }),
        )
      }
    } catch {
      toast(t('backup.couldNotRead'), 'error')
    }
  }
</script>

<section>
  <h2>{t('backup.heading')}</h2>
  <div class="card">
    <div class="row">
      <div class="text">
        <div class="label">{t('backup.exportLabel')}</div>
        <div class="desc">{t('backup.exportDesc')}</div>
      </div>
      <button class="btn" onclick={exportJson}>
        <Icon name="download" size={14} /> {t('backup.exportJson')}
      </button>
    </div>
    <div class="row">
      <div class="text">
        <div class="label">{t('backup.importLabel')}</div>
        <div class="desc">{t('backup.importDesc')}</div>
      </div>
      <div class="btn-group">
        <button class="btn" onclick={() => pickFile('merge')}>
          <Icon name="upload" size={14} /> {t('backup.merge')}
        </button>
        <button class="btn danger" onclick={() => pickFile('replace')}>{t('backup.replace')}</button>
      </div>
    </div>
  </div>
  <!-- outside the card so .row:last-child still removes the final divider -->
  <input type="file" accept=".json,application/json" hidden bind:this={fileInput} onchange={onFile} />
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

  .btn-group {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
</style>
