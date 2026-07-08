import { send, type Message } from '../core/messages'
import { toast } from '../ui/toast.svelte'

/** Sends a message to the service worker, surfacing failures as a toast. */
export const act = async <T = unknown>(message: Message, successText?: string): Promise<T | undefined> => {
  try {
    const result = await send<T>(message)
    if (successText) toast(successText)
    return result
  } catch (e) {
    toast(e instanceof Error ? e.message : String(e), 'error')
    return undefined
  }
}
