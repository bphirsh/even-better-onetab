import { createSnapshot, parseSnapshot } from '../core/lists'
import { getLists, getSyncConfig, setSyncConfig, setSyncState } from '../core/storage'
import { GistProvider, createSyncGist } from '../core/sync/gist'

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
    const lists = await getLists()
    await new GistProvider(config.gistToken, config.gistId).push(createSnapshot(lists))
    await setSyncState({ lastPushAt: Date.now(), error: null })
  } catch (e) {
    await setSyncState({ error: e instanceof Error ? e.message : String(e) })
    throw e
  }
}

/** Creates the private gist and enables sync; returns the gist id. */
export const setupSync = async (token: string) => {
  const lists = await getLists()
  const gistId = await createSyncGist(token, createSnapshot(lists))
  await setSyncConfig({ enabled: true, gistToken: token, gistId })
  await setSyncState({ lastPushAt: Date.now(), error: null })
  return { gistId }
}

/** Pulls the remote snapshot and returns the parsed lists (caller decides to apply). */
export const pullSnapshot = async () => {
  const config = await getSyncConfig()
  if (!config.gistToken || !config.gistId) throw new Error('Sync is not configured')
  try {
    const snapshot = await new GistProvider(config.gistToken, config.gistId).pull()
    if (!snapshot) throw new Error('No sync data found in the gist')
    const lists = parseSnapshot(snapshot)
    await setSyncState({ lastPullAt: Date.now(), error: null })
    return lists
  } catch (e) {
    await setSyncState({ error: e instanceof Error ? e.message : String(e) })
    throw e
  }
}
