'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from './lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from './components/BottomNav'

const NAVY = '#2D2D2D'
const GOLD = '#FFB830'
const CREAM = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'
const GREEN = '#4ECDC4'
const PURPLE = '#9B7FD4'
const CORAL = '#FF6B6B'
const HEADER_BG = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'

const REACTIONS = [
  { type: 'proud',  emoji: '❤️' },
  { type: 'fire',   emoji: '🔥' },
  { type: 'clap',   emoji: '👏' },
  { type: 'star',   emoji: '⭐' },
  { type: 'trophy', emoji: '🏆' },
  { type: 'wow',    emoji: '🤯' },
]

const MISSION_GRADIENTS = [
  ['#FF6B6B', '#FF8E53'], ['#4ECDC4', '#2EBFB8'],
  ['#9B7FD4', '#C084FC'], ['#FFB830', '#FFD166'],
  ['#3B9FE8', '#60B8FF'],
]

const CATEGORY_LABELS = {
  Family: 'משפחה', Learning: 'לומדים בכיף', Helping: 'עוזרים בבית',
  Creative: 'יצירה', Funny: 'מצחיקים', Outdoor: 'בחוץ',
  Reading: 'קריאה', English: 'אנגלית', Hebrew: 'עברית',
  Kindness: 'מעשים טובים', House: 'הבית שלנו', Memory: 'זיכרונות',
  Health: 'בריאות', Weekend: 'סופ״ש', Daily: 'משימות יומיות',
}

const CATEGORY_VISUAL = {
  Funny:    { emoji: '😂' }, Creative: { emoji: '🎨' },
  Weekend:  { emoji: '🌅' }, Learning: { emoji: '🧠' },
  Reading:  { emoji: '📖' }, English:  { emoji: '🌍' },
  Hebrew:   { emoji: '✡️' }, Helping:  { emoji: '🤝' },
  Kindness: { emoji: '❤️' }, House:    { emoji: '🏠' },
  Outdoor:  { emoji: '🌿' }, Health:   { emoji: '💪' },
  Family:   { emoji: '👨‍👩‍👧' }, Memory:  { emoji: '📸' },
  Daily:    { emoji: '🌅' },
}

