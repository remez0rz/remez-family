'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'
import ViewAsBanner from '../components/ViewAsBanner'
import SpeakButton from '../components/SpeakButton'

const NAVY = '#2D2D2D'
const GOLD = '#FFB830'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'
const CORAL = '#FF6B6B'
const TEAL = '#4ECDC4'
const PAGE_BG = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'
const HEADER_BG = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'

const MISSION_GRADIENTS = [
  ['#FF6B6B','#FF8E53'], ['#4ECDC4','#2EBFB8'],
  ['#9B7FD4','#C084FC'], ['#FFB830','#FFD166'],
  ['#3B9FE8','#60B8FF'], ['#FF6B6B','#FF8E53'],
  ['#4ECDC4','#2EBFB8'], ['#9B7FD4','#C084FC'],
  ['#FFB830','#FFD166'], ['#3B9FE8','#60B8FF'],
]

const CATEGORY_VISUAL = {
  Funny:    { emoji: '😂' }, Creative: { emoji: '🎨' },
  Weekend:  { emoji: '🌅' }, Learning: { emoji: '🧠' },
  Reading:  { emoji: '📖' }, English:  { emoji: '🌍' },
  Hebrew:   { emoji: '✡️' }, Helping:  { emoji: '🤝' },
  Kindness: { emoji: '❤️' }, House:    { emoji: '🏠' },
  Outdoor:  { emoji: '🌿' }, Health:   { emoji: '💪' },
  Family:   { emoji: '👨‍👩‍👧' }, Memory:  { emoji: '📸' },
  Daily:    { emoji: '🌅' },
  Special:  { emoji: '🎁' },
  Mondial:  { emoji: '⚽' },
}

const CATEGORY_LABELS = {
  Family: 'משפחה', Learning: 'לומדים בכיף', Helping: 'עוזרים בבית',
  Creative: 'יצירה', Funny: 'מצחיקים', Outdoor: 'בחוץ',
  Reading: 'קריאה', English: 'אנגלית', Hebrew: 'עברית',
  Kindness: 'מעשים טובים', House: 'הבית שלנו', Memory: 'זיכרונות',
  Health: 'בריאות', Weekend: 'סופ״ש', Daily: 'משימות יומיות', Special: 'פרסים מיוחדים',
  Mondial: 'מונדיאל ⚽',
}

const FILTERS = [
  { id: 'all',      label: 'הכל',           categories: null },
  { id: 'mondial',  label: '⚽ מונדיאל',     categories: ['Mondial'] },
  { id: 'special',  label: '🎁 מיוחדים',    categories: ['Special'], parentOnly: true },
  { id: 'daily',    label: '🌅 יומי',        categories: ['Daily'] },
  { id: 'easy',     label: 'קל ומהיר',      maxPoints: 30 },
  { id: 'family',   label: 'משפחה',         categories: ['Family', 'Memory', 'Weekend'] },
  { id: 'learning', label: 'לומדים',        categories: ['Learning', 'Reading', 'English', 'Hebrew'] },
  { id: 'helping',  label: 'עוזרים',        categories: ['Helping', 'Kindness', 'House'] },
  { id: 'creative', label: 'יצירה',         categories: ['Creative', 'Funny'] },
  { id: 'outdoor',  label: 'בחוץ',          categories: ['Outdoor', 'Health'] },
]

const DIFFICULTY = {
  easy:   { label: 'קל',     color: TEAL },
  medium: { label: 'בינוני', color: '#FFB830' },
  hard:   { label: 'קשה',   color: CORAL },
}

