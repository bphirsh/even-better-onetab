import { handleMenuClick, rebuildMenus } from './background/menus'
import { migrateFromV1 } from './background/migrate'
import { addList, removeList, reorderList, replaceLists, updateList } from './background/mutations'
import { SYNC_ALARM, pullSnapshot, pushNow, setupSync } from './background/sync'
import {
  openTabLists,
  restoreLatestList,
  restoreList,
  storeAllTabs,
  storeAllTabsInAllWindows,
  storeLeftTabs,
  storeRightTabs,
  storeSelectedTabs,
  storeTwoSideTabs,
} from './background/tabs'
import type { Message } from './core/messages'
import { getLists } from './core/storage'

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install' || details.reason === 'update') {
    migrateFromV1().then(rebuildMenus)
  }
})

chrome.runtime.onStartup.addListener(() => {
  rebuildMenus()
})

chrome.contextMenus.onClicked.addListener(info => {
  handleMenuClick(info)
})

const commands: Record<string, () => Promise<unknown>> = {
  'store-selected-tabs': storeSelectedTabs,
  'store-all-tabs': storeAllTabs,
  'store-all-in-all-windows': storeAllTabsInAllWindows,
  'restore-latest-list': restoreLatestList,
  'open-lists': openTabLists,
}

chrome.commands.onCommand.addListener(command => {
  commands[command]?.()
})

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === SYNC_ALARM) pushNow().catch(() => {})
})

// Rebuild the "Store to list…" submenu when titled lists change.
let menuRebuildTimer: ReturnType<typeof setTimeout> | undefined
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  if (changes.lists || changes.opts) {
    clearTimeout(menuRebuildTimer)
    menuRebuildTimer = setTimeout(rebuildMenus, 2000)
  }
})

const storeHandlers = {
  selected: storeSelectedTabs,
  all: storeAllTabs,
  'all-windows': () => storeAllTabsInAllWindows(),
  left: storeLeftTabs,
  right: storeRightTabs,
  twoside: storeTwoSideTabs,
}

const handleMessage = async (message: Message, sender: chrome.runtime.MessageSender): Promise<unknown> => {
  switch (message.type) {
    case 'store-tabs':
      return storeHandlers[message.which](message.listId)
    case 'list-add':
      return addList(message.list)
    case 'list-update':
      return updateList(message.id, message.patch)
    case 'list-remove':
      return removeList(message.id)
    case 'lists-reorder':
      return reorderList(message.id, message.toIndex)
    case 'lists-replace':
      return replaceLists(message.lists)
    case 'restore-list': {
      const lists = await getLists()
      const list = lists.find(l => l._id === message.id)
      if (!list) throw new Error('List not found')
      await restoreList(list, { windowId: sender.tab?.windowId, newWindow: message.newWindow })
      if (message.remove) await removeList(message.id)
      return
    }
    case 'open-lists':
      return openTabLists()
    case 'sync-setup':
      return setupSync(message.token)
    case 'sync-push':
      return pushNow()
    case 'sync-pull': {
      const lists = await pullSnapshot()
      await replaceLists(lists, false)
      return { count: lists.length }
    }
  }
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender).then(
    result => sendResponse({ result }),
    error => sendResponse({ error: error instanceof Error ? error.message : String(error) }),
  )
  return true
})
