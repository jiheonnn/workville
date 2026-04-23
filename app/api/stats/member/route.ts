import { NextResponse } from 'next/server'

import {
  buildMemberStats,
  resolveStatsDateRange,
  type StatsPeriod,
} from '@/lib/stats/calculations'
import { requireActiveMembership, requireActiveTeam } from '@/lib/team/server-context'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberUserId = searchParams.get('userId')
    const period = searchParams.get('period') || 'week'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (!memberUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { userId, activeTeamId } = await requireActiveTeam(supabase)
    await requireActiveMembership(supabase, activeTeamId, memberUserId)

    const range = resolveStatsDateRange(period as StatsPeriod, {
      customStartDate: startDateParam,
      customEndDate: endDateParam,
    })

    const [{ data: profile, error: profileError }, { data: sessions, error: sessionsError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, character_type, level, total_work_hours')
          .eq('id', memberUserId)
          .single(),
        supabase
          .from('work_sessions')
          .select('user_id, date, check_in_time, check_out_time, duration_minutes')
          .eq('team_id', activeTeamId)
          .eq('user_id', memberUserId)
          .gte('date', range.startDateKey)
          .lte('date', range.endDateKey)
          .order('date', { ascending: true }),
      ])

    if (profileError || !profile) {
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
        includeLevelProgress: userId === memberUserId,
      })
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED') {
        return NextResponse.json({ error: '해당 팀원 통계에 접근할 수 없습니다.' }, { status: 403 })
      }
    }

    console.error('Error in member stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
