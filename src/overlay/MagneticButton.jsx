import { useRef } from 'react'
import { useSpring, animated } from '@react-spring/web'

// The button leans toward the cursor and its label leans further, then springs home on leave.
export default function MagneticButton({ id, href, children, strength = 0.35 }) {
  const el = useRef()
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0, config: { mass: 1, tension: 220, friction: 16 } }))

  const onMove = (e) => {
    const r = el.current.getBoundingClientRect()
    api.start({ x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength })
  }
  const reset = () => api.start({ x: 0, y: 0 })

  return (
    // a padded hit area so the pull starts before the pointer touches the button
    <div className="pointer-events-auto -m-8 p-8" onPointerMove={onMove} onPointerLeave={reset}>
      <animated.a
        ref={el}
        id={id}
        href={href}
        style={{ x, y }}
        className="group relative inline-flex items-center gap-3 rounded-full border border-chrome/25 bg-chrome/5 px-8 py-4 font-display text-sm uppercase tracking-[0.25em] text-chrome backdrop-blur-md transition-colors hover:border-violet hover:bg-violet/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ice"
      >
        <animated.span style={{ x: x.to((v) => v * 0.4), y: y.to((v) => v * 0.4) }} className="relative">
          {children}
        </animated.span>
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-magenta shadow-[0_0_12px_3px] shadow-magenta transition-transform group-hover:scale-150" />
      </animated.a>
    </div>
  )
}
