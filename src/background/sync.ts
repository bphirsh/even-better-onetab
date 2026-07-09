import { createSnapshot, parseSnapshot, parseTombstones } from '../core/lists'
import {
  getLists,
  getSyncConfig,
  getTombstones,
  setSyncConfig,
  setSyncState,
  setTombstones,
} from '../core/storage'
import { GistProvider, createSyncGist } from '../core/sync/gist'
import { mergeLists } from '../core/sync/merge'
import { replaceLists } from './mutations'

export const SYNC_ALARM = 'sync-push'
const PUSH_DELAY_MINUTES = 0.5

/**
 * Debounced push: every mutation re-arms the alarm, so a burst of edits
 * results in one upload. Alarms survive service-worker shutdown.
 */
export const schedulePush = () => {
  getSyncConfig().then(config => {
    if (!config.enabled || !config.gistToken || !config.gistId) return
    chrome.alarms.create(SYNC_ALARM, { delayInMinutes: PUSH_DELAY_MINUTES })
  })
}

export const pushNow = async () => {
  const config = await getSyncConfig()
  if (!config.enabled || !config.gistToken || !config.gistId) return
  try {
    const [lists, tombstones] = await Promise.all([getLists(), getTombstones()])
    await new GistProvider(config.gistToken, config.gistId).push(createSnapshot(lists, tombstones))
    await setSyncState({ lastPushAt: Date.now(), error: null })
  } catch (e) {
    await setSyncState({ error: e instanceof Error ? e.message : String(e) })
    throw e
  }
}

/** Creates the private gist and enables sync; returns the gist id. */
export const setupSync = async (token: string) => {
  const [lists, tombstones] = await Promise.all([getLists(), getTombstones()])
  const gistId = await createSyncGist(token, createSnapshot(lists, tombstones))
  await setSyncConfig({ enabled: true, gistToken: token, gistId })
  await setSyncState({ lastPushAt: Date.now(), error: null })
  return { gistId }
}

/**
 * Pulls the remote snapshot and merges it into the local lists: newer
 * updatedAt wins per list, one-sided lists are kept, tombstones from either
 * device suppress deleted lists. The merged result is scheduled for push so
 * the gist converges too.
 */
export const pullMerge = async () => {
  const config = await getSyncConfig()
  if (!config.gistToken || !config.gistId) throw new Error('Sync is not configured')
  try {
    const snapshot = await new GistProvider(config.gistToken, config.gistId).pull()
    if (!snapshot) throw new Error('No sync data found in the gist')
    const [localLists, localTombstones] = await Promise.all([getLists(), getTombstones()])
    const merged = mergeLists(localLists, localTombstones, parseSnapshot(snapshot), parseTombstones(snapshot))
    await setTombstones(merged.tombstones)
    await replaceLists(merged.lists, true)
    await setSyncState({ lastPullAt: Date.now(), error: null })
    return { count: merged.lists.length }
  } catch (e) {
    await setSyncState({ error: e instanceof Error ? e.message : String(e) })
    throw e
  }
}

/** Best-effort merge on browser startup so a second device converges without manual pulls. */
export const autoPullMerge = async () => {
  const config = await getSyncConfig()
  if (!config.enabled || !config.gistToken || !config.gistId) return
  await pullMerge().catch(() => {})
}
