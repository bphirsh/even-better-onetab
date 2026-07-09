import { DEFAULT_OPTIONS, type Options } from '../core/options'
import { STORAGE_KEYS, getLists, getOptions, getSyncConfig, getSyncState, getTabTrash, getTrash } from '../core/storage'
import type { SyncConfig, SyncState, TabList, TrashEntry, TrashTabEntry } from '../core/types'

export const app = $state({
  lists: [] as TabList[],
  trash: [] as TrashEntry[],
  tabTrash: [] as TrashTabEntry[],
  opts: { ...DEFAULT_OPTIONS } as Options,
  syncConfig: { enabled: false, gistToken: '', gistId: '' } as SyncConfig,
  syncState: { lastPushAt: null, lastPullAt: null, error: null } as SyncState,
  loaded: false,
})

/** Loads state from storage and keeps it live via onChanged. */
export const initState = async () => {
  const [lists, trash, tabTrash, opts, syncConfig, syncState] = await Promise.all([
    getLists(),
    getTrash(),
    getTabTrash(),
    getOptions(),
    getSyncConfig(),
    getSyncState(),
  ])
  Object.assign(app, { lists, trash, tabTrash, opts, syncConfig, syncState, loaded: true })

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    if (changes[STORAGE_KEYS.LISTS_KEY]) app.lists = changes[STORAGE_KEYS.LISTS_KEY].newValue ?? []
    if (changes[STORAGE_KEYS.TRASH_KEY]) app.trash = changes[STORAGE_KEYS.TRASH_KEY].newValue ?? []
    if (changes[STORAGE_KEYS.TAB_TRASH_KEY]) app.tabTrash = changes[STORAGE_KEYS.TAB_TRASH_KEY].newValue ?? []
    if (changes[STORAGE_KEYS.OPTS_KEY]) app.opts = { ...DEFAULT_OPTIONS, ...(changes[STORAGE_KEYS.OPTS_KEY].newValue ?? {}) }
    if (changes[STORAGE_KEYS.SYNC_CONFIG_KEY]) {
      app.syncConfig = { enabled: false, gistToken: '', gistId: '', ...(changes[STORAGE_KEYS.SYNC_CONFIG_KEY].newValue ?? {}) }
    }
    if (changes[STORAGE_KEYS.SYNC_STATE_KEY]) {
      app.syncState = { lastPushAt: null, lastPullAt: null, error: null, ...(changes[STORAGE_KEYS.SYNC_STATE_KEY].newValue ?? {}) }
    }
  })
}

const media = window.matchMedia('(prefers-color-scheme: dark)')
let currentTheme: Options['theme'] = 'auto'
const resolveTheme = () => {
  document.documentElement.dataset.theme =
    currentTheme === 'auto' ? (media.matches ? 'dark' : 'light') : currentTheme
}
media.addEventListener('change', resolveTheme)

export const applyTheme = (theme: Options['theme']) => {
  currentTheme = theme
  resolveTheme()
}
