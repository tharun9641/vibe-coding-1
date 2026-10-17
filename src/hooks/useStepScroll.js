import { useEffect } from 'react'
import { lenisRef, inputGate } from './useLenis'
import { progress } from './useScrollProgress'
import { stepScroll as cfg } from '../config'

const EPS = 0.004
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// The next stop strictly ahead of / behind the current scroll position (works after a scrollbar drag too).
export function nextStop(p, dir) {
  const { stops } = cfg
  if (dir > 0) return stops.find((s) => s.at > p + EPS)
  return [...stops].reverse().find((s) => s.at < p - EPS)
}

// Wheel, swipe and arrow/page keys each move exactly one stop, glide there, then hold.
// Scrollbar dragging still scrubs freely; the next gesture continues from wherever it was left.
export function useStepScroll() {
  useEffect(() => {
    let moving = false
    let holdUntil = 0
    let lastWheel = 0
    let armed = true // a gesture can trigger at most one step
    let touchDelta = 0

    const now = () => performance.now() / 1000
    const ready = () => !moving && now() >= holdUntil && lenisRef.current && !lenisRef.current.isStopped

    const goTo = (stop) => {
      const lenis = lenisRef.current
      if (!stop || !lenis) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const distance = Math.abs(stop.at - progress.raw)
      moving = true
      lenis.scrollTo(stop.at * max, {
        duration: clamp(distance * cfg.duration.perProgress, cfg.duration.min, cfg.duration.max),
        easing: easeInOutCubic,
        lock: true,
        force: true,
        onComplete: () => {
          moving = false
          holdUntil = now() + cfg.dwell
        },
      })
    }
    const step = (dir) => ready() && goTo(nextStop(progress.raw, dir))

    // Runs inside Lenis before it scrolls. Returning false makes Lenis skip the event; we also
    // cancel it so the browser doesn't scroll natively either.
    inputGate.current = ({ deltaY, event }) => {
      if (event.ctrlKey) return true // pinch-zoom stays native
      const t = now()

      if (event.type === 'wheel') {
        event.preventDefault()
        // a pause in the wheel stream ends the gesture; trackpad momentum tails never re-arm it
        if (t - lastWheel > cfg.gestureGap) armed = true
        lastWheel = t
        if (armed && Math.abs(deltaY) >= cfg.wheelThreshold && ready()) {
          armed = false
          step(Math.sign(deltaY))
        }
        return false
      }

      if (event.type === 'touchstart') {
        touchDelta = 0
        armed = true
        return false // no preventDefault: taps on the CTA must still work
      }
      if (event.type === 'touchmove') {
        if (event.cancelable) event.preventDefault()
        touchDelta += deltaY
        if (armed && Math.abs(touchDelta) >= cfg.touchThreshold && ready()) {
          armed = false
          step(Math.sign(touchDelta))
        }
        return false
      }
      return false
    }

    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest?.('input, textarea, select, button, [contenteditable]')) return
      const down = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)
      const up = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)
      const home = e.key === 'Home'
      const end = e.key === 'End'
      if (!(down || up || home || end)) return
      e.preventDefault()
      if (!ready()) return
      if (home) goTo(cfg.stops[0])
      else if (end) goTo(cfg.stops[cfg.stops.length - 1])
      else step(down ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      inputGate.current = null
      window.removeEventListener('keydown', onKey)
    }
  }, [])
}
