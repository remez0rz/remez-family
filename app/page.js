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

const MISSION_GRADIENTS = [
  ['#1a6b3c', '#2d9e5f'], ['#0a1628', '#1e3a5f'],
  ['#7b2d8b', '#a855c8'], ['#c45000', '#e07030'],
  ['#1a6b8a', '#2892b8'],
]

const CATEGORY_LABELS = {
  Family: 'משפחה', Learning: 'לומדים בכיף', Helping: 'עוזרים בבית',
  Creative: 'יצירה', Funny: 'מצחיקים', Outdoor: 'בחוץ',
  Reading: 'קריאה', English: 'אנגלית', Hebrew: 'עברית',
  Kindness: 'מעשים טובים', House: 'הבית שלנו', Memory: 'זיכרונות',
  Health: 'בריאות', Weekend: 'סופ״ש',
}

const CATEGORY_VISUAL = {
  Funny:    { emoji: '😂' }, Creative: { emoji: '🎨' },
  Weekend:  { emoji: '🌅' }, Learning: { emoji: '🧠' },
  Reading:  { emoji: '📖' }, English:  { emoji: '🌍' },
  Hebrew:   { emoji: '✡️' }, Helping:  { emoji: '🤝' },
  Kindness: { emoji: '❤️' }, House:    { emoji: '🏠' },
  Outdoor:  { emoji: '🌿' }, Health:   { emoji: '💪' },
  Family:   { emoji: '👨‍👩‍👧' }, Memory:  { emoji: '📸' },
}

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
    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, height: 8 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', borderRadius: 18, padding: '14px 16px',
      border: '1px solid #e8e0d0', marginBottom: 12, ...style
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ title, href }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{title}</div>
      {href && <a href={href} style={{ fontSize: 12, color: GOLD, textDecoration: 'none', fontWeight: 600 }}>הכל ←</a>}
    </div>
  )
}

