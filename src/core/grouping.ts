import type { TabGroupInfo, TabItem } from './types'

/** Chrome tab-group color names → our list color names ('grey' has no list color). */
export const GROUP_TO_LIST_COLOR: Record<string, string> = {
  grey: '',
  blue: 'blue',
  red: 'red',
  yellow: 'yellow',
  green: 'green',
  pink: 'pink',
  purple: 'purple',
  cyan: 'cyan',
  orange: 'orange',
}

export interface GroupedSplit {
  /** Named-group tabs, keyed by group title (insertion order preserved). */
  byGroup: Map<string, { group: TabGroupInfo; tabs: TabItem[] }>
  /** Ungrouped tabs plus tabs from unnamed groups. */
  loose: TabItem[]
}

/** Splits tabs for storage routing: named groups become their own destinations. */
export const splitByGroup = (items: TabItem[]): GroupedSplit => {
  const byGroup: GroupedSplit['byGroup'] = new Map()
  const loose: TabItem[] = []
  for (const item of items) {
    const title = item.group?.title
    if (title) {
      const bucket = byGroup.get(title)
      if (bucket) bucket.tabs.push(item)
      else byGroup.set(title, { group: item.group!, tabs: [item] })
    } else {
      loose.push(item)
    }
  }
  return { byGroup, loose }
}

/**
 * Puts freshly created browser tabs into a tab group: joins an open group with
 * the same title in that window if one exists, otherwise creates the group.
 * Best-effort — grouping failures never break a restore.
 */
export const placeTabsInGroup = async (tabIds: number[], group: TabGroupInfo, windowId?: number) => {
  if (!chrome.tabGroups || tabIds.length === 0) return
  try {
    let groupId: number | undefined
    if (group.title) {
      const existing = await chrome.tabGroups.query({
        title: group.title,
        ...(windowId != null ? { windowId } : {}),
      })
      groupId = existing[0]?.id
    }
    if (groupId != null) {
      await chrome.tabs.group({ tabIds, groupId })
    } else {
      const created = await chrome.tabs.group({
        tabIds,
        ...(windowId != null ? { createProperties: { windowId } } : {}),
      })
      await chrome.tabGroups.update(created, {
        title: group.title,
        color: group.color as chrome.tabGroups.ColorEnum,
      })
    }
  } catch {
    // tab already closed, group vanished mid-flight, etc.
  }
}
