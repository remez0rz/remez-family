'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, getCurrentProfile } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import BottomNav from '../../components/BottomNav'

const NAVY      = '#2D2D2D'
const CORAL     = '#FF6B6B'
const GOLD      = '#FFB830'
const HEADER_BG = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
const PAGE_BG   = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'

const inputStyle = {
  width: '100%', padding: '11px 13px',
  border: '1.5px solid #ede8e0', borderRadius: 12,
  fontSize: 14, color: NAVY, background: '#faf8f4',
  fontFamily: 'var(--font-heebo), sans-serif',
  boxSizing: 'border-box', outline: 'none', lineHeight: 1.5
}

// ── Small helper components ────────────────────────────────────────────────────

function Avatar({ profile, size = 46, selected = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${selected ? CORAL : '#e0d8c8'}`,
      overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
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
          background: CORAL, borderRadius: '50%', width: 15, height: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, color: 'white', fontWeight: 900, border: '1.5px solid white'
        }}>✓</div>
      )}
    </div>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1,2,3,4,5].map(star => (
        <div key={star} onClick={() => onChange(star === value ? 0 : star)} style={{
          fontSize: 28, cursor: 'pointer',
          opacity: star <= value ? 1 : 0.2,
          transition: 'opacity 0.1s'
        }}>⭐</div>
      ))}
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', borderRadius: 18, padding: '14px 15px',
      marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', ...style
    }}>
      {children}
    </div>
  )
}

function FieldLabel({ emoji, text, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{text}</div>
        {sub && <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Media preview grid ──────────────────────────────────────────────────────────
function MediaGrid({ files, attachments, onRemove, onRemoveAttach, onSetCover }) {
  if (!files.length && !attachments.length) return null
  return (
    <div style={{ marginBottom: 10 }}>
      {/* Cover */}
      {files.length > 0 && (
        <div style={{ position: 'relative', marginBottom: files.length > 1 ? 6 : 0 }}>
          {files[0].type.startsWith('video/')
            ? <video src={files[0].preview} controls style={{ width: '100%', borderRadius: 12, maxHeight: 200, display: 'block' }} />
            : <img src={files[0].preview} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover', display: 'block' }} />
          }
          <div style={{ position: 'absolute', top: 7, right: 7, background: CORAL, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>שער</div>
          <button onClick={() => onRemove(0)} style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: 'white', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
      {/* Thumbnails */}
      {files.length > 1 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {files.slice(1).map((f, i) => (
            <div key={i} style={{ position: 'relative', width: 66, height: 66 }}>
              {f.type.startsWith('video/')
                ? <video src={f.preview} style={{ width: 66, height: 66, borderRadius: 9, objectFit: 'cover', display: 'block' }} />
                : <img src={f.preview} alt="" style={{ width: 66, height: 66, borderRadius: 9, objectFit: 'cover', display: 'block' }} />
              }
              <button onClick={() => onRemove(i + 1)} style={{ position: 'absolute', top: -4, left: -4, background: NAVY, border: 'none', borderRadius: '50%', width: 18, height: 18, color: 'white', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              <button onClick={() => onSetCover(i + 1)} title="הפוך לשער" style={{ position: 'absolute', bottom: -4, right: -4, background: GOLD, border: 'none', borderRadius: '50%', width: 18, height: 18, color: NAVY, cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>★</button>
            </div>
          ))}
        </div>
      )}
      {/* File attachments */}
      {attachments.map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f0e8', borderRadius: 10, padding: '7px 10px', marginTop: 6 }}>
          <span style={{ fontSize: 16 }}>📎</span>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
          <button onClick={() => onRemoveAttach(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a09080', fontSize: 13 }}>✕</button>
        </div>
      ))}
      {(files.length > 1 || attachments.length > 0) && (
        <div style={{ fontSize: 10, color: '#a09080', marginTop: 5, textAlign: 'center' }}>
          {files.length} מדיה · {attachments.length} קבצים · ★ שנה שער
        </div>
      )}
    </div>
  )
}

// ── Main form ──────────────────────────────────────────────────────────────────
function TazkirForm() {
  const [profile, setProfile]         = useState(null)
  const [profiles, setProfiles]       = useState([])
  const [participants, setParticipants] = useState([])
  const [mediaFiles, setMediaFiles]   = useState([])   // {file, preview, type, name}
  const [attachFiles, setAttachFiles] = useState([])   // File[]
  const [linkUrl, setLinkUrl]         = useState('')
  const [imgUrl, setImgUrl]           = useState('')
  const [resolvedImgUrl, setResolvedImgUrl] = useState('') // actual image URL (may differ from imgUrl if og:image extracted)
  const [imgResolving, setImgResolving]     = useState(false)
  const [ogPreview, setOgPreview]     = useState(null)
  const [ogLoading, setOgLoading]     = useState(false)
  const [showExtras, setShowExtras]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [form, setForm] = useState({
    title: '', what_happened: '', best_moment: '',
    funny_moment: '', quote: '', rating: 0, would_repeat: null,
  })
  const router       = useRouter()
  const searchParams = useSearchParams()
  const ogAbortRef      = useRef(null)
  const imgAbortRef     = useRef(null)
  const mediaFilesRef   = useRef([])

  // Keep ref in sync (so unmount cleanup can access latest mediaFiles)
  useEffect(() => { mediaFilesRef.current = mediaFiles }, [mediaFiles])

  // Clean up blob URLs ONLY on unmount — NOT on every mediaFiles change
  // (Running on every change would revoke URLs still in use by the preview)
  useEffect(() => {
    return () => { mediaFilesRef.current.forEach(f => URL.revokeObjectURL(f.preview)) }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadData()
    })
  }, [])

  const loadData = async () => {
    const p = await getCurrentProfile()
    if (!p) { router.push('/login'); return }
    setProfile(p)

    const [{ data: profileData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true),
    ])
    if (profileData) setProfiles(profileData)

    // Pre-fill from Web Share Target / direct link params
    const sharedTitle = searchParams.get('title') || searchParams.get('text')
    const sharedUrl   = searchParams.get('url')
    const missionId   = searchParams.get('mission')
    const memberId    = searchParams.get('member')

    if (sharedTitle) setForm(f => ({ ...f, title: sharedTitle }))
    if (sharedUrl)   { setLinkUrl(sharedUrl); fetchOGPreview(sharedUrl) }
    if (memberId)    setParticipants([memberId])
    else             setParticipants([p.id])

    if (missionId) {
      const { data: mission } = await supabase.from('missions').select('title').eq('id', missionId).single()
      if (mission) setForm(f => ({ ...f, title: `מבצע: ${mission.title}` }))
    }
  }

  const fetchOGPreview = async (url) => {
    if (!url?.startsWith('http')) { setOgPreview(null); return }
    // Cancel any in-flight fetch
    ogAbortRef.current?.abort()
    ogAbortRef.current = new AbortController()
    setOgLoading(true)
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`, { signal: ogAbortRef.current.signal })
      if (res.ok) setOgPreview(await res.json())
      else setOgPreview(null)
    } catch { setOgPreview(null) }
    setOgLoading(false)
  }

  // Check if URL looks like a direct image file
  const isDirectImage = (url) => /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(url)

  // When user blurs imgUrl field: if it's not a direct image, try to extract og:image
  const resolveImgUrl = async (url) => {
    if (!url?.startsWith('http')) { setResolvedImgUrl(''); return }
    if (isDirectImage(url)) { setResolvedImgUrl(url); return }

    // Not a direct image — try OG preview to get the og:image
    imgAbortRef.current?.abort()
    imgAbortRef.current = new AbortController()
    setImgResolving(true)
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`, { signal: imgAbortRef.current.signal })
      if (res.ok) {
        const data = await res.json()
        setResolvedImgUrl(data.image || url) // use og:image if found, else keep original
      } else {
        setResolvedImgUrl(url)
      }
    } catch { setResolvedImgUrl(url) }
    setImgResolving(false)
  }

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setMediaFiles(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), type: f.type, name: f.name }))])
    e.target.value = ''
  }

  const handleAttachSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setAttachFiles(prev => [...prev, ...files])
    e.target.value = ''
  }

  const removeMedia = (i) => setMediaFiles(prev => {
    const next = [...prev]
    URL.revokeObjectURL(next[i].preview)
    next.splice(i, 1)
    return next
  })

  const removeAttach = (i) => setAttachFiles(prev => prev.filter((_, idx) => idx !== i))

  const setCover = (i) => setMediaFiles(prev => {
    const next = [...prev]
    const [item] = next.splice(i, 1)
    return [item, ...next]
  })

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.title.trim() || saving) return
    setSaving(true)
    setSaveError('')

    // Upload everything in parallel
    const uploadMedia = mediaFiles.map(async (m) => {
      const path = `tahkirim/${Date.now()}-${Math.random().toString(36).slice(2)}.${m.name.split('.').pop()}`
      const { error } = await supabase.storage.from('family-media').upload(path, m.file, { contentType: m.type })
      if (error) return null
      return supabase.storage.from('family-media').getPublicUrl(path).data.publicUrl
    })

    const uploadAttach = attachFiles.map(async (f) => {
      const path = `tahkirim/files/${Date.now()}-${Math.random().toString(36).slice(2)}.${f.name.split('.').pop()}`
      const { error } = await supabase.storage.from('family-media').upload(path, f, { contentType: f.type })
      if (error) return null
      return supabase.storage.from('family-media').getPublicUrl(path).data.publicUrl
    })

    const allResults = await Promise.all([...uploadMedia, ...uploadAttach])
    const mediaUrls  = allResults.filter(Boolean)

    // Web image: use resolved URL (may be og:image extracted from a page), fallback to raw input
    const finalImgUrl = (resolvedImgUrl || imgUrl).trim()
    if (finalImgUrl) {
      if (mediaUrls.length === 0) mediaUrls.unshift(finalImgUrl)
      else mediaUrls.push(finalImgUrl)
    }

    const participantNames = profiles.filter(p => participants.includes(p.id)).map(p => p.name)

    // Store link in what_happened if no explicit field
    const fullContent = [
      form.what_happened,
      linkUrl.trim() && !form.what_happened.includes(linkUrl) ? `🔗 ${linkUrl.trim()}` : ''
    ].filter(Boolean).join('\n\n')

    const { data: tazkir, error } = await supabase.from('tahkirim').insert({
      title:         form.title.trim(),
      what_happened: fullContent || null,
      best_moment:   form.best_moment  || null,
      funny_moment:  form.funny_moment || null,
      quote:         form.quote        || null,
      rating:        form.rating       || null,
      would_repeat:  form.would_repeat,
      participants:  participantNames,
      created_by:    profile.id,
      media_urls:    mediaUrls,
    }).select().single()

    if (error || !tazkir) {
      setSaveError('שגיאה בשמירה — נסו שוב (' + (error?.message || 'שגיאה לא ידועה') + ')')
      setSaving(false)
      return
    }

    const { error: feedError } = await supabase.from('feed_posts').insert({
      type:         'tahkir',
      title:        form.title.trim(),
      content:      form.what_happened || '',
      best_moment:  form.best_moment   || null,
      funny_moment: form.funny_moment  || null,
      quote:        form.quote         || null,
      rating:       form.rating        || null,
      would_repeat: form.would_repeat,
      participants: participantNames,
      linked_type:  'tahkir',
      linked_id:    tazkir.id,
      created_by:   profile.id,
      media_urls:   mediaUrls,
    })

    if (feedError) {
      // The tahkir itself is saved, but it won't appear in the feed — make that
      // visible instead of swallowing it, so we never silently lose a memory.
      setSaveError('התחקיר נשמר, אך לא הצלחנו להוסיף אותו ליומן: ' + feedError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setTimeout(() => router.push('/feed'), 1600)
    setSaving(false)
  }

  // ── Saved screen ──────────────────────────────────────────────────────────────
  if (saved) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: HEADER_BG, fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', flexDirection: 'column', gap: 14, textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 60 }}>📝</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>התחקיר נשמר!</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>עובר לפיד המשפחה...</div>
    </div>
  )

  const canSave   = form.title.trim().length > 0
  const hasExtras = form.what_happened || form.best_moment || form.funny_moment || form.quote || form.rating || form.would_repeat !== null || linkUrl

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="app-page" style={{ fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', background: PAGE_BG, minHeight: '100vh', paddingBottom: '6rem', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ background: HEADER_BG, padding: '20px 16px 22px', borderRadius: '0 0 22px 22px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 900, color: 'white' }}>📝 תחקיר חדש</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 2, fontWeight: 600 }}>
              {form.title.trim() || 'תעדו את מה שקרה — לפני שישכחו'}
            </div>
          </div>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, color: 'white', fontSize: 12, padding: '6px 13px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif', fontWeight: 700 }}>← חזרה</button>
        </div>
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>

        {/* ── 1. Title — required ── */}
        <Card>
          <FieldLabel emoji="🎯" text="שם המבצע" sub="שדה חובה — שאר השדות לא חובה" />
          <input value={form.title} onChange={setField('title')}
            placeholder="למשל: מסעדת הנמל, יום כיף בפארק, מבצע הכריות..."
            name="tazkir-title" autoComplete="off"
            style={inputStyle} />
        </Card>

        {/* ── 2. Media — primary action ── */}
        <Card>
          <FieldLabel emoji="📸" text="תמונות וסרטונים" sub="הוסף מהמצלמה, גלריה, או קבצים" />

          {/* Hidden inputs */}
          <input type="file" accept="image/*"           capture="environment" onChange={handleMediaSelect} style={{ display: 'none' }} id="t-cam-photo" />
          <input type="file" accept="video/*"           capture="environment" onChange={handleMediaSelect} style={{ display: 'none' }} id="t-cam-video" />
          <input type="file" accept="image/*,video/*"   multiple             onChange={handleMediaSelect} style={{ display: 'none' }} id="t-gallery" />
          <input type="file" accept="*/*"               multiple             onChange={handleAttachSelect} style={{ display: 'none' }} id="t-files" />

          <MediaGrid files={mediaFiles} attachments={attachFiles} onRemove={removeMedia} onRemoveAttach={removeAttach} onSetCover={setCover} />

          {/* 4 buttons: 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { id: 't-cam-photo', emoji: '📷', label: 'צלם תמונה' },
              { id: 't-cam-video', emoji: '🎬', label: 'צלם סרטון' },
              { id: 't-gallery',  emoji: '🖼️',  label: 'גלריה' },
              { id: 't-files',    emoji: '📎',  label: 'קבצים' },
            ].map(b => (
              <label key={b.id} htmlFor={b.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 8px', background: '#faf8f4',
                borderRadius: 13, border: '1.5px dashed #d8d0c8',
                cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6b5e4e'
              }}>{b.emoji} {b.label}</label>
            ))}
          </div>

          {/* Web image URL — secondary, compact */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0ebe0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a09080', marginBottom: 5 }}>
              🌐 תמונה מהאינטרנט
              <span style={{ fontWeight: 400, marginRight: 4 }}>— הדבק קישור לתמונה, או קישור לאתר (נחלץ תמונה אוטומטית)</span>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <input value={imgUrl}
                onChange={e => { setImgUrl(e.target.value); setResolvedImgUrl('') }}
                onBlur={e => resolveImgUrl(e.target.value)}
                type="url"
                placeholder="הדבק כתובת תמונה או קישור לאתר..."
                style={{ ...inputStyle, fontSize: 12, flex: 1, padding: '8px 10px' }} />
              <a href={`https://www.google.com/search?q=${encodeURIComponent(form.title || 'תמונה')}&tbm=isch`}
                target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, background: '#34A853', borderRadius: 10,
                  color: 'white', textDecoration: 'none', fontSize: 18, flexShrink: 0
                }} title="גוגל תמונות — לחץ ימני על תמונה ← 'העתק כתובת תמונה'">🖼️</a>
            </div>
            {imgResolving && <div style={{ fontSize: 11, color: '#a09080', marginTop: 5 }}>🔍 מחפש תמונה...</div>}
            {resolvedImgUrl && !imgResolving && (
              <div style={{ position: 'relative', marginTop: 6 }}>
                <img src={resolvedImgUrl} alt=""
                  onError={e => { e.target.parentElement.style.display = 'none' }}
                  style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                {resolvedImgUrl !== imgUrl && (
                  <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 20 }}>
                    ✓ תמונה חולצה אוטומטית
                  </div>
                )}
                <button onClick={() => { setImgUrl(''); setResolvedImgUrl('') }} style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: 'white', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}
          </div>
        </Card>

        {/* ── 3. Participants — compact ── */}
        <Card>
          <FieldLabel emoji="👥" text="מי היה שם?" />
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {profiles.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Avatar profile={p} size={46} selected={participants.includes(p.id)} onClick={() => setParticipants(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                <span style={{ fontSize: 10, fontWeight: 600, color: participants.includes(p.id) ? CORAL : '#a09080' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── EXPAND: Add more details ── */}
        <button onClick={() => setShowExtras(v => !v)} style={{
          width: '100%', padding: '12px', marginBottom: 10,
          background: showExtras ? 'white' : 'rgba(255,107,107,0.07)',
          border: `1.5px ${showExtras ? 'solid #ede8e0' : 'dashed #FFB8B8'}`,
          borderRadius: 16, cursor: 'pointer',
          fontWeight: 700, fontSize: 13, color: showExtras ? '#8a7a60' : CORAL,
          fontFamily: 'var(--font-heebo), sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          {showExtras ? '↑ סגור פרטים נוספים' : `📖 הוסף פרטים לתחקיר${hasExtras ? ' ✓' : ' (אופציונלי)'}`}
        </button>

        {showExtras && (
          <>
            {/* Story */}
            <Card>
              <FieldLabel emoji="📖" text="מה קרה?" sub="ספרו את הסיפור בחופשיות" />
              <textarea value={form.what_happened} onChange={setField('what_happened')}
                placeholder="לאן הלכתם, מה עשיתם, מה קרה בדרך..."
                name="what_happened" autoComplete="on"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} />
            </Card>

            <Card>
              <FieldLabel emoji="🌟" text="רגע השיא" sub="הרגע הכי טוב" />
              <input value={form.best_moment} onChange={setField('best_moment')}
                placeholder="הרגע שכולם יזכרו..." name="best_moment" autoComplete="on"
                style={inputStyle} />
            </Card>

            <Card>
              <FieldLabel emoji="😂" text="רגע מצחיק" sub="מה גרם לכולם לצחוק?" />
              <input value={form.funny_moment} onChange={setField('funny_moment')}
                placeholder="הרגע המביך / המצחיק..." name="funny_moment" autoComplete="on"
                style={inputStyle} />
            </Card>

            <Card>
              <FieldLabel emoji="💬" text="ציטוט לזכרון" sub="משפט שחייבים לזכור" />
              <input value={form.quote} onChange={setField('quote')}
                placeholder='״משהו שאחד אמר שגרם לכולם...״' name="quote" autoComplete="on"
                style={inputStyle} />
            </Card>

            <Card>
              <FieldLabel emoji="⭐" text="דירוג המבצע" />
              <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
            </Card>

            <Card>
              <FieldLabel emoji="🔁" text="האם נחזור על זה?" />
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ v: true, label: 'בהחלט! 🙌' }, { v: false, label: 'חד פעמי 😅' }].map(opt => (
                  <button key={String(opt.v)} onClick={() => setForm(f => ({ ...f, would_repeat: f.would_repeat === opt.v ? null : opt.v }))} style={{
                    flex: 1, padding: '11px', borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: form.would_repeat === opt.v ? CORAL : '#f0ebe0',
                    color: form.would_repeat === opt.v ? 'white' : '#6b5e4e',
                    fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif',
                    boxShadow: form.would_repeat === opt.v ? '0 4px 10px rgba(255,107,107,0.3)' : 'none',
                    transition: 'all 0.15s'
                  }}>{opt.label}</button>
                ))}
              </div>
            </Card>

            {/* Web link with OG preview */}
            <Card>
              <FieldLabel emoji="🔗" text="קישור לאינטרנט" sub="אתר, כתבה, הזמנה, מפה..." />
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={linkUrl}
                  onChange={e => { setLinkUrl(e.target.value); setOgPreview(null) }}
                  onBlur={e => fetchOGPreview(e.target.value)}
                  placeholder="הדבק קישור או חפש..."
                  style={{ ...inputStyle, flex: 1 }} />
                <a href={`https://www.google.com/search?q=${encodeURIComponent(linkUrl || 'חיפוש')}`}
                  target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 42, background: '#4285F4', borderRadius: 11,
                    color: 'white', textDecoration: 'none', fontSize: 18, flexShrink: 0
                  }}>🔍</a>
              </div>

              {ogLoading && <div style={{ fontSize: 11, color: '#a09080', marginTop: 6 }}>טוען תצוגה מקדימה...</div>}

              {ogPreview && !ogLoading && (ogPreview.title || ogPreview.image) && (
                <a href={ogPreview.url || linkUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', gap: 10, marginTop: 8, padding: '10px 12px',
                  background: '#f8f8f8', borderRadius: 12, border: '1px solid #e8e0d0',
                  textDecoration: 'none', overflow: 'hidden'
                }}>
                  {ogPreview.image && (
                    <img src={ogPreview.image} alt="" onError={e => e.target.style.display = 'none'}
                      style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {ogPreview.title && <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{ogPreview.title}</div>}
                    {ogPreview.description && <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ogPreview.description}</div>}
                    {(() => { try { return <div style={{ fontSize: 10, color: '#3B9FE8', marginTop: 3 }}>{ogPreview.siteName || new URL(ogPreview.url || linkUrl).hostname}</div> } catch { return null } })()}
                  </div>
                </a>
              )}

              {linkUrl && /^https?:\/\//i.test(linkUrl) && !ogPreview && !ogLoading && (
                <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: '#3B9FE8', fontWeight: 600, textDecoration: 'none' }}>
                  🔗 {linkUrl.length > 45 ? linkUrl.slice(0, 45) + '...' : linkUrl}
                </a>
              )}

              <div style={{ fontSize: 10, color: '#b0a090', marginTop: 7 }}>
                💡 בכל אפליקציה → "שתף" → "משפחת רמז" → הקישור מגיע ישירות לכאן
              </div>
            </Card>
          </>
        )}

        {/* Spacer for sticky button */}
        <div style={{ height: 10 }} />
      </div>

      {/* ── Sticky Save button (always visible above BottomNav) ── */}
      <div style={{
        position: 'fixed', bottom: 68, right: 0, left: 0, zIndex: 50,
        padding: '0 16px 8px',
        background: 'linear-gradient(to top, rgba(255,249,240,0.98) 60%, transparent)',
      }}>
        {saveError && (
          <div style={{ marginBottom: 6, padding: '8px 12px', background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, fontSize: 12, color: '#cc3333', fontWeight: 600, textAlign: 'center' }}>
            ⚠️ {saveError}
          </div>
        )}
        <button onClick={handleSave} disabled={!canSave || saving} style={{
          width: '100%', padding: '14px',
          background: canSave ? `linear-gradient(135deg, ${CORAL}, #FF8E53)` : '#e0d8c8',
          color: 'white', border: 'none', borderRadius: 50,
          cursor: canSave ? 'pointer' : 'default',
          fontWeight: 900, fontSize: 15,
          fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: canSave ? '0 4px 16px rgba(255,107,107,0.45)' : 'none',
          transition: 'all 0.2s', opacity: canSave ? 1 : 0.5
        }}>
          {saving ? '⏳ שומר...' : '📁 שמור לזיכרונות המשפחה'}
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
