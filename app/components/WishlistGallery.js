'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'

const NAVY  = '#2D2D2D'
const CORAL = '#FF6B6B'
const GOLD  = '#FFB830'

const CATEGORIES = [
  { id: 'all',        label: 'הכל',       emoji: '✨' },
  { id: 'restaurant', label: 'מסעדות',   emoji: '🍽️' },
  { id: 'concert',    label: 'הופעות',   emoji: '🎵' },
  { id: 'activity',   label: 'פעילויות', emoji: '🎯' },
  { id: 'purchase',   label: 'רכישות',   emoji: '💰' },
  { id: 'travel',     label: 'טיולים',   emoji: '✈️' },
  { id: 'other',      label: 'אחר',      emoji: '📌' },
]

const CAT_COLORS = {
  restaurant: '#FF6B6B', concert: '#9B7FD4', activity: '#4ECDC4',
  purchase: '#FFB830', travel: '#3B9FE8', other: '#8a7a60',
}

const EMPTY_FORM = { title: '', category: 'activity', description: '', website_url: '', address: '', price_estimate: '', image_url: '' }

// ── Add / Edit modal ──────────────────────────────────────────────────────────
function ItemFormModal({ item, onClose, onSaved, currentProfileId }) {
  const isEdit = !!item?.id
  const [form, setForm] = useState(
    isEdit
      ? { title: item.title, category: item.category, description: item.description || '',
          website_url: item.website_url || '', address: item.address || '',
          price_estimate: item.price_estimate || '', image_url: item.image_url || '' }
      : { ...EMPTY_FORM }
  )
  const [imgFile, setImgFile]     = useState(null)
  const [imgPrev, setImgPrev]     = useState(isEdit ? item.image_url || null : null)
  const [saving, setSaving]       = useState(false)
  const [showImgHelper, setShowImgHelper] = useState(false)

  const handleImg = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImgFile(f); setImgPrev(URL.createObjectURL(f)); e.target.value = ''
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    let imageUrl = form.image_url || null

    if (imgFile) {
      const ext = imgFile.name.split('.').pop()
      const path = `wishlist/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(path, imgFile, { contentType: imgFile.type })
      if (!error) {
        const { data } = supabase.storage.from('family-media').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    if (isEdit) {
      await supabase.from('wishlist_items').update({ ...form, image_url: imageUrl }).eq('id', item.id)
    } else {
      await supabase.from('wishlist_items').insert({ ...form, image_url: imageUrl, added_by: currentProfileId })
    }
    setSaving(false)
    onSaved()
  }

  const googleImagesUrl = `https://www.google.com/search?q=${encodeURIComponent(form.title || 'תמונה')}&tbm=isch`

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.88)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>{isEdit ? '✏️ עריכה' : '✨ הוסף ל-2026'}</div>
          <button onClick={onClose} style={{ background: '#F0EBE0', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#888' }}>✕</button>
        </div>

        {/* Image section */}
        <input type="file" accept="image/*" onChange={handleImg} style={{ display: 'none' }} id="wish-img" />
        {imgPrev || form.image_url ? (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <img src={imgPrev || form.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 16, display: 'block' }} />
            <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6 }}>
              <label htmlFor="wish-img" style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '4px 8px', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>🔄 החלף</label>
              <button onClick={() => { setImgFile(null); setImgPrev(null); setForm(f => ({ ...f, image_url: '' })) }}
                style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8, padding: '4px 8px', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✕ הסר</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <label htmlFor="wish-img" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              height: 56, background: '#f8f6f2', border: '2px dashed #ddd', borderRadius: 14,
              cursor: 'pointer', color: '#a09080', fontSize: 13, fontWeight: 600
            }}>📷 העלה תמונה</label>
            <button onClick={() => setShowImgHelper(v => !v)} style={{
              flex: 1, height: 56, background: showImgHelper ? '#EDE7F6' : '#f0f8ff',
              border: `2px dashed ${showImgHelper ? '#9B7FD4' : '#3B9FE8'}`, borderRadius: 14,
              cursor: 'pointer', color: showImgHelper ? '#9B7FD4' : '#3B9FE8',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-heebo), sans-serif'
            }}>🔍 חפש תמונה</button>
          </div>
        )}

        {/* Google Images helper panel */}
        {showImgHelper && (
          <div style={{ background: '#f0f8ff', borderRadius: 14, padding: '12px 14px', marginBottom: 12, border: '1px solid #c8e4f8' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3B9FE8', marginBottom: 8 }}>🔍 איך מוסיפים תמונה מגוגל</div>
            <div style={{ fontSize: 12, color: '#5a7a9a', lineHeight: 1.7, marginBottom: 10 }}>
              1. לחץ על הכפתור למטה לפתוח גוגל תמונות<br/>
              2. מצא תמונה מתאימה ולחץ עליה<br/>
              3. לחץ לחיצה ארוכה על התמונה → <b>העתק כתובת תמונה</b><br/>
              4. חזור לכאן והדבק בשדה "כתובת URL" למטה
            </div>
            <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', textAlign: 'center', padding: '10px', background: '#3B9FE8',
              color: 'white', borderRadius: 50, textDecoration: 'none',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
            }}>🔍 פתח גוגל תמונות → {form.title || '...'}</a>
          </div>
        )}

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 12, paddingBottom: 4 }}>
          {CATEGORIES.filter(c => c.id !== 'all').map(c => (
            <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))} style={{
              padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: form.category === c.id ? CAT_COLORS[c.id] : '#F0EBE0',
              color: form.category === c.id ? 'white' : '#6b5e4e',
              fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-heebo), sans-serif'
            }}>{c.emoji} {c.label}</button>
          ))}
        </div>

        {/* Fields */}
        {[
          { key: 'title',          label: 'שם *',             placeholder: 'למשל: מסעדת נמל תל אביב' },
          { key: 'description',    label: 'תיאור',            placeholder: 'למה בא לנו לנסות את זה?' },
          { key: 'website_url',    label: '🔗 קישור לאתר',    placeholder: 'https://...' },
          { key: 'address',        label: '📍 כתובת',          placeholder: 'רחוב, עיר' },
          { key: 'price_estimate', label: '💰 עלות משוערת',    placeholder: '₪200, חינם...' },
          { key: 'image_url',      label: '🖼️ כתובת URL לתמונה', placeholder: 'הדבק כתובת תמונה מגוגל...' },
        ].map(field => (
          <div key={field.key} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 3 }}>{field.label}</div>
            {field.key === 'description' ? (
              <textarea value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder} rows={2}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e0d8c8', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', resize: 'none', outline: 'none' }} />
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={form[field.key]} onChange={e => {
                    setForm(f => ({ ...f, [field.key]: e.target.value }))
                    // Live preview for image URL
                    if (field.key === 'image_url' && e.target.value.startsWith('http')) setImgPrev(e.target.value)
                  }}
                  placeholder={field.placeholder}
                  type={field.key === 'website_url' || field.key === 'image_url' ? 'url' : 'text'}
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid #e0d8c8', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', outline: 'none' }} />
                {field.key === 'image_url' && form[field.key] && (
                  <button onClick={() => { setForm(f => ({ ...f, image_url: '' })); setImgPrev(null) }}
                    style={{ padding: '0 10px', background: '#FFE8E8', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: CORAL }}>✕</button>
                )}
              </div>
            )}
          </div>
        ))}

        <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
          width: '100%', padding: '14px',
          background: form.title.trim() ? CORAL : '#e0d8c8', color: 'white',
          border: 'none', borderRadius: 50, cursor: form.title.trim() ? 'pointer' : 'default',
          fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: form.title.trim() ? '0 4px 12px rgba(255,107,107,0.35)' : 'none', marginTop: 6
        }}>
          {saving ? '...' : isEdit ? '💾 שמור שינויים' : '+ הוסף לרשימה'}
        </button>
      </div>
    </div>
  )
}

