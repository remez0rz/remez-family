'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import ViewAsBanner from '../../components/ViewAsBanner'
import SpeakButton from '../../components/SpeakButton'
import { phrases } from '../../lib/hebrew'

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

function CelebrationScreen({ assignment, newTotal, nextReward, leveledUp, newLevel, newBadges, hasMedia, onShareGrandparents, onClose, onTazkir }) {
  const [show, setShow] = useState(false)
  const [shareState, setShareState] = useState('idle') // idle | sharing | done
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

        {/* Family Connection: show grandma & grandpa */}
        {hasMedia && (
          <div style={{
            background: 'rgba(155,127,212,0.18)', borderRadius: 20,
            padding: '14px 16px', marginBottom: 16, border: '1px solid rgba(155,127,212,0.35)'
          }}>
            {shareState === 'done' ? (
              <div style={{ fontSize: 14, fontWeight: 800, color: '#C084FC' }}>
                💜 נשלח לסבא וסבתא! +{5} נקודות חיבור
              </div>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 4 }}>רוצה להראות לסבא וסבתא? 💜</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>שתפו את הרגע וקבלו +5 נקודות חיבור משפחתיות</div>
                <button
                  onClick={async () => { setShareState('sharing'); await onShareGrandparents(); setShareState('done') }}
                  disabled={shareState === 'sharing'}
                  style={{
                    width: '100%', padding: '11px',
                    background: 'linear-gradient(135deg, #9B7FD4, #C084FC)',
                    border: 'none', borderRadius: 50, cursor: shareState === 'sharing' ? 'default' : 'pointer',
                    fontWeight: 800, fontSize: 14, color: 'white', fontFamily: 'var(--font-heebo), sans-serif'
                  }}>
                  {shareState === 'sharing' ? 'שולח...' : '💜 שתף עם סבא וסבתא (+5)'}
                </button>
              </>
            )}
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
  const [completedRecent, setCompletedRecent] = useState([])
  const [revoking, setRevoking]             = useState(new Set())
  const [removing, setRemoving]             = useState(new Set())
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

    const [{ data: assignmentData }, { data: rewardData }, { data: profileData }, { data: completedData }] = await Promise.all([
      supabase.from('assignments')
        .select(`*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)`)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('profiles').select('*').eq('active', true),
      profile.role === 'parent'
        ? supabase.from('assignments')
            .select(`*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)`)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [] })
    ])

    if (assignmentData) setAssignments(assignmentData)
    if (rewardData) setRewards(rewardData)
    if (profileData) setProfiles(profileData)
    if (completedData) setCompletedRecent(completedData)
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

    // Atomic award (ledger + total + XP + level in one transaction); returns the
    // new totals and whether this push crossed a level boundary.
    const { data: result } = await supabase.rpc('apply_points', {
      p_member_id: memberId,
      p_points: points,
      p_reason: `צבר: ${assignment.mission.title}`,
      p_assignment_id: assignment.id,
    }).single()

    const newTotal  = result?.total_points ?? 0
    const newLevel  = result?.level ?? 1
    const leveledUp = result?.leveled_up ?? false

    const { checkAndAwardBadges } = await import('../../lib/badges')
    const newBadges = await checkAndAwardBadges(memberId)

    if (assignment.mission.category !== 'Daily') {
      await supabase.from('feed_posts').insert({
        type: 'mission_completed',
        title: `${assignment.member.name} ${phrases.earnedPoints(assignment.member.gender)} נקודות! ${assignment.mission.title}`,
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
        body: JSON.stringify({ memberIds: [...parentIds, memberId], title: '🚀 עלית רמה!', body: `${assignment.member.name} ${phrases.reachedLevel(assignment.member.gender)} לרמה ${newLevel}!`, url: '/profiles', tag: 'levelup' })
      }).catch(() => {})
    }

    const nextReward = getNextReward(newTotal)  // next reward by balance
    setAwarding(prev => { const s = new Set(prev); s.delete(assignment.id); return s })
    setDocTarget(null)
    setCelebration({ assignment, newTotal, nextReward, leveledUp, newLevel, newBadges, hasMedia: !!doc?.photoUrl })
    loadData()
  }

  // Family Connection: a small, flat bonus for sharing a documented moment with
  // grandparents. No caps in v1 — kept deliberately small. The moment is already
  // in the feed (grandparents can see it); this just rewards the intent to share.
  const SHARE_BONUS = 5
  const shareWithGrandparents = async (assignment) => {
    const memberId = assignment.assigned_to
    await supabase.rpc('apply_points', {
      p_member_id: memberId,
      p_points: SHARE_BONUS,
      p_reason: 'בונוס שיתוף עם סבא וסבתא 💜',
      p_assignment_id: assignment.id,
    })
    // Let the grandparents know a new moment is waiting for them.
    const { data: gps } = await supabase.from('profiles')
      .select('id').eq('role', 'grandparent').eq('active', true)
    const ids = (gps || []).map(g => g.id)
    if (ids.length) {
      fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: ids, title: '💜 רגע חדש מהמשפחה', body: `${assignment.member.name} ${phrases.shared(assignment.member.gender)} רגע חדש`, url: '/feed', tag: 'share' })
      }).catch(() => {})
    }
  }

  const handleComplete = (assignment) => {
    if (!isParent || isViewingAsKid) {
      setDocTarget(assignment)
    } else {
      awardPoints(assignment)
    }
  }

  const revokeAssignment = async (assignment) => {
    if (revoking.has(assignment.id)) return
    setRevoking(prev => new Set([...prev, assignment.id]))

    const points   = assignment.mission?.points || 0
    const memberId = assignment.assigned_to

    // 1. Reset assignment back to active
    await supabase.from('assignments').update({
      status:        'active',
      completed_at:  null,
      approved_by:   null,
      approved_at:   null,
      proof_text:    null,
      proof_image_url: null,
    }).eq('id', assignment.id)

    // 2. Subtract points from profile (floor at 0, level recomputed). No ledger
    //    row — this is a reversal of the original award, not a new event.
    await supabase.rpc('apply_points', {
      p_member_id: memberId,
      p_points: -points,
      p_log_event: false,
    })

    // 3. Delete the linked feed post
    await supabase.from('feed_posts')
      .delete()
      .eq('linked_id', assignment.id)
      .eq('type', 'mission_completed')

    // 4. Update local state
    setCompletedRecent(prev => prev.filter(a => a.id !== assignment.id))
    setAssignments(prev => [...prev, { ...assignment, status: 'active', completed_at: null }])
    setRevoking(prev => { const n = new Set(prev); n.delete(assignment.id); return n })
  }

  // Remove an active assignment without awarding points (cancel / undo a mistaken assign)
  const removeAssignment = async (assignment) => {
    if (removing.has(assignment.id)) return
    if (!window.confirm(`להסיר את "${assignment.mission?.title}" מהמשימות הפעילות? (לא יינתנו נקודות)`)) return
    setRemoving(prev => new Set([...prev, assignment.id]))
    const { error } = await supabase.from('assignments').delete().eq('id', assignment.id)
    setRemoving(prev => { const n = new Set(prev); n.delete(assignment.id); return n })
    if (error) { alert('ההסרה נכשלה: ' + error.message); return }
    setAssignments(prev => prev.filter(a => a.id !== assignment.id))
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
          hasMedia={celebration.hasMedia}
          onShareGrandparents={() => shareWithGrandparents(celebration.assignment)}
          onClose={closeCelebration}
        />
      )}

      <div style={{
        background: HEADER_BG, padding: '14px 16px 14px',
        borderRadius: '0 0 24px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ fontSize: 22, fontWeight: 900, color: 'white', position: 'relative', zIndex: 1 }}>🏃 בתהליך</div>
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

                  {/* Points pill — top left */}
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, background: 'rgba(0,0,0,0.42)', borderRadius: 20, padding: '4px 11px', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: 'white', lineHeight: 1 }}>{a.mission?.points}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>נק׳</span>
                  </div>

                  {/* Category + due date — bottom right */}
                  <div style={{ position: 'absolute', bottom: 10, right: 12, zIndex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: a.due_date ? 3 : 0 }}>
                      <span style={{ fontSize: 17, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>{visual.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                        {CATEGORY_LABELS[a.mission?.category] || a.mission?.category}
                      </span>
                    </div>
                    {a.due_date && (
                      <div style={{ fontSize: 10, color: '#f0c080', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        ⏰ עד {new Date(a.due_date).toLocaleDateString('he-IL')}
                      </div>
                    )}
                  </div>

                  {/* Read aloud — bottom left, floating */}
                  <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2 }}>
                    <SpeakButton onBg size={40} text={[a.mission?.title, a.mission?.description]} />
                  </div>
                </div>

                {/* Card body */}
                <div style={{ background: 'white', padding: '14px 16px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.3, marginBottom: isParent ? 8 : 12 }}>{a.mission?.title}</div>
                  {isParent && memberProfile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Avatar profile={memberProfile} size={22} />
                      <span style={{ fontSize: 12, color: '#a09080', fontWeight: 600 }}>{memberProfile.name}</span>
                    </div>
                  )}

                  {(!isParent || isViewingAsKid) && (
                    <button onClick={() => handleComplete(a)} style={{
                      width: '100%', padding: '12px', background: CORAL,
                      color: 'white', border: 'none', borderRadius: 50, whiteSpace: 'nowrap',
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>סיימתי! 🙌</button>
                  )}

                  {isParent && !isViewingAsKid && (
                    <button onClick={() => handleComplete(a)} disabled={awarding.has(a.id)} style={{
                      width: '100%', padding: '12px',
                      background: awarding.has(a.id) ? '#e8e0d0' : GOLD,
                      color: awarding.has(a.id) ? '#a09080' : NAVY,
                      border: 'none', borderRadius: 50, whiteSpace: 'nowrap',
                      cursor: awarding.has(a.id) ? 'default' : 'pointer',
                      fontWeight: 700, fontSize: 14,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>{awarding.has(a.id) ? 'מעבד...' : `⭐ אשר +${a.mission?.points}`}</button>
                  )}

                  {isParent && !isViewingAsKid && (
                    <button onClick={() => removeAssignment(a)} disabled={removing.has(a.id)} style={{
                      width: '100%', padding: '8px', marginTop: 8,
                      background: 'transparent', color: '#b06a6a',
                      border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>{removing.has(a.id) ? 'מסיר...' : '✕ הסר מהפעילות'}</button>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        )}
      </div>

      {/* ── Parent-only: completed missions with revoke option ── */}
      {isParent && !isViewingAsKid && completedRecent.length > 0 && (
        <div className="app-body" style={{ boxSizing: 'border-box', paddingTop: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            padding: '10px 14px', background: 'rgba(255,107,107,0.07)',
            borderRadius: 16, border: '1px solid rgba(255,107,107,0.15)'
          }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>הושלמו לאחרונה</div>
              <div style={{ fontSize: 11, color: '#a09080' }}>ניתן לבטל אם הייתה טעות</div>
            </div>
          </div>

          {completedRecent.map(a => {
            const memberProfile = profiles.find(p => p.id === a.assigned_to)
            const when = a.completed_at
              ? new Date(a.completed_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : ''
            return (
              <div key={a.id} style={{
                background: 'white', borderRadius: 16, padding: '12px 14px',
                marginBottom: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>
                  {a.mission?.image_url
                    ? <img src={a.mission.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                    : '✅'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.mission?.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#a09080', marginTop: 2 }}>
                    {memberProfile?.name} · {when} · +{a.mission?.points} נק׳
                  </div>
                  {a.proof_text && (
                    <div style={{ fontSize: 11, color: '#7a6a5a', marginTop: 3, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{a.proof_text}"
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`לבטל "${a.mission?.title}" ולהחזיר ${a.mission?.points} נקודות?`)) {
                      revokeAssignment(a)
                    }
                  }}
                  disabled={revoking.has(a.id)}
                  style={{
                    background: revoking.has(a.id) ? '#e8e0d0' : '#FFF0F0',
                    color: revoking.has(a.id) ? '#a09080' : '#cc4444',
                    border: `1px solid ${revoking.has(a.id) ? '#e0d8c8' : '#FFCCCC'}`,
                    borderRadius: 20, padding: '6px 12px', cursor: revoking.has(a.id) ? 'default' : 'pointer',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    fontFamily: 'var(--font-heebo), sans-serif'
                  }}>
                  {revoking.has(a.id) ? '...' : '↩️ בטל'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <BottomNav />
    </div>
  )
}