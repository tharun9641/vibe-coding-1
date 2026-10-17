import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { progress } from '../hooks/useScrollProgress'
import { scenes, sceneIndexAt } from '../config'

const pad = (n) => String(n).padStart(2, '0')

// Fixed corner HUD: "02 / 06", the shot name, a thin progress line with a tick per shot.
// Writes straight to the DOM on the GSAP ticker so it never re-renders React.
// Dev only: press "D" for raw/damped progress readouts.
export default function ProgressHUD({ visible }) {
  const bar = useRef()
  const counter = useRef()
  const name = useRef()
  const debug = useRef()
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const onKey = (e) => e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey && setShowDebug((v) => !v)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    let last = -1
    const update = () => {
      const p = progress.value
      const i = sceneIndexAt(p)
      bar.current.style.transform = `scaleX(${p})`
      if (i !== last) {
        last = i
        counter.current.textContent = `${pad(i + 1)} / ${pad(scenes.length)}`
        name.current.textContent = scenes[i].name
      }
      if (debug.current) debug.current.textContent = `raw ${progress.raw.toFixed(3)} · damped ${p.toFixed(3)} · vel ${progress.velocity.toFixed(2)}`
    }
    gsap.ticker.add(update)
    return () => gsap.ticker.remove(update)
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed bottom-6 left-6 z-20 flex flex-col gap-3 transition-opacity duration-1000 sm:bottom-8 sm:left-8 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {showDebug && <span ref={debug} className="font-mono text-[11px] text-ice/50" />}
      <div className="flex items-baseline gap-3 text-[11px] uppercase tracking-[0.3em]">
        <span ref={counter} className="tabular-nums text-chrome/90" />
        <span ref={name} className="text-ice/50" />
      </div>
      <span className="relative block h-px w-40 bg-chrome/15">
        <span ref={bar} className="absolute inset-0 origin-left bg-gradient-to-r from-violet to-magenta" style={{ transform: 'scaleX(0)' }} />
        {scenes.slice(1).map((s) => (
          <span key={s.id} className="absolute -top-[3px] h-[7px] w-px bg-chrome/25" style={{ left: `${s.start * 100}%` }} />
        ))}
      </span>
    </div>
  )
}
