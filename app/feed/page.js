'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'

const REACTIONS = [
  { type: 'proud',   emoji: '❤️', label: 'גאים בך' },
  { type: 'fire',    emoji: '🔥', label: 'אלוף' },
  { type: 'clap',    emoji: '👏', label: 'כל הכבוד' },
  { type: 'star',    emoji: '⭐', label: 'כוכב' },
  { type: 'trophy',  emoji: '🏆', label: 'ניצחון' },
  { type: 'wow',     emoji: '🤯', label: 'וואו' },
]

function Avatar({ profile, size = 36 }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${GOLD}`, overflow: 'hidden', flexShrink: 0,
      background: '#e8d5a3', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: NAVY
    }}>
      {profile.avatar_url && !imgError
        ? <img src={profile.avatar_url} alt={profile.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : profile.name?.charAt(0)}
    </div>
  )
}

function TimeAgo({ dateStr }) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  const text = diff === 0 ? 'היום' : diff === 1 ? 'אתמול' : `לפני ${diff} ימים`
  return <span style={{ fontSize: 11, color: '#a09080' }}>{text}</span>
}

function ReactionBar({ postId, currentProfileId, initialReactions }) {
  const [reactionCounts, setReactionCounts] = useState(initialReactions || {})
  const [myReactions, setMyReactions] = useState([])

  const handleReaction = async (type) => {
    const already = myReactions.includes(type)
    if (already) {
      await supabase.from('reactions')
        .delete()
        .eq('feed_post_id', postId)
        .eq('member_id', currentProfileId)
        .eq('type', type)
      setMyReactions(prev => prev.filter(r => r !== type))
      setReactionCounts(prev => ({ ...prev, [type]: Math.max((prev[type] || 1) - 1, 0) }))
    } else {
      await supabase.from('reactions').upsert({
        feed_post_id: postId, member_id: currentProfileId, type
      }, { onConflict: 'feed_post_id,member_id,type' })
      setMyReactions(prev => [...prev, type])
      setReactionCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }))
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 10 }}>
      {REACTIONS.map(r => {
        const count = reactionCounts[r.type] || 0
        const active = myReactions.includes(r.type)
        return (
          <button key={r.type} onClick={() => handleReaction(r.type)} style={{
            background: active ? '#faf0d0' : '#f7f4ee',
            border: `1px solid ${active ? GOLD : '#e8e0d0'}`,
            borderRadius: 20, padding: '5px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-heebo), sans-serif',
            transition: 'all 0.15s'
          }}>
            <span style={{ fontSize: 15 }}>{r.emoji}</span>
            {count > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

function MediaGallery({ urls }) {
  const [lightbox, setLightbox] = useState(null)
  if (!urls || urls.length === 0) return null

  const isVideo = (url) => url.match(/\.(mp4|mov|webm|avi)(\?|$)/i)

  return (
    <>
      {/* Cover */}
      <div onClick={() => !isVideo(urls[0]) && setLightbox(0)} style={{
        cursor: isVideo(urls[0]) ? 'default' : 'pointer',
        marginBottom: urls.length > 1 ? 6 : 0
      }}>
        {isVideo(urls[0]) ? (
          <video src={urls[0]} controls style={{
            width: '100%', maxHeight: 280, objectFit: 'cover',
            borderRadius: urls.length > 1 ? '12px 12px 0 0' : 12, display: 'block'
          }} />
        ) : (
          <img src={urls[0]} alt="cover" style={{
            width: '100%', maxHeight: 280, objectFit: 'cover',
            borderRadius: urls.length > 1 ? '12px 12px 0 0' : 12, display: 'block'
          }} />
        )}
      </div>

      {/* Thumbnails */}
      {urls.length > 1 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {urls.slice(1).map((url, i) => (
            <div key={i} onClick={() => !isVideo(url) && setLightbox(i + 1)}
              style={{ flex: 1, cursor: isVideo(url) ? 'default' : 'pointer', position: 'relative' }}>
              {isVideo(url) ? (
                <video src={url} style={{
                  width: '100%', height: 80, objectFit: 'cover',
                  borderRadius: i === urls.length - 2 ? '0 0 12px 0' : i === 0 ? '0 0 0 12px' : 0,
                  display: 'block'
                }} />
              ) : (
                <img src={url} alt={`media-${i}`} style={{
                  width: '100%', height: 80, objectFit: 'cover',
                  borderRadius: i === 0 ? '0 0 0 12px' : i === urls.length - 2 ? '0 0 12px 0' : 0,
                  display: 'block'
                }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <img src={urls[lightbox]} alt="full" style={{
            maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain'
          }} />
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', width: 36, height: 36, color: 'white',
            fontSize: 18, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
      )}
    </>
  )
}

function FeedCard({ post, profiles, currentProfile, reactionData }) {
  const isLearning = post.type === 'learning_completed'
  const isTazkir = post.type === 'tahkir'
  const isMission = post.type === 'mission_completed'

  const participantProfiles = (post.participants || [])
    .map(name => profiles.find(p => p.name === name))
    .filter(Boolean)

  const hasMedia = post.media_urls && post.media_urls.length > 0

  return (
    <div style={{
      background: 'white', borderRadius: 20,
      border: '1px solid #e8e0d0', marginBottom: 14,
      overflow: 'hidden'
    }}>
      {/* Card header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex' }}>
          {participantProfiles.slice(0, 3).map((p, i) => (
            <div key={p.id} style={{ marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }}>
              <Avatar profile={p} size={38} />
            </div>
          ))}
          {participantProfiles.length === 0 && (
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#f0ebe0', border: `2px solid ${GOLD}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>
              {isTazkir ? '📝' : isMission ? '🎯' : '⭐'}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>
            {post.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: isTazkir ? '#ede7f6' : isMission ? '#edf7f1' : '#fff8e1',
              color: isTazkir ? PURPLE : isMission ? GREEN : '#9a6500'
            }}>
              {isTazkir ? '📝 תחקיר' : isMission ? '✅ משימה' : '⭐ הישג'}
            </span>
            <TimeAgo dateStr={post.created_at} />
          </div>
        </div>
      </div>

      {/* Media */}
      {hasMedia && (
        <div style={{ marginBottom: 0 }}>
          <MediaGallery urls={post.media_urls} />
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div style={{ padding: hasMedia ? '10px 16px 0' : '0 16px' }}>
          <div style={{
            fontSize: 13, color: '#5a4a3a', lineHeight: 1.6,
            background: '#faf8f4', borderRadius: 10, padding: '10px 12px'
          }}>
            {post.content}
          </div>
        </div>
      )}

      {/* Participants row if tazkir */}
      {isTazkir && participantProfiles.length > 0 && (
        <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#a09080' }}>צוות המבצע:</span>
          {participantProfiles.map(p => (
            <span key={p.id} style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{p.name}</span>
          ))}
        </div>
      )}

      {/* Mission points */}
      {isMission && post.content && (
        <div style={{ padding: '6px 16px 0' }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: GREEN,
            background: '#edf7f1', padding: '3px 10px', borderRadius: 20
          }}>{post.content}</span>
        </div>
      )}

      {/* Reactions */}
      <div style={{ padding: '4px 16px 14px' }}>
        <ReactionBar
          postId={post.id}
          currentProfileId={currentProfile?.id}
          initialReactions={reactionData[post.id] || {}}
        />
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles]             = useState([])
  const [posts, setPosts]                   = useState([])
  const [reactionData, setReactionData]     = useState({})
  const [loading, setLoading]               = useState(true)
  const router = useRouter()

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

    const [{ data: profileData }, { data: postData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true),
      supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(30)
    ])

    if (profileData) setProfiles(profileData)
    if (postData) {
      setPosts(postData)
      // Load reactions for all posts
      const ids = postData.map(p => p.id)
      if (ids.length) {
        const { data: rxData } = await supabase
          .from('reactions').select('*').in('feed_post_id', ids)
        if (rxData) {
          const grouped = {}
          rxData.forEach(r => {
            if (!grouped[r.feed_post_id]) grouped[r.feed_post_id] = {}
            grouped[r.feed_post_id][r.type] = (grouped[r.feed_post_id][r.type] || 0) + 1
          })
          setReactionData(grouped)
        }
      }
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: CREAM,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים זיכרונות...</div>
      </div>
    </div>
  )

  return (
    <div style={{
      width: '100%', maxWidth: 480, margin: '0 auto',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: CREAM,
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box', overflowX: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 16px 24px',
        borderRadius: '0 0 24px 24px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>📖 זיכרונות</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              הסיפור של משפחת רמז
            </div>
          </div>
          <a href="/tazkir/new" style={{
            background: GOLD, color: NAVY, borderRadius: 20,
            padding: '8px 16px', textDecoration: 'none',
            fontWeight: 700, fontSize: 13
          }}>+ תחקיר</a>
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
              עדיין אין זיכרונות
            </div>
            <div style={{ fontSize: 13, color: '#8a7a60', marginBottom: 20 }}>
              סיימו משימה או פתחו תחקיר ראשון
            </div>
            <a href="/tazkir/new" style={{
              display: 'inline-block', padding: '12px 24px',
              background: NAVY, color: 'white', borderRadius: 14,
              textDecoration: 'none', fontWeight: 700, fontSize: 14
            }}>פתחו תחקיר →</a>
          </div>
        ) : (
          posts.map(post => (
            <FeedCard
              key={post.id}
              post={post}
              profiles={profiles}
              currentProfile={currentProfile}
              reactionData={reactionData}
            />
          ))
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: NAVY, borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 16px', zIndex: 100,
        fontFamily: 'var(--font-heebo), sans-serif'
      }}>
        {[
          { href: '/',           label: 'בית',    emoji: '🏠' },
          { href: '/missions',   label: 'משימות', emoji: '🎯' },
          { href: '/tazkir/new', label: 'תחקיר',  emoji: '📝', center: true },
          { href: '/rewards',    label: 'פרסים',  emoji: '🏆' },
          { href: '/feed',       label: 'פיד',    emoji: '📖', active: true },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', gap: 2,
            color: item.active ? GOLD : 'rgba(255,255,255,0.45)',
            fontSize: 10, fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            <span style={{
              ...(item.center ? {
                background: GOLD, borderRadius: '50%',
                width: 44, height: 44, fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -18
              } : { fontSize: 20 })
            }}>{item.emoji}</span>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}