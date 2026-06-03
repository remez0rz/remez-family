'use client'

export default function ViewAsBanner({ viewAsProfile }) {
  if (!viewAsProfile) return null

  const exit = () => {
    sessionStorage.removeItem('viewAsProfileId')
    window.location.reload()
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: 'linear-gradient(90deg, #9B7FD4, #C084FC)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(155,127,212,0.4)',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>👁</span>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>
          מציג כ: {viewAsProfile.name}
        </span>
      </div>
      <button onClick={exit} style={{
        background: 'rgba(255,255,255,0.25)', border: 'none',
        borderRadius: 20, color: 'white', fontSize: 12, fontWeight: 700,
        padding: '5px 14px', cursor: 'pointer',
        fontFamily: 'var(--font-heebo), sans-serif'
      }}>
        חזרה לתצוגת הורה
      </button>
    </div>
  )
}
