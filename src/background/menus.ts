import { getLists, getOptions } from '../core/storage'
import {
  openTabLists,
  storeAllTabs,
  storeAllTabsInAllWindows,
  storeLeftTabs,
  storeRightTabs,
  storeSelectedTabs,
  storeTwoSideTabs,
} from './tabs'

type MenuHandler = (listId?: string) => Promise<unknown>

const actions: Record<string, MenuHandler> = {
  SHOW_TAB_LIST: openTabLists,
  STORE_SELECTED: storeSelectedTabs,
  STORE_ALL: storeAllTabs,
  STORE_ALL_WINDOWS: storeAllTabsInAllWindows,
  STORE_LEFT: storeLeftTabs,
  STORE_RIGHT: storeRightTabs,
  STORE_TWOSIDE: storeTwoSideTabs,
}

const create = (props: chrome.contextMenus.CreateProperties) =>
  new Promise<void>(resolve => {
    chrome.contextMenus.create(props, () => {
      // swallow "duplicate id" errors during rapid rebuilds
      void chrome.runtime.lastError
      resolve()
    })
  })

export const rebuildMenus = async () => {
  await chrome.contextMenus.removeAll()
  const opts = await getOptions()
  const contexts: chrome.contextMenus.ContextType[] = ['action']
  if (opts.pageContext) {
    contexts.push('page')
    if (opts.allContext) contexts.push('all')
  }

  await create({ id: 'SHOW_TAB_LIST', title: 'Show stored tabs', contexts })
  await create({ id: 'STORE_SELECTED', title: 'Store selected tabs', contexts })
  await create({ id: 'STORE', title: 'Store tabs…', contexts })
  await create({ id: 'STORE.STORE_ALL', parentId: 'STORE', title: 'All tabs in this window', contexts })
  await create({ id: 'STORE.STORE_ALL_WINDOWS', parentId: 'STORE', title: 'All tabs in all windows', contexts })
  await create({ id: 'STORE.STORE_LEFT', parentId: 'STORE', title: 'Tabs to the left', contexts })
  await create({ id: 'STORE.STORE_RIGHT', parentId: 'STORE', title: 'Tabs to the right', contexts })
  await create({ id: 'STORE.STORE_TWOSIDE', parentId: 'STORE', title: 'Tabs on both sides', contexts })

  const titledLists = (await getLists()).filter(l => l.title)
  if (titledLists.length > 0) {
    await create({ id: 'TO_LIST', title: 'Store to list…', contexts })
    for (const list of titledLists.slice(0, 20)) {
      await create({ id: `TO_LIST|${list._id}`, parentId: 'TO_LIST', title: list.title, contexts })
      await create({ id: `TO_LIST.STORE_SELECTED|${list._id}`, parentId: `TO_LIST|${list._id}`, title: 'Selected tabs', contexts })
      await create({ id: `TO_LIST.STORE_ALL|${list._id}`, parentId: `TO_LIST|${list._id}`, title: 'All tabs in this window', contexts })
    }
  }
}

export const handleMenuClick = (info: chrome.contextMenus.OnClickData) => {
  const menuItemId = String(info.menuItemId)
  const [path, listId] = menuItemId.split('|')
  const action = path.split('.').pop()!
  const handler = actions[action]
  if (handler) return handler(listId)
}
