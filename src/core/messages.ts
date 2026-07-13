import type { SyncState, TabList, TrashEntry, TrashTabEntry } from './types'

export type StoreWhich = 'selected' | 'all' | 'all-windows' | 'left' | 'right' | 'twoside'

export type Message =
  | { type: 'store-tabs'; which: StoreWhich; listId?: string }
  | { type: 'list-add'; list: Partial<TabList>; index?: number }
  | { type: 'list-update'; id: string; patch: Partial<TabList> }
  | { type: 'list-remove'; id: string }
  | { type: 'lists-set-order'; ids: string[] }
  | { type: 'lists-replace'; lists: TabList[] }
  | { type: 'restore-list'; id: string; newWindow?: boolean; remove?: boolean }
  | { type: 'trash-restore'; id: string }
  | { type: 'tab-remove'; listId: string; index: number; url: string }
  | { type: 'tab-trash-restore'; id: string }
  | { type: 'trash-delete'; id: string; deletedAt: number }
  | { type: 'trash-put'; entry: TrashEntry }
  | { type: 'tab-trash-delete'; id: string }
  | { type: 'tab-trash-put'; entry: TrashTabEntry }
  | { type: 'trash-clear' }
  | { type: 'trash-put-all'; trash: TrashEntry[]; tabTrash: TrashTabEntry[] }
  | { type: 'open-lists' }
  | { type: 'sync-setup'; token: string; gistId?: string }
  | { type: 'sync-push' }
  | { type: 'sync-pull' }

export interface SyncSetupResult {
  gistId: string
}

/**
 * All list mutations and tab operations go through the service worker so there
 * is a single writer; pages read from storage and react to onChanged events.
 */
export const send = <T = unknown>(message: Message): Promise<T> =>
  chrome.runtime.sendMessage(message).then(response => {
    if (response && typeof response === 'object' && 'error' in response && response.error) {
      throw new Error(String(response.error))
    }
    return response?.result as T
  })

export type { SyncState }
