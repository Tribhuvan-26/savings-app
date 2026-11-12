import { useState } from 'react'
import { motion } from 'motion/react'
import { money, useLedger } from '../data'
import { Meme } from '../fun'
import { budgetMood, pool } from '../memes'
import { celebrate, success } from '../peak/feel'
import { X } from 'lucide-react'
import { Art, Bar, Brush, Card, CountUp, Kicker, Note, Reveal, SectionHead, Stack, Stats } from '../ui'

function DailyChart({ s }) {
  const W = 720, H = 240, B = 26
  const n = s.dim, bw = W / n
  const max = Math.max(...s.daily, 1)
  const y = v => H - B - (v / max) * (H - B - 12)
  const peak = s.daily.indexOf(Math.max(...s.daily))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img"
      aria-label={`Daily spending this month. Highest was ${money(s.daily[peak])} on day ${peak + 1}.`}>
      {s.daily.map((v, i) => {
        const d = i + 1
        const kind = d === s.today ? 'today' : d > s.today ? 'future' : 'past'
        const h = Math.max(H - B - y(v), 3)
        return (
          <motion.rect key={d} x={i * bw + 3} y={H - B - h} width={bw - 6} height={h} rx={(bw - 6) / 2.5} className={`col col-${kind}`}
            style={{ transformOrigin: 'bottom', transformBox: 'fill-box' }}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2 + i * 0.015, duration: 0.4, ease: [0.2, 0, 0, 1] }} />
        )
      })}
      <line x1="0" x2={W} y1={H - B} y2={H - B} className="baseline" />
      {[1, 8, 15, 22, n].map(d => (
        <text key={d} x={(d - 0.5) * bw} y={H - 6} className="axis" textAnchor="middle">{d}</text>
      ))}
    </svg>
  )
}

const BANKS = { IDBIBK: 'IDBI Bank', JIOPBS: 'Jio Payments Bank', FAMPAY: 'FamPay', UNIONB: 'Union Bank', AIRBNK: 'Airtel Payments Bank' }

/** Typed balance: "303.29" -> 30329 paise, or null if it isn't a plain amount. */
const toPaise = v => (/^\d+(\.\d{1,2})?$/.test(v.trim()) ? Math.round(parseFloat(v) * 100) : null)

const ADD = '+add' // "From bank" option that opens the add-a-bank form

