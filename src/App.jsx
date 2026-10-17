import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Experience from './scene/Experience'
import { rig } from './scene/CameraRig'
import Loader, { ShaderWarmup } from './overlay/Loader'
import Captions from './overlay/Captions'
import ProgressHUD from './overlay/ProgressHUD'
import StaticPage from './overlay/StaticPage'
import { useLenis, lenisRef } from './hooks/useLenis'
import { useScrollProgress } from './hooks/useScrollProgress'
import { useStepScroll } from './hooks/useStepScroll'
import { useDeviceTier } from './hooks/useDeviceTier'
import { useReducedMotion } from './hooks/useReducedMotion'
import { pageHeight, scenes, quality } from './config'

const hasWebGL = (() => {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('nowebgl')) return false // dev QA switch
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
})()

// Dev only: /?poster renders the static hero frame and saves it to public/poster.webp (see vite.config.js).
const posterMode = import.meta.env.DEV && new URLSearchParams(location.search).has('poster')

// Stop rendering entirely while the tab is hidden.
function usePageVisible() {
  const [visible, setVisible] = useState(!document.hidden)
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visible
}

function Scene({ tier, mode, onCompiled, preserve = false }) {
  const visible = usePageVisible()
  return (
    <Canvas
      aria-hidden="true"
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, quality.maxDpr[tier]]}
      performance={{ min: 0.5 }}
      camera={{ position: [0, 0, 12], fov: 35 }}
      gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: preserve }}
    >
      <Experience tier={tier} mode={mode} />
      {onCompiled && <ShaderWarmup onDone={onCompiled} />}
    </Canvas>
  )
}

function SkipLink({ onClick, href = '#finale' }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-chrome px-5 py-2 text-sm font-medium text-void transition-transform focus:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice"
    >
      Skip intro
    </a>
  )
}

function Film({ tier }) {
  const track = useRef()
  const [compiled, setCompiled] = useState(false)
  const [ready, setReady] = useState(false)
  const onCompiled = useCallback(() => setCompiled(true), [])
  const onLoaded = useCallback(() => setReady(true), [])
  useLenis({ startStopped: true })
  useScrollProgress(track)
  useStepScroll()

  // "Skip" still plays the film, just fast: a hard jump would cut, and the brief says never cut.
  const skip = (e) => {
    e.preventDefault()
    lenisRef.current?.scrollTo(document.documentElement.scrollHeight, {
      duration: 2.4,
      // the finale caption mounts after the previous one exits, so give it a beat before focusing
      onComplete: () => setTimeout(() => document.getElementById('cta')?.focus(), 900),
    })
  }

  return (
    <>
      <SkipLink onClick={skip} />
      <div className="fixed inset-0">
        <Scene tier={tier} mode="film" onCompiled={onCompiled} />
      </div>

      {/* Empty scroll track: one section per shot, sized by its share of the film. */}
      <main ref={track} className="relative z-0" style={{ height: `${pageHeight[tier]}vh` }}>
        {scenes.map((s) => (
          <section key={s.id} id={s.id} aria-label={s.name} style={{ height: `${(s.end - s.start) * 100}%` }} />
        ))}
      </main>

      {ready && <Captions />}
      <ProgressHUD visible={ready} />
      <Loader compiled={compiled} onDone={onLoaded} />
    </>
  )
}

function PosterCapture({ tier }) {
  const onCompiled = useCallback(() => {
    rig.intro = 1
    // let bloom, the glow pulse and the star settle before grabbing the frame
    setTimeout(() => {
      document.querySelector('canvas').toBlob(
        (blob) =>
          fetch('/__poster', { method: 'POST', body: blob }).then((r) => {
            document.title = r.ok ? 'poster saved' : 'poster failed'
            // drop ?poster so a later reload (e.g. a dev-server restart) can't silently overwrite the file
            history.replaceState(null, '', '/')
          }),
        'image/webp',
        0.9,
      )
    }, 2500)
  }, [])
  return (
    <div className="fixed inset-0">
      <Scene tier={tier} mode="static" onCompiled={onCompiled} preserve />
    </div>
  )
}

export default function App() {
  const tier = useDeviceTier()
  const reduced = useReducedMotion()

  if (posterMode) return <PosterCapture tier={tier} />

  if (!hasWebGL)
    return (
      <>
        <SkipLink />
        <StaticPage background={<img src="/poster.webp" alt="" className="h-full w-full object-cover" />} />
      </>
    )

  if (reduced) {
    rig.intro = 1 // no loader handoff: the glow is simply on
    return (
      <>
        <SkipLink />
        <StaticPage background={<Scene tier={tier} mode="static" />} />
      </>
    )
  }

  return <Film tier={tier} />
}
