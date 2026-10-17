import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { palette, lights, particles, bokeh, quality, effects } from '../config'
import ChromeStar from './ChromeStar'
import StudioEnvironment from './StudioEnvironment'
import Glow from './Glow'
import Particles from './Particles'
import Bokeh from './Bokeh'
import Effects from './Effects'
import CameraRig, { StaticRig } from './CameraRig'

// mode "film": the scroll-driven showreel. mode "static": one slowly turning hero frame (reduced motion).
export default function Experience({ tier = 'desktop', mode = 'film' }) {
  const [level, setLevel] = useState(0)
  const rung = quality.ladder[level]
  const setDpr = useThree((s) => s.setDpr)
  const regress = useThree((s) => s.performance.current) // < 1 briefly while the camera races (CameraRig calls regress())

  // Same idea as drei's <AdaptiveDpr>, but scaled from the ladder's ceiling: AdaptiveDpr restores the
  // canvas's original DPR after every regress, which would silently undo a stepped-down rung.
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, quality.maxDpr[tier], rung.dpr ?? Infinity) * regress)
  }, [setDpr, tier, rung, regress])

  const isFilm = mode === 'film'
  const scale = rung.particleScale ?? 1
  const dof = tier === 'desktop' && rung.dof !== false && isFilm

  return (
    <>
      {/* step down one rung per sustained frame-rate drop; never step back up, to avoid see-sawing */}
      <PerformanceMonitor onDecline={() => setLevel((l) => Math.min(l + 1, quality.ladder.length - 1))} />

      <color attach="background" args={[palette.void]} />
      <StudioEnvironment />

      <spotLight {...lights.key} decay={2} />
      <pointLight {...lights.rim} decay={2} />
      <ambientLight {...lights.fill} />

      <Glow />
      <ChromeStar interactive={isFilm} />
      <Particles count={Math.round(particles.count[tier] * scale)} still={!isFilm} />
      <Bokeh count={bokeh.count[tier]} still={!isFilm} />
      {isFilm ? <CameraRig /> : <StaticRig />}
      <Effects dof={dof} bloomScale={tier === 'mobile' ? effects.mobileBloomResolution : 1} />
    </>
  )
}
