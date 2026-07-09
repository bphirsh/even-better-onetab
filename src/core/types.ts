export interface TabGroupInfo {
  title: string
  /** Chrome tab-group color name ('blue', 'red', ...). */
  color: string
}

export interface TabItem {
  url: string
  title: string
  favIconUrl?: string
  pinned?: boolean
  muted?: boolean
  group?: TabGroupInfo
}

/** Records a deleted list id so deletions propagate through sync instead of resurrecting. */
export interface Tombstone {
  id: string
  deletedAt: number
}

export interface TabList {
  _id: string
  tabs: TabItem[]
  title: string
  tags: string[]
  time: number
  pinned: boolean
  expand: boolean
  color: string
  archived: boolean
  updatedAt: number
}

/** A deleted list kept locally for a while so it can be recovered from History. */
export interface TrashEntry {
  list: TabList
  deletedAt: number
}

/** A single tab removed from a list, kept locally so it can be recovered from History. */
export interface TrashTabEntry {
  id: string
  tab: TabItem
  /** The list it came from, so recovery can put it back. */
  listId: string
  listTitle: string
  deletedAt: number
}

/** The JSON document used for manual export/import and for Gist sync. */
export interface Snapshot {
  format: 'even-better-onetab/1'
  exportedAt: number
  lists: TabList[]
  tombstones?: Tombstone[]
}

export interface SyncConfig {
  enabled: boolean
  gistToken: string
  gistId: string
}

export interface SyncState {
  lastPushAt: number | null
  lastPullAt: number | null
  error: string | null
}
