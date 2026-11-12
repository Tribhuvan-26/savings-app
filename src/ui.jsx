import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { money } from './data'
import { openRename } from './peak/RenameSheet'

const snap = [0.2, 0, 0, 1]
export const list = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
export const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: snap } },
}
const MotionLink = motion.create(Link)

export function Stack({ children, className = '', as = 'div' }) {
  const Tag = motion[as]
  return <Tag className={className} variants={list} initial="hidden" animate="show">{children}</Tag>
}

export const Reveal = ({ children, className = '', as = 'div' }) => {
  const Tag = motion[as]
  return <Tag className={className} variants={item}>{children}</Tag>
}

export function Kicker({ children, className = '' }) {
  return <p className={`kicker ${className}`}>{children}</p>
}

/** Red brush-stroke call to action. */
export function Brush({ to, children, type = 'button', onClick, tone = 'red', className = '' }) {
  const cls = `brush brush-${tone} ${className}`
  return to
    ? <Link to={to} className={cls}><span>{children}</span></Link>
    : <button type={type} onClick={onClick} className={cls}><span>{children}</span></button>
}

export function Card({ to, tone = 'cream', className = '', children }) {
  const Tag = to ? MotionLink : motion.div
  return (
    <Tag to={to} className={`card card-${tone} ${to ? 'card-link ' : ''}${className}`} variants={item}>
      {to && <span className="card-arrow" aria-hidden="true"><ArrowUpRight size={22} strokeWidth={2.5} /></span>}
      {children}
    </Tag>
  )
}

export function SectionHead({ n, title, action, dark }) {
  return (
    <motion.div className={`shead${dark ? ' shead-dark' : ''}`} variants={item}>
      <h3><span className="shead-n">// {n}</span> {title}</h3>
      {action}
    </motion.div>
  )
}

/** Infinite ticker band. Children are rendered twice for a seamless loop. */
export function Marquee({ items, tone = 'red', tilt = 0, reverse }) {
  const row = items.map((t, i) => <span key={i} className="mq-item">{t}<Asterisk size={18} /></span>)
  return (
    <div className={`marquee mq-${tone}`} style={{ rotate: `${tilt}deg` }} aria-hidden="true">
      <div className={`mq-track${reverse ? ' mq-rev' : ''}`}>{row}{row}</div>
    </div>
  )
}

export function Asterisk({ size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`asterisk ${className}`} aria-hidden="true">
      {[0, 30, 60, 90, 120, 150].map(a => <rect key={a} x="43" y="2" width="14" height="96" rx="3" transform={`rotate(${a} 50 50)`} />)}
    </svg>
  )
}

/** Round badge with text running around the edge. */
export function Sticker({ text, children, className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className={`sticker ${className}`}>
      <svg viewBox="0 0 200 200" className="sticker-ring" aria-hidden="true">
        <defs><path id={`s${id}`} d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" /></defs>
        <text><textPath href={`#s${id}`} textLength="470" lengthAdjust="spacing">{text}</textPath></text>
      </svg>
      <div className="sticker-core">{children}</div>
    </div>
  )
}

export function Note({ children, className = '' }) {
  return (
    <p className={`note ${className}`}>
      {children}
      <svg viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 6 Q 15 1 30 6 T 60 6 T 90 6 T 118 5" /></svg>
    </p>
  )
}

