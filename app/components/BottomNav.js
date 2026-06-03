'use client'
import { usePathname } from 'next/navigation'

const CORAL = '#FF6B6B'

const NAV_ITEMS = [
  { href: '/',           label: 'בית',        emoji: '🏠' },
  { href: '/missions',   label: 'צוברים',     emoji: '⭐' },
  { href: '/tazkir/new', label: 'תחקיר',      emoji: '📝', center: true },
  { href: '/rewards',    label: 'חוויות',     emoji: '✨' },
  { href: '/feed',       label: 'רגעים',      emoji: '📖' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid #F0EBE0',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
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
            color: active ? CORAL : item.center ? CORAL : '#BBBBBB',
            fontSize: 10, fontFamily: 'var(--font-heebo), sans-serif',
            fontWeight: active ? 700 : 500
          }}>
            <span style={{
              ...(item.center ? {
                background: CORAL, borderRadius: '50%',
                width: 44, height: 44, fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -18, boxShadow: '0 4px 12px rgba(255,107,107,0.4)'
              } : { fontSize: 20 })
            }}>{item.emoji}</span>
            {item.label}
          </a>
        )
      })}
    </div>
  )
}
