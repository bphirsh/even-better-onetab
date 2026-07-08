import { isStorableUrl, normalizeTab } from '../core/lists'
import { getLists, getOptions } from '../core/storage'
import type { TabItem, TabList } from '../core/types'
import { appendTabsToList, removeList } from './mutations'

const APP_URL = chrome.runtime.getURL('app.html')

const getAllInWindow = (windowId: number) => chrome.tabs.query({ windowId })

const getFocusedWindow = () => chrome.windows.getLastFocused({ windowTypes: ['normal'] })

/** Opens (or focuses) the list page, one per window. */
export const openTabLists = async () => {
  const { appTabIds = {} } = await chrome.storage.session.get('appTabIds')
  const win = await getFocusedWindow()
  const windowId = String(win.id)
  const existingId = appTabIds[windowId]
  if (existingId != null) {
    try {
      const tab = await chrome.tabs.get(existingId)
      if (tab.windowId === win.id && tab.url?.startsWith(APP_URL)) {
        await chrome.tabs.update(tab.id!, { active: true })
        return
      }
    } catch {
      // tab was closed; fall through and create a new one
    }
  }
  const created = await chrome.tabs.create({ url: APP_URL, windowId: win.id })
  await chrome.storage.session.set({ appTabIds: { ...appTabIds, [windowId]: created.id } })
}

export const getSelectedTabs = () => chrome.tabs.query({ highlighted: true, currentWindow: true })

const getAllTabsInCurrentWindow = async () => {
  const win = await getFocusedWindow()
  return getAllInWindow(win.id!)
}

export const groupTabsInCurrentWindow = async () => {
  const tabs = await getAllTabsInCurrentWindow()
  const result = { left: [] as chrome.tabs.Tab[], right: [] as chrome.tabs.Tab[], inter: [] as chrome.tabs.Tab[], all: tabs }
  let currentIsRight = false
  for (const tab of tabs) {
    if (tab.highlighted) {
      currentIsRight = true
      result.inter.push(tab)
    } else if (currentIsRight) result.right.push(tab)
    else result.left.push(tab)
  }
  return { ...result, twoSide: result.left.concat(result.right) }
}

const toTabItem = (tab: chrome.tabs.Tab): TabItem =>
  normalizeTab({
    url: tab.url ?? '',
    title: tab.title ?? '',
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned,
    muted: tab.mutedInfo?.muted,
  })

export const storeTabs = async (tabs: chrome.tabs.Tab[], listId?: string) => {
  const opts = await getOptions()
  let storable = tabs.filter(t => t.url && !t.url.startsWith(chrome.runtime.getURL('')))
  if (opts.ignorePinned) storable = storable.filter(t => !t.pinned)
  if (opts.excludeIllegalURL) storable = storable.filter(t => isStorableUrl(t.url!))
  if (storable.length === 0) return
  await appendTabsToList(listId, storable.map(toTabItem))
  if (opts.addHistory) {
    for (const tab of storable) {
      try {
        await chrome.history.addUrl({ url: tab.url! })
      } catch {
        // some URLs (about:*, ...) can't be added to history
      }
    }
  }
  await chrome.tabs.remove(storable.map(t => t.id!))
}

export const storeSelectedTabs = async (listId?: string) => {
  const tabs = await getSelectedTabs()
  const allTabs = await getAllTabsInCurrentWindow()
  if (tabs.length === allTabs.length) await openTabLists()
  return storeTabs(tabs, listId)
}

export const storeAllTabs = async (listId?: string) => {
  const tabs = await getAllTabsInCurrentWindow()
  const opts = await getOptions()
  if (opts.openTabListNoTab) await openTabLists()
  return storeTabs(tabs, listId)
}

export const storeAllTabsInAllWindows = async () => {
  const windows = await chrome.windows.getAll()
  const opts = await getOptions()
  if (opts.openTabListNoTab) await openTabLists()
  for (const win of windows) {
    const tabs = await getAllInWindow(win.id!)
    await storeTabs(tabs)
  }
}

export const storeLeftTabs = async (listId?: string) => storeTabs((await groupTabsInCurrentWindow()).left, listId)
export const storeRightTabs = async (listId?: string) => storeTabs((await groupTabsInCurrentWindow()).right, listId)
export const storeTwoSideTabs = async (listId?: string) => storeTabs((await groupTabsInCurrentWindow()).twoSide, listId)

export const restoreTabs = async (tabs: TabItem[], windowId?: number) => {
  const opts = await getOptions()
  let indexOffset = 0
  if (opts.openEnd) {
    const existing = windowId != null ? await getAllInWindow(windowId) : await getAllTabsInCurrentWindow()
    indexOffset = (existing.at(-1)?.index ?? -1) + 1
  }
  for (let i = 0; i < tabs.length; i += 1) {
    const tab = tabs[i]
    const created = await chrome.tabs.create({
      url: tab.url,
      pinned: tab.pinned,
      index: i + indexOffset,
      windowId,
    })
    if (tab.muted) await chrome.tabs.update(created.id!, { muted: true })
  }
}

export const restoreList = async (list: TabList, { windowId, newWindow = false }: { windowId?: number; newWindow?: boolean } = {}) => {
  if (newWindow) {
    const created = await chrome.windows.create({ url: list.tabs.map(t => t.url) })
    list.tabs.forEach((tab, index) => {
      const target = created.tabs?.[index]
      if (tab.muted && target) chrome.tabs.update(target.id!, { muted: true })
      if (tab.pinned && target) chrome.tabs.update(target.id!, { pinned: true })
    })
    return
  }
  await restoreTabs(list.tabs, windowId)
}

export const restoreLatestList = async () => {
  const lists = await getLists()
  const latest = lists.find(l => !l.pinned) ?? lists[0]
  if (!latest) return
  await restoreList(latest)
  if (!latest.pinned) await removeList(latest._id)
}
