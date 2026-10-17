import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { glow } from '../config'
import { rig } from './CameraRig'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Soft radial falloff with a hotter core. `uStretch` squashes it into a horizontal flare.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float halo = pow(clamp(1.0 - d, 0.0, 1.0), 3.4);
    float core = pow(clamp(1.0 - d * 2.2, 0.0, 1.0), 3.0);
    vec3 col = uColor * halo + uCore * core * 1.6;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`

function makeMaterial(color, core, intensity) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uCore: { value: new THREE.Color(core) },
      uIntensity: { value: intensity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}

// Camera-facing glow behind the star, plus a thin anamorphic streak through it.
export default function Glow() {
  const halo = useMemo(() => makeMaterial(glow.color, glow.coreColor, glow.intensity), [])
  const streak = useMemo(() => makeMaterial(glow.coreColor, '#ffffff', glow.streak.intensity), [])

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * glow.pulseSpeed) * glow.pulseAmount
    halo.uniforms.uIntensity.value = glow.intensity * pulse * rig.glow
    streak.uniforms.uIntensity.value = glow.streak.intensity * pulse * rig.glow
  })

  return (
    <Billboard position={[0, 0, glow.z]}>
      <mesh material={halo} renderOrder={-1}>
        <planeGeometry args={[glow.size, glow.size]} />
      </mesh>
      <mesh material={streak} renderOrder={-1}>
        <planeGeometry args={[glow.streak.length, glow.streak.height * glow.size]} />
      </mesh>
    </Billboard>
  )
}
