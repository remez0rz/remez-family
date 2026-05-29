'use client'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [profiles, setProfiles] = useState([])
  const [activeAssignments, setActiveAssignments] = useState([])
  const [recentFeed, setRecentFeed] = useState([])
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadData()
    })
  }, [])

  const loadData = async () => {
    const [
      { data: profiles },
      { data: assignments },
      { data: feed },
      { data: rewards }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true).order('created_at'),
      supabase.from('assignments').select('*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)').in('status', ['active', 'submitted']).order('created_at', { ascending: false }).limit(5),
      supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required')
    ])

    if (profiles) setProfiles(profiles)
    if (assignments) setActiveAssignments(assignments)
    if (feed) setRecentFeed(feed)
    if (rewards) setRewards(rewards)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getNextReward = (points) => {
    return rewards.find(r => r.points_required > points)
  }

  const children = profiles.filter(p => p.role === 'child')

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <p style={{ color: '#999' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Remez Family HQ</h1>
          <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>What are we doing today?</p>
        </div>
        <button onClick={handleSignOut} style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: 'white', color: '#666', fontSize: '0.85rem' }}>
          Sign out
        </button>
      </div>

      {/* Primary actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <a href="/missions" style={{
          display: 'block', padding: '1.25rem', background: '#4285f4', borderRadius: '14px',
          color: 'white', textDecoration: 'none', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>🎯</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Choose Mission</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.15rem' }}>Pick something fun</div>
        </a>

        <a href="/missions/active" style={{
          display: 'block', padding: '1.25rem', background: '#34a853', borderRadius: '14px',
          color: 'white', textDecoration: 'none', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>✅</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Complete Mission</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.15rem' }}>
            {activeAssignments.length > 0 ? `${activeAssignments.length} active` : 'None active'}
          </div>
        </a>

        <a href="/tazkir/new" style={{
          display: 'block', padding: '1.25rem', background: '#ff6d00', borderRadius: '14px',
          color: 'white', textDecoration: 'none', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>📝</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>תחקיר</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.15rem' }}>Save a memory</div>
        </a>

        <a href="/rewards" style={{
          display: 'block', padding: '1.25rem', background: '#8e24aa', borderRadius: '14px',
          color: 'white', textDecoration: 'none', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>🏆</div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Rewards</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.15rem' }}>Points & prizes</div>
        </a>
      </div>

      {/* Family points leaderboard */}
      {children.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '14px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem' }}>⭐ Points leaderboard</div>
          {children.sort((a, b) => b.total_points - a.total_points).map(child => {
            const nextReward = getNextReward(child.total_points)
            const progress = nextReward ? Math.round((child.total_points / nextReward.points_required) * 100) : 100
            return (
              <div key={child.id} style={{ marginBottom: '0.75rem' }} onClick={() => router.push(`/profiles/${child.id}`)} >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{child.name}</span>
                  <span style={{ fontWeight: '700', color: '#4285f4', fontSize: '0.9rem' }}>{child.total_points} pts</span>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: '#4285f4', borderRadius: '4px' }} />
                </div>
                {nextReward && (
                  <div style={{ color: '#aaa', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                    {nextReward.points_required - child.total_points} pts until {nextReward.title}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Active missions */}
      {activeAssignments.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '14px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>🎯 Active missions</div>
            <a href="/missions/active" style={{ color: '#4285f4', fontSize: '0.8rem', textDecoration: 'none' }}>See all</a>
          </div>
          {activeAssignments.slice(0, 3).map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{a.mission.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{a.member.name}</div>
              </div>
              <div style={{ color: '#4285f4', fontWeight: '600', fontSize: '0.85rem' }}>+{a.mission.points}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent feed */}
      {recentFeed.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '14px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>📖 Recent memories</div>
            <a href="/feed" style={{ color: '#4285f4', fontSize: '0.8rem', textDecoration: 'none' }}>See all</a>
          </div>
          {recentFeed.map(post => (
            <div key={post.id} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{post.title}</div>
              {post.content && <div style={{ fontSize: '0.75rem', color: '#888' }}>{post.content}</div>}
              <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '0.15rem' }}>
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #eee',
        display: 'flex', justifyContent: 'space-around',
        padding: '0.75rem 0', zIndex: 100
      }}>
        {[
          { href: '/', label: 'Home', emoji: '🏠' },
          { href: '/missions', label: 'Missions', emoji: '🎯' },
          { href: '/profiles', label: 'Family', emoji: '👨‍👩‍👧' },
          { href: '/rewards', label: 'Rewards', emoji: '🏆' },
          { href: '/feed', label: 'Feed', emoji: '📖' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', color: '#666', fontSize: '0.7rem', gap: '2px'
          }}>
            <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
            {item.label}
          </a>
        ))}
      </div>

    </div>
  )
}