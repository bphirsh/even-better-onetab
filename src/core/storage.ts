import { normalizeList, validateList } from './lists'
import { DEFAULT_OPTIONS, type Options } from './options'
import type { SyncConfig, SyncState, TabList } from './types'

// Storage keys are kept identical to v1 so existing user data survives the upgrade.
const LISTS_KEY = 'lists'
const OPTS_KEY = 'opts'
const SYNC_CONFIG_KEY = 'syncConfig'
const SYNC_STATE_KEY = 'syncState'

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

export const STORAGE_KEYS = { LISTS_KEY, OPTS_KEY, SYNC_CONFIG_KEY, SYNC_STATE_KEY }
