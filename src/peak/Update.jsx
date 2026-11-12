import { useEffect, useRef, useState } from 'react'
import { Download, Sparkles } from 'lucide-react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { tick } from './feel'

// New versions are published as GitHub Releases (scripts/release.sh): tag "v1.2.0" with the signed APK attached.
const REPO = 'Tribhuvan-26/savings-app'
const API = `https://api.github.com/repos/${REPO}/releases`
const SEEN = 'savings.seenVersion'
const Ledger = registerPlugin('Ledger')

/** "1.10.0" > "1.9.2": compare numerically, part by part. */
export const newer = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0)
  return false
}

const json = async url => {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  return res.ok ? res.json() : null
}
const notesOf = r => (r?.body || '').split('\n').map(l => l.replace(/^[#*\-\s]+/, '').trim()).filter(Boolean)

/**
 * Two dialogs about versions:
 *  - "Version X is here": when GitHub has a newer release (checked on launch and whenever the app comes back to the
 *    front). Update downloads in-app and hands it to Android's installer (Updater.kt); data is kept (same signing key).
 *  - "What's new in X": once, the first time you open a version you've just updated to.
 * Both read only public release info from GitHub and send nothing about you. Offline: silently skipped.
 */
export default function UpdateDialogs() {
  const ref = useRef(null)
  const [show, setShow] = useState(null) // { kind: 'update' | 'whatsnew', version, notes, apk? }
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let gone = false
    const check = async () => {
      try {
        const { version } = await Ledger.appInfo()
        // Just updated? Show this version's notes once. (First install: just remember the version.)
        const seen = localStorage.getItem(SEEN)
        localStorage.setItem(SEEN, version)
        if (seen && seen !== version && newer(version, seen)) {
          const r = await json(`${API}/tags/v${version}`)
          if (!gone && r) return setShow({ kind: 'whatsnew', version, notes: notesOf(r) })
        }
        const r = await json(`${API}/latest`)
        const latest = String(r?.tag_name || '').replace(/^v/, '')
        const apk = r?.assets?.find(a => a.name.endsWith('.apk'))?.browser_download_url
        if (gone || !apk || !newer(latest, version) || sessionStorage.getItem('update-later') === latest) return
        setShow(s => s || { kind: 'update', version: latest, notes: notesOf(r), apk })
      } catch { /* offline or rate-limited: try again next time */ }
    }
    check()
    const onShow = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onShow)
    return () => { gone = true; document.removeEventListener('visibilitychange', onShow) }
  }, [])

  useEffect(() => { if (show && !ref.current?.open) ref.current?.showModal() }, [show])

  const close = () => {
    if (show?.kind === 'update') sessionStorage.setItem('update-later', show.version)
    ref.current?.close()
    setShow(null)
    setStatus('')
  }

  // In-app install avoids the browser's "unknown source" path. First time: Android asks to allow
  // "Install unknown apps" for Savings. Anything unexpected: fall back to the browser download.
  const update = async () => {
    tick()
    setStatus('Downloading…')
    try {
      await Ledger.installUpdate({ url: show.apk })
      setStatus('Confirm the update in the Android prompt.')
    } catch (e) {
      if (e.code === 'ALLOW_INSTALLS') return setStatus('Allow "Install unknown apps" for Savings, come back here and tap Update again.')
      setStatus('')
      Ledger.openUrl({ url: show.apk })
    }
  }

  return (
    <dialog ref={ref} className="sheet ver" aria-labelledby="ver-title" onClose={() => setShow(null)}
      onClick={e => e.target === ref.current && close()}>
      {show && (
        <div className="sheet-body">
          <span className="sheet-grip" aria-hidden="true" />
          <p className="ver-badge">{show.kind === 'update' ? <Download size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />} v{show.version}</p>
          <h2 id="ver-title" className="sheet-title">{show.kind === 'update' ? `Version ${show.version} is here` : `What's new in ${show.version}`}</h2>
          {show.notes.length > 0 && <ul className="ver-notes">{show.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
          {status && <p className="ver-status" role="status">{status}</p>}
          {show.kind === 'update' ? (
            <div className="sheet-actions">
              <button type="button" className="sheet-save" onClick={update} disabled={status === 'Downloading…'}>
                {status === 'Downloading…' ? 'Downloading…' : 'Update'}
              </button>
              <button type="button" className="sheet-ghost" onClick={close}>Later</button>
            </div>
          ) : (
            <button type="button" className="sheet-save" onClick={close}>Got it</button>
          )}
        </div>
      )}
    </dialog>
  )
}
