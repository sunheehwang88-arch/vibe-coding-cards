import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems.js'

const MOBILE_ITEMS = NAV_ITEMS.filter((item) => !item.desktopOnly)

export default function TabBar() {
  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-20 grid h-14 grid-cols-5 border-t border-border bg-bg md:hidden"
    >
      {MOBILE_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-tab font-medium transition-colors duration-150 ${
              isActive ? 'text-fg' : 'text-fg-subtle'
            }`
          }
        >
          <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
