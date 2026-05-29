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

function Avatar({ profile, size = 64 }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid ${profile.role === 'parent' ? 'rgba(255,255,255,0.3)' : GOLD}`,
      overflow: 'hidden', flexShrink: 0,
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

function ProgressBar({ value, max, color = GOLD }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 100
  return (
    <div style={{ background: '#f0ebe0', borderRadius: 6, height: 6 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function PhotoUploadModal({ profile, onClose, onDone }) {
  const [preview, setPreview] = useState(profile.avatar_url || null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleSelect = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `avatars/${profile.id}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('family-media')
      .upload(filename, file, { contentType: file.type, upsert: true })
    if (uploadError) { console.error(uploadError); setUploading(false); return }
    const { data } = supabase.storage.from('family-media').getPublicUrl(filename)
    const publicUrl = data.publicUrl
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    setUploading(false)
    onDone(publicUrl)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.85)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 20 }}>
          תמונת פרופיל — {profile.name}
        </div>
        <div style={{
          width: 110, height: 110, borderRadius: '50%',
          border: `3px solid ${GOLD}`, overflow: 'hidden',
          margin: '0 auto 20px', background: '#e8d5a3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, fontWeight: 700, color: NAVY
        }}>
          {preview
            ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : profile.name?.charAt(0)}
        </div>

        <input type="file" accept="image/*" capture="environment"
          onChange={handleSelect} style={{ display: 'none' }} id="avatar-camera" />
        <input type="file" accept="image/*"
          onChange={handleSelect} style={{ display: 'none' }} id="avatar-gallery" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <label htmlFor="avatar-camera" style={{
            flex: 1, padding: '10px', background: '#f0ebe0',
            borderRadius: 12, border: '1.5px dashed #c8bfb0',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6b5e4e'
          }}>📷 מצלמה</label>
          <label htmlFor="avatar-gallery" style={{
            flex: 1, padding: '10px', background: '#f0ebe0',
            borderRadius: 12, border: '1.5px dashed #c8bfb0',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6b5e4e'
          }}>🖼️ גלריה</label>
        </div>

        <button onClick={handleUpload} disabled={!file || uploading} style={{
          width: '100%', padding: '12px',
          background: file ? GOLD : '#e0d8c8',
          color: file ? NAVY : '#a09080',
          border: 'none', borderRadius: 12, cursor: file ? 'pointer' : 'default',
          fontWeight: 700, fontSize: 15, marginBottom: 10,
          fontFamily: 'var(--font-heebo), sans-serif'
        }}>
          {uploading ? 'מעלה...' : 'שמור תמונה'}
        </button>

        <button onClick={onClose} style={{
          width: '100%', padding: '10px', background: 'transparent',
          border: 'none', cursor: 'pointer', color: '#a09080',
          fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
        }}>ביטול</button>
      </div>
    </div>
  )
}

