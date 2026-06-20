'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'
import ViewAsBanner from '../components/ViewAsBanner'
import SpeakButton from '../components/SpeakButton'
import PendingApprovals from '../components/PendingApprovals'
import { phrases } from '../lib/hebrew'

const NAVY   = '#2D2D2D'
const GOLD   = '#FFB830'
const CORAL  = '#FF6B6B'
const TEAL   = '#4ECDC4'
const PAGE_BG   = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'
const HEADER_BG = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'

const TYPE_CONFIG = {
  experience: { label: 'חוויה', bg: '#FFF0D5', color: '#CC8800' },
  gift:       { label: 'מתנה',  bg: '#FFE8E8', color: CORAL },
  privilege:  { label: 'כוח',   bg: '#EDE7F6', color: '#9B7FD4' },
}

const TIER_FILTERS = [
  { id: 'all',    label: 'הכל ✨',       min: 0,   max: Infinity },
  { id: 'small',  label: 'קטנים 🌱',    min: 0,   max: 59 },
  { id: 'medium', label: 'בינוניים ⭐',  min: 60,  max: 149 },
  { id: 'large',  label: 'גדולים 🎉',   min: 150, max: 399 },
  { id: 'dream',  label: 'חלומות 🌟',   min: 400, max: Infinity },
]

const TYPE_FILTERS = [
  { id: 'all',        label: 'הכל' },
  { id: 'privilege',  label: 'כוחות 👑' },
  { id: 'experience', label: 'חוויות 🎡' },
  { id: 'gift',       label: 'מתנות 🎁' },
]

const REWARD_GRADIENTS = [
  ['#FF6B6B', '#FF8E53'], ['#4ECDC4', '#2EBFB8'],
  ['#9B7FD4', '#C084FC'], ['#FFB830', '#FFD166'],
  ['#3B9FE8', '#60B8FF'], ['#FF6B6B', '#FF8E53'],
  ['#4ECDC4', '#2EBFB8'], ['#9B7FD4', '#C084FC'],
  ['#FFB830', '#FFD166'], ['#3B9FE8', '#60B8FF'],
]

