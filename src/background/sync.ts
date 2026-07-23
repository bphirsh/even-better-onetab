import { createSnapshot, normalizeList, parseSnapshot, parseTombstones } from '../core/lists'
import { DEFAULT_OPTIONS, type Options } from '../core/options'
import {
  getLists,
  getOptions,
  getOptsUpdatedAt,
  getSyncConfig,
  getTombstones,
  setLists,
  setOptions,
  setSyncConfig,
  setSyncState,
  setTombstones,
} from '../core/storage'
import { GistProvider, createSyncGist } from '../core/sync/gist'
import { mergeLists } from '../core/sync/merge'
import type { Snapshot } from '../core/types'
import { enqueue } from './mutations'

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

const buildSnapshot = async (): Promise<Snapshot> => {
  const [lists, tombstones, opts, optsUpdatedAt] = await Promise.all([
    getLists(),
    getTombstones(),
    getOptions(),
    getOptsUpdatedAt(),
  ])
  return createSnapshot(lists, tombstones, { opts: { ...opts }, optsUpdatedAt })
}

export const pushNow = async () => {
  const config = await getSyncConfig()
  if (!config.enabled || !config.gistToken || !config.gistId) return
  try {
    await new GistProvider(config.gistToken, config.gistId).push(await buildSnapshot())
    await setSyncState({ lastPushAt: Date.now(), error: null })
  } catch (e) {
    await setSyncState({ error: e instanceof Error ? e.message : String(e) })
    throw e
  }
}

/** Merges a remote snapshot into local state: lists, tombstones, and settings. */
const applyRemoteSnapshot = async (snapshot: Snapshot) => {
  // Parsing is pure, so do it before taking the queue.
  const remoteLists = parseSnapshot(snapshot)
  const remoteTombstones = parseTombstones(snapshot)

  // The read → merge → write must be atomic against local edits, so it runs as a
  // single queued unit rather than reading outside the queue and only enqueuing
  // the write (which would let a concurrent edit be merged against stale state
  // and clobbered). setLists/setTombstones are used directly here — calling
  // replaceLists would re-enter enqueue and deadlock.
  const merged = await enqueue(async () => {
    const [localLists, localTombstones] = await Promise.all([getLists(), getTombstones()])
    const m = mergeLists(localLists, localTombstones, remoteLists, remoteTombstones)
    await setLists(m.lists.map(normalizeList))
    await setTombstones(m.tombstones)
    return m
  })
  // the merged result is pushed so the gist converges too
  schedulePush()

  // settings: last writer wins, keeping the remote's timestamp so the winner is stable
  if (
    snapshot.opts &&
    typeof snapshot.opts === 'object' &&
    typeof snapshot.optsUpdatedAt === 'number' &&
    snapshot.optsUpdatedAt > (await getOptsUpdatedAt())
  ) {
    await setOptions({ ...DEFAULT_OPTIONS, ...snapshot.opts } as Options, snapshot.optsUpdatedAt)
  }
  return merged
}

/**
 * Enables sync. Without a gist id it creates a fresh private gist; with one
 * (e.g. from a previous install) it adopts that gist and merges it in.
 */
export const setupSync = async (token: string, existingGistId?: string) => {
  const cleaned = existingGistId?.trim().replace(/^https:\/\/gist\.github\.com\/(?:[^/]+\/)?/, '')
  if (cleaned) {
    const snapshot = await new GistProvider(token, cleaned).pull()
    if (!snapshot) throw new Error('That gist has no Even Better OneTab sync data')
    await setSyncConfig({ enabled: true, gistToken: token, gistId: cleaned })
    await applyRemoteSnapshot(snapshot)
    await setSyncState({ lastPullAt: Date.now(), error: null })
    return { gistId: cleaned }
  }
  const gistId = await createSyncGist(token, await buildSnapshot())
  await setSyncConfig({ enabled: true, gistToken: token, gistId })
  await setSyncState({ lastPushAt: Date.now(), error: null })
  return { gistId }
}

/**
 * Pulls the remote snapshot and merges it in: newer updatedAt wins per list,
 * one-sided lists are kept, tombstones from either device suppress deleted
 * lists, and settings follow the newer optsUpdatedAt. The merged result is
 * scheduled for push so the gist converges too.
 */
export const pullMerge = async () => {
  const config = await getSyncConfig()
  if (!config.gistToken || !config.gistId) throw new Error('Sync is not configured')
  try {
    const snapshot = await new GistProvider(config.gistToken, config.gistId).pull()
    if (!snapshot) throw new Error('No sync data found in the gist')
    const merged = await applyRemoteSnapshot(snapshot)
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
