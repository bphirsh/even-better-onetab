export interface TabItem {
  url: string
  title: string
  favIconUrl?: string
  pinned?: boolean
  muted?: boolean
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
  updatedAt: number
}

/** The JSON document used for manual export/import and for Gist sync. */
export interface Snapshot {
  format: 'better-onetab/2'
  exportedAt: number
  lists: TabList[]
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
