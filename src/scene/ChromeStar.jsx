import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { useSpring, animated } from '@react-spring/three'
import { star, palette, scenes } from '../config'
import { progress } from '../hooks/useScrollProgress'

// A sphere reshaped into an N-point star with concave edges: a smooth pillow-lens with a knife-sharp rim.
// Every point of the surface is curved, so the studio panels sweep across it like real polished metal.
function makeStarGeometry({ points, radius, thickness, pinch, puff }) {
  let geo = new THREE.SphereGeometry(1, 320, 160)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    // sphere poles are on Y; flatten along Y into the star's thickness
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const theta = Math.atan2(z, x)
    const rho = Math.hypot(x, z)
    const k = (points * theta) / 4
    // generalised astroid: pinch < 1 pulls the edges in between tips
    const outline = Math.pow(Math.pow(Math.abs(Math.cos(k)), pinch) + Math.pow(Math.abs(Math.sin(k)), pinch), -1 / pinch)
    const r = rho * outline * radius
    pos.setXYZ(i, r * Math.cos(theta), r * Math.sin(theta), Math.sign(y) * Math.pow(Math.abs(y), puff) * thickness)
  }
  // weld the UV seam so normals are continuous all the way round
  geo.deleteAttribute('normal')
  geo.deleteAttribute('uv')
  geo = mergeVertices(geo, 1e-5)
  geo.computeVertexNormals()
  return geo
}

const orbit = scenes.find((s) => s.id === 'orbit')

export default function ChromeStar({ interactive = true }) {
  const geometry = useMemo(() => makeStarGeometry(star), [])
  const spinner = useRef()
  const angle = useRef(0)

  // react-spring owns the cursor tilt (outer group); useFrame owns spin + float (inner mesh).
  const [{ tilt }, api] = useSpring(() => ({ tilt: [0, 0, 0], config: { mass: 2, tension: 120, friction: 26 } }))
  useEffect(() => {
    if (!interactive) return
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      api.start({ tilt: [y * star.tilt, x * star.tilt, 0] })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [api, interactive])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const p = progress.value
    // smooth bump in spin speed through the orbit shot
    const inOrbit = THREE.MathUtils.smoothstep(p, orbit.start - 0.05, orbit.start + 0.05) * (1 - THREE.MathUtils.smoothstep(p, orbit.end - 0.05, orbit.end + 0.05))
    angle.current += delta * star.spin * (1 + star.orbitSpinBoost * inOrbit)
    spinner.current.rotation.set(Math.sin(t * 0.4) * star.wobble, angle.current, 0)
    spinner.current.position.y = Math.sin(t * 0.8) * star.float
  })

  return (
    <animated.group rotation={tilt}>
      <mesh ref={spinner} geometry={geometry}>
        <meshPhysicalMaterial
          color={palette.chrome}
          metalness={1}
          {...star.material}
          iridescenceIOR={1.4}
          iridescenceThicknessRange={[60, 260]}
        />
      </mesh>
    </animated.group>
  )
}
