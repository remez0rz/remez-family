'use client'
import { useState, useEffect, useRef } from 'react'

// Picks the best available Hebrew voice (cached across instances)
let cachedVoice = null
function getHebrewVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices() || []
  cachedVoice =
    voices.find(v => v.lang === 'he-IL') ||
    voices.find(v => v.lang?.toLowerCase().startsWith('he')) ||
    null
  return cachedVoice
}

/**
 * Tap-to-read-aloud button for pre-readers.
 * Props:
 *   text   — string (or array of strings, joined) to speak in Hebrew
 *   size   — px diameter (default 34)
 *   color  — accent color (default coral)
 *   onBg   — set true when placed on a colored/dark background (uses white style)
 */
export default function SpeakButton({ text, size = 44, color = '#FF6B6B', onBg = false, style = {} }) {
  const [supported, setSupported] = useState(true)
  const [speaking, setSpeaking]   = useState(false)
  const utterRef = useRef(null)

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'speechSynthesis' in window
    setSupported(ok)
    if (ok) {
      // Warm up the voice list (some browsers load async)
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; getHebrewVoice() }
    }
    return () => { try { window.speechSynthesis?.cancel() } catch {} }
  }, [])

  if (!supported) return null

  const content = Array.isArray(text) ? text.filter(Boolean).join('. ') : (text || '')
  if (!content.trim()) return null

  const handleClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const synth = window.speechSynthesis
    try {
      if (synth.speaking || speaking) { synth.cancel(); setSpeaking(false); return }
      const u = new SpeechSynthesisUtterance(content)
      u.lang = 'he-IL'
      const v = getHebrewVoice()
      if (v) u.voice = v
      u.rate = 0.92
      u.pitch = 1.05
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      utterRef.current = u
      setSpeaking(true)
      synth.cancel() // clear any queued speech first
      synth.speak(u)
    } catch { setSpeaking(false) }
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
      }}
    >
      {speaking ? '⏸️' : '🔊'}
    </button>
  )
}
