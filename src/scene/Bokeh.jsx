import { usePointField } from './Particles'
import { bokeh } from '../config'

const stillDrift = { ...bokeh.drift, speed: 0 }

// Sparse, large, out-of-focus motes hugging the camera path: they sell the depth of the dust field.
export default function Bokeh({ count = bokeh.count.desktop, still = false }) {
  const { geometry, material } = usePointField({ ...bokeh, count, seed: 31, drift: still ? stillDrift : bokeh.drift })
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
}
