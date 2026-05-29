'use client'
import { useState, useEffect } from 'react'
import { supabase, getCurrentProfile } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'

function Avatar({ profile, size = 44, selected = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${selected ? GOLD : '#e0d8c8'}`,
      overflow: 'hidden', flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      background: selected ? '#e8d5a3' : '#f0ebe0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: NAVY,
      boxShadow: selected ? `0 0 0 3px ${GOLD}55` : 'none',
      transition: 'all 0.15s', position: 'relative'
    }}>
      {profile.avatar_url && !imgError
        ? <img src={profile.avatar_url} alt={profile.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : profile.name?.charAt(0)}
      {selected && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          background: GOLD, borderRadius: '50%', width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: NAVY, fontWeight: 900, border: '1.5px solid white'
        }}>✓</div>
      )}
    </div>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[1,2,3,4,5].map(star => (
        <div key={star} onClick={() => onChange(star)} style={{
          fontSize: 32, cursor: 'pointer',
          opacity: star <= value ? 1 : 0.25,
          transition: 'opacity 0.15s'
        }}>⭐</div>
      ))}
    </div>
  )
}

function Field({ emoji, label, sublabel, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '14px 16px',
      marginBottom: 10, border: '1px solid #e8e0d0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{label}</div>
          {sublabel && <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 1 }}>{sublabel}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #e0d8c8', borderRadius: 10,
  fontSize: 14, color: NAVY, background: '#faf8f4',
  fontFamily: 'var(--font-heebo), sans-serif',
  boxSizing: 'border-box', outline: 'none'
}

const textareaStyle = {
  ...inputStyle, resize: 'vertical',
  minHeight: 80, lineHeight: 1.6
}

function TazkirForm() {
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    title: '',
    what_happened: '',
    funny_moment: '',
    best_moment: '',
    quote: '',
    rating: 0,
    would_repeat: null,
  })
  const [participants, setParticipants] = useState([])
  const router = useRouter()
  const searchParams = useSearchParams()

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

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('active', true)
    if (profileData) setProfiles(profileData)

    // Prefill from celebration screen URL params
    const missionId = searchParams.get('mission')
    if (missionId) {
      const { data: mission } = await supabase
        .from('missions').select('title').eq('id', missionId).single()
      if (mission) setForm(f => ({ ...f, title: `מבצע: ${mission.title}` }))
    }

    const memberId = searchParams.get('member')
    if (memberId) setParticipants([memberId])
    else setParticipants([profile.id])
  }

  const toggleParticipant = (id) => {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setLoading(true)

    const participantNames = profiles
      .filter(p => participants.includes(p.id))
      .map(p => p.name)

    const { data: tazkir, error: tazkirError } = await supabase
      .from('tahkirim')
      .insert({
        title: form.title,
        what_happened: form.what_happened,
        funny_moment: form.funny_moment,
        best_moment: form.best_moment,
        quote: form.quote,
        rating: form.rating || null,
        would_repeat: form.would_repeat,
        participants: participantNames,
        created_by: currentProfile.id,
      })
      .select()
      .single()

    if (!tazkirError && tazkir) {
      await supabase.from('feed_posts').insert({
        type: 'tahkir',
        title: form.title,
        content: form.funny_moment || form.what_happened || '',
        participants: participantNames,
        linked_type: 'tahkir',
        linked_id: tazkir.id,
        created_by: currentProfile.id,
      })
    }

    setLoading(false)
    if (!tazkirError) {
      setSaved(true)
      setTimeout(() => router.push('/feed'), 1800)
    }
  }

  if (saved) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: NAVY,
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl',
      flexDirection: 'column', gap: 16, textAlign: 'center', padding: 24
    }}>
      <div style={{ fontSize: 56 }}>📝</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>התחקיר נשמר!</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
        עובר לפיד המשפחה...
      </div>
    </div>
  )

  return (
    <div style={{
      width: '100%', maxWidth: 480, margin: '0 auto',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: CREAM,
      minHeight: '100vh', paddingBottom: '2rem',
      boxSizing: 'border-box', overflowX: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 16px 24px',
        borderRadius: '0 0 24px 24px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>📝 תחקיר מבצע</div>
          <a href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13 }}>← בית</a>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          תעדו את מה שקרה — לפני שישכחו
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>

        {/* Mission name */}
        <Field emoji="🎯" label="שם המבצע" sublabel="איך נקרא למה שעשיתם?">
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="למשל: מבצע הכריות הגדול"
            style={inputStyle}
          />
        </Field>

        {/* Participants */}
        <Field emoji="👥" label="צוות המבצע" sublabel="מי היה שם?">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {profiles.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Avatar
                  profile={p} size={46}
                  selected={participants.includes(p.id)}
                  onClick={() => toggleParticipant(p.id)}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: participants.includes(p.id) ? NAVY : '#a09080' }}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </Field>

        {/* What happened */}
        <Field emoji="📖" label="מה קרה?" sublabel="ספרו את הסיפור">
          <textarea
            value={form.what_happened}
            onChange={e => setForm(f => ({ ...f, what_happened: e.target.value }))}
            placeholder="תארו מה עשיתם, לאן הלכתם, מה קרה..."
            style={textareaStyle}
          />
        </Field>

        {/* Best moment */}
        <Field emoji="🌟" label="רגע השיא" sublabel="הרגע הכי טוב">
          <input
            value={form.best_moment}
            onChange={e => setForm(f => ({ ...f, best_moment: e.target.value }))}
            placeholder="הרגע שכולם יזכרו..."
            style={inputStyle}
          />
        </Field>

        {/* Funny moment */}
        <Field emoji="😂" label="תקלה מצחיקה" sublabel="מה גרם לכולם לצחוק?">
          <input
            value={form.funny_moment}
            onChange={e => setForm(f => ({ ...f, funny_moment: e.target.value }))}
            placeholder="הרגע המביך / המצחיק / המפתיע..."
            style={inputStyle}
          />
        </Field>

        {/* Quote */}
        <Field emoji="💬" label="משפט שחייבים לזכור" sublabel="ציטוט מהמבצע">
          <input
            value={form.quote}
            onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
            placeholder='״משהו שאחד אמר שגרם לכולם...״'
            style={inputStyle}
          />
        </Field>

        {/* Rating */}
        <Field emoji="⭐" label="כמה כוכבים קיבל המבצע?">
          <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
        </Field>

        {/* Would repeat */}
        <Field emoji="🔁" label="האם נחזור על זה?">
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { value: true,  label: 'בהחלט! 🙌' },
              { value: false, label: 'חד פעמי 😅' },
            ].map(opt => (
              <button key={String(opt.value)} onClick={() => setForm(f => ({ ...f, would_repeat: opt.value }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: form.would_repeat === opt.value ? NAVY : '#f0ebe0',
                  color: form.would_repeat === opt.value ? 'white' : '#6b5e4e',
                  fontWeight: 700, fontSize: 14,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  transition: 'all 0.15s'
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !form.title.trim()}
          style={{
            width: '100%', padding: '15px',
            background: form.title.trim() ? GOLD : '#e0d8c8',
            color: form.title.trim() ? NAVY : '#a09080',
            border: 'none', borderRadius: 16, cursor: form.title.trim() ? 'pointer' : 'default',
            fontWeight: 900, fontSize: 17,
            fontFamily: 'var(--font-heebo), sans-serif',
            boxSizing: 'border-box', marginTop: 4
          }}>
          {loading ? 'שומר...' : '📁 שמור לזיכרונות המשפחה'}
        </button>

      </div>
    </div>
  )
}

export default function NewTazkirPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM }}>
        <div style={{ fontSize: 32 }}>📝</div>
      </div>
    }>
      <TazkirForm />
    </Suspense>
  )
}