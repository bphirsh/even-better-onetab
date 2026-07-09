import type { SyncState, TabList } from './types'

export type StoreWhich = 'selected' | 'all' | 'all-windows' | 'left' | 'right' | 'twoside'

export type Message =
  | { type: 'store-tabs'; which: StoreWhich; listId?: string }
  | { type: 'list-add'; list: Partial<TabList>; index?: number }
  | { type: 'list-update'; id: string; patch: Partial<TabList> }
  | { type: 'list-remove'; id: string }
  | { type: 'lists-reorder'; id: string; toIndex: number }
  | { type: 'lists-replace'; lists: TabList[] }
  | { type: 'restore-list'; id: string; newWindow?: boolean; remove?: boolean }
  | { type: 'trash-restore'; id: string }
  | { type: 'open-lists' }
  | { type: 'sync-setup'; token: string }
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
