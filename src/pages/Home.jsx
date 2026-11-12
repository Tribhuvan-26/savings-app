import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, PiggyBank } from 'lucide-react'
import { money, useLedger } from '../data'
import {
  Art, Asterisk, Bar, Brush, Card, CountUp, Empty, Kicker, Marquee, Note,
  Reveal, SectionHead, Stack, Stats, Sticker, TxRow, item, list,
} from '../ui'

export default function Home() {
  const { s, settings } = useLedger()
  const pct = Math.round(s.used * 100)
  const month = s.now.toLocaleString('en-IN', { month: 'long' })
  const ticker = s.recent.slice(0, 10).map(r => `${r.merchant} ${r.debit ? '−' : '+'}${money(r.paise)}`)

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero wrap">
        <Stack className="hero-copy">
          <Reveal><Kicker>Personal finance on autopilot</Kicker></Reveal>
          <Reveal as="h1" className="mega">Every<br />rupee<br /><span className="outline">counts.</span></Reveal>
          <Reveal as="p" className="lede">
            Savings reads your bank SMS, logs every payment and quietly rounds up the spare change into your jar.
          </Reveal>
          <Reveal className="hero-ctas">
            <Brush to="/activity">View activity</Brush>
            <Link to="/jar" className="round-cta">
              <span className="round-ico"><PiggyBank size={20} aria-hidden="true" /></span> Open the jar
            </Link>
          </Reveal>
        </Stack>

        <motion.div className="hero-art" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}>
          <div className="halftone hero-dots" aria-hidden="true" />
          <div className="sun">
            <p className="sun-label">Spent in {month}</p>
            <p className="sun-num"><CountUp value={s.spent} /></p>
            <p className="sun-sub">{s.budget ? `${pct}% of ${money(s.budget)}` : 'no budget set'}</p>
          </div>
          <Sticker text="AUTO-SAVED ✱ ROUND UP ✱ AUTO-SAVED ✱ ROUND UP ✱" className="hero-sticker">
            <span className="st-num">{money(s.jar)}</span>
            <span className="st-cap">in the jar</span>
          </Sticker>
          <Note className="hero-note">{s.budget ? `${s.daysLeft} days to go!` : 'set a budget!'}</Note>
          <span className="slash slash-1" aria-hidden="true" />
          <span className="slash slash-2" aria-hidden="true" />
          <Asterisk size={64} className="hero-ast spin" />
        </motion.div>

        <Stack className="hero-side">
          <Reveal as="ul" className="side-list">
            <li>Track</li><li>Save</li><li>Budget</li><li>Repeat</li>
          </Reveal>
          <Card to="/budget" tone="ink" className="budget-card">
            <Kicker>Left to spend</Kicker>
            <p className="bc-num">{s.budget ? money(Math.max(s.left, 0)) : '—'}</p>
            {s.budget > 0 && <Bar frac={s.used} label="Budget used" className="bar-light" />}
            <p className="bc-sub">{s.budget ? `${money(s.perDay)} a day keeps you on track` : 'Set a monthly budget'}</p>
          </Card>
          <Stats items={[
            ['In the jar', money(s.jar), true],
            ['Per day left', money(s.perDay)],
            ['Days left', String(s.daysLeft)],
          ]} />
          <Reveal className="barcode" aria-hidden="true" />
        </Stack>
      </section>

      {/* ── Ticker bands ── */}
      <div className="bands">
        <Marquee items={ticker.length ? ticker : ['No transactions yet']} tone="red" tilt={-2} />
        <Marquee items={['Round up', 'Save', 'Repeat', 'On-device', 'No bank login']} tone="ink" tilt={2.5} reverse />
      </div>

      {/* ── Dark section: rounded cards ── */}
      <section className="dark-zone">
        <Stack className="wrap">
          <SectionHead n="01" title="Your money, this month" dark action={<Link to="/activity" className="more more-light">View all <ArrowRight size={16} aria-hidden="true" /></Link>} />
          <div className="bento">
            <Card to="/jar" tone="cream" className="b-jar">
              <h2 className="card-title">Jar of the month</h2>
              <p className="card-by">by your spare change</p>
              <p className="giant jar-giant">{money(s.jar, true)}</p>
              <div className="card-split">
                <Art name="jar" size={132} className="tilt-l" />
                <dl className="facts">
                  <div><dt>Saved</dt><dd>{money(s.jar, true)}</dd></div>
                  <div><dt>Goal</dt><dd>{s.goal ? money(s.goal) : 'None'}</dd></div>
                  <div><dt>Rule</dt><dd>{settings.pct ? `${settings.pct}%` : 'Round up'}</dd></div>
                </dl>
              </div>
            </Card>

            <Card to="/budget" tone="red" className="b-budget">
              <Art name="gauge" size={88} className="tilt-r" />
              <p className="giant">{s.budget ? `${pct}%` : '—'}</p>
              <p className="card-cap">of the budget used</p>
            </Card>

            <Card to="/activity" tone="white" className="b-activity">
              <Art name="receipt" size={80} className="tilt-l" />
              <p className="giant">{s.recent.length}</p>
              <p className="card-cap">transactions logged</p>
            </Card>

            <Card tone="cream" className="b-flow">
              <h2 className="card-title">Money flow</h2>
              <div className="flow">
                <div><span>In</span><b className="red">{money(s.received)}</b></div>
                <div><span>Out</span><b>{money(s.spent)}</b></div>
                <div><span>Net</span><b>{money(s.received - s.spent)}</b></div>
              </div>
            </Card>
          </div>

          <motion.ul className="chips" variants={list}>
            {[['coin', 'Round-ups on'], ['receipt', 'Reads bank SMS'], ['gauge', 'Alert at 80%'], ['sliders', 'Your rules']].map(([a, t]) => (
              <motion.li key={t} variants={item}><Art name={a} size={26} /> {t}</motion.li>
            ))}
          </motion.ul>
        </Stack>
      </section>

      {/* ── Lists ── */}
      <section className="wrap two-col">
        <Stack>
          <SectionHead n="02" title="Top spends" />
          {s.top.length ? (
            <motion.ol className="rank" variants={list}>
              {s.top.map(([m, v], i) => (
                <motion.li key={m} variants={item}>
                  <span className="rank-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rank-name">{m}</span>
                  <span className="rank-amt">{money(v)}</span>
                </motion.li>
              ))}
            </motion.ol>
          ) : <Empty>No spending yet this month.</Empty>}
        </Stack>
        <Stack>
          <SectionHead n="03" title="Recent" action={<Link to="/activity" className="more">View all <ArrowRight size={16} aria-hidden="true" /></Link>} />
          <Card tone="white" className="list-card">
            {s.recent.length ? (
              <motion.ul className="txs" variants={list}>
                {s.recent.slice(0, 6).map(r => <TxRow key={`${r.time}${r.merchant}`} r={r} />)}
              </motion.ul>
            ) : <Empty>Transactions appear here automatically as bank SMS arrive.</Empty>}
          </Card>
        </Stack>
      </section>
    </>
  )
}
