import { useState } from 'react'

// Decided once at load: re-tiering on resize would rebuild the particle buffers mid-film.
export function detectTier() {
  // dev QA switch: /?tier=mobile or /?tier=desktop
  const forced = import.meta.env.DEV && new URLSearchParams(location.search).get('tier')
  if (forced === 'mobile' || forced === 'desktop') return forced
  const narrow = window.matchMedia('(max-width: 767px)').matches
  const weakCpu = (navigator.hardwareConcurrency || 8) <= 4
  return narrow || weakCpu ? 'mobile' : 'desktop'
}

export function useDeviceTier() {
  const [tier] = useState(detectTier)
  return tier
}
