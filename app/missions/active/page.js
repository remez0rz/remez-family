'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ActiveMissionsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadAssignments()
    })
  }, [])

  const loadAssignments = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        mission:missions(*),
        member:profiles!assignments_assigned_to_fkey(*)
      `)
      .in('status', ['active', 'submitted'])
      .order('created_at', { ascending: false })

    if (data) setAssignments(data)
    setLoading(false)
  }

  const completeAssignment = async (assignment) => {
    const confirmed = confirm(`Mark "${assignment.mission.title}" as complete for ${assignment.member.name}?`)
    if (!confirmed) return

    const isResponsibility = assignment.mission.type === 'responsibility'

    if (isResponsibility) {
      const { error } = await supabase
        .from('assignments')
        .update({ status: 'submitted' })
        .eq('id', assignment.id)
      if (!error) {
        alert('Submitted for parent approval.')
        loadAssignments()
      }
    } else {
      await approveAndAward(assignment)
    }
  }

  const approveAndAward = async (assignment) => {
    const points = assignment.mission.points

    const { error: assignError } = await supabase
      .from('assignments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', assignment.id)

    const { error: pointError } = await supabase
      .from('point_events')
      .insert({
        member_id: assignment.assigned_to,
        points: points,
        reason: `Completed: ${assignment.mission.title}`,
        assignment_id: assignment.id
      })

    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', assignment.assigned_to)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ total_points: profile.total_points + points })
        .eq('id', assignment.assigned_to)
    }

    await supabase.from('feed_posts').insert({
      type: 'mission_completed',
      title: `${assignment.member.name} completed: ${assignment.mission.title}`,
      content: `+${points} points earned`,
      participants: [assignment.member.name],
      linked_type: 'assignment',
      linked_id: assignment.id
    })

    alert(`Mission complete! +${points} points awarded to ${assignment.member.name}`)
    loadAssignments()
  }

  const approveSubmitted = async (assignment) => {
    await approveAndAward(assignment)
  }

  const statusColor = { active: '#4285f4', submitted: '#fbbc04' }
  const statusLabel = { active: 'Active', submitted: 'Waiting approval' }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Active Missions</h1>
        <a href="/missions" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>← Missions</a>
      </div>

      {loading && <p style={{ color: '#999', textAlign: 'center' }}>Loading...</p>}

      {!loading && assignments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          <p>No active missions.</p>
          <a href="/missions" style={{ color: '#4285f4' }}>Assign a mission →</a>
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {assignments.map(assignment => (
          <div key={assignment.id} style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: '14px',
            padding: '1rem',
            borderLeft: `4px solid ${statusColor[assignment.status] || '#ccc'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{assignment.mission.title}</div>
              <div style={{ fontWeight: '700', color: '#4285f4' }}>+{assignment.mission.points} pts</div>
            </div>

            <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {assignment.member.name} · <span style={{ color: statusColor[assignment.status] }}>{statusLabel[assignment.status]}</span>
            </div>

            {assignment.status === 'active' && (
              <button
                onClick={() => completeAssignment(assignment)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#34a853',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ✓ Mark Complete
              </button>
            )}

            {assignment.status === 'submitted' && (
              <button
                onClick={() => approveSubmitted(assignment)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#fbbc04',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ✓ Approve and Award Points
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}