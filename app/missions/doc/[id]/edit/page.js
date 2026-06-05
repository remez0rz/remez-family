'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, getCurrentProfile } from '../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '../../../../components/BottomNav'

const NAVY      = '#2D2D2D'
const CORAL     = '#FF6B6B'
const HEADER_BG = 'linear-gradient(135deg, #2D2D2D 0%, #1a1a2e 100%)'
const PAGE_BG   = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'

function isVideo(url) { return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url) }

export default function EditMissionDocPage() {
  const [post, setPost]                 = useState(null)
  const [text, setText]                 = useState('')
  const [existingUrls, setExistingUrls] = useState([])
  const [newFiles, setNewFiles]         = useState([])
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [saveError, setSaveError]       = useState('')
  const [loading, setLoading]           = useState(true)
  const router   = useRouter()
  const { id }   = useParams()
  const filesRef = useRef([])

  useEffect(() => { filesRef.current = newFiles }, [newFiles])
  useEffect(() => () => { filesRef.current.forEach(f => URL.revokeObjectURL(f.preview)) }, [])

  useEffect(() => { if (id) loadData() }, [id])

  const loadData = async () => {
    const p = await getCurrentProfile()
    if (!p) { router.push('/login'); return }

    const { data } = await supabase.from('feed_posts').select('*').eq('id', id).single()
    if (!data) { router.back(); return }

    setPost(data)
    setText(data.content === `+${data.title?.match(/\d+/)?.[0]} נקודות 🎉` ? '' : (data.content || ''))
    setExistingUrls(data.media_urls || [])
    setLoading(false)
  }

  const handleSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setNewFiles(prev => [...prev, ...files.map(f => ({
      file: f, preview: URL.createObjectURL(f),
      type: f.type, name: f.name
    }))])
    e.target.value = ''
  }

  const removeExisting = (url) => setExistingUrls(prev => prev.filter(u => u !== url))
  const removeNew = (i) => setNewFiles(prev => {
    const next = [...prev]
    URL.revokeObjectURL(next[i].preview)
    next.splice(i, 1)
    return next
  })

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setSaveError('')

    // Upload new files in parallel
    const uploaded = await Promise.all(newFiles.map(async (m) => {
      const ext  = m.name.split('.').pop()
      const path = `missions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(path, m.file, { contentType: m.type })
      if (error) return null
      return supabase.storage.from('family-media').getPublicUrl(path).data.publicUrl
    }))

    const allUrls = [...existingUrls, ...uploaded.filter(Boolean)]

    const { error } = await supabase.from('feed_posts').update({
      content:    text || post.content,
      media_urls: allUrls,
    }).eq('id', id)

    if (error) { setSaveError('שגיאה בשמירה — ' + error.message); setSaving(false); return }

    setSaved(true)
    setTimeout(() => router.back(), 1200)
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
      <div style={{ fontSize: 32 }}>✏️</div>
    </div>
  )

  if (saved) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: HEADER_BG, fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', flexDirection: 'column', gap: 12, textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 56 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>נשמר!</div>
    </div>
  )

  return (
    <div className="app-page" style={{ fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', background: PAGE_BG, minHeight: '100vh', paddingBottom: '6rem', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ background: HEADER_BG, padding: '20px 16px 22px', borderRadius: '0 0 22px 22px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>✏️ עריכת תיעוד</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 220 }}>
              {post?.title}
            </div>
          </div>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, color: 'white', fontSize: 12, padding: '6px 13px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif', fontWeight: 700 }}>← חזרה</button>
        </div>
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>

        {/* Text */}
        <div style={{ background: 'white', borderRadius: 18, padding: '14px 15px', marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 8 }}>💬 תיאור</div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="ספר מה עשית, איך הלך..."
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid #ede8e0', borderRadius: 12,
              fontSize: 14, color: NAVY, background: '#faf8f4',
              fontFamily: 'var(--font-heebo), sans-serif',
              boxSizing: 'border-box', outline: 'none',
              resize: 'vertical', minHeight: 80, lineHeight: 1.6
            }} />
        </div>

        {/* Media */}
        <div style={{ background: 'white', borderRadius: 18, padding: '14px 15px', marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 10 }}>📸 תמונות וסרטונים</div>

          {/* Existing */}
          {existingUrls.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {existingUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                  {isVideo(url)
                    ? <video src={url} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                    : <img src={url} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.opacity = '0.3'} />
                  }
                  <button onClick={() => removeExisting(url)} style={{ position: 'absolute', top: -4, left: -4, background: NAVY, border: 'none', borderRadius: '50%', width: 20, height: 20, color: 'white', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* New previews */}
          {newFiles.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {newFiles.map((f, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                  {f.type.startsWith('video/')
                    ? <video src={f.preview} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                    : <img src={f.preview} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                  }
                  <button onClick={() => removeNew(i)} style={{ position: 'absolute', top: -4, left: -4, background: NAVY, border: 'none', borderRadius: '50%', width: 20, height: 20, color: 'white', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add buttons */}
          <input type="file" accept="image/*"         capture="environment" onChange={handleSelect} style={{ display: 'none' }} id="mdoc-photo" />
          <input type="file" accept="video/*"         capture="environment" onChange={handleSelect} style={{ display: 'none' }} id="mdoc-video" />
          <input type="file" accept="image/*,video/*" multiple             onChange={handleSelect} style={{ display: 'none' }} id="mdoc-gallery" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { id: 'mdoc-photo',   emoji: '📷', label: 'תמונה' },
              { id: 'mdoc-video',   emoji: '🎬', label: 'סרטון' },
              { id: 'mdoc-gallery', emoji: '🖼️', label: 'גלריה' },
            ].map(b => (
              <label key={b.id} htmlFor={b.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '10px 6px', background: '#faf8f4', borderRadius: 11,
                border: '1.5px dashed #d8d0c8', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: '#6b5e4e'
              }}>{b.emoji} {b.label}</label>
            ))}
          </div>
        </div>

        <div style={{ height: 10 }} />
      </div>

      {/* Sticky save */}
      <div style={{ position: 'fixed', bottom: 68, right: 0, left: 0, zIndex: 50, padding: '0 16px 8px', background: 'linear-gradient(to top, rgba(255,249,240,0.98) 60%, transparent)' }}>
        {saveError && (
          <div style={{ marginBottom: 6, padding: '8px 12px', background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, fontSize: 12, color: '#cc3333', fontWeight: 600, textAlign: 'center' }}>⚠️ {saveError}</div>
        )}
        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '14px',
          background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`,
          color: 'white', border: 'none', borderRadius: 50,
          cursor: 'pointer', fontWeight: 900, fontSize: 15,
          fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: '0 4px 16px rgba(255,107,107,0.45)',
          transition: 'all 0.2s'
        }}>
          {saving ? '⏳ שומר...' : '✅ שמור שינויים'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
