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

const MISSION_GRADIENTS = [
  ['#1a6b3c', '#2d9e5f'], ['#0a1628', '#1e3a5f'],
  ['#7b2d8b', '#a855c8'], ['#c45000', '#e07030'],
  ['#1a6b8a', '#2892b8'], ['#9a6500', '#c9a84c'],
  ['#ad1457', '#d81b60'], ['#0a1628', '#2d4a9e'],
  ['#1a6b3c', '#43a870'], ['#5c3d8f', '#8b5cf6'],
]

const CATEGORY_VISUAL = {
  Funny:    { emoji: '😂' }, Creative: { emoji: '🎨' },
  Weekend:  { emoji: '🌅' }, Learning: { emoji: '🧠' },
  Reading:  { emoji: '📖' }, English:  { emoji: '🌍' },
  Hebrew:   { emoji: '✡️' }, Helping:  { emoji: '🤝' },
  Kindness: { emoji: '❤️' }, House:    { emoji: '🏠' },
  Outdoor:  { emoji: '🌿' }, Health:   { emoji: '💪' },
  Family:   { emoji: '👨‍👩‍👧' }, Memory:  { emoji: '📸' },
}

const CATEGORY_LABELS = {
  Family: 'משפחה', Learning: 'לומדים בכיף', Helping: 'עוזרים בבית',
  Creative: 'יצירה', Funny: 'מצחיקים', Outdoor: 'בחוץ',
  Reading: 'קריאה', English: 'אנגלית', Hebrew: 'עברית',
  Kindness: 'מעשים טובים', House: 'הבית שלנו', Memory: 'זיכרונות',
  Health: 'בריאות', Weekend: 'סופ״ש',
}

