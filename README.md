# Chrome Nebula

A full-screen, scroll-driven 3D showreel. A polished chrome star turns in the dark, lit violet and magenta, inside thousands of drifting particles. Scrolling scrubs the camera through six continuous shots, and scrolling back up rewinds them. Everything renders live in the browser; there is no video file.

**Stack:** React + Vite · Three.js via @react-three/fiber and drei · @react-three/postprocessing · GSAP ScrollTrigger + Lenis · Framer Motion · react-spring · Tailwind CSS.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve dist/ locally
```

## Navigating

Scrolling moves **one portion at a time**. Each wheel flick, swipe, arrow key, Page key or Space glides the camera to the next stop and holds it there until the viewer scrolls again. Home and End jump to the first and last stop. A short pause after arriving and gesture detection stop a fast flick or trackpad momentum from skipping portions. Dragging the scrollbar still scrubs freely. The stops, glide times and the hold are set in `stepScroll` in `config.js`.

## Retune the film

Every tunable value lives in [`src/config.js`](src/config.js); components only read it.

| What | Where in `config.js` |
|---|---|
| Colours | `palette` (also feeds Tailwind) |
| Page length per device | `pageHeight` |
| Shot ranges | `scenes` |
| Camera path, look-at, lens, depth of field, glow, swirl per beat | `camera.keyframes` |
| Star shape, finish, spin | `star` |
| Studio reflections (Lightformer panels) | `studio`, `studioAmbient` |
| Lights, glow, post effects | `lights`, `glow`, `effects` |
| Particle / bokeh counts per tier, drift, streaks | `particles`, `bokeh` |
| Captions and CTA | `copy` |
| Quality ladder | `quality` |
| Scroll stops, glide time, hold | `stepScroll` |

### Dev helpers

These only run in `npm run dev`:

- **P** draws the camera path (violet), the look-at path (dashed ice) and the keyframe markers.
- **D** shows raw and damped scroll progress in the HUD.
- **`/?reduced`** forces the reduced-motion page, **`/?nowebgl`** forces the poster fallback, and **`/?tier=mobile`** forces the mobile tier.
- **`/?poster`** re-renders the hero frame and saves it to `public/poster.webp`, which is both the no-WebGL fallback and the share image. Set the browser window to 1200×630 first so the image is the right shape for social cards. The tab title changes to "poster saved" when the file is written.

## How it adapts

- **Quality ladder:** `PerformanceMonitor` steps down one rung each time the frame rate stays low. It lowers the pixel ratio to 1.5, then halves the particles, then turns off depth of field, and it never steps back up. Fast scrolling also drops resolution for a moment, because nobody can see detail inside a streak.
- **Mobile tier:** used for narrow screens or 4 or fewer CPU cores. It gets about 4,000 particles, no depth of field, half-resolution bloom and a 500vh page.
- **Reduced motion:** there is no scroll-driven camera. The star turns slowly in one fixed hero frame, and the captions become normal stacked sections with simple fades.
- **No WebGL:** the same sections are shown over `public/poster.webp`.
- **Hidden tab:** rendering stops completely.

## Accessibility and SEO

- All text is real HTML, and the canvas is `aria-hidden`.
- A **Skip intro** link appears on the first Tab press. It plays the film to the end quickly instead of cutting, then focuses the CTA.
- The CTA is a keyboard-focusable link with a visible focus ring.
- `index.html` has the title, description, Open Graph and Twitter tags. **Before you deploy, change `og:image` and `twitter:image` to absolute URLs** (for example `https://your-domain.com/poster.webp`), because most social crawlers ignore relative image paths.

## Deploy

It's a static site: the build command is `npm run build` and the output folder is `dist`.

**Vercel**

```bash
npm i -g vercel
vercel          # first deploy creates the project; it detects Vite automatically
vercel --prod
```

Or import the Git repository at vercel.com/new. The framework preset is Vite, the build command is `npm run build` and the output directory is `dist`.

**Netlify**

```bash
npm i -g netlify-cli
netlify deploy --build            # preview URL
netlify deploy --build --prod
```

Or connect the repository in the Netlify UI with the build command `npm run build` and the publish directory `dist`.

## Project layout

```
src/
  App.jsx              Mode switch (film / reduced motion / no WebGL), canvas, skip link
  config.js            All tuning values and copy
  hooks/               Lenis, shared scroll progress, device tier, reduced motion
  scene/               Star, studio environment, glow, particles + shaders, bokeh, camera rig, effects
  overlay/             Loader, captions, progress HUD, magnetic CTA, static page
public/poster.webp     Fallback frame and share image
```