function Avatar({ profile, size = 44, selected = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${selected ? GOLD : '#e0d8c8'}`,
      overflow: 'hidden', flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      background: selected ? '#e8d5a3' : '#f0ebe0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: NAVY,
      boxShadow: selected ? `0 0 0 3px ${GOLD}55` : 'none',
      transition: 'all 0.15s', position: 'relative'
    }}>
      {profile.avatar_url && !imgError
        ? <img src={profile.avatar_url} alt={profile.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : profile.name?.charAt(0)}
      {selected && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          background: GOLD, borderRadius: '50%', width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: NAVY, fontWeight: 900, border: '1.5px solid white'
        }}>✓</div>
      )}
    </div>
  )
}

function MissionFormModal({ mission, profiles = [], onClose, onSaved }) {
  const isNew = !mission?.id
  const CATEGORIES = Object.keys(CATEGORY_LABELS)
  const children = profiles.filter(p => p.role === 'child')
  const [form, setForm] = useState({
    title:             mission?.title             || '',
    description:       mission?.description       || '',
    category:          mission?.category          || 'Family',
    type:              mission?.type              || 'fun',
    points:            mission?.points            || 30,
    difficulty:        mission?.difficulty        || 'easy',
    estimated_minutes: mission?.estimated_minutes || 20,
    repeatable:        mission?.repeatable        ?? false,   // default OFF
    is_active:         mission?.is_active         ?? true,
    proof_type:        'none',
    image_url:         mission?.image_url         || '',
  })
  const [assignTo, setAssignTo]   = useState([])
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `mission-covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('family-media').upload(filename, file, { contentType: file.type })
    if (!error) {
      const { data } = supabase.storage.from('family-media').getPublicUrl(filename)
      setForm(f => ({ ...f, image_url: data.publicUrl }))
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    if (isNew) {
      const { data: created } = await supabase.from('missions').insert(form).select().single()
      if (created && assignTo.length) {
        await supabase.from('assignments').insert(
          assignTo.map(id => ({ mission_id: created.id, assigned_to: id, status: 'active' }))
        )
        fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberIds: assignTo, title: '⭐ אתגר חדש!', body: `${form.title.trim()} — בא לצבור נקודות!`, url: '/missions/active', tag: 'newmission' })
        }).catch(() => {})
      }
    } else {
      await supabase.from('missions').update(form).eq('id', mission.id)
    }
    setSaving(false)
    onSaved()
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #e0d8c8', borderRadius: 10,
    fontSize: 14, color: NAVY, background: '#faf8f4',
    fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', marginBottom: 10, outline: 'none'
  }
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#6b5e4e', display: 'block', marginBottom: 4 }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.88)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px', width: '100%', maxWidth: 480,
        maxHeight: '92vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>
            {isNew ? '+ אתגר חדש' : '✏️ עריכת אתגר'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a09080' }}>✕</button>
        </div>

        <label style={labelStyle}>שם האתגר *</label>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="למשל: קראו ספר 20 דקות" style={inputStyle} />

        <label style={labelStyle}>תיאור</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="פרטים נוספים..." style={inputStyle} />

        <label style={labelStyle}>קטגוריה</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_VISUAL[c]?.emoji} {CATEGORY_LABELS[c] || c}</option>)}
        </select>

        {/* Image section */}
        <label style={labelStyle}>תמונת כרטיס</label>
        <input type="file" accept="image/*" onChange={handleImageUpload}
          style={{ display: 'none' }} id="mission-img-upload" />
        {form.image_url ? (
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <img src={form.image_url} alt="mission cover"
              style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <label htmlFor="mission-img-upload" style={{
                flex: 1, padding: '8px', background: '#f0ebe0', borderRadius: 10,
                textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6b5e4e'
              }}>🔄 החלף תמונה</label>
              <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} style={{
                flex: 1, padding: '8px', background: '#FFE8E8', border: 'none', borderRadius: 10,
                cursor: 'pointer', fontSize: 12, fontWeight: 600, color: CORAL,
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>✕ הסר</button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            <label htmlFor="mission-img-upload" style={{
              display: 'block', padding: '14px', background: '#f0ebe0',
              borderRadius: 12, border: '1.5px dashed #c8bfb0',
              textAlign: 'center', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#6b5e4e',
              marginBottom: 6
            }}>
              {uploading ? '⏳ מעלה...' : '🖼️ העלה תמונה לכרטיס'}
            </label>
            <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              placeholder="או הדבק קישור לתמונה..." style={{ ...inputStyle, marginBottom: 0 }} />
          </div>
        )}

        <label style={labelStyle}>סוג</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[{ id: 'fun', label: '🎉 כיף' }, { id: 'learning', label: '📚 לימוד' }, { id: 'responsibility', label: '🤝 עזרה' }].map(t => (
            <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: form.type === t.id ? NAVY : '#f0ebe0',
              color: form.type === t.id ? 'white' : '#6b5e4e',
              fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-heebo), sans-serif'
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>נקודות</label>
            <input type="number" value={form.points}
              onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>דקות</label>
            <input type="number" value={form.estimated_minutes}
              onChange={e => setForm(f => ({ ...f, estimated_minutes: parseInt(e.target.value) || 0 }))} style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>רמת קושי</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[{ id: 'easy', label: 'קל' }, { id: 'medium', label: 'בינוני' }, { id: 'hard', label: 'קשה' }].map(d => (
            <button key={d.id} onClick={() => setForm(f => ({ ...f, difficulty: d.id }))} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: form.difficulty === d.id ? NAVY : '#f0ebe0',
              color: form.difficulty === d.id ? 'white' : '#6b5e4e',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
            }}>{d.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: NAVY, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.repeatable} onChange={e => setForm(f => ({ ...f, repeatable: e.target.checked }))} />
            אתגר חוזר
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: NAVY, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            אתגר פעיל
          </label>
        </div>

        {isNew && children.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e4e', marginBottom: 8 }}>שלח מיד ל... (לא חובה)</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {children.map(child => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div onClick={() => setAssignTo(prev => prev.includes(child.id) ? prev.filter(x => x !== child.id) : [...prev, child.id])} style={{
                    width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer',
                    border: `2.5px solid ${assignTo.includes(child.id) ? CORAL : '#e0d8c8'}`,
                    background: '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: NAVY,
                    boxShadow: assignTo.includes(child.id) ? `0 0 0 3px ${CORAL}33` : 'none',
                    transition: 'all 0.15s'
                  }}>
                    {child.avatar_url ? <img src={child.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} /> : child.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: assignTo.includes(child.id) ? CORAL : '#a09080' }}>{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
          width: '100%', padding: '14px',
          background: form.title.trim() ? CORAL : '#e0d8c8',
          color: 'white',
          border: 'none', borderRadius: 50,
          cursor: form.title.trim() ? 'pointer' : 'default',
          fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: form.title.trim() ? '0 4px 12px rgba(255,107,107,0.35)' : 'none'
        }}>
          {saving ? 'שומר...' : isNew ? '+ הוסף אתגר' : 'שמור אתגר'}
        </button>
      </div>
    </div>
  )
}

