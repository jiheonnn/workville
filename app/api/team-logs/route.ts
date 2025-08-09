import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query to fetch logs with user information
    let query = supabase
      .from('work_logs')
      .select(`
        id,
        date,
        content,
        todos,
        completed_todos,
        roi_high,
        roi_low,
        tomorrow_priority,
        feedback,
        created_at,
        user_id,
        profiles (
          id,
          username,
          character_type
        )
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching team logs:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // Batch fetch work sessions for all logs at once
    let logsWithSessions = logs || []
    
    if (logs && logs.length > 0) {
      // Extract unique user-date pairs
      const userDatePairs = logs.map(log => ({
        user_id: log.user_id,
        date: log.date
      }))
      
      // Build a query to fetch all sessions at once
      const userIds = [...new Set(logs.map(log => log.user_id))]
      const dates = [...new Set(logs.map(log => log.date))]
      
      // Fetch all sessions in one query
      const { data: allSessions } = await supabase
        .from('work_sessions')
        .select('user_id, date, check_in_time, check_out_time, duration_minutes')
        .in('user_id', userIds)
        .in('date', dates)
        .order('check_in_time', { ascending: true })
      
      // Group sessions by user_id and date for quick lookup
      const sessionMap = new Map()
      allSessions?.forEach(session => {
        const key = `${session.user_id}-${session.date}`
        if (!sessionMap.has(key)) {
          sessionMap.set(key, [])
        }
        sessionMap.get(key).push(session)
      })
      
      // Map sessions to logs
      logsWithSessions = logs.map(log => {
        const key = `${log.user_id}-${log.date}`
        const sessions = sessionMap.get(key) || []
        
        return {
          ...log,
          work_sessions: sessions,
          // Keep legacy fields for backward compatibility
          start_time: sessions.length > 0 ? sessions[0].check_in_time : null,
          end_time: sessions.length > 0 ? 
            sessions.reduce((latest: any, current: any) => {
              return current.check_out_time > latest ? current.check_out_time : latest;
            }, sessions[0].check_out_time) : null,
        }
      })
    }

    // Get list of all users for filtering
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, username, character_type')
      .order('username')

    // Transform character_type to string format
    const transformedLogs = logsWithSessions?.map(log => {
      const profile = log.profiles as any
      if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
        return {
          ...log,
          profiles: {
            id: profile.id,
            username: profile.username,
            character_type: `character${profile.character_type}`
          }
        }
      }
      return log
    })

    const transformedUsers = usersData?.map(user => ({
      ...user,
      character_type: `character${user.character_type}`
    }))

    return NextResponse.json({ 
      logs: transformedLogs || [],
      users: transformedUsers || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Team logs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}