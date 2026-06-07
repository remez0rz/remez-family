'use client'
import { useState, useEffect } from 'react'
import { supabase, getCurrentProfile } from '../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import SpeakButton from '../../components/SpeakButton'

const NAVY      = '#2D2D2D'
const CORAL     = '#FF6B6B'
const GOLD      = '#FFB830'
const HEADER_BG = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
const PAGE_BG   = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'

function isVideo(url) { return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url) }

function ContentWithLinks({ text }) {
  if (!text) return null
  const URL_RE = /(https?:\/\/[^\s]+)/g
  const parts  = text.split(URL_RE)
  return (
    <span>
      {parts.map((part, i) =>
        URL_RE.test(part)
          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer"
              style={{ color: '#3B9FE8', fontWeight: 600, wordBreak: 'break-all' }}>{part}</a>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

export default function TazkirDetailPage() {
  const [tazkir, setTazkir]   = useState(null)
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    const load = async () => {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from('tahkirim').select('*').eq('id', id).single(),
        supabase.from('profiles').select('*').eq('active', true),
      ])
      if (!t) { router.push('/feed'); return }
      setTazkir(t)
      if (p) setProfiles(p)
      setLoading(false)
    }
    if (id) load()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
      <div style={{ fontSize: 32 }}>📝</div>
    </div>
  )

  const participantProfiles = (tazkir.participants || [])
    .map(name => profiles.find(p => p.name === name))
    .filter(Boolean)

  const dateStr = tazkir.created_at
    ? new Date(tazkir.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="app-page" style={{ fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', background: PAGE_BG, minHeight: '100vh', paddingBottom: '5.5rem', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ background: HEADER_BG, padding: '20px 16px 22px', borderRadius: '0 0 22px 22px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, fontSize: 20, fontWeight: 900, color: 'white', lineHeight: 1.3 }}>{tazkir.title}</div>
              <SpeakButton onBg size={36}
                text={[tazkir.title, tazkir.what_happened, tazkir.best_moment, tazkir.funny_moment, tazkir.quote]} />
            </div>
            {dateStr && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>📅 {dateStr}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => router.push(`/tazkir/${id}/edit`)} style={{ background: 'white', color: CORAL, border: 'none', borderRadius: 20, fontSize: 12, padding: '6px 13px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif', fontWeight: 700 }}>✏️ עריכה</button>
            <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, color: 'white', fontSize: 12, padding: '6px 13px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif', fontWeight: 700 }}>← חזרה</button>
          </div>
        </div>

        {/* Participants */}
        {participantProfiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            {participantProfiles.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.7)', background: '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: NAVY }}>
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    : p.name?.charAt(0)}
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{p.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>

        {/* Media gallery */}
        {tazkir.media_urls?.length > 0 && (
          <div style={{ marginBottom: 14, borderRadius: 18, overflow: 'hidden' }}>
            {/* Cover */}
            <div onClick={() => !isVideo(tazkir.media_urls[0]) && setLightbox(0)} style={{ cursor: isVideo(tazkir.media_urls[0]) ? 'default' : 'pointer' }}>
              {isVideo(tazkir.media_urls[0])
                ? <video src={tazkir.media_urls[0]} controls style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
                : <img src={tazkir.media_urls[0]} alt="cover" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
              }
            </div>
            {/* Thumbnails */}
            {tazkir.media_urls.length > 1 && (
              <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                {tazkir.media_urls.slice(1).map((url, i) => (
                  <div key={i} onClick={() => !isVideo(url) && setLightbox(i + 1)} style={{ flex: 1, cursor: isVideo(url) ? 'default' : 'pointer' }}>
                    {isVideo(url)
                      ? <video src={url} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                      : <img src={url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Story */}
        {tazkir.what_happened && (
          <div style={{ background: 'white', borderRadius: 18, padding: '14px 15px', marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#a09080', marginBottom: 8 }}>📖 מה קרה</div>
            <div style={{ fontSize: 14, color: '#4a3a2a', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <ContentWithLinks text={tazkir.what_happened} />
            </div>
          </div>
        )}

        {/* Details grid */}
        {(tazkir.best_moment || tazkir.funny_moment || tazkir.quote) && (
          <div style={{ background: 'white', borderRadius: 18, padding: '14px 15px', marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            {tazkir.best_moment && (
              <div style={{ marginBottom: tazkir.funny_moment || tazkir.quote ? 10 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a09080' }}>🌟 רגע השיא</span>
                <div style={{ fontSize: 13, color: '#4a3a2a', marginTop: 4, lineHeight: 1.5 }}>{tazkir.best_moment}</div>
              </div>
            )}
            {tazkir.funny_moment && (
              <div style={{ borderTop: tazkir.best_moment ? '1px solid #f0ebe0' : 'none', paddingTop: tazkir.best_moment ? 10 : 0, marginBottom: tazkir.quote ? 10 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a09080' }}>😂 רגע מצחיק</span>
                <div style={{ fontSize: 13, color: '#4a3a2a', marginTop: 4, lineHeight: 1.5 }}>{tazkir.funny_moment}</div>
              </div>
            )}
            {tazkir.quote && (
              <div style={{ borderTop: (tazkir.best_moment || tazkir.funny_moment) ? '1px solid #f0ebe0' : 'none', paddingTop: (tazkir.best_moment || tazkir.funny_moment) ? 10 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a09080' }}>💬 ציטוט</span>
                <div style={{ fontSize: 14, color: '#4a3a2a', marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>״{tazkir.quote}״</div>
              </div>
            )}
          </div>
        )}

        {/* Rating + would_repeat */}
        {(tazkir.rating > 0 || tazkir.would_repeat !== null) && (
          <div style={{ background: 'white', borderRadius: 18, padding: '14px 15px', marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', gap: 16, alignItems: 'center' }}>
            {tazkir.rating > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a09080', marginBottom: 4 }}>דירוג</div>
                <div>{'⭐'.repeat(tazkir.rating)}</div>
              </div>
            )}
            {tazkir.would_repeat !== null && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a09080', marginBottom: 4 }}>נחזור?</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tazkir.would_repeat ? '#5a7a3a' : '#8a7a60' }}>
                  {tazkir.would_repeat ? '🙌 בהחלט!' : '😅 חד פעמי'}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Lightbox */}
      {lightbox !== null && tazkir.media_urls?.[lightbox] && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={tazkir.media_urls[lightbox]} alt="full" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
