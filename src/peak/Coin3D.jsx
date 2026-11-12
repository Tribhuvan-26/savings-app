import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { LogoMark } from '../fun'

// A ₹10-style bimetallic coin: brass ring, silver centre, embossed lettering, painted on 2D canvases.
const BRASS = ['#F6DE8D', '#D9AE48', '#A7781E']
const SILVER = ['#F7F8FA', '#CDD2D9', '#8E96A1']

function metal(g, r0, r1, [hi, mid, lo]) {
  const grad = g.createLinearGradient(-r1, -r1, r1, r1)
  grad.addColorStop(0, hi)
  grad.addColorStop(0.5, mid)
  grad.addColorStop(1, lo)
  g.fillStyle = grad
  g.beginPath()
  g.arc(0, 0, r1, 0, Math.PI * 2)
  g.arc(0, 0, r0, 0, Math.PI * 2, true)
  g.fill()
}

/** Raised lettering: a dark lower-right edge and a light upper-left edge around a metal-coloured fill. */
function emboss(g, draw, [hi, mid, lo]) {
  g.save(); g.translate(5, 6); g.fillStyle = lo; draw(); g.restore()
  g.save(); g.translate(-3, -3); g.fillStyle = hi; draw(); g.restore()
  g.fillStyle = mid
  draw()
}

/** A short word on the ring, centred at `angle` (0 = top), upright on the top or bottom of the ring. */
function ringWord(g, text, r, angle, bottom, pal) {
  g.save()
  g.rotate(angle)
  g.translate(0, bottom ? r : -r)
  emboss(g, () => g.fillText(text, 0, 0), pal)
  g.restore()
}

function face(back) {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const g = c.getContext('2d')
  g.translate(512, 512)
  if (!back) g.scale(-1, 1) // three.js maps the top cap mirror-imaged: pre-mirror the front so both read right
  metal(g, 352, 512, BRASS)
  metal(g, 0, 352, SILVER)
  // Minted details: the groove between the metals, a beaded border on the ring.
  g.strokeStyle = 'rgba(60, 40, 10, 0.55)'
  g.lineWidth = 8
  g.beginPath(); g.arc(0, 0, 352, 0, Math.PI * 2); g.stroke()
  g.strokeStyle = 'rgba(80, 55, 15, 0.5)'
  g.lineWidth = 6
  g.beginPath(); g.arc(0, 0, 492, 0, Math.PI * 2); g.stroke()
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2
    g.fillStyle = i % 2 ? '#B98A2A' : '#F3D884'
    g.beginPath(); g.arc(Math.cos(a) * 470, Math.sin(a) * 470, 5, 0, Math.PI * 2); g.fill()
  }
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '700 74px "Noto Sans Devanagari", sans-serif'
  ringWord(g, 'भारत', 418, 0, false, BRASS)
  g.font = '800 70px "Space Grotesk", sans-serif'
  ringWord(g, back ? '2026' : 'INDIA', 418, 0, true, BRASS)
  g.font = '800 54px sans-serif'
  ringWord(g, '★', 418, -Math.PI / 2, false, BRASS)
  ringWord(g, '★', 418, Math.PI / 2, false, BRASS)
  if (!back) {
    g.font = '900 360px sans-serif'
    emboss(g, () => g.fillText('₹', 0, -50), SILVER)
    g.font = '400 170px Anton, "Arial Black", sans-serif'
    emboss(g, () => g.fillText('10', 0, 210), SILVER)
  } else {
    // Ten rays behind the denomination, like the real ₹10 reverse.
    g.strokeStyle = '#B4BAC3'
    g.lineWidth = 14
    g.lineCap = 'round'
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + ((i - 4.5) / 10) * Math.PI * 1.1
      g.beginPath()
      g.moveTo(Math.cos(a) * 150, Math.sin(a) * 150 + 40)
      g.lineTo(Math.cos(a) * 320, Math.sin(a) * 320 + 40)
      g.stroke()
    }
    g.font = '400 280px Anton, "Arial Black", sans-serif'
    emboss(g, () => g.fillText('10', 0, 60), SILVER)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  // Cylinder caps map UVs a quarter-turn off from how we drew it: turn the art upright.
  t.center.set(0.5, 0.5)
  t.rotation = Math.PI / 2
  return t
}

