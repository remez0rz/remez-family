'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewProfilePage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    role: 'child',
    age: '',
  })
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setSession(session)
    })
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.name) return alert('Name is required')
    setLoading(true)

    const isParent = form.role === 'parent'

    const { error } = await supabase.from('profiles').insert({
      name: form.name,
      role: form.role,
      age: form.age ? parseInt(form.age) : null,
      level: 1,
      total_points: 0,
      user_id: isParent ? session.user.id : null
    })

    if (error) {
      alert('Error saving profile')
      console.error(error)
    } else {
      router.push('/profiles')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    marginBottom: '1rem',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    fontWeight: '500',
    marginBottom: '0.25rem',
    color: '#444',
    fontSize: '0.9rem'
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <a href="/profiles" style={{ color: '#666', textDecoration: 'none' }}>← Back</a>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Add family member</h1>
      </div>

      <label style={labelStyle}>Name</label>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="First name"
        style={inputStyle}
      />

      <label style={labelStyle}>Role</label>
      <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
        <option value="child">Child</option>
        <option value="parent">Parent</option>
      </select>

      <label style={labelStyle}>Age</label>
      <input
        name="age"
        type="number"
        value={form.age}
        onChange={handleChange}
        placeholder="Age"
        style={{ ...inputStyle, width: '100px' }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: '500',
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}
      >
        {loading ? 'Saving...' : 'Add to family'}
      </button>
    </div>
  )
}