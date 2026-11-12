import { useEffect } from 'react'
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { LedgerProvider, isNative, useLedger } from './data'
import { LogoMark } from './fun'
import Dock from './peak/Dock'
import Home from './pages/Home'
import Activity from './pages/Activity'
import Jar from './pages/Jar'
import Budget from './pages/Budget'
import Settings from './pages/Settings'

const PAGES = [
  ['/', 'Home', Home],
  ['/activity', 'Activity', Activity],
  ['/jar', 'Jar', Jar],
  ['/budget', 'Budget', Budget],
  ['/settings', 'Settings', Settings],
]

function Shell() {
  const loc = useLocation()
  const { s, smsAccess } = useLedger()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])

  return (
    <>
      <header className="site-head">
        <div className="wrap head-row">
          <Link to="/" className="logo" aria-label="Savings home">
            <LogoMark size={48} className="logo-art" />
            <span>SAVINGS<span className="caret" aria-hidden="true">_</span></span>
          </Link>
          <nav className="nav" aria-label="Main">
            {PAGES.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className="nav-link">{label}</NavLink>
            ))}
          </nav>
          <div className="head-cta">
            <Link to="/settings" className={`live-pill ${isNative && smsAccess ? 'is-live' : ''}`}>
              <span className="status-dot" aria-hidden="true" />
              {isNative && smsAccess ? 'Auto-sync on' : 'Not connected'}
            </Link>
          </div>
        </div>
      </header>

      {!isNative && (
        <p className="app-banner">
          <span className="wrap">Real transactions appear in the Android app, which reads your bank SMS automatically. This browser has no access to SMS.</span>
        </p>
      )}

      <main>
        {s ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            >
              <Routes location={loc}>
                {PAGES.map(([path, , Page]) => <Route key={path} path={path} element={<Page />} />)}
              </Routes>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="loader" role="status"><span className="sr">Loading</span></div>
        )}
      </main>

      <footer className="site-foot">
        <div className="wrap">
          <p className="foot-word" aria-hidden="true">SAVINGS<span>●</span></p>
          <div className="foot-row">
            <p>Every payment logged. Every rupee rounded up.</p>
            <nav aria-label="Footer">
              {PAGES.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
            </nav>
          </div>
        </div>
      </footer>
      <Dock pages={PAGES} />
    </>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LedgerProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </LedgerProvider>
    </MotionConfig>
  )
}
