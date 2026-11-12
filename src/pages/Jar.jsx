import { motion } from 'motion/react'
import { money, useLedger } from '../data'
import { CoinRain, Meme } from '../fun'
import { pool } from '../memes'
import { Art, Card, CountUp, Empty, Kicker, Note, Reveal, SectionHead, Stack, Stats, Sticker, item, list } from '../ui'

export default function Jar() {
  const { s, settings } = useLedger()
  const frac = s.goal ? Math.min(s.jar / s.goal, 1) : 0
  const drops = s.recent.filter(r => r.saved > 0).slice(0, 9)

  return (
    <Stack className="wrap page">
      <header className="page-hero">
        <div>
          <Reveal><Kicker>// 02 Spare change, stacked</Kicker></Reveal>
          <Reveal as="h1" className="page-title">The <span className="outline">jar</span></Reveal>
        </div>
        <Reveal className="page-hero-side">
          <Sticker text="SPARE CHANGE ✱ STACKED ✱ SPARE CHANGE ✱ STACKED ✱" className="sticker-sm">
            <Art name="coin" size={54} />
          </Sticker>
        </Reveal>
      </header>

      <div className="jar-grid">
        <Card tone="red" className="jar-total">
          <Kicker>Total saved</Kicker>
          <p className="mega-num"><CountUp value={s.jar} exact /></p>
          <p className="jt-sub">
            {s.goal ? `${Math.round(frac * 100)}% of your ${money(s.goal)} goal${s.jar >= s.goal ? ' · goal reached!' : ''}` : 'Set a goal in Settings'}
          </p>
          <div className="halftone jt-dots" aria-hidden="true" />
          {s.jar > 0 && <CoinRain />}
        </Card>

        <Card tone="cream" className="jar-gauge-card">
          <div className="tube" role="img" aria-label={`Jar ${Math.round(frac * 100)}% full`}>
            <motion.i initial={{ scaleY: 0 }} animate={{ scaleY: frac }} transition={{ duration: 1, ease: [0.2, 0, 0, 1], delay: 0.2 }} />
            {[25, 50, 75, 100].map(t => <span key={t} style={{ bottom: `${t}%` }}>{t}%</span>)}
          </div>
          <Art name="jar" size={110} className="tilt-r" />
          <Note>{settings.pct ? `${settings.pct}% of every payment` : 'round up to ₹10'}</Note>
        </Card>
      </div>

      <Stats items={[
        ['Saved this month', money(s.monthSaved, true), true],
        ['Avg per payment', money(Math.round(s.avgDrop), true)],
        ['Drops this month', String(s.recent.filter(r => r.saved > 0 && new Date(r.time).getMonth() === s.now.getMonth()).length)],
      ]} />

      <Meme pool={pool([s.jar > 0 ? 'saving' : 'nosave'])} tilt={2} className="meme-row" />

      <SectionHead n="03" title="Latest drops" />
      {drops.length ? (
        <motion.ul className="drops" variants={list}>
          {drops.map((r, i) => (
            <motion.li key={`${r.time}${r.merchant}`} variants={item} className={`drop drop-${i % 3}`}>
              <span className="drop-amt">+{money(r.saved, true)}</span>
              <b>{r.merchant}</b>
              <small>paid {money(r.paise, true)} · {new Date(r.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small>
            </motion.li>
          ))}
        </motion.ul>
      ) : <Empty>Make a payment and your first drop lands here.</Empty>}
    </Stack>
  )
}
