'use client'

// Compact circular icon button for page headers (white-on-translucent, sits on a
// colored header). Shared so every page's header looks and behaves the same.
export default function HeaderIconButton({ children, onClick, active = false, label, badge }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        position: 'relative',
        width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: active ? '#FFB830' : 'rgba(255,255,255,0.18)',
        color: 'white', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? '0 2px 10px rgba(255,184,48,0.5)' : 'none',
        fontFamily: 'var(--font-heebo), sans-serif',
      }}
    >
      {children}
      {badge ? (
        <span style={{
          position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16,
          padding: '0 4px', borderRadius: 10, background: '#FF6B6B', color: 'white',
          fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white'
        }}>{badge}</span>
      ) : null}
    </button>
  )
}
