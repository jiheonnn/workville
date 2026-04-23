import { NextRequest, NextResponse } from 'next/server'

import {
  buildMemberStats,
  resolveStatsDateRange,
  type StatsPeriod,
} from '@/lib/stats/calculations'
import { requireActiveTeam } from '@/lib/team/server-context'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId, activeTeamId } = await requireActiveTeam(supabase)

    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'week') as StatsPeriod
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')
    const range = resolveStatsDateRange(period, {
      customStartDate,
      customEndDate,
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
          .eq('team_id', activeTeamId)
          .eq('user_id', userId)
          .gte('date', range.startDateKey)
          .lte('date', range.endDateKey)
          .order('date', { ascending: true }),
      ])

    if (profileError || !profile) {
      console.error('Error fetching personal profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (sessionsError) {
      console.error('Error fetching personal sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    return NextResponse.json(
      buildMemberStats({
        profile,
        sessions: sessions || [],
        range,
        includeLevelProgress: true,
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
    }

    console.error('Personal stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
