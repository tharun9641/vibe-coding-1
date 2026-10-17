// Every tunable value for the film lives here.

export const palette = {
  void: '#05030a',
  violet: '#7b3cff',
  magenta: '#d23cff',
  ice: '#b9c7ff',
  chrome: '#e8e8f0',
}

// Page length per device tier (in vh); progress 0–1 maps across the whole page.
export const pageHeight = { desktop: 700, mobile: 500 }

// How quickly the shared progress chases the raw scroll position (per 60fps frame).
export const progressDamping = 0.08

// Shot list: [start, end) progress ranges, in order.
export const scenes = [
  { id: 'cold-open', name: 'Cold open', start: 0.0, end: 0.1 },
  { id: 'reveal', name: 'Reveal', start: 0.1, end: 0.25 },
  { id: 'fly-through', name: 'Fly-through', start: 0.25, end: 0.45 },
  { id: 'orbit', name: 'Orbit', start: 0.45, end: 0.65 },
  { id: 'glow', name: 'Through the glow', start: 0.65, end: 0.85 },
  { id: 'finale', name: 'Pull-back finale', start: 0.85, end: 1.0 },
]

export const sceneIndexAt = (p) => {
  const i = scenes.findIndex((s) => p < s.end)
  return i === -1 ? scenes.length - 1 : i
}

// ---------- Chrome star ----------
export const star = {
  points: 4,
  radius: 1.7, // tip-to-centre length
  thickness: 0.5, // half-thickness at the centre
  pinch: 0.7, // < 1 curves the edges inward; lower = skinnier tips
  puff: 0.7, // < 1 keeps the body full until close to the rim
  material: { roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.8, iridescence: 0.3 },
  spin: 0.15, // rad/s around Y
  orbitSpinBoost: 1.6, // extra spin multiplier while in the "orbit" shot
  wobble: 0.12, // X wobble amplitude (rad)
  float: 0.12, // vertical float amplitude
  tilt: 0.35, // max cursor tilt (rad)
}

// Colour of the "empty" studio walls: what the chrome reflects where no panel is. Pure black reads as glass.
export const studioAmbient = '#140a26'

// ---------- Studio environment (Lightformer panels the chrome reflects) ----------
// form: 'rect' | 'ring' | 'circle'. Each panel faces the origin (drei Lightformer target), so only position/scale matter.
export const studio = [
  { name: 'violet strip L', form: 'rect', color: palette.violet, intensity: 6, position: [-5, 1, -1], scale: [12, 0.6, 1] },
  { name: 'violet strip R', form: 'rect', color: palette.violet, intensity: 4, position: [5, -1.5, 1], scale: [12, 0.4, 1] },
  { name: 'magenta ring', form: 'ring', color: palette.magenta, intensity: 5, position: [0, 3, -6], scale: 4 },
  { name: 'white softbox', form: 'rect', color: '#ffffff', intensity: 3, position: [0, 6, 2], scale: [5, 3, 1] },
  { name: 'ice backdrop', form: 'rect', color: palette.ice, intensity: 0.6, position: [0, 0, 10], scale: [20, 10, 1] },
  { name: 'overhead softbox', form: 'rect', color: '#ffffff', intensity: 1.2, position: [0, 8, 0], scale: [14, 14, 1] },
  { name: 'floor bounce', form: 'rect', color: palette.violet, intensity: 0.22, position: [0, -8, 0], scale: [20, 20, 1] },
  // In front of the star (behind the camera): what the faces mostly see.
  { name: 'front key strip', form: 'rect', color: '#ffffff', intensity: 4, position: [-1, 3, 7], scale: [14, 0.35, 1] },
  { name: 'front violet band', form: 'rect', color: palette.violet, intensity: 3, position: [2, -2.5, 7], scale: [14, 1.2, 1] },
  { name: 'front magenta dot', form: 'circle', color: palette.magenta, intensity: 6, position: [4, 1, 6], scale: 1.2 },
]

// ---------- Lights (kept mostly dark: the studio reflections do the heavy lifting) ----------
export const lights = {
  key: { color: palette.violet, intensity: 35, position: [-4, 3, 4], angle: 0.5, penumbra: 1 },
  rim: { color: palette.magenta, intensity: 20, position: [2.5, 1.5, -3.5] },
  fill: { color: palette.ice, intensity: 0.08 },
}

