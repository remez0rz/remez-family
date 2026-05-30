'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'
const PAGE_SIZE = 10

const REACTIONS = [
  { type: 'proud',  emoji: '❤️' },
  { type: 'fire',   emoji: '🔥' },
  { type: 'clap',   emoji: '👏' },
  { type: 'star',   emoji: '⭐' },
  { type: 'trophy', emoji: '🏆' },
  { type: 'wow',    emoji: '🤯' },
]

const TYPE_FILTERS = [
  { id: 'all',     label: 'הכל',      emoji: '✨' },
  { id: 'tahkir',  label: 'תחקירים',  emoji: '📝' },
  { id: 'mission', label: 'אתגרים',   emoji: '⭐' },
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
  const [counts, setCounts] = useState(initialReactions || {})
  const [mine, setMine]     = useState([])

  const handle = async (type) => {
    const already = mine.includes(type)
    if (already) {
      await supabase.from('reactions')
        .delete()
        .eq('feed_post_id', postId)
        .eq('member_id', currentProfileId)
        .eq('type', type)
      setMine(prev => prev.filter(r => r !== type))
      setCounts(prev => ({ ...prev, [type]: Math.max((prev[type] || 1) - 1, 0) }))
    } else {
      await supabase.from('reactions').upsert({
        feed_post_id: postId, member_id: currentProfileId, type
      }, { onConflict: 'feed_post_id,member_id,type' })
      setMine(prev => [...prev, type])
      setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }))
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 10 }}>
      {REACTIONS.map(r => {
        const count  = counts[r.type] || 0
        const active = mine.includes(r.type)
        return (
          <button key={r.type} onClick={() => handle(r.type)} style={{
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
  const isVideo = url => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)

  return (
    <>
      <div onClick={() => !isVideo(urls[0]) && setLightbox(0)}
        style={{ cursor: isVideo(urls[0]) ? 'default' : 'pointer', marginBottom: urls.length > 1 ? 4 : 0 }}>
        {isVideo(urls[0])
          ? <video src={urls[0]} controls style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: urls.length > 1 ? '12px 12px 0 0' : 12, display: 'block' }} />
          : <img src={urls[0]} alt="cover" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: urls.length > 1 ? '12px 12px 0 0' : 12, display: 'block' }} />
        }
      </div>
      {urls.length > 1 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {urls.slice(1).map((url, i) => (
            <div key={i} onClick={() => !isVideo(url) && setLightbox(i + 1)}
              style={{ flex: 1, cursor: isVideo(url) ? 'default' : 'pointer' }}>
              {isVideo(url)
                ? <video src={url} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: i === 0 ? '0 0 0 12px' : i === urls.length - 2 ? '0 0 12px 0' : 0, display: 'block' }} />
                : <img src={url} alt={`m${i}`} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: i === 0 ? '0 0 0 12px' : i === urls.length - 2 ? '0 0 12px 0' : 0, display: 'block' }} />
              }
            </div>
          ))}
        </div>
      )}
      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <img src={urls[lightbox]} alt="full" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', width: 36, height: 36,
            color: 'white', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
      )}
    </>
  )
}

