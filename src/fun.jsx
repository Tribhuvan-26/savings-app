import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { thud } from './peak/feel'

// Rendered from src/logo.js by scripts/icons.mjs (same art as the launcher icon).
const LOGO = `${import.meta.env.BASE_URL}logo.png`

/** The comic POW! logo, same art as the launcher icon. Decorative: the link around it has the name. */
export function LogoMark({ size = 40, className = '' }) {
  return <img src={LOGO} width={size} height={size} alt="" className={`mark ${className}`} draggable="false" />
}

/** Types its text out once, terminal style, with a blinking cursor. Shows it whole if you prefer less motion. */
export function Typewriter({ text, speed = 45 }) {
  const calm = useReducedMotion()
  const [n, setN] = useState(calm ? text.length : 0)
  useEffect(() => {
    if (calm || n >= text.length) return
    const t = setTimeout(() => setN(n + 1), speed)
    return () => clearTimeout(t)
  }, [n, text, speed, calm])
  return (
    <span className="typer">
      <span className="sr">{text}</span>
      <span aria-hidden="true">{'> '}{text.slice(0, n)}<span className="caret">_</span></span>
    </span>
  )
}

/** A handful of ₹ coins raining through a card once, when it appears. Decorative only. */
export function CoinRain({ count = 14 }) {
  const calm = useReducedMotion()
  // Positions fixed per mount: re-rendering must not reshuffle falling coins.
  const [coins] = useState(() => Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 100, d: 0.2 + Math.random() * 1.1, s: 0.7 + Math.random() * 0.8, r: Math.random() * 540 - 270, k: i,
  })))
  if (calm) return null
  return (
    <span className="coin-rain" aria-hidden="true">
      {coins.map(c => (
        <motion.i key={c.k} style={{ left: `${c.x}%`, scale: c.s }}
          initial={{ y: '-30%', opacity: 0, rotate: 0 }} animate={{ y: '420%', opacity: [0, 1, 1, 0], rotate: c.r }}
          transition={{ delay: c.d, duration: 1.6, ease: [0.4, 0, 0.6, 1] }}>₹</motion.i>
      ))}
    </span>
  )
}

// Classic templates, loaded from imgflip's CDN at runtime (not copied into this repo).
const T = {
  fry: ['https://i.imgflip.com/1bgw.jpg', 'Futurama Fry squinting'],
  leo: ['https://i.imgflip.com/39t1o.jpg', 'Leonardo DiCaprio raising a glass'],
  harold: ['https://i.imgflip.com/gk5el.jpg', 'Hide the Pain Harold smiling through pain'],
  fine: ['https://i.imgflip.com/wxica.jpg', 'This Is Fine dog sitting in a burning room'],
  disaster: ['https://i.imgflip.com/23ls.jpg', 'Disaster Girl smirking in front of a fire'],
  rollsafe: ['https://i.imgflip.com/1h7in3.jpg', 'Roll Safe tapping his head'],
  skeleton: ['https://i.imgflip.com/2fm6x.jpg', 'Skeleton still waiting on a bench'],
}

/**
 * Internet meme, top/bottom caption style. If the image can't load (offline), the same joke shows as a big emoji.
 */
export function Meme({ t, top, bottom, emoji, tilt = -2, className = '' }) {
  const [src, alt] = T[t]
  const [broken, setBroken] = useState(false)
  return (
    <motion.figure className={`meme ${className}`} style={{ rotate: tilt }}
      initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
      onTap={thud} whileTap={{ scale: 0.96, rotate: -tilt }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
      {broken
        ? <span className="meme-emoji" aria-hidden="true">{emoji}</span>
        : <img src={src} alt={`${alt} meme`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />}
      <span className="meme-top" aria-hidden="true">{top}</span>
      <span className="meme-bottom" aria-hidden="true">{bottom}</span>
      <figcaption className="sr">{top} / {bottom}</figcaption>
    </motion.figure>
  )
}

/** How the month's going, meme edition. `used` = share of what you have that's spent (0..1+). */
export function budgetMeme(used, hasBudget) {
  if (!hasBudget) return { t: 'fry', emoji: '🤨', top: 'not sure if broke', bottom: 'or bank forgot to sms' }
  if (used > 1) return { t: 'disaster', emoji: '🔥', top: 'my budget', bottom: 'me with UPI' }
  if (used > 0.8) return { t: 'fine', emoji: '🫠', top: `${Math.round(used * 100)}% of my money gone`, bottom: 'this is fine' }
  if (used > 0.5) return { t: 'harold', emoji: '🙂', top: 'checking my balance', bottom: "it's fine. i'm fine." }
  return { t: 'leo', emoji: '🥂', top: 'still got money', bottom: 'this far into the month' }
}

export function jarMeme(jar) {
  return jar > 0
    ? { t: 'rollsafe', emoji: '🧠', top: "can't go broke", bottom: 'if you save the spare change' }
    : { t: 'skeleton', emoji: '💀', top: 'me waiting', bottom: 'for my first savings' }
}
