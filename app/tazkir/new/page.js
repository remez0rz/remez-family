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

function MediaPreview({ files, onRemove, onSetCover }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Cover — first file, large */}
      {files.length > 0 && (
        <div style={{ position: 'relative' }}>
          {files[0].type.startsWith('video/') ? (
            <video
              src={files[0].preview}
              controls
              style={{ width: '100%', borderRadius: 12, maxHeight: 220, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <img
              src={files[0].preview}
              alt="cover"
              style={{ width: '100%', borderRadius: 12, maxHeight: 220, objectFit: 'cover', display: 'block' }}
            />
          )}
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: GOLD, color: NAVY,
            fontSize: 10, fontWeight: 700, padding: '3px 8px',
            borderRadius: 20
          }}>תמונת שער</div>
          <button onClick={() => onRemove(0)} style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(10,22,40,0.7)', border: 'none',
            borderRadius: '50%', width: 28, height: 28,
            color: 'white', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
      )}

      {/* Rest — thumbnail row */}
      {files.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {files.slice(1).map((f, i) => (
            <div key={i} style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              {f.type.startsWith('video/') ? (
                <video
                  src={f.preview}
                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <img
                  src={f.preview}
                  alt={`media-${i}`}
                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }}
                />
              )}
              <button onClick={() => onRemove(i + 1)} style={{
                position: 'absolute', top: -4, left: -4,
                background: NAVY, border: 'none', borderRadius: '50%',
                width: 20, height: 20, color: 'white', cursor: 'pointer',
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
              <button onClick={() => onSetCover(i + 1)} style={{
                position: 'absolute', bottom: -4, right: -4,
                background: GOLD, border: 'none', borderRadius: '50%',
                width: 20, height: 20, color: NAVY, cursor: 'pointer',
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900
              }}>★</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TazkirForm() {
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mediaFiles, setMediaFiles] = useState([])
  const [uploading, setUploading] = useState(false)
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

  const handleMediaSelect = (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    const newFiles = selected.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
    }))
    setMediaFiles(prev => [...prev, ...newFiles])
    // reset input so same file can be re-added if needed
    e.target.value = ''
  }

  const removeMedia = (index) => {
    setMediaFiles(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const setCover = (index) => {
    setMediaFiles(prev => {
      const updated = [...prev]
      const [item] = updated.splice(index, 1)
      return [item, ...updated]
    })
  }

  const uploadAllMedia = async () => {
    if (!mediaFiles.length) return []
    setUploading(true)
    const urls = []
    for (const media of mediaFiles) {
      const ext = media.name.split('.').pop()
      const filename = `tahkirim/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('family-media')
        .upload(filename, media.file, { contentType: media.type })
      if (!error) {
        const { data } = supabase.storage.from('family-media').getPublicUrl(filename)
        urls.push(data.publicUrl)
      }
    }
    setUploading(false)
    return urls
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setLoading(true)

    const mediaUrls = await uploadAllMedia()

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
        media_urls: mediaUrls,
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
        media_urls: mediaUrls,
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
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>עובר לפיד המשפחה...</div>
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

        {/* Media upload */}
        <Field emoji="📸" label="ראיות מהשטח" sublabel="תמונות וסרטונים מהמבצע">
          <input
            type="file"
            accept="image/*,video/*"
            capture="environment"
            multiple
            onChange={handleMediaSelect}
            style={{ display: 'none' }}
            id="media-camera"
          />
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaSelect}
            style={{ display: 'none' }}
            id="media-gallery"
          />

          {mediaFiles.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <MediaPreview
                files={mediaFiles}
                onRemove={removeMedia}
                onSetCover={setCover}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <label htmlFor="media-camera" style={{
              flex: 1, padding: '11px', background: '#f0ebe0',
              borderRadius: 12, border: '1.5px dashed #c8bfb0',
              textAlign: 'center', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#6b5e4e'
            }}>
              📷 מצלמה
            </label>
            <label htmlFor="media-gallery" style={{
              flex: 1, padding: '11px', background: '#f0ebe0',
              borderRadius: 12, border: '1.5px dashed #c8bfb0',
              textAlign: 'center', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#6b5e4e'
            }}>
              🖼️ גלריה
            </label>
          </div>

          {mediaFiles.length > 0 && (
            <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 6, textAlign: 'center' }}>
              {mediaFiles.length} קבצים · הראשון הוא תמונת השער · לחץ ★ להחלפה
            </div>
          )}
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
              <button key={String(opt.value)}
                onClick={() => setForm(f => ({ ...f, would_repeat: opt.value }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: 12,
                  border: 'none', cursor: 'pointer',
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
            border: 'none', borderRadius: 16,
            cursor: form.title.trim() ? 'pointer' : 'default',
            fontWeight: 900, fontSize: 17,
            fontFamily: 'var(--font-heebo), sans-serif',
            boxSizing: 'border-box', marginTop: 4
          }}>
          {loading
            ? (uploading ? `מעלה ${mediaFiles.length} קבצים...` : 'שומר...')
            : '📁 שמור לזיכרונות המשפחה'}
        </button>

      </div>
    </div>
  )
}

export default function NewTazkirPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: CREAM
      }}>
        <div style={{ fontSize: 32 }}>📝</div>
      </div>
    }>
      <TazkirForm />
    </Suspense>
  )
}