function ParentAssignModal({ mission, profiles, onClose, onAssigned }) {
  const [assignedTo, setAssignedTo] = useState([])
  const [dueDate, setDueDate]       = useState('')
  const [assigning, setAssigning]   = useState(false)
  const [notify, setNotify]         = useState(true)
  const children = profiles.filter(p => p.role === 'child')

  const handleAssign = async () => {
    if (!assignedTo.length) return
    setAssigning(true)
    await supabase.from('assignments').insert(
      assignedTo.map(id => ({
        mission_id: mission.id, assigned_to: id, status: 'active',
        ...(dueDate ? { due_date: dueDate } : {})
      }))
    )
    if (notify && assignedTo.length) {
      const names = assignedTo.map(id => profiles.find(p => p.id === id)?.name).filter(Boolean).join(' ו')
      fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: assignedTo, title: '⭐ אתגר חדש!', body: `${mission.title} — בא לצבור נקודות!`, url: '/missions/active', tag: 'newmission' })
      }).catch(() => {})
    }
    setAssigning(false)
    onAssigned()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.88)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px', width: '100%', maxWidth: 480
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: NAVY }}>שלח אתגר</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a09080' }}>✕</button>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{mission.title}</div>
        <div style={{ fontSize: 12, color: '#8a7a60', marginBottom: 16 }}>מי מקבל את האתגר?</div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          {children.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Avatar profile={p} size={52} selected={assignedTo.includes(p.id)}
                onClick={() => setAssignedTo(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
              <span style={{ fontSize: 11, fontWeight: 600, color: assignedTo.includes(p.id) ? NAVY : '#a09080' }}>{p.name}</span>
            </div>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />
          <span style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>📲 שלח התראה לילד</span>
        </label>

        <div style={{ fontSize: 12, color: '#8a7a60', fontWeight: 600, marginBottom: 6 }}>עד תאריך (לא חובה)</div>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1px solid #e0d8c8', fontSize: 14, color: NAVY,
          fontFamily: 'var(--font-heebo), sans-serif', background: '#faf8f4',
          boxSizing: 'border-box', marginBottom: 16, outline: 'none'
        }} />

        <button onClick={handleAssign} disabled={!assignedTo.length || assigning} style={{
          width: '100%', padding: '13px',
          background: assignedTo.length ? CORAL : '#e0d8c8',
          color: 'white',
          border: 'none', borderRadius: 50, cursor: assignedTo.length ? 'pointer' : 'default',
          fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: assignedTo.length ? '0 4px 12px rgba(255,107,107,0.35)' : 'none'
        }}>
          {assigning ? 'שולח...' : `📤 שלח אתגר${assignedTo.length > 1 ? ` ל-${assignedTo.length}` : ''}`}
        </button>
      </div>
    </div>
  )
}

