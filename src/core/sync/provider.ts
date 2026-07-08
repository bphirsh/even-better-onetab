import type { Snapshot } from '../types'

/**
 * A sync backend stores one snapshot of all lists. GitHub Gist is the only
 * built-in provider; others (Drive, WebDAV, self-hosted) can implement this
 * same interface.
 */
export interface SyncProvider {
  push(snapshot: Snapshot): Promise<void>
  pull(): Promise<Snapshot | null>
}
