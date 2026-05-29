'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'

const TYPE_CONFIG = {
  experience: { emoji: '⭐', label: 'חוויה',   bg: '#fff8e1', color: '#9a6500' },
  gift:       { emoji: '🎁', label: 'מתנה',    bg: '#fce4ec', color: '#ad1457' },
  privilege:  { emoji: '👑', label: 'פריבילגיה', bg: '#ede7f6', color: PURPLE },
}

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

function ClaimModal({ reward, profile, onClose, onClaimed }) {
  const [claiming, setClaiming] = useState(false)

  const handleClaim = async () => {
    setClaiming(true)
    await supabase.from('reward_claims').insert({
      reward_id: reward.id,
      member_id: profile.id,
      status: 'claimed',
      claimed_at: new Date().toISOString()
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
      <div style={{
        background: NAVY, borderRadius: 28, padding: '28px 22px',
        maxWidth: 340, width: '100%', textAlign: 'center',
        border: `1px solid ${GOLD}40`
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {TYPE_CONFIG[reward.type]?.emoji || '🏆'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 8 }}>
          {reward.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
          {profile.name} רוצה לממש את הפרס הזה
        </div>
        <div style={{
          background: 'rgba(201,168,76,0.15)', borderRadius: 12,
          padding: '10px 16px', marginBottom: 24,
          fontSize: 14, color: GOLD, fontWeight: 700
        }}>
          עולה {reward.points_required} נקודות
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleClaim} disabled={claiming} style={{
            padding: '13px', background: GOLD, border: 'none',
            borderRadius: 14, cursor: 'pointer', fontWeight: 700,
            fontSize: 15, color: NAVY,
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            {claiming ? 'שולח בקשה...' : '🙌 אני רוצה את הפרס הזה!'}
          </button>
          <button onClick={onClose} style={{
            padding: '11px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>ביטול</button>
        </div>
      </div>
    </div>
  )
}

function RewardCard({ reward, currentPoints, isParent, onClaim }) {
  const unlocked  = currentPoints >= reward.points_required
  const progress  = Math.min(Math.round((currentPoints / reward.points_required) * 100), 100)
  const remaining = reward.points_required - currentPoints
  const config    = TYPE_CONFIG[reward.type] || TYPE_CONFIG.experience

  return (
    <div style={{
      background: 'white', borderRadius: 18,
      border: `1px solid ${unlocked ? GOLD + '60' : '#e8e0d0'}`,
      marginBottom: 12, overflow: 'hidden',
      opacity: unlocked ? 1 : 0.9
    }}>
      {/* Header */}
      <div style={{
        background: unlocked ? '#fffbf0' : '#f7f4ee',
        padding: '12px 16px',
        borderBottom: `1px solid ${unlocked ? GOLD + '30' : '#f0ebe0'}`,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: config.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
        }}>{config.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>
            {reward.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: config.bg, color: config.color
            }}>{config.label}</span>
            {unlocked && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: '#edf7f1', color: GREEN
              }}>✓ זמין!</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: unlocked ? GOLD : '#8a7a60', lineHeight: 1 }}>
            {reward.points_required}
          </div>
          <div style={{ fontSize: 10, color: '#a09080', fontWeight: 600 }}>נקודות</div>
        </div>
      </div>

      {/* Progress + action */}
      <div style={{ padding: '12px 16px' }}>
        {reward.description && (
          <div style={{ fontSize: 12, color: '#6b5e4e', marginBottom: 10, lineHeight: 1.5 }}>
            {reward.description}
          </div>
        )}

        <div style={{ background: '#f0ebe0', borderRadius: 6, height: 7, marginBottom: 6 }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: unlocked ? GOLD : '#c8bfb0',
            borderRadius: 6, transition: 'width 0.4s ease'
          }} />
        </div>

        {!unlocked && (
          <div style={{ fontSize: 11, color: '#a09080', marginBottom: 10 }}>
            עוד {remaining} נקודות · {progress}% מהדרך
          </div>
        )}

        {unlocked && !isParent && (
          <button onClick={() => onClaim(reward)} style={{
            width: '100%', padding: '11px',
            background: GOLD, color: NAVY,
            border: 'none', borderRadius: 12, cursor: 'pointer',
            fontWeight: 700, fontSize: 14,
            fontFamily: 'var(--font-heebo), sans-serif',
            marginTop: 4
          }}>
            🏆 מממש את הפרס!
          </button>
        )}

        {unlocked && isParent && (
          <div style={{
            textAlign: 'center', padding: '8px',
            background: '#edf7f1', borderRadius: 10,
            color: GREEN, fontWeight: 700, fontSize: 13, marginTop: 4
          }}>✓ ניתן לממש</div>
        )}
      </div>
    </div>
  )
}

export default function RewardsPage() {
  const [rewards, setRewards]             = useState([])
  const [profiles, setProfiles]           = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [claims, setClaims]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [claimTarget, setClaimTarget]     = useState(null)
  const [claimed, setClaimed]             = useState(false)
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
      // Default selected: if child, show self. If parent, show first child.
      if (profile.role === 'child') {
        setSelectedMember(profileData.find(p => p.id === profile.id))
      } else {
        setSelectedMember(profileData.find(p => p.role === 'child') || profileData[0])
      }
    }
    if (claimData) setClaims(claimData)
    setLoading(false)
  }

  const handleClaimed = () => {
    setClaimTarget(null)
    setClaimed(true)
    setTimeout(() => { setClaimed(false); loadData() }, 2000)
  }

  const isParent    = currentProfile?.role === 'parent'
  const children    = profiles.filter(p => p.role === 'child')
  const currentPoints = selectedMember?.total_points || 0
  const nextReward  = rewards.find(r => r.points_required > currentPoints)
  const unlockedCount = rewards.filter(r => currentPoints >= r.points_required).length

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: CREAM,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים פרסים...</div>
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
        <ClaimModal
          reward={claimTarget}
          profile={selectedMember}
          onClose={() => setClaimTarget(null)}
          onClaimed={handleClaimed}
        />
      )}

      {claimed && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,22,40,0.92)',
          fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl',
          flexDirection: 'column', gap: 12, textAlign: 'center'
        }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>הבקשה נשלחה!</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>ההורים יאשרו בקרוב</div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 16px 0',
        borderRadius: '0 0 24px 24px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>🏆 פרסים</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {isParent ? 'מעקב פרסים לכל הילדים' : 'הפרסים שלי'}
            </div>
          </div>
          <a href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13 }}>← בית</a>
        </div>

        {/* Member selector — avatars */}
        <div style={{
          display: 'flex', gap: 14, paddingBottom: 16,
          overflowX: 'auto', scrollbarWidth: 'none'
        }}>
          {(isParent ? children : [currentProfile]).map(p => (
            <div key={p.id}
              onClick={() => setSelectedMember(p)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
              <Avatar profile={p} size={46} selected={selectedMember?.id === p.id} />
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: selectedMember?.id === p.id ? GOLD : 'rgba(255,255,255,0.5)'
              }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>

        {/* Points hero */}
        {selectedMember && (
          <div style={{
            background: NAVY, borderRadius: 20,
            padding: '20px', marginBottom: 14,
            border: `1px solid ${GOLD}30`, textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Avatar profile={selectedMember} size={56} />
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              הנקודות של {selectedMember.name}
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: GOLD, lineHeight: 1, marginBottom: 4 }}>
              {currentPoints}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              {unlockedCount} מתוך {rewards.length} פרסים זמינים
            </div>
            {nextReward && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>הפרס הבא</span>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>
                    עוד {nextReward.points_required - currentPoints} נק׳
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, height: 7 }}>
                  <div style={{
                    width: `${Math.min(Math.round((currentPoints / nextReward.points_required) * 100), 100)}%`,
                    height: '100%', background: GOLD, borderRadius: 6, transition: 'width 0.4s ease'
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {nextReward.title}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rewards list */}
        <div style={{ fontSize: 12, color: '#8a7a60', fontWeight: 600, marginBottom: 10 }}>
          {rewards.length} פרסים · {unlockedCount} זמינים
        </div>

        {rewards.map(reward => (
          <RewardCard
            key={reward.id}
            reward={reward}
            currentPoints={currentPoints}
            isParent={isParent}
            onClaim={r => setClaimTarget(r)}
          />
        ))}

      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: NAVY, borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 16px', zIndex: 100,
        fontFamily: 'var(--font-heebo), sans-serif'
      }}>
        {[
          { href: '/',           label: 'בית',    emoji: '🏠' },
          { href: '/missions',   label: 'משימות', emoji: '🎯' },
          { href: '/tazkir/new', label: 'תחקיר',  emoji: '📝', center: true },
          { href: '/rewards',    label: 'פרסים',  emoji: '🏆', active: true },
          { href: '/feed',       label: 'פיד',    emoji: '📖' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', gap: 2,
            color: item.active ? GOLD : 'rgba(255,255,255,0.45)',
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
        ))}
      </div>
    </div>
  )
}