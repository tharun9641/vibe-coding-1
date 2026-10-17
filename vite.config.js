import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev only: open /?poster and the page POSTs a rendered frame here, saved as the WebGL fallback + OG image.
const posterTarget = fileURLToPath(new URL('./public/poster.webp', import.meta.url))
const MAX_POSTER_BYTES = 8 * 1024 * 1024

const savePoster = {
  name: 'save-poster',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__poster', (req, res) => {
      if (req.method !== 'POST') return res.writeHead(405).end()
      const chunks = []
      let size = 0
      req.on('data', (c) => {
        size += c.length
        if (size > MAX_POSTER_BYTES) req.destroy()
        else chunks.push(c)
      })
      req.on('end', async () => {
        const body = Buffer.concat(chunks)
        // only accept a real WebP (RIFF....WEBP) so nothing else can be written into public/
        const isWebp = body.subarray(0, 4).toString() === 'RIFF' && body.subarray(8, 12).toString() === 'WEBP'
        if (!isWebp) return res.writeHead(400).end('expected image/webp')
        await writeFile(posterTarget, body)
        res.writeHead(200).end('saved')
      })
    })
  },
}

export default defineConfig({
  plugins: [react(), savePoster],
  build: { chunkSizeWarningLimit: 1600 }, // three + postprocessing is one big, expected chunk
})