function ChallengeCard({ mission, index, isParent, currentProfile, onStart, onAssign, onEdit, starting }) {
  const visual    = CATEGORY_VISUAL[mission.category] || { emoji: '⭐' }
  const gradient  = MISSION_GRADIENTS[index % MISSION_GRADIENTS.length]
  const diff      = DIFFICULTY[mission.difficulty] || { label: mission.difficulty, color: GOLD }
  const hasImage  = !!mission.image_url

  return (
    <div style={{ borderRadius: 24, marginBottom: 14, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.1)' }}>

      {/* Visual header */}
      <div style={{
        position: 'relative', height: 180,
        background: hasImage
          ? `url(${mission.image_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      }}>
        {hasImage && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
        )}

        {/* Points badge — top left, compact pill */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, background: 'rgba(0,0,0,0.42)', borderRadius: 20, padding: '4px 11px', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: 'white', lineHeight: 1 }}>{mission.points}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>נק׳</span>
        </div>

        {/* Category — bottom right */}
        <div style={{ position: 'absolute', bottom: 10, right: 12, zIndex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 17, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>{visual.emoji}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 3px rgba(0,0,0,0.6)', letterSpacing: '0.04em' }}>
            {CATEGORY_LABELS[mission.category] || mission.category}
          </span>
        </div>

        {/* Read aloud — bottom left, floating */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2 }}>
          <SpeakButton onBg size={40} text={[mission.title, mission.description]} />
        </div>

        {/* Edit — top right, parent only */}
        {isParent && (
          <button onClick={() => onEdit(mission)} style={{
            position: 'absolute', top: 10, right: 12, zIndex: 1,
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
          }}>✏️</button>
        )}
      </div>

      {/* Card body */}
      <div style={{ background: 'white', padding: '14px 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.3, marginBottom: 4 }}>{mission.title}</div>
        {mission.description && (
          <div style={{ fontSize: 12, color: '#6b5e4e', marginBottom: 8, lineHeight: 1.5 }}>{mission.description}</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#8a7a60' }}>⏱ {mission.estimated_minutes} דק׳</span>
          <span style={{ fontSize: 11, color: diff.color, fontWeight: 600 }}>{diff.label}</span>
          {mission.repeatable && <span style={{ fontSize: 11, color: TEAL }}>🔁 חוזר</span>}
        </div>

        {isParent ? (
          <button onClick={() => onAssign(mission)} style={{
            width: '100%', padding: '11px', background: TEAL, color: 'white',
            border: 'none', borderRadius: 50, cursor: 'pointer',
            fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif'
          }}>📤 שלח לילד</button>
        ) : (
          <button onClick={() => onStart(mission)} disabled={starting === mission.id} style={{
            width: '100%', padding: '12px',
            background: starting === mission.id ? '#e8e0d0' : CORAL,
            color: starting === mission.id ? '#a09080' : 'white',
            border: 'none', borderRadius: 50, whiteSpace: 'nowrap',
            cursor: starting === mission.id ? 'default' : 'pointer',
            fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif',
            boxShadow: starting === mission.id ? 'none' : '0 4px 12px rgba(255,107,107,0.35)'
          }}>
            {starting === mission.id ? 'שולח...' : 'יאללה! ⭐'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function MissionsPage() {
  const [missions, setMissions]             = useState([])
  const [profiles, setProfiles]             = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [rewards, setRewards]               = useState([])
  const [activeMissionIds, setActiveMissionIds]   = useState(new Set())
  const [completedTodayIds, setCompletedTodayIds] = useState(new Set())
  const [allCompletedIds, setAllCompletedIds]     = useState(new Set())
  const [loading, setLoading]               = useState(true)
  const [activeFilter, setActiveFilter]     = useState('all')
  const [showForm, setShowForm]             = useState(false)
  const [editTarget, setEditTarget]         = useState(null)
  const [assignTarget, setAssignTarget]     = useState(null)
  const [starting, setStarting]             = useState(null)
  const [assignedDone, setAssignedDone]     = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const [sortOrder, setSortOrder]           = useState('default')
  const [viewAsId, setViewAsId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const saved = sessionStorage.getItem('viewAsProfileId')
    if (saved) setViewAsId(saved)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadData()
    })
  }, [])

  const loadData = async () => {
    const profile = await getCurrentProfile()
    if (!profile) { router.push('/login'); return }
    setCurrentProfile(profile)

    const targetId = sessionStorage.getItem('viewAsProfileId') || profile.id
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)

    const [{ data: missionData }, { data: profileData }, { data: rewardData }, { data: activeData }, { data: completedData }] = await Promise.all([
      supabase.from('missions').select('*').eq('is_active', true).order('points', { ascending: true }),
      supabase.from('profiles').select('*').eq('active', true),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('assignments').select('mission_id').eq('assigned_to', targetId).eq('status', 'active'),
      supabase.from('assignments').select('mission_id, completed_at').eq('assigned_to', targetId).eq('status', 'completed')
    ])

    if (missionData) setMissions(missionData)
    if (profileData) setProfiles(profileData)
    if (rewardData) setRewards(rewardData)
    if (activeData) setActiveMissionIds(new Set(activeData.map(a => a.mission_id)))
    if (completedData) {
      setAllCompletedIds(new Set(completedData.map(a => a.mission_id)))
      const todayStart2 = new Date(); todayStart2.setHours(0,0,0,0)
      setCompletedTodayIds(new Set(completedData.filter(a => a.completed_at && new Date(a.completed_at) >= todayStart2).map(a => a.mission_id)))
    }
    setLoading(false)
  }

  const handleStart = async (mission) => {
    if (!currentProfile || starting) return
    setStarting(mission.id)
    const targetId = viewAsId || currentProfile.id
    await supabase.from('assignments').insert([{
      mission_id: mission.id, assigned_to: targetId, status: 'active'
    }])
    setStarting(null)
    router.push('/missions/active')
  }

  const handleAssigned = () => {
    setAssignTarget(null)
    setAssignedDone(true)
    loadData()
    setTimeout(() => setAssignedDone(false), 2500)
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditTarget(null)
    loadData()
  }

  const isParent = currentProfile?.role === 'parent'
  const viewAsProfile = viewAsId ? profiles.find(p => p.id === viewAsId) : null
  const isViewingAsKid = isParent && !!viewAsProfile
  const effectiveProfile = viewAsProfile || currentProfile
  const getNextReward = (points) => rewards.find(r => r.points_required > points)
  const next = getNextReward(effectiveProfile?.total_points || 0)

  const q = searchQuery.trim().toLowerCase()

  const filtered = missions.filter(m => {
    // Special (parent-gift) missions: only parents see them, and only in the special filter
    if (m.category === 'Special') {
      if (!isParent || isViewingAsKid) return false
      if (!q && activeFilter !== 'special') return false
      if (q) return (m.title || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
      return true
    }
    if (!isParent || isViewingAsKid) {
      if (activeMissionIds.has(m.id)) return false
      if (m.category === 'Daily') {
        if (completedTodayIds.has(m.id)) return false
      } else {
        if (allCompletedIds.has(m.id)) return false
      }
    }
    // Search overrides category filter
    if (q) return (m.title || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
    const f = FILTERS.find(f => f.id === activeFilter)
    if (!f || f.id === 'all') return m.category !== 'Daily'
    if (f.maxPoints) return m.points <= f.maxPoints && m.category !== 'Daily'
    if (f.categories) return f.categories.includes(m.category)
    return true
  })

  // Apply sort
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (sortOrder === 'points_desc') return b.points - a.points
    if (sortOrder === 'points_asc')  return a.points - b.points
    if (sortOrder === 'newest')      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    if (sortOrder === 'alpha')       return (a.title || '').localeCompare(b.title || '', 'he')
    return 0 // default — keep DB order
  })

  // "New" missions — added in last 14 days (shown in default view, no search)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const newMissions = !q && activeFilter === 'all'
    ? missions.filter(m => {
        if (m.category === 'Special' && (!isParent || isViewingAsKid)) return false
        if (m.category === 'Daily') return false
        if (!isParent || isViewingAsKid) {
          if (activeMissionIds.has(m.id) || allCompletedIds.has(m.id)) return false
        }
        return m.created_at && new Date(m.created_at) > twoWeeksAgo
      })
    : []

  // Section grouping for kid/default view (uses sorted results, excludes new missions already shown)
  const newIds                = new Set(newMissions.map(m => m.id))
  const dailyCategoryMissions = sortedFiltered.filter(m => m.category === 'Daily')
  const familyMissions        = sortedFiltered.filter(m => ['Family','Memory','Weekend'].includes(m.category) && !newIds.has(m.id))
  const learningMissions      = sortedFiltered.filter(m => ['Learning','Reading','English','Hebrew'].includes(m.category) && !newIds.has(m.id))
  const otherMissions         = sortedFiltered.filter(m => !['Daily','Family','Memory','Weekend','Learning','Reading','English','Hebrew'].includes(m.category) && !newIds.has(m.id))
  const topMissions           = sortedFiltered.filter(m => m.category !== 'Daily' && !newIds.has(m.id)).slice(0, 5)

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: PAGE_BG,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <div style={{ color: CORAL, fontSize: 14 }}>טוענים אתגרים...</div>
      </div>
    </div>
  )

  return (
    <div className="app-page" style={{
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: PAGE_BG,
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box'
    }}>

      <ViewAsBanner viewAsProfile={viewAsProfile} />

      {(showForm || editTarget) && (
        <MissionFormModal
          mission={editTarget || null}
          profiles={profiles}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}

      {assignTarget && (
        <ParentAssignModal
          mission={assignTarget}
          profiles={profiles}
          onClose={() => setAssignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}

      {assignedDone && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(10,22,40,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, textAlign: 'center',
          fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
        }}>
          <div style={{ fontSize: 48 }}>📤</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>האתגר נשלח!</div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: HEADER_BG, padding: '20px 16px 0',
        borderRadius: '0 0 24px 24px', marginBottom: 16,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 10, left: 60, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 20, right: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>⭐ צוברים נקודות</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 2, fontWeight: 600 }}>
              {isParent ? 'שלח אתגרים לבני המשפחה' : 'בחרו אתגר קטן וצברו נקודות'}
            </div>
          </div>
        </div>

        {/* Points hero for kids */}
        {(!isParent || isViewingAsKid) && effectiveProfile && (
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>יש לך</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{effectiveProfile.total_points} נק׳</span>
            </div>
            {next && (
              <>
                <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 6, height: 8, marginBottom: 5 }}>
                  <div style={{
                    width: `${Math.min(Math.round((effectiveProfile.total_points / next.points_required) * 100), 100)}%`,
                    height: '100%', background: CORAL, borderRadius: 6
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  כל אתגר קטן מקרב אותך ל{next.title} ✨
                </div>
              </>
            )}
          </div>
        )}


        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חפש אתגר לפי שם..."
            style={{
              width: '100%', padding: '10px 38px 10px 36px',
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 50, color: 'white', fontSize: 14, outline: 'none',
              fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%',
              width: 22, height: 22, color: 'white', cursor: 'pointer',
              fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          )}
        </div>

        {/* Filter chips + sort */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            {FILTERS.filter(f => !f.parentOnly || (isParent && !isViewingAsKid)).map(f => (
              <button key={f.id} onClick={() => { setActiveFilter(f.id); setSearchQuery('') }} style={{
                padding: '7px 14px', borderRadius: 20, border: 'none',
                cursor: 'pointer', flexShrink: 0,
                background: activeFilter === f.id && !searchQuery ? CORAL : 'rgba(255,255,255,0.1)',
                color: activeFilter === f.id && !searchQuery ? 'white' : 'rgba(255,255,255,0.8)',
                fontWeight: activeFilter === f.id && !searchQuery ? 700 : 500,
                fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
              }}>{f.label}</button>
            ))}
          </div>
          {/* Sort — compact icon button (native select overlaid for the menu) */}
          <div style={{ position: 'relative', flexShrink: 0, width: 38, height: 34 }}>
            <div style={{
              width: 38, height: 34, borderRadius: 20,
              background: sortOrder !== 'default' ? CORAL : 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'white', pointerEvents: 'none'
            }}>⇅</div>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} aria-label="מיון"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                opacity: 0, cursor: 'pointer', border: 'none',
                WebkitAppearance: 'none', appearance: 'none',
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>
              <option value="default"     style={{ color: NAVY }}>מיון רגיל</option>
              <option value="newest"      style={{ color: NAVY }}>✨ חדש קודם</option>
              <option value="points_asc"  style={{ color: NAVY }}>⬆ נקודות: מעט</option>
              <option value="points_desc" style={{ color: NAVY }}>⬇ נקודות: הרבה</option>
              <option value="alpha"       style={{ color: NAVY }}>א-ב סדר אלפביתי</option>
            </select>
          </div>
        </div>
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>

        {sortedFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>{q ? '🔍' : '🏆'}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
              {q ? `אין תוצאות עבור "${searchQuery}"` : 'כל הכבוד!'}
            </div>
            <div style={{ fontSize: 13, color: '#8a7a60', marginBottom: 16 }}>
              {q ? 'נסה מילה אחרת' : activeFilter === 'daily' ? 'סיימת את כל המשימות היומיות — חזור מחר!' : 'סיימת את כל האתגרים בקטגוריה הזאת'}
            </div>
            {(q || activeFilter !== 'all') && (
              <button onClick={() => { setActiveFilter('all'); setSearchQuery('') }} style={{ background: CORAL, color: 'white', border: 'none', borderRadius: 50, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif' }}>
                ראה כל האתגרים
              </button>
            )}
          </div>

        ) : q || activeFilter !== 'all' || sortOrder !== 'default' ? (
          // Search / filtered / sorted view — flat list
          <>
            <div style={{ fontSize: 12, color: '#8a7a60', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              {q && <span style={{ background: '#FFF0D5', borderRadius: 20, padding: '2px 10px', color: '#8a5a00', fontWeight: 700 }}>🔍 "{searchQuery}"</span>}
              <span>{sortedFiltered.length} אתגרים</span>
            </div>
            <div className="cards-grid">
            {sortedFiltered.map((mission, i) => (
              <ChallengeCard
                key={mission.id} mission={mission} index={i}
                isParent={isParent && !isViewingAsKid} currentProfile={effectiveProfile}
                onStart={handleStart} onAssign={m => setAssignTarget(m)}
                onEdit={m => setEditTarget(m)} starting={starting}
              />
            ))}
            </div>
          </>
        ) : (
          // Default view — sectioned
          <>
            {/* ✨ חדש — missions added in last 14 days */}
            {newMissions.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>✨ חדש!</div>
                  <div style={{ background: CORAL, color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>נוסף לאחרונה</div>
                </div>
                <div style={{ fontSize: 12, color: '#8a7a60', marginBottom: 12 }}>אתגרים חדשים שנוספו לאחרונה</div>
                <div className="cards-grid">
                {newMissions.map((mission, i) => (
                  <ChallengeCard
                    key={mission.id} mission={mission} index={i}
                    isParent={isParent && !isViewingAsKid} currentProfile={effectiveProfile}
                    onStart={handleStart} onAssign={m => setAssignTarget(m)}
                    onEdit={m => setEditTarget(m)} starting={starting}
                  />
                ))}
                </div>
              </div>
            )}

            {/* משימות יומיות */}
            {dailyCategoryMissions.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 4 }}>🌅 משימות יומיות</div>
                <div style={{ fontSize: 12, color: '#8a7a60', marginBottom: 12 }}>עבודות הבית היומיות — תעשה ותרוויח!</div>
                <div className="cards-grid">
                {dailyCategoryMissions.map((mission, i) => (
                  <ChallengeCard
                    key={mission.id} mission={mission} index={i}
                    isParent={isParent && !isViewingAsKid} currentProfile={effectiveProfile}
                    onStart={handleStart} onAssign={m => setAssignTarget(m)}
                    onEdit={m => setEditTarget(m)} starting={starting}
                  />
                ))}
                </div>
              </div>
            )}

            {/* אתגרי היום */}
            {topMissions.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 4 }}>⭐ אתגרי היום</div>
              <div style={{ fontSize: 12, color: '#8a7a60', marginBottom: 12 }}>האתגרים הקלים שכדאי לעשות היום</div>
              <div className="cards-grid">
              {topMissions.map((mission, i) => (
                <ChallengeCard
                  key={mission.id} mission={mission} index={i}
                  isParent={isParent && !isViewingAsKid} currentProfile={effectiveProfile}
                  onStart={handleStart} onAssign={m => setAssignTarget(m)}
                  onEdit={m => setEditTarget(m)} starting={starting}
                />
              ))}
              </div>
            </div>
            )}

            {/* כיף משפחתי */}
            {familyMissions.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 4 }}>👨‍👩‍👧 כיף משפחתי</div>
                <div style={{ fontSize: 12, color: '#8a7a60', marginBottom: 12 }}>אתגרים שעושים טוב למשפחה</div>
                <div className="cards-grid">
                {familyMissions.map((mission, i) => (
                  <ChallengeCard
                    key={mission.id} mission={mission} index={i + 5}
                    isParent={isParent && !isViewingAsKid} currentProfile={effectiveProfile}
                    onStart={handleStart} onAssign={m => setAssignTarget(m)}
                    onEdit={m => setEditTarget(m)} starting={starting}
                  />
                ))}
                </div>
              </div>
            )}

            {/* לומדים וצוברים */}
            {learningMissions.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 4 }}>🧠 לומדים וצוברים</div>
                <div style={{ fontSize: 12, color: '#8a7a60', marginBottom: 12 }}>דברים קטנים שמגלים, אומרים או מלמדים</div>
                <div className="cards-grid">
                {learningMissions.map((mission, i) => (
                  <ChallengeCard
                    key={mission.id} mission={mission} index={i + 10}
                    isParent={isParent && !isViewingAsKid} currentProfile={effectiveProfile}
                    onStart={handleStart} onAssign={m => setAssignTarget(m)}
                    onEdit={m => setEditTarget(m)} starting={starting}
                  />
                ))}
                </div>
              </div>
            )}

            {/* שאר האתגרים */}
            {otherMissions.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 4 }}>✨ עוד אתגרים</div>
                <div style={{ fontSize: 12, color: '#8a7a60', marginBottom: 12 }}>עוד דרכים לצבור נקודות</div>
                <div className="cards-grid">
                {otherMissions.map((mission, i) => (
                  <ChallengeCard
                    key={mission.id} mission={mission} index={i + 20}
                    isParent={isParent && !isViewingAsKid} currentProfile={effectiveProfile}
                    onStart={handleStart} onAssign={m => setAssignTarget(m)}
                    onEdit={m => setEditTarget(m)} starting={starting}
                  />
                ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky "+ אתגר" for parents */}
      {isParent && !isViewingAsKid && (
        <div style={{ position: 'fixed', bottom: 72, left: 16, zIndex: 40 }}>
          <button onClick={() => setShowForm(true)} style={{
            background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`,
            color: 'white', border: 'none', borderRadius: 50,
            padding: '12px 20px', cursor: 'pointer',
            fontWeight: 900, fontSize: 14,
            fontFamily: 'var(--font-heebo), sans-serif',
            boxShadow: '0 4px 16px rgba(255,107,107,0.5)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>➕ אתגר חדש</button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}