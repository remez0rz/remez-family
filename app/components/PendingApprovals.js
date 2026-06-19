'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const CORAL = '#FF6B6B'
const NAVY  = '#2D2D2D'
const GREEN = '#4ECDC4'

// Parent-only inbox of grandparent suggestions (missions or rewards) awaiting
// approval. Approve flips it live (is_active true); reject deletes it.
export default function PendingApprovals({ kind, onChange }) {
  const table   = kind === 'mission' ? 'missions' : 'rewards'
  const fkHint  = kind === 'mission' ? 'missions_created_by_fkey' : 'rewards_created_by_fkey'
  const [items, setItems] = useState([])

  const load = async () => {
    const { data } = await supabase
      .from(table)
      .select(`*, creator:profiles!${fkHint}(name)`)
      .eq('pending_approval', true)
      .order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const approve = async (it) => {
    await supabase.from(table).update({ pending_approval: false, is_active: true }).eq('id', it.id)
    setItems(prev => prev.filter(x => x.id !== it.id))
    onChange?.()
  }
  const reject = async (it) => {
    await supabase.from(table).delete().eq('id', it.id)
    setItems(prev => prev.filter(x => x.id !== it.id))
  }

  if (!items.length) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F3EEFB, #FBF0FA)',
      border: '1.5px solid rgba(155,127,212,0.4)', borderRadius: 20,
      padding: '14px 16px', marginBottom: 16, direction: 'rtl',
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#7C5CBF', marginBottom: 10 }}>
        💡 הצעות מסבא וסבתא ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(it => (
          <div key={it.id} style={{ background: 'white', borderRadius: 14, padding: '12px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 24 }}>{kind === 'reward' ? (it.emoji || '🎁') : '⭐'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{it.title}</div>
                <div style={{ fontSize: 11, color: '#a09080', marginTop: 1 }}>
                  {(kind === 'mission' ? it.points : it.points_required)} נק׳
                  {it.creator?.name ? ` · הוצע ע״י ${it.creator.name}` : ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => approve(it)} style={{
                flex: 1, padding: '9px', borderRadius: 50, border: 'none', cursor: 'pointer',
                background: GREEN, color: 'white', fontWeight: 800, fontSize: 13,
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>✓ אישור</button>
              <button onClick={() => reject(it)} style={{
                padding: '9px 16px', borderRadius: 50, border: '1.5px solid #f0d8d8', cursor: 'pointer',
                background: 'white', color: CORAL, fontWeight: 700, fontSize: 13,
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>דחייה</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
