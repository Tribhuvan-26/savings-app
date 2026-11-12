// Light/dark theme with an ink-bleed transition (shader adapted from Ink Bleed by Codemure, MIT).
// Tap the toggle: ink in the new theme's paper colour spreads from your finger until it covers the screen, the
// theme flips underneath, then the ink clears. Falls back to an instant switch without WebGL2 or with reduced motion.
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { createNoiseTexture } from './noise'
import { FRAG, VERT } from './shader'

const KEY = 'savings.theme'
const PAPER = { light: [0xF4 / 255, 0xF1 / 255, 0xEA / 255], dark: [0x0F / 255, 0x0E / 255, 0x11 / 255] }
// Pigment pooled at the frontier: denser ink when going dark, brighter "bleach" when going light.
const RIM = { dark: [0.0, 0.0, 0.01], light: [1.0, 0.996, 0.985] }
const DURATION = 2.2 // s of spread: slow enough to watch the ink crawl
const FADE = 520     // ms for the ink to clear once the page underneath has flipped
const SPREAD = { growth: 0.7, cleanupFrom: 0.45, cleanupReach: 0.4 }

export const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

/** Switch instantly: page colours, the saved choice, and the phone's status-bar icons (light icons on dark). */
export function applyTheme(t) {
  document.documentElement.dataset.theme = t
  try { localStorage.setItem(KEY, t) } catch { /* private mode: just don't remember */ }
  if (Capacitor.isNativePlatform()) StatusBar.setStyle({ style: t === 'dark' ? Style.Dark : Style.Light }).catch(() => {})
  window.dispatchEvent(new CustomEvent('savings:theme', { detail: t }))
}

let gl, canvas, prog, noise, uni, busy = false

function setup() {
  if (gl !== undefined) return gl
  canvas = document.createElement('canvas')
  canvas.className = 'ink-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false })
  if (!gl) return (gl = null)
  const sh = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
    return s
  }
  try {
    prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  } catch (e) {
    console.error('[ink]', e)
    return (gl = null)
  }
  gl.bindVertexArray(gl.createVertexArray())
  noise = createNoiseTexture(gl)
  const cache = {}
  uni = n => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(prog, n)))
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; busy = false; canvas.classList.remove('is-active') })
  return gl
}

function draw(f) {
  const scale = Math.min(window.devicePixelRatio || 1, 1.5)
  const w = Math.round(innerWidth * scale), h = Math.round(innerHeight * scale)
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  gl.viewport(0, 0, w, h)
  gl.useProgram(prog)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, noise)
  gl.uniform1i(uni('uNoise'), 0)
  gl.uniform1f(uni('uCanvasScale'), scale)
  gl.uniform2f(uni('uRes'), w, h)
  gl.uniform2f(uni('uCenter'), f.x, f.y)
  gl.uniform1f(uni('uRadius'), f.radius)
  gl.uniform1f(uni('uCleanup'), f.cleanup)
  gl.uniform1f(uni('uTime'), f.time)
  gl.uniform1f(uni('uRef'), Math.max(innerWidth, innerHeight))
  gl.uniform2f(uni('uSeed'), f.seed.x, f.seed.y)
  gl.uniformMatrix2fv(uni('uSeedRot'), false, [Math.cos(f.seed.a), Math.sin(f.seed.a), -Math.sin(f.seed.a), Math.cos(f.seed.a)])
  gl.uniform3fv(uni('uColor'), PAPER[f.to])
  gl.uniform3fv(uni('uRimColor'), RIM[f.to])
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

/** Toggle the theme, ink spreading from `point` (viewport CSS px). */
export function toggleTheme(point) {
  const to = getTheme() === 'dark' ? 'light' : 'dark'
  if (busy) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !setup()) return applyTheme(to)
  busy = true
  const x = point?.x ?? innerWidth / 2, y = point?.y ?? innerHeight / 2
  const maxDist = Math.max(Math.hypot(x, y), Math.hypot(innerWidth - x, y), Math.hypot(x, innerHeight - y), Math.hypot(innerWidth - x, innerHeight - y)) + 4
  const seed = { x: Math.random() * 64 - 32, y: Math.random() * 64 - 32, a: Math.random() * Math.PI * 2 }
  canvas.style.transition = 'none'
  canvas.style.opacity = '1'
  canvas.classList.add('is-active')
  const start = performance.now()
  const frame = now => {
    if (!gl) return applyTheme(to)
    // Dev preview only: window.__inkSlow = 8 plays it 8x slower to inspect the ink. Stripped from release builds.
    const time = (now - start) / 1000 / (import.meta.env.DEV ? window.__inkSlow || 1 : 1)
    const linear = Math.min(1, time / DURATION)
    const progress = 1 - (1 - linear) ** 3 // power3.out, as in the original
    const ramp = Math.max(0, (linear - SPREAD.cleanupFrom) / (1 - SPREAD.cleanupFrom))
    const cleanup = ramp ** 2 * maxDist * SPREAD.cleanupReach + Math.max(0, (linear - 0.97) / 0.03) * maxDist
    draw({ x, y, to, seed, time, radius: progress * maxDist * SPREAD.growth, cleanup })
    if (linear < 1) return requestAnimationFrame(frame)
    // Fully covered in the new paper colour: flip the page underneath, then let the ink clear.
    applyTheme(to)
    requestAnimationFrame(() => {
      canvas.style.transition = `opacity ${FADE}ms ease-out`
      canvas.style.opacity = '0'
      setTimeout(() => { canvas.classList.remove('is-active'); busy = false }, FADE + 30)
    })
  }
  requestAnimationFrame(frame)
}

/** On launch: match the status bar to the theme the page started in (set by index.html before first paint). */
export const initTheme = () => applyTheme(getTheme())
