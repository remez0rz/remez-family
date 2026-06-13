'use client'
import { useState, useEffect, useRef } from 'react'

// Hebrew voice resolution — initialised once for the whole app, not per button.
let cachedVoice = null
function resolveHebrewVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices() || []
  cachedVoice =
    voices.find(v => v.lang === 'he-IL') ||
    voices.find(v => v.lang?.toLowerCase().startsWith('he')) ||
    cachedVoice || null
  return cachedVoice
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  resolveHebrewVoice()
  // getVoices() is often empty until this fires once; register a single global listener
  window.speechSynthesis.addEventListener?.('voiceschanged', resolveHebrewVoice)
}
const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

/**
 * Tap-to-read-aloud button for pre-readers.
 * Props:
 *   text   — string (or array of strings, joined) to speak in Hebrew
 *   size   — px diameter (default 34)
 *   color  — accent color (default coral)
 *   onBg   — set true when placed on a colored/dark background (uses white style)
 */
export default function SpeakButton({ text, size = 44, color = '#FF6B6B', onBg = false, style = {} }) {
  const [speaking, setSpeaking] = useState(false)
  const speakingRef = useRef(false)

  // On unmount, only stop speech if THIS button is the one currently speaking
  useEffect(() => () => {
    if (speakingRef.current) { try { window.speechSynthesis.cancel() } catch {} }
  }, [])

  const setSpeak = (v) => { speakingRef.current = v; setSpeaking(v) }

  if (!speechSupported) return null

  const content = Array.isArray(text) ? text.filter(Boolean).join('. ') : (text || '')
  if (!content.trim()) return null

  const handleClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const synth = window.speechSynthesis
    try {
      if (synth.speaking || speaking) { synth.cancel(); setSpeak(false); return }
      const u = new SpeechSynthesisUtterance(content)
      u.lang = 'he-IL'
      const v = resolveHebrewVoice()
      if (v) u.voice = v
      u.rate = 0.92
      u.pitch = 1.05
      u.onend = () => setSpeak(false)
      u.onerror = () => setSpeak(false)
      setSpeak(true)
      synth.cancel() // clear any queued speech first
      synth.speak(u)
    } catch { setSpeak(false) }
  }

  return (
    <button
      onClick={handleClick}
      aria-label="הקראה"
      title="הקריאו לי"
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.52, lineHeight: 1,
        // Solid, high-contrast fill so it always stands out
        background: speaking ? '#FFD166' : (onBg ? 'white' : color),
        color: 'white',
        border: `2.5px solid ${onBg ? 'white' : 'rgba(255,255,255,0.9)'}`,
        boxShadow: speaking
          ? `0 0 0 4px ${color}55, 0 3px 10px rgba(0,0,0,0.25)`
          : '0 3px 10px rgba(0,0,0,0.28)',
        transition: 'all 0.15s',
        fontFamily: 'var(--font-heebo), sans-serif',
        animation: speaking ? 'speakPulse 0.9s ease-in-out infinite' : 'none',
        ...style,
      }}
    >
      {speaking ? '⏸️' : '🔊'}
    </button>
  )
}
