import type { TabList, Tombstone } from '../types'

export interface MergeResult {
  lists: TabList[]
  tombstones: Tombstone[]
}

/**
 * Merges two devices' lists: per id the newer `updatedAt` wins, lists present
 * on only one side are kept, and tombstones (from either side) suppress a list
 * unless it was edited after the deletion. Local ordering is preserved;
 * remote-only lists are prepended in their remote order.
 */
export const mergeLists = (
  localLists: TabList[],
  localTombstones: Tombstone[],
  remoteLists: TabList[],
  remoteTombstones: Tombstone[],
): MergeResult => {
  const deletedAt = new Map<string, number>()
  for (const t of [...localTombstones, ...remoteTombstones]) {
    deletedAt.set(t.id, Math.max(t.deletedAt, deletedAt.get(t.id) ?? 0))
  }
  const isDeleted = (list: TabList) => (deletedAt.get(list._id) ?? 0) > list.updatedAt

  const localIds = new Set(localLists.map(l => l._id))
  const remoteById = new Map(remoteLists.map(l => [l._id, l]))

  const merged: TabList[] = []
  for (const remote of remoteLists) {
    if (!localIds.has(remote._id) && !isDeleted(remote)) merged.push(remote)
  }
  for (const local of localLists) {
    const remote = remoteById.get(local._id)
    const winner = remote && remote.updatedAt > local.updatedAt ? remote : local
    if (!isDeleted(winner)) merged.push(winner)
  }

  return {
    lists: merged,
    tombstones: [...deletedAt.entries()].map(([id, at]) => ({ id, deletedAt: at })),
  }
}
