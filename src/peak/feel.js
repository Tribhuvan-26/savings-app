import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import confetti from 'canvas-confetti'

// Touch feedback. No-ops in a browser; never throws (a missing vibrator mustn't break a tap).
const native = Capacitor.isNativePlatform()
export const tick = () => { if (native) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}) }
export const thud = () => { if (native) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}) }
export const success = () => { if (native) Haptics.notification({ type: NotificationType.Success }).catch(() => {}) }

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
let rupee
/** A burst of ₹ and brand-coloured confetti from a point on screen (0..1 coords). Answers a user action only. */
export function celebrate(x = 0.5, y = 0.6) {
  success()
  if (calm()) return
  rupee ||= confetti.shapeFromText({ text: '₹', scalar: 2.2, color: '#E8130C' })
  const base = { origin: { x, y }, disableForReducedMotion: true, zIndex: 400 }
  confetti({ ...base, particleCount: 70, spread: 75, startVelocity: 38, colors: ['#E8130C', '#F3ECD6', '#0D0D0D'] })
  confetti({ ...base, particleCount: 14, spread: 60, startVelocity: 30, scalar: 2.2, shapes: [rupee] })
}
