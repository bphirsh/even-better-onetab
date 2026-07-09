import { BROWSER_ACTIONS, DEFAULT_OPTIONS, type Options } from '../core/options'
import { getLists, setOptions } from '../core/storage'
import { replaceLists } from './mutations'

/**
 * One-time migration from v1 (Vue/MV2) data. Lists are stored under the same
 * key with a compatible shape; options are filtered down to the surviving set.
 */
export const migrateFromV1 = async () => {
  const all = await chrome.storage.local.get(null)

  if (all.opts && typeof all.opts === 'object') {
    const old = all.opts as Record<string, unknown>
    const migrated: Options = { ...DEFAULT_OPTIONS }
    for (const key of Object.keys(DEFAULT_OPTIONS) as (keyof Options)[]) {
      if (key in old && typeof old[key] === typeof DEFAULT_OPTIONS[key]) {
        migrated[key] = old[key] as never
      }
    }
    if (old.defaultNightMode === true) migrated.theme = 'dark'
    if (typeof old.openEnd === 'boolean') migrated.restorePosition = old.openEnd ? 'end' : 'start'
    // v1 also had browserAction: 'none', which has no MV3 equivalent
    if (!BROWSER_ACTIONS.includes(migrated.browserAction)) migrated.browserAction = 'popup'
    await setOptions(migrated)
  }

  // normalize lists once (drops transient props like titleEditing)
  const lists = await getLists()
  if (lists.length > 0) await replaceLists(lists, false)

  // v1 leftovers: op-log for the dead boss sync service, timestamps, etc.
  const stale = ['ops', 'opsUpdatedAt', 'listsUpdatedAt', 'optsUpdatedAt', 'conflict'].filter(k => k in all)
  if (stale.length > 0) await chrome.storage.local.remove(stale)
  await chrome.storage.sync.remove('token').catch(() => {})
}
