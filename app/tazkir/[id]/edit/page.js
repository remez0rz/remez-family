'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, getCurrentProfile } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '../../../components/BottomNav'

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
        ? <img src={profile.avatar_url} alt={profile.name} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : profile.name?.charAt(0)}
      {selected && (
        <div style={{ position: 'absolute', bottom: -1, right: -1, background: CORAL, borderRadius: '50%', width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 900, border: '1.5px solid white' }}>✓</div>
      )}
    </div>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1,2,3,4,5].map(star => (
        <div key={star} onClick={() => onChange(star === value ? 0 : star)}
          style={{ fontSize: 28, cursor: 'pointer', opacity: star <= value ? 1 : 0.2, transition: 'opacity 0.1s' }}>⭐</div>
      ))}
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: '14px 15px', marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', ...style }}>
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

function isVideo(url) { return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url) }

export default function EditTazkirPage() {
  const [profile, setProfile]           = useState(null)
  const [profiles, setProfiles]         = useState([])
  const [participants, setParticipants] = useState([])
  const [existingUrls, setExistingUrls] = useState([])   // already-stored media URLs
  const [newFiles, setNewFiles]         = useState([])   // {file, preview, type, name}
  const [imgUrl, setImgUrl]             = useState('')
  const [resolvedImgUrl, setResolvedImgUrl] = useState('')
  const [imgResolving, setImgResolving] = useState(false)
  const [showExtras, setShowExtras]     = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [saveError, setSaveError]       = useState('')
  const [confirmDel, setConfirmDel]     = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [loading, setLoading]           = useState(true)
  const [form, setForm] = useState({
    title: '', what_happened: '', best_moment: '',
    funny_moment: '', quote: '', rating: 0, would_repeat: null,
  })
  const router      = useRouter()
  const { id }      = useParams()
  const imgAbortRef = useRef(null)
  const newFilesRef = useRef([])

  useEffect(() => { newFilesRef.current = newFiles }, [newFiles])
  useEffect(() => {
    return () => { newFilesRef.current.forEach(f => URL.revokeObjectURL(f.preview)) }
  }, [])

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    const p = await getCurrentProfile()
    if (!p) { router.push('/login'); return }
    setProfile(p)

    const [{ data: t }, { data: profileData }] = await Promise.all([
      supabase.from('tahkirim').select('*').eq('id', id).single(),
      supabase.from('profiles').select('*').eq('active', true),
    ])

    if (!t) { router.push('/feed'); return }
    if (profileData) setProfiles(profileData)

    // Pre-fill form with existing data
    setForm({
      title:        t.title        || '',
      what_happened: t.what_happened || '',
      best_moment:  t.best_moment  || '',
      funny_moment: t.funny_moment || '',
      quote:        t.quote        || '',
      rating:       t.rating       || 0,
      would_repeat: t.would_repeat ?? null,
    })

    // Pre-select participants by name → match to profile IDs
    if (t.participants?.length && profileData) {
      const ids = profileData.filter(pr => t.participants.includes(pr.name)).map(pr => pr.id)
      setParticipants(ids)
    } else {
      setParticipants([p.id])
    }

    // Existing media — store as-is (already uploaded)
    setExistingUrls(t.media_urls || [])

    // If any extras are filled, show them
    if (t.what_happened || t.best_moment || t.funny_moment || t.quote || t.rating || t.would_repeat !== null) {
      setShowExtras(true)
    }

    setLoading(false)
  }

  const isDirectImage = (url) => /\.(jpe?g|png|gif|webp|avif|bmp)(\?.*)?$/i.test(url)

  const resolveImgUrl = async (url) => {
    if (!url?.startsWith('http')) { setResolvedImgUrl(''); return }
    if (isDirectImage(url)) { setResolvedImgUrl(url); return }
    imgAbortRef.current?.abort()
    imgAbortRef.current = new AbortController()
    setImgResolving(true)
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`, { signal: imgAbortRef.current.signal })
      if (res.ok) { const data = await res.json(); setResolvedImgUrl(data.image || url) }
      else setResolvedImgUrl(url)
    } catch { setResolvedImgUrl(url) }
    setImgResolving(false)
  }

  const handleNewFiles = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setNewFiles(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), type: f.type, name: f.name }))])
    e.target.value = ''
  }

  const removeExisting = (url) => setExistingUrls(prev => prev.filter(u => u !== url))

  const removeNew = (i) => setNewFiles(prev => {
    const next = [...prev]
    URL.revokeObjectURL(next[i].preview)
    next.splice(i, 1)
    return next
  })

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.title.trim() || saving) return
    setSaving(true)
    setSaveError('')

    // Upload new files in parallel
    const uploadResults = await Promise.all(newFiles.map(async (m) => {
      const ext  = m.name.split('.').pop()
      const path = `tahkirim/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(path, m.file, { contentType: m.type })
      if (error) return null
      return supabase.storage.from('family-media').getPublicUrl(path).data.publicUrl
    }))

    const newUrls    = uploadResults.filter(Boolean)
    const finalImgUrl = (resolvedImgUrl || imgUrl).trim()
    const allUrls    = [...existingUrls, ...newUrls, ...(finalImgUrl ? [finalImgUrl] : [])]

    const participantNames = profiles.filter(p => participants.includes(p.id)).map(p => p.name)

    // UPDATE tahkirim
    const { error } = await supabase.from('tahkirim').update({
      title:         form.title.trim(),
      what_happened: form.what_happened || null,
      best_moment:   form.best_moment   || null,
      funny_moment:  form.funny_moment  || null,
      quote:         form.quote         || null,
      rating:        form.rating        || null,
      would_repeat:  form.would_repeat,
      participants:  participantNames,
      media_urls:    allUrls,
    }).eq('id', id)

    if (error) {
      setSaveError('שגיאה בשמירה — ' + error.message)
      setSaving(false)
      return
    }

    // Also update the linked feed_post
    await supabase.from('feed_posts').update({
      title:        form.title.trim(),
      content:      form.what_happened || '',
      best_moment:  form.best_moment   || null,
      funny_moment: form.funny_moment  || null,
      quote:        form.quote         || null,
      rating:       form.rating        || null,
      would_repeat: form.would_repeat,
      participants: participantNames,
      media_urls:   allUrls,
    }).eq('linked_id', id).eq('type', 'tahkir')

    setSaved(true)
    setTimeout(() => router.push(`/tazkir/${id}`), 1400)
    setSaving(false)
  }

  // Delete the tahkir and its feed entry (for errors/tests).
  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('feed_posts').delete().eq('linked_type', 'tahkir').eq('linked_id', id)
    const { error } = await supabase.from('tahkirim').delete().eq('id', id)
    setDeleting(false)
    if (error) { setSaveError('מחיקה נכשלה: ' + error.message); return }
    router.push('/feed')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
      <div style={{ fontSize: 32 }}>✏️</div>
    </div>
  )

  if (saved) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: HEADER_BG, fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', flexDirection: 'column', gap: 14, textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 60 }}>✅</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>נשמר בהצלחה!</div>
    </div>
  )

  const canSave   = form.title.trim().length > 0
  const hasExtras = form.what_happened || form.best_moment || form.funny_moment || form.quote || form.rating || form.would_repeat !== null

  return (
    <div className="app-page" style={{ fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', background: PAGE_BG, minHeight: '100vh', paddingBottom: '6rem', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ background: HEADER_BG, padding: '20px 16px 22px', borderRadius: '0 0 22px 22px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 900, color: 'white' }}>✏️ עריכת תחקיר</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 2, fontWeight: 600 }}>
              {form.title.trim() || 'ערכו את הזיכרון'}
            </div>
          </div>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, color: 'white', fontSize: 12, padding: '6px 13px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif', fontWeight: 700 }}>← חזרה</button>
        </div>
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>

        {/* Title */}
        <Card>
          <FieldLabel emoji="🎯" text="שם המבצע" />
          <input value={form.title} onChange={setField('title')} name="edit-title" autoComplete="off" style={inputStyle} />
        </Card>

        {/* Media */}
        <Card>
          <FieldLabel emoji="📸" text="תמונות וסרטונים" />

          {/* Existing media */}
          {existingUrls.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a09080', marginBottom: 6 }}>קיים:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {existingUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
                    {isVideo(url)
                      ? <video src={url} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                      : <img src={url} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.opacity = '0.3'} />
                    }
                    {i === 0 && <div style={{ position: 'absolute', top: 3, right: 3, background: CORAL, color: 'white', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>שער</div>}
                    <button onClick={() => removeExisting(url)} style={{ position: 'absolute', top: -4, left: -4, background: NAVY, border: 'none', borderRadius: '50%', width: 18, height: 18, color: 'white', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file previews */}
          {newFiles.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a09080', marginBottom: 6 }}>חדש:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {newFiles.map((f, i) => (
                  <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
                    {f.type.startsWith('video/')
                      ? <video src={f.preview} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                      : <img src={f.preview} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                    }
                    <button onClick={() => removeNew(i)} style={{ position: 'absolute', top: -4, left: -4, background: NAVY, border: 'none', borderRadius: '50%', width: 18, height: 18, color: 'white', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add more buttons */}
          <input type="file" accept="image/*"         capture="environment" onChange={handleNewFiles} style={{ display: 'none' }} id="e-cam-photo" />
          <input type="file" accept="video/*"         capture="environment" onChange={handleNewFiles} style={{ display: 'none' }} id="e-cam-video" />
          <input type="file" accept="image/*,video/*" multiple             onChange={handleNewFiles} style={{ display: 'none' }} id="e-gallery" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { id: 'e-cam-photo', emoji: '📷', label: 'מצלמה' },
              { id: 'e-cam-video', emoji: '🎬', label: 'סרטון' },
              { id: 'e-gallery',  emoji: '🖼️',  label: 'גלריה' },
            ].map(b => (
              <label key={b.id} htmlFor={b.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '9px 6px', background: '#faf8f4', borderRadius: 11,
                border: '1.5px dashed #d8d0c8', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: '#6b5e4e'
              }}>{b.emoji} {b.label}</label>
            ))}
          </div>

          {/* Web image */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0ebe0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a09080', marginBottom: 5 }}>🌐 הוסף תמונה מהאינטרנט</div>
            <input value={imgUrl}
              onChange={e => { setImgUrl(e.target.value); setResolvedImgUrl('') }}
              onBlur={e => resolveImgUrl(e.target.value)}
              type="url" placeholder="הדבק כתובת תמונה או קישור לאתר..."
              style={{ ...inputStyle, fontSize: 12, padding: '8px 10px' }} />
            {imgResolving && <div style={{ fontSize: 11, color: '#a09080', marginTop: 5 }}>🔍 מחפש תמונה...</div>}
            {resolvedImgUrl && !imgResolving && (
              <div style={{ position: 'relative', marginTop: 6 }}>
                <img src={resolvedImgUrl} alt="" onError={e => e.target.parentElement.style.display = 'none'}
                  style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                <button onClick={() => { setImgUrl(''); setResolvedImgUrl('') }} style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: 'white', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}
          </div>
        </Card>

        {/* Participants */}
        <Card>
          <FieldLabel emoji="👥" text="מי היה שם?" />
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {profiles.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Avatar profile={p} size={46} selected={participants.includes(p.id)}
                  onClick={() => setParticipants(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                <span style={{ fontSize: 10, fontWeight: 600, color: participants.includes(p.id) ? CORAL : '#a09080' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Extras toggle */}
        <button onClick={() => setShowExtras(v => !v)} style={{
          width: '100%', padding: '12px', marginBottom: 10,
          background: showExtras ? 'white' : 'rgba(255,107,107,0.07)',
          border: `1.5px ${showExtras ? 'solid #ede8e0' : 'dashed #FFB8B8'}`,
          borderRadius: 16, cursor: 'pointer',
          fontWeight: 700, fontSize: 13, color: showExtras ? '#8a7a60' : CORAL,
          fontFamily: 'var(--font-heebo), sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          {showExtras ? '↑ סגור פרטים נוספים' : `📖 פרטים נוספים${hasExtras ? ' ✓' : ''}`}
        </button>

        {showExtras && (
          <>
            <Card>
              <FieldLabel emoji="📖" text="מה קרה?" />
              <textarea value={form.what_happened} onChange={setField('what_happened')} name="what_happened"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }} />
            </Card>
            <Card>
              <FieldLabel emoji="🌟" text="רגע השיא" />
              <input value={form.best_moment} onChange={setField('best_moment')} name="best_moment" style={inputStyle} />
            </Card>
            <Card>
              <FieldLabel emoji="😂" text="רגע מצחיק" />
              <input value={form.funny_moment} onChange={setField('funny_moment')} name="funny_moment" style={inputStyle} />
            </Card>
            <Card>
              <FieldLabel emoji="💬" text="ציטוט לזכרון" />
              <input value={form.quote} onChange={setField('quote')} name="quote" style={inputStyle} />
            </Card>
            <Card>
              <FieldLabel emoji="⭐" text="דירוג" />
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
          </>
        )}

        <div style={{ height: 10 }} />
      </div>

      {/* Sticky save */}
      <div style={{ position: 'fixed', bottom: 68, right: 0, left: 0, zIndex: 50, padding: '0 16px 8px', background: 'linear-gradient(to top, rgba(255,249,240,0.98) 60%, transparent)' }}>
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
          {saving ? '⏳ שומר...' : '✅ שמור שינויים'}
        </button>

        {/* Delete — for removing errors/tests */}
        {confirmDel ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={handleDelete} disabled={deleting} style={{
              flex: 1, padding: '12px', background: '#FF6B6B', color: 'white', border: 'none',
              borderRadius: 50, cursor: 'pointer', fontWeight: 800, fontSize: 14,
              fontFamily: 'var(--font-heebo), sans-serif'
            }}>{deleting ? 'מוחק...' : 'בטוח? מחק לצמיתות'}</button>
            <button onClick={() => setConfirmDel(false)} disabled={deleting} style={{
              padding: '12px 18px', background: 'transparent', color: '#a09080',
              border: '1px solid #e0d8c8', borderRadius: 50, cursor: 'pointer', fontWeight: 600, fontSize: 14,
              fontFamily: 'var(--font-heebo), sans-serif'
            }}>ביטול</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} style={{
            width: '100%', padding: '12px', marginTop: 12, background: 'transparent',
            color: '#D0463B', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>🗑 מחק תחקיר</button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
