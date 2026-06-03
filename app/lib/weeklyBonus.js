import { supabase } from './supabase'

const WEEKLY_BONUS_MISSION_ID = 'c4005842-b744-41e4-a460-552257bbcb07'
const WEEKLY_BONUS_POINTS = 50

function getLastSunday() {
  const sunday = new Date()
  sunday.setDate(sunday.getDate() - sunday.getDay())
  sunday.setHours(0, 0, 0, 0)
  return sunday
}

export async function checkAndAwardWeeklyBonus(memberId) {
  const lastSunday = getLastSunday()

  const { data: existing } = await supabase
    .from('assignments')
    .select('id')
    .eq('mission_id', WEEKLY_BONUS_MISSION_ID)
    .eq('assigned_to', memberId)
    .eq('status', 'completed')
    .gte('completed_at', lastSunday.toISOString())
    .limit(1)

  if (existing?.length > 0) return false

  const { data: assignment } = await supabase
    .from('assignments')
    .insert({
      mission_id: WEEKLY_BONUS_MISSION_ID,
      assigned_to: memberId,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (!assignment) return false

  await supabase.from('point_events').insert({
    member_id: memberId,
    points: WEEKLY_BONUS_POINTS,
    reason: 'בונוס שבועי — אנחנו אוהבים אותך ❤️',
    assignment_id: assignment.id
  })

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', memberId)
    .single()

  const newTotal = (profile?.total_points || 0) + WEEKLY_BONUS_POINTS
  await supabase.from('profiles').update({ total_points: newTotal }).eq('id', memberId)

  return true
}