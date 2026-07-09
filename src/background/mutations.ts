import { createNewTabList, normalizeList } from '../core/lists'
import {
  addToTabTrash,
  addToTrash,
  addTombstones,
  getLists,
  getOptions,
  getTabTrash,
  getTrash,
  removeTombstones,
  setLists,
  setTabTrash,
  setTrash,
} from '../core/storage'
import type { TabItem, TabList, TrashEntry, TrashTabEntry } from '../core/types'
import { schedulePush } from './sync'

// All list writes are funneled through this queue so concurrent messages from
// the popup, app page, and tab events can't clobber each other's read-modify-write.
let queue: Promise<unknown> = Promise.resolve()

export const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = queue.then(fn, fn)
  queue = next.catch(() => {})
  return next
}

const touch = (list: TabList) => {
  list.updatedAt = Date.now()
  return list
}

export const mutateLists = (fn: (lists: TabList[]) => TabList[] | void, sync = true) =>
  enqueue(async () => {
    const lists = await getLists()
    const byId = new Map(lists.map(l => [l._id, l]))
    const result = fn(lists) ?? lists
    const presentIds = new Set(result.map(l => l._id))
    const removed = [...byId.values()].filter(l => !presentIds.has(l._id))
    if (removed.length > 0) {
      // Tombstone so sync propagates the deletion; trash so History can recover it.
      await addTombstones(removed.map(l => l._id))
      await addToTrash(removed)
    }
    await setLists(result)
    if (sync) schedulePush()
  })

export const addList = async (partial: Partial<TabList>, index?: number) => {
  const list = createNewTabList(partial)
  await mutateLists(lists => {
    lists.splice(Math.max(0, Math.min(index ?? 0, lists.length)), 0, list)
  })
  // a resurrected id must not be re-deleted by the next sync merge
  await removeTombstones([list._id])
  return list
}

/** Recovers a deleted list from History; bumping updatedAt keeps merge from re-deleting it. */
export const restoreFromTrash = async (listId: string) => {
  const trash = await getTrash()
  const entry = trash.find(t => t.list._id === listId)
  if (!entry) throw new Error('That list is no longer in history')
  await setTrash(trash.filter(t => t.list._id !== listId))
  return addList({ ...entry.list, updatedAt: Date.now() })
}

/**
 * Explicit single-tab deletion; the removed tab goes to the tab trash for
 * History. The gesture decides the destination: even when this empties (and
 * so removes) the list, History records a deleted *tab*, not a deleted list.
 */
export const removeTabFromList = async (listId: string, index: number, url: string) => {
  let removed: TabItem | undefined
  let listTitle = ''
  let removedWholeList = false
  await mutateLists(lists => {
    const list = lists.find(l => l._id === listId)
    if (!list) return
    const i = list.tabs[index]?.url === url ? index : list.tabs.findIndex(t => t.url === url)
    if (i < 0) return
    removed = list.tabs[i]
    listTitle = list.title
    if (list.tabs.length === 1) {
      removedWholeList = true
      return lists.filter(l => l._id !== listId)
    }
    list.tabs.splice(i, 1)
    touch(list)
  })
  if (removed) {
    if (removedWholeList) {
      // mutateLists auto-trashed the removed list; take that entry back out
      const trash = await getTrash()
      await setTrash(trash.filter(t => t.list._id !== listId))
    }
    await addToTabTrash([{ tab: removed, listId, listTitle }])
  }
}

/** Permanently drops a deleted-list entry from History. */
export const deleteTrashEntry = (listId: string, deletedAt: number) =>
  enqueue(async () => {
    const trash = await getTrash()
    await setTrash(trash.filter(t => !(t.list._id === listId && t.deletedAt === deletedAt)))
  })

/** Reinserts a deleted-list entry (undo of permanent delete). */
export const putTrashEntry = (entry: TrashEntry) =>
  enqueue(async () => {
    const trash = await getTrash()
    await setTrash([entry, ...trash])
  })

/** Permanently drops a deleted-tab entry from History. */
export const deleteTabTrashEntry = (id: string) =>
  enqueue(async () => {
    const trash = await getTabTrash()
    await setTabTrash(trash.filter(t => t.id !== id))
  })

/** Reinserts a deleted-tab entry (undo of permanent delete). */
export const putTabTrashEntry = (entry: TrashTabEntry) =>
  enqueue(async () => {
    const trash = await getTabTrash()
    await setTabTrash([entry, ...trash])
  })

/** Recovers a deleted tab into its original list, or a recreated one if it's gone. */
export const restoreTabFromTrash = async (entryId: string) => {
  const trash = await getTabTrash()
  const entry = trash.find(t => t.id === entryId)
  if (!entry) throw new Error('That tab is no longer in history')
  await setTabTrash(trash.filter(t => t.id !== entryId))
  await mutateLists(lists => {
    const list = lists.find(l => l._id === entry.listId)
    if (list) {
      list.tabs.push(entry.tab)
      touch(list)
    } else {
      lists.unshift(createNewTabList({ tabs: [entry.tab], title: entry.listTitle }))
    }
  })
}

export const updateList = (id: string, patch: Partial<TabList>) =>
  mutateLists(lists => {
    const list = lists.find(l => l._id === id)
    if (!list) return
    Object.assign(list, normalizeList({ ...list, ...patch, _id: id }))
    touch(list)
    // Removing the last tab removes the list, matching v1 behavior.
    if (list.tabs.length === 0) return lists.filter(l => l._id !== id)
  })

export const removeList = (id: string) =>
  mutateLists(lists => lists.filter(l => l._id !== id))

export const reorderList = (id: string, toIndex: number) =>
  mutateLists(lists => {
    const fromIndex = lists.findIndex(l => l._id === id)
    if (fromIndex < 0) return
    const [list] = lists.splice(fromIndex, 1)
    lists.splice(Math.max(0, Math.min(toIndex, lists.length)), 0, touch(list))
  })

export const replaceLists = (lists: TabList[], sync = true) =>
  mutateLists(() => lists.map(normalizeList), sync)

export const appendTabsToList = async (listId: string | undefined, tabs: TabList['tabs']) => {
  const opts = await getOptions()
  if (listId == null) {
    return addList({ tabs, pinned: opts.pinNewList })
  }
  return mutateLists(lists => {
    const list = lists.find(l => l._id === listId)
    if (!list) {
      lists.unshift(createNewTabList({ tabs, pinned: opts.pinNewList }))
      return
    }
    list.tabs.push(...tabs)
    touch(list)
  })
}