/* Hand-drawn style stickers: thick ink outline, cream fill, red accent. */
const ART = {
  jar: (
    <>
      <rect x="30" y="10" width="40" height="12" rx="3" className="a-fill" />
      <path d="M26 30 Q26 22 34 22 H66 Q74 22 74 30 V82 Q74 92 64 92 H36 Q26 92 26 82 Z" className="a-fill" />
      <circle cx="42" cy="74" r="9" className="a-red" /><circle cx="60" cy="68" r="9" className="a-red" /><circle cx="50" cy="54" r="9" className="a-red" />
      <path d="M33 34 V60" className="a-line" />
    </>
  ),
  coin: (
    <>
      <circle cx="50" cy="50" r="40" className="a-red" />
      <circle cx="50" cy="50" r="29" className="a-fill" />
      <path d="M40 36 H62 M40 46 H62 M50 36 Q64 38 56 50 Q50 56 40 56 L60 70" className="a-line" />
    </>
  ),
  receipt: (
    <>
      <path d="M24 8 H76 V92 L67 85 L58 92 L50 85 L42 92 L33 85 L24 92 Z" className="a-fill" />
      <path d="M34 28 H66 M34 42 H66 M34 56 H54" className="a-line" />
      <rect x="54" y="62" width="14" height="10" className="a-red" />
    </>
  ),
  gauge: (
    <>
      <path d="M10 70 A40 40 0 0 1 90 70 Z" className="a-fill" />
      <path d="M22 70 A28 28 0 0 1 50 42" className="a-line" />
      <path d="M50 70 L72 40" className="a-line a-thick" />
      <circle cx="50" cy="70" r="8" className="a-red" />
    </>
  ),
  sliders: (
    <>
      <rect x="10" y="12" width="80" height="76" rx="14" className="a-fill" />
      <path d="M24 34 H76 M24 50 H76 M24 66 H76" className="a-line" />
      <circle cx="40" cy="34" r="7" className="a-red" /><circle cx="64" cy="50" r="7" className="a-red" /><circle cx="34" cy="66" r="7" className="a-red" />
    </>
  ),
}
export function Art({ name, size = 96, className = '' }) {
  return <svg viewBox="0 0 100 100" width={size} height={size} className={`art ${className}`} aria-hidden="true">{ART[name]}</svg>
}

export function Stats({ items, dark }) {
  return (
    <motion.dl className={`stats${dark ? ' stats-dark' : ''}`} variants={item}>
      {items.map(([label, value, red]) => (
        <div key={label}>
          <dd className={red ? 'red' : ''}>{value}</dd>
          <dt>{label}</dt>
        </div>
      ))}
    </motion.dl>
  )
}

export function Bar({ frac, label, className = '' }) {
  const f = Math.min(Math.max(frac, 0), 1)
  return (
    <div className={`bar ${className}`} role="progressbar" aria-label={label} aria-valuenow={Math.round(frac * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: f }} transition={{ duration: 0.8, ease: snap, delay: 0.2 }} />
    </div>
  )
}

export function CountUp({ value, exact }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (reduce) { el.textContent = money(value, exact); return }
    const ctrl = animate(0, value, {
      duration: 1,
      ease: snap,
      onUpdate: v => { el.textContent = money(Math.round(v)) },
      onComplete: () => { el.textContent = money(value, exact) },
    })
    return () => ctrl.stop()
  }, [value, exact, reduce])
  return <span ref={ref}>{money(reduce ? value : 0, exact)}</span>
}

/** Little label for money that's not plain spending/income. */
export function TxTag({ r }) {
  const t = r.self ? 'Self transfer' : r.atm ? 'To cash' : r.cash ? 'Cash' : r.typed ? 'Typed in' : null
  return t && <span className="self-tag">{t}</span>
}

export function TxRow({ r, right, sub }) {
  const time = new Date(r.time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  return (
    <motion.li className="tx" variants={item}>
      <span className={`av${r.debit ? '' : ' av-in'}`} aria-hidden="true">{r.merchant[0]}</span>
      <span className="tx-who">
        <b><button type="button" className="name-btn" onClick={() => openRename(r)} aria-label={`Rename ${r.merchant}`}>{r.merchant}</button><TxTag r={r} /></b>
        <small>{sub ?? <>{time}{r.saved > 0 && <> · <span className="red">+{money(r.saved, true)} saved</span></>}</>}</small>
      </span>
      {right ?? (
        <span className={`tx-amt${r.debit ? '' : ' red'}`}>
          {r.debit ? '−' : '+'}{money(r.paise, true)}
          <span className="sr">{r.debit ? ' spent' : ' received'}</span>
        </span>
      )}
    </motion.li>
  )
}

export function Empty({ children }) {
  return <motion.p className="empty" variants={item}>{children}</motion.p>
}
