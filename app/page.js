'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from './lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from './components/BottomNav'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'

const REACTIONS = [
  { type: 'proud',  emoji: '❤️' },
  { type: 'fire',   emoji: '🔥' },
  { type: 'clap',   emoji: '👏' },
  { type: 'star',   emoji: '⭐' },
  { type: 'trophy', emoji: '🏆' },
  { type: 'wow',    emoji: '🤯' },
]

function Avatar({ profile, size = 40 }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${GOLD}`, overflow: 'hidden', flexShrink: 0,
      background: '#e8d5a3', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: NAVY
    }}>
      {profile?.avatar_url && !imgError
        ? <img src={profile.avatar_url} alt={profile?.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : profile?.name?.charAt(0)}
    </div>
  )
}

function ProgressBar({ value, max, color = GOLD }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 100
  return (
    <div style={{ background: '#ede8df', borderRadius: 6, height: 7 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', borderRadius: 18, padding: '14px 16px',
      border: '1px solid #e8e0d0', marginBottom: 10, ...style
    }}>
      {children}
    </div>
  )
}

function SectionHeader({ title, href, label = 'הכל' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{title}</div>
      {href && <a href={href} style={{ color: GOLD, fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>{label} ←</a>}
    </div>
  )
}

export default function HomePage() {
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles]             = useState([])
  const [activeAssignments, setActiveAssignments] = useState([])
  const [recentFeed, setRecentFeed]         = useState([])
  const [rewards, setRewards]               = useState([])
  const [reactions, setReactions]           = useState({})
  const [loading, setLoading]               = useState(true)
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

    const [
      { data: allProfiles },
      { data: assignments },
      { data: feed },
      { data: rewardList }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true).order('created_at'),
      supabase.from('assignments')
        .select('*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)')
        .in('status', ['active', 'submitted'])
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required')
    ])

    if (allProfiles) setProfiles(allProfiles)
    if (assignments) setActiveAssignments(assignments)
    if (feed) setRecentFeed(feed)
    if (rewardList) setRewards(rewardList)

    if (feed?.length) {
      const postIds = feed.map(p => p.id)
      const { data: reactionData } = await supabase
        .from('reactions').select('*').in('feed_post_id', postIds)
      if (reactionData) {
        const grouped = {}
        reactionData.forEach(r => {
          if (!grouped[r.feed_post_id]) grouped[r.feed_post_id] = {}
          if (!grouped[r.feed_post_id][r.type]) grouped[r.feed_post_id][r.type] = 0
          grouped[r.feed_post_id][r.type]++
        })
        setReactions(grouped)
      }
    }
/ Weekly bonus check for children
if (profile.role === 'child') {
  const { checkAndAwardWeeklyBonus } = await import('./lib/weeklyBonus')
  const awarded = await checkAndAwardWeeklyBonus(profile.id)

  // Birthday bonus check
  const { checkAndAwardBirthdayBonus } = await import('./lib/birthdayBonus')
  await checkAndAwardBirthdayBonus(profile)

  if (awarded) {
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single()
    if (updatedProfile) setCurrentProfile(updatedProfile)
  }
}
    setLoading(false)
  }

  const handleReaction = async (postId, type) => {
    if (!currentProfile) return
    await supabase.from('reactions').upsert({
      feed_post_id: postId, member_id: currentProfile.id, type
    }, { onConflict: 'feed_post_id,member_id,type' })
    setReactions(prev => ({
      ...prev,
      [postId]: { ...prev[postId], [type]: ((prev[postId]?.[type]) || 0) + 1 }
    }))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getNextReward = (points) => rewards.find(r => r.points_required > points)

  const isParent = currentProfile?.role === 'parent'
  const children = profiles.filter(p => p.role === 'child').sort((a, b) => b.total_points - a.total_points)
  const childColors = [GOLD, PURPLE, GREEN]

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (diff === 0) return 'היום'
    if (diff === 1) return 'אתמול'
    return `לפני ${diff} ימים`
  }

  const myAssignments = isParent
    ? activeAssignments
    : activeAssignments.filter(a => a.member?.id === currentProfile?.id)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, fontFamily: 'var(--font-heebo), sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏡</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים את הבית...</div>
      </div>
    </div>
  )

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: CREAM,
      minHeight: '100vh', paddingBottom: '5.5rem'
    }}>

      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 18px 24px',
        borderRadius: '0 0 28px 28px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
              משפחת רמז 🏡
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {isParent ? 'מה עושים היום?' : `שלום ${currentProfile?.name} 👋`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/profiles" style={{ textDecoration: 'none' }}>
              <Avatar profile={currentProfile} size={42} />
            </a>
            <button onClick={handleSignOut} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 20, color: 'rgba(255,255,255,0.6)', fontSize: 11,
              padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif'
            }}>יציאה</button>
          </div>
        </div>

        {/* Child points widget */}
        {!isParent && currentProfile && (() => {
          const next = getNextReward(currentProfile.total_points)
          return (
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>הנקודות שלי</div>
                <div style={{ color: GOLD, fontWeight: 900, fontSize: 20 }}>{currentProfile.total_points} נק׳</div>
              </div>
              <ProgressBar value={currentProfile.total_points} max={next?.points_required || currentProfile.total_points} color={GOLD} />
              {next && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 5 }}>
                עוד {next.points_required - currentProfile.total_points} נקודות ו{next.title} נפתח ✨
              </div>}
            </div>
          )
        })()}
      </div>

      <div style={{ padding: '0 14px' }}>

        {/* Action grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { href: '/missions', bg: NAVY, icon: '⭐', title: 'צוברים נקודות', sub: 'בחר איך להרוויח' },
            {
              href: '/missions?tab=active', bg: GOLD, icon: '✅',
              title: isParent ? 'בתהליך' : 'השלמתי!',
              sub: myAssignments.length > 0 ? `${myAssignments.length} ${isParent ? 'ממתינות' : 'פעילות'}` : 'אין עכשיו',
              dark: true
            },
            { href: '/tazkir/new', bg: GREEN, icon: '📝', title: 'פותחים תחקיר', sub: 'מה עשינו היום?' },
            { href: '/rewards', bg: PURPLE, icon: '✨', title: 'החוויות שלי', sub: 'נקודות וחוויות' },
          ].map(item => (
            <a key={item.href} href={item.href} style={{
              display: 'block', padding: '16px 14px 14px', background: item.bg,
              borderRadius: 18, textDecoration: 'none'
            }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: item.dark ? NAVY : 'white' }}>{item.title}</div>
              <div style={{ fontSize: 11, color: item.dark ? 'rgba(10,22,40,0.55)' : 'rgba(255,255,255,0.65)', marginTop: 2 }}>{item.sub}</div>
            </a>
          ))}
        </div>

        {/* Parent leaderboard / Child missions */}
        {isParent ? (
          <Card>
            <SectionHeader title="⭐ טבלת נקודות" href="/profiles" />
            {children.map((child, i) => {
              const next = getNextReward(child.total_points)
              const color = childColors[i] || GOLD
              return (
                <div key={child.id} onClick={() => router.push(`/profiles/${child.id}`)}
                  style={{ marginBottom: i < children.length - 1 ? 14 : 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Avatar profile={child} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{child.name}</span>
                        <span style={{ fontWeight: 700, color, fontSize: 14 }}>{child.total_points} נק׳</span>
                      </div>
                      <ProgressBar value={child.total_points} max={next?.points_required || child.total_points} color={color} />
                      {next && <div style={{ color: '#a09080', fontSize: 11, marginTop: 3 }}>
                        עוד {next.points_required - child.total_points} נקודות ו{next.title} נפתח
                      </div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </Card>
        ) : (
          myAssignments.length > 0 && (
            <Card>
              <SectionHeader title="⭐ צוברים עכשיו" href="/missions?tab=active" />
              {myAssignments.slice(0, 3).map((a, i) => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  paddingBottom: i < 2 ? 10 : 0,
                  borderBottom: i < 2 ? '1px solid #f5f0e8' : 'none',
                  marginBottom: i < 2 ? 10 : 0
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: a.mission.type === 'learning' ? '#f0ebf8' : '#f7f4ee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
                  }}>
                    {a.mission.type === 'learning' ? '📚' : a.mission.type === 'responsibility' ? '🤝' : '⭐'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{a.mission.title}</div>
                    <div style={{ fontSize: 11, color: '#a09080', marginTop: 1 }}>{a.mission.estimated_minutes} דקות</div>
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: 13,
                    color: a.mission.type === 'learning' ? PURPLE : GREEN,
                    background: a.mission.type === 'learning' ? '#f0ebf8' : '#edf7f1',
                    padding: '3px 10px', borderRadius: 20
                  }}>+{a.mission.points}</div>
                </div>
              ))}
            </Card>
          )
        )}

        {/* Parent pending approvals */}
        {isParent && activeAssignments.filter(a => a.status === 'submitted').length > 0 && (
          <a href="/missions?tab=active" style={{ textDecoration: 'none' }}>
            <div style={{
              background: NAVY, borderRadius: 18, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10
            }}>
              <div style={{ fontSize: 28 }}>⏳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
                  {activeAssignments.filter(a => a.status === 'submitted').length} פעילויות ממתינות לאישורך
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  לחץ לאישור מהיר
                </div>
              </div>
              <div style={{ color: GOLD, fontSize: 20 }}>←</div>
            </div>
          </a>
        )}

        {/* Recent feed */}
        {recentFeed.length > 0 && (
          <Card>
            <SectionHeader title="📖 זיכרונות אחרונים" href="/feed" />
            {recentFeed.map((post, i) => {
              const coverPhoto = post.media_urls?.[0]
              const isVideo = url => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
              const postReactions = reactions[post.id] || {}
              return (
                <div key={post.id} style={{
                  paddingBottom: i < recentFeed.length - 1 ? 14 : 0,
                  borderBottom: i < recentFeed.length - 1 ? '1px solid #f5f0e8' : 'none',
                  marginBottom: i < recentFeed.length - 1 ? 14 : 0
                }}>
                  {coverPhoto && !isVideo(coverPhoto) && (
                    <img src={coverPhoto} alt="cover" style={{
                      width: '100%', height: 140, objectFit: 'cover',
                      borderRadius: 12, marginBottom: 8, display: 'block'
                    }} />
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{post.title}</div>
                  {post.content && <div style={{ fontSize: 12, color: '#a09080', marginTop: 2 }}>{post.content}</div>}
                  <div style={{ fontSize: 11, color: '#b0a090', marginTop: 3 }}>{timeAgo(post.created_at)}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {REACTIONS.map(r => (
                      <button key={r.type} onClick={() => handleReaction(post.id, r.type)} style={{
                        background: postReactions[r.type] ? '#faf6ec' : '#f7f4ee',
                        border: `1px solid ${postReactions[r.type] ? GOLD : '#e8e0d0'}`,
                        borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'var(--font-heebo), sans-serif'
                      }}>
                        <span style={{ fontSize: 14 }}>{r.emoji}</span>
                        {postReactions[r.type] > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{postReactions[r.type]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </Card>
        )}

      </div>

      <BottomNav />
    </div>
  )
}