import { createNewTabList, normalizeList } from '../core/lists'
import {
  addToTrash,
  addTombstones,
  getLists,
  getOptions,
  getTrash,
  removeTombstones,
  setLists,
  setTrash,
} from '../core/storage'
import type { TabList } from '../core/types'
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
