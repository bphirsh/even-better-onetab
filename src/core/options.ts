export const BROWSER_ACTIONS = ['popup', 'store-selected', 'store-all', 'show-list'] as const
export type BrowserAction = (typeof BROWSER_ACTIONS)[number]

export interface Options {
  theme: 'auto' | 'light' | 'dark'
  /** Spacing scale for the list page. */
  density: 'compact' | 'comfortable'
  /** What clicking the toolbar button does. Anything but 'popup' clears the popup so the click reaches the service worker. */
  browserAction: BrowserAction
  /** What clicking a stored tab in the list page does. */
  itemClickAction: 'open-and-remove' | 'open'
  itemDisplay: 'title-and-url' | 'title' | 'url'
  hideFavicon: boolean
  /** Add stored tabs to browser history so they stay findable in the address bar. */
  addHistory: boolean
  /** Don't store pinned browser tabs. */
  ignorePinned: boolean
  /** Pin newly created lists. */
  pinNewList: boolean
  /** Show context menu items on pages. */
  pageContext: boolean
  /** Show context menu on all elements (links, images, ...) not just the page. */
  allContext: boolean
  /** Ask for confirmation before deleting a list (off by default — deletion has Undo and History). */
  alertRemoveList: boolean
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
  browserAction: 'popup',
  itemClickAction: 'open-and-remove',
  itemDisplay: 'title-and-url',
  hideFavicon: false,
  addHistory: true,
  ignorePinned: false,
  pinNewList: false,
  pageContext: true,
  allContext: false,
  alertRemoveList: false,
  excludeIllegalURL: true,
  removeDuplicate: false,
  restorePosition: 'end',
  openListPage: 'all-stored',
}
