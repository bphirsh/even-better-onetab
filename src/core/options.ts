export interface Options {
  theme: 'auto' | 'light' | 'dark'
  /** What clicking a stored tab in the list page does. */
  itemClickAction: 'open-and-remove' | 'open' | 'none'
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
  /** Ask for confirmation before deleting a list. */
  alertRemoveList: boolean
  /** Skip about:/chrome:/file: etc. URLs when storing. */
  excludeIllegalURL: boolean
  /** Deduplicate tabs by URL within each list when saving. */
  removeDuplicate: boolean
  /** Restore tabs at the end of the window instead of the start. */
  openEnd: boolean
  /** Open the list page after storing all tabs (so the window isn't left empty). */
  openTabListNoTab: boolean
}

export const DEFAULT_OPTIONS: Options = {
  theme: 'auto',
  itemClickAction: 'open-and-remove',
  itemDisplay: 'title-and-url',
  hideFavicon: false,
  addHistory: true,
  ignorePinned: false,
  pinNewList: false,
  pageContext: true,
  allContext: false,
  alertRemoveList: true,
  excludeIllegalURL: true,
  removeDuplicate: false,
  openEnd: true,
  openTabListNoTab: true,
}
