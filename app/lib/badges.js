import { supabase } from './supabase'

const CATEGORY_MAP = {
  'learning':  ['Learning', 'Reading', 'English', 'Hebrew'],
  'helping':   ['Helping', 'House'],
  'kindness':  ['Kindness'],
  'creative':  ['Creative', 'Funny'],
  'outdoor':   ['Outdoor'],
  'health':    ['Health'],
  'family':    ['Family', 'Memory', 'Weekend'],
}

export async function checkAndAwardBadges(memberId) {
  // Get all badges not yet earned by this member
  const { data: allBadges } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)

  const { data: earned } = await supabase
    .from('member_badges')
    .select('badge_id')
    .eq('member_id', memberId)

  const earnedIds = new Set((earned || []).map(e => e.badge_id))
  const unearned  = (allBadges || []).filter(b => !earnedIds.has(b.id))
  if (!unearned.length) return []

  // Get member stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', memberId)
    .single()

  const { data: completedAssignments } = await supabase
    .from('assignments')
    .select('*, mission:missions(category)')
    .eq('assigned_to', memberId)
    .eq('status', 'completed')

  const { data: tahkirim } = await supabase
    .from('tahkirim')
    .select('id')
    .eq('created_by', memberId)

  const totalPoints     = profile?.total_points || 0
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
  const newlyEarned = []
  for (const badge of unearned) {
    let earned = false

    if (badge.condition_type === 'total_points') {
      earned = totalPoints >= badge.condition_value
    } else if (badge.condition_type === 'missions_completed') {
      earned = totalMissions >= badge.condition_value
    } else if (badge.condition_type === 'tahkirim') {
      earned = totalTahkirim >= badge.condition_value
    } else if (badge.condition_type === 'category_missions') {
      const groupCount = Object.values(categoryCounts).reduce((sum, count) => {
        // Check if this badge's category matches
        return sum
      }, 0)
      // Match badge category to group
      const count = categoryCounts[badge.category] || 0
      earned = count >= badge.condition_value
    }

    if (earned) {
      await supabase.from('member_badges').insert({
        member_id:  memberId,
        badge_id:   badge.id,
        awarded_at: new Date().toISOString()
      })
      newlyEarned.push(badge)
    }
  }

  return newlyEarned
}