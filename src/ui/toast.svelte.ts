export interface ToastAction {
  label: string
  fn: () => void
}

export interface ToastItem {
  id: number
  text: string
  kind: 'info' | 'error'
  action?: ToastAction
}

export const toasts = $state({ items: [] as ToastItem[] })

let nextId = 1

export const dismissToast = (id: number) => {
  const index = toasts.items.findIndex(t => t.id === id)
  if (index >= 0) toasts.items.splice(index, 1)
}

export const toast = (
  text: string,
  kind: ToastItem['kind'] = 'info',
  action?: ToastAction,
  duration = action ? 6000 : 3500,
) => {
  const id = nextId++
  toasts.items.push({ id, text, kind, action })
  setTimeout(() => dismissToast(id), duration)
}
