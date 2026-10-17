import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// The live Lenis instance, so the loader can hold scrolling until the scene is ready.
export const lenisRef = { current: null }

// Optional hook that sees every wheel/touch event before Lenis does (used by step scrolling).
// Return false to swallow the event.
export const inputGate = { current: null }

// Lenis drives the scroll; GSAP's ticker drives Lenis so ScrollTrigger and Lenis share one clock.
// startStopped: hold scrolling until someone calls lenisRef.current.start() (the loader does).
export function useLenis({ enabled = true, startStopped = false } = {}) {
  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      virtualScroll: (data) => (inputGate.current ? inputGate.current(data) : true),
    })
    lenisRef.current = lenis
    lenis.scrollTo(0, { immediate: true, force: true })
    if (startStopped) lenis.stop()
    const tick = (t) => lenis.raf(t * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [enabled, startStopped])
}
