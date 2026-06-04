'use client'
import { useState, useEffect } from 'react'
import { supabase, getCurrentProfile } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import BottomNav from '../../components/BottomNav'

const NAVY  = '#2D2D2D'
const CORAL = '#FF6B6B'
const TEAL  = '#4ECDC4'
const GOLD  = '#FFB830'
const HEADER_BG = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
const PAGE_BG   = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'

function Avatar({ profile, size = 44, selected = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${selected ? CORAL : '#e0d8c8'}`,
      overflow: 'hidden', flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      background: selected ? '#FFD5E8' : '#f0ebe0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: NAVY,
      boxShadow: selected ? `0 0 0 3px ${CORAL}33` : 'none',
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
          background: CORAL, borderRadius: '50%', width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: 'white', fontWeight: 900, border: '1.5px solid white'
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
          fontSize: 30, cursor: 'pointer',
          opacity: star <= value ? 1 : 0.2,
          transition: 'opacity 0.15s'
        }}>⭐</div>
      ))}
    </div>
  )
}

function Section({ emoji, label, sublabel, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '16px 16px', marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{label}</div>
          {sublabel && <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 1 }}>{sublabel}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #ede8e0', borderRadius: 12,
  fontSize: 14, color: NAVY, background: '#faf8f4',
  fontFamily: 'var(--font-heebo), sans-serif',
  boxSizing: 'border-box', outline: 'none'
}

const textareaStyle = {
  ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6
}

function MediaPreview({ files, attachments, onRemoveMedia, onRemoveAttachment, onSetCover }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Cover image */}
      {files.length > 0 && (
        <div style={{ position: 'relative' }}>
          {files[0].type.startsWith('video/') ? (
            <video src={files[0].preview} controls style={{ width: '100%', borderRadius: 14, maxHeight: 220, objectFit: 'cover', display: 'block' }} />
          ) : (
            <img src={files[0].preview} alt="cover" style={{ width: '100%', borderRadius: 14, maxHeight: 220, objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{ position: 'absolute', top: 8, right: 8, background: CORAL, color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>שער</div>
          <button onClick={() => onRemoveMedia(0)} style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
      {/* Additional media thumbnails */}
      {files.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {files.slice(1).map((f, i) => (
            <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
              {f.type.startsWith('video/')
                ? <video src={f.preview} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                : <img src={f.preview} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
              }
              <button onClick={() => onRemoveMedia(i + 1)} style={{ position: 'absolute', top: -4, left: -4, background: NAVY, border: 'none', borderRadius: '50%', width: 20, height: 20, color: 'white', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              <button onClick={() => onSetCover(i + 1)} style={{ position: 'absolute', bottom: -4, right: -4, background: GOLD, border: 'none', borderRadius: '50%', width: 20, height: 20, color: NAVY, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>★</button>
            </div>
          ))}
        </div>
      )}
      {/* File attachments */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attachments.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f0e8', borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ fontSize: 18 }}>📎</span>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              <button onClick={() => onRemoveAttachment(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a09080', fontSize: 14 }}>✕</button>
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
  const [attachFiles, setAttachFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [showLinkHelper, setShowLinkHelper] = useState(false)
  const [ogPreview, setOgPreview] = useState(null)
  const [ogLoading, setOgLoading] = useState(false)
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

    const { data: profileData } = await supabase.from('profiles').select('*').eq('active', true)
    if (profileData) setProfiles(profileData)


    // Handle URL params (search, Web Share Target, direct link)
    const sharedTitle = searchParams.get('title') || searchParams.get('text')
    const sharedUrl   = searchParams.get('url')
    const missionId   = searchParams.get('mission')

    if (sharedTitle) setForm(f => ({ ...f, title: sharedTitle }))
    if (sharedUrl)   setLinkUrl(sharedUrl)

    if (missionId) {
      const { data: mission } = await supabase.from('missions').select('title').eq('id', missionId).single()
      if (mission) setForm(f => ({ ...f, title: `מבצע: ${mission.title}` }))
    }

    const memberId = searchParams.get('member')
    if (memberId) setParticipants([memberId])
    else setParticipants([profile.id])
  }

  const fetchOGPreview = async (url) => {
    if (!url || !url.startsWith('http')) { setOgPreview(null); return }
    setOgLoading(true)
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`)
      if (res.ok) { const data = await res.json(); setOgPreview(data) }
      else setOgPreview(null)
    } catch { setOgPreview(null) }
    setOgLoading(false)
  }

  const isUrl = (s) => /^https?:\/\//i.test(s.trim())

  const toggleParticipant = (id) => {
    setParticipants(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleMediaSelect = (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    const newFiles = selected.map(file => ({ file, preview: URL.createObjectURL(file), type: file.type, name: file.name }))
    setMediaFiles(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  const handleAttachSelect = (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    setAttachFiles(prev => [...prev, ...selected])
    e.target.value = ''
  }

  const removeMedia = (index) => {
    setMediaFiles(prev => { const u = [...prev]; URL.revokeObjectURL(u[index].preview); u.splice(index,1); return u })
  }
  const removeAttachment = (index) => setAttachFiles(prev => prev.filter((_, i) => i !== index))
  const setCover = (index) => {
    setMediaFiles(prev => { const u = [...prev]; const [item] = u.splice(index,1); return [item, ...u] })
  }

  const uploadAllFiles = async () => {
    setUploading(true)
    const mediaUrls = []

    // Upload media (images/videos)
    for (const media of mediaFiles) {
      const ext = media.name.split('.').pop()
      const path = `tahkirim/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(path, media.file, { contentType: media.type })
      if (!error) {
        const { data } = supabase.storage.from('family-media').getPublicUrl(path)
        mediaUrls.push(data.publicUrl)
      }
    }

    // Upload file attachments
    for (const file of attachFiles) {
      const ext = file.name.split('.').pop()
      const path = `tahkirim/files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(path, file, { contentType: file.type })
      if (!error) {
        const { data } = supabase.storage.from('family-media').getPublicUrl(path)
        mediaUrls.push(data.publicUrl)
      }
    }

    // Add manually entered image URL
    if (imgUrl.trim()) mediaUrls.unshift(imgUrl.trim())

    setUploading(false)
    return mediaUrls
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setLoading(true)

    const allMediaUrls = await uploadAllFiles()
    const participantNames = profiles.filter(p => participants.includes(p.id)).map(p => p.name)

    // Add link to content if provided
    const contentWithLink = [form.what_happened, linkUrl.trim() ? `🔗 ${linkUrl.trim()}` : ''].filter(Boolean).join('\n\n')

    const { data: tazkir, error } = await supabase.from('tahkirim').insert({
      title: form.title,
      what_happened: contentWithLink || form.what_happened,
      funny_moment: form.funny_moment,
      best_moment: form.best_moment,
      quote: form.quote,
      rating: form.rating || null,
      would_repeat: form.would_repeat,
      participants: participantNames,
      created_by: currentProfile.id,
      media_urls: allMediaUrls,
    }).select().single()

    if (!error && tazkir) {
      await supabase.from('feed_posts').insert({
        type: 'tahkir',
        title: form.title,
        content: form.what_happened || '',
        best_moment: form.best_moment || null,
        funny_moment: form.funny_moment || null,
        quote: form.quote || null,
        rating: form.rating || null,
        participants: participantNames,
        linked_type: 'tahkir',
        linked_id: tazkir.id,
        created_by: currentProfile.id,
        media_urls: allMediaUrls,
      })
    }

    setLoading(false)
    if (!error) { setSaved(true); setTimeout(() => router.push('/feed'), 1800) }
  }

  if (saved) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: HEADER_BG, fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 64 }}>📝</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>התחקיר נשמר!</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>עובר לפיד המשפחה...</div>
    </div>
  )

  return (
    <div className="app-page" style={{ fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', background: PAGE_BG, minHeight: '100vh', paddingBottom: '5.5rem', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ background: HEADER_BG, padding: '20px 16px 24px', borderRadius: '0 0 24px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>📝 תחקיר חדש</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 2, fontWeight: 600 }}>
              {form.title.trim() ? form.title : 'תעדו את מה שקרה — לפני שישכחו'}
            </div>
          </div>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, color: 'white', fontSize: 12, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif', fontWeight: 700 }}>← חזרה</button>
        </div>
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>

        {/* Title */}
        <Section emoji="🎯" label="שם המבצע" sublabel="איך נקרא למה שעשיתם?">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="למשל: מבצע הכריות הגדול" name="tazkir-title"
            style={inputStyle} />
        </Section>

        {/* Participants */}
        <Section emoji="👥" label="צוות המבצע" sublabel="מי היה שם?">
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {profiles.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Avatar profile={p} size={48} selected={participants.includes(p.id)} onClick={() => toggleParticipant(p.id)} />
                <span style={{ fontSize: 11, fontWeight: 600, color: participants.includes(p.id) ? CORAL : '#a09080' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Media — 4 separate buttons */}
        <Section emoji="📸" label="ראיות מהשטח" sublabel="תמונות, סרטונים וקבצים">
          {/* File inputs */}
          <input type="file" accept="image/*" capture="environment" onChange={handleMediaSelect} style={{ display: 'none' }} id="cam-photo" />
          <input type="file" accept="video/*" capture="environment" onChange={handleMediaSelect} style={{ display: 'none' }} id="cam-video" />
          <input type="file" accept="image/*,video/*" multiple onChange={handleMediaSelect} style={{ display: 'none' }} id="media-gallery" />
          <input type="file" accept="*/*" multiple onChange={handleAttachSelect} style={{ display: 'none' }} id="file-attach" />

          {(mediaFiles.length > 0 || attachFiles.length > 0) && (
            <div style={{ marginBottom: 10 }}>
              <MediaPreview files={mediaFiles} attachments={attachFiles} onRemoveMedia={removeMedia} onRemoveAttachment={removeAttachment} onSetCover={setCover} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { id: 'cam-photo',  emoji: '📷', label: 'צלם תמונה' },
              { id: 'cam-video',  emoji: '🎬', label: 'צלם סרטון' },
              { id: 'media-gallery', emoji: '🖼️', label: 'גלריה' },
              { id: 'file-attach',   emoji: '📎', label: 'קבצים' },
            ].map(btn => (
              <label key={btn.id} htmlFor={btn.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 8px', background: '#faf8f4',
                borderRadius: 14, border: '1.5px dashed #d8d0c8',
                textAlign: 'center', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: '#6b5e4e'
              }}>{btn.emoji} {btn.label}</label>
            ))}
          </div>

          {/* Image from web */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4 }}>🌐 תמונה מהאינטרנט</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input value={imgUrl} onChange={e => setImgUrl(e.target.value)}
                placeholder="חפש תמונה בגוגל ← הדבק כתובת תמונה..."
                type="url"
                style={{ ...inputStyle, fontSize: 12, flex: 1 }} />
              <a href={`https://www.google.com/search?q=${encodeURIComponent(form.title || 'תמונה')}&tbm=isch`}
                target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 10px', background: '#34A853', borderRadius: 12,
                  color: 'white', textDecoration: 'none', fontSize: 16, flexShrink: 0,
                  gap: 4
                }} title="חפש תמונות בגוגל">🖼️</a>
            </div>
            <div style={{ fontSize: 10, color: '#a09080', marginBottom: 6 }}>
              לחץ 🖼️ לחיפוש גוגל תמונות → לחץ לחיצה ארוכה על תמונה → העתק כתובת → הדבק כאן
            </div>
            {imgUrl && imgUrl.startsWith('http') && (
              <img src={imgUrl} alt="preview" onError={e => e.target.style.display='none'}
                style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
            )}
          </div>

          {(mediaFiles.length > 0 || attachFiles.length > 0) && (
            <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 6, textAlign: 'center' }}>
              {mediaFiles.length} מדיה · {attachFiles.length} קבצים · הראשון הוא תמונת השער · ★ להחלפה
            </div>
          )}
        </Section>

        {/* Web link — with Google search + OG preview */}
        <Section emoji="🔗" label="קישור לאינטרנט" sublabel="כתבה, אתר, הזמנה, מפה...">
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={linkUrl}
              onChange={e => { setLinkUrl(e.target.value); setOgPreview(null) }}
              onBlur={e => fetchOGPreview(e.target.value)}
              placeholder="חפש שם מקום, אתר, אירוע... או הדבק קישור"
              style={{ ...inputStyle, flex: 1 }} />
            <a href={`https://www.google.com/search?q=${encodeURIComponent(linkUrl || 'חיפוש')}`}
              target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 12px', background: '#4285F4', borderRadius: 12,
                color: 'white', textDecoration: 'none', fontSize: 18, flexShrink: 0
              }} title="חפש בגוגל">🔍</a>
          </div>

          {/* OG preview card */}
          {ogLoading && <div style={{ fontSize: 11, color: '#a09080', marginTop: 6, textAlign: 'center' }}>טוען תצוגה מקדימה...</div>}
          {ogPreview && !ogLoading && (
            <a href={ogPreview.url || linkUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', gap: 10, marginTop: 8, padding: '10px 12px',
              background: '#f8f8f8', borderRadius: 12, border: '1px solid #e8e0d0',
              textDecoration: 'none', overflow: 'hidden'
            }}>
              {ogPreview.image && <img src={ogPreview.image} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{ogPreview.title}</div>
                {ogPreview.description && <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ogPreview.description}</div>}
                <div style={{ fontSize: 10, color: '#3B9FE8', marginTop: 3 }}>{ogPreview.siteName || new URL(ogPreview.url || linkUrl).hostname}</div>
              </div>
            </a>
          )}
          {linkUrl && isUrl(linkUrl) && !ogPreview && !ogLoading && (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#3B9FE8', fontWeight: 600, textDecoration: 'none' }}>
              🔗 {linkUrl.length > 50 ? linkUrl.slice(0,50)+'...' : linkUrl}
            </a>
          )}
          <div style={{ fontSize: 11, color: '#a09080', marginTop: 6 }}>
            💡 טיפ: בכל אפליקציה ← "שתף" ← "משפחת רמז" ← הקישור מגיע ישירות לכאן
          </div>
        </Section>

        {/* Story */}
        <Section emoji="📖" label="מה קרה?" sublabel="ספרו את הסיפור">
          <textarea value={form.what_happened} onChange={e => setForm(f => ({ ...f, what_happened: e.target.value }))}
            placeholder="תארו מה עשיתם, לאן הלכתם, מה קרה..."
            name="what_happened" autoComplete="on"
            style={textareaStyle} />
        </Section>

        <Section emoji="🌟" label="רגע השיא" sublabel="הרגע הכי טוב">
          <input value={form.best_moment} onChange={e => setForm(f => ({ ...f, best_moment: e.target.value }))}
            placeholder="הרגע שכולם יזכרו..."
            name="best_moment" autoComplete="on"
            style={inputStyle} />
        </Section>

        <Section emoji="😂" label="תקלה מצחיקה" sublabel="מה גרם לכולם לצחוק?">
          <input value={form.funny_moment} onChange={e => setForm(f => ({ ...f, funny_moment: e.target.value }))}
            placeholder="הרגע המביך / המצחיק / המפתיע..."
            name="funny_moment" autoComplete="on"
            style={inputStyle} />
        </Section>

        <Section emoji="💬" label="משפט שחייבים לזכור" sublabel="ציטוט מהמבצע">
          <input value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
            placeholder='״משהו שאחד אמר שגרם לכולם...״'
            name="quote" autoComplete="on"
            style={inputStyle} />
        </Section>

        <Section emoji="⭐" label="כמה כוכבים קיבל המבצע?">
          <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
        </Section>

        <Section emoji="🔁" label="האם נחזור על זה?">
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ value: true, label: 'בהחלט! 🙌' }, { value: false, label: 'חד פעמי 😅' }].map(opt => (
              <button key={String(opt.value)} onClick={() => setForm(f => ({ ...f, would_repeat: opt.value }))} style={{
                flex: 1, padding: '11px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: form.would_repeat === opt.value ? CORAL : '#f0ebe0',
                color: form.would_repeat === opt.value ? 'white' : '#6b5e4e',
                fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif',
                boxShadow: form.would_repeat === opt.value ? '0 4px 12px rgba(255,107,107,0.3)' : 'none',
                transition: 'all 0.15s'
              }}>{opt.label}</button>
            ))}
          </div>
        </Section>

        {/* Save */}
        <button onClick={handleSubmit} disabled={loading || !form.title.trim()} style={{
          width: '100%', padding: '15px',
          background: form.title.trim() ? `linear-gradient(135deg, ${CORAL}, #FF8E53)` : '#e0d8c8',
          color: 'white', border: 'none', borderRadius: 50,
          cursor: form.title.trim() ? 'pointer' : 'default',
          fontWeight: 900, fontSize: 16,
          fontFamily: 'var(--font-heebo), sans-serif',
          boxSizing: 'border-box', marginTop: 8,
          boxShadow: form.title.trim() ? '0 4px 16px rgba(255,107,107,0.4)' : 'none'
        }}>
          {loading ? (uploading ? `⏳ מעלה קבצים...` : '💾 שומר...') : '📁 שמור לזיכרונות המשפחה'}
        </button>

      </div>
      <BottomNav />
    </div>
  )
}

export default function NewTazkirPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
        <div style={{ fontSize: 32 }}>📝</div>
      </div>
    }>
      <TazkirForm />
    </Suspense>
  )
}
