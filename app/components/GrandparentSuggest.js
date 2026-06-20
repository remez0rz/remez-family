'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const CORAL = '#FF6B6B'
const NAVY  = '#2D2D2D'

const MISSION_CATS = [
  { id: 'Family',   emoji: '👨‍👩‍👧', label: 'משפחה' },
  { id: 'Helping',  emoji: '🤝',     label: 'עזרה' },
  { id: 'Learning', emoji: '🧠',     label: 'לימוד' },
  { id: 'Outdoor',  emoji: '🌿',     label: 'בחוץ' },
  { id: 'Creative', emoji: '🎨',     label: 'יצירה' },
  { id: 'Kindness', emoji: '💗',     label: 'טוב לב' },
]
const REWARD_EMOJIS = ['🎁', '🍦', '🎬', '🧁', '🎮', '📚', '⚽', '🌟', '🎨', '🍕']

// Grandparents can suggest a mission or a reward. It is saved as pending and
// inactive — a parent must approve it before any child sees it.
export default function GrandparentSuggest({ currentProfile }) {
  const [open, setOpen]         = useState(false)
  const [kind, setKind]         = useState('mission') // 'mission' | 'reward'
  const [title, setTitle]       = useState('')
  const [points, setPoints]     = useState(30)
  const [category, setCategory] = useState('Family')
  const [emoji, setEmoji]       = useState('🎁')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)

  const reset = () => { setTitle(''); setPoints(30); setCategory('Family'); setEmoji('🎁'); setKind('mission') }

  const submit = async () => {
    if (!title.trim() || saving) return
    setSaving(true)

    if (kind === 'mission') {
      await supabase.from('missions').insert({
        title: title.trim(), points, category,
        type: 'fun', difficulty: 'easy', estimated_minutes: 20, repeatable: false,
        is_active: false, pending_approval: true, created_by: currentProfile?.id,
      })
    } else {
      await supabase.from('rewards').insert({
        title: title.trim(), points_required: points, type: 'experience', emoji,
        is_active: false, pending_approval: true, created_by: currentProfile?.id,
      })
    }

    // Nudge the parents to review the suggestion.
    const { data: parents } = await supabase.from('profiles').select('id').eq('role', 'parent').eq('active', true)
    const ids = (parents || []).map(p => p.id)
    if (ids.length) {
      fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIds: ids,
          title: '💡 הצעה חדשה מסבא/סבתא',
          body: `${currentProfile?.name || ''}: ${title.trim()}`,
          url: kind === 'mission' ? '/missions' : '/rewards', tag: 'suggestion', category: 'suggestions'
        })
      }).catch(() => {})
    }

    setSaving(false); setDone(true)
    setTimeout(() => { setDone(false); setOpen(false); reset() }, 1900)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: 'white', color: CORAL, border: 'none',
        borderRadius: 50, padding: '7px 16px', cursor: 'pointer',
        fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(255,107,107,0.35)',
        fontFamily: 'var(--font-heebo), sans-serif', whiteSpace: 'nowrap'
      }}>💡 הצעה</button>

      {open && (
        <div onClick={() => !saving && setOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,22,40,0.88)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px',
            width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ width: 40, height: 4, background: '#e0d8c8', borderRadius: 4, margin: '0 auto 20px' }} />

            {done ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>💜</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>ההצעה נשלחה!</div>
                <div style={{ fontSize: 13, color: '#a09080', marginTop: 6 }}>ההורים יראו ויאשרו אותה בקרוב</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 900, color: NAVY, marginBottom: 16 }}>💡 הצעה למשפחה</div>

                {/* mission / reward toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[{ id: 'mission', label: '⭐ משימה' }, { id: 'reward', label: '🎁 פרס' }].map(o => (
                    <button key={o.id} onClick={() => setKind(o.id)} style={{
                      flex: 1, padding: '10px', borderRadius: 14, cursor: 'pointer',
                      border: kind === o.id ? `2px solid ${CORAL}` : '1.5px solid #ede8e0',
                      background: kind === o.id ? '#FFF0F0' : '#faf8f4',
                      color: kind === o.id ? CORAL : '#a09080', fontWeight: 800, fontSize: 14,
                      fontFamily: 'var(--font-heebo), sans-serif'
                    }}>{o.label}</button>
                  ))}
                </div>

                <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
                  placeholder={kind === 'mission' ? 'שם המשימה — למשל: לצייר ציור לסבתא' : 'שם הפרס — למשל: גלידה עם סבא'}
                  style={{ width: '100%', padding: '13px 14px', border: '1.5px solid #ede8e0', borderRadius: 14, fontSize: 15, color: NAVY, background: '#faf8f4', fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', outline: 'none', marginBottom: 14, fontWeight: 600 }} />

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e4e', marginBottom: 8 }}>נקודות</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[10, 20, 30, 50, 100].map(p => (
                      <button key={p} onClick={() => setPoints(p)} style={{
                        flex: 1, padding: '9px 4px', borderRadius: 12, cursor: 'pointer',
                        border: points === p ? `2px solid ${CORAL}` : '1.5px solid #ede8e0',
                        background: points === p ? '#FFF0F0' : '#faf8f4',
                        color: points === p ? CORAL : '#a09080', fontWeight: 800, fontSize: 14,
                        fontFamily: 'var(--font-heebo), sans-serif'
                      }}>{p}</button>
                    ))}
                  </div>
                </div>

                {kind === 'mission' ? (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e4e', marginBottom: 8 }}>קטגוריה</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {MISSION_CATS.map(c => (
                        <button key={c.id} onClick={() => setCategory(c.id)} style={{
                          padding: '8px 12px', borderRadius: 12, cursor: 'pointer',
                          border: category === c.id ? `2px solid ${CORAL}` : '1.5px solid #ede8e0',
                          background: category === c.id ? '#FFF0F0' : '#faf8f4',
                          color: category === c.id ? CORAL : '#a09080', fontWeight: 700, fontSize: 13,
                          fontFamily: 'var(--font-heebo), sans-serif'
                        }}>{c.emoji} {c.label}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e4e', marginBottom: 8 }}>אייקון</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {REWARD_EMOJIS.map(em => (
                        <button key={em} onClick={() => setEmoji(em)} style={{
                          width: 42, height: 42, borderRadius: 12, cursor: 'pointer', fontSize: 20,
                          border: emoji === em ? `2px solid ${CORAL}` : '1.5px solid #ede8e0',
                          background: emoji === em ? '#FFF0F0' : '#faf8f4'
                        }}>{em}</button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={submit} disabled={saving || !title.trim()} style={{
                  width: '100%', padding: '15px',
                  background: title.trim() ? CORAL : '#E0D8C8',
                  color: title.trim() ? 'white' : '#AAAAAA',
                  border: 'none', borderRadius: 50, cursor: title.trim() ? 'pointer' : 'default',
                  fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-heebo), sans-serif'
                }}>{saving ? 'שולח...' : 'שלח הצעה להורים 💜'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
