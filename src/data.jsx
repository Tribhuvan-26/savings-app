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
  // income and the jar. Cash you spend is typed in separately (r.cash) and does count.
  const month = rows.filter(r => sameMonth(r.time) && !r.self && !r.atm)
  const cashSpends = month.filter(r => r.cash)
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

const Ctx = createContext(null)
export const useLedger = () => useContext(Ctx)

export function LedgerProvider({ children }) {
  const [data, setData] = useState(null)
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

  const value = useMemo(() => ({
    ...data,
    s: data && computeStats(data),
    async addCash(paise, note) {
      await Ledger.addCash({ paise, note })
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
  }), [data, reload])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
