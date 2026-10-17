import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { camera as cfg, quality } from '../config'
import { progress } from '../hooks/useScrollProgress'

const keys = cfg.keyframes
const v3 = (a) => new THREE.Vector3(...a)

// Live rig output that other scene pieces read every frame (glow, DOF, particle swirl).
// `intro` (0→1) is tweened by the loader so the glow blooms up as its point of light fades.
export const rig = { target: new THREE.Vector3(), bokeh: 0, glow: 0, swirl: 0, intro: 0 }

// progress → curve t, so each keyframe lands exactly on its `at` regardless of segment length
function locate(p) {
  let i = 0
  while (i < keys.length - 2 && p > keys[i + 1].at) i++
  const a = keys[i], b = keys[i + 1]
  const local = THREE.MathUtils.clamp((p - a.at) / (b.at - a.at), 0, 1)
  return { i, local, t: (i + local) / (keys.length - 1) }
}

const scalar = (name, { i, local }) =>
  THREE.MathUtils.lerp(keys[i][name], keys[i + 1][name], THREE.MathUtils.smootherstep(local, 0, 1))

export default function CameraRig() {
  const path = useMemo(() => new THREE.CatmullRomCurve3(keys.map((k) => v3(k.position)), false, 'centripetal'), [])
  const look = useMemo(() => new THREE.CatmullRomCurve3(keys.map((k) => v3(k.target)), false, 'centripetal'), [])
  const pos = useMemo(() => new THREE.Vector3(), [])
  const tgt = useMemo(() => new THREE.Vector3(), [])
  const base = useMemo(() => new THREE.Vector3(), []) // damped path position, before handheld drift
  const started = useRef(false)

  useFrame(({ camera, clock, performance }, delta) => {
    // while the camera races, let AdaptiveDpr drop resolution for a moment; nobody sees detail in a streak
    if (Math.abs(progress.velocity) > quality.fastScroll) performance.regress()

    const at = locate(progress.value)
    path.getPoint(at.t, pos)
    look.getPoint(at.t, tgt)

    // frame-rate independent damping toward the path
    const k = started.current ? 1 - Math.pow(1 - cfg.damping, delta * 60) : 1 // snap on the first frame
    started.current = true
    base.lerp(pos, k)
    rig.target.lerp(tgt, k)

    // handheld: a few incommensurate sines read as organic drift
    const t = clock.elapsedTime * cfg.handheld.speed
    const h = cfg.handheld.position
    camera.position.set(
      base.x + (Math.sin(t * 1.3) + Math.sin(t * 2.9) * 0.4) * h,
      base.y + (Math.sin(t * 1.7 + 1.1) + Math.sin(t * 3.7) * 0.3) * h,
      base.z,
    )
    camera.lookAt(rig.target)
    camera.rotation.z += Math.sin(t * 1.1 + 2.0) * cfg.handheld.rotation

    const fov = scalar('fov', at)
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    rig.bokeh = scalar('bokeh', at)
    rig.glow = scalar('glow', at) * rig.intro
    rig.swirl = scalar('swirl', at)
  })

  return import.meta.env.DEV ? <PathDebug path={path} look={look} /> : null
}

// Reduced motion / poster: one fixed hero frame (the end of the reveal), no scroll-driven camera.
export function StaticRig({ keyframe = 2 }) {
  const k = keys[keyframe]
  useFrame(({ camera }) => {
    camera.position.set(...k.position)
    rig.target.set(...k.target)
    camera.lookAt(rig.target)
    if (camera.fov !== k.fov) {
      camera.fov = k.fov
      camera.updateProjectionMatrix()
    }
    Object.assign(rig, { bokeh: 0, glow: k.glow * rig.intro, swirl: 0 })
  })
  return null
}

// Dev only: press "P" to draw the camera path (violet), the look-at path (ice) and keyframe markers.
function PathDebug({ path, look }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const onKey = (e) => e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && setOn((v) => !v)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const pts = useMemo(() => path.getPoints(300), [path])
  const lookPts = useMemo(() => look.getPoints(300), [look])
  if (!on) return null
  return (
    <group>
      <Line points={pts} color="#7b3cff" lineWidth={2} />
      <Line points={lookPts} color="#b9c7ff" lineWidth={1} dashed dashSize={0.3} gapSize={0.2} />
      {keys.map((k) => (
        <mesh key={k.at} position={k.position}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#d23cff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
