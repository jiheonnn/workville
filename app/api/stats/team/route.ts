import { NextRequest, NextResponse } from 'next/server'

import {
  buildLeaderboardStats,
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

    const { data: memberships, error: membershipsError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', activeTeamId)
      .eq('status', 'active')

    if (membershipsError) {
      console.error('Error fetching team memberships:', membershipsError)
      return NextResponse.json({ error: 'Failed to fetch team profiles' }, { status: 500 })
    }

    const memberIds = (memberships || []).map((membership) => membership.user_id)

    const [{ data: profiles, error: profilesError }, { data: sessions, error: sessionsError }] =
      await Promise.all([
        memberIds.length > 0
          ? supabase
              .from('profiles')
              .select('id, username, character_type, level')
              .in('id', memberIds)
              .order('username')
          : Promise.resolve({ data: [], error: null }),
        memberIds.length > 0
          ? supabase
              .from('work_sessions')
              .select('user_id, date, check_in_time, check_out_time, duration_minutes')
              .eq('team_id', activeTeamId)
              .in('user_id', memberIds)
              .gte('date', range.startDateKey)
              .lte('date', range.endDateKey)
          : Promise.resolve({ data: [], error: null }),
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
        currentUserId: userId,
        profiles: profiles || [],
        sessions: sessions || [],
        range,
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

    console.error('Team stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
