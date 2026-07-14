import { handleMenuClick, rebuildMenus } from './background/menus'
import { migrateFromV1 } from './background/migrate'
import {
  addList,
  clearAllTrash,
  deleteTabTrashEntry,
  deleteTrashEntry,
  putAllTrash,
  putTabTrashEntry,
  putTrashEntry,
  removeList,
  removeTabFromList,
  replaceLists,
  setListsOrder,
  restoreFromTrash,
  restoreTabFromTrash,
  updateList,
} from './background/mutations'
import { SYNC_ALARM, autoPullMerge, pullMerge, pushNow, setupSync } from './background/sync'
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
import { getLists, getOptions } from './core/storage'

/**
 * With a popup set, clicks open it and never reach onClicked — so for the
 * other browserAction modes the popup is cleared and we handle the click here.
 */
const applyBrowserAction = async () => {
  const opts = await getOptions()
  await chrome.action.setPopup({ popup: opts.browserAction === 'popup' ? 'popup.html' : '' })
}

chrome.action.onClicked.addListener(async () => {
  const opts = await getOptions()
  if (opts.browserAction === 'store-selected') storeSelectedTabs()
  else if (opts.browserAction === 'store-all') storeAllTabs()
  else openTabLists()
})

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install' || details.reason === 'update') {
    migrateFromV1().then(rebuildMenus).then(applyBrowserAction)
  }
})

chrome.runtime.onStartup.addListener(() => {
  rebuildMenus()
  applyBrowserAction()
  autoPullMerge()
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
  if (changes.opts) applyBrowserAction()
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
      return addList(message.list, message.index)
    case 'list-update':
      return updateList(message.id, message.patch)
    case 'list-remove':
      return removeList(message.id)
    case 'lists-set-order':
      return setListsOrder(message.ids)
    case 'lists-replace':
      return replaceLists(message.lists)
    case 'restore-list': {
      const lists = await getLists()
      const list = lists.find(l => l._id === message.id)
      if (!list) throw new Error('List not found')
      await restoreList(list, { windowId: sender.tab?.windowId, newWindow: message.newWindow })
      // callers that don't decide (e.g. the popup) fall back to the option
      const opts = await getOptions()
      const remove = message.remove ?? (opts.openListAction === 'open-and-remove' && !list.pinned)
      if (remove) await removeList(message.id)
      return
    }
    case 'trash-restore':
      return restoreFromTrash(message.id)
    case 'tab-remove':
      return removeTabFromList(message.listId, message.index, message.url)
    case 'tab-trash-restore':
      return restoreTabFromTrash(message.id)
    case 'trash-delete':
      return deleteTrashEntry(message.id, message.deletedAt)
    case 'trash-put':
      return putTrashEntry(message.entry)
    case 'tab-trash-delete':
      return deleteTabTrashEntry(message.id)
    case 'tab-trash-put':
      return putTabTrashEntry(message.entry)
    case 'trash-clear':
      return clearAllTrash()
    case 'trash-put-all':
      return putAllTrash(message.trash, message.tabTrash)
    case 'open-lists':
      return openTabLists()
    case 'sync-setup':
      return setupSync(message.token, message.gistId)
    case 'sync-push':
      return pushNow()
    case 'sync-pull':
      return pullMerge()
  }
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender).then(
    result => sendResponse({ result }),
    error => sendResponse({ error: error instanceof Error ? error.message : String(error) }),
  )
  return true
})
