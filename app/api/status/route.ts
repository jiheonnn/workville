import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserStatus } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('API Status POST - User:', user?.id)
    console.log('API Status POST - Auth Error:', authError)
    
    if (authError || !user) {
      console.log('API Status POST - Unauthorized')
      return NextResponse.json({ error: 'Unauthorized', authError: authError?.message }, { status: 401 })
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
    if (previousStatus === 'working' && status === 'home') {
      // User is ending work session (going home only, not break)
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
          console.error('Error updating work session - Full details:', sessionError)
          console.error('Error updating work session - Message:', sessionError.message)
          console.error('Error updating work session - Code:', sessionError.code)
          console.error('Error updating work session - Details:', sessionError.details)
          console.error('Error updating work session - Hint:', sessionError.hint)
          // Don't return here, continue with status update
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

          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              total_work_hours: newTotalHours,
              level: newLevel
            })
            .eq('id', user.id)

          if (profileError) {
            console.error('Error updating profile - Full details:', profileError)
            console.error('Error updating profile - Message:', profileError.message)
            console.error('Error updating profile - Code:', profileError.code)
            console.error('Error updating profile - Details:', profileError.details)
            console.error('Error updating profile - Hint:', profileError.hint)
          }
        }
      }
    } else if (status === 'working' && previousStatus === 'home') {
      // User is starting work session from home (not from break)
      // Always create a new session when coming from home
      const today = now.split('T')[0]
      const { error: sessionError } = await supabase
        .from('work_sessions')
        .insert({
          user_id: user.id,
          check_in_time: now,
          date: today // YYYY-MM-DD format
        })

      if (sessionError) {
        console.error('Error creating work session - Full details:', sessionError)
        console.error('Error creating work session - Message:', sessionError.message)
        console.error('Error creating work session - Code:', sessionError.code)
        console.error('Error creating work session - Details:', sessionError.details)
        console.error('Error creating work session - Hint:', sessionError.hint)
        // Don't return here, continue with status update
      }
    }
    // If coming from break, don't create a new session (keep the existing one)

    // First check if user status exists
    const { data: existingStatus } = await supabase
      .from('user_status')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    let statusError
    if (existingStatus) {
      // Update existing status
      const { error } = await supabase
        .from('user_status')
        .update({
          status,
          last_updated: now
        })
        .eq('user_id', user.id)
      statusError = error
    } else {
      // Insert new status
      const { error } = await supabase
        .from('user_status')
        .insert({
          user_id: user.id,
          status,
          last_updated: now
        })
      statusError = error
    }

    if (statusError) {
      console.error('Status update error - Full details:', statusError)
      console.error('Status update error - Message:', statusError.message)
      console.error('Status update error - Code:', statusError.code)
      console.error('Status update error - Details:', statusError.details)
      console.error('Status update error - Hint:', statusError.hint)
      return NextResponse.json({ 
        error: 'Failed to update status', 
        details: statusError.message,
        code: statusError.code 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      status,
      previousStatus,
      message: `Status changed from ${previousStatus} to ${status}`
    })

  } catch (error) {
    console.error('API Status POST - Catch block error:', error)
    console.error('Error type:', typeof error)
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to fetch current status
export async function GET(request: NextRequest) {
  try {
    console.log('API Status GET - Creating Supabase client...')
    const supabase = await createClient()
    
    console.log('API Status GET - Getting user...')
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('API Status GET - User:', user?.id)
    console.log('API Status GET - Auth Error:', authError)
    
    if (authError || !user) {
      console.log('API Status GET - Unauthorized')
      return NextResponse.json({ error: 'Unauthorized', authError: authError?.message }, { status: 401 })
    }

    // Get user status
    const { data: userStatus, error } = await supabase
      .from('user_status')
      .select('status, last_updated')
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
    }

    // Get all today's work sessions
    const today = new Date().toISOString().split('T')[0]
    const { data: todaySessions } = await supabase
      .from('work_sessions')
      .select('check_in_time, check_out_time, duration_minutes')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('check_in_time', { ascending: true })

    // Calculate total duration for today
    let totalDurationMinutes = 0
    if (todaySessions) {
      todaySessions.forEach(session => {
        if (session.duration_minutes) {
          totalDurationMinutes += session.duration_minutes
        } else if (session.check_in_time && !session.check_out_time) {
          // Active session - calculate current duration
          const checkInTime = new Date(session.check_in_time)
          const currentTime = new Date()
          const currentDuration = Math.floor((currentTime.getTime() - checkInTime.getTime()) / (1000 * 60))
          totalDurationMinutes += currentDuration
        }
      })
    }

    return NextResponse.json({
      status: userStatus?.status || 'home',
      lastUpdated: userStatus?.last_updated,
      todaySessions,
      totalDurationMinutes
    })

  } catch (error) {
    console.error('Status fetch error:', error)
    console.error('Error type:', typeof error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}