// Kid homepage
function KidHome({ currentProfile, missions, rewards, activeAssignments, recentFeed, reactionData, handleReaction, handleStartMission, startingMission }) {
  const getNextReward = (points) => rewards.find(r => r.points_required > points)
  const next = getNextReward(currentProfile.total_points)
  const todayMissions = missions.slice(0, 3)

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (diff === 0) return 'היום'
    if (diff === 1) return 'אתמול'
    return `לפני ${diff} ימים`
  }

  return (
    <>
      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 18px 28px',
        borderRadius: '0 0 28px 28px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>משפחת רמז</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
              היי {currentProfile.name} 👋
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              מה בא לך לצבור היום?
            </div>
          </div>
          <a href="/profiles" style={{ textDecoration: 'none' }}>
            <Avatar profile={currentProfile} size={44} />
          </a>
        </div>

        {/* Points hero */}
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: '18px 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: GOLD, lineHeight: 1 }}>
              {currentProfile.total_points}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>נקודות</div>
          </div>

          {next ? (
            <>
              <ProgressBar value={currentProfile.total_points} max={next.points_required} color={GOLD} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, textAlign: 'center' }}>
                עוד {next.points_required - currentProfile.total_points} נקודות ו{next.title} נפתח ✨
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: GOLD, textAlign: 'center', fontWeight: 700 }}>
              השגת את כל החוויות! 🏆
            </div>
          )}

          <a href="/missions" style={{
            display: 'block', marginTop: 14,
            background: GOLD, color: NAVY, borderRadius: 14,
            padding: '12px', textAlign: 'center',
            textDecoration: 'none', fontWeight: 900, fontSize: 15
          }}>
            ✨ צוברים נקודות עכשיו
          </a>
        </div>
      </div>

      <div style={{ padding: '0 14px' }}>

        {/* Today's challenges */}
        {todayMissions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <SectionTitle title="⭐ אתגרי היום" href="/missions" />
            {todayMissions.map((mission, i) => {
              const visual   = CATEGORY_VISUAL[mission.category] || { emoji: '⭐' }
              const gradient = MISSION_GRADIENTS[i % MISSION_GRADIENTS.length]
              const starting = startingMission === mission.id

              return (
                <div key={mission.id} style={{
                  borderRadius: 16, marginBottom: 10, overflow: 'hidden',
                  border: '1px solid #e8e0d0'
                }}>
                  <div style={{
                    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: 22 }}>{visual.emoji}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                        {CATEGORY_LABELS[mission.category] || mission.category}
                      </div>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>+{mission.points}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>נק׳ · {mission.estimated_minutes} דק׳</div>
                    </div>
                  </div>
                  <div style={{ background: 'white', padding: '12px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{mission.title}</div>
                    <button onClick={() => handleStartMission(mission)} disabled={starting} style={{
                      width: '100%', padding: '10px',
                      background: starting ? '#e8e0d0' : NAVY,
                      color: starting ? '#a09080' : 'white',
                      border: 'none', borderRadius: 10, cursor: starting ? 'default' : 'pointer',
                      fontWeight: 700, fontSize: 13,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>
                      {starting ? 'שולח...' : 'אני רוצה לנסות ⭐'}
                    </button>
                  </div>
                </div>
              )
            })}
            <a href="/missions" style={{
              display: 'block', textAlign: 'center', fontSize: 13,
              color: GOLD, textDecoration: 'none', fontWeight: 600, marginBottom: 12
            }}>לכל אתגרי הנקודות ←</a>
          </div>
        )}

        {/* Next reward */}
        {next && (
          <Card style={{ marginBottom: 12 }}>
            <SectionTitle title="✨ החוויה הבאה שלך" href="/rewards" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36 }}>{next.emoji || '✨'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{next.title}</div>
                <div style={{ fontSize: 12, color: '#8a7a60', marginTop: 2 }}>
                  עוד {next.points_required - currentProfile.total_points} נקודות והיא נפתחת
                </div>
                <div style={{ background: '#f0ebe0', borderRadius: 6, height: 6, marginTop: 6 }}>
                  <div style={{
                    width: `${Math.min(Math.round((currentProfile.total_points / next.points_required) * 100), 100)}%`,
                    height: '100%', background: GOLD, borderRadius: 6
                  }} />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Active missions */}
        {activeAssignments.length > 0 && (
          <Card style={{ marginBottom: 12 }}>
            <SectionTitle title="🏃 בתהליך" href="/missions?tab=active" />
            {activeAssignments.slice(0, 3).map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: i < activeAssignments.length - 1 ? 10 : 0,
                borderBottom: i < activeAssignments.length - 1 ? '1px solid #f5f0e8' : 'none',
                marginBottom: i < activeAssignments.length - 1 ? 10 : 0
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, flex: 1, paddingLeft: 8 }}>{a.mission.title}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: GREEN, background: '#edf7f1', padding: '3px 10px', borderRadius: 20 }}>
                  +{a.mission.points}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Recent feed */}
        {recentFeed.length > 0 && (
          <Card>
            <SectionTitle title="🎉 רגעים שמחים" href="/feed" />
            {recentFeed.map((post, i) => {
              const coverPhoto  = post.media_urls?.[0]
              const isVideo     = url => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
              const postReactions = reactionData[post.id] || {}
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
    </>
  )
}

// Parent homepage
function ParentHome({ currentProfile, profiles, activeAssignments, recentFeed, rewards, reactionData, handleReaction, handleSignOut }) {
  const children    = profiles.filter(p => p.role === 'child').sort((a, b) => b.total_points - a.total_points)
  const childColors = [GOLD, PURPLE, GREEN]
  const getNextReward = (points) => rewards.find(r => r.points_required > points)
  const pending     = activeAssignments.filter(a => a.status === 'submitted')

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (diff === 0) return 'היום'
    if (diff === 1) return 'אתמול'
    return `לפני ${diff} ימים`
  }

  return (
    <>
      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 18px 24px',
        borderRadius: '0 0 28px 28px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>משפחת רמז 🏡</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>מה עושים היום?</div>
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
      </div>

      <div style={{ padding: '0 14px' }}>

        {/* Pending approvals banner */}
        {pending.length > 0 && (
          <a href="/missions?tab=active" style={{ textDecoration: 'none' }}>
            <div style={{
              background: GOLD, borderRadius: 16, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12
            }}>
              <div style={{ fontSize: 24 }}>⏳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>
                  {pending.length} אתגרים ממתינים לאישורך
                </div>
                <div style={{ fontSize: 12, color: 'rgba(10,22,40,0.6)', marginTop: 2 }}>לחץ לאישור מהיר</div>
              </div>
              <div style={{ color: NAVY, fontSize: 18 }}>←</div>
            </div>
          </a>
        )}

        {/* Leaderboard */}
        {children.length > 0 && (
          <Card>
            <SectionTitle title="⭐ טבלת נקודות" href="/profiles" />
            {children.map((child, i) => {
              const next  = getNextReward(child.total_points)
              const color = childColors[i] || GOLD
              return (
                <div key={child.id} onClick={() => window.location.href = `/profiles/${child.id}`}
                  style={{ marginBottom: i < children.length - 1 ? 14 : 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Avatar profile={child} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{child.name}</span>
                        <span style={{ fontWeight: 700, color, fontSize: 14 }}>{child.total_points} נק׳</span>
                      </div>
                      <div style={{ background: '#f0ebe0', borderRadius: 6, height: 6, marginTop: 4 }}>
                        <div style={{
                          width: `${next ? Math.min(Math.round((child.total_points / next.points_required) * 100), 100) : 100}%`,
                          height: '100%', background: color, borderRadius: 6
                        }} />
                      </div>
                      {next && <div style={{ color: '#a09080', fontSize: 11, marginTop: 2 }}>
                        עוד {next.points_required - child.total_points} נק׳ ל{next.title}
                      </div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </Card>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {[
            { href: '/missions', bg: NAVY, icon: '⭐', title: 'שלח אתגר', sub: 'לבני המשפחה' },
            { href: '/tazkir/new', bg: GREEN, icon: '📝', title: 'תחקיר', sub: 'מה עשינו היום?' },
          ].map(item => (
            <a key={item.href} href={item.href} style={{
              display: 'block', padding: '16px 14px', background: item.bg,
              borderRadius: 16, textDecoration: 'none'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{item.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{item.sub}</div>
            </a>
          ))}
        </div>

        {/* Recent feed */}
        {recentFeed.length > 0 && (
          <Card>
            <SectionTitle title="🎉 רגעים שמחים" href="/feed" />
            {recentFeed.map((post, i) => {
              const coverPhoto    = post.media_urls?.[0]
              const isVideo       = url => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
              const postReactions = reactionData[post.id] || {}
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
    </>
  )
}

export default function HomePage() {
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles]             = useState([])
  const [missions, setMissions]             = useState([])
  const [activeAssignments, setActiveAssignments] = useState([])
  const [recentFeed, setRecentFeed]         = useState([])
  const [rewards, setRewards]               = useState([])
  const [reactions, setReactions]           = useState({})
  const [loading, setLoading]               = useState(true)
  const [startingMission, setStartingMission] = useState(null)
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
      { data: missionData },
      { data: assignments },
      { data: feed },
      { data: rewardList }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true).order('created_at'),
      supabase.from('missions').select('*').eq('is_active', true).order('points', { ascending: true }).limit(10),
      supabase.from('assignments')
        .select('*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required')
    ])

    if (allProfiles) setProfiles(allProfiles)
    if (missionData) setMissions(missionData)
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

    // Weekly + birthday bonus
    if (profile.role === 'child') {
      const { checkAndAwardWeeklyBonus } = await import('./lib/weeklyBonus')
      await checkAndAwardWeeklyBonus(profile.id)
      const { checkAndAwardBirthdayBonus } = await import('./lib/birthdayBonus')
      await checkAndAwardBirthdayBonus(profile)
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

  const handleStartMission = async (mission) => {
    if (!currentProfile || startingMission) return
    setStartingMission(mission.id)
    await supabase.from('assignments').insert([{
      mission_id: mission.id, assigned_to: currentProfile.id, status: 'active'
    }])
    setStartingMission(null)
    router.push('/missions?tab=active')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isParent = currentProfile?.role === 'parent'
  const myAssignments = isParent
    ? activeAssignments
    : activeAssignments.filter(a => a.member?.id === currentProfile?.id)

  // Filter today's missions — exclude already active ones
  const activeMissionIds = new Set(myAssignments.map(a => a.mission_id))
  const todayMissions = missions.filter(m => !activeMissionIds.has(m.id)).slice(0, 3)

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
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box', overflowX: 'hidden'
    }}>
      {isParent ? (
        <ParentHome
          currentProfile={currentProfile}
          profiles={profiles}
          activeAssignments={activeAssignments}
          recentFeed={recentFeed}
          rewards={rewards}
          reactionData={reactions}
          handleReaction={handleReaction}
          handleSignOut={handleSignOut}
        />
      ) : (
        <KidHome
          currentProfile={currentProfile}
          missions={todayMissions}
          rewards={rewards}
          activeAssignments={myAssignments}
          recentFeed={recentFeed}
          reactionData={reactions}
          handleReaction={handleReaction}
          handleStartMission={handleStartMission}
          startingMission={startingMission}
        />
      )}
      <BottomNav />
    </div>
  )
}