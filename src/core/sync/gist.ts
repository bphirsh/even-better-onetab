import type { Snapshot } from '../types'
import type { SyncProvider } from './provider'

const API = 'https://api.github.com'
export const GIST_FILENAME = 'better-onetab.json'
const GIST_DESCRIPTION = 'Better OneTab — synced tab lists'

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
})

const request = async (token: string, path: string, init: RequestInit = {}) => {
  const res = await fetch(`${API}${path}`, { ...init, headers: headers(token) })
  if (!res.ok) {
    const detail = res.status === 401 ? 'token rejected' : res.status === 404 ? 'gist not found' : `HTTP ${res.status}`
    throw new Error(`GitHub API error: ${detail}`)
  }
  return res.json()
}

/** Creates the private gist that will hold the synced lists; returns its id. */
export const createSyncGist = async (token: string, snapshot: Snapshot): Promise<string> => {
  const gist = await request(token, '/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(snapshot, null, 2) } },
    }),
  })
  return gist.id
}

export class GistProvider implements SyncProvider {
  constructor(private token: string, private gistId: string) {}

  async push(snapshot: Snapshot): Promise<void> {
    await request(this.token, `/gists/${this.gistId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        files: { [GIST_FILENAME]: { content: JSON.stringify(snapshot, null, 2) } },
      }),
    })
  }

  async pull(): Promise<Snapshot | null> {
    const gist = await request(this.token, `/gists/${this.gistId}`)
    const file = gist.files?.[GIST_FILENAME]
    if (!file) return null
    let content: string = file.content
    if (file.truncated) {
      const res = await fetch(file.raw_url)
      if (!res.ok) throw new Error(`Could not fetch gist content (HTTP ${res.status})`)
      content = await res.text()
    }
    return JSON.parse(content)
  }
}
