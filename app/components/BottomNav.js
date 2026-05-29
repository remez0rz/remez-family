'use client'
import { usePathname } from 'next/navigation'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'

const NAV_ITEMS = [
  { href: '/',           label: 'בית',     emoji: '🏠' },
  { href: '/missions',   label: 'צוברים',  emoji: '⭐' },
  { href: '/tazkir/new', label: 'תחקיר',   emoji: '📝', center: true },
  { href: '/rewards',    label: 'חוויות',  emoji: '✨' },
  { href: '/feed',       label: 'פיד',     emoji: '📖' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: NAVY, borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', justifyContent: 'space-around',
      padding: '10px 0 16px', zIndex: 100,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href) && !item.center)
        return (
          <a key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', gap: 2,
            color: active ? GOLD : item.center ? GOLD : 'rgba(255,255,255,0.45)',
            fontSize: 10, fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            <span style={{
              ...(item.center ? {
                background: GOLD, borderRadius: '50%',
                width: 44, height: 44, fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -18
              } : { fontSize: 20 })
            }}>{item.emoji}</span>
            {item.label}
          </a>
        )
      })}
    </div>
  )
}