// ---------- Volumetric glow behind the star ----------
export const glow = {
  color: palette.violet,
  coreColor: palette.magenta,
  size: 7,
  intensity: 0.55,
  pulseSpeed: 0.6, // rad/s
  pulseAmount: 0.18, // ± fraction of intensity
  z: -1.6, // distance behind the star
  streak: { length: 14, height: 0.1, intensity: 0.45 }, // anamorphic horizontal flare
}

// ---------- Post-processing ----------
export const effects = {
  toneMapping: 'ACES_FILMIC', // any postprocessing ToneMappingMode key, e.g. 'AGX', 'NEUTRAL'
  bloom: { intensity: 1.15, luminanceThreshold: 0.55, luminanceSmoothing: 0.35, radius: 0.78 },
  mobileBloomResolution: 0.5, // bloom render scale on the mobile tier
  chromaticAberration: { offset: 0.0016, modulationOffset: 0.55 }, // stronger toward the frame edges only
  noise: { opacity: 0.07 },
  vignette: { offset: 0.28, darkness: 0.78 },
}

// ---------- Particles ----------
// Distributed in a long tube along Z (the camera path runs through it), denser near the star.
export const particles = {
  count: { desktop: 12000, mobile: 4000 },
  tube: { length: 70, radius: 7, zCenter: -12 }, // world units
  starCluster: 0.25, // share of particles packed in a cloud around the star
  clusterRadius: 4.5,
  size: 34, // base point size (px at 1 unit away, before DPR)
  intensity: 0.7,
  drift: { frequency: 0.18, speed: 0.06, amplitude: 1.1 }, // curl-noise flow
  nearStarBoost: 2.4, // brightness multiplier close to the star
  streak: { max: 7, gain: 2.5 }, // stretch along each point's screen motion: max factor, per (view-plane unit)/s
}

export const bokeh = {
  count: { desktop: 260, mobile: 90 },
  tube: { length: 70, radius: 4, zCenter: -12 },
  size: 260,
  intensity: 0.22,
  softness: 0.85, // 0 = hard disc, 1 = fully gaussian
  drift: { frequency: 0.08, speed: 0.03, amplitude: 1.6 },
  streak: { max: 3, gain: 1.2 },
}

// ---------- Camera rig: one keyframe per beat of the shot list ----------
// `at` is scroll progress. Positions/targets form two CatmullRom curves (keyframe i sits at curve t = i/(n-1)),
// scalars ease between neighbours. The star spins at the origin with arms ~1.7 long, so the path keeps clear of it.
//   fov    lens angle (deg)            bokeh  depth-of-field blur (0 = off)
//   glow   glow brightness multiplier  swirl  finale swirl speed of the dust (rad/s)
export const camera = {
  damping: 0.08, // per-frame lerp toward the path (on top of the damped scroll progress)
  handheld: { position: 0.035, rotation: 0.0025, speed: 0.35 }, // tiny drift so it feels filmed
  focusRange: 3.5, // world units in focus around the look target
  keyframes: [
    // Cold open: far, static, star tiny; glow blooms up from the loader's point of light (rig.intro)
    { at: 0.0, position: [0, 0.3, 30], target: [0, 0, 0], fov: 24, bokeh: 0, glow: 0.7, swirl: 0 },
    { at: 0.1, position: [0.2, 0.35, 27], target: [0, 0, 0], fov: 24, bokeh: 0, glow: 1, swirl: 0 },
    // Reveal: slow dolly in, star fills about a third of the frame
    { at: 0.25, position: [1.4, 0.5, 8], target: [0, 0.05, 0], fov: 32, bokeh: 1.5, glow: 1, swirl: 0 },
    // Fly-through: dive past the star (clear of the spinning arms) into the dust tube, lens widens
    { at: 0.33, position: [-2.6, 1.1, -1.5], target: [-1, 0.4, -14], fov: 62, bokeh: 0, glow: 1.1, swirl: 0 },
    { at: 0.4, position: [-1.6, 0.6, -11], target: [1.5, 0, -24], fov: 66, bokeh: 0, glow: 1, swirl: 0 },
    // Swing back toward the star to begin the orbit
    { at: 0.45, position: [-0.4, 0.7, -4.8], target: [0, 0, 0], fov: 40, bokeh: 3, glow: 1, swirl: 0 },
    // Orbit: 180° arc at close range, behind → side → front, shallow depth of field
    { at: 0.55, position: [4.6, 0.3, 0], target: [0, 0, 0], fov: 36, bokeh: 4, glow: 1, swirl: 0 },
    { at: 0.65, position: [0.2, 0.4, 4.6], target: [0, 0, 0], fov: 36, bokeh: 3, glow: 1, swirl: 0 },
    // Through the glow: slip past the star into the violet core (bloom whiteout), then the reverse angle
    { at: 0.72, position: [2.1, 0.1, 1], target: [0.4, 0, -1.6], fov: 44, bokeh: 0, glow: 2.2, swirl: 0 },
    { at: 0.77, position: [2.0, 0, -1.8], target: [0, 0, -1.8], fov: 52, bokeh: 0, glow: 5, swirl: 0 },
    { at: 0.85, position: [-1, 0.5, -7.5], target: [0, 0, 0], fov: 38, bokeh: 1, glow: 1.2, swirl: 0.15 },
    // Pull-back finale: wide hero frame, star centred, dust settling into a slow swirl
    { at: 1.0, position: [0, 0.6, -17], target: [0, 0.15, 0], fov: 30, bokeh: 1.2, glow: 1, swirl: 0.25 },
  ],
}

