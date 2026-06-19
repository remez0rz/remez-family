'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import VoiceRecorder from './VoiceRecorder'
import { phrases } from '../lib/hebrew'

const CORAL = '#FF6B6B'
const TEAL  = '#4ECDC4'
const GOLD  = '#FFB830'
const NAVY  = '#2D2D2D'

const isVideoUrl = url => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url || '')

function CommentAvatar({ profile, size = 30 }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${GOLD}`, overflow: 'hidden', background: '#e8d5a3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: NAVY
    }}>
      {profile?.avatar_url && !err
        ? <img src={profile.avatar_url} alt={profile?.name} onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (profile?.name?.charAt(0) || '👵')}
    </div>
  )
}

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דק׳`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שע׳`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'אתמול' : `לפני ${days} ימים`
}

// A lightweight comment + voice-note thread under a feed post.
// Everyone can read; logged-in members (incl. grandparents) can add.
export default function CommentThread({ postId, currentProfile, profiles = [], participants = [] }) {
  const [comments, setComments] = useState([])
  const [loaded, setLoaded]     = useState(false)
  const [text, setText]         = useState('')
  const [showRecorder, setShowRecorder] = useState(false)
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('feed_post_id', postId)
        .order('created_at', { ascending: true })
      if (!cancelled) { setComments(data || []); setLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [postId])

  const authorOf = (c) =>
    profiles.find(p => p.id === c.author_id) || { name: 'בן משפחה' }

  // Notify the post's participants (kids) — never the author themselves.
  const notifyParticipants = (preview) => {
    const ids = participants
      .map(name => profiles.find(p => p.name === name)?.id)
      .filter(Boolean)
      .filter(id => id !== currentProfile?.id)
    if (!ids.length) return
    const who = currentProfile?.name || 'מישהו'
    fetch('/api/push/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberIds: ids, title: `💌 ${who} ${phrases.commented(currentProfile?.gender)} לך`, body: preview, url: '/feed', tag: 'comment'
      })
    }).catch(() => {})
  }

  const insertComment = async (row, preview) => {
    if (!currentProfile?.id) return
    const { data, error } = await supabase
      .from('feed_comments')
      .insert({ feed_post_id: postId, author_id: currentProfile.id, ...row })
      .select()
      .single()
    if (error || !data) return
    setComments(prev => [...prev, data])
    notifyParticipants(preview)
  }

  const sendText = async () => {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    await insertComment({ kind: 'text', body: t }, t)
    setText('')
    setSending(false)
  }

  const onVoiceRecorded = async ({ url }) => {
    setShowRecorder(false)
    await insertComment({ kind: 'voice', media_url: url }, '🎤 הודעה קולית')
  }

  if (!loaded) return null

  return (
    <div style={{ direction: 'rtl', fontFamily: 'var(--font-heebo), sans-serif', marginTop: 4 }}>
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          {comments.map(c => {
            const author = authorOf(c)
            return (
              <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <CommentAvatar profile={author} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: NAVY }}>{author.name}</span>
                    <span style={{ fontSize: 10, color: '#b0a090' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  {c.kind === 'text' && (
                    <div style={{ fontSize: 13, color: '#5a4a3a', lineHeight: 1.5, marginTop: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.body}</div>
                  )}
                  {c.kind === 'sticker' && (
                    <div style={{ fontSize: 34, marginTop: 2 }}>{c.body}</div>
                  )}
                  {c.kind === 'voice' && c.media_url && (
                    <audio src={c.media_url} controls style={{ width: '100%', maxWidth: 260, marginTop: 4 }} />
                  )}
                  {c.kind === 'video' && c.media_url && (
                    isVideoUrl(c.media_url)
                      ? <video src={c.media_url} controls style={{ width: '100%', maxWidth: 260, borderRadius: 10, marginTop: 4, display: 'block' }} />
                      : <img src={c.media_url} alt="" style={{ width: '100%', maxWidth: 260, borderRadius: 10, marginTop: 4, display: 'block' }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Composer — hidden for users with no profile (e.g. logged-out) */}
      {currentProfile?.id && (
        showRecorder ? (
          <VoiceRecorder onRecorded={onVoiceRecorded} onCancel={() => setShowRecorder(false)} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendText() }}
              placeholder="כתבו משהו חמים..."
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 20,
                border: '1px solid #EDE8E0', background: '#FAFAF5',
                fontSize: 13, color: NAVY, outline: 'none',
                fontFamily: 'var(--font-heebo), sans-serif'
              }}
            />
            <button onClick={() => setShowRecorder(true)} title="הקלטה קולית" style={{
              flexShrink: 0, width: 38, height: 38, borderRadius: '50%',
              border: 'none', background: '#FFF0D5', cursor: 'pointer', fontSize: 17
            }}>🎤</button>
            <button onClick={sendText} disabled={!text.trim() || sending} style={{
              flexShrink: 0, padding: '9px 14px', borderRadius: 20, border: 'none',
              background: text.trim() ? CORAL : '#e8e0d0',
              color: text.trim() ? 'white' : '#a09080',
              cursor: text.trim() ? 'pointer' : 'default',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
            }}>שלח</button>
          </div>
        )
      )}
    </div>
  )
}