function Avatar({ profile, size = 44, selected = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${selected ? 'white' : 'rgba(255,255,255,0.3)'}`,
      overflow: 'hidden', flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      background: '#FFD5E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: CORAL,
      boxShadow: selected ? '0 0 0 3px rgba(255,255,255,0.4)' : 'none',
      transition: 'all 0.15s'
    }}>
      {profile.avatar_url && !imgError
        ? <img src={profile.avatar_url} alt={profile.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : profile.name?.charAt(0)}
    </div>
  )
}

function ExperienceCard({ reward, index, currentPoints, currentLevel, isParent, onClaim, onEdit }) {
  const levelOk   = currentLevel >= (reward.level_required || 1)
  const canAfford = currentPoints >= reward.points_required
  const unlocked  = levelOk && canAfford
  const progress  = levelOk
    ? Math.min(Math.round((currentPoints / reward.points_required) * 100), 100)
    : 0
  const config    = TYPE_CONFIG[reward.type] || TYPE_CONFIG.experience
  const gradient  = REWARD_GRADIENTS[index % REWARD_GRADIENTS.length]

  return (
    <div style={{
      borderRadius: 24, marginBottom: 14, overflow: 'hidden',
      boxShadow: unlocked ? '0 6px 24px rgba(255,107,107,0.2)' : '0 4px 20px rgba(0,0,0,0.07)',
      opacity: levelOk ? 1 : 0.65
    }}>
      <div style={{
        background: reward.image_url
          ? `url(${reward.image_url}) center/cover`
          : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        height: 180, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {reward.image_url && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.05))' }} />}
        {!levelOk && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '8px 16px', color: 'white', fontSize: 13, fontWeight: 800 }}>
              🔒 פתוח ברמה {reward.level_required}
            </div>
          </div>
        )}

        {/* Points pill — top right */}
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1, background: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: '4px 11px', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: 'white', lineHeight: 1 }}>{reward.points_required}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>נק׳</span>
        </div>

        {/* Available badge — top left */}
        {unlocked && (
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, background: '#FFD166', color: '#5a4500', borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 900 }}>זמין! ✨</div>
        )}

        {/* Hero emoji (shown when there is no cover image) */}
        {!reward.image_url && (
          <div style={{ fontSize: 58, position: 'relative', zIndex: 1, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.25))' }}>{reward.emoji || '✨'}</div>
        )}

        {/* Read aloud — bottom left, floating */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 3 }}>
          <SpeakButton onBg size={42} text={[reward.title, reward.description]} />
        </div>
      </div>

      <div style={{ background: 'white', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1.25 }}>{reward.title}</div>
            {reward.description && (
              <div style={{ fontSize: 12, color: '#888888', marginTop: 4, lineHeight: 1.5 }}>{reward.description}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: config.bg, color: config.color, whiteSpace: 'nowrap' }}>
              {config.label}
            </span>
            {isParent && (
              <button onClick={() => onEdit(reward)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 11, color: '#BBBBBB', padding: '2px 6px',
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>✏️ עריכה</button>
            )}
          </div>
        </div>

        {levelOk && (
          <div style={{ background: '#F0EBE0', borderRadius: 8, height: 8, marginBottom: 8 }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: unlocked ? GOLD : '#C8BFB0',
              borderRadius: 8, transition: 'width 0.4s ease',
              boxShadow: unlocked ? `0 2px 6px ${GOLD}66` : 'none'
            }} />
          </div>
        )}

        {levelOk && !canAfford && (
          <div style={{ fontSize: 11, color: '#AAAAAA', marginBottom: 8 }}>
            עוד {reward.points_required - currentPoints} נקודות · {progress}% מהדרך
          </div>
        )}

        {unlocked && !isParent && (
          <button onClick={() => onClaim(reward)} style={{
            width: '100%', padding: '13px', background: CORAL, color: 'white',
            border: 'none', borderRadius: 50, cursor: 'pointer',
            fontWeight: 800, fontSize: 14, marginTop: 4, whiteSpace: 'nowrap',
            fontFamily: 'var(--font-heebo), sans-serif',
            boxShadow: '0 4px 12px rgba(255,107,107,0.35)'
          }}>רוצה! ✨</button>
        )}

        {unlocked && isParent && (
          <div style={{ textAlign: 'center', padding: '10px', background: '#D5F5F0', borderRadius: 12, color: TEAL, fontWeight: 700, fontSize: 13, marginTop: 4 }}>
            החוויה פתוחה ✓
          </div>
        )}
      </div>
    </div>
  )
}

function ExperienceFormModal({ reward, onClose, onSaved }) {
  const isNew = !reward?.id
  const [form, setForm] = useState({
    title:           reward?.title           || '',
    description:     reward?.description     || '',
    points_required: reward?.points_required || 100,
    type:            reward?.type            || 'experience',
    emoji:           reward?.emoji           || '✨',
    image_url:       reward?.image_url       || '',
    is_active:       reward?.is_active       ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    if (isNew) {
      await supabase.from('rewards').insert(form)
    } else {
      await supabase.from('rewards').update(form).eq('id', reward.id)
    }
    setSaving(false)
    onSaved()
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #EDE8E0', borderRadius: 14,
    fontSize: 14, color: NAVY, background: '#FAFAF8',
    fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', marginBottom: 12, outline: 'none'
  }
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#888888', display: 'block', marginBottom: 5 }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{ background: 'white', borderRadius: '28px 28px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>{isNew ? '+ חוויה חדשה' : '✏️ עריכת חוויה'}</div>
          <button onClick={onClose} style={{ background: '#F0EBE0', border: 'none', fontSize: 16, cursor: 'pointer', color: '#888', borderRadius: '50%', width: 32, height: 32 }}>✕</button>
        </div>

        <label style={labelStyle}>שם החוויה</label>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="למשל: גלידה משפחתית" style={inputStyle} />

        <label style={labelStyle}>תיאור קצר</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="מה מקבלים כשפותחים את החוויה?" style={inputStyle} />

        <label style={labelStyle}>כמה נקודות צריך כדי לפתוח?</label>
        <input type="number" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: parseInt(e.target.value) || 0 }))} style={{ ...inputStyle, width: 120 }} />

        <label style={labelStyle}>סוג החוויה</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {Object.entries(TYPE_CONFIG).map(([key, val]) => (
            <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))} style={{
              flex: 1, padding: '9px', borderRadius: 50, border: 'none', cursor: 'pointer',
              background: form.type === key ? CORAL : '#F0EBE0',
              color: form.type === key ? 'white' : '#888888',
              fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-heebo), sans-serif',
              transition: 'all 0.15s'
            }}>{val.label}</button>
          ))}
        </div>

        <label style={labelStyle}>אייקון</label>
        <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="✨" style={{ ...inputStyle, width: 80, textAlign: 'center', fontSize: 24 }} />

        <label style={labelStyle}>קישור לתמונה (לא חובה)</label>
        <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." style={inputStyle} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} id="is_active" />
          <label htmlFor="is_active" style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>חוויה פעילה</label>
        </div>

        <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
          width: '100%', padding: '15px',
          background: form.title.trim() ? CORAL : '#E0D8C8',
          color: form.title.trim() ? 'white' : '#AAAAAA',
          border: 'none', borderRadius: 50, cursor: form.title.trim() ? 'pointer' : 'default',
          fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: form.title.trim() ? '0 4px 12px rgba(255,107,107,0.3)' : 'none'
        }}>
          {saving ? 'שומר...' : isNew ? '+ הוסף חוויה' : 'שמור חוויה'}
        </button>
      </div>
    </div>
  )
}

function UnlockModal({ reward, profile, onClose, onClaimed }) {
  const [claiming, setClaiming] = useState(false)

  const handleClaim = async () => {
    setClaiming(true)
    const { error } = await supabase.from('reward_claims').insert({
      reward_id: reward.id, member_id: profile.id,
      status: 'claimed', claimed_at: new Date().toISOString()
    })
    setClaiming(false)
    if (!error) {
      // Notify parents about claim
      const { data: parents } = await supabase.from('profiles').select('id').eq('role', 'parent').eq('active', true)
      if (parents?.length) {
        fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberIds: parents.map(p => p.id), title: '✨ בקשת פרס חדשה', body: `${profile.name} רוצה: ${reward.emoji || ''} ${reward.title}`, url: '/rewards', tag: 'rewardclaim' })
        }).catch(() => {})
      }
      onClaimed()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{ background: 'white', borderRadius: 28, padding: '32px 24px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{reward.emoji || '✨'}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: NAVY, marginBottom: 8 }}>{reward.title}</div>
        <div style={{ fontSize: 13, color: '#888888', marginBottom: 10, lineHeight: 1.5 }}>
          {profile.name} רוצה לפתוח את החוויה הזאת
        </div>
        <div style={{ background: '#FFF0D5', borderRadius: 16, padding: '12px 16px', marginBottom: 24, fontSize: 15, color: '#CC8800', fontWeight: 800 }}>
          {reward.points_required} נקודות 🌟
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleClaim} disabled={claiming} style={{
            padding: '14px', background: CORAL, border: 'none', borderRadius: 50,
            cursor: 'pointer', fontWeight: 800, fontSize: 15, color: 'white',
            fontFamily: 'var(--font-heebo), sans-serif',
            boxShadow: '0 4px 12px rgba(255,107,107,0.35)'
          }}>{claiming ? 'שולח...' : 'כן, בא לי לפתוח ✨'}</button>
          <button onClick={onClose} style={{
            padding: '11px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13, color: '#BBBBBB',
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>אולי אחר כך</button>
        </div>
      </div>
    </div>
  )
}

function PendingClaimsSection({ claims, profiles, rewards, onApprove, onRedeem }) {
  if (!claims.length) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 12 }}>
        ⏳ ממתינות לאישורך
      </div>
      {claims.map(claim => {
        const profile = profiles.find(p => p.id === claim.member_id)
        const reward  = rewards.find(r => r.id === claim.reward_id)
        if (!profile || !reward) return null

        return (
          <div key={claim.id} style={{
            background: 'white', borderRadius: 20, padding: '16px 18px',
            boxShadow: '0 4px 16px rgba(255,107,107,0.12)',
            border: '1.5px solid #FFD5D5', marginBottom: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 36 }}>{reward.emoji || '✨'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{reward.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: `1.5px solid ${CORAL}`, overflow: 'hidden',
                    background: '#FFD5E8', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10, fontWeight: 700, color: CORAL
                  }}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : profile.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: 12, color: '#888888', fontWeight: 600 }}>{profile.name} רוצה לפתוח</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', background: '#FFF0D5', borderRadius: 12, padding: '6px 12px' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#CC8800' }}>{reward.points_required}</div>
                <div style={{ fontSize: 10, color: '#CC8800', fontWeight: 600 }}>נק׳</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onApprove(claim)} style={{
                flex: 1, padding: '11px', background: CORAL, color: 'white',
                border: 'none', borderRadius: 50, cursor: 'pointer',
                fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif',
                boxShadow: '0 4px 10px rgba(255,107,107,0.3)'
              }}>✓ אשר ופתח</button>
              <button onClick={() => onRedeem(claim)} style={{
                flex: 1, padding: '11px', background: 'white', color: '#AAAAAA',
                border: '1.5px solid #EDE8E0', borderRadius: 50, cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
              }}>✕ דחה</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KidClaimsSection({ claims, onRedeem }) {
  if (!claims.length) return null
  const pending  = claims.filter(c => c.status === 'claimed')
  const approved = claims.filter(c => c.status === 'approved')
  if (!pending.length && !approved.length) return null

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 12 }}>🎁 הבקשות שלי</div>

      {approved.map(c => (
        <div key={c.id} style={{
          background: 'linear-gradient(135deg, #f0faf8, #e8f5f0)',
          borderRadius: 20, padding: '16px 18px', marginBottom: 10,
          border: '2px solid #4ECDC4', boxShadow: '0 4px 16px rgba(78,205,196,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 36 }}>{c.reward?.emoji || '✨'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{c.reward?.title}</div>
              <div style={{ fontSize: 11, color: '#4ECDC4', fontWeight: 700, marginTop: 2 }}>✅ אושר על ידי ההורים!</div>
            </div>
          </div>
          <button onClick={() => onRedeem(c)} style={{
            width: '100%', marginTop: 12, padding: '12px',
            background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`,
            color: 'white', border: 'none', borderRadius: 50, cursor: 'pointer',
            fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif',
            boxShadow: '0 4px 12px rgba(255,107,107,0.35)'
          }}>🎉 ממשתי! תודה</button>
        </div>
      ))}

      {pending.map(c => (
        <div key={c.id} style={{
          background: 'white', borderRadius: 20, padding: '14px 18px', marginBottom: 10,
          border: '1.5px solid #EDE8E0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ fontSize: 28 }}>{c.reward?.emoji || '✨'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{c.reward?.title}</div>
            <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 2 }}>⏳ מחכה לאישור ההורים...</div>
          </div>
          <div style={{ background: '#FFF0D5', borderRadius: 12, padding: '6px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#CC8800' }}>{c.reward?.points_required}</div>
            <div style={{ fontSize: 9, color: '#CC8800', fontWeight: 600 }}>נק׳</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Shown after a child taps "ממשתי!" — capture the experience as a feed moment.
function RewardDocModal({ claim, member, uploading, onSubmit, onSkip, onClose }) {
  const [text, setText]       = useState('')
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [isVideo, setIsVideo] = useState(false)

  const handleSelect = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f); setIsVideo(f.type.startsWith('video/')); setPreview(URL.createObjectURL(f))
    e.target.value = ''
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,22,40,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', padding: 16 }}>
      <div style={{ background: '#2D2D2D', borderRadius: 28, padding: '24px 20px', maxWidth: 360, width: '100%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 14 }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>{claim.reward?.emoji || '🎉'}</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: 'white', marginBottom: 4 }}>איך היה?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{claim.reward?.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>שתפו רגע מהחוויה — זה ייכנס ליומן המשפחתי 💜</div>
        </div>

        <input type="file" accept="image/*" capture="environment" onChange={handleSelect} style={{ display: 'none' }} id="rw-cam-photo" />
        <input type="file" accept="video/*" capture="environment" onChange={handleSelect} style={{ display: 'none' }} id="rw-cam-video" />
        <input type="file" accept="image/*,video/*" onChange={handleSelect} style={{ display: 'none' }} id="rw-gal" />

        {preview ? (
          <div style={{ position: 'relative', marginBottom: 10 }}>
            {isVideo
              ? <video src={preview} controls style={{ width: '100%', borderRadius: 12, maxHeight: 160, display: 'block' }} />
              : <img src={preview} alt="p" style={{ width: '100%', borderRadius: 12, maxHeight: 160, objectFit: 'cover', display: 'block' }} />}
            <button onClick={() => { setFile(null); setPreview(null); setIsVideo(false) }} style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: 'white', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <label htmlFor="rw-cam-photo" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>📷<br/>תמונה</label>
            <label htmlFor="rw-cam-video" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>🎬<br/>סרטון</label>
            <label htmlFor="rw-gal" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>🖼️<br/>גלריה</label>
          </div>
        )}

        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="כמה מילים על החוויה... (לא חובה)"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 13, color: 'white', background: 'rgba(255,255,255,0.08)', fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', resize: 'none', minHeight: 56, lineHeight: 1.5, marginBottom: 12, outline: 'none' }} />

        <button onClick={() => onSubmit({ text, file })} disabled={uploading} style={{ width: '100%', padding: '13px', background: '#FF6B6B', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 800, fontSize: 15, color: 'white', fontFamily: 'var(--font-heebo), sans-serif', marginBottom: 8 }}>
          {uploading ? 'שולח...' : 'שתף ליומן 🎉'}
        </button>
        <button onClick={onSkip} disabled={uploading} style={{ width: '100%', padding: '9px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heebo), sans-serif' }}>דלג (בלי שיתוף)</button>
      </div>
    </div>
  )
}

export default function ExperiencesPage() {
  const [rewards, setRewards]               = useState([])
  const [profiles, setProfiles]             = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [pendingClaims, setPendingClaims]   = useState([])
  const [myClaims, setMyClaims]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [claimTarget, setClaimTarget]       = useState(null)
  const [editTarget, setEditTarget]         = useState(null)
  const [showNewForm, setShowNewForm]       = useState(false)
  const [claimed, setClaimed]               = useState(false)
  const [activeTier, setActiveTier]         = useState('all')
  const [viewAsId, setViewAsId]             = useState(null)
  const [redeemTarget, setRedeemTarget]     = useState(null)
  const [redeemUploading, setRedeemUploading] = useState(false)
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

    const [{ data: rewardData }, { data: profileData }, { data: claimData }, { data: myClaimData }] = await Promise.all([
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('profiles').select('*').eq('active', true).order('created_at'),
      supabase.from('reward_claims').select('*').eq('status', 'claimed'),
      supabase.from('reward_claims')
        .select('*, reward:rewards(title, emoji, description, points_required)')
        .eq('member_id', sessionStorage.getItem('viewAsProfileId') || profile.id)
        .in('status', ['claimed', 'approved'])
        .order('claimed_at', { ascending: false })
    ])

    if (rewardData) setRewards(rewardData)
    if (profileData) {
      setProfiles(profileData)
      if (profile.role === 'child') {
        setSelectedMember(profileData.find(p => p.id === profile.id))
      } else {
        setSelectedMember(profileData.find(p => p.role === 'child') || profileData[0])
      }
    }
    if (claimData) setPendingClaims(claimData)
    if (myClaimData) setMyClaims(myClaimData)
    setLoading(false)
  }

  // BUG FIX: deduct points when parent approves a reward claim
  const handleApprove = async (claim) => {
    const reward = rewards.find(r => r.id === claim.reward_id)
    const member = profiles.find(p => p.id === claim.member_id)

    // Guard against double-approval (two parents, or a double-tap): only flip a
    // claim that is still 'claimed', and only deduct points if THIS call is the
    // one that actually changed it. Otherwise the deduction could apply twice.
    const { data: approved } = await supabase.from('reward_claims').update({
      status: 'approved',
      approved_by: currentProfile.id,
    }).eq('id', claim.id).eq('status', 'claimed').select()

    if (!approved?.length) { loadData(); return }

    if (reward && member) {
      // Spend points atomically. XP/level are untouched (p_xp_delta: 0) — spending
      // a balance shouldn't lower lifetime experience or rank.
      await supabase.rpc('apply_points', {
        p_member_id: claim.member_id,
        p_points: -reward.points_required,
        p_xp_delta: 0,
        p_reason: `פתח חוויה: ${reward.title}`,
      })
    }

    // Push notification to kid
    if (reward) {
      fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: [claim.member_id], title: '🎉 הפרס אושר!', body: `${reward.emoji || '✨'} ${reward.title} — אפשר לממש!`, url: '/rewards', tag: 'rewardapproved' })
      }).catch(() => {})
    }

    loadData()
  }

  const handleReject = async (claim) => {
    await supabase.from('reward_claims').update({ status: 'rejected' }).eq('id', claim.id)
    loadData()
  }

  const handleClaimed = () => {
    setClaimTarget(null)
    setClaimed(true)
    setTimeout(() => { setClaimed(false); loadData() }, 2500)
  }

  // Tapping "ממשתי!" opens the documentation modal instead of redeeming silently.
  const handleMarkRedeemed = (claim) => setRedeemTarget(claim)

  const finishRedeem = async (claimId) => {
    await supabase.from('reward_claims').update({
      status: 'redeemed', redeemed_at: new Date().toISOString()
    }).eq('id', claimId)
    setMyClaims(prev => prev.filter(c => c.id !== claimId))
    setRedeemTarget(null)
    setRedeemUploading(false)
  }

  // Skip documentation — just mark it redeemed.
  const skipRedeem = () => { if (redeemTarget) finishRedeem(redeemTarget.id) }

  // Document the experience → upload media, redeem, and post a feed moment.
  const submitRedeem = async ({ text, file }) => {
    if (!redeemTarget) return
    setRedeemUploading(true)
    const claim  = redeemTarget
    const member = effectiveMember

    let mediaUrl = null
    if (file) {
      const ext = file.name.split('.').pop()
      const filename = `rewards/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(filename, file, { contentType: file.type })
      if (!error) mediaUrl = supabase.storage.from('family-media').getPublicUrl(filename).data.publicUrl
    }

    if (member) {
      await supabase.from('feed_posts').insert({
        type: 'reward_redeemed',
        title: `${member.name} ${phrases.enjoyed(member.gender)} מ${claim.reward?.title || 'חוויה'}! ${claim.reward?.emoji || '🎉'}`,
        content: text?.trim() || null,
        media_urls: mediaUrl ? [mediaUrl] : [],
        participants: [member.name],
        linked_type: 'reward_claim',
        linked_id: claim.id,
        created_by: member.id,
      })

      // Let grandparents know there's a new moment to enjoy — with the photo as a
      // hero image and the child's avatar as the notification icon when available.
      const { data: gps } = await supabase.from('profiles').select('id').eq('role', 'grandparent').eq('active', true)
      const ids = (gps || []).map(g => g.id)
      if (ids.length) {
        const photo = (file && file.type.startsWith('image/')) ? mediaUrl : null
        fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberIds: ids, title: '💜 רגע חדש מהמשפחה', body: `${member.name} ${phrases.shared(member.gender)} רגע חדש`, url: '/feed', tag: 'share', image: photo, icon: member.avatar_url || undefined })
        }).catch(() => {})
      }
    }

    await finishRedeem(claim.id)
  }

  const handleSaved = () => {
    setEditTarget(null)
    setShowNewForm(false)
    loadData()
  }

  const isParent      = currentProfile?.role === 'parent'
  const viewAsProfile = viewAsId ? profiles.find(p => p.id === viewAsId) : null
  const isViewingAsKid = isParent && !!viewAsProfile
  const children      = profiles.filter(p => p.role === 'child')
  // When viewing as a kid, show that kid's data
  const effectiveMember = isViewingAsKid ? viewAsProfile : selectedMember
  const currentPoints = effectiveMember?.total_points || 0
  const currentLevel  = effectiveMember?.level || 1
  const currentXP     = effectiveMember?.total_experience || currentPoints
  const nextReward    = rewards.find(r => r.points_required > currentPoints && currentLevel >= (r.level_required || 1))
  const unlockedCount = rewards.filter(r => currentPoints >= r.points_required && currentLevel >= (r.level_required || 1)).length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG, fontFamily: 'var(--font-heebo), sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
        <div style={{ color: CORAL, fontSize: 16, fontWeight: 700 }}>טוענים חוויות...</div>
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

      {claimTarget && (
        <UnlockModal reward={claimTarget} profile={effectiveMember}
          onClose={() => setClaimTarget(null)} onClaimed={handleClaimed} />
      )}

      {redeemTarget && (
        <RewardDocModal
          claim={redeemTarget}
          member={effectiveMember}
          uploading={redeemUploading}
          onSubmit={submitRedeem}
          onSkip={skipRedeem}
          onClose={() => !redeemUploading && setRedeemTarget(null)}
        />
      )}

      {(editTarget || showNewForm) && (
        <ExperienceFormModal
          reward={editTarget || null}
          onClose={() => { setEditTarget(null); setShowNewForm(false) }}
          onSaved={handleSaved}
        />
      )}

      {claimed && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', flexDirection: 'column',
          gap: 12, textAlign: 'center',
          fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
        }}>
          <div style={{ fontSize: 64 }}>🎉</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>איזה כיף! הבקשה נשלחה</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>מחכים לאישור ההורים</div>
        </div>
      )}

      {/* Header — compact: title + actions, member selector, tier filters */}
      <div style={{ background: HEADER_BG, padding: '14px 16px 12px', borderRadius: '0 0 24px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>✨ חוויות</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isParent && !isViewingAsKid && pendingClaims.length > 0 && (
              <div style={{ background: 'white', color: CORAL, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 800 }}>⏳ {pendingClaims.length}</div>
            )}
            {isParent && !isViewingAsKid && (
              <button onClick={() => setShowNewForm(true)} style={{
                background: 'white', color: CORAL, border: 'none', borderRadius: 50,
                padding: '8px 14px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--font-heebo), sans-serif', whiteSpace: 'nowrap',
                boxShadow: '0 3px 10px rgba(255,107,107,0.35)'
              }}>＋ חוויה</button>
            )}
          </div>
        </div>

        {/* Member selector (parents) */}
        {!isViewingAsKid && (isParent ? children : [currentProfile]).filter(Boolean).length > 1 && (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', position: 'relative', zIndex: 1, marginTop: 12 }}>
          {(isParent ? children : [currentProfile]).filter(Boolean).map(p => (
            <div key={p.id} onClick={() => setSelectedMember(p)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
              <Avatar profile={p} size={40} selected={selectedMember?.id === p.id} />
              <span style={{ fontSize: 11, fontWeight: 700, color: selectedMember?.id === p.id ? 'white' : 'rgba(255,255,255,0.6)' }}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
        )}

        {/* Tier filters */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', position: 'relative', zIndex: 1, marginTop: 12 }}>
          {TIER_FILTERS.map(f => (
            <button key={f.id} onClick={() => setActiveTier(f.id)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: activeTier === f.id ? 'white' : 'rgba(255,255,255,0.18)',
              color: activeTier === f.id ? CORAL : 'white',
              fontWeight: activeTier === f.id ? 800 : 500,
              fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif',
              boxShadow: activeTier === f.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>

        {isParent && !isViewingAsKid && (
          <PendingApprovals kind="reward" onChange={loadData} />
        )}

        {isParent && !isViewingAsKid && (
          <PendingClaimsSection
            claims={pendingClaims}
            profiles={profiles}
            rewards={rewards}
            onApprove={handleApprove}
            onRedeem={handleReject}
          />
        )}

        {/* Points hero — compact: big avatar, balance + level/XP side by side */}
        {effectiveMember && (
          <div style={{ background: 'white', borderRadius: 24, padding: '16px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%', overflow: 'hidden',
                  border: `3px solid ${CORAL}`, background: '#FFD5E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, fontWeight: 700, color: CORAL
                }}>
                  {effectiveMember.avatar_url
                    ? <img src={effectiveMember.avatar_url} alt={effectiveMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : effectiveMember.name?.charAt(0)}
                </div>
                <div style={{
                  position: 'absolute', bottom: -4, right: -4,
                  background: CORAL, borderRadius: 20, padding: '2px 8px',
                  fontSize: 10, fontWeight: 800, color: 'white', border: '2px solid white'
                }}>רמה {currentLevel}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#AAAAAA', fontWeight: 600 }}>יתרה — {effectiveMember.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '2px 0 8px' }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: CORAL, lineHeight: 1 }}>{currentPoints}</span>
                  <span style={{ fontSize: 13, color: '#AAAAAA', fontWeight: 700 }}>נק׳</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: '#FFF0D5', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#CC8800', fontWeight: 700 }}>🏅 רמה {currentLevel}</span>
                  <span style={{ background: '#EDE7F6', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#9B7FD4', fontWeight: 700 }}>⭐ {currentXP} XP</span>
                </div>
              </div>
            </div>

            {/* Compact level progress */}
            <div style={{ marginTop: 12 }}>
              <div style={{ background: '#F0EBE0', borderRadius: 6, height: 6 }}>
                <div style={{ width: `${(currentPoints % 500) / 500 * 100}%`, height: '100%', background: `${CORAL}88`, borderRadius: 6 }} />
              </div>
              <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 5, textAlign: 'left' }}>
                עוד {500 - (currentPoints % 500)} נק׳ לרמה {currentLevel + 1}
              </div>
            </div>
          </div>
        )}

        {/* Kid's own claims — pending approval and approved-ready-to-use */}
        {(!isParent || isViewingAsKid) && (
          <KidClaimsSection claims={myClaims} onRedeem={handleMarkRedeemed} />
        )}

        {activeTier === 'all' ? (
          // Sectioned view — scroll through all tiers
          TIER_FILTERS.filter(f => f.id !== 'all').map(tier => {
            const tierRewards = rewards.filter(r => r.points_required >= tier.min && r.points_required <= tier.max)
            if (tierRewards.length === 0) return null
            const unlockedInTier = tierRewards.filter(r => currentPoints >= r.points_required).length
            return (
              <div key={tier.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: NAVY }}>{tier.label}</div>
                  {unlockedInTier > 0 && (
                    <div style={{ background: '#D5F5F0', color: '#2EBFB8', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                      {unlockedInTier} פתוחים ✓
                    </div>
                  )}
                </div>
                <div className="cards-grid">
                {tierRewards.map((reward, i) => (
                  <ExperienceCard
                    key={reward.id} reward={reward} index={i}
                    currentPoints={currentPoints} currentLevel={currentLevel} isParent={isParent && !isViewingAsKid}
                    onClaim={r => setClaimTarget(r)}
                    onEdit={r => setEditTarget(r)}
                  />
                ))}
                </div>
              </div>
            )
          })
        ) : (
          // Filtered flat list for selected tier
          (() => {
            const tier = TIER_FILTERS.find(f => f.id === activeTier)
            const filtered = rewards.filter(r => r.points_required >= tier.min && r.points_required <= tier.max)
            return (
              <>
                <div style={{ fontSize: 12, color: '#AAAAAA', fontWeight: 600, marginBottom: 14 }}>
                  {filtered.length} פרסים · {filtered.filter(r => currentPoints >= r.points_required).length} פתוחים עכשיו
                </div>
                <div className="cards-grid">
                {filtered.map((reward, i) => (
                  <ExperienceCard
                    key={reward.id} reward={reward} index={i}
                    currentPoints={currentPoints} currentLevel={currentLevel} isParent={isParent && !isViewingAsKid}
                    onClaim={r => setClaimTarget(r)}
                    onEdit={r => setEditTarget(r)}
                  />
                ))}
                </div>
              </>
            )
          })()
        )}

      </div>

      <BottomNav />
    </div>
  )
}
