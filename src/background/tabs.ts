import { isStorableUrl, normalizeTab } from '../core/lists'
import { getLists, getOptions } from '../core/storage'
import type { TabGroupInfo, TabItem, TabList } from '../core/types'
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

/** Looks up group title/color for every group the given tabs belong to. */
const getGroupInfoMap = async (tabs: chrome.tabs.Tab[]): Promise<Map<number, TabGroupInfo>> => {
  const map = new Map<number, TabGroupInfo>()
  if (!chrome.tabGroups) return map
  const groupIds = [...new Set(tabs.map(t => t.groupId).filter(id => id != null && id >= 0))]
  for (const id of groupIds) {
    try {
      const group = await chrome.tabGroups.get(id)
      map.set(id, { title: group.title ?? '', color: group.color })
    } catch {
      // group vanished mid-operation
    }
  }
  return map
}

const toTabItem = (tab: chrome.tabs.Tab, groups?: Map<number, TabGroupInfo>): TabItem =>
  normalizeTab({
    url: tab.url ?? '',
    title: tab.title ?? '',
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned,
    muted: tab.mutedInfo?.muted,
    group: tab.groupId != null && tab.groupId >= 0 ? groups?.get(tab.groupId) : undefined,
  })

export const storeTabs = async (tabs: chrome.tabs.Tab[], listId?: string) => {
  const opts = await getOptions()
  let storable = tabs.filter(t => t.url && !t.url.startsWith(chrome.runtime.getURL('')))
  if (opts.ignorePinned) storable = storable.filter(t => !t.pinned)
  if (opts.excludeIllegalURL) storable = storable.filter(t => isStorableUrl(t.url!))
  if (storable.length === 0) return
  const groups = await getGroupInfoMap(storable)
  await appendTabsToList(listId, storable.map(t => toTabItem(t, groups)))
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

/** Re-creates tab groups: consecutive restored tabs with the same stored group get grouped. */
const regroupTabs = async (created: { id: number; group?: TabGroupInfo }[]) => {
  if (!chrome.tabGroups) return
  let cluster: number[] = []
  let current: TabGroupInfo | undefined
  const flush = async () => {
    if (current && cluster.length > 0) {
      try {
        const groupId = await chrome.tabs.group({ tabIds: cluster })
        await chrome.tabGroups.update(groupId, {
          title: current.title,
          color: current.color as chrome.tabGroups.ColorEnum,
        })
      } catch {
        // grouping is best-effort (e.g. tab already closed again)
      }
    }
    cluster = []
  }
  for (const tab of created) {
    const sameGroup =
      tab.group && current && tab.group.title === current.title && tab.group.color === current.color
    if (!sameGroup) {
      await flush()
      current = tab.group
    }
    if (tab.group) cluster.push(tab.id)
  }
  await flush()
}

export const restoreTabs = async (tabs: TabItem[], windowId?: number) => {
  const opts = await getOptions()
  let indexOffset = 0
  if (opts.restorePosition !== 'start') {
    const existing = windowId != null ? await getAllInWindow(windowId) : await getAllTabsInCurrentWindow()
    indexOffset = (existing.at(-1)?.index ?? -1) + 1
  }
  const created: { id: number; group?: TabGroupInfo }[] = []
  for (let i = 0; i < tabs.length; i += 1) {
    const tab = tabs[i]
    const createdTab = await chrome.tabs.create({
      url: tab.url,
      pinned: tab.pinned,
      index: i + indexOffset,
      windowId,
    })
    if (tab.muted) await chrome.tabs.update(createdTab.id!, { muted: true })
    created.push({ id: createdTab.id!, group: tab.group })
  }
  await regroupTabs(created)
}

export const restoreList = async (list: TabList, { windowId, newWindow }: { windowId?: number; newWindow?: boolean } = {}) => {
  // explicit request wins; otherwise the restorePosition option decides
  const openInNewWindow = newWindow ?? (await getOptions()).restorePosition === 'new-window'
  if (openInNewWindow) {
    const created = await chrome.windows.create({ url: list.tabs.map(t => t.url) })
    const createdTabs: { id: number; group?: TabGroupInfo }[] = []
    list.tabs.forEach((tab, index) => {
      const target = created.tabs?.[index]
      if (!target) return
      if (tab.muted) chrome.tabs.update(target.id!, { muted: true })
      if (tab.pinned) chrome.tabs.update(target.id!, { pinned: true })
      createdTabs.push({ id: target.id!, group: tab.group })
    })
    await regroupTabs(createdTabs)
    return
  }
  await restoreTabs(list.tabs, windowId)
}

export const restoreLatestList = async () => {
  const lists = (await getLists()).filter(l => !l.archived)
  const latest = lists.find(l => !l.pinned) ?? lists[0]
  if (!latest) return
  await restoreList(latest)
  if (!latest.pinned) await removeList(latest._id)
}
