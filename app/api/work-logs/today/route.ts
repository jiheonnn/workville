import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { getTodayKorea } from '@/lib/utils/date'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const requestedDate = searchParams.get('date')
    
    // Parallel fetch: session data and work logs
    const [sessionResult, logsResult] = await Promise.allSettled([
      // Get active session and last session
      Promise.all([
        supabase
          .from('work_sessions')
          .select('*')
          .eq('user_id', user.id)
          .is('check_out_time', null)
          .order('check_in_time', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('work_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('check_in_time', { ascending: false })
          .limit(1)
          .single()
      ]),
      // Get work log for the date
      supabase
        .from('work_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', requestedDate || getTodayKorea())
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
    ])

    // Process session results
    let activeSession = null
    let lastSession = null
    let sessionDate = null
    
    if (sessionResult.status === 'fulfilled') {
      const [activeResult, lastResult] = sessionResult.value
      activeSession = activeResult.data
      lastSession = lastResult.data
      
      // Determine the date to use based on session
      if (activeSession) {
        // Active session - use check-in date
        const checkInDate = new Date(activeSession.check_in_time)
        sessionDate = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`
      } else if (lastSession) {
        // No active session but has last session
        const lastCheckInDate = new Date(lastSession.check_in_time)
        sessionDate = `${lastCheckInDate.getFullYear()}-${String(lastCheckInDate.getMonth() + 1).padStart(2, '0')}-${String(lastCheckInDate.getDate()).padStart(2, '0')}`
      }
    }

    // Process work log results
    let workLog = null
    if (logsResult.status === 'fulfilled') {
      const logs = logsResult.value.data
      if (logs && logs.length > 0) {
        workLog = logs[0]
      }
    }

    // If no work log exists, return empty structure
    if (!workLog) {
      workLog = {
        date: requestedDate || sessionDate || getTodayKorea(),
        todos: [],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
        content: ''
      }
    }

    return NextResponse.json({
      session: {
        active: activeSession,
        last: lastSession,
        date: sessionDate
      },
      workLog
    })

  } catch (error) {
    console.error('Work log today fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}