import { useState } from 'react'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import { money, useLedger } from '../data'
import { Meme } from '../fun'
import { budgetMood, pool } from '../memes'
import { Art, Empty, Kicker, Note, Reveal, Stack, TxTag, item } from '../ui'

const FILTERS = [['all', 'All'], ['out', 'Spent'], ['in', 'Received']]

function groupByDay(rows) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 864e5).toDateString()
  const groups = new Map()
  for (const r of rows) {
    const d = new Date(r.time)
    const k = d.toDateString()
    const label = k === today ? 'Today' : k === yesterday ? 'Yesterday'
      : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(r)
  }
  return [...groups]
}

export default function Activity() {
  const { s } = useLedger()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const needle = q.trim().toLowerCase()
  const rows = s.recent.filter(r =>
    (filter === 'all' || (filter === 'out') === r.debit) && r.merchant.toLowerCase().includes(needle))

  return (
    <Stack className="wrap page">
      <header className="page-hero">
        <div>
          <Reveal><Kicker>// 01 Every rupee, tracked</Kicker></Reveal>
          <Reveal as="h1" className="page-title">Activ<span className="outline">ity</span></Reveal>
        </div>
        <Reveal className="page-hero-side">
          <Art name="receipt" size={120} className="tilt-r" />
          <Note>{s.recent.length} and counting</Note>
        </Reveal>
      </header>

      <Meme pool={pool([budgetMood(s.used, s.budget > 0)], s.used)} tilt={-1.5} />

      <Reveal className="toolbar">
        <div className="search">
          <Search size={20} aria-hidden="true" />
          <label htmlFor="q" className="sr">Search merchants</label>
          <input id="q" type="search" placeholder="Search merchants" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="seg" role="group" aria-label="Filter transactions">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" className="seg-btn" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {filter === k && <motion.span layoutId="seg" className="seg-fill" transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }} />}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal className="table-card">
        <table className="tx-table">
          <thead>
            <tr><th scope="col">Merchant</th><th scope="col">Time</th><th scope="col">Saved</th><th scope="col" className="num-col">Amount</th></tr>
          </thead>
          {groupByDay(rows).map(([label, items]) => {
            const out = items.filter(r => r.debit && !r.self && !r.atm).reduce((a, r) => a + r.paise, 0)
            return (
              <tbody key={label}>
                <tr className="day-row">
                  <th scope="rowgroup">{label}</th><td /><td />
                  <td className="num-col">{out > 0 && `−${money(out)}`}</td>
                </tr>
                {items.map(r => (
                  <motion.tr key={`${r.time}${r.merchant}`} variants={item} initial="hidden" animate="show">
                    <td><span className="cell-who"><span className={`av${r.debit ? '' : ' av-in'}`} aria-hidden="true">{r.merchant[0]}</span><b>{r.merchant}<TxTag r={r} /></b></span></td>
                    <td className="muted">{new Date(r.time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</td>
                    <td className="red">{r.saved > 0 ? `+${money(r.saved, true)}` : ''}</td>
                    <td className={`num-col tx-amt${r.debit ? '' : ' red'}`}>
                      {r.debit ? '−' : '+'}{money(r.paise, true)}
                      <span className="sr">{r.debit ? ' spent' : ' received'}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            )
          })}
        </table>
        {!rows.length && <Empty>{s.recent.length ? 'Nothing matches that search.' : 'No transactions yet. They appear automatically as bank SMS arrive in the app.'}</Empty>}
      </Reveal>
    </Stack>
  )
}
