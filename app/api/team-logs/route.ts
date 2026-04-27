import { NextRequest, NextResponse } from 'next/server'

import { requireActiveTeam } from '@/lib/team/server-context'
import { createClient } from '@/lib/supabase/server'
import { canManageOwnRecords } from '@/lib/team/record-permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId: currentUserId, activeTeamId } = await requireActiveTeam(supabase)

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const { data: memberships, error: membershipsError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', activeTeamId)
      .eq('status', 'active')

    if (membershipsError) {
      console.error('Error fetching team memberships:', membershipsError)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    const memberIds = (memberships || []).map((membership) => membership.user_id)
    const currentMembership = (memberships || []).find(
      (membership) => membership.user_id === currentUserId
    )
    const currentUserCanManageOwnRecords = currentMembership
      ? canManageOwnRecords(currentMembership as any)
      : false

    if (memberIds.length === 0) {
      return NextResponse.json({
        logs: [],
        users: [],
        pagination: { total: 0, limit, offset },
      })
    }

    let query = supabase
      .from('work_logs')
      .select('*', { count: 'exact' })
      .eq('team_id', activeTeamId)
      .in('user_id', memberIds)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

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

    const logUserIds = [...new Set((logs || []).map((log) => log.user_id))]
    const logDates = [...new Set((logs || []).map((log) => log.date))]

    const [{ data: profiles, error: profilesError }, { data: sessions, error: sessionsError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, character_type')
          .in('id', memberIds)
          .order('username'),
        logUserIds.length > 0 && logDates.length > 0
          ? supabase
              .from('work_sessions')
              .select('id, team_id, user_id, date, check_in_time, check_out_time, duration_minutes, break_minutes')
              .eq('team_id', activeTeamId)
              .in('user_id', logUserIds)
              .in('date', logDates)
              .order('check_in_time', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
      ])

    if (profilesError || sessionsError) {
      console.error('Error fetching related team log data:', profilesError || sessionsError)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]))
    const sessionMap = new Map<string, Array<Record<string, unknown>>>()

    ;(sessions || []).forEach((session) => {
      const key = `${session.user_id}-${session.date}`
      const existingSessions = sessionMap.get(key) || []
      existingSessions.push(session as Record<string, unknown>)
      sessionMap.set(key, existingSessions)
    })

    const transformedLogs = (logs || []).map((log) => {
      const key = `${log.user_id}-${log.date}`
      const workSessions = sessionMap.get(key) || []
      const profile = profileMap.get(log.user_id)
      const firstSession = workSessions[0] as { check_in_time: string | null } | undefined
      const lastCheckoutTime = workSessions.reduce<string | null>((latest, session) => {
        const current = typeof session.check_out_time === 'string' ? session.check_out_time : null
        if (!current) {
          return latest
        }
        if (!latest || current > latest) {
          return current
        }
        return latest
      }, null)

      return {
        ...log,
        profiles: profile
          ? {
              id: profile.id,
              username: profile.username,
              character_type: profile.character_type,
            }
          : null,
        work_sessions: workSessions,
        start_time: firstSession?.check_in_time || null,
        end_time: lastCheckoutTime,
      }
    })

    return NextResponse.json({
      logs: transformedLogs,
      users: profiles || [],
      currentUserId,
      canManageOwnRecords: currentUserCanManageOwnRecords,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }
    }

    console.error('Team logs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
