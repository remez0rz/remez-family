'use client'
import { usePathname } from 'next/navigation'

const CORAL  = '#FF6B6B'
const GOLD   = '#FFB830'
const NAVY   = '#2D2D2D'

const NAV_ITEMS = [
  { href: '/',                label: 'בית',    emoji: '🏠' },
  { href: '/missions',        label: 'משימות', emoji: '⭐' },
  { href: '/missions/active', label: 'בתהליך', emoji: '🏃', center: true },
  { href: '/rewards',         label: 'פרסים',  emoji: '✨' },
  { href: '/feed',            label: 'רגעים',  emoji: '📖' },
]

export default function BottomNav({ activeMissionCount = 0 }) {
  const pathname = usePathname()

  return (
    <div className="app-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid #F0EBE0',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      zIndex: 100,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
    <div className="app-nav-inner" style={{ display: 'flex', justifyContent: 'space-around' }}>
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href) && !item.center)
        const isCenter = item.center
        const showBadge = isCenter && activeMissionCount > 0
        return (
          <a key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', gap: 2, position: 'relative',
            color: active ? CORAL : '#BBBBBB',
            fontSize: 10, fontFamily: 'var(--font-heebo), sans-serif',
            fontWeight: active ? 700 : 500,
            minWidth: 52
          }}>
            <span style={{
              ...(isCenter ? {
                background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`,
                borderRadius: '50%',
                width: 48, height: 48, fontSize: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -20,
                boxShadow: '0 4px 16px rgba(255,107,107,0.45)',
                border: '3px solid white'
              } : { fontSize: 22, display: 'block', lineHeight: 1 })
            }}>{item.emoji}</span>
            {showBadge && (
              <div style={{
                position: 'absolute', top: -20, right: 4,
                background: GOLD, color: NAVY, borderRadius: '50%',
                width: 18, height: 18, fontSize: 10, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>{activeMissionCount}</div>
            )}
            <span style={{ color: isCenter ? (active ? CORAL : '#888') : undefined }}>
              {item.label}
            </span>
          </a>
        )
      })}
    </div>
    </div>
  )
}
