'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewTazkirPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    funny_moment: '',
    best_moment: '',
    quote: '',
    rating: '',
    participants: ''
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
    if (!form.title) return alert('Add a title first')
    setLoading(true)

    const participants = form.participants
      ? form.participants.split(',').map(p => p.trim())
      : []

    const { error } = await supabase.from('feed_items').insert({
      author_id: session.user.id,
      type: 'tazkir',
      title: form.title,
      body: form.body,
      funny_moment: form.funny_moment,
      best_moment: form.best_moment,
      quote: form.quote,
      rating: form.rating ? parseInt(form.rating) : null,
      participants
    })

    if (error) {
      alert('Error saving. Try again.')
      console.error(error)
    } else {
      router.push('/feed')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
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
    color: '#444'
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <a href="/feed" style={{ color: '#666', textDecoration: 'none' }}>← Back</a>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>New תחקיר</h1>
      </div>

      <label style={labelStyle}>What was the mission / event?</label>
      <input name="title" value={form.title} onChange={handleChange} placeholder="Pizza night, Park adventure..." style={inputStyle} />

      <label style={labelStyle}>Who was there?</label>
      <input name="participants" value={form.participants} onChange={handleChange} placeholder="Dad, Maya, Uri..." style={inputStyle} />

      <label style={labelStyle}>What happened?</label>
      <textarea name="body" value={form.body} onChange={handleChange} placeholder="Tell the story..." style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />

      <label style={labelStyle}>Funniest moment</label>
      <input name="funny_moment" value={form.funny_moment} onChange={handleChange} placeholder="The moment everyone laughed..." style={inputStyle} />

      <label style={labelStyle}>Best moment</label>
      <input name="best_moment" value={form.best_moment} onChange={handleChange} placeholder="The highlight..." style={inputStyle} />

      <label style={labelStyle}>Quote of the day</label>
      <input name="quote" value={form.quote} onChange={handleChange} placeholder="Something someone said..." style={inputStyle} />

      <label style={labelStyle}>Rating (1-10)</label>
      <input name="rating" type="number" min="1" max="10" value={form.rating} onChange={handleChange} style={{ ...inputStyle, width: '80px' }} />

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
        {loading ? 'Saving...' : 'Save to family timeline'}
      </button>
    </div>
  )
}