import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, ShieldCheck } from 'lucide-react'
import { isNative, useLedger } from '../data'
import { Art, Brush, Card, Kicker, Note, Reveal, Stack } from '../ui'

function Field({ id, label, hint, error, prefix, suffix, ...input }) {
  const described = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`inp${error ? ' inp-err' : ''}`}>
        {prefix && <span className="affix">{prefix}</span>}
        <input id={id} aria-invalid={!!error} aria-describedby={described} {...input} />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
      {hint && <p className="hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="err" id={`${id}-err`}><CircleAlert size={15} aria-hidden="true" /> {error}</p>}
    </div>
  )
}

export default function Settings() {
  const { settings, save, smsAccess } = useLedger()
  const [f, setF] = useState({ budget: settings.budget, goal: settings.goal, pct: settings.pct, sheet: settings.sheet })
  const [rule, setRule] = useState(settings.pct ? 'pct' : 'round')
  const [err, setErr] = useState({})
  const [toast, setToast] = useState(null)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  async function submit(e) {
    e.preventDefault()
    const v = { budget: f.budget.trim(), goal: f.goal.trim(), pct: rule === 'pct' ? f.pct.trim() : '', sheet: f.sheet.trim() }
    const errors = {}
    if (!/^\d*$/.test(v.budget)) errors.budget = 'Whole rupees only, like 15000'
    if (!/^\d*$/.test(v.goal)) errors.goal = 'Whole rupees only, like 2000'
    if (rule === 'pct' && !(/^\d+$/.test(v.pct) && +v.pct >= 1 && +v.pct <= 100)) errors.pct = 'Enter a number from 1 to 100'
    if (v.sheet && !v.sheet.startsWith('https://')) errors.sheet = 'The link must start with https://'
    setErr(errors)
    if (Object.keys(errors).length) {
      document.getElementById(Object.keys(errors)[0])?.focus()
      return
    }
    await save(v)
    setToast('Settings saved')
  }

  return (
    <Stack className="wrap page">
      <header className="page-hero">
        <div>
          <Reveal><Kicker>// 04 Tune the machine</Kicker></Reveal>
          <Reveal as="h1" className="page-title">Sett<span className="outline">ings</span></Reveal>
        </div>
        <Reveal className="page-hero-side">
          <Art name="sliders" size={120} className="tilt-r" />
          <Note>your rules</Note>
        </Reveal>
      </header>

      <div className="settings-grid">
        <Card tone="cream" className="form-card">
          <form className="form" onSubmit={submit} noValidate>
            <h2 className="card-title">Budget &amp; savings</h2>
            <Field id="budget" label="Monthly budget" prefix="₹" inputMode="numeric" placeholder="15000"
              value={f.budget} onChange={set('budget')} error={err.budget} hint="You get a warning once you've spent 80% of it." />

            <fieldset className="field">
              <legend>Savings rule</legend>
              <div className="seg" role="radiogroup">
                {[['round', 'Round up to ₹10'], ['pct', '% of payment']].map(([k, label]) => (
                  <label key={k} className="seg-btn">
                    <input type="radio" name="rule" value={k} checked={rule === k} onChange={() => setRule(k)} className="sr" />
                    {rule === k && <motion.span layoutId="rule" className="seg-fill" transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }} />}
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <AnimatePresence initial={false}>
              {rule === 'pct' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <Field id="pct" label="Percent saved per payment" suffix="%" inputMode="numeric" placeholder="5"
                    value={f.pct} onChange={set('pct')} error={err.pct} />
                </motion.div>
              )}
            </AnimatePresence>

            <Field id="goal" label="Jar goal" prefix="₹" inputMode="numeric" placeholder="2000"
              value={f.goal} onChange={set('goal')} error={err.goal} />

            <Field id="sheet" label="Google Sheets webhook (optional)" type="url" inputMode="url" placeholder="https://script.google.com/…"
              value={f.sheet} onChange={set('sheet')} error={err.sheet}
              hint={isNative ? 'Copies each transaction to your sheet. Leave it blank to keep everything on this phone.' : 'Used by the Android app to copy each transaction to your sheet.'} />

            <Brush type="submit">Save settings</Brush>
          </form>
        </Card>

        <Stack className="side-stack">
          <Card tone="ink" className="import-card">
            <h2 className="card-title">Automatic</h2>
            <p className="import-copy">
              No imports, ever. The app reads bank SMS by itself: every new payment is logged the moment the SMS lands,
              and on first launch it picks up the last 6 months from your inbox.
            </p>
            <p className={`status ${isNative && smsAccess ? 'status-on' : 'status-off'}`}>
              <span className="status-dot" aria-hidden="true" />
              {!isNative ? 'Open the Android app to connect your SMS'
                : smsAccess ? 'SMS access on · reading automatically'
                : 'SMS access off · allow it in Android Settings → Apps → Savings → Permissions'}
            </p>
          </Card>
          <Reveal as="p" className="privacy">
            <ShieldCheck size={18} aria-hidden="true" />
            {isNative ? 'Your transactions stay on this phone.' : 'Your transactions stay in this browser. Nothing is uploaded.'}
          </Reveal>
        </Stack>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ opacity: 0, y: 20, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: -2 }} exit={{ opacity: 0, y: 10 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  )
}
