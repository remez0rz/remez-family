import { supabase } from './supabase'

const BIRTHDAY_MISSION_ID = 'b981f5ae-754c-4488-b125-00c504a2d746'
const BIRTHDAY_POINTS = 1000

export async function checkAndAwardBirthdayBonus(member) {
  if (!member.birthday) return false

  const today = new Date()
  const birthday = new Date(member.birthday)

  // Check if today is their birthday
  if (
    today.getDate() !== birthday.getDate() ||
    today.getMonth() !== birthday.getMonth()
  ) return false

  // Check if already awarded this year
  const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString()
  const { data: existing } = await supabase
    .from('assignments')
    .select('id')
    .eq('mission_id', BIRTHDAY_MISSION_ID)
    .eq('assigned_to', member.id)
    .eq('status', 'completed')
    .gte('completed_at', startOfYear)
    .limit(1)

  if (existing?.length > 0) return false

  // Award it
  const { data: assignment } = await supabase
    .from('assignments')
    .insert({
      mission_id: BIRTHDAY_MISSION_ID,
      assigned_to: member.id,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (!assignment) return false

  // Atomic award (ledger + total + XP + level in one transaction).
  await supabase.rpc('apply_points', {
    p_member_id: member.id,
    p_points: BIRTHDAY_POINTS,
    p_reason: 'יום הולדת שמח! 🎂',
    p_assignment_id: assignment.id,
  })

  // This one DOES go to feed — birthday is worth celebrating
  await supabase.from('feed_posts').insert({
    type: 'mission_completed',
    title: `🎂 יום הולדת שמח ${member.name}!`,
    content: `+${BIRTHDAY_POINTS} נקודות מתנה ליום ההולדת ❤️`,
    participants: [member.name],
    linked_type: 'assignment',
    linked_id: assignment.id,
    created_by: member.id
  })

  return true
}