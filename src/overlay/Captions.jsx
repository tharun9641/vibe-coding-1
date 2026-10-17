import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gsap } from 'gsap'
import { progress } from '../hooks/useScrollProgress'
import { scenes, sceneIndexAt, copy } from '../config'
import MagneticButton from './MagneticButton'

// Every caption leaves (blur + drift up) before the next arrives (mode="wait").
const fade = {
  initial: { opacity: 0, y: 24, filter: 'blur(12px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] } },
  exit: { opacity: 0, y: -16, filter: 'blur(10px)', transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } },
}

const flyThrough = scenes.find((s) => s.id === 'fly-through')

// Re-render only when the visible caption actually changes, not every scroll frame.
function useCaptionKey() {
  const [key, setKey] = useState('cold-open')
  useEffect(() => {
    const update = () => {
      const p = progress.value
      let k = scenes[sceneIndexAt(p)].id
      if (k === 'fly-through') {
        const local = (p - flyThrough.start) / (flyThrough.end - flyThrough.start)
        k += `:${Math.min(copy['fly-through'].words.length - 1, Math.floor(local * copy['fly-through'].words.length))}`
      }
      setKey((prev) => (prev === k ? prev : k))
    }
    gsap.ticker.add(update)
    return () => gsap.ticker.remove(update)
  }, [])
  return key
}

export function Caption({ id }) {
  const [scene, word] = id.split(':')
  const c = copy[scene]
  switch (scene) {
    case 'cold-open':
      return (
        <div className="flex flex-col items-center gap-4 self-end pb-24">
          <span className="text-[11px] uppercase tracking-[0.5em] text-ice/70">{c.eyebrow}</span>
          <span className="relative h-14 w-px overflow-hidden bg-chrome/10">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-violet"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </div>
      )
    case 'reveal':
      return (
        <div className="flex max-w-3xl flex-col items-center gap-6 self-end pb-[14vh] text-center">
          <h1 className="font-display text-5xl font-bold tracking-[0.18em] text-chrome sm:text-7xl md:text-8xl">{c.title}</h1>
          <p className="max-w-md text-base text-ice/70 sm:text-lg">{c.subtitle}</p>
        </div>
      )
    case 'fly-through':
      return (
        <p className="font-display text-5xl font-light tracking-[0.12em] text-chrome sm:text-7xl md:text-8xl">
          {word === 'all' ? c.words.join(' ') : c.words[Number(word)]}
        </p>
      )
    case 'orbit':
      return (
        <div className="grid w-full max-w-5xl gap-10 self-end pb-[12vh] md:grid-cols-2 md:items-end">
          <p className="max-w-sm text-lg leading-relaxed text-chrome/85">{c.paragraph}</p>
          <dl className="grid grid-cols-3 gap-x-10 gap-y-6 md:justify-self-end">
            {c.stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <dt className="order-2 text-[11px] uppercase tracking-[0.25em] text-ice/60">{s.label}</dt>
                <dd className="font-display text-3xl font-medium text-chrome sm:text-4xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
    case 'finale':
      return (
        <div className="flex flex-col items-center gap-10 self-end pb-[12vh] text-center">
          <h2 className="max-w-3xl font-display text-4xl font-medium tracking-[0.08em] text-chrome sm:text-6xl">{c.title}</h2>
          <MagneticButton id="cta" href={c.href}>{c.cta}</MagneticButton>
        </div>
      )
    default:
      return null // the glow shot is a purely visual beat
  }
}

export default function Captions() {
  const key = useCaptionKey()
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex px-6 [text-shadow:0_2px_28px_rgba(5,3,10,0.9),0_0_2px_rgba(5,3,10,0.6)] sm:px-12">
      <AnimatePresence mode="wait">
        {copy[key.split(':')[0]] && (
          <motion.div key={key} {...fade} className="flex w-full items-center justify-center">
            <Caption id={key} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
