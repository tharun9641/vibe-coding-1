import { motion } from 'framer-motion'
import { Caption } from './Captions'

const sections = ['reveal', 'fly-through:all', 'orbit', 'finale']

// Reduced motion and no-WebGL: the same copy as plain stacked sections over a fixed backdrop,
// with simple opacity fades (no blur, no movement).
export default function StaticPage({ background }) {
  return (
    <>
      <div className="fixed inset-0" aria-hidden="true">
        {background}
      </div>
      <main className="relative z-10 [text-shadow:0_2px_28px_rgba(5,3,10,0.9)]">
        {sections.map((id) => (
          <motion.section
            key={id}
            id={id.split(':')[0]}
            className="flex min-h-screen items-center justify-center px-6 sm:px-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ duration: 0.8 }}
          >
            <Caption id={id} />
          </motion.section>
        ))}
      </main>
    </>
  )
}
