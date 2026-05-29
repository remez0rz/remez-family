'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'

const TYPE_CONFIG = {
  experience: { label: 'חוויה משפחתית', bg: '#fff8e1', color: '#9a6500' },
  gift:       { label: 'פינוק',          bg: '#fce4ec', color: '#ad1457' },
  privilege:  { label: 'בונוס מיוחד',   bg: '#ede7f6', color: PURPLE },
}

const REWARD_GRADIENTS = [
  ['#1a6b3c', '#2d9e5f'],
  ['#0a1628', '#1e3a5f'],
  ['#7b2d8b', '#a855c8'],
  ['#c45000', '#e07030'],
  ['#1a6b8a', '#2892b8'],
  ['#9a6500', '#c9a84c'],
  ['#ad1457', '#d81b60'],
  ['#0a1628', '#2d4a9e'],
  ['#1a6b3c', '#43a870'],
  ['#5c3d8f', '#8b5cf6'],
]

function Avatar({ profile, size = 44, selected = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${selected ? GOLD : 'rgba(255,255,255,0.2)'}`,
      overflow: 'hidden', flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      background: '#e8d5a3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: NAVY,
      boxShadow: selected ? `0 0 0 3px ${GOLD}55` : 'none',
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

function ExperienceCard({ reward, index, currentPoints, isParent, onClaim, onEdit }) {
  const unlocked  = currentPoints >= reward.points_required
  const progress  = Math.min(Math.round((currentPoints / reward.points_required) * 100), 100)
  const remaining = reward.points_required - currentPoints
  const config    = TYPE_CONFIG[reward.type] || TYPE_CONFIG.experience
  const gradient  = REWARD_GRADIENTS[index % REWARD_GRADIENTS.length]

  return (
    <div style={{
      borderRadius: 20, marginBottom: 14, overflow: 'hidden',
      border: `1px solid ${unlocked ? GOLD + '60' : '#e8e0d0'}`,
      opacity: unlocked ? 1 : 0.92
    }}>
      <div style={{
        background: reward.image_url
          ? `url(${reward.image_url}) center/cover`
          : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        padding: '24px 20px 20px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        minHeight: 110, position: 'relative'
      }}>
        {!reward.image_url && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />}
        {reward.image_url && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />}
        <div style={{ fontSize: 52, position: 'relative', zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
          {reward.emoji || '✨'}
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            background: unlocked ? GOLD : 'rgba(255,255,255,0.15)',
            borderRadius: 14, padding: '8px 14px', backdropFilter: 'blur(4px)'
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: unlocked ? NAVY : 'white', lineHeight: 1 }}>
              {reward.points_required}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: unlocked ? NAVY : 'rgba(255,255,255,0.8)' }}>
              נק׳ לפתיחה
            </div>
          </div>
          {unlocked && (
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: GOLD, background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '2px 8px' }}>
              נפתח! ✨
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'white', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1, paddingLeft: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>{reward.title}</div>
            {reward.description && (
              <div style={{ fontSize: 12, color: '#6b5e4e', marginTop: 4, lineHeight: 1.5 }}>{reward.description}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: config.bg, color: config.color }}>
              {config.label}
            </span>
            {isParent && (
              <button onClick={() => onEdit(reward)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 11, color: '#a09080', padding: '2px 6px',
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>✏️ עריכה</button>
            )}
          </div>
        </div>

        <div style={{ background: '#f0ebe0', borderRadius: 6, height: 7, marginBottom: 6 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: unlocked ? GOLD : '#c8bfb0', borderRadius: 6, transition: 'width 0.4s ease' }} />
        </div>

        {!unlocked && (
          <div style={{ fontSize: 11, color: '#a09080', marginBottom: 8 }}>
            עוד {remaining} נקודות לפתיחה · {progress}% מהדרך
          </div>
        )}

        {unlocked && !isParent && (
          <button onClick={() => onClaim(reward)} style={{
            width: '100%', padding: '12px', background: GOLD, color: NAVY,
            border: 'none', borderRadius: 12, cursor: 'pointer',
            fontWeight: 700, fontSize: 14, marginTop: 4,
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>אני רוצה לפתוח את זה ✨</button>
        )}

        {unlocked && isParent && (
          <div style={{ textAlign: 'center', padding: '8px', background: '#edf7f1', borderRadius: 10, color: GREEN, fontWeight: 700, fontSize: 13, marginTop: 4 }}>
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
      <div style={{ background: CREAM, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>{isNew ? '+ חוויה חדשה' : '✏️ עריכת חוויה'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a09080' }}>✕</button>
        </div>

        <label style={labelStyle}>שם החוויה</label>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="למשל: גלידה משפחתית" style={inputStyle} />

        <label style={labelStyle}>תיאור קצר</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="מה מקבלים כשפותחים את החוויה?" style={inputStyle} />

        <label style={labelStyle}>כמה נקודות צריך כדי לפתוח?</label>
        <input type="number" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: parseInt(e.target.value) || 0 }))} style={{ ...inputStyle, width: 120 }} />

        <label style={labelStyle}>סוג החוויה</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {Object.entries(TYPE_CONFIG).map(([key, val]) => (
            <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: form.type === key ? NAVY : '#f0ebe0',
              color: form.type === key ? 'white' : '#6b5e4e',
              fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-heebo), sans-serif'
            }}>{val.label}</button>
          ))}
        </div>

        <label style={labelStyle}>אייקון</label>
        <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="✨" style={{ ...inputStyle, width: 80, textAlign: 'center', fontSize: 24 }} />

        <label style={labelStyle}>קישור לתמונה (לא חובה)</label>
        <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." style={inputStyle} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} id="is_active" />
          <label htmlFor="is_active" style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>חוויה פעילה</label>
        </div>

        <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
          width: '100%', padding: '14px',
          background: form.title.trim() ? GOLD : '#e0d8c8',
          color: form.title.trim() ? NAVY : '#a09080',
          border: 'none', borderRadius: 14, cursor: form.title.trim() ? 'pointer' : 'default',
          fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-heebo), sans-serif'
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
    await supabase.from('reward_claims').insert({
      reward_id: reward.id, member_id: profile.id,
      status: 'claimed', claimed_at: new Date().toISOString()
    })
    setClaiming(false)
    onClaimed()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.88)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{ background: NAVY, borderRadius: 28, padding: '28px 22px', maxWidth: 340, width: '100%', textAlign: 'center', border: `1px solid ${GOLD}40` }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{reward.emoji || '✨'}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 8 }}>{reward.title}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
          {profile.name} רוצה לפתוח את החוויה הזאת
        </div>
        <div style={{ background: 'rgba(201,168,76,0.15)', borderRadius: 12, padding: '10px 16px', marginBottom: 24, fontSize: 14, color: GOLD, fontWeight: 700 }}>
          נדרשות {reward.points_required} נקודות
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleClaim} disabled={claiming} style={{
            padding: '13px', background: GOLD, border: 'none', borderRadius: 14,
            cursor: 'pointer', fontWeight: 700, fontSize: 15, color: NAVY,
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>{claiming ? 'שולח...' : 'כן, בא לי לפתוח ✨'}</button>
          <button onClick={onClose} style={{
            padding: '11px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.4)',
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
      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
        ⏳ ממתינות לאישורך
      </div>
      {claims.map(claim => {
        const profile = profiles.find(p => p.id === claim.member_id)
        const reward  = rewards.find(r => r.id === claim.reward_id)
        if (!profile || !reward) return null

        return (
          <div key={claim.id} style={{
            background: 'white', borderRadius: 16, padding: '14px 16px',
            border: `1px solid ${GOLD}50`, marginBottom: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 32 }}>{reward.emoji || '✨'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{reward.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `1.5px solid ${GOLD}`, overflow: 'hidden',
                    background: '#e8d5a3', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 9, fontWeight: 700, color: NAVY
                  }}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : profile.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: 12, color: '#6b5e4e', fontWeight: 600 }}>{profile.name} רוצה לפתוח</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>{reward.points_required}</div>
                <div style={{ fontSize: 10, color: '#a09080' }}>נק׳</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onApprove(claim)} style={{
                flex: 1, padding: '10px', background: GOLD, color: NAVY,
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
              }}>✓ אשר ופתח</button>
              <button onClick={() => onRedeem(claim)} style={{
                flex: 1, padding: '10px', background: '#f0ebe0', color: '#6b5e4e',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
              }}>✕ דחה</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ExperiencesPage() {
  const [rewards, setRewards]               = useState([])
  const [profiles, setProfiles]             = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [pendingClaims, setPendingClaims]   = useState([])
  const [loading, setLoading]               = useState(true)
  const [claimTarget, setClaimTarget]       = useState(null)
  const [editTarget, setEditTarget]         = useState(null)
  const [showNewForm, setShowNewForm]       = useState(false)
  const [claimed, setClaimed]               = useState(false)
  const router = useRouter()

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

    const [{ data: rewardData }, { data: profileData }, { data: claimData }] = await Promise.all([
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('profiles').select('*').eq('active', true).order('created_at'),
      supabase.from('reward_claims').select('*').eq('status', 'claimed')
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
    setLoading(false)
  }

  const handleApprove = async (claim) => {
    await supabase.from('reward_claims').update({
      status: 'approved',
      approved_by: currentProfile.id,
    }).eq('id', claim.id)
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

  const handleSaved = () => {
    setEditTarget(null)
    setShowNewForm(false)
    loadData()
  }

  const isParent      = currentProfile?.role === 'parent'
  const children      = profiles.filter(p => p.role === 'child')
  const currentPoints = selectedMember?.total_points || 0
  const nextReward    = rewards.find(r => r.points_required > currentPoints)
  const unlockedCount = rewards.filter(r => currentPoints >= r.points_required).length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, fontFamily: 'var(--font-heebo), sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים חוויות...</div>
      </div>
    </div>
  )

  return (
    <div style={{
      width: '100%', maxWidth: 480, margin: '0 auto',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: CREAM,
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box', overflowX: 'hidden'
    }}>

      {claimTarget && (
        <UnlockModal reward={claimTarget} profile={selectedMember}
          onClose={() => setClaimTarget(null)} onClaimed={handleClaimed} />
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
          background: 'rgba(10,22,40,0.92)', flexDirection: 'column',
          gap: 12, textAlign: 'center',
          fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
        }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>איזה כיף! הבקשה נשלחה</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>מחכים לאישור ההורים</div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: NAVY, padding: '20px 16px 0', borderRadius: '0 0 24px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>✨ נקודות וחוויות</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {isParent ? 'ניהול חוויות ונקודות' : 'הנקודות והחוויות שלי'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isParent && pendingClaims.length > 0 && (
              <div style={{
                background: GOLD, color: NAVY, borderRadius: 20,
                padding: '4px 10px', fontSize: 12, fontWeight: 700
              }}>⏳ {pendingClaims.length}</div>
            )}
            {isParent && (
              <button onClick={() => setShowNewForm(true)} style={{
                background: GOLD, color: NAVY, border: 'none', borderRadius: 20,
                padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>+ חוויה</button>
            )}
            <a href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13 }}>← בית</a>
          </div>
        </div>

        {/* Member selector */}
        <div style={{ display: 'flex', gap: 14, paddingBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {(isParent ? children : [currentProfile]).filter(Boolean).map(p => (
            <div key={p.id} onClick={() => setSelectedMember(p)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
              <Avatar profile={p} size={46} selected={selectedMember?.id === p.id} />
              <span style={{ fontSize: 11, fontWeight: 600, color: selectedMember?.id === p.id ? GOLD : 'rgba(255,255,255,0.5)' }}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>

        {/* Pending claims for parents */}
        {isParent && (
          <PendingClaimsSection
            claims={pendingClaims}
            profiles={profiles}
            rewards={rewards}
            onApprove={handleApprove}
            onRedeem={handleReject}
          />
        )}

        {/* Points hero */}
        {selectedMember && (
          <div style={{ background: NAVY, borderRadius: 20, padding: '20px', marginBottom: 14, border: `1px solid ${GOLD}30`, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                <Avatar profile={selectedMember} size={56} />
                <div style={{
                  position: 'absolute', bottom: -4, right: -4,
                  background: GOLD, borderRadius: 20, padding: '2px 8px',
                  fontSize: 10, fontWeight: 700, color: NAVY,
                  border: '2px solid ' + NAVY
                }}>רמה {selectedMember.level || 1}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              נקודות שצבר/ה {selectedMember.name}
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: GOLD, lineHeight: 1, marginBottom: 4 }}>
              {currentPoints}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              {unlockedCount} מתוך {rewards.length} חוויות פתוחות · רמה {selectedMember.level || 1}
            </div>
            {nextReward && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>החוויה הבאה בדרך</span>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>עוד {nextReward.points_required - currentPoints} נקודות לפתיחה</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, height: 7 }}>
                  <div style={{ width: `${Math.min(Math.round((currentPoints / nextReward.points_required) * 100), 100)}%`, height: '100%', background: GOLD, borderRadius: 6, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{nextReward.title}</div>
                <div style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>כל נקודה מקרבת אותך לשם ✨</div>
              </div>
            )}
            {/* Level progress */}
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>רמה {selectedMember.level || 1}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>רמה {(selectedMember.level || 1) + 1}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, height: 5 }}>
                <div style={{
                  width: `${(currentPoints % 500) / 500 * 100}%`,
                  height: '100%', background: 'rgba(201,168,76,0.6)', borderRadius: 6
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {500 - (currentPoints % 500)} נקודות לרמה הבאה
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, color: '#8a7a60', fontWeight: 600, marginBottom: 12 }}>
          {rewards.length} חוויות · {unlockedCount} פתוחות עכשיו
        </div>

        {rewards.map((reward, i) => (
          <ExperienceCard
            key={reward.id} reward={reward} index={i}
            currentPoints={currentPoints} isParent={isParent}
            onClaim={r => setClaimTarget(r)}
            onEdit={r => setEditTarget(r)}
          />
        ))}

      </div>

      <BottomNav />
    </div>
  )
}