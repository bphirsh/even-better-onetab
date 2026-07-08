export interface ToastItem {
  id: number
  text: string
  kind: 'info' | 'error'
}

export const toasts = $state({ items: [] as ToastItem[] })

let nextId = 1

export const toast = (text: string, kind: ToastItem['kind'] = 'info') => {
  const id = nextId++
  toasts.items.push({ id, text, kind })
  setTimeout(() => {
    const index = toasts.items.findIndex(t => t.id === id)
    if (index >= 0) toasts.items.splice(index, 1)
  }, 3500)
}
