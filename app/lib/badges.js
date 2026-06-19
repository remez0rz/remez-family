import { supabase } from './supabase'

const CATEGORY_MAP = {
  'learning':  ['Learning', 'Reading', 'English', 'Hebrew'],
  'helping':   ['Helping', 'House', 'Daily'],
  'kindness':  ['Kindness'],
  'creative':  ['Creative', 'Funny'],
  'outdoor':   ['Outdoor'],
  'health':    ['Health'],
  'family':    ['Family', 'Memory', 'Weekend'],
}

export async function checkAndAwardBadges(memberId) {
  // The active badge list and what this member already earned are independent —
  // fetch them together.
  const [{ data: allBadges }, { data: earned }] = await Promise.all([
    supabase.from('badges').select('*').eq('is_active', true),
    supabase.from('member_badges').select('badge_id').eq('member_id', memberId),
  ])

  const earnedIds = new Set((earned || []).map(e => e.badge_id))
  const unearned  = (allBadges || []).filter(b => !earnedIds.has(b.id))
  if (!unearned.length) return []

  // The three stat queries are independent of each other — run in parallel.
  const [{ data: profile }, { data: completedAssignments }, { data: tahkirim }] = await Promise.all([
    supabase.from('profiles').select('total_experience, total_points').eq('id', memberId).single(),
    supabase.from('assignments').select('*, mission:missions(category)').eq('assigned_to', memberId).eq('status', 'completed'),
    supabase.from('tahkirim').select('id').eq('created_by', memberId),
  ])

  // Use total_experience (lifetime XP) for point-based badges — not deductable balance
  const totalPoints     = profile?.total_experience || profile?.total_points || 0
  const totalMissions   = completedAssignments?.length || 0
  const totalTahkirim   = tahkirim?.length || 0

  // Count by category group
  const categoryCounts = {}
  ;(completedAssignments || []).forEach(a => {
    const cat = a.mission?.category
    if (!cat) return
    Object.entries(CATEGORY_MAP).forEach(([group, cats]) => {
      if (cats.includes(cat)) {
        categoryCounts[group] = (categoryCounts[group] || 0) + 1
      }
    })
  })

  // Check each unearned badge
  const qualifies = (badge) => {
    if (badge.condition_type === 'total_points')      return totalPoints   >= badge.condition_value
    if (badge.condition_type === 'missions_completed') return totalMissions >= badge.condition_value
    if (badge.condition_type === 'tahkirim')           return totalTahkirim >= badge.condition_value
    if (badge.condition_type === 'category_missions')  return (categoryCounts[badge.category?.toLowerCase()] || 0) >= badge.condition_value
    return false
  }

  // Insert all qualifying badges concurrently. We still check each insert: RLS or
  // a race can reject one, and we only celebrate a badge that actually persisted —
  // otherwise we'd "re-award" it on every completion.
  const results = await Promise.all(
    unearned.filter(qualifies).map(async (badge) => {
      const { error } = await supabase.from('member_badges').insert({
        member_id:  memberId,
        badge_id:   badge.id,
        awarded_at: new Date().toISOString()
      })
      if (error) {
        console.error('Failed to award badge', badge.id, error.message)
        return null
      }
      return badge
    })
  )

  return results.filter(Boolean)
}