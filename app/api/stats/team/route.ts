import { NextRequest, NextResponse } from 'next/server'
import {
  buildLeaderboardStats,
  resolveStatsDateRange,
  type StatsPeriod,
} from '@/lib/stats/calculations'
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
    const period = (searchParams.get('period') || 'week') as StatsPeriod
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')
    const range = resolveStatsDateRange(period, {
      customStartDate,
      customEndDate,
    })

    const [{ data: profiles, error: profilesError }, { data: sessions, error: sessionsError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, character_type, level')
          .order('username'),
        supabase
          .from('work_sessions')
          .select('user_id, date, check_in_time, check_out_time, duration_minutes')
          .gte('date', range.startDateKey)
          .lte('date', range.endDateKey),
      ])

    if (profilesError) {
      console.error('Error fetching team profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch team profiles' }, { status: 500 })
    }

    if (sessionsError) {
      console.error('Error fetching team sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch team statistics' }, { status: 500 })
    }

    return NextResponse.json(
      buildLeaderboardStats({
        currentUserId: user.id,
        profiles: profiles || [],
        sessions: sessions || [],
        range,
      })
    )

  } catch (error) {
    console.error('Team stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
