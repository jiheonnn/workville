import { NextResponse } from 'next/server'
import {
  buildMemberStats,
  resolveStatsDateRange,
  type StatsPeriod,
} from '@/lib/stats/calculations'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'week'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const range = resolveStatsDateRange(period as StatsPeriod, {
      customStartDate: startDateParam,
      customEndDate: endDateParam,
    })

    const [{ data: profile, error: profileError }, { data: sessions, error: sessionsError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, character_type, level, total_work_hours')
          .eq('id', userId)
          .single(),
        supabase
          .from('work_sessions')
          .select('user_id, date, check_in_time, check_out_time, duration_minutes')
          .eq('user_id', userId)
          .gte('date', range.startDateKey)
          .lte('date', range.endDateKey)
          .order('date', { ascending: true }),
      ])

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch work sessions' }, { status: 500 })
    }

    return NextResponse.json(
      buildMemberStats({
        profile,
        sessions: sessions || [],
        range,
        includeLevelProgress: user.id === userId,
      })
    )
  } catch (error) {
    console.error('Error in member stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
