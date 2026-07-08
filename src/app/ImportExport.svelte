<script lang="ts">
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
    a.download = `better-onetab-backup-${new Date().toISOString().slice(0, 10)}.json`
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
        toast('No lists found in that file', 'error')
        return
      }
      if (importMode === 'replace') {
        if (!confirm(`Replace all current lists with the ${imported.length} imported lists?`)) return
        await act({ type: 'lists-replace', lists: imported }, `Imported ${imported.length} lists`)
      } else {
        await act(
          { type: 'lists-replace', lists: [...imported, ...app.lists] },
          `Imported ${imported.length} lists`,
        )
      }
    } catch {
      toast('Could not read that file — is it a Better OneTab backup?', 'error')
    }
  }
</script>

<section>
  <h2>Backup</h2>
  <div class="card">
    <div class="row">
      <div class="text">
        <div class="label">Export</div>
        <div class="desc">Download all lists as a JSON file (the same format sync uses).</div>
      </div>
      <button class="btn" onclick={exportJson}>
        <Icon name="download" size={14} /> Export JSON
      </button>
    </div>
    <div class="row">
      <div class="text">
        <div class="label">Import</div>
        <div class="desc">Restore from a backup file — merge with or replace your current lists.</div>
      </div>
      <div class="btn-group">
        <button class="btn" onclick={() => pickFile('merge')}>
          <Icon name="upload" size={14} /> Merge
        </button>
        <button class="btn danger" onclick={() => pickFile('replace')}>Replace</button>
      </div>
    </div>
    <input type="file" accept=".json,application/json" hidden bind:this={fileInput} onchange={onFile} />
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
