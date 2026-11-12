import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Download, X } from 'lucide-react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { tick } from './feel'

// New versions are published as GitHub Releases (scripts/release.sh): tag "v1.2.0" with the signed APK attached.
const REPO = 'Tribhuvan-26/savings-app'
const Ledger = registerPlugin('Ledger')

/** "1.10.0" > "1.9.2": compare numerically, part by part. */
export const newer = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0)
  return false
}

/**
 * On launch and on return to the app, asks GitHub for the latest release; if it's newer than this install, offers it.
 * Update downloads it in-app and hands it to Android's installer (data kept: same signing key). Sends nothing about
 * you: it's one anonymous public API read. Fails silently offline.
 */
export default function UpdateBanner() {
  const [rel, setRel] = useState(null)
  const [status, setStatus] = useState('') // '', 'Downloading…', or a hint after a problem
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let gone = false
    // Check on launch and whenever the app comes back to the front: Android often resumes the app from the
    // background instead of restarting it, so a launch-only check could miss a release for days.
    const check = async () => {
      try {
        const [{ version }, res] = await Promise.all([
          Ledger.appInfo(),
          fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } }),
        ])
        if (!res.ok) return
        const r = await res.json()
        const latest = String(r.tag_name || '').replace(/^v/, '')
        const apk = r.assets?.find(a => a.name.endsWith('.apk'))?.browser_download_url
        if (gone || !apk || !newer(latest, version)) return
        if (sessionStorage.getItem('update-later') === latest) return
        setRel({ latest, apk, notes: (r.body || '').split('\n').find(l => l.trim()) || '' })
      } catch { /* offline or rate-limited: try again next time */ }
    }
    check()
    const onShow = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onShow)
    return () => { gone = true; document.removeEventListener('visibilitychange', onShow) }
  }, [])

  const later = () => { sessionStorage.setItem('update-later', rel.latest); setRel(null) }
  // Installs in-app (Updater.kt), so Android doesn't re-lock restricted settings the way browser downloads do.
  // First time: Android asks to allow "Install unknown apps" for Savings. Anything else: fall back to the browser.
  const update = async () => {
    tick()
    setStatus('Downloading…')
    try {
      await Ledger.installUpdate({ url: rel.apk })
      setStatus('Confirm the update in the Android prompt')
    } catch (e) {
      if (e.code === 'ALLOW_INSTALLS') return setStatus('Allow "Install unknown apps" for Savings, come back, tap Update again')
      setStatus('')
      Ledger.openUrl({ url: rel.apk })
    }
  }

  return (
    <AnimatePresence>
      {rel && (
        <motion.aside className="update" role="status" aria-live="polite"
          initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
          <div className="update-text">
            <b>Version {rel.latest} is out</b>
            {status ? <span>{status}</span> : rel.notes && <span>{rel.notes.replace(/^[#*\-\s]+/, '')}</span>}
          </div>
          <button type="button" className="update-go" onClick={update} disabled={status === 'Downloading…'}><Download size={18} aria-hidden="true" /> Update</button>
          <button type="button" className="update-x" onClick={later} aria-label="Remind me later"><X size={18} aria-hidden="true" /></button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
