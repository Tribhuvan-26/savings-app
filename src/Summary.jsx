import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ArrowUp, CalendarDays, Check, ChevronDown } from 'lucide-react'
import { money } from './data'
import { Card } from './ui'
import { tick } from './peak/feel'

// First match wins. Lowercase substrings of the payee name.
// ponytail: keyword guesses from names; add a "move to category" tap if these mislabel too often
const CATS = [
  ['Food & drinks', '#3B6FE0', ['food', 'cafe', 'chai', 'tea', 'coffee', 'restaurant', 'hotel', 'bakery', 'bakers', 'swiggy', 'zomato', 'kitchen', 'biryani', 'darbar', 'juice', 'pizza', 'burger', 'dhaba', 'sweets', 'canteen', 'mess', 'tiffin', 'eat', 'dosa', 'kfc', 'mcdonald', 'domino', 'starbucks', 'chicken']],
  ['Travel', '#E8A400', ['metro', 'rail', 'irctc', 'uber', 'ola', 'rapido', 'redbus', 'petrol', 'fuel', 'hpcl', 'bpcl', 'indian oil', 'tsrtc', 'apsrtc', 'bus', 'parking', 'fastag', 'travels', 'yatri']],
  ['Groceries', '#2E9E5B', ['mart', 'kirana', 'grocery', 'supermarket', 'zepto', 'blinkit', 'bigbasket', 'instamart', 'provision', 'general store', 'vegetable', 'fruits', 'dairy', 'milk', 'ratnadeep', 'more retail']],
  ['Shopping', '#F26B1D', ['amazon', 'flipkart', 'myntra', 'ajio', 'westside', 'retail', 'reta', 'trends', 'mall', 'meesho', 'nykaa', 'decathlon', 'fashion', 'garments', 'textile', 'footwear', 'electronics', 'mobiles']],
  ['Bills & recharge', '#1BA9A0', ['airtel', 'jio', 'vodafone', 'electricity', 'bill', 'recharge', 'broadband', 'tsspdcl', 'gas', 'water', 'dth', 'postpaid']],
  ['Health', '#E0457B', ['pharma', 'apollo', 'medical', 'medplus', 'hospital', 'clinic', 'diagnostic', 'health', 'chemist', 'netmeds']],
  ['Entertainment', '#9B4DDB', ['netflix', 'spotify', 'hotstar', 'bookmyshow', 'pvr', 'inox', 'prime video', 'youtube', 'cinema', 'gaming', 'steam']],
  ['Cash', '#5C5C5C', ['atm']],
  ['Wallet', '#8A5A3B', ['wallet', 'paytm', 'fampay', 'phonepe', 'mobikwik']],
]
const PEOPLE = ['People', '#C2185B']
const OTHER = ['Uncategorized', '#9E9E9E']
// Business-sounding words: a name with one of these is never a person.
const BIZ = /\b(pvt|ltd|limited|lt|llp|enterprises?|traders?|stores?|services?|state|corp|corporation|india|technologies|solutions|agency|centre|center|co|company|industries|ventures|bank|payments?)\b/i
const PERSON = /^(?:(?:mr|mrs|ms|sri|smt|dr|shri)\.?\s+)?[a-z][a-z.']*(?:\s+[a-z.']+){1,4}$/i

export function categorize(name) {
  const n = name.toLowerCase()
  const hit = CATS.find(([, , words]) => words.some(w => n.includes(w)))
  if (hit) return hit
  if (name !== 'Unknown' && !BIZ.test(name) && PERSON.test(name.trim())) return PEOPLE
  return OTHER
}

