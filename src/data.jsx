import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'

// Native side: android/app/src/main/java/com/trib/savings/LedgerPlugin.kt
const Ledger = registerPlugin('Ledger')
export const isNative = Capacitor.isNativePlatform()
export const openNotifAccess = () => Ledger.openNotifAccess()

// Real data only comes from the Android app (it reads bank SMS). A plain browser gets an empty ledger.
const EMPTY = { rows: [], smsAccess: false, notifAccess: false, accounts: [], budget: 0, balance: 0, cash: 0, settings: { budget: '', goal: '', pct: '', sheet: '', me: '' } }

const nf0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** Amounts are integer paise everywhere. `exact` shows paise when there are any. */
export const money = (p, exact) => (p < 0 ? '−₹' : '₹') + (exact && p % 100 ? nf2.format(Math.abs(p) / 100) : nf0.format(Math.round(Math.abs(p) / 100)))

async function fetchAll() {
  if (!isNative) return EMPTY
  const [{ rows, smsAccess, notifAccess, accounts, budget, balance, cash }, settings] = await Promise.all([Ledger.rows(), Ledger.settings()])
  return { rows, smsAccess, notifAccess, accounts, budget, balance, cash, settings }
}

// `budget` and `balance` come from native (Ledger.kt budgetOf/balanceNow): budget is your monthly cap,
// limited to what your accounts really hold; balance is that real money, adjusted for payments since.
function computeStats({ rows, settings, accounts, budget, balance, cash }) {
  const now = new Date()
  const sameMonth = t => { const d = new Date(t); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }
  const sum = (a, k = 'paise') => a.reduce((s, r) => s + r[k], 0)
  // Self transfers and ATM withdrawals (flags from native) just move your own money: left out of spending,
  // income and the jar. Spends you type in (r.cash, or r.typed for online ones nothing reported) do count.
  const month = rows.filter(r => sameMonth(r.time) && !r.self && !r.atm)
  const cashSpends = month.filter(r => r.cash || r.typed)
  const out = month.filter(r => r.debit)
  const spent = sum(out)
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const today = now.getDate()
  const daysLeft = dim - today + 1
  const left = budget - spent
  const daily = Array(dim).fill(0)
  out.forEach(r => { daily[new Date(r.time).getDate() - 1] += r.paise })
  const drops = month.filter(r => r.saved > 0)
  return {
    now, spent, budget, left, balance, accounts, cash, cashSpends, dim, today, daysLeft, daily,
    received: sum(month.filter(r => !r.debit)),
    goal: (parseInt(settings.goal, 10) || 0) * 100,
    jar: sum(rows, 'saved'),
    monthSaved: sum(drops, 'saved'),
    avgDrop: drops.length ? sum(drops, 'saved') / drops.length : 0,
    perDay: budget ? Math.max(0, left) / daysLeft : 0,
    avgDay: spent / today,
    used: budget ? spent / budget : 0,
    recent: [...rows].reverse(),
  }
}

// Names you gave transactions (Unknown, or cut short by the bank). Kept on the phone in localStorage, which
// survives app updates and ledger rebuilds; keyed by time + amount, stable across rebuilds.
// byKey: one transaction. byName: every transaction the bank labelled with that name ("KATEP").
const NAMES = 'savings.names'
const loadNames = () => { try { return { byKey: {}, byName: {}, ...JSON.parse(localStorage.getItem(NAMES)) } } catch { return { byKey: {}, byName: {} } } }
export const txKey = r => `${r.time}:${r.paise}`
const applyNames = (rows, n) => rows.map(r => {
  const name = n.byKey[txKey(r)] || n.byName[r.merchant]
  return name ? { ...r, merchant: name, orig: r.merchant } : r
})

const Ctx = createContext(null)
export const useLedger = () => useContext(Ctx)

export function LedgerProvider({ children }) {
  const [data, setData] = useState(null)
  const [names, setNames] = useState(loadNames)
  const reload = useCallback(() => fetchAll().then(setData), [])

  useEffect(() => {
    reload()
    // Payments happen in other apps; refresh when the user comes back.
    const onVisible = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onVisible)
    // Fired by MainActivity once SMS permission is granted.
    window.addEventListener('savingsrefresh', reload)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('savingsrefresh', reload)
    }
  }, [reload])

  const value = useMemo(() => {
    const named = data && { ...data, rows: applyNames(data.rows, names) }
    return {
    ...named,
    s: named && computeStats(named),
    /** Name a transaction; `everywhere` also names every other one the bank gave the same label. Empty name = undo. */
    rename(r, name, everywhere) {
      const orig = r.orig || r.merchant
      const n = { byKey: { ...names.byKey }, byName: { ...names.byName } }
      const clean = name.trim().replace(/\s+/g, ' ')
      delete n.byKey[txKey(r)]
      if (everywhere && orig !== 'Unknown') delete n.byName[orig]
      if (clean && clean !== orig) {
        if (everywhere && orig !== 'Unknown') n.byName[orig] = clean
        else n.byKey[txKey(r)] = clean
      }
      localStorage.setItem(NAMES, JSON.stringify(n))
      setNames(n)
    },
    async addCash(paise, note, online = false) {
      await Ledger.addCash({ paise, note, online })
      await reload()
    },
    async deleteCash(time) {
      await Ledger.deleteCash({ time })
      await reload()
    },
    async setBalance(bank, paise) {
      await Ledger.setBalance({ bank, paise })
      await reload()
    },
    async save(settings) {
      if (!isNative) return
      await Ledger.save(settings)
      await reload()
    },
  }
  }, [data, names, reload])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
