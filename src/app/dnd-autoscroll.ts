/**
 * Edge auto-scroll for drag-and-drop. svelte-dnd-action moves items with
 * pointer tracking (not native HTML5 dnd), so the browser never scrolls the
 * list's scroll container on its own. While a drag is active, holding the
 * pointer near the top/bottom edge of <main> scrolls it, faster the closer
 * to the edge.
 */

const EDGE = 90
const MAX_SPEED = 16

let active = false
let raf = 0
let pointerY = Number.NaN

const trackMouse = (e: MouseEvent) => (pointerY = e.clientY)
const trackTouch = (e: TouchEvent) => (pointerY = e.touches[0]?.clientY ?? pointerY)

const step = () => {
  if (!active) return
  const scroller = document.querySelector('main')
  if (scroller && !Number.isNaN(pointerY)) {
    const rect = scroller.getBoundingClientRect()
    if (pointerY < rect.top + EDGE) {
      const intensity = Math.min(1, (rect.top + EDGE - pointerY) / EDGE)
      scroller.scrollTop -= MAX_SPEED * intensity
    } else if (pointerY > rect.bottom - EDGE) {
      const intensity = Math.min(1, (pointerY - (rect.bottom - EDGE)) / EDGE)
      scroller.scrollTop += MAX_SPEED * intensity
    }
  }
  raf = requestAnimationFrame(step)
}

export const startAutoScroll = () => {
  if (active) return
  active = true
  pointerY = Number.NaN
  window.addEventListener('mousemove', trackMouse, true)
  window.addEventListener('touchmove', trackTouch, true)
  // dnd can end without a finalize (e.g. Escape cancels) — stop on release too
  window.addEventListener('mouseup', stopAutoScroll, true)
  window.addEventListener('touchend', stopAutoScroll, true)
  raf = requestAnimationFrame(step)
}

export const stopAutoScroll = () => {
  if (!active) return
  active = false
  cancelAnimationFrame(raf)
  window.removeEventListener('mousemove', trackMouse, true)
  window.removeEventListener('touchmove', trackTouch, true)
  window.removeEventListener('mouseup', stopAutoScroll, true)
  window.removeEventListener('touchend', stopAutoScroll, true)
}