export default function ProfilesPage() {
  const [profiles, setProfiles]             = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [rewards, setRewards]               = useState([])
  const [badges, setBadges]                 = useState([])
  const [loading, setLoading]               = useState(true)
  const [uploadTarget, setUploadTarget]     = useState(null)
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

    const [{ data: profileData }, { data: rewardData }, { data: badgeData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true).order('created_at'),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('member_badges').select('*, badge:badges(*)').order('awarded_at', { ascending: false })
    ])

    if (profileData) setProfiles(profileData)
    if (rewardData) setRewards(rewardData)
    if (badgeData) setBadges(badgeData)
    setLoading(false)
  }

  const getNextReward = (points) => rewards.find(r => r.points_required > points)

  const isParent = currentProfile?.role === 'parent'

  const handlePhotoDone = (profileId, url) => {
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, avatar_url: url } : p))
    setUploadTarget(null)
  }

  const parents  = profiles.filter(p => p.role === 'parent')
  const children = profiles.filter(p => p.role === 'child').sort((a, b) => b.total_points - a.total_points)
  const childColors = [GOLD, PURPLE, GREEN]

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: CREAM,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍👩‍👧</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים פרופילים...</div>
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

      {uploadTarget && (
        <PhotoUploadModal
          profile={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onDone={(url) => handlePhotoDone(uploadTarget.id, url)}
        />
      )}

      {/* Header */}
      <div style={{
        background: NAVY, padding: '20px 16px 24px',
        borderRadius: '0 0 24px 24px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>👨‍👩‍👧 המשפחה</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {profiles.length} בני משפחה
            </div>
          </div>
          <a href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13 }}>← בית</a>
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>

        {/* Children */}
        {children.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8a7a60', marginBottom: 10, letterSpacing: '0.05em' }}>
              ילדים
            </div>
            {children.map((child, i) => {
              const next = getNextReward(child.total_points)
              const color = childColors[i] || GOLD
              const childBadges = badges.filter(b => b.member_id === child.id)

              return (
                <div key={child.id} style={{
                  background: 'white', borderRadius: 20,
                  border: '1px solid #e8e0d0', marginBottom: 12, overflow: 'hidden'
                }}>
                  {/* Navy top */}
                  <div style={{ background: NAVY, padding: '16px 16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar profile={child} size={64} />
                        {isParent && (
                          <button onClick={() => setUploadTarget(child)} style={{
                            position: 'absolute', bottom: -2, right: -2,
                            background: GOLD, border: '2px solid white',
                            borderRadius: '50%', width: 24, height: 24,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 11
                          }}>📷</button>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>{child.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span style={{
                            background: color, color: NAVY,
                            fontSize: 11, fontWeight: 700,
                            padding: '2px 10px', borderRadius: 20
                          }}>רמה {child.level || 1}</span>
                          {child.age && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>גיל {child.age}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{child.total_points}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>נקודות</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress + badges */}
                  <div style={{ padding: '14px 16px' }}>
                    {next ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#8a7a60' }}>החוויה הבאה</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color }}>
                            עוד {next.points_required - child.total_points} נק׳
                          </span>
                        </div>
                        <ProgressBar value={child.total_points} max={next.points_required} color={color} />
                        <div style={{ fontSize: 11, color: '#a09080', marginTop: 4 }}>{next.title}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: GREEN, fontWeight: 700, textAlign: 'center' }}>
                        🏆 השיג את כל החוויות!
                      </div>
                    )}

                    {/* Level progress */}
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0ebe0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#a09080' }}>רמה {child.level || 1}</span>
                        <span style={{ fontSize: 11, color: '#a09080' }}>
                          {500 - (child.total_points % 500)} נק׳ לרמה {(child.level || 1) + 1}
                        </span>
                      </div>
                      <div style={{ background: '#f0ebe0', borderRadius: 4, height: 4 }}>
                        <div style={{
                          width: `${(child.total_points % 500) / 500 * 100}%`,
                          height: '100%', background: color, borderRadius: 4
                        }} />
                      </div>
                    </div>

                    {/* Badges */}
                    {childBadges.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0ebe0' }}>
                        <div style={{ fontSize: 11, color: '#8a7a60', marginBottom: 8, fontWeight: 600 }}>
                          🏅 בדג׳ים שהרווחת
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {childBadges.map(mb => (
                            <div key={mb.id} style={{
                              background: '#f7f4ee', borderRadius: 10,
                              padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5,
                              border: '1px solid #e8e0d0'
                            }} title={mb.badge?.description}>
                              <span style={{ fontSize: 16 }}>{mb.badge?.icon}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{mb.badge?.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* Parents */}
        {parents.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8a7a60', marginBottom: 10, marginTop: 4, letterSpacing: '0.05em' }}>
              הורים
            </div>
            {parents.map(parent => (
              <div key={parent.id} style={{
                background: NAVY, borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 10, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar profile={parent} size={52} />
                  {isParent && (
                    <button onClick={() => setUploadTarget(parent)} style={{
                      position: 'absolute', bottom: -2, right: -2,
                      background: GOLD, border: '2px solid ' + NAVY,
                      borderRadius: '50%', width: 22, height: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: 10
                    }}>📷</button>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{parent.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>הורה</div>
                </div>
                <div style={{
                  background: 'rgba(201,168,76,0.15)', borderRadius: 20,
                  padding: '4px 12px', fontSize: 12, fontWeight: 700, color: GOLD
                }}>
                  מנהל
                </div>
              </div>
            ))}
          </>
        )}

      </div>

      <BottomNav />
    </div>
  )
}