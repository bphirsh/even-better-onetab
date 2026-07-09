import { send, type Message } from '../core/messages'
import { toast } from '../ui/toast.svelte'

export interface ActResult<T> {
  ok: boolean
  result?: T
}

/** Sends a message to the service worker, surfacing failures as a toast. */
export const act = async <T = unknown>(message: Message, successText?: string): Promise<ActResult<T>> => {
  try {
    const result = await send<T>(message)
    if (successText) toast(successText)
    return { ok: true, result }
  } catch (e) {
    toast(e instanceof Error ? e.message : String(e), 'error')
    return { ok: false }
  }
}
