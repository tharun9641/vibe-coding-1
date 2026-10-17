import { Environment, Lightformer } from '@react-three/drei'
import { studio, studioAmbient } from '../config'

// No HDRI: a hand-built studio of glowing panels. The chrome is only as good as what it reflects.
export default function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={[studioAmbient]} />
      {studio.map(({ name, ...panel }) => (
        <Lightformer key={name} {...panel} />
      ))}
    </Environment>
  )
}
