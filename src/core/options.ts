export const BROWSER_ACTIONS = ['popup', 'store-selected', 'store-all', 'show-list'] as const
export type BrowserAction = (typeof BROWSER_ACTIONS)[number]

export interface Options {
  theme: 'auto' | 'light' | 'dark'
  /** Spacing scale for the list page. */
  density: 'compact' | 'comfortable'
  /** Where pinned lists are grouped on the list page. */
  pinnedPosition: 'top' | 'bottom'
  /** What clicking the toolbar button does. Anything but 'popup' clears the popup so the click reaches the service worker. */
  browserAction: BrowserAction
  /** What clicking a stored tab in the list page does. */
  itemClickAction: 'open-and-remove' | 'open'
  /** What opening a whole list does with the list afterwards (pinned lists are never auto-removed). */
  openListAction: 'open-and-remove' | 'open'
  /** Switch to the tab a click opens (off = open it in the background). */
  focusOpenedTab: boolean
  itemDisplay: 'title-and-url' | 'title' | 'url'
  hideFavicon: boolean
  /** Add stored tabs to browser history so they stay findable in the address bar. */
  addHistory: boolean
  /** Don't store pinned browser tabs. */
  ignorePinned: boolean
  /** Pin lists created from a tab group. */
  pinGroupList: boolean
  /** Show context menu items on pages. */
  pageContext: boolean
  /** Show context menu on all elements (links, images, ...) not just the page. */
  allContext: boolean
  /** Ask for confirmation before deleting a list (off by default — deletion has Undo and History). */
  alertRemoveList: boolean
  /** How long deleted lists stay recoverable in History (locally). */
  trashRetention: 'immediately' | 'day' | 'week' | 'month'
  /** Skip about:/chrome:/file: etc. URLs when storing. */
  excludeIllegalURL: boolean
  /** Deduplicate tabs by URL within each list when saving. */
  removeDuplicate: boolean
  /** Where restored tabs open. */
  restorePosition: 'end' | 'start' | 'new-window'
  /**
   * When storing opens the list page: only when every tab is stored, on every
   * store, only when the window doesn't already show it, or never (storing all
   * tabs then leaves a new-tab page so the window survives).
   */
  openListPage: 'all-stored' | 'always' | 'if-absent' | 'never'
}

export const DEFAULT_OPTIONS: Options = {
  theme: 'auto',
  density: 'compact',
  pinnedPosition: 'top',
  browserAction: 'popup',
  itemClickAction: 'open-and-remove',
  openListAction: 'open',
  focusOpenedTab: true,
  itemDisplay: 'title-and-url',
  hideFavicon: false,
  addHistory: true,
  ignorePinned: false,
  pinGroupList: false,
  pageContext: true,
  allContext: false,
  alertRemoveList: false,
  trashRetention: 'month',
  excludeIllegalURL: true,
  removeDuplicate: false,
  restorePosition: 'end',
  openListPage: 'if-absent',
}