function FeedCard({ post, profiles, currentProfile, reactionData }) {
  const isTazkir  = post.type === 'tahkir'
  const isMission = post.type === 'mission_completed'
  const hasMedia  = post.media_urls?.length > 0

  const participantProfiles = (post.participants || [])
    .map(name => profiles.find(p => p.name === name))
    .filter(Boolean)

  return (
    <div style={{
      background: 'white', borderRadius: 20,
      border: '1px solid #e8e0d0', marginBottom: 14, overflow: 'hidden'
    }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex' }}>
          {participantProfiles.length > 0
            ? participantProfiles.slice(0, 3).map((p, i) => (
                <div key={p.id} style={{ marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }}>
                  <Avatar profile={p} size={38} />
                </div>
              ))
            : (
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#f0ebe0', border: `2px solid ${GOLD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
              }}>{isTazkir ? '📝' : '⭐'}</div>
            )
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>
            {post.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: isTazkir ? '#ede7f6' : '#edf7f1',
              color: isTazkir ? PURPLE : GREEN
            }}>
              {isTazkir ? '📝 תחקיר' : '⭐ אתגר'}
            </span>
            <TimeAgo dateStr={post.created_at} />
          </div>
        </div>
      </div>

      {hasMedia && <MediaGallery urls={post.media_urls} />}

      {post.content && (
        <div style={{ padding: '10px 16px 0' }}>
          <div style={{
            fontSize: 13, color: '#5a4a3a', lineHeight: 1.6,
            background: '#faf8f4', borderRadius: 10, padding: '10px 12px'
          }}>{post.content}</div>
        </div>
      )}

      {post.best_moment && (
        <div style={{ padding: '8px 16px 0' }}>
          <span style={{ fontSize: 11, color: '#8a7a60', fontWeight: 600 }}>🌟 </span>
          <span style={{ fontSize: 13, color: '#5a4a3a' }}>{post.best_moment}</span>
        </div>
      )}

      {post.funny_moment && (
        <div style={{ padding: '4px 16px 0' }}>
          <span style={{ fontSize: 11, color: '#8a7a60', fontWeight: 600 }}>😂 </span>
          <span style={{ fontSize: 13, color: '#5a4a3a' }}>{post.funny_moment}</span>
        </div>
      )}

      {post.quote && (
        <div style={{ padding: '4px 16px 0' }}>
          <span style={{ fontSize: 13, color: '#5a4a3a', fontStyle: 'italic' }}>״{post.quote}״</span>
        </div>
      )}

      {post.rating && (
        <div style={{ padding: '4px 16px 0' }}>
          {'⭐'.repeat(post.rating)}
        </div>
      )}

      {isTazkir && participantProfiles.length > 0 && (
        <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#a09080' }}>צוות:</span>
          {participantProfiles.map(p => (
            <span key={p.id} style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{p.name}</span>
          ))}
        </div>
      )}

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
  const [loadingMore, setLoadingMore]       = useState(false)
  const [hasMore, setHasMore]               = useState(true)
  const [page, setPage]                     = useState(0)
  const [typeFilter, setTypeFilter]         = useState('all')
  const [memberFilter, setMemberFilter]     = useState('all')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadInit()
    })
  }, [])

  useEffect(() => {
    if (currentProfile) {
      setPosts([])
      setPage(0)
      setHasMore(true)
      loadPosts(0, true)
    }
  }, [typeFilter, memberFilter])

  const loadInit = async () => {
    const profile = await getCurrentProfile()
    if (!profile) { router.push('/login'); return }
    setCurrentProfile(profile)

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('active', true)
    if (profileData) setProfiles(profileData)

    await loadPosts(0, true, profile)
    setLoading(false)
  }

  const loadPosts = async (pageNum, reset = false, profileOverride = null) => {
    const from = pageNum * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter === 'mission' ? 'mission_completed' : 'tahkir')
    }
    if (memberFilter !== 'all') {
      query = query.contains('participants', [memberFilter])
    }

    const { data: postData } = await query
    if (!postData || postData.length < PAGE_SIZE) setHasMore(false)

    if (postData?.length) {
      const ids = postData.map(p => p.id)
      const { data: rxData } = await supabase
        .from('reactions').select('*').in('feed_post_id', ids)
      if (rxData) {
        const grouped = {}
        rxData.forEach(r => {
          if (!grouped[r.feed_post_id]) grouped[r.feed_post_id] = {}
          grouped[r.feed_post_id][r.type] = (grouped[r.feed_post_id][r.type] || 0) + 1
        })
        setReactionData(prev => reset ? grouped : { ...prev, ...grouped })
      }
    }

    setPosts(prev => reset ? (postData || []) : [...prev, ...(postData || [])])
  }

  const loadMore = async () => {
    setLoadingMore(true)
    const next = page + 1
    setPage(next)
    await loadPosts(next)
    setLoadingMore(false)
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

      <div style={{
        background: NAVY, padding: '20px 16px 0',
        borderRadius: '0 0 24px 24px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>📖 זיכרונות</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              הסיפור של משפחת רמז
            </div>
          </div>
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {TYPE_FILTERS.map(f => (
            <button key={f.id} onClick={() => setTypeFilter(f.id)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: typeFilter === f.id ? GOLD : 'rgba(255,255,255,0.1)',
              color: typeFilter === f.id ? NAVY : 'rgba(255,255,255,0.8)',
              fontWeight: typeFilter === f.id ? 700 : 500,
              fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif',
              flexShrink: 0
            }}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {/* Member filter with real avatars */}
        <div style={{ display: 'flex', gap: 10, paddingBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div onClick={() => setMemberFilter('all')} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', flexShrink: 0
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              border: `2.5px solid ${memberFilter === 'all' ? GOLD : 'rgba(255,255,255,0.2)'}`,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>✨</div>
            <span style={{ fontSize: 10, color: memberFilter === 'all' ? GOLD : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>הכל</span>
          </div>
          {profiles.map(p => (
            <div key={p.id} onClick={() => setMemberFilter(memberFilter === p.name ? 'all' : p.name)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', flexShrink: 0 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                border: `2.5px solid ${memberFilter === p.name ? GOLD : 'rgba(255,255,255,0.2)'}`,
                overflow: 'hidden', background: '#e8d5a3',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: NAVY
              }}>
                {p.avatar_url
                  ? <img src={p.avatar_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  : p.name?.charAt(0)}
              </div>
              <span style={{ fontSize: 10, color: memberFilter === p.name ? GOLD : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
              {typeFilter !== 'all' || memberFilter !== 'all' ? 'אין תוצאות לפילטר הזה' : 'עדיין אין זיכרונות'}
            </div>
            <div style={{ fontSize: 13, color: '#8a7a60', marginBottom: 20 }}>
              {typeFilter !== 'all' || memberFilter !== 'all' ? 'נסו פילטר אחר' : 'השלימו אתגר או פתחו תחקיר ראשון'}
            </div>
            {typeFilter === 'all' && memberFilter === 'all' && (
              <a href="/tazkir/new" style={{
                display: 'inline-block', padding: '12px 24px',
                background: NAVY, color: 'white', borderRadius: 14,
                textDecoration: 'none', fontWeight: 700, fontSize: 14
              }}>פתחו תחקיר →</a>
            )}
          </div>
        ) : (
          <>
            {posts.map(post => (
              <FeedCard
                key={post.id}
                post={post}
                profiles={profiles}
                currentProfile={currentProfile}
                reactionData={reactionData}
              />
            ))}

            {hasMore && (
              <button onClick={loadMore} disabled={loadingMore} style={{
                width: '100%', padding: '13px',
                background: 'white', border: '1px solid #e8e0d0',
                borderRadius: 14, cursor: 'pointer',
                fontWeight: 700, fontSize: 14, color: NAVY,
                fontFamily: 'var(--font-heebo), sans-serif',
                marginBottom: 10
              }}>
                {loadingMore ? 'טוען...' : 'טען עוד זיכרונות ↓'}
              </button>
            )}

            {!hasMore && posts.length > 0 && (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#b0a090' }}>
                זה הכל — {posts.length} זיכרונות במשפחה 🏡
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}