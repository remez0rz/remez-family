'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function FeedPage() {
  const [session, setSession] = useState(null)
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setSession(session)
        loadFeed()
      }
    })
  }, [])

  const loadFeed = async () => {
    const { data, error } = await supabase
      .from('feed_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setFeedItems(data)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Remez Family</h1>
        <button onClick={handleSignOut} style={{
          padding: '6px 16px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'pointer',
          background: 'white'
        }}>Sign out</button>
      </div>

      <a href="/tazkir/new" style={{
        display: 'block',
        textAlign: 'center',
        padding: '14px',
        background: '#4285f4',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '500',
        marginBottom: '1.5rem',
        fontSize: '1rem'
      }}>+ New תחקיר</a>

      {loading && <p style={{ color: '#999', textAlign: 'center' }}>Loading...</p>}

      {!loading && feedItems.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center' }}>No memories yet. Add the first one.</p>
      )}

      {feedItems.map(item => (
        <div key={item.id} style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{item.title}</div>
          {item.body && <p style={{ color: '#444', margin: '0 0 0.5rem' }}>{item.body}</p>}
          {item.funny_moment && <p style={{ color: '#666', margin: '0 0 0.25rem' }}>Funniest: {item.funny_moment}</p>}
          {item.best_moment && <p style={{ color: '#666', margin: '0 0 0.25rem' }}>Best moment: {item.best_moment}</p>}
          {item.quote && <p style={{ color: '#888', fontStyle: 'italic', margin: '0 0 0.25rem' }}>"{item.quote}"</p>}
          {item.rating && <p style={{ color: '#888', margin: '0 0 0.25rem' }}>Rating: {item.rating}/10</p>}
          <p style={{ color: '#bbb', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}