/** The reeded (ridged) edge, wrapped around the cylinder side. */
function reeds() {
  const c = document.createElement('canvas')
  c.width = 2048
  c.height = 8
  const g = c.getContext('2d')
  for (let x = 0; x < 2048; x += 8) {
    g.fillStyle = '#E2BC5C'; g.fillRect(x, 0, 4, 8)
    g.fillStyle = '#8F6516'; g.fillRect(x + 4, 0, 4, 8)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Coin({ calm }) {
  const ref = useRef()
  const spin = useRef({ v: calm ? 0 : 0.6, drag: false, last: 0, tilt: 0 })
  // The faces wait for the web fonts, so "10" isn't painted in a fallback typeface.
  const [ready, setReady] = useState(false)
  useEffect(() => { document.fonts.load('400 100px Anton').finally(() => setReady(true)) }, [])
  const mats = useMemo(() => ready && [
    new THREE.MeshStandardMaterial({ map: reeds(), metalness: 0.9, roughness: 0.35 }), // edge
    new THREE.MeshStandardMaterial({ map: face(false), metalness: 0.85, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ map: face(true), metalness: 0.85, roughness: 0.3 }),
  ], [ready])
  useEffect(() => () => { if (mats) mats.forEach(m => { m.map?.dispose(); m.dispose() }) }, [mats])

  useFrame((state, dt) => {
    const s = spin.current
    const c = ref.current
    if (!c) return
    if (!s.drag) {
      // Flicks decay back to a slow idle turn (none if you asked for less motion).
      const idle = calm ? 0 : 0.6
      s.v += (idle - s.v) * Math.min(1, dt * 1.2)
    }
    // The outer group turns around the screen's vertical axis, so the coin flips edge-on and shows both faces.
    c.rotation.y += s.v * dt
    c.rotation.x = THREE.MathUtils.lerp(c.rotation.x, s.tilt, dt * 6)
    if (!calm) c.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.08
  })

  // Drag sideways to fling it; vertical drag tilts it a little.
  const down = e => { e.stopPropagation(); spin.current.drag = true; spin.current.last = e.clientX; e.target.setPointerCapture?.(e.pointerId) }
  const move = e => {
    const s = spin.current
    if (!s.drag) return
    s.v = THREE.MathUtils.clamp((e.clientX - s.last) * 0.9, -28, 28)
    s.tilt = THREE.MathUtils.clamp(s.tilt + e.movementY * 0.004, -0.5, 0.5)
    s.last = e.clientX
  }
  const up = () => { spin.current.drag = false; spin.current.tilt = 0 }

  if (!mats) return null
  return (
    <group ref={ref} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh material={mats}>
          <cylinderGeometry args={[1.6, 1.6, 0.24, 128, 1]} />
        </mesh>
        {/* raised rims on both faces catch the light like a minted edge */}
        {[0.12, -0.12].map(y => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.57, 0.05, 16, 128]} />
            <meshStandardMaterial color="#D9AE48" metalness={0.95} roughness={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/**
 * The hero: a minted ₹10 coin you can flick around. Renders only while on screen, so it costs nothing
 * once you scroll past it. Decorative: screen readers skip it.
 */
export default function Coin3D({ className = '' }) {
  const box = useRef(null)
  const [visible, setVisible] = useState(true)
  // Some phone GPUs (MediaTek) drop WebGL contexts; then show the flat logo rather than a dead canvas.
  const [lost, setLost] = useState(false)
  const calm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(box.current)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={box} className={`coin3d ${className}`} aria-hidden="true">
      {lost ? <LogoMark size={260} className="coin-flat" /> : (
        <Canvas frameloop={visible ? 'always' : 'never'} dpr={[1, 1.75]} camera={{ position: [0, 0, 5.2], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
          onCreated={({ gl, scene }) => {
            gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); setLost(true) })
            // A built-in studio environment for the metal to reflect (no HDR download).
            scene.environment = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture
          }}>
          <directionalLight position={[3, 4, 5]} intensity={1.6} />
          <pointLight position={[-4, -2, 3]} intensity={10} color="#FFD27A" />
          <Coin calm={calm} />
        </Canvas>
      )}
    </div>
  )
}