const monthKey = t => { const d = new Date(t); return d.getFullYear() * 12 + d.getMonth() }
const label = k => new Date(Math.floor(k / 12), k % 12, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
const sum = a => a.reduce((s, r) => s + r.paise, 0)

/**
 * Month dropdown: a listbox (WAI-ARIA pattern) instead of <select>, whose Android popup can't be styled.
 * Arrows/Home/End move, Enter/Space pick, Escape or a tap outside closes; focus returns to the button.
 */
function MonthPicker({ months, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const btn = useRef(null)
  const box = useRef(null)
  const listRef = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    const away = e => !box.current?.contains(e.target) && setOpen(false)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])
  useEffect(() => { if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' }) }, [open, active, id])

  const show = () => { setActive(Math.max(0, months.indexOf(value))); setOpen(true) }
  const close = () => { setOpen(false); btn.current?.focus() }
  const pick = m => { tick(); onChange(m); close() }
  const onKey = e => {
    const last = months.length - 1
    const moves = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last }
    if (e.key in moves) { e.preventDefault(); setActive(moves[e.key]) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(months[active]) }
    else if (e.key === 'Escape' || e.key === 'Tab') close()
  }
  const [mon, yr] = label(value).split(' ')

  return (
    <div className="mp" ref={box}>
      <button ref={btn} type="button" className={`mp-btn${open ? ' is-open' : ''}`} aria-haspopup="listbox" aria-expanded={open}
        aria-controls={`${id}-list`} aria-label={`Month: ${label(value)}`} onClick={() => { tick(); if (open) close(); else show() }}
        onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); show() } }}>
        <CalendarDays size={18} className="mp-ico" aria-hidden="true" />
        <span className="mp-mon">{mon}</span><span className="mp-yr">{yr}</span>
        <ChevronDown size={18} className="mp-chev" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul ref={listRef} id={`${id}-list`} role="listbox" tabIndex={-1} aria-label="Month"
            aria-activedescendant={`${id}-${active}`} onKeyDown={onKey} className="mp-list"
            initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}>
            {months.map((m, i) => {
              const [mm, yy] = label(m).split(' ')
              return (
                <li key={m} id={`${id}-${i}`} role="option" aria-selected={m === value}
                  className={`mp-opt${i === active ? ' is-active' : ''}${m === value ? ' is-on' : ''}`}
                  onPointerEnter={() => setActive(i)} onClick={() => pick(m)}>
                  <span className="mp-mon">{mm}</span><span className="mp-yr">{yy}</span>
                  {m === value && <Check size={18} className="mp-check" aria-hidden="true" />}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Spending by category for one month, like a bank app's monthly summary. Tap a category to see who you paid. */
export function MonthlySummary({ rows, now: today }) {
  const now = monthKey(today)
  const months = [...new Set(rows.map(r => monthKey(r.time)))].sort((a, b) => b - a)
  if (!months.includes(now)) months.unshift(now)
  const [k, setK] = useState(now)

  const all = rows.filter(r => monthKey(r.time) === k)
  const inMonth = all.filter(r => !r.self && !r.atm) // moving your own money (transfers, ATM) isn't spending
  const moved = sum(all.filter(r => r.self && r.debit))
  const atm = sum(all.filter(r => r.atm))
  const out = inMonth.filter(r => r.debit)
  const total = sum(out)
  // Same point in the previous month: up to today's day for the current month, the whole month for past ones.
  const cutDay = k === now ? today.getDate() : 31
  const prevSoFar = sum(rows.filter(r => r.debit && !r.self && !r.atm && monthKey(r.time) === k - 1 && new Date(r.time).getDate() <= cutDay))
  const diff = total - prevSoFar
  const hasPrev = rows.some(r => monthKey(r.time) === k - 1)

  const cats = {}
  out.forEach(r => {
    const [name, color] = categorize(r.merchant)
    const c = (cats[name] ||= { name, color, total: 0, payees: {} })
    c.total += r.paise
    c.payees[r.merchant] = (c.payees[r.merchant] || 0) + r.paise
  })
  const list = Object.values(cats).sort((a, b) => b.total - a.total)

  return (
    <Card tone="white" className="summary-card">
      <div className="sum-head">
        <h3 className="sum-title">Monthly<br />summary</h3>
        <MonthPicker months={months} value={k} onChange={setK} />
      </div>

      <div className="sum-io">
        <div><span>Incoming</span><b className="red">+{money(sum(inMonth.filter(r => !r.debit)))}</b></div>
        <div><span>Outgoing</span><b>−{money(total)}</b></div>
      </div>

      {hasPrev && (
        <p className={`sum-insight ${diff <= 0 ? 'good' : 'bad'}`}>
          {diff <= 0 ? <ArrowDown size={16} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
          {money(Math.abs(diff), true)} spent {diff <= 0 ? 'less' : 'more'} than {label(k - 1).split(' ')[0]}{k === now ? ' at this point' : ''}
        </p>
      )}

      <p className="sum-total"><span>Total spends</span><b>{money(total, true)}</b></p>
      {total > 0 && (
        <div className="sum-bar" role="img" aria-label={list.map(c => `${c.name} ${money(c.total)}`).join(', ')}>
          {list.map(c => <i key={c.name} style={{ flexGrow: c.total, background: c.color }} />)}
        </div>
      )}

      <ul className="sum-cats">
        {list.map(c => (
          <li key={c.name}>
            <details>
              <summary>
                <i className="sum-dot" style={{ borderColor: c.color }} aria-hidden="true" />
                <span>{c.name}</span>
                <b>{money(c.total, true)}</b>
                <ChevronDown size={18} className="sum-chev" aria-hidden="true" />
              </summary>
              <ul className="sum-payees">
                {Object.entries(c.payees).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
                  <li key={m}><span>{m}</span><b>{money(v, true)}</b></li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
      {atm > 0 && <p className="sum-moved">ATM withdrawals {money(atm, true)} · went to cash in hand, count once you log the spends</p>}
      {moved > 0 && <p className="sum-moved">Self transfers {money(moved, true)} · moved between your accounts, not counted</p>}
      {!total && <p className="card-cap">No spending logged in {label(k)}.</p>}
    </Card>
  )
}
