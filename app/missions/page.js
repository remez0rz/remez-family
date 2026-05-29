'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const categoryColors = {
  Family: '#4285f4',
  Learning: '#34a853',
  Helping: '#fbbc04',
  Creative: '#ea4335',
  Funny: '#ff6d00',
  Outdoor: '#00897b',
  Reading: '#8e24aa',
  English: '#1e88e5',
  Hebrew: '#d81b60',
  Kindness: '#e91e63',
  House: '#795548',
  Memory: '#546e7a',
  Health: '#43a047',
  Weekend: '#f4511e'
}

const difficultyLabel = { easy: '⚡ Easy', medium: '🔥 Medium', hard: '💪 Hard' }

export default function MissionsPage() {
  const [missions, setMissions] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadData()
    })
  }, [])

  const loadData = async () => {
    const [{ data: missions }, { data: profiles }] = await Promise.all([
      supabase.from('missions').select('*').eq('is_active', true).order('category'),
      supabase.from('profiles').select('*').eq('active', true)
    ])
    if (missions) setMissions(missions)
    if (profiles) setProfiles(profiles)
    setLoading(false)
  }

  const categories = ['All', ...new Set(missions.map(m => m.category))]

  const filtered = selectedCategory === 'All'
    ? missions
    : missions.filter(m => m.category === selectedCategory)

  const assignMission = async (mission) => {
    const children = profiles.filter(p => p.role === 'child')
    if (children.length === 0) return alert('No children profiles found')

    const names = children.map((c, i) => `${i + 1}. ${c.name}`).join('\n')
    const input = prompt(`Assign "${mission.title}" to:\n${names}\n\nEnter number (or leave blank for all kids):`)

    let targets = children
    if (input && input.trim() !== '') {
      const idx = parseInt(input.trim()) - 1
      if (idx >= 0 && idx < children.length) {
        targets = [children[idx]]
      }
    }

    const assignments = targets.map(child => ({
      mission_id: mission.id,
      assigned_to: child.id,
      status: 'active'
    }))

    const { error } = await supabase.from('assignments').insert(assignments)
    if (error) {
      alert('Error assigning mission')
      console.error(error)
    } else {
      alert(`Mission assigned to ${targets.map(t => t.name).join(', ')}!`)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Missions</h1>
        <a href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>← Home</a>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: selectedCategory === cat ? '#4285f4' : '#f0f0f0',
              color: selectedCategory === cat ? 'white' : '#444',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.85rem',
              fontWeight: selectedCategory === cat ? '600' : '400'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#999', textAlign: 'center' }}>Loading missions...</p>}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {filtered.map(mission => (
          <div key={mission.id} style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: '14px',
            padding: '1rem',
            borderLeft: `4px solid ${categoryColors[mission.category] || '#ccc'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: '600', fontSize: '1rem', flex: 1, marginRight: '0.5rem' }}>{mission.title}</div>
              <div style={{ fontWeight: '700', color: '#4285f4', whiteSpace: 'nowrap' }}>+{mission.points} pts</div>
            </div>

            <p style={{ color: '#666', fontSize: '0.875rem', margin: '0 0 0.75rem', lineHeight: '1.4' }}>{mission.description}</p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', background: '#f0f0f0', color: '#555' }}>
                {categoryColors[mission.category] ? mission.category : 'General'}
              </span>
              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', background: '#f0f0f0', color: '#555' }}>
                {difficultyLabel[mission.difficulty]}
              </span>
              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', background: '#f0f0f0', color: '#555' }}>
                ⏱ {mission.estimated_minutes} min
              </span>
              {mission.repeatable && (
                <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', background: '#e8f5e9', color: '#2e7d32' }}>
                  🔁 Repeatable
                </span>
              )}
            </div>

            <button
              onClick={() => assignMission(mission)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              Assign Mission
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}