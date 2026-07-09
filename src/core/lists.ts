import type { Snapshot, TabItem, TabList, Tombstone } from './types'

export const ILLEGAL_URLS = ['about:', 'chrome:', 'chrome-extension:', 'brave:', 'edge:', 'file:', 'view-source:', 'wss:', 'ws:']

export const isStorableUrl = (url: string) => ILLEGAL_URLS.every(prefix => !url.startsWith(prefix))

let counter = Math.floor(Math.random() * 0xffffff)

/** Compact unique id, format-compatible with the old ObjectId-style string ids. */
export const genId = (): string => {
  const time = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
  const random = Array.from(crypto.getRandomValues(new Uint8Array(5)), b => b.toString(16).padStart(2, '0')).join('')
  counter = (counter + 1) % 0xffffff
  return time + random + counter.toString(16).padStart(6, '0')
}

export const normalizeTab = (tab: Partial<TabItem>): TabItem => ({
  url: tab.url ?? '',
  title: tab.title ?? '',
  ...(tab.favIconUrl ? { favIconUrl: tab.favIconUrl } : {}),
  ...(tab.pinned ? { pinned: true } : {}),
  ...(tab.muted ? { muted: true } : {}),
  ...(tab.group
    ? { group: { title: String(tab.group.title ?? ''), color: String(tab.group.color || 'grey') } }
    : {}),
})

export const createNewTabList = (partial: Partial<TabList> = {}): TabList => ({
  _id: partial._id || genId(),
  tabs: Array.isArray(partial.tabs) ? partial.tabs.map(normalizeTab) : [],
  title: partial.title || '',
  tags: Array.isArray(partial.tags) ? partial.tags.filter(t => typeof t === 'string') : [],
  time: partial.time || Date.now(),
  pinned: partial.pinned === true,
  expand: partial.expand !== false,
  color: partial.color || '',
  updatedAt: partial.updatedAt || partial.time || Date.now(),
})

export const validateList = (list: unknown): list is Partial<TabList> & { tabs: TabItem[] } =>
  list != null && typeof list === 'object' && Array.isArray((list as TabList).tabs)

/** Keep only persisted properties (drops transient UI state like the old `titleEditing`). */
export const normalizeList = (list: Partial<TabList>): TabList => createNewTabList(list)

export const createSnapshot = (lists: TabList[], tombstones: Tombstone[] = []): Snapshot => ({
  format: 'even-better-onetab/1',
  exportedAt: Date.now(),
  lists: lists.map(normalizeList),
  tombstones,
})

/** Accepts a v2 snapshot or a bare v1 lists array; returns lists or throws. */
export const parseSnapshot = (data: unknown): TabList[] => {
  const raw = Array.isArray(data) ? data : (data as Snapshot)?.lists
  if (!Array.isArray(raw)) throw new Error('Unrecognized backup format')
  return raw.filter(validateList).map(normalizeList)
}

export const parseTombstones = (data: unknown): Tombstone[] => {
  const raw = (data as Snapshot)?.tombstones
  if (!Array.isArray(raw)) return []
  return raw.filter(t => t && typeof t.id === 'string' && typeof t.deletedAt === 'number')
}
