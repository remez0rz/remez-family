'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const CORAL = '#FF6B6B'
const NAVY  = '#2D2D2D'
const TEAL  = '#4ECDC4'

// Pick a mime type the current browser can actually record.
function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  return candidates.find(t => MediaRecorder.isTypeSupported?.(t)) || ''
}
const extForMime = (m) => (m?.includes('mp4') ? 'm4a' : m?.includes('ogg') ? 'ogg' : 'webm')

// A self-contained record → preview → upload control.
// Calls onRecorded({ url, durationSec }) once the clip is uploaded.
export default function VoiceRecorder({ onRecorded, onCancel, disabled }) {
  const [state, setState]   = useState('idle') // idle | recording | preview | uploading
  const [seconds, setSeconds] = useState(0)
  const [error, setError]   = useState(null)
  const [blobUrl, setBlobUrl] = useState(null)

  const recorderRef = useRef(null)
  const chunksRef   = useRef([])
  const streamRef   = useRef(null)
  const blobRef     = useRef(null)
  const mimeRef     = useRef('')
  const timerRef    = useRef(null)

  const cleanup = () => {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (blobUrl) URL.revokeObjectURL(blobUrl)
  }

  useEffect(() => () => cleanup(), [])

  const start = async () => {
    setError(null)
    const mime = pickMime()
    if (mime === null) { setError('הדפדפן לא תומך בהקלטה'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      mimeRef.current = mime
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current || 'audio/webm' })
        blobRef.current = blob
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setState('preview')
        streamRef.current?.getTracks().forEach(t => t.stop())
      }
      recorderRef.current = rec
      rec.start()
      setSeconds(0)
      setState('recording')
      timerRef.current = setInterval(() => setSeconds(s => {
        if (s >= 119) { stop(); return 120 } // hard cap 2 min
        return s + 1
      }), 1000)
    } catch {
      setError('צריך הרשאה למיקרופון')
    }
  }

  const stop = () => {
    clearInterval(timerRef.current)
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
  }

  const reset = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    blobRef.current = null
    setBlobUrl(null)
    setSeconds(0)
    setState('idle')
  }

  const upload = async () => {
    if (!blobRef.current) return
    setState('uploading')
    const ext = extForMime(mimeRef.current)
    const filename = `voice/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('family-media')
      .upload(filename, blobRef.current, { contentType: mimeRef.current || 'audio/webm' })
    if (upErr) { setError('ההעלאה נכשלה'); setState('preview'); return }
    const { data } = supabase.storage.from('family-media').getPublicUrl(filename)
    onRecorded?.({ url: data.publicUrl, durationSec: seconds })
    reset()
  }

  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ direction: 'rtl', fontFamily: 'var(--font-heebo), sans-serif' }}>
      {error && <div style={{ fontSize: 12, color: CORAL, marginBottom: 8, fontWeight: 600 }}>{error}</div>}

      {state === 'idle' && (
        <button onClick={start} disabled={disabled} style={btn(TEAL)}>
          🎤 הקלטת הודעה קולית
        </button>
      )}

      {state === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: CORAL, animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: NAVY, flex: 1 }}>{mmss(seconds)}</span>
          <button onClick={stop} style={btn(CORAL, true)}>⏹ עצור</button>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        </div>
      )}

      {state === 'preview' && blobUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <audio src={blobUrl} controls style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={upload} style={btn(TEAL, true)}>✓ שלח</button>
            <button onClick={reset} style={btn('#e0d8c8', true, NAVY)}>↻ הקלט שוב</button>
            {onCancel && <button onClick={() => { reset(); onCancel() }} style={btn('transparent', true, '#a09080')}>ביטול</button>}
          </div>
        </div>
      )}

      {state === 'uploading' && (
        <div style={{ fontSize: 14, color: '#8a7a60', fontWeight: 600, textAlign: 'center', padding: 8 }}>שולח... 🎤</div>
      )}
    </div>
  )
}

function btn(bg, compact = false, color = 'white') {
  return {
    flex: compact ? 'unset' : 1,
    width: compact ? 'auto' : '100%',
    padding: compact ? '9px 16px' : '12px',
    background: bg, color,
    border: 'none', borderRadius: 50, cursor: 'pointer',
    fontWeight: 700, fontSize: 14,
    fontFamily: 'var(--font-heebo), sans-serif',
    whiteSpace: 'nowrap',
  }
}
