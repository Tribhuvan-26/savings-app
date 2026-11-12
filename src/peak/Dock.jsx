import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Gauge, House, PiggyBank, ReceiptText, SlidersHorizontal } from 'lucide-react'
import { tick } from './feel'

const ICONS = { '/': House, '/activity': ReceiptText, '/jar': PiggyBank, '/budget': Gauge, '/settings': SlidersHorizontal }

/** Thumb-reach navigation for phones: a floating dock, the red pill slides to where you are. */
export default function Dock({ pages }) {
  const { pathname } = useLocation()
  return (
    <nav className="dock" aria-label="Main">
      {pages.map(([to, label]) => {
        const Icon = ICONS[to]
        const on = to === '/' ? pathname === '/' : pathname.startsWith(to)
        return (
          <NavLink key={to} to={to} end={to === '/'} className={`dock-item${on ? ' is-on' : ''}`} onClick={tick}>
            {on && <motion.span layoutId="dock-pill" className="dock-pill" transition={{ type: 'spring', stiffness: 520, damping: 36 }} />}
            <motion.span className="dock-ico" animate={{ y: on ? -2 : 0, scale: on ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 600, damping: 30 }}>
              <Icon size={22} strokeWidth={on ? 2.4 : 2} aria-hidden="true" />
            </motion.span>
            <span className="dock-label">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
