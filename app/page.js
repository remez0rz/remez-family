'use client'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'

const COLORS = {
  missions: '#2d4a9e',
  complete: '#1e8c52',
  tazkir: '#c45000',
  rewards: '#7b2d8b',
}

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

  const getNextReward = (points) => rewards.find(r => r.points_required > points)

  const children = profiles
    .filter(p => p.role === 'child')
    .sort((a, b) => b.total_points - a.total_points)

  const childColors = ['#2d4a9e', '#c45000', '#1e8c52']

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (diff === 0) return 'היום'
    if (diff === 1) return 'אתמול'
    return `לפני ${diff} ימים`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heebo), sans-serif' }}>
      <p style={{ color: '#8a7a60', fontSize: '1rem' }}>טוען...</p>
    </div>
  )

  return (
    <div style={{
      maxWidth: '600px', margin: '0 auto', padding: '0',
      fontFamily: 'var(--font-heebo), sans-serif',
      paddingBottom: '5rem', direction: 'rtl',
      minHeight: '100vh', background: '#f5f0e8'
    }}>

      {/* Header */}
      <div style={{ padding: '20px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 900, color: '#1a1208', lineHeight: 1.1 }}>משפחת רמז 🏡</h1>
          <p style={{ margin: '3px 0 0', color: '#8a7a60', fontSize: '0.875rem' }}>מה עושים היום?</p>
        </div>
        <button onClick={handleSignOut} style={{
          padding: '5px 14px', border: '1px solid #e0d8c8', borderRadius: '20px',
          cursor: 'pointer', background: 'white', color: '#8a7a60',
          fontSize: '0.8rem', fontFamily: 'var(--font-heebo), sans-serif'
        }}>
          יציאה
        </button>
      </div>

      {/* Action grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '4px 18px 16px' }}>
        {[
          { href: '/missions', bg: COLORS.missions, icon: '🎯', title: 'בחר משימה', sub: 'בחר משהו כיפי' },
          { href: '/missions/active', bg: COLORS.complete, icon: '✅', title: 'סיים משימה', sub: activeAssignments.length > 0 ? `${activeAssignments.length} פעילות` : 'אין פעילות' },
          { href: '/tazkir/new', bg: COLORS.tazkir, icon: '📝', title: 'תחקיר', sub: 'שמור זיכרון' },
          { href: '/rewards', bg: COLORS.rewards, icon: '🏆', title: 'פרסים', sub: 'נקודות ופרסים' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'block', padding: '16px 14px 14px', background: item.bg,
            borderRadius: '18px', textDecoration: 'none'
          }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '4px' }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{item.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.78)', marginTop: '2px' }}>{item.sub}</div>
          </a>
        ))}
      </div>

      {/* Leaderboard */}
      {children.length > 0 && (
        <div style={{ margin: '0 18px 12px', background: 'white', borderRadius: '18px', padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1208', marginBottom: '14px' }}>⭐ טבלת נקודות</div>
          {children.map((child, i) => {
            const nextReward = getNextReward(child.total_points)
            const progress = nextReward
              ? Math.min(Math.round((child.total_points / nextReward.points_required) * 100), 100)
              : 100
            const color = childColors[i] || '#888'
            return (
              <div key={child.id} style={{ marginBottom: i < children.length - 1 ? '14px' : 0 }}
                onClick={() => router.push(`/profiles/${child.id}`)}
                role="button" style={{ cursor: 'pointer', marginBottom: i < children.length - 1 ? '14px' : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1208' }}>{child.name}</span>
                  <span style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{child.total_points} נק׳</span>
                </div>
                <div style={{ background: '#f0ebe0', borderRadius: '6px', height: '8px' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.4s ease' }} />
                </div>
                {nextReward && (
                  <div style={{ color: '#a09080', fontSize: '0.72rem', marginTop: '3px' }}>
                    עוד {nextReward.points_required - child.total_points} נקודות עד {nextReward.title}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Active missions */}
      {activeAssignments.length > 0 && (
        <div style={{ margin: '0 18px 12px', background: 'white', borderRadius: '18px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1208' }}>🎯 משימות פעילות</div>
            <a href="/missions/active" style={{ color: '#2d4a9e', fontSize: '0.8rem', textDecoration: 'none' }}>הכל ←</a>
          </div>
          {activeAssignments.slice(0, 3).map((a, i) => (
            <div key={a.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: i < 2 ? '10px' : 0,
              borderBottom: i < 2 ? '1px solid #f5f0e8' : 'none',
              marginBottom: i < 2 ? '10px' : 0
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1208' }}>{a.mission.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#a09080' }}>{a.member.name}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e8c52' }}>+{a.mission.points}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent feed */}
      {recentFeed.length > 0 && (
        <div style={{ margin: '0 18px 12px', background: 'white', borderRadius: '18px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1208' }}>📖 זיכרונות אחרונים</div>
            <a href="/feed" style={{ color: '#2d4a9e', fontSize: '0.8rem', textDecoration: 'none' }}>הכל ←</a>
          </div>
          {recentFeed.map((post, i) => (
            <div key={post.id} style={{
              paddingBottom: i < recentFeed.length - 1 ? '10px' : 0,
              borderBottom: i < recentFeed.length - 1 ? '1px solid #f5f0e8' : 'none',
              marginBottom: i < recentFeed.length - 1 ? '10px' : 0
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1208' }}>{post.title}</div>
              {post.content && <div style={{ fontSize: '0.75rem', color: '#a09080', marginTop: '2px' }}>{post.content}</div>}
              <div style={{ fontSize: '0.7rem', color: '#b0a090', marginTop: '3px' }}>{timeAgo(post.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #e8e0d0',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 14px', zIndex: 100,
        fontFamily: 'var(--font-heebo), sans-serif'
      }}>
        {[
          { href: '/', label: 'בית', emoji: '🏠' },
          { href: '/missions', label: 'משימות', emoji: '🎯' },
          { href: '/profiles', label: 'משפחה', emoji: '👨‍👩‍👧' },
          { href: '/rewards', label: 'פרסים', emoji: '🏆' },
          { href: '/feed', label: 'פיד', emoji: '📖' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', color: '#a09080', fontSize: '0.68rem', gap: '2px'
          }}>
            <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
            {item.label}
          </a>
        ))}
      </div>

    </div>
  )
}