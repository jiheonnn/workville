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

    // Fetch work session data for each log
    const logsWithSessions = logs ? await Promise.all(logs.map(async (log) => {
      const { data: sessions } = await supabase
        .from('work_sessions')
        .select('check_in_time, check_out_time, duration_minutes')
        .eq('user_id', log.user_id)
        .eq('date', log.date)
        .order('check_in_time', { ascending: true })

      return {
        ...log,
        work_sessions: sessions || [],
        // Keep legacy fields for backward compatibility
        start_time: sessions && sessions.length > 0 ? sessions[0].check_in_time : null,
        end_time: sessions && sessions.length > 0 ? 
          sessions.reduce((latest, current) => {
            return current.check_out_time > latest ? current.check_out_time : latest;
          }, sessions[0].check_out_time) : null,
      }
    })) : []

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