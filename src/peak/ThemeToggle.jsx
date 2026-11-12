import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { getTheme, initTheme, toggleTheme } from './ink/theme'
import { tick } from './feel'

/** Sun/moon button in the header. The ink spreads from where you tapped it. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme)
  useEffect(() => {
    initTheme()
    const on = e => setTheme(e.detail)
    window.addEventListener('savings:theme', on)
    return () => window.removeEventListener('savings:theme', on)
  }, [])
  const dark = theme === 'dark'
  return (
    <button type="button" className="theme-btn" aria-pressed={dark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={e => { tick(); toggleTheme(e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : undefined) }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} className="theme-ico" initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.4, opacity: 0 }} transition={{ duration: 0.25 }}>
          {dark ? <Moon size={22} aria-hidden="true" /> : <Sun size={22} aria-hidden="true" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
