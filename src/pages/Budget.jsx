import { motion } from 'motion/react'
import { money, useLedger } from '../data'
import { Art, Bar, Brush, Card, CountUp, Kicker, Note, Reveal, SectionHead, Stack, Stats } from '../ui'

function DailyChart({ s }) {
  const W = 720, H = 240, B = 26
  const n = s.dim, bw = W / n, allow = s.budget / n
  const max = Math.max(...s.daily, allow * 1.6, 1)
  const y = v => H - B - (v / max) * (H - B - 12)
  const peak = s.daily.indexOf(Math.max(...s.daily))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img"
      aria-label={`Daily spending this month. Highest was ${money(s.daily[peak])} on day ${peak + 1}. Daily budget is ${money(allow)}.`}>
      {s.daily.map((v, i) => {
        const d = i + 1
        const kind = d === s.today ? 'today' : d > s.today ? 'future' : v > allow ? 'over' : 'past'
        const h = Math.max(H - B - y(v), 3)
        return (
          <motion.rect key={d} x={i * bw + 3} y={H - B - h} width={bw - 6} height={h} rx={(bw - 6) / 2.5} className={`col col-${kind}`}
            style={{ transformOrigin: 'bottom', transformBox: 'fill-box' }}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2 + i * 0.015, duration: 0.4, ease: [0.2, 0, 0, 1] }} />
        )
      })}
      <line x1="0" x2={W} y1={y(allow)} y2={y(allow)} className="allow" />
      <line x1="0" x2={W} y1={H - B} y2={H - B} className="baseline" />
      {[1, 8, 15, 22, n].map(d => (
        <text key={d} x={(d - 0.5) * bw} y={H - 6} className="axis" textAnchor="middle">{d}</text>
      ))}
    </svg>
  )
}

export default function Budget() {
  const { s } = useLedger()
  const over = s.left < 0

  return (
    <Stack className="wrap page">
      <header className="page-hero">
        <div>
          <Reveal><Kicker>// 03 {s.budget ? `${s.daysLeft} days to go` : 'Spend with intent'}</Kicker></Reveal>
          <Reveal as="h1" className="page-title">Bud<span className="outline">get</span></Reveal>
        </div>
        <Reveal className="page-hero-side">
          <Art name="gauge" size={130} className="tilt-l" />
          {s.budget > 0 && <Note>{over ? 'over budget!' : `${Math.round(s.used * 100)}% gone`}</Note>}
        </Reveal>
      </header>

      {!s.budget ? (
        <Card tone="cream" className="empty-card">
          <h2 className="card-title">No budget yet</h2>
          <p>Set a monthly budget to get a daily allowance and a warning once you've spent 80% of it.</p>
          <Brush to="/settings">Set a budget</Brush>
        </Card>
      ) : (
        <>
          <div className="budget-grid">
            <Card tone="ink" className="left-card">
              <Kicker>{over ? 'Over budget by' : 'Left to spend'}</Kicker>
              <p className={`mega-num${over ? ' red' : ''}`}><CountUp value={Math.abs(s.left)} /></p>
              <Bar frac={s.used} label="Budget used" className="bar-light" />
              <p className="bc-sub">{Math.round(s.used * 100)}% of {money(s.budget)} used</p>
            </Card>
            <Card tone="red" className="perday-card">
              <Kicker>Spend per day</Kicker>
              <p className="giant">{money(s.perDay)}</p>
              <p className="card-cap">to finish the month on budget</p>
            </Card>
          </div>

          <Stats items={[
            ['Spent so far', money(s.spent), true],
            ['Avg per day', money(s.avgDay)],
            ['Days left', String(s.daysLeft)],
          ]} />

          <SectionHead n="04" title="Daily spend" />
          <Card tone="white" className="chart-card">
            <DailyChart s={s} />
            <ul className="legend">
              <li><i className="lg-past" /> Under daily budget</li>
              <li><i className="lg-over" /> Over daily budget</li>
              <li><i className="lg-today" /> Today</li>
              <li><i className="lg-dash" /> {money(s.budget / s.dim)} per day</li>
            </ul>
          </Card>
        </>
      )}
    </Stack>
  )
}
