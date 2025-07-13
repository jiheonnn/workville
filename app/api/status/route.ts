import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserStatus } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { status } = body as { status: UserStatus }

    // Validate status
    if (!status || !['working', 'home', 'break'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current user status
    const { data: currentStatus } = await supabase
      .from('user_status')
      .select('status')
      .eq('user_id', user.id)
      .single()

    const previousStatus = currentStatus?.status || 'home'
    const now = new Date().toISOString()

    // Handle work session tracking
    if (previousStatus === 'working' && status !== 'working') {
      // User is ending work session (going home or taking break)
      // Find the open work session
      const { data: openSession } = await supabase
        .from('work_sessions')
        .select('id, check_in_time')
        .eq('user_id', user.id)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single()

      if (openSession) {
        // Calculate duration in minutes
        const checkInTime = new Date(openSession.check_in_time)
        const checkOutTime = new Date(now)
        const durationMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60))

        // Update work session with check-out time and duration
        const { error: sessionError } = await supabase
          .from('work_sessions')
          .update({
            check_out_time: now,
            duration_minutes: durationMinutes
          })
          .eq('id', openSession.id)

        if (sessionError) {
          console.error('Error updating work session:', sessionError)
        }

        // Update total work hours in profile
        const hoursWorked = durationMinutes / 60
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_work_hours')
          .eq('id', user.id)
          .single()

        if (profile) {
          const newTotalHours = (profile.total_work_hours || 0) + hoursWorked
          const newLevel = Math.floor(newTotalHours / 8) + 1

          await supabase
            .from('profiles')
            .update({
              total_work_hours: newTotalHours,
              level: newLevel
            })
            .eq('id', user.id)
        }
      }
    } else if (status === 'working' && previousStatus !== 'working') {
      // User is starting work session
      const { error: sessionError } = await supabase
        .from('work_sessions')
        .insert({
          user_id: user.id,
          check_in_time: now,
          date: now.split('T')[0] // YYYY-MM-DD format
        })

      if (sessionError) {
        console.error('Error creating work session:', sessionError)
      }
    }

    // Update user status
    const { error: statusError } = await supabase
      .from('user_status')
      .update({
        status,
        last_seen: now
      })
      .eq('user_id', user.id)

    if (statusError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      status,
      previousStatus,
      message: `Status changed from ${previousStatus} to ${status}`
    })

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to fetch current status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user status
    const { data: userStatus, error } = await supabase
      .from('user_status')
      .select('status, last_seen')
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
    }

    // Get today's work session if exists
    const today = new Date().toISOString().split('T')[0]
    const { data: todaySession } = await supabase
      .from('work_sessions')
      .select('check_in_time, check_out_time, duration_minutes')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      status: userStatus?.status || 'home',
      lastSeen: userStatus?.last_seen,
      todaySession
    })

  } catch (error) {
    console.error('Status fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}