function Avatar({ profile, size = 40 }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid rgba(255,255,255,0.8)`, overflow: 'hidden', flexShrink: 0,
      background: '#FFD5E8', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: CORAL,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
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
    <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 8, height: 10 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 0.4s ease', boxShadow: `0 2px 6px ${color}66` }} />
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', borderRadius: 24, padding: '18px 20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.07)', marginBottom: 14, ...style
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ title, href }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{title}</div>
      {href && <a href={href} style={{ fontSize: 12, color: CORAL, textDecoration: 'none', fontWeight: 700, background: '#FFE8E8', borderRadius: 20, padding: '3px 10px' }}>הכל ←</a>}
    </div>
  )
}

// Kid homepage
function KidHome({ currentProfile, missions, dailyMissions, completedDailyIds, rewards, activeAssignments, recentFeed, reactionData, handleReaction, handleStartMission, startingMission }) {
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
        background: HEADER_BG, padding: '24px 18px 32px',
        borderRadius: '0 0 32px 32px', marginBottom: 18,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: '0.5px' }}>משפחת רמז</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginTop: 2 }}>
              היי {currentProfile.name} 👋
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 4, fontWeight: 700 }}>
              מה בא לך לצבור היום?
            </div>
          </div>
          <a href="/profiles" style={{ textDecoration: 'none' }}>
            <Avatar profile={currentProfile} size={48} />
          </a>
        </div>

        {/* Points hero */}
        <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 24, padding: '20px 18px', backdropFilter: 'blur(4px)', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: 'white', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {currentProfile.total_points}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.95)', marginTop: 4, fontWeight: 700 }}>נקודות 🌟</div>
          </div>

          {next ? (
            <>
              <ProgressBar value={currentProfile.total_points} max={next.points_required} color="white" />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.95)', marginTop: 8, textAlign: 'center', fontWeight: 700 }}>
                עוד {next.points_required - currentProfile.total_points} נקודות ו{next.title} נפתח ✨
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'white', textAlign: 'center', fontWeight: 800 }}>
              השגת את כל החוויות! 🏆
            </div>
          )}

          <a href="/missions" style={{
            display: 'block', marginTop: 16,
            background: 'white', color: CORAL, borderRadius: 50,
            padding: '13px', textAlign: 'center',
            textDecoration: 'none', fontWeight: 900, fontSize: 15,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            ✨ צוברים נקודות עכשיו
          </a>
        </div>
      </div>

      <div style={{ padding: '0 14px' }}>

        {/* Daily missions */}
        {dailyMissions.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <SectionTitle title="🌅 משימות יומיות" href="/missions?filter=daily" />
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
              {dailyMissions.map((mission, i) => {
                const done    = completedDailyIds.has(mission.id)
                const starting = startingMission === mission.id
                return (
                  <div key={mission.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    borderBottom: i < dailyMissions.length - 1 ? '1px solid #f5f0e8' : 'none',
                    background: done ? '#f0faf8' : 'white',
                    opacity: done ? 0.85 : 1
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: done ? '#4ECDC4' : 'linear-gradient(135deg, #FFB830, #FFD166)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                    }}>
                      {done ? '✓' : '🏠'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, lineHeight: 1.3 }}>{mission.title}</div>
                      <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 2 }}>+{mission.points} נקודות</div>
                    </div>
                    {done ? (
                      <div style={{
                        background: '#4ECDC4', color: 'white',
                        fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, flexShrink: 0
                      }}>✓ היום</div>
                    ) : (
                      <button onClick={() => handleStartMission(mission)} disabled={starting} style={{
                        background: starting ? '#e8e0d0' : CORAL, color: starting ? '#a09080' : 'white',
                        border: 'none', borderRadius: 20, padding: '7px 14px',
                        fontWeight: 700, fontSize: 12, cursor: starting ? 'default' : 'pointer',
                        fontFamily: 'var(--font-heebo), sans-serif', flexShrink: 0,
                        boxShadow: starting ? 'none' : '0 3px 8px rgba(255,107,107,0.35)'
                      }}>
                        {starting ? '...' : 'עשיתי ⭐'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
                  borderRadius: 24, marginBottom: 12, overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                    padding: '16px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 28 }}>{visual.emoji}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 3, fontWeight: 700 }}>
                        {CATEGORY_LABELS[mission.category] || mission.category}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '8px 14px' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: 'white', lineHeight: 1 }}>+{mission.points}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: 600 }}>נק׳ · {mission.estimated_minutes} דק׳</div>
                    </div>
                  </div>
                  <div style={{ background: 'white', padding: '14px 18px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 10 }}>{mission.title}</div>
                    <button onClick={() => handleStartMission(mission)} disabled={starting} style={{
                      width: '100%', padding: '11px',
                      background: starting ? '#F0EBE0' : CORAL,
                      color: starting ? '#a09080' : 'white',
                      border: 'none', borderRadius: 50, cursor: starting ? 'default' : 'pointer',
                      fontWeight: 800, fontSize: 13,
                      fontFamily: 'var(--font-heebo), sans-serif',
                      boxShadow: starting ? 'none' : '0 4px 12px rgba(255,107,107,0.35)',
                      transition: 'all 0.2s ease'
                    }}>
                      {starting ? 'שולח...' : 'אני רוצה לנסות ⭐'}
                    </button>
                  </div>
                </div>
              )
            })}
            <a href="/missions" style={{
              display: 'block', textAlign: 'center', fontSize: 13,
              color: CORAL, textDecoration: 'none', fontWeight: 700, marginBottom: 12
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
                <div style={{ background: '#F0EBE0', borderRadius: 8, height: 8, marginTop: 8 }}>
                  <div style={{
                    width: `${Math.min(Math.round((currentProfile.total_points / next.points_required) * 100), 100)}%`,
                    height: '100%', background: GOLD, borderRadius: 8,
                    boxShadow: `0 2px 6px ${GOLD}88`
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
                <div style={{ fontWeight: 800, fontSize: 13, color: 'white', background: GREEN, padding: '4px 12px', borderRadius: 20, boxShadow: '0 2px 6px rgba(78,205,196,0.4)' }}>
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
                        background: postReactions[r.type] ? '#FFF0D5' : '#F7F4EE',
                        border: `1.5px solid ${postReactions[r.type] ? GOLD : '#EDE8E0'}`,
                        borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'var(--font-heebo), sans-serif',
                        transition: 'all 0.15s ease'
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
function ParentHome({ currentProfile, profiles, activeAssignments, recentFeed, rewards, reactionData, handleReaction, handleSignOut, handleViewAs }) {
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
        background: HEADER_BG, padding: '24px 18px 28px',
        borderRadius: '0 0 32px 32px', marginBottom: 18,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>משפחת רמז 🏡</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontWeight: 600 }}>מה עושים היום?</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/profiles" style={{ textDecoration: 'none' }}>
              <Avatar profile={currentProfile} size={44} />
            </a>
            <button onClick={handleSignOut} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              borderRadius: 20, color: 'white', fontSize: 12,
              padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif',
              fontWeight: 700
            }}>יציאה</button>
          </div>
        </div>

        {/* View-as child switcher */}
        {children.length > 0 && (
          <div style={{ marginTop: 14, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 8 }}>👁 הצג את האפליקציה כ:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {children.map(child => (
                <button key={child.id} onClick={() => handleViewAs(child.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)',
                  borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
                  color: 'white', fontSize: 13, fontWeight: 700,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  transition: 'all 0.15s ease'
                }}>
                  <Avatar profile={child} size={22} />
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 14px' }}>

        {/* Pending approvals banner */}
        {pending.length > 0 && (
          <a href="/missions?tab=active" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #FFB830, #FFD166)', borderRadius: 20, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
              boxShadow: '0 4px 16px rgba(255,184,48,0.35)'
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
                      <div style={{ background: '#F0EBE0', borderRadius: 8, height: 8, marginTop: 5 }}>
                        <div style={{
                          width: `${next ? Math.min(Math.round((child.total_points / next.points_required) * 100), 100) : 100}%`,
                          height: '100%', background: color, borderRadius: 8,
                          boxShadow: `0 2px 6px ${color}88`
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
            { href: '/missions', bg: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', icon: '⭐', title: 'שלח אתגר', sub: 'לבני המשפחה' },
            { href: '/tazkir/new', bg: 'linear-gradient(135deg, #4ECDC4, #2EBFB8)', icon: '📝', title: 'תחקיר', sub: 'מה עשינו היום?' },
          ].map(item => (
            <a key={item.href} href={item.href} style={{
              display: 'block', padding: '18px 16px', background: item.bg,
              borderRadius: 22, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
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
                        background: postReactions[r.type] ? '#FFF0D5' : '#F7F4EE',
                        border: `1.5px solid ${postReactions[r.type] ? GOLD : '#EDE8E0'}`,
                        borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'var(--font-heebo), sans-serif',
                        transition: 'all 0.15s ease'
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
  const [dailyMissions, setDailyMissions]   = useState([])
  const [completedDailyIds, setCompletedDailyIds] = useState(new Set())
  const [activeAssignments, setActiveAssignments] = useState([])
  const [recentFeed, setRecentFeed]         = useState([])
  const [rewards, setRewards]               = useState([])
  const [reactions, setReactions]           = useState({})
  const [loading, setLoading]               = useState(true)
  const [startingMission, setStartingMission] = useState(null)
  const [viewAsId, setViewAsId]             = useState(null)
  const router = useRouter()

  useEffect(() => {
    const saved = sessionStorage.getItem('viewAsProfileId')
    if (saved) setViewAsId(saved)
  }, [])

  const handleViewAs = (profileId) => {
    if (profileId) {
      sessionStorage.setItem('viewAsProfileId', profileId)
    } else {
      sessionStorage.removeItem('viewAsProfileId')
    }
    setViewAsId(profileId)
  }

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

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      { data: allProfiles },
      { data: missionData },
      { data: dailyMissionData },
      { data: assignments },
      { data: feed },
      { data: rewardList },
      { data: todayCompleted }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true).order('created_at'),
      supabase.from('missions').select('*').eq('is_active', true).neq('category', 'Daily').order('points', { ascending: true }).limit(10),
      supabase.from('missions').select('*').eq('is_active', true).eq('category', 'Daily').order('points', { ascending: true }),
      supabase.from('assignments')
        .select('*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('assignments').select('mission_id')
        .eq('assigned_to', profile.id).eq('status', 'completed')
        .gte('completed_at', todayStart.toISOString())
    ])

    if (allProfiles) setProfiles(allProfiles)
    if (missionData) setMissions(missionData)
    if (dailyMissionData) setDailyMissions(dailyMissionData)
    if (assignments) setActiveAssignments(assignments)
    if (feed) setRecentFeed(feed)
    if (rewardList) setRewards(rewardList)
    if (todayCompleted) setCompletedDailyIds(new Set(todayCompleted.map(a => a.mission_id)))

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
  const viewAsProfile = viewAsId ? profiles.find(p => p.id === viewAsId) : null
  const isViewingAsKid = isParent && !!viewAsProfile
  const effectiveProfile = viewAsProfile || currentProfile

  const myAssignments = (isParent && !isViewingAsKid)
    ? activeAssignments
    : activeAssignments.filter(a => a.member?.id === effectiveProfile?.id)

  // Filter today's missions — exclude already active ones
  const activeMissionIds = new Set(myAssignments.map(a => a.mission_id))
  const todayMissions = missions.filter(m => !activeMissionIds.has(m.id)).slice(0, 3)
  // For daily missions, also exclude ones currently active
  const visibleDailyMissions = dailyMissions.filter(m => !activeMissionIds.has(m.id))

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)', fontFamily: 'var(--font-heebo), sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
        <div style={{ color: CORAL, fontSize: 16, fontWeight: 700 }}>טוענים את הבית...</div>
      </div>
    </div>
  )

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)',
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box', overflowX: 'hidden'
    }}>
      {/* View-as banner */}
      {isViewingAsKid && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 200,
          background: 'linear-gradient(90deg, #9B7FD4, #C084FC)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(155,127,212,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>👁</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>
              מציג כ: {viewAsProfile.name}
            </span>
          </div>
          <button onClick={() => handleViewAs(null)} style={{
            background: 'rgba(255,255,255,0.25)', border: 'none',
            borderRadius: 20, color: 'white', fontSize: 12, fontWeight: 700,
            padding: '5px 14px', cursor: 'pointer',
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            חזרה לתצוגת הורה
          </button>
        </div>
      )}

      {isParent && !isViewingAsKid ? (
        <ParentHome
          currentProfile={currentProfile}
          profiles={profiles}
          activeAssignments={activeAssignments}
          recentFeed={recentFeed}
          rewards={rewards}
          reactionData={reactions}
          handleReaction={handleReaction}
          handleSignOut={handleSignOut}
          handleViewAs={handleViewAs}
        />
      ) : (
        <KidHome
          currentProfile={effectiveProfile}
          missions={todayMissions}
          dailyMissions={visibleDailyMissions}
          completedDailyIds={completedDailyIds}
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