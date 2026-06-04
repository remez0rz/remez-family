'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'

const NAVY = '#2D2D2D'
const CORAL = '#FF6B6B'

export default function GroceryList({ isParent }) {
  const [items, setItems]       = useState([])
  const [newItem, setNewItem]   = useState('')
  const [adding, setAdding]     = useState(false)
  const [imgFile, setImgFile]   = useState(null)
  const [imgPrev, setImgPrev]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [memberId, setMemberId] = useState(null)

  useEffect(() => {
    getCurrentProfile().then(p => { if (p) setMemberId(p.id) })
  }, [])

  const loadItems = async () => {
    try {
      const { data } = await supabase
        .from('grocery_items')
        .select('id, name, image_url, is_done, added_by, profiles(name)')
        .eq('is_done', false)
        .order('created_at', { ascending: true })
      if (data) setItems(data)
    } catch {}
  }

  useEffect(() => {
    loadItems()
    const ch = supabase.channel('grocery_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, loadItems)
      .subscribe()
    return () => { try { supabase.removeChannel(ch) } catch {} }
  }, [])

  const handleAdd = async () => {
    if (!newItem.trim() || !memberId) return
    setUploading(true)
    let imageUrl = null
    try {
      if (imgFile) {
        const ext = imgFile.name.split('.').pop()
        const path = `grocery/${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('family-media').upload(path, imgFile, { contentType: imgFile.type })
        if (!error) {
          const { data } = supabase.storage.from('family-media').getPublicUrl(path)
          imageUrl = data.publicUrl
        }
      }
      await supabase.from('grocery_items').insert({ name: newItem.trim(), image_url: imageUrl, added_by: memberId })
    } catch {}
    setNewItem(''); setImgFile(null); setImgPrev(null); setAdding(false); setUploading(false)
    loadItems()
  }

  const markDone = async (id) => {
    await supabase.from('grocery_items').update({ is_done: true }).eq('id', id)
    loadItems()
  }

  const clearAll = async () => {
    await supabase.from('grocery_items').update({ is_done: true }).eq('is_done', false)
    loadItems()
  }

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>🛒 קניות — {items.length} פריטים</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isParent && items.length > 0 && (
            <button onClick={clearAll} style={{ background: '#FFE8E8', color: CORAL, border: 'none', borderRadius: 12, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif' }}>✓ קניתי הכל</button>
          )}
          <button onClick={() => setAdding(v => !v)} style={{ background: adding ? '#FFE8E8' : '#F0EBE0', color: adding ? CORAL : '#6b5e4e', border: 'none', borderRadius: 12, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif' }}>
            {adding ? '✕' : '+ הוסף'}
          </button>
        </div>
      </div>

      {adding && (
        <div style={{ background: '#faf8f4', borderRadius: 12, padding: '10px', marginBottom: 10 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="מה צריך לקנות?"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e0d8c8', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif', marginBottom: 6, boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="file" accept="image/*"
              onChange={e => { const f = e.target.files[0]; if (f) { setImgFile(f); setImgPrev(URL.createObjectURL(f)) }; e.target.value = '' }}
              style={{ display: 'none' }} id="grocery-img" />
            <label htmlFor="grocery-img" style={{ padding: '6px 12px', background: '#F0EBE0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6b5e4e', flexShrink: 0 }}>
              {imgPrev ? '🖼️ ✓' : '📷'}
            </label>
            <button onClick={handleAdd} disabled={uploading || !newItem.trim()}
              style={{ flex: 1, padding: '6px', background: newItem.trim() ? CORAL : '#e0d8c8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif' }}>
              {uploading ? '...' : 'הוסף'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#b0a090', fontSize: 13 }}>הרשימה ריקה 🎉</div>
      ) : (
        <div>
          {(expanded ? items : items.slice(0, 5)).map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f0e8' }}>
              {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: NAVY }}>{item.name}</div>
              <div style={{ fontSize: 10, color: '#a09080' }}>{item.profiles?.name}</div>
              {isParent && (
                <button onClick={() => markDone(item.id)} style={{ background: 'none', border: '1.5px solid #e0d8c8', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#a09080', flexShrink: 0 }}>✓</button>
              )}
            </div>
          ))}
          {items.length > 5 && (
            <button onClick={() => setExpanded(v => !v)} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: CORAL, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif' }}>
              {expanded ? 'פחות ↑' : `עוד ${items.length - 5} ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
