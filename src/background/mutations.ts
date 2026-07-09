import { createNewTabList, normalizeList } from '../core/lists'
import { addTombstones, getLists, getOptions, setLists } from '../core/storage'
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
    const beforeIds = new Set(lists.map(l => l._id))
    const result = fn(lists) ?? lists
    // Tombstone anything that disappeared so sync propagates the deletion.
    for (const list of result) beforeIds.delete(list._id)
    if (beforeIds.size > 0) await addTombstones([...beforeIds])
    await setLists(result)
    if (sync) schedulePush()
  })

export const addList = (partial: Partial<TabList>, index?: number) => {
  const list = createNewTabList(partial)
  return mutateLists(lists => {
    lists.splice(Math.max(0, Math.min(index ?? 0, lists.length)), 0, list)
  }).then(() => list)
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
