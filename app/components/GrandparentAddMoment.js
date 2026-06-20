'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { phrases } from '../lib/hebrew'

const CORAL = '#FF6B6B'
const NAVY  = '#2D2D2D'

// Lets a grandparent post a moment (photo/video + words) straight to the family
// feed — a way to reach back to the kids beyond reacting/commenting.
export default function GrandparentAddMoment({ currentProfile, onPosted, buttonStyle }) {
  const [open, setOpen]       = useState(false)
  const [text, setText]       = useState('')
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [isVideo, setIsVideo] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)
  const [err, setErr]         = useState('')

  const handleSelect = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f); setIsVideo(f.type.startsWith('video/')); setPreview(URL.createObjectURL(f))
    e.target.value = ''
  }
  const reset = () => { setText(''); setFile(null); setPreview(null); setIsVideo(false); setErr('') }

  const submit = async () => {
    if (saving) return
    if (!currentProfile?.id) { setErr('שגיאת חיבור — נסו לרענן'); return }
    setSaving(true); setErr('')
    try {
      let mediaUrl = null
      if (file) {
        const ext = file.name.split('.').pop()
        const filename = `moments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('family-media').upload(filename, file, { contentType: file.type })
        if (upErr) throw new Error('העלאת המדיה נכשלה: ' + upErr.message)
        mediaUrl = supabase.storage.from('family-media').getPublicUrl(filename).data.publicUrl
      }

      const { error } = await supabase.from('feed_posts').insert({
        type: 'moment',
        title: `${currentProfile.name} ${phrases.shared(currentProfile.gender)} רגע 💜`,
        content: text?.trim() || null,
        media_urls: mediaUrl ? [mediaUrl] : [],
        participants: [],
        created_by: currentProfile.id,
      })
      if (error) throw new Error(error.message)

      setSaving(false); setDone(true); onPosted?.()
      setTimeout(() => { setDone(false); setOpen(false); reset() }, 1600)
    } catch (e) {
      setSaving(false)
      setErr(e?.message || 'שמירה נכשלה')
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`, color: 'white', border: 'none',
        borderRadius: 14, padding: '12px', cursor: 'pointer', fontWeight: 800, fontSize: 14,
        fontFamily: 'var(--font-heebo), sans-serif', width: '100%',
        ...buttonStyle,
      }}>📸 שתפו רגע</button>

      {open && (
        <div onClick={() => !saving && setOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,22,40,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', padding: 16
        }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#2D2D2D', borderRadius: 28, padding: '24px 20px', maxWidth: 360, width: '100%', position: 'relative' }}>
            <button onClick={() => !saving && setOpen(false)} style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 14 }}>✕</button>

            {done ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 46, marginBottom: 10 }}>💜</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>הרגע שותף!</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>הילדים יראו אותו ביומן</div>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>📸</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: 'white' }}>שתפו רגע עם הילדים</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>תמונה, סרטון או כמה מילים חמות</div>
                </div>

                <input type="file" accept="image/*" capture="environment" onChange={handleSelect} style={{ display: 'none' }} id="gm-cam-photo" />
                <input type="file" accept="video/*" capture="environment" onChange={handleSelect} style={{ display: 'none' }} id="gm-cam-video" />
                <input type="file" accept="image/*,video/*" onChange={handleSelect} style={{ display: 'none' }} id="gm-gal" />

                {preview ? (
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    {isVideo
                      ? <video src={preview} controls style={{ width: '100%', borderRadius: 12, maxHeight: 200, display: 'block' }} />
                      : <img src={preview} alt="p" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover', display: 'block' }} />}
                    <button onClick={() => { setFile(null); setPreview(null); setIsVideo(false) }} style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: 'white', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <label htmlFor="gm-cam-photo" style={{ padding: '12px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>📷<br/>תמונה</label>
                    <label htmlFor="gm-cam-video" style={{ padding: '12px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>🎬<br/>סרטון</label>
                    <label htmlFor="gm-gal" style={{ padding: '12px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>🖼️<br/>גלריה</label>
                  </div>
                )}

                <textarea value={text} onChange={e => setText(e.target.value)}
                  placeholder="כמה מילים לילדים... (לא חובה)"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 13, color: 'white', background: 'rgba(255,255,255,0.08)', fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', resize: 'none', minHeight: 60, lineHeight: 1.5, marginBottom: 12, outline: 'none' }} />

                {err && (
                  <div style={{ background: 'rgba(255,107,107,0.15)', color: '#FFB3B3', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>⚠️ {err}</div>
                )}
                <button onClick={submit} disabled={saving || (!text.trim() && !file)} style={{
                  width: '100%', padding: '13px', background: (text.trim() || file) ? CORAL : 'rgba(255,255,255,0.15)',
                  border: 'none', borderRadius: 50, cursor: (text.trim() || file) ? 'pointer' : 'default',
                  fontWeight: 800, fontSize: 15, color: 'white', fontFamily: 'var(--font-heebo), sans-serif'
                }}>{saving ? 'משתף...' : 'שתפו ליומן 💜'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
