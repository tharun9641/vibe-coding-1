import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import { lenisRef } from '../hooks/useLenis'
import { rig } from '../scene/CameraRig'
import { loader } from '../config'

// Inside <Canvas>: compile every material up front so the first scroll never stutters.
export function ShaderWarmup({ onDone }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    let alive = true
    // wait one frame so every component has mounted its materials
    requestAnimationFrame(() =>
      gl
        .compileAsync(scene, camera)
        .catch(() => gl.compile(scene, camera))
        .then(() => alive && onDone()),
    )
    return () => (alive = false)
  }, [gl, scene, camera, onDone])
  return null
}

const fonts = () =>
  Promise.all(['500 1em Unbounded', '700 1em Unbounded', '400 1em Manrope'].map((f) => document.fonts.load(f))).then(
    () => document.fonts.ready,
  )

// Black screen, a thin violet line filling to 100%. On completion the line collapses into a point of
// light at the centre of the frame, which fades exactly as the 3D glow blooms up behind it.
export default function Loader({ compiled, onDone }) {
  const root = useRef()
  const line = useRef()
  const pct = useRef()
  const dot = useRef()
  const shown = useRef({ v: 0 })
  const stages = useRef({ fonts: false, compiled: false })
  stages.current.compiled = compiled

  // scrolling is held by Lenis (created stopped in Film) until the handoff below starts it
  useEffect(() => {
    fonts().then(() => (stages.current.fonts = true))
  }, [])

  useEffect(() => {
    const start = performance.now() // runs once: stage flags are read from the ref, so the timer never resets
    const render = () => {
      line.current.style.transform = `scaleX(${shown.current.v / 100})`
      pct.current.textContent = `${Math.round(shown.current.v)}%`
    }
    let finished = false
    const tick = () => {
      // real stages set the ceiling; the display eases toward it
      const target = (stages.current.fonts ? 50 : 20) + (stages.current.compiled ? 50 : 0)
      const elapsed = (performance.now() - start) / 1000
      const cap = Math.min(target, (elapsed / loader.minDuration) * 100)
      shown.current.v += (cap - shown.current.v) * 0.12
      render()
      if (!finished && cap >= 100 && shown.current.v > 99.5) {
        finished = true
        shown.current.v = 100
        render()
        handoff()
      }
    }
    const handoff = () => {
      gsap.ticker.remove(tick)
      gsap
        .timeline({
          onComplete: () => {
            lenisRef.current?.start()
            onDone()
          },
        })
        .to(pct.current, { opacity: 0, y: 6, duration: 0.35, ease: 'power2.in' })
        .to(line.current, { scaleX: 0, duration: 0.55, ease: 'expo.in' }, '<')
        .fromTo(dot.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(3)' }, '-=0.1')
        .add('bloom')
        .to(rig, { intro: 1, duration: loader.introDuration, ease: 'power2.out' }, 'bloom')
        .to(dot.current, { scale: 3, opacity: 0, duration: 0.9, ease: 'power2.out' }, 'bloom')
        .to(root.current, { backgroundColor: 'rgba(5,3,10,0)', duration: 0.9, ease: 'power1.out' }, 'bloom')
        .set(root.current, { display: 'none' })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [onDone])

  return (
    <div ref={root} className="fixed inset-0 z-50 grid place-items-center bg-void" role="status" aria-live="polite">
      <div className="flex w-56 flex-col items-center gap-4">
        <span className="relative block h-px w-full bg-chrome/10">
          <span ref={line} className="absolute inset-0 origin-center bg-violet shadow-[0_0_12px_2px] shadow-violet" style={{ transform: 'scaleX(0)' }} />
          <span
            ref={dot}
            className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-white opacity-0 shadow-[0_0_24px_10px] shadow-violet"
          />
        </span>
        <span ref={pct} className="font-sans text-[11px] tabular-nums tracking-[0.3em] text-ice/60">
          0%
        </span>
        <span className="sr-only">Loading the experience</span>
      </div>
    </div>
  )
}