function Avatar({ profile, size = 36 }) {
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
    id: i, left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    color: [GOLD, '#fff', '#c9a84c', '#e8d5a3', GREEN][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 6, duration: `${Math.random() * 1.5 + 1.5}s`
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

function DocumentationForm({ assignment, onSubmit, onSkip }) {
  const [show, setShow]           = useState(false)
  const [text, setText]           = useState('')
  const [photo, setPhoto]         = useState(null)
  const [preview, setPreview]     = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { setTimeout(() => setShow(true), 50) }, [])

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleSubmit = async () => {
    let photoUrl = null
    if (photo) {
      setUploading(true)
      const ext = photo.name.split('.').pop()
      const filename = `missions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(filename, photo, { contentType: photo.type })
      if (!error) {
        const { data } = supabase.storage.from('family-media').getPublicUrl(filename)
        photoUrl = data.publicUrl
      }
      setUploading(false)
    }
    onSubmit({ text, photoUrl })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,22,40,0.97)',
      opacity: show ? 1 : 0, transition: 'opacity 0.3s ease',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl',
      overflowY: 'auto', padding: '20px 16px'
    }}>
      <div style={{
        background: NAVY, borderRadius: 28, padding: '28px 22px',
        maxWidth: 360, width: '100%',
        border: `1px solid ${GOLD}40`, position: 'relative', zIndex: 1,
        transform: show ? 'scale(1)' : 'scale(0.85)',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 4 }}>תעדו את הרגע</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{assignment.mission.title}</div>
        </div>

        <input type="file" accept="image/*" capture="environment"
          onChange={handlePhotoSelect} style={{ display: 'none' }} id="doc-camera" />
        <input type="file" accept="image/*"
          onChange={handlePhotoSelect} style={{ display: 'none' }} id="doc-gallery" />

        {preview ? (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <img src={preview} alt="preview" style={{
              width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover', display: 'block'
            }} />
            <button onClick={() => { setPhoto(null); setPreview(null) }} style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(10,22,40,0.7)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <label htmlFor="doc-camera" style={{
              flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)',
              borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)',
              textAlign: 'center', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)'
            }}>📷 מצלמה</label>
            <label htmlFor="doc-gallery" style={{
              flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)',
              borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)',
              textAlign: 'center', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)'
            }}>🖼️ גלריה</label>
          </div>
        )}

        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="ספר מה עשית... (לא חובה)"
          style={{
            width: '100%', padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
            fontSize: 14, color: 'white', background: 'rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-heebo), sans-serif',
            boxSizing: 'border-box', outline: 'none',
            resize: 'none', minHeight: 80, lineHeight: 1.6, marginBottom: 16
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleSubmit} disabled={uploading} style={{
            padding: '13px', background: GOLD, border: 'none', borderRadius: 14,
            cursor: 'pointer', fontWeight: 700, fontSize: 15, color: NAVY,
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            {uploading ? 'מעלה תמונה...' : 'סיימתי! תן לי נקודות ⭐'}
          </button>
          <button onClick={onSkip} style={{
            padding: '11px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>דלג</button>
        </div>
      </div>
    </div>
  )
}

function CelebrationScreen({ assignment, newTotal, nextReward, leveledUp, newLevel, newBadges, onClose, onTazkir }) {
  const [show, setShow] = useState(false)
  const points     = assignment.mission.points
  const isLearning = ['Learning','Reading','English','Hebrew'].includes(assignment.mission?.category)

  useEffect(() => { setTimeout(() => setShow(true), 50) }, [])

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

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 600 }}>כל הכבוד</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 6, lineHeight: 1.2 }}>
          {assignment.member.name}! 🎉
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 16, lineHeight: 1.5 }}>
          {assignment.mission.title}
        </div>

        {leveledUp && (
          <div style={{
            background: `linear-gradient(135deg, ${GOLD}, #e8c870)`,
            borderRadius: 16, padding: '12px 20px', marginBottom: 16
          }}>
            <div style={{ fontSize: 28 }}>🚀</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: NAVY, marginTop: 4 }}>עלית רמה!</div>
            <div style={{ fontSize: 13, color: NAVY, opacity: 0.7 }}>ברוך הבא לרמה {newLevel}</div>
          </div>
        )}

        <div style={{
          background: isLearning ? PURPLE : GREEN,
          borderRadius: 20, padding: '16px 24px', marginBottom: 16
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 4 }}>צברת</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1 }}>+{points}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>נקודות</div>
        </div>

        {newBadges?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>🏅 בדג׳ חדש!</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {newBadges.map(badge => (
                <div key={badge.id} style={{
                  background: 'rgba(255,255,255,0.08)', borderRadius: 12,
                  padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6,
                  border: `1px solid ${GOLD}40`
                }}>
                  <span style={{ fontSize: 20 }}>{badge.icon}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{badge.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
  const [docTarget, setDocTarget]           = useState(null)
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
      supabase.from('assignments')
        .select(`*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)`)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('profiles').select('*').eq('active', true)
    ])

    if (assignmentData) setAssignments(assignmentData)
    if (rewardData) setRewards(rewardData)
    if (profileData) setProfiles(profileData)
    setLoading(false)
  }

  const getNextReward = (points) => rewards.find(r => r.points_required > points)

  const awardPoints = async (assignment, doc = null) => {
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
      .from('profiles').select('total_points, level').eq('id', memberId).single()

    const oldLevel  = profile?.level || 1
    const newTotal  = (profile?.total_points || 0) + points
    const newLevel  = Math.floor(newTotal / 500) + 1
    const leveledUp = newLevel > oldLevel

    await supabase.from('profiles').update({ total_points: newTotal }).eq('id', memberId)

    const { checkAndAwardBadges } = await import('../../lib/badges')
    const newBadges = await checkAndAwardBadges(memberId)

    await supabase.from('feed_posts').insert({
      type: 'mission_completed',
      title: `${assignment.member.name} צבר/ה נקודות! ${assignment.mission.title}`,
      content: doc?.text || `+${points} נקודות 🎉`,
      media_urls: doc?.photoUrl ? [doc.photoUrl] : [],
      participants: [assignment.member.name],
      linked_type: 'assignment',
      linked_id: assignment.id,
      created_by: memberId
    })

    const nextReward = getNextReward(newTotal)
    setDocTarget(null)
    setCelebration({ assignment, newTotal, nextReward, leveledUp, newLevel, newBadges })
    loadData()
  }

  const handleComplete = (assignment) => {
    const isParent = currentProfile?.role === 'parent'
    if (isParent) {
      awardPoints(assignment)
    } else {
      setDocTarget(assignment)
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

      {docTarget && (
        <DocumentationForm
          assignment={docTarget}
          onSubmit={(doc) => awardPoints(docTarget, doc)}
          onSkip={() => awardPoints(docTarget)}
        />
      )}

      {celebration && (
        <CelebrationScreen
          assignment={celebration.assignment}
          newTotal={celebration.newTotal}
          nextReward={celebration.nextReward}
          leveledUp={celebration.leveledUp}
          newLevel={celebration.newLevel}
          newBadges={celebration.newBadges}
          onClose={closeCelebration}
          onTazkir={openTazkir}
        />
      )}

      <div style={{
        background: NAVY, padding: '20px 16px 24px',
        borderRadius: '0 0 24px 24px', marginBottom: 16
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>🏃 בתהליך</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
          {isParent ? 'אשר השלמות ותן נקודות' : 'סיימת? קבל את הנקודות שלך'}
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>
        {visibleAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>אין אתגרים בתהליך</div>
            <div style={{ fontSize: 13, color: '#8a7a60', marginBottom: 20 }}>בחר אתגר ותתחיל לצבור נקודות</div>
            <a href="/missions" style={{
              display: 'inline-block', padding: '12px 24px',
              background: NAVY, color: 'white', borderRadius: 14,
              textDecoration: 'none', fontWeight: 700, fontSize: 14
            }}>צוברים נקודות →</a>
          </div>
        ) : (
          visibleAssignments.map((a, index) => {
            const visual    = CATEGORY_VISUAL[a.mission?.category] || { emoji: '⭐' }
            const gradient  = MISSION_GRADIENTS[index % MISSION_GRADIENTS.length]
            const memberProfile = profiles.find(p => p.id === a.assigned_to)

            return (
              <div key={a.id} style={{
                borderRadius: 20, marginBottom: 14, overflow: 'hidden',
                border: '1px solid #e8e0d0'
              }}>
                {/* Same gradient header as mission cards */}
                <div style={{
                  background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                  padding: '18px 18px 16px',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                  minHeight: 90, position: 'relative'
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 30, marginBottom: 4 }}>{visual.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
                      {CATEGORY_LABELS[a.mission?.category] || a.mission?.category}
                    </div>
                    {a.due_date && (
                      <div style={{ fontSize: 11, color: '#f0c080', marginTop: 3, fontWeight: 600 }}>
                        ⏰ עד {new Date(a.due_date).toLocaleDateString('he-IL')}
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.15)', borderRadius: 14,
                      padding: '8px 14px', backdropFilter: 'blur(4px)', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1 }}>{a.mission?.points}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>נק׳</div>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ background: 'white', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    {memberProfile && <Avatar profile={memberProfile} size={32} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{a.mission?.title}</div>
                      {isParent && <div style={{ fontSize: 12, color: '#a09080', marginTop: 2 }}>{memberProfile?.name}</div>}
                    </div>
                  </div>

                  {!isParent && (
                    <button onClick={() => handleComplete(a)} style={{
                      width: '100%', padding: '12px', background: NAVY,
                      color: 'white', border: 'none', borderRadius: 12,
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>סיימתי! 🙌</button>
                  )}

                  {isParent && (
                    <button onClick={() => handleComplete(a)} style={{
                      width: '100%', padding: '12px', background: GOLD,
                      color: NAVY, border: 'none', borderRadius: 12,
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>⭐ אשר ותן {a.mission?.points} נקודות</button>
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