// ── Item detail modal ─────────────────────────────────────────────────────────
function ItemDetailModal({ item, onClose, onDelete, onEdit }) {
  const cat   = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0]
  const color = CAT_COLORS[item.category] || '#8a7a60'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.92)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        {item.image_url && (
          <div style={{ position: 'relative' }}>
            <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: '28px 28px 0 0', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', borderRadius: '28px 28px 0 0' }} />
          </div>
        )}
        <div style={{ padding: '20px 22px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ flex: 1, paddingLeft: 10 }}>
              <div style={{ display: 'inline-block', background: color + '20', color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                {cat.emoji} {cat.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: NAVY }}>{item.title}</div>
            </div>
            <button onClick={onClose} style={{ background: '#F0EBE0', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#888', flexShrink: 0 }}>✕</button>
          </div>

          {item.description && (
            <div style={{ fontSize: 14, color: '#5a4a3a', lineHeight: 1.6, marginBottom: 14, background: '#faf8f4', borderRadius: 12, padding: '10px 12px' }}>{item.description}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {item.address && (
              <a href={`https://maps.google.com?q=${encodeURIComponent(item.address)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0f8ff', borderRadius: 12, textDecoration: 'none', color: '#3B9FE8' }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.address}</span>
              </a>
            )}
            {item.website_url && (
              <a href={item.website_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0fff4', borderRadius: 12, textDecoration: 'none', color: '#1a8a5a' }}>
                <span style={{ fontSize: 20 }}>🔗</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>פתח אתר</span>
              </a>
            )}
            {item.price_estimate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fffbf0', borderRadius: 12 }}>
                <span style={{ fontSize: 20 }}>💰</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#CC8800' }}>{item.price_estimate}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={() => onEdit(item)} style={{
              flex: 2, padding: '12px', background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`,
              color: 'white', border: 'none', borderRadius: 50, cursor: 'pointer',
              fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif',
              boxShadow: '0 4px 12px rgba(255,107,107,0.3)'
            }}>✏️ עריכה</button>
            <button onClick={() => onDelete(item.id)} style={{
              flex: 1, padding: '12px', background: '#FFE8E8', color: CORAL,
              border: 'none', borderRadius: 50, cursor: 'pointer',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
            }}>🗑️ הסר</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main gallery ──────────────────────────────────────────────────────────────
export default function WishlistGallery() {
  const [items, setItems]           = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [showForm, setShowForm]     = useState(false)
  const [editItem, setEditItem]     = useState(null)
  const [selected, setSelected]     = useState(null)
  const [profileId, setProfileId]   = useState(null)

  useEffect(() => {
    getCurrentProfile().then(p => { if (p) setProfileId(p.id) })
    loadItems()
  }, [])

  const loadItems = async () => {
    const { data } = await supabase.from('wishlist_items').select('*').eq('is_done', false).order('created_at', { ascending: false })
    if (data) setItems(data)
  }

  const handleDelete = async (id) => {
    await supabase.from('wishlist_items').update({ is_done: true }).eq('id', id)
    setSelected(null)
    loadItems()
  }

  const handleEdit = (item) => {
    setSelected(null)
    setEditItem(item)
  }

  const filtered = activeFilter === 'all' ? items : items.filter(i => i.category === activeFilter)

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: NAVY }}>✨ רשימת 2026</div>
          <div style={{ fontSize: 11, color: '#a09080', marginTop: 1 }}>{items.length} פריטים ברשימה</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`, color: 'white',
          border: 'none', borderRadius: 20, padding: '7px 14px', cursor: 'pointer',
          fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: '0 3px 8px rgba(255,107,107,0.35)'
        }}>+ הוסף</button>
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 12, paddingBottom: 2 }}>
        {CATEGORIES.map(c => {
          const count = c.id === 'all' ? items.length : items.filter(i => i.category === c.id).length
          if (count === 0 && c.id !== 'all') return null
          return (
            <button key={c.id} onClick={() => setActiveFilter(c.id)} style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: activeFilter === c.id ? (CAT_COLORS[c.id] || CORAL) : '#F0EBE0',
              color: activeFilter === c.id ? 'white' : '#6b5e4e',
              fontWeight: activeFilter === c.id ? 700 : 500,
              fontSize: 11, fontFamily: 'var(--font-heebo), sans-serif'
            }}>{c.emoji} {c.label}{count > 0 ? ` (${count})` : ''}</button>
          )
        })}
      </div>

      {/* Swipeable gallery */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#b0a090', fontSize: 13, background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>✨</div>
          <div>הוסיפו דברים שבא לכם לעשות ב-2026!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, scrollSnapType: 'x mandatory' }}>
          {filtered.map(item => {
            const cat   = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0]
            const color = CAT_COLORS[item.category] || '#8a7a60'
            return (
              <div key={item.id} onClick={() => setSelected(item)} style={{
                flexShrink: 0, width: 200, borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', cursor: 'pointer',
                scrollSnapAlign: 'start', background: 'white', position: 'relative'
              }}>
                {item.image_url ? (
                  <div style={{ position: 'relative', height: 120 }}>
                    <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                  </div>
                ) : (
                  <div style={{ height: 100, background: `linear-gradient(135deg, ${color}30, ${color}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                    {cat.emoji}
                  </div>
                )}
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ display: 'inline-block', background: color + '20', color, borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, marginBottom: 4 }}>
                    {cat.emoji} {cat.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.title}
                  </div>
                  {item.address && <div style={{ fontSize: 10, color: '#a09080', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>📍 {item.address}</div>}
                  {item.price_estimate && <div style={{ fontSize: 10, color: '#CC8800', fontWeight: 600, marginTop: 2 }}>💰 {item.price_estimate}</div>}
                </div>
                {/* Edit shortcut on card */}
                <button onClick={e => { e.stopPropagation(); handleEdit(item) }} style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, cursor: 'pointer', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>✏️</button>
              </div>
            )
          })}
        </div>
      )}

      {(showForm || editItem) && (
        <ItemFormModal
          item={editItem || null}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSaved={() => { setShowForm(false); setEditItem(null); loadItems() }}
          currentProfileId={profileId}
        />
      )}

      {selected && (
        <ItemDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}
