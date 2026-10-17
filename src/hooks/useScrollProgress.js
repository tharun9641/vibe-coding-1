import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { progressDamping } from '../config'

// One shared, mutable progress store. The 3D scene reads it every frame without React re-renders.
export const progress = { raw: 0, value: 0, velocity: 0 }

// GSAP owns scroll → progress. `value` is the damped 0–1 the whole film reads.
export function useScrollProgress(triggerRef) {
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => (progress.raw = self.progress),
    })
    progress.raw = st.progress

    const damp = (_, deltaMs) => {
      // frame-rate independent lerp, tuned per 60fps frame
      const k = 1 - Math.pow(1 - progressDamping, deltaMs / (1000 / 60))
      const prev = progress.value
      progress.value += (progress.raw - progress.value) * k
      progress.velocity = (progress.value - prev) / Math.max(deltaMs, 1) * 1000
    }
    gsap.ticker.add(damp)
    return () => {
      gsap.ticker.remove(damp)
      st.kill()
    }
  }, [triggerRef])
}
