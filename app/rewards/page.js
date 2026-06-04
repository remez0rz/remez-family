'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'
import ViewAsBanner from '../components/ViewAsBanner'

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
        padding: '24px 20px 20px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        minHeight: 110, position: 'relative'
      }}>
        {reward.image_url && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />}
        {!levelOk && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '8px 16px', color: 'white', fontSize: 13, fontWeight: 800 }}>
              🔒 פתוח ברמה {reward.level_required}
            </div>
          </div>
        )}
        <div style={{ fontSize: 52, position: 'relative', zIndex: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}>
          {reward.emoji || '✨'}
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            background: unlocked ? 'white' : 'rgba(255,255,255,0.2)',
            borderRadius: 16, padding: '8px 14px', backdropFilter: 'blur(4px)'
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: unlocked ? gradient[0] : 'white', lineHeight: 1 }}>
              {reward.points_required}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: unlocked ? gradient[0] : 'rgba(255,255,255,0.9)' }}>נק׳</div>
          </div>
          {unlocked && (
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: 'white', background: 'rgba(0,0,0,0.25)', borderRadius: 20, padding: '3px 10px' }}>
              זמין! ✨
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'white', padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ flex: 1, paddingLeft: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>{reward.title}</div>
            {reward.description && (
              <div style={{ fontSize: 12, color: '#888888', marginTop: 4, lineHeight: 1.5 }}>{reward.description}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: config.bg, color: config.color }}>
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
            fontWeight: 800, fontSize: 14, marginTop: 4,
            fontFamily: 'var(--font-heebo), sans-serif',
            boxShadow: '0 4px 12px rgba(255,107,107,0.35)'
          }}>אני רוצה את זה! ✨</button>
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
    if (!error) onClaimed()
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
          <button onClick={() => onRedeem(c.id)} style={{
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

    await supabase.from('reward_claims').update({
      status: 'approved',
      approved_by: currentProfile.id,
    }).eq('id', claim.id)

    if (reward && member) {
      const newTotal = Math.max((member.total_points || 0) - reward.points_required, 0)
      await supabase.from('profiles').update({ total_points: newTotal }).eq('id', claim.member_id)
      await supabase.from('point_events').insert({
        member_id: claim.member_id,
        points: -reward.points_required,
        reason: `פתח חוויה: ${reward.title}`,
      })
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

  const handleMarkRedeemed = async (claimId) => {
    await supabase.from('reward_claims').update({
      status: 'redeemed', redeemed_at: new Date().toISOString()
    }).eq('id', claimId)
    setMyClaims(prev => prev.filter(c => c.id !== claimId))
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
    <div style={{
      width: '100%', maxWidth: 480, margin: '0 auto',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: PAGE_BG,
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box', overflowX: 'hidden'
    }}>

      <ViewAsBanner viewAsProfile={viewAsProfile} />

      {claimTarget && (
        <UnlockModal reward={claimTarget} profile={effectiveMember}
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
          background: 'rgba(0,0,0,0.7)', flexDirection: 'column',
          gap: 12, textAlign: 'center',
          fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
        }}>
          <div style={{ fontSize: 64 }}>🎉</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>איזה כיף! הבקשה נשלחה</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>מחכים לאישור ההורים</div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: HEADER_BG, padding: '24px 16px 0', borderRadius: '0 0 32px 32px', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>✨ נקודות וחוויות</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontWeight: 600 }}>
              {isParent ? 'ניהול חוויות ונקודות' : 'הנקודות והחוויות שלי'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isParent && !isViewingAsKid && pendingClaims.length > 0 && (
              <div style={{
                background: 'white', color: CORAL, borderRadius: 20,
                padding: '4px 10px', fontSize: 12, fontWeight: 800
              }}>⏳ {pendingClaims.length}</div>
            )}
            {isParent && !isViewingAsKid && (
              <button onClick={() => setShowNewForm(true)} style={{
                background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', borderRadius: 20,
                padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>+ חוויה</button>
            )}
          </div>
        </div>

        {/* Member selector */}
        {!isViewingAsKid && (
        <div style={{ display: 'flex', gap: 14, paddingBottom: 4, overflowX: 'auto', scrollbarWidth: 'none', position: 'relative', zIndex: 1 }}>
          {(isParent ? children : [currentProfile]).filter(Boolean).map(p => (
            <div key={p.id} onClick={() => setSelectedMember(p)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
              <Avatar profile={p} size={46} selected={selectedMember?.id === p.id} />
              <span style={{ fontSize: 11, fontWeight: 700, color: selectedMember?.id === p.id ? 'white' : 'rgba(255,255,255,0.6)' }}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
        )}

        {/* Tier nav */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none', position: 'relative', zIndex: 1, marginTop: 12 }}>
          {TIER_FILTERS.map(f => (
            <button key={f.id} onClick={() => setActiveTier(f.id)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: activeTier === f.id ? 'white' : 'rgba(255,255,255,0.18)',
              color: activeTier === f.id ? CORAL : 'white',
              fontWeight: activeTier === f.id ? 800 : 500,
              fontSize: 12, fontFamily: 'var(--font-heebo), sans-serif',
              boxShadow: activeTier === f.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 14px', boxSizing: 'border-box' }}>

        {isParent && !isViewingAsKid && (
          <PendingClaimsSection
            claims={pendingClaims}
            profiles={profiles}
            rewards={rewards}
            onApprove={handleApprove}
            onRedeem={handleReject}
          />
        )}

        {/* Points hero */}
        {effectiveMember && (
          <div style={{ background: 'white', borderRadius: 24, padding: '22px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', overflow: 'hidden',
                  border: `3px solid ${CORAL}`, background: '#FFD5E8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700, color: CORAL
                }}>
                  {effectiveMember.avatar_url
                    ? <img src={effectiveMember.avatar_url} alt={effectiveMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : effectiveMember.name?.charAt(0)}
                </div>
                <div style={{
                  position: 'absolute', bottom: -4, right: -4,
                  background: CORAL, borderRadius: 20, padding: '2px 8px',
                  fontSize: 10, fontWeight: 800, color: 'white',
                  border: '2px solid white'
                }}>רמה {effectiveMember.level || 1}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#AAAAAA', marginBottom: 4, fontWeight: 600 }}>
              יתרה — {effectiveMember.name}
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: CORAL, lineHeight: 1, marginBottom: 4 }}>
              {currentPoints}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ background: '#FFF0D5', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#CC8800', fontWeight: 700 }}>
                🏅 רמה {currentLevel}
              </div>
              <div style={{ background: '#EDE7F6', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#9B7FD4', fontWeight: 700 }}>
                ⭐ {currentXP} XP כולל
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#AAAAAA' }}>
              {unlockedCount} מתוך {rewards.length} פרסים זמינים
            </div>
            {nextReward && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#AAAAAA' }}>החוויה הבאה בדרך</span>
                  <span style={{ fontSize: 11, color: CORAL, fontWeight: 700 }}>עוד {nextReward.points_required - currentPoints} נק׳</span>
                </div>
                <div style={{ background: '#F0EBE0', borderRadius: 8, height: 8 }}>
                  <div style={{
                    width: `${Math.min(Math.round((currentPoints / nextReward.points_required) * 100), 100)}%`,
                    height: '100%', background: CORAL, borderRadius: 8,
                    boxShadow: `0 2px 6px ${CORAL}55`
                  }} />
                </div>
                <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 6 }}>{nextReward.title} ✨</div>
              </div>
            )}
            <div style={{ marginTop: 14, borderTop: '1px solid #F0EBE0', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>רמה {effectiveMember.level || 1}</span>
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>רמה {(effectiveMember.level || 1) + 1}</span>
              </div>
              <div style={{ background: '#F0EBE0', borderRadius: 6, height: 6 }}>
                <div style={{
                  width: `${(currentPoints % 500) / 500 * 100}%`,
                  height: '100%', background: `${CORAL}88`, borderRadius: 6
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 4 }}>
                {500 - (currentPoints % 500)} נקודות לרמה הבאה
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
                {tierRewards.map((reward, i) => (
                  <ExperienceCard
                    key={reward.id} reward={reward} index={i}
                    currentPoints={currentPoints} currentLevel={currentLevel} isParent={isParent && !isViewingAsKid}
                    onClaim={r => setClaimTarget(r)}
                    onEdit={r => setEditTarget(r)}
                  />
                ))}
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
                {filtered.map((reward, i) => (
                  <ExperienceCard
                    key={reward.id} reward={reward} index={i}
                    currentPoints={currentPoints} currentLevel={currentLevel} isParent={isParent && !isViewingAsKid}
                    onClaim={r => setClaimTarget(r)}
                    onEdit={r => setEditTarget(r)}
                  />
                ))}
              </>
            )
          })()
        )}

      </div>

      <BottomNav />
    </div>
  )
}
