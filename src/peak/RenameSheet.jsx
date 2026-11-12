import { useEffect, useRef, useState } from 'react'
import { money, useLedger } from '../data'
import { success, tick } from './feel'

const EVENT = 'savings:rename'

/** Ask the (single, app-wide) sheet to rename this transaction. */
export const openRename = r => { tick(); window.dispatchEvent(new CustomEvent(EVENT, { detail: r })) }

/**
 * Bottom sheet for naming a transaction: "Unknown", or a name the bank cut short ("KATEP").
 * A native <dialog>: focus is trapped and Back/Escape close it, for free.
 */
export default function RenameSheet() {
  const { rename } = useLedger()
  const ref = useRef(null)
  const [r, setR] = useState(null)
  const [name, setName] = useState('')
  const [everywhere, setEverywhere] = useState(true)

  useEffect(() => {
    const open = e => {
      const row = e.detail
      setR(row)
      setName(row.merchant === 'Unknown' ? '' : row.merchant)
      setEverywhere(true)
      ref.current?.showModal()
    }
    window.addEventListener(EVENT, open)
    return () => window.removeEventListener(EVENT, open)
  }, [])

  const close = () => ref.current?.close()
  const orig = r && (r.orig || r.merchant)
  const canAll = r && orig !== 'Unknown'
  const save = e => {
    e.preventDefault()
    rename(r, name, canAll && everywhere)
    success()
    close()
  }
  const reset = () => { rename(r, '', canAll && everywhere); close() }

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="rename-title" onClick={e => e.target === ref.current && close()}>
      {r && (
        <form className="sheet-body" onSubmit={save}>
          <span className="sheet-grip" aria-hidden="true" />
          <h2 id="rename-title" className="sheet-title">Who was this?</h2>
          <p className="sheet-meta">
            {r.debit ? 'Paid' : 'Received'} {money(r.paise, true)} · {new Date(r.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            {orig !== 'Unknown' && <> · bank says <b>{orig}</b></>}
          </p>
          <label className="sr" htmlFor="rename-input">Name</label>
          <input id="rename-input" className="sheet-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Ravi, Hostel mess, Auto" maxLength={40} autoComplete="off" autoFocus />
          {canAll && (
            <label className="sheet-check">
              <input type="checkbox" checked={everywhere} onChange={e => setEverywhere(e.target.checked)} />
              <span>Rename every payment the bank calls <b>{orig}</b></span>
            </label>
          )}
          <div className="sheet-actions">
            <button type="submit" className="sheet-save">Save name</button>
            <button type="button" className="sheet-ghost" onClick={close}>Cancel</button>
          </div>
          {r.orig && <button type="button" className="sheet-reset" onClick={reset}>Use the bank's name again</button>}
        </form>
      )}
    </dialog>
  )
}
