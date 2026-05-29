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

function Avatar({ profile, size = 40 }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${GOLD}`, overflow: 'hidden', flexShrink: 0,
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

function ProgressBar({ value, max, color = GOLD }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 100
  return (
    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 8 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    color: [GOLD, '#fff', '#c9a84c', '#e8d5a3', GREEN][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 6,
    duration: `${Math.random() * 1.5 + 1.5}s`
  }))
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`@keyframes fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) rotate(360deg); opacity: 0; } }`}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: 0, left: p.left,
          width: p.size, height: p.size, background: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : 2,
          animation: `fall ${p.duration} ${p.delay} ease-in forwards`
        }} />
      ))}
    </div>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(star => (
        <div key={star} onClick={() => onChange(star)} style={{
          fontSize: 28, cursor: 'pointer',
          opacity: star <= value ? 1 : 0.25, transition: 'opacity 0.15s'
        }}>⭐</div>
      ))}
    </div>
  )
}

function CelebrationScreen({ assignment, newTotal, nextReward, feedPostId, onClose, onTazkir }) {
  const router = useRouter()
  const [show, setShow]               = useState(false)
  const [step, setStep]               = useState('celebrate')
  const [saving, setSaving]           = useState(false)
  const [summarySaved, setSummarySaved] = useState(false)
  const [summary, setSummary]         = useState({ best_moment: '', funny_moment: '', quote: '', rating: 0 })

  const points = assignment.mission.points
  const isLearning = ['Learning','Reading','English','Hebrew'].includes(assignment.mission?.category)

  useEffect(() => { setTimeout(() => setShow(true), 50) }, [])

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
    fontSize: 14, color: 'white', background: 'rgba(255,255,255,0.08)',
    fontFamily: 'var(--font-heebo), sans-serif',
    boxSizing: 'border-box', outline: 'none', marginBottom: 10
  }

  const handleSaveSummary = async () => {
    if (!feedPostId) { setSummarySaved(true); return }
    setSaving(true)
    await supabase.from('feed_posts').update({
      best_moment:  summary.best_moment  || null,
      funny_moment: summary.funny_moment || null,
      quote:        summary.quote        || null,
      rating:       summary.rating       || null,
    }).eq('id', feedPostId)
    setSaving(false)
    setSummarySaved(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,22,40,0.95)',
      opacity: show ? 1 : 0, transition: 'opacity 0.3s ease',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl',
      overflowY: 'auto', padding: '20px 16px'
    }}>
      <Confetti />
      <div style={{
        background: NAVY, borderRadius: 28, padding: '28px 22px',
        maxWidth: 360, width: '100%', textAlign: 'center',
        border: `1px solid ${GOLD}40`, position: 'relative', zIndex: 1,
        transform: show ? 'scale(1)' : 'scale(0.85)',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>

        {step === 'celebrate' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <Avatar profile={assignment.member} size={72} />
                <div style={{
                  position: 'absolute', bottom: -4, right: -4,
                  background: GOLD, borderRadius: '50%', width: 26, height: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, border: '2px solid ' + NAVY
                }}>⭐</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 600 }}>
              כל הכבוד
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 6, lineHeight: 1.2 }}>
              {assignment.member.name}! 🎉
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 1.5 }}>
              {assignment.mission.title}
            </div>

            <div style={{
              background: isLearning ? PURPLE : GREEN,
              borderRadius: 20, padding: '16px 24px', marginBottom: 20
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 4 }}>
                צברת
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1 }}>+{points}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>נקודות</div>
            </div>

            {nextReward && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>סה״כ: {newTotal} נק׳</span>
                  <span style={{ fontSize: 12, color: GOLD, fontWeight: 700 }}>
                    עוד {nextReward.points_required - newTotal} ו{nextReward.title} נפתח ✨
                  </span>
                </div>
                <ProgressBar value={newTotal} max={nextReward.points_required} color={GOLD} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setStep('summary')} style={{
                padding: '13px', background: GOLD, border: 'none',
                borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 15, color: NAVY,
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>📋 הוסף סיכום</button>
              <button onClick={onTazkir} style={{
                padding: '13px', background: 'rgba(255,255,255,0.08)', border: 'none',
                borderRadius: 14, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-heebo), sans-serif'
              }}>📝 פותחים תחקיר על זה</button>
              <button onClick={onClose} style={{
                padding: '11px', background: 'transparent', border: 'none',
                cursor: 'pointer', fontWeight: 500, fontSize: 13,
                color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heebo), sans-serif'
              }}>חזרה לבית</button>
            </div>
          </>
        )}

        {step === 'summary' && !summarySaved && (
          <>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 6 }}>📋 סיכום</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
              {assignment.mission.title}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600 }}>🌟 הרגע הכי טוב</div>
              <input placeholder="מה היה השיא?" value={summary.best_moment}
                onChange={e => setSummary(s => ({ ...s, best_moment: e.target.value }))} style={inputStyle} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600 }}>😂 הרגע המצחיק</div>
              <input placeholder="מה גרם לכולם לצחוק?" value={summary.funny_moment}
                onChange={e => setSummary(s => ({ ...s, funny_moment: e.target.value }))} style={inputStyle} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600 }}>💬 ציטוט לזכור</div>
              <input placeholder="משהו שנאמר..." value={summary.quote}
                onChange={e => setSummary(s => ({ ...s, quote: e.target.value }))} style={inputStyle} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, fontWeight: 600 }}>⭐ דירוג</div>
              <StarRating value={summary.rating} onChange={v => setSummary(s => ({ ...s, rating: v }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <button onClick={handleSaveSummary} disabled={saving} style={{
                padding: '13px', background: GOLD, border: 'none',
                borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 15, color: NAVY,
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>{saving ? 'שומר...' : '💾 שמור'}</button>
              <button onClick={() => setStep('celebrate')} style={{
                padding: '11px', background: 'transparent', border: 'none',
                cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.4)',
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>← חזרה</button>
            </div>
          </>
        )}

        {summarySaved && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 8 }}>הסיכום נשמר!</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>הפיד המשפחתי עודכן</div>
            <button onClick={onClose} style={{
              width: '100%', padding: '13px', background: GOLD, border: 'none',
              borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 15, color: NAVY,
              fontFamily: 'var(--font-heebo), sans-serif'
            }}>חזרה לבית 🏠</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ActiveEarningPage() {
  const [assignments, setAssignments]       = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles]             = useState([])
  const [rewards, setRewards]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [celebration, setCelebration]       = useState(null)
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

    const [{ data: assignmentData }, { data: rewardData }, { data: profileData }] = await Promise.all([
      supabase.from('assignments').select(`*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)`)
        .in('status', ['active', 'submitted']).order('created_at', { ascending: false }),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('profiles').select('*').eq('active', true)
    ])

    if (assignmentData) setAssignments(assignmentData)
    if (rewardData) setRewards(rewardData)
    if (profileData) setProfiles(profileData)
    setLoading(false)
  }

  const getNextReward = (points) => rewards.find(r => r.points_required > points)

  const awardPoints = async (assignment) => {
    const points   = assignment.mission.points
    const memberId = assignment.assigned_to

    await supabase.from('assignments').update({
      status: 'completed', completed_at: new Date().toISOString()
    }).eq('id', assignment.id)

    await supabase.from('point_events').insert({
      member_id: memberId, points,
      reason: `צבר: ${assignment.mission.title}`,
      assignment_id: assignment.id
    })

    const { data: profile } = await supabase
      .from('profiles').select('total_points').eq('id', memberId).single()
    const newTotal = (profile?.total_points || 0) + points
    await supabase.from('profiles').update({ total_points: newTotal }).eq('id', memberId)

    const { data: feedPost } = await supabase.from('feed_posts').insert({
      type: 'mission_completed',
      title: `${assignment.member.name} צבר/ה נקודות! ${assignment.mission.title}`,
      content: `+${points} נקודות 🎉`,
      participants: [assignment.member.name],
      linked_type: 'assignment',
      linked_id: assignment.id,
      created_by: memberId
    }).select().single()

    const nextReward = getNextReward(newTotal)
    setCelebration({ assignment, newTotal, nextReward, feedPostId: feedPost?.id })
    loadData()
  }

  const handleComplete = async (assignment) => {
    const isResponsibility = assignment.mission.type === 'responsibility'
    const isParent = currentProfile?.role === 'parent'
    if (isResponsibility && !isParent) {
      await supabase.from('assignments').update({ status: 'submitted' }).eq('id', assignment.id)
      loadData()
    } else {
      await awardPoints(assignment)
    }
  }

  const closeCelebration = () => { setCelebration(null); router.push('/') }
  const openTazkir = () => {
    if (celebration) {
      router.push(`/tazkir/new?mission=${celebration.assignment.mission.id}&member=${celebration.assignment.assigned_to}`)
    }
  }

  const isParent = currentProfile?.role === 'parent'
  const visibleAssignments = isParent
    ? assignments
    : assignments.filter(a => a.member?.id === currentProfile?.id)

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: CREAM,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים...</div>
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

      {celebration && (
        <CelebrationScreen
          assignment={celebration.assignment}
          newTotal={celebration.newTotal}
          nextReward={celebration.nextReward}
          feedPostId={celebration.feedPostId}
          onClose={closeCelebration}
          onTazkir={openTazkir}
        />
      )}

      <div style={{
        background: NAVY, padding: '20px 16px 24px',
        borderRadius: '0 0 24px 24px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>⭐ בתהליך</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {isParent ? 'אשר השלמות ותן נקודות' : 'השלמת? קבל את הנקודות שלך'}
            </div>
          </div>
          <a href="/missions" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13 }}>
            ← צוברים
          </a>
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>
        {visibleAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>אין פעילויות בתהליך</div>
            <div style={{ fontSize: 13, color: '#8a7a60', marginBottom: 20 }}>בחר פעילות ותתחיל לצבור נקודות</div>
            <a href="/missions" style={{
              display: 'inline-block', padding: '12px 24px',
              background: NAVY, color: 'white', borderRadius: 14,
              textDecoration: 'none', fontWeight: 700, fontSize: 14
            }}>צוברים נקודות →</a>
          </div>
        ) : (
          visibleAssignments.map(a => {
            const isLearning  = ['Learning','Reading','English','Hebrew'].includes(a.mission?.category)
            const ptColor     = isLearning ? PURPLE : GREEN
            const isSubmitted = a.status === 'submitted'
            const memberProfile = profiles.find(p => p.id === a.assigned_to)

            return (
              <div key={a.id} style={{
                background: 'white', borderRadius: 16, marginBottom: 12,
                border: `1px solid ${isSubmitted ? GOLD + '60' : '#e8e0d0'}`,
                overflow: 'hidden'
              }}>
                <div style={{
                  background: isSubmitted ? '#fff8e8' : '#f7f4ee',
                  padding: '8px 14px',
                  borderBottom: `1px solid ${isSubmitted ? GOLD + '30' : '#f0ebe0'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {memberProfile && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: `2px solid ${GOLD}`, overflow: 'hidden',
                        background: '#e8d5a3', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, fontWeight: 700, color: NAVY, flexShrink: 0
                      }}>
                        {memberProfile.avatar_url
                          ? <img src={memberProfile.avatar_url} alt={memberProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : memberProfile.name?.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{a.member?.name}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: isSubmitted ? GOLD : '#e8e0d0',
                    color: isSubmitted ? NAVY : '#8a7a60'
                  }}>
                    {isSubmitted ? 'ממתין לאישור' : 'בתהליך'}
                  </span>
                </div>

                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, paddingLeft: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.3 }}>
                        {a.mission?.title}
                      </div>
                      {a.due_date && (
                        <div style={{ fontSize: 11, color: '#c45000', marginTop: 3, fontWeight: 600 }}>
                          ⏰ עד {new Date(a.due_date).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: ptColor, lineHeight: 1 }}>{a.mission?.points}</div>
                      <div style={{ fontSize: 10, color: ptColor, opacity: 0.7, fontWeight: 700 }}>נק׳</div>
                    </div>
                  </div>

                  {a.status === 'active' && !isParent && (
                    <button onClick={() => handleComplete(a)} style={{
                      width: '100%', padding: '12px', background: NAVY,
                      color: 'white', border: 'none', borderRadius: 12,
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>השלמתי! תן לי נקודות ⭐</button>
                  )}

                  {a.status === 'active' && isParent && (
                    <button onClick={() => handleComplete(a)} style={{
                      width: '100%', padding: '12px', background: GREEN,
                      color: 'white', border: 'none', borderRadius: 12,
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>✅ אשר והענק נקודות</button>
                  )}

                  {a.status === 'submitted' && isParent && (
                    <button onClick={() => handleComplete(a)} style={{
                      width: '100%', padding: '12px', background: GOLD,
                      color: NAVY, border: 'none', borderRadius: 12,
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>⭐ אשר ותן {a.mission?.points} נקודות</button>
                  )}

                  {a.status === 'submitted' && !isParent && (
                    <div style={{
                      textAlign: 'center', padding: '10px',
                      background: '#fff8e8', borderRadius: 12,
                      color: '#9a6500', fontWeight: 600, fontSize: 13
                    }}>ממתין לאישור הורה ⏳</div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <BottomNav />
    </div>
  )
}