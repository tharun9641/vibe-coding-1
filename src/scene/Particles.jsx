import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import vertexShader from './shaders/particles.vert.glsl?raw'
import fragmentShader from './shaders/particles.frag.glsl?raw'
import { palette, particles } from '../config'
import { rig } from './CameraRig'

// Points spread along a tube on Z, plus an optional cloud packed around the star at the origin.
function makeField({ count, tube, cluster = 0, clusterRadius = 0, seed = 1 }) {
  let s = seed
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646 // deterministic, so reloads look identical
  const position = new Float32Array(count * 3)
  const aRand = new Float32Array(count)
  const aScale = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2
    let x, y, z
    if (rand() < cluster) {
      // denser toward the centre: radius ∝ u^1.6
      const r = clusterRadius * Math.pow(rand(), 1.6)
      const phi = Math.acos(2 * rand() - 1)
      x = r * Math.sin(phi) * Math.cos(a)
      y = r * Math.sin(phi) * Math.sin(a)
      z = r * Math.cos(phi)
    } else {
      const r = tube.radius * Math.sqrt(rand())
      x = Math.cos(a) * r
      y = Math.sin(a) * r
      z = tube.zCenter + (rand() - 0.5) * tube.length
    }
    position.set([x, y, z], i * 3)
    aRand[i] = rand()
    aScale[i] = 0.4 + Math.pow(rand(), 3) * 1.6 // mostly fine dust, a few larger motes
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geo.setAttribute('aRand', new THREE.BufferAttribute(aRand, 1))
  geo.setAttribute('aScale', new THREE.BufferAttribute(aScale, 1))
  return geo
}

// Shared by the dust field and the bokeh layer: same shader, different uniforms.
export function usePointField({ count, tube, cluster, clusterRadius, seed, size, intensity, softness = 0, drift, nearBoost = 0, streak }) {
  const geometry = useMemo(() => makeField({ count, tube, cluster, clusterRadius, seed }), [count, tube, cluster, clusterRadius, seed])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uPixelRatio: { value: 1 },
          uFreq: { value: drift.frequency },
          uSpeed: { value: drift.speed },
          uAmp: { value: drift.amplitude },
          uVelocity: { value: new THREE.Vector3() },
          uStreakGain: { value: streak.gain },
          uStreakMax: { value: streak.max },
          uNearBoost: { value: nearBoost },
          uSwirl: { value: 0 },
          uIce: { value: new THREE.Color(palette.ice) },
          uViolet: { value: new THREE.Color(palette.violet) },
          uMagenta: { value: new THREE.Color(palette.magenta) },
          uIntensity: { value: intensity },
          uSoftness: { value: softness },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [size, intensity, softness, drift, nearBoost, streak],
  )

  const camera = useThree((s) => s.camera)
  const last = useRef(null)
  const worldVel = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const invQ = useMemo(() => new THREE.Quaternion(), [])

  useFrame(({ clock, gl }, delta) => {
    const u = material.uniforms
    u.uTime.value = clock.elapsedTime
    u.uPixelRatio.value = gl.getPixelRatio()
    u.uSwirl.value += rig.swirl * delta

    // camera velocity, smoothed so a single jerky frame doesn't flash streaks
    if (last.current && delta > 0) {
      tmp.copy(camera.position).sub(last.current).divideScalar(delta)
      worldVel.lerp(tmp, 1 - Math.exp(-delta * 10))
    } else last.current = new THREE.Vector3()
    last.current.copy(camera.position)
    u.uVelocity.value.copy(worldVel).applyQuaternion(invQ.copy(camera.quaternion).invert())
  })

  return { geometry, material }
}

// reduced motion: the dust holds still instead of flowing
const stillDrift = { ...particles.drift, speed: 0 }

export default function Particles({ count = particles.count.desktop, still = false }) {
  const { geometry, material } = usePointField({
    count,
    tube: particles.tube,
    cluster: particles.starCluster,
    clusterRadius: particles.clusterRadius,
    seed: 7,
    size: particles.size,
    intensity: particles.intensity,
    drift: still ? stillDrift : particles.drift,
    nearBoost: particles.nearStarBoost,
    streak: particles.streak,
  })
  return <points geometry={geometry} material={material} frustumCulled={false} />
}