// ---------- Overlay copy (placeholders — replace freely) ----------
export const copy = {
  'cold-open': { eyebrow: 'Scroll to begin' },
  reveal: { title: 'YOUR BRAND', subtitle: 'A one-line promise that sets the tone for everything after it.' },
  'fly-through': { words: ['Design.', 'Motion.', 'Intelligence.'] },
  orbit: {
    paragraph:
      'Two or three sentences about what you make and why it matters. Keep it short: the camera is doing half the talking.',
    stats: [
      { value: '120+', label: 'Launches' },
      { value: '14', label: 'Countries' },
      { value: '9.8', label: 'Client score' },
    ],
  },
  glow: null, // visual beat, no text
  finale: { title: 'Let’s build what’s next', cta: 'Get in touch', href: 'mailto:hello@example.com' },
}

export const loader = {
  minDuration: 1.4, // seconds; keeps the line from flashing past on fast machines
  introDuration: 2.2, // seconds for the glow to bloom up after the handoff
}

// ---------- Adaptive quality ----------
// When the frame rate drops, PerformanceMonitor steps down one rung at a time, in this order.
export const quality = {
  maxDpr: { desktop: 2, mobile: 1.5 },
  ladder: [
    { name: 'full' },
    { name: 'lower DPR', dpr: 1.5 },
    { name: 'half particles', dpr: 1.25, particleScale: 0.5 },
    { name: 'no depth of field', dpr: 1, particleScale: 0.5, dof: false },
  ],
  fastScroll: 0.35, // progress/s above which AdaptiveDpr briefly drops resolution while the camera races
}

// ---------- Step scrolling ----------
// One scroll gesture (wheel flick, swipe, arrow/page key) glides to the next stop and holds there,
// so every portion stays on screen until the viewer asks for the next one.
// Each stop sits where its caption is fully shown and the camera is on a good frame.
export const stepScroll = {
  stops: [
    { at: 0.0, name: 'Cold open' },
    { at: 0.2, name: 'Reveal' },
    { at: 0.285, name: 'Design.' },
    { at: 0.35, name: 'Motion.' },
    { at: 0.415, name: 'Intelligence.' },
    { at: 0.55, name: 'Orbit' },
    { at: 0.71, name: 'Through the glow' },
    { at: 1.0, name: 'Finale' },
  ],
  duration: { min: 1.3, max: 2.6, perProgress: 7 }, // glide time (s) = clamp(min, distance * perProgress, max)
  dwell: 0.9, // seconds after arriving before another gesture is accepted (lets the caption land)
  wheelThreshold: 12, // ignore tiny accidental wheel nudges
  touchThreshold: 40, // px of swipe before it counts
  gestureGap: 0.22, // s of wheel silence that ends a gesture (swallows trackpad momentum tails)
}
