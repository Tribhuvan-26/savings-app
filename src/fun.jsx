import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { thud } from './peak/feel'
import { Art } from './ui'

/** The app logo: the ₹ coin, same shapes as the launcher icon (scripts/icons.py). Decorative: the link around it has the name. */
export function LogoMark({ size = 40, className = '' }) {
  return <Art name="coin" size={size} className={`mark ${className}`} />
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

const pick = (n, not) => { if (n < 2) return 0; let i; do { i = Math.floor(Math.random() * n) } while (i === not); return i }

/**
 * An internet meme from `pool` (src/memes.js), top/bottom caption style. A random one each visit; tap for another.
 * If an image can't load (offline), the captions still show on an ink card.
 */
export function Meme({ pool, tilt = -2, className = '' }) {
  // The next meme is picked ahead and downloaded in the background, so a tap shows it instantly.
  const [[i, nxt], setPair] = useState(() => { const a = pick(pool.length); return [a, pick(pool.length, a)] })
  const [broken, setBroken] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const m = pool[i % pool.length]
  const upcoming = pool[nxt % pool.length]?.src
  useEffect(() => {
    if (!upcoming) return
    const im = new Image()
    im.referrerPolicy = 'no-referrer'
    im.src = upcoming
  }, [upcoming])
  const next = () => { thud(); setBroken(false); setLoaded(false); setPair(([, b]) => [b, pick(pool.length, b)]) }
  return (
    <div className={`meme-wrap ${className}`}>
    <motion.figure className="meme" style={{ rotate: tilt }}
      initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
      onTap={next} whileTap={{ scale: 0.96, rotate: -tilt }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} className="meme-frame" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.22 }}>
          {(broken || !loaded) && <div className={`meme-blank${broken ? '' : ' meme-loading'}`} />}
          {!broken && <img src={m.src} alt={`${m.alt} meme`} decoding="async" referrerPolicy="no-referrer"
            hidden={!loaded} onLoad={() => setLoaded(true)} onError={() => setBroken(true)} />}
          {m.top && <span className="meme-top" aria-hidden="true">{m.top}</span>}
          {m.bottom && <span className="meme-bottom" aria-hidden="true">{m.bottom}</span>}
          {loaded && !broken && m.labels?.map(([t, x, y]) => <span key={t} className="meme-label" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">{t}</span>)}
        </motion.div>
      </AnimatePresence>
      <figcaption className="sr">{[m.top, m.bottom, ...(m.labels || []).map(l => l[0])].filter(Boolean).join(' / ')}. Tap for another meme.</figcaption>
    </motion.figure>
    <p className="meme-tip"><span aria-hidden="true">tap the meme for another one · </span><Link to="/settings#memes">add your own</Link></p>
    </div>
  )
}
