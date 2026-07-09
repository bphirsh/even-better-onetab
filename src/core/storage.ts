import { normalizeList, validateList } from './lists'
import { DEFAULT_OPTIONS, type Options } from './options'
import type { SyncConfig, SyncState, TabList, Tombstone, TrashEntry } from './types'

// Storage keys are kept identical to v1 so existing user data survives the upgrade.
const LISTS_KEY = 'lists'
const OPTS_KEY = 'opts'
const SYNC_CONFIG_KEY = 'syncConfig'
const SYNC_STATE_KEY = 'syncState'
const TOMBSTONES_KEY = 'syncTombstones'
const TRASH_KEY = 'trash'

const TOMBSTONE_TTL = 30 * 86_400_000
const TRASH_TTL = 30 * 86_400_000
const TRASH_MAX_ENTRIES = 50

export const getLists = async (): Promise<TabList[]> => {
  const { [LISTS_KEY]: lists } = await chrome.storage.local.get(LISTS_KEY)
  return Array.isArray(lists) ? lists.filter(validateList).map(normalizeList) : []
}

export const setLists = async (lists: TabList[], opts?: Options) => {
  const options = opts ?? await getOptions()
  const normalized = lists.filter(validateList).map(normalizeList)
  if (options.removeDuplicate) {
    for (const list of normalized) {
      const seen = new Set<string>()
      list.tabs = list.tabs.filter(tab => !seen.has(tab.url) && (seen.add(tab.url), true))
    }
  }
  await chrome.storage.local.set({ [LISTS_KEY]: normalized })
}

export const getOptions = async (): Promise<Options> => {
  const { [OPTS_KEY]: opts } = await chrome.storage.local.get(OPTS_KEY)
  return { ...DEFAULT_OPTIONS, ...(opts ?? {}) }
}

export const setOptions = async (opts: Options) => {
  const picked = Object.fromEntries(
    Object.keys(DEFAULT_OPTIONS).map(key => [key, opts[key as keyof Options]]),
  )
  await chrome.storage.local.set({ [OPTS_KEY]: picked })
}

export const getSyncConfig = async (): Promise<SyncConfig> => {
  const { [SYNC_CONFIG_KEY]: config } = await chrome.storage.local.get(SYNC_CONFIG_KEY)
  return { enabled: false, gistToken: '', gistId: '', ...(config ?? {}) }
}

export const setSyncConfig = async (config: SyncConfig) => {
  await chrome.storage.local.set({ [SYNC_CONFIG_KEY]: config })
}

export const getSyncState = async (): Promise<SyncState> => {
  const { [SYNC_STATE_KEY]: state } = await chrome.storage.local.get(SYNC_STATE_KEY)
  return { lastPushAt: null, lastPullAt: null, error: null, ...(state ?? {}) }
}

export const setSyncState = async (state: Partial<SyncState>) => {
  const current = await getSyncState()
  await chrome.storage.local.set({ [SYNC_STATE_KEY]: { ...current, ...state } })
}

export const getTombstones = async (): Promise<Tombstone[]> => {
  const { [TOMBSTONES_KEY]: tombstones } = await chrome.storage.local.get(TOMBSTONES_KEY)
  const now = Date.now()
  return Array.isArray(tombstones) ? tombstones.filter(t => now - t.deletedAt < TOMBSTONE_TTL) : []
}

export const setTombstones = async (tombstones: Tombstone[]) => {
  const now = Date.now()
  await chrome.storage.local.set({
    [TOMBSTONES_KEY]: tombstones.filter(t => now - t.deletedAt < TOMBSTONE_TTL),
  })
}

export const addTombstones = async (ids: string[]) => {
  if (ids.length === 0) return
  const now = Date.now()
  const kept = (await getTombstones()).filter(t => !ids.includes(t.id))
  await setTombstones([...kept, ...ids.map(id => ({ id, deletedAt: now }))])
}

/** Drops tombstones for ids that exist again (e.g. undo / restore from History). */
export const removeTombstones = async (ids: string[]) => {
  if (ids.length === 0) return
  const kept = (await getTombstones()).filter(t => !ids.includes(t.id))
  await setTombstones(kept)
}

export const getTrash = async (): Promise<TrashEntry[]> => {
  const { [TRASH_KEY]: trash } = await chrome.storage.local.get(TRASH_KEY)
  const now = Date.now()
  return Array.isArray(trash) ? trash.filter(t => now - t.deletedAt < TRASH_TTL) : []
}

export const setTrash = async (trash: TrashEntry[]) => {
  await chrome.storage.local.set({ [TRASH_KEY]: trash.slice(0, TRASH_MAX_ENTRIES) })
}

export const addToTrash = async (lists: TabList[]) => {
  if (lists.length === 0) return
  const now = Date.now()
  const existing = await getTrash()
  await setTrash([...lists.map(list => ({ list, deletedAt: now })), ...existing])
}

export const STORAGE_KEYS = { LISTS_KEY, OPTS_KEY, SYNC_CONFIG_KEY, SYNC_STATE_KEY, TOMBSTONES_KEY, TRASH_KEY }
