'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadProfiles()
    })
  }, [])

  const loadProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setProfiles(data)
    setLoading(false)
  }

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  const getLevelColor = (role) => role === 'parent' ? '#4285f4' : '#34a853'

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Family Profiles</h1>
        <a href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>← Home</a>
      </div>

      {loading && <p style={{ color: '#999', textAlign: 'center' }}>Loading...</p>}

      {!loading && profiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          <p>No profiles yet.</p>
          <button
            onClick={() => router.push('/profiles/new')}
            style={{ marginTop: '1rem', padding: '10px 24px', background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Add first family member
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {profiles.map(profile => (
          <div key={profile.id} style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer'
          }}
            onClick={() => router.push(`/profiles/${profile.id}`)}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: getLevelColor(profile.role),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '1.2rem',
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(profile.name)
              }
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{profile.name}</div>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>
                {profile.role === 'parent' ? 'Parent' : `Level ${profile.level} · Age ${profile.age}`}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', fontSize: '1.3rem', color: '#4285f4' }}>{profile.total_points}</div>
              <div style={{ color: '#aaa', fontSize: '0.75rem' }}>points</div>
            </div>
          </div>
        ))}
      </div>

      {profiles.length > 0 && (
        <button
          onClick={() => router.push('/profiles/new')}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '12px',
            background: 'white',
            border: '2px dashed #ddd',
            borderRadius: '12px',
            color: '#888',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          + Add family member
        </button>
      )}
    </div>
  )
}