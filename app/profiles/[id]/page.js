'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'

const childColors = [GOLD, PURPLE, GREEN]

function Avatar({ profile, size = 80 }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid ${GOLD}`, overflow: 'hidden', flexShrink: 0,
      background: '#e8d5a3', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: NAVY
    }}>
      {profile.avatar_url && !imgError
        ? <img src={profile.avatar_url} alt={profile.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : profile.name?.charAt(0)}
    </div>
  )
}

function EditModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    phone:    profile.phone    || '',
    birthday: profile.birthday || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      phone:    form.phone    || null,
      birthday: form.birthday || null,
    }).eq('id', profile.id)
    setSaving(false)
    onSaved()
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #e0d8c8', borderRadius: 10,
    fontSize: 14, color: NAVY, background: '#faf8f4',
    fontFamily: 'var(--font-heebo), sans-serif',
    boxSizing: 'border-box', marginBottom: 10, outline: 'none'
  }
  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: '#6b5e4e',
    display: 'block', marginBottom: 4
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.88)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{
        background: CREAM, borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px', width: '100%', maxWidth: 480
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>✏️ עריכת פרופיל</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a09080' }}>✕</button>
        </div>

        <label style={labelStyle}>טלפון</label>
        <input value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="050-0000000" type="tel" style={inputStyle} />

        <label style={labelStyle}>יום הולדת</label>
        <input value={form.birthday}
          onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
          type="date" style={inputStyle} />

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '14px', background: GOLD,
          color: NAVY, border: 'none', borderRadius: 14,
          cursor: 'pointer', fontWeight: 700, fontSize: 16,
          fontFamily: 'var(--font-heebo), sans-serif'
        }}>
          {saving ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage({ params }) {
  const [profile, setProfile]           = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [rewards, setRewards]           = useState([])
  const [badges, setBadges]             = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [stats, setStats]               = useState({ missions: 0, tahkirim: 0 })
  const [loading, setLoading]           = useState(true)
  const [showEdit, setShowEdit]         = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadData()
    })
  }, [])

  const loadData = async () => {
    const current = await getCurrentProfile()
    if (!current) { router.push('/login'); return }
    setCurrentProfile(current)

    const profileId = params.id

    const [
      { data: profileData },
      { data: rewardData },
      { data: badgeData },
      { data: activityData },
      { data: missionCount },
      { data: tahkirData }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('member_badges').select('*, badge:badges(*)').eq('member_id', profileId).order('awarded_at', { ascending: false }),
      supabase.from('feed_posts').select('*').contains('participants', []).order('created_at', { ascending: false }).limit(5),
      supabase.from('assignments').select('id').eq('assigned_to', profileId).eq('status', 'completed'),
      supabase.from('tahkirim').select('id').eq('created_by', profileId)
    ])

    if (!profileData) { router.push('/profiles'); return }

    setProfile(profileData)
    if (rewardData) setRewards(rewardData)
    if (badgeData) setBadges(badgeData)
    if (activityData) setRecentActivity(activityData)
    setStats({
      missions:  missionCount?.length  || 0,
      tahkirim:  tahkirData?.length    || 0,
    })
    setLoading(false)
  }

  const getNextReward  = (points) => rewards.find(r => r.points_required > points)
  const isParent       = currentProfile?.role === 'parent'
  const isOwnProfile   = currentProfile?.id === profile?.id

  const formatBirthday = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  const isBirthdayToday = (dateStr) => {
    if (!dateStr) return false
    const today    = new Date()
    const birthday = new Date(dateStr)
    return today.getDate() === birthday.getDate() && today.getMonth() === birthday.getMonth()
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: CREAM,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים פרופיל...</div>
      </div>
    </div>
  )

  const next          = getNextReward(profile.total_points)
  const progressPct   = next ? Math.min(Math.round((profile.total_points / next.points_required) * 100), 100) : 100
  const levelProgress = (profile.total_points % 500) / 500 * 100

  return (
    <div style={{
      width: '100%', maxWidth: 480, margin: '0 auto',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: CREAM,
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box', overflowX: 'hidden'
    }}>

      {showEdit && (
        <EditModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); loadData() }}
        />
      )}

      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 16px 28px',
        borderRadius: '0 0 28px 28px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <a href="/profiles" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13 }}>← משפחה</a>
          {isParent && (
            <button onClick={() => setShowEdit(true)} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 20, padding: '6px 14px', color: 'rgba(255,255,255,0.7)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif'
            }}>✏️ עריכה</button>
          )}
        </div>

        {/* Avatar + name */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Avatar profile={profile} size={88} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
            {profile.name}
            {isBirthdayToday(profile.birthday) && ' 🎂'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <span style={{
              background: GOLD, color: NAVY,
              fontSize: 12, fontWeight: 700,
              padding: '3px 12px', borderRadius: 20
            }}>רמה {profile.level || 1}</span>
            {profile.role === 'parent' && (
              <span style={{
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                fontSize: 12, fontWeight: 700,
                padding: '3px 12px', borderRadius: 20
              }}>הורה</span>
            )}
          </div>
        </div>

        {/* Points + next reward */}
        {profile.role === 'child' && (
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>סה״כ נקודות</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: GOLD }}>{profile.total_points}</span>
            </div>
            {next && (
              <>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, height: 7, marginBottom: 6 }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: GOLD, borderRadius: 6 }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  עוד {next.points_required - profile.total_points} נקודות ו{next.title} נפתח ✨
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>

        {/* Stats row */}
        {profile.role === 'child' && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10, marginBottom: 14
          }}>
            {[
              { label: 'אתגרים', value: stats.missions, emoji: '⭐' },
              { label: 'תחקירים', value: stats.tahkirim, emoji: '📝' },
              { label: 'בדג׳ים',  value: badges.length,  emoji: '🏅' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'white', borderRadius: 14, padding: '14px 10px',
                textAlign: 'center', border: '1px solid #e8e0d0'
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.emoji}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: NAVY }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#a09080' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Level progress */}
        {profile.role === 'child' && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '14px 16px',
            border: '1px solid #e8e0d0', marginBottom: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>רמה {profile.level || 1}</span>
              <span style={{ fontSize: 12, color: '#8a7a60' }}>
                {500 - (profile.total_points % 500)} נק׳ לרמה {(profile.level || 1) + 1}
              </span>
            </div>
            <div style={{ background: '#f0ebe0', borderRadius: 6, height: 8 }}>
              <div style={{ width: `${levelProgress}%`, height: '100%', background: GOLD, borderRadius: 6, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Contact info */}
        {(profile.phone || profile.birthday || profile.email) && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '14px 16px',
            border: '1px solid #e8e0d0', marginBottom: 14
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>פרטים</div>
            {profile.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>📧</span>
                <span style={{ fontSize: 13, color: '#6b5e4e' }}>{profile.email}</span>
              </div>
            )}
            {profile.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>📱</span>
                <a href={`tel:${profile.phone}`} style={{ fontSize: 13, color: NAVY, textDecoration: 'none', fontWeight: 600 }}>
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.birthday && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🎂</span>
                <span style={{ fontSize: 13, color: '#6b5e4e' }}>
                  {formatBirthday(profile.birthday)}
                  {isBirthdayToday(profile.birthday) && (
                    <span style={{ marginRight: 6, color: GOLD, fontWeight: 700 }}>— יום הולדת שמח! 🎉</span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '14px 16px',
            border: '1px solid #e8e0d0', marginBottom: 14
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>
              🏅 בדג׳ים שהרווחת
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {badges.map(mb => (
                <div key={mb.id} style={{
                  background: '#f7f4ee', borderRadius: 12,
                  padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6,
                  border: '1px solid #e8e0d0'
                }}>
                  <span style={{ fontSize: 20 }}>{mb.badge?.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{mb.badge?.title}</div>
                    <div style={{ fontSize: 10, color: '#a09080' }}>{mb.badge?.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty badges */}
        {profile.role === 'child' && badges.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '20px 16px',
            border: '1px solid #e8e0d0', marginBottom: 14, textAlign: 'center'
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>עדיין אין בדג׳ים</div>
            <div style={{ fontSize: 12, color: '#a09080' }}>השלם אתגרים כדי להרוויח בדג׳ים</div>
          </div>
        )}

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '14px 16px',
            border: '1px solid #e8e0d0', marginBottom: 14
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>
              📖 פעילות אחרונה
            </div>
            {recentActivity.map((post, i) => (
              <div key={post.id} style={{
                paddingBottom: i < recentActivity.length - 1 ? 10 : 0,
                borderBottom: i < recentActivity.length - 1 ? '1px solid #f5f0e8' : 'none',
                marginBottom: i < recentActivity.length - 1 ? 10 : 0
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{post.title}</div>
                <div style={{ fontSize: 11, color: '#a09080', marginTop: 2 }}>
                  {Math.floor((Date.now() - new Date(post.created_at)) / 86400000) === 0
                    ? 'היום'
                    : Math.floor((Date.now() - new Date(post.created_at)) / 86400000) === 1
                    ? 'אתמול'
                    : `לפני ${Math.floor((Date.now() - new Date(post.created_at)) / 86400000)} ימים`
                  }
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}