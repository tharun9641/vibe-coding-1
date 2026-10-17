import { useEffect, useState } from 'react'

const query = '(prefers-reduced-motion: reduce)'
// dev QA switch: /?reduced forces the reduced-motion page
const forced = import.meta.env.DEV && new URLSearchParams(location.search).has('reduced')

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => forced || window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setReduced(forced || mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