/** ATM cash lands here; you log what you spend from it. Typed spends count as spending, ATM withdrawals don't. */
function CashCard({ s, addCash, deleteCash, setBalance }) {
  const [amt, setAmt] = useState('')
  const [note, setNote] = useState('')
  const [online, setOnline] = useState(false)
  const [bank, setBank] = useState('')
  const [err, setErr] = useState('')
  const submit = async e => {
    e.preventDefault()
    const p = toPaise(amt)
    if (!p) return setErr('Amount like 40 or 12.50')
    if (online && bank === ADD) return setErr('Add the bank below first, or pick one')
    setErr('')
    const form = e.currentTarget
    // A bank that has since dropped off the list is sent as "not sure".
    const from = online && s.accounts.some(a => a.bank === bank) ? bank : ''
    try { await addCash(p, note, online, from) } catch (x) { return setErr(`Not saved: ${x.message}`) }
    const r = form.getBoundingClientRect()
    celebrate((r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight)
    setAmt('')
    setNote('')
  }
  return (
    <Card tone="ink" className="cash-card">
      <Kicker>Cash in hand</Kicker>
      <p className="giant">{money(s.cash, true)}</p>
      <p className="card-cap">ATM withdrawals go here, they aren't spending. Log cash as you spend it, or an online payment the app missed.</p>

      <form className="cash-form" onSubmit={submit} noValidate>
        <fieldset className="field cash-paid">
          <legend>Paid by</legend>
          <div className="seg" role="radiogroup">
            {[[false, 'Cash'], [true, 'Online (missed)']].map(([k, label]) => (
              <label key={label} className="seg-btn">
                <input type="radio" name="paid" checked={online === k} onChange={() => setOnline(k)} className="sr" />
                {online === k && <motion.span layoutId="paid" className="seg-fill" transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }} />}
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {online && (
          <label className="cash-field">
            <span>From bank</span>
            <select value={bank} onChange={e => setBank(e.target.value)}>
              <option value="">Not sure</option>
              {s.accounts.map(a => <option key={a.bank} value={a.bank}>{BANKS[a.bank] || a.bank}</option>)}
              <option value={ADD}>+ Add a bank…</option>
            </select>
          </label>
        )}
        <div className="cash-inputs">
          <label className="cash-field">
            <span>Spent</span>
            <span className="cash-amt"><i aria-hidden="true">₹</i>
              <input inputMode="decimal" placeholder="40" value={amt} onChange={e => setAmt(e.target.value)}
                aria-invalid={!!err} aria-describedby={err ? 'cash-err' : undefined} />
            </span>
          </label>
          <label className="cash-field cash-note">
            <span>On</span>
            <input placeholder="chai, auto, snacks…" maxLength={40} value={note} onChange={e => setNote(e.target.value)} />
          </label>
        </div>
        {err && <small id="cash-err" className="cash-err">{err}</small>}
        <Brush type="submit">{online ? 'Log online spend' : 'Log cash spend'}</Brush>
      </form>
      {online && bank === ADD && <AddAccount setBalance={setBalance} onAdded={setBank} />}

      {s.cashSpends.length > 0 && (
        <ul className="cash-list" aria-label="Spends you logged this month">
          {[...s.cashSpends].reverse().map(r => (
            <li key={r.time}>
              <span>{r.merchant}<small>{new Date(r.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{r.typed && ` · online${r.from ? ` · ${BANKS[r.from] || r.from}` : ''}`}</small></span>
              <b>−{money(r.paise, true)}</b>
              <button type="button" className="cash-del" onClick={() => deleteCash(r.time)} aria-label={`Delete ${r.merchant} ${money(r.paise, true)}`}>
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Fix bank="CASH" setBalance={setBalance} label="Cash in hand" placeholder="Wrong? Type cash you have" />
    </Card>
  )
}

function Fix({ bank, setBalance, label, placeholder = 'Wrong? Type real balance' }) {
  const [v, setV] = useState('')
  const [err, setErr] = useState('')
  const submit = async e => {
    e.preventDefault()
    const p = toPaise(v)
    if (p == null) return setErr('Amount like 303.29')
    setErr('')
    try { await setBalance(bank, p) } catch (x) { return setErr(`Not saved: ${x.message}`) }
    success()
    setV('')
  }
  return (
    <form className="acct-fix" onSubmit={submit}>
      <label className="sr" htmlFor={`fix-${bank}`}>{label || `Real balance for ${BANKS[bank] || bank}`}</label>
      <input id={`fix-${bank}`} inputMode="decimal" placeholder={placeholder} value={v}
        onChange={e => setV(e.target.value)} aria-invalid={!!err} aria-describedby={err ? `fix-err-${bank}` : undefined} />
      <button type="submit" className="text-btn">Save</button>
      {err && <small id={`fix-err-${bank}`} className="red">{err}</small>}
    </form>
  )
}

/**
 * For banks whose SMS never state a balance (SBI), so they'd never appear above: name + today's balance.
 * Payments logged after that come off it automatically.
 */
function AddAccount({ setBalance, onAdded }) {
  const [name, setName] = useState('')
  const [amt, setAmt] = useState('')
  const [err, setErr] = useState('')
  const submit = async e => {
    e.preventDefault()
    const key = name.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ')
    const p = toPaise(amt)
    if (!key) return setErr('Bank name, like SBI')
    if (p == null) return setErr('Balance like 2500 or 2500.50')
    setErr('')
    try { await setBalance(key, p) } catch (x) { return setErr(`Not saved: ${x.message}`) }
    success()
    setName('')
    setAmt('')
    onAdded?.(key)
  }
  return (
    <form className="acct-add" onSubmit={submit} noValidate>
      <p className="acct-add-title">Bank missing? Add it</p>
      <p className="acct-add-hint">A bank you haven't paid from yet, or one whose SMS never shows a balance (like SBI).</p>
      <div className="acct-add-row">
        <label className="sr" htmlFor="add-bank">Bank name</label>
        <input id="add-bank" placeholder="SBI" value={name} maxLength={20} onChange={e => setName(e.target.value)} />
        <label className="sr" htmlFor="add-bal">Balance today</label>
        <input id="add-bal" inputMode="decimal" placeholder="Balance" value={amt} onChange={e => setAmt(e.target.value)}
          aria-invalid={!!err} aria-describedby={err ? 'add-err' : undefined} />
        <button type="submit" className="text-btn">Add</button>
      </div>
      {err && <small id="add-err" className="red">{err}</small>}
    </form>
  )
}

function Accounts({ s, setBalance, removeAccount }) {
  return (
    <Card tone="cream" className="accounts-card">
      <Kicker>Really in your accounts</Kicker>
      <p className="giant">{money(s.balance)}</p>
      <ul className="acct-list">
        {s.accounts.map(a => (
          <li key={a.bank}>
            <span>{BANKS[a.bank] || a.bank}</span>
            <b>{money(a.bal, true)}</b>
            <small>as of {new Date(a.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</small>
            <Fix bank={a.bank} setBalance={setBalance} />
            {a.added && (
              <button type="button" className="text-btn acct-remove" onClick={() => removeAccount(a.bank)}>
                Remove {BANKS[a.bank] || a.bank}
              </button>
            )}
          </li>
        ))}
        {s.cash > 0 && <li><span>Cash in hand</span><b>{money(s.cash, true)}</b><small>ATM withdrawals minus cash you logged</small></li>}
      </ul>
      <p className="card-cap">
        Latest balance per account, from bank SMS or what you typed, minus payments logged since.
        Banks skip SMS for some payments, so fix a number here whenever it drifts.
      </p>
      <AddAccount setBalance={setBalance} />
    </Card>
  )
}

export default function Budget() {
  const { s, setBalance, removeAccount, addCash, deleteCash } = useLedger()
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
          <h2 className="card-title">No balance yet</h2>
          <p>Your budget comes from the real balance in your bank SMS. It shows up after your next bank transaction. You can also set a monthly cap.</p>
          <Brush to="/settings">Set a budget</Brush>
          <AddAccount setBalance={setBalance} />
        </Card>
      ) : (
        <>
          <div className="budget-grid">
            <Card tone="ink" className="left-card">
              <Kicker>{over ? 'Over budget by' : 'Left to spend'}</Kicker>
              <p className={`mega-num${over ? ' red' : ''}`}><CountUp value={Math.abs(s.left)} /></p>
              <Bar frac={s.used} label="Budget used" className="bar-light" />
              <p className="bc-sub">{Math.round(s.used * 100)}% of {money(s.budget)} used{s.accounts.length > 0 && s.budget === s.spent + s.balance ? ' · your real balance' : ''}</p>
            </Card>
            <Card tone="red" className="perday-card">
              <Kicker>You can spend</Kicker>
              <p className="giant">{money(s.perDay)}<span className="per">/day</span></p>
              <p className="card-cap">on average, from what you have, till {s.dim} {s.now.toLocaleString('en-IN', { month: 'short' })}</p>
            </Card>
          </div>

          <Meme pool={pool([budgetMood(s.used, s.budget > 0)], s.used)} className="meme-row" />

          <Accounts s={s} setBalance={setBalance} removeAccount={removeAccount} />
          <CashCard s={s} addCash={addCash} deleteCash={deleteCash} setBalance={setBalance} />

          <Stats items={[
            ['Spent so far', money(s.spent), true],
            ['Avg spent / day', money(s.avgDay)],
            ['Days left', String(s.daysLeft)],
          ]} />

          <SectionHead n="04" title="Daily spend" />
          <Card tone="white" className="chart-card">
            <DailyChart s={s} />
            <ul className="legend">
              <li><i className="lg-past" /> Spent that day</li>
              <li><i className="lg-today" /> Today</li>
            </ul>
          </Card>
        </>
      )}
    </Stack>
  )
}
