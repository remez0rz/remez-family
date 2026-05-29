'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function RewardsPage() {
  const [rewards, setRewards] = useState([])
  const [profiles, setProfiles] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadData()
    })
  }, [])

  const loadData = async () => {
    const [{ data: rewards }, { data: profiles }] = await Promise.all([
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('profiles').select('*').eq('active', true).order('created_at')
    ])
    if (rewards) setRewards(rewards)
    if (profiles) {
      setProfiles(profiles)
      const firstChild = profiles.find(p => p.role === 'child')
      setSelectedMember(firstChild || profiles[0])
    }
    setLoading(false)
  }

  const currentPoints = selectedMember?.total_points || 0

  const getProgress = (reward) => {
    const pct = Math.min((currentPoints / reward.points_required) * 100, 100)
    return Math.round(pct)
  }

  const isUnlocked = (reward) => currentPoints >= reward.points_required

  const typeEmoji = {
    experience: '⭐',
    gift: '🎁',
    privilege: '👑'
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Rewards</h1>
        <a href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>← Home</a>
      </div>

      {/* Member selector */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => setSelectedMember(profile)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: selectedMember?.id === profile.id ? '#4285f4' : '#f0f0f0',
              color: selectedMember?.id === profile.id ? 'white' : '#444',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            {profile.name}
          </button>
        ))}
      </div>

      {/* Points summary */}
      {selectedMember && (
        <div style={{
          background: 'linear-gradient(135deg, #4285f4, #34a853)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>{selectedMember.name}'s points</div>
          <div style={{ fontSize: '3rem', fontWeight: '700', lineHeight: 1 }}>{currentPoints}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>
            {(() => {
              const next = rewards.find(r => r.points_required > currentPoints)
              return next ? `${next.points_required - currentPoints} points until ${next.title}` : 'All rewards unlocked!'
            })()}
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#999', textAlign: 'center' }}>Loading...</p>}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {rewards.map(reward => {
          const unlocked = isUnlocked(reward)
          const progress = getProgress(reward)

          return (
            <div key={reward.id} style={{
              background: 'white',
              border: `1px solid ${unlocked ? '#34a853' : '#eee'}`,
              borderRadius: '14px',
              padding: '1rem',
              opacity: unlocked ? 1 : 0.85
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{typeEmoji[reward.type] || '⭐'}</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{reward.title}</div>
                    {reward.description && (
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>{reward.description}</div>
                    )}
                  </div>
                </div>
                <div style={{
                  fontWeight: '700',
                  color: unlocked ? '#34a853' : '#888',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  marginLeft: '0.5rem'
                }}>
                  {unlocked ? '✓ Unlocked' : `${reward.points_required} pts`}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: unlocked ? '#34a853' : '#4285f4',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              {!unlocked && (
                <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {progress}% — {reward.points_required - currentPoints} points to go
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}