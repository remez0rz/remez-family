'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import ViewAsBanner from '../../components/ViewAsBanner'

const CORAL = '#FF6B6B'
const TEAL = '#4ECDC4'
const GOLD = '#FFB830'
const NAVY = '#2D2D2D'
const PURPLE = '#5c3d8f'
const PAGE_BG = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'
const HEADER_BG = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'

const MISSION_GRADIENTS = [
  ['#FF6B6B','#FF8E53'], ['#4ECDC4','#2EBFB8'],
  ['#9B7FD4','#C084FC'], ['#FFB830','#FFD166'],
  ['#3B9FE8','#60B8FF'], ['#FF6B6B','#FF8E53'],
  ['#4ECDC4','#2EBFB8'], ['#9B7FD4','#C084FC'],
  ['#FFB830','#FFD166'], ['#3B9FE8','#60B8FF'],
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
      border: '3px solid rgba(255,255,255,0.8)', overflow: 'hidden', flexShrink: 0,
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
    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 10 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.6s ease', boxShadow: `0 0 8px ${color}80` }} />
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    color: [CORAL, TEAL, GOLD, '#fff', '#ffffff'][Math.floor(Math.random() * 5)],
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
  const [media, setMedia]         = useState(null)
  const [preview, setPreview]     = useState(null)
  const [isVideo, setIsVideo]     = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { setTimeout(() => setShow(true), 50) }, [])

  const handleMediaSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setMedia(file)
    setIsVideo(file.type.startsWith('video/'))
    setPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleSubmit = async () => {
    let photoUrl = null
    if (media) {
      setUploading(true)
      const ext = media.name.split('.').pop()
      const filename = `missions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(filename, media, { contentType: media.type })
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.07)', position: 'relative', zIndex: 1,
        transform: show ? 'scale(1)' : 'scale(0.85)',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 4 }}>איך הלך?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{assignment.mission.title}</div>
        </div>

        <input type="file" accept="image/*" capture="environment"
          onChange={handleMediaSelect} style={{ display: 'none' }} id="doc-cam-photo" />
        <input type="file" accept="video/*" capture="environment"
          onChange={handleMediaSelect} style={{ display: 'none' }} id="doc-cam-video" />
        <input type="file" accept="image/*,video/*" multiple
          onChange={handleMediaSelect} style={{ display: 'none' }} id="doc-gallery" />

        {preview ? (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            {isVideo ? (
              <video src={preview} controls style={{
                width: '100%', borderRadius: 12, maxHeight: 200, display: 'block', background: '#000'
              }} />
            ) : (
              <img src={preview} alt="preview" style={{
                width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover', display: 'block'
              }} />
            )}
            <button onClick={() => { setMedia(null); setPreview(null); setIsVideo(false) }} style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(10,22,40,0.7)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <label htmlFor="doc-cam-photo" style={{
              padding: '12px 6px', background: 'rgba(255,255,255,0.08)',
              borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)',
              textAlign: 'center', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)'
            }}>📷<br /><span style={{ fontSize: 11 }}>תמונה</span></label>
            <label htmlFor="doc-cam-video" style={{
              padding: '12px 6px', background: 'rgba(255,255,255,0.08)',
              borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)',
              textAlign: 'center', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)'
            }}>🎬<br /><span style={{ fontSize: 11 }}>סרטון</span></label>
            <label htmlFor="doc-gallery" style={{
              padding: '12px 6px', background: 'rgba(255,255,255,0.08)',
              borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)',
              textAlign: 'center', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)'
            }}>🖼️<br /><span style={{ fontSize: 11 }}>גלריה</span></label>
          </div>
        )}

        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="משהו קצר על מה שעשית... (לא חובה)"
          style={{
            width: '100%', padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
            fontSize: 14, color: 'white', background: 'rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-heebo), sans-serif',
            boxSizing: 'border-box', outline: 'none',
            resize: 'none', minHeight: 60, lineHeight: 1.6, marginBottom: 16
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleSubmit} disabled={uploading} style={{
            padding: '13px', background: CORAL, border: 'none', borderRadius: 50,
            cursor: 'pointer', fontWeight: 700, fontSize: 15, color: 'white',
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            {uploading ? 'שולח...' : 'סיימתי! תן לי נקודות ⭐'}
          </button>
          <button onClick={onSkip} style={{
            padding: '11px', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>דלג (בלי תמונה)</button>
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.07)', position: 'relative', zIndex: 1,
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
          background: isLearning ? PURPLE : TEAL,
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
          <button onClick={onClose} style={{
            padding: '14px', background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`,
            border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 800, fontSize: 16,
            color: 'white', fontFamily: 'var(--font-heebo), sans-serif',
            boxShadow: '0 4px 16px rgba(255,107,107,0.4)'
          }}>⭐ לעוד אתגרים!</button>
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
  const [awarding, setAwarding]             = useState(new Set())
  const [viewAsId, setViewAsId]             = useState(null)
  const router = useRouter()

  useEffect(() => {
    const saved = sessionStorage.getItem('viewAsProfileId')
    if (saved) setViewAsId(saved)
  }, [])

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
    if (awarding.has(assignment.id)) return
    setAwarding(prev => new Set([...prev, assignment.id]))
    const points   = assignment.mission.points
    const memberId = assignment.assigned_to

    await supabase.from('assignments').update({
      status: 'completed', completed_at: new Date().toISOString(),
      proof_text: doc?.text || null,
      proof_image_url: doc?.photoUrl || null
    }).eq('id', assignment.id)

    await supabase.from('point_events').insert({
      member_id: memberId, points,
      reason: `צבר: ${assignment.mission.title}`,
      assignment_id: assignment.id
    })

    const { data: profile } = await supabase
      .from('profiles').select('total_points, total_experience, level').eq('id', memberId).single()

    const oldLevel  = profile?.level || 1
    const newTotal  = (profile?.total_points || 0) + points
    const newXP     = (profile?.total_experience || 0) + points
    const newLevel  = Math.floor(newXP / 500) + 1
    const leveledUp = newLevel > oldLevel

    await supabase.from('profiles').update({ total_points: newTotal, total_experience: newXP, level: newLevel }).eq('id', memberId)

    const { checkAndAwardBadges } = await import('../../lib/badges')
    const newBadges = await checkAndAwardBadges(memberId)

    if (assignment.mission.category !== 'Daily') {
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
    }

    // Push: notify family on level-up, notify parents on any completion
    if (leveledUp) {
      const { data: parents } = await supabase.from('profiles').select('id').eq('role', 'parent').eq('active', true)
      const parentIds = (parents || []).map(p => p.id)
      fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: [...parentIds, memberId], title: '🚀 עלית רמה!', body: `${assignment.member.name} הגיע/ה לרמה ${newLevel}!`, url: '/profiles', tag: 'levelup' })
      }).catch(() => {})
    }

    const nextReward = getNextReward(newTotal)  // next reward by balance
    setAwarding(prev => { const s = new Set(prev); s.delete(assignment.id); return s })
    setDocTarget(null)
    setCelebration({ assignment, newTotal, nextReward, leveledUp, newLevel, newBadges })
    loadData()
  }

  const handleComplete = (assignment) => {
    if (!isParent || isViewingAsKid) {
      setDocTarget(assignment)
    } else {
      awardPoints(assignment)
    }
  }

  const closeCelebration = () => {
    setCelebration(null)
    // Parent stays on active page to approve more; kid goes to pick new missions
    router.push(isParent && !isViewingAsKid ? '/missions/active' : '/missions')
  }

  const isParent = currentProfile?.role === 'parent'
  const viewAsProfile = viewAsId ? profiles.find(p => p.id === viewAsId) : null
  const isViewingAsKid = isParent && !!viewAsProfile
  const visibleAssignments = (isParent && !isViewingAsKid)
    ? assignments
    : assignments.filter(a => a.member?.id === (isViewingAsKid ? viewAsProfile?.id : currentProfile?.id))

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: PAGE_BG,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <div style={{ color: CORAL, fontSize: 14 }}>טוענים...</div>
      </div>
    </div>
  )

  return (
    <div className="app-page" style={{
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: PAGE_BG,
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box'
    }}>

      <ViewAsBanner viewAsProfile={viewAsProfile} />

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
        />
      )}

      <div style={{
        background: HEADER_BG, padding: '20px 16px 24px',
        borderRadius: '0 0 24px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ fontSize: 22, fontWeight: 900, color: 'white', position: 'relative', zIndex: 1 }}>🏃 בתהליך</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, position: 'relative', zIndex: 1, fontWeight: 600 }}>
          {(isParent && !isViewingAsKid) ? 'אשר השלמות ותן נקודות' : 'סיימת? קבל את הנקודות שלך'}
        </div>
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>
        {visibleAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>אין אתגרים בתהליך</div>
            <div style={{ fontSize: 13, color: '#8a7a60', marginBottom: 20 }}>בחר אתגר ותתחיל לצבור נקודות</div>
            <a href="/missions" style={{
              display: 'inline-block', padding: '12px 24px',
              background: CORAL, color: 'white', borderRadius: 50,
              textDecoration: 'none', fontWeight: 700, fontSize: 14
            }}>צוברים נקודות →</a>
          </div>
        ) : (
          <div className="cards-grid">
          {visibleAssignments.map((a, index) => {
            const visual        = CATEGORY_VISUAL[a.mission?.category] || { emoji: '⭐' }
            const gradient      = MISSION_GRADIENTS[index % MISSION_GRADIENTS.length]
            const memberProfile = profiles.find(p => p.id === a.assigned_to)
            const hasImage      = !!a.mission?.image_url

            return (
              <div key={a.id} style={{ borderRadius: 24, marginBottom: 14, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.1)' }}>

                {/* Visual header */}
                <div style={{
                  position: 'relative', height: 160,
                  background: hasImage
                    ? `url(${a.mission.image_url}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                }}>
                  {hasImage && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
                  )}

                  {/* Points badge */}
                  <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 1 }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.18)', borderRadius: 14,
                      padding: '7px 13px', backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.28)', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'white', lineHeight: 1 }}>{a.mission?.points}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>נק׳</div>
                    </div>
                  </div>

                  {/* Category + due date */}
                  <div style={{ position: 'absolute', bottom: 12, right: 14, zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: a.due_date ? 4 : 0 }}>
                      <span style={{ fontSize: 20 }}>{visual.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        {CATEGORY_LABELS[a.mission?.category] || a.mission?.category}
                      </span>
                    </div>
                    {a.due_date && (
                      <div style={{ fontSize: 10, color: '#f0c080', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        ⏰ עד {new Date(a.due_date).toLocaleDateString('he-IL')}
                      </div>
                    )}
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

                  {(!isParent || isViewingAsKid) && (
                    <button onClick={() => handleComplete(a)} style={{
                      width: '100%', padding: '12px', background: CORAL,
                      color: 'white', border: 'none', borderRadius: 50,
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>סיימתי! 🙌</button>
                  )}

                  {isParent && !isViewingAsKid && (
                    <button onClick={() => handleComplete(a)} disabled={awarding.has(a.id)} style={{
                      width: '100%', padding: '12px',
                      background: awarding.has(a.id) ? '#e8e0d0' : GOLD,
                      color: awarding.has(a.id) ? '#a09080' : NAVY,
                      border: 'none', borderRadius: 50,
                      cursor: awarding.has(a.id) ? 'default' : 'pointer',
                      fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>{awarding.has(a.id) ? 'מעבד...' : `⭐ אשר ותן ${a.mission?.points} נקודות`}</button>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}