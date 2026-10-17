import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, DepthOfField, Bloom, ToneMapping, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { effects, camera } from '../config'
import { rig } from './CameraRig'

export default function Effects({ dof: dofOn = true, bloomScale = 1 }) {
  const caOffset = useMemo(() => new THREE.Vector2(effects.chromaticAberration.offset, effects.chromaticAberration.offset), [])
  const dof = useRef()
  // focus follows the rig's look target; blur amount is keyed per shot
  useFrame(() => {
    if (!dof.current) return
    dof.current.target.copy(rig.target)
    dof.current.bokehScale = rig.bokeh
  })
  return (
    <EffectComposer multisampling={4}>
      {dofOn && <DepthOfField ref={dof} target={[0, 0, 0]} focusRange={camera.focusRange} bokehScale={0} />}
      <Bloom mipmapBlur resolutionScale={bloomScale} {...effects.bloom} />
      {/* EffectComposer disables the renderer's tone mapping; without this HDR highlights hard-clip into coloured specks */}
      <ToneMapping mode={ToneMappingMode[effects.toneMapping]} />
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={effects.chromaticAberration.modulationOffset} />
      {/* no premultiply: it scales per-channel noise by HDR highlights and tints them green/yellow */}
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={effects.noise.opacity} />
      <Vignette {...effects.vignette} />
    </EffectComposer>
  )
}
