import { NextRequest, NextResponse } from 'next/server'

import { createApiClient } from '@/lib/supabase/api-client'
import { canManageOwnRecords } from '@/lib/team/record-permissions'
import { requireActiveTeam } from '@/lib/team/server-context'
import {
  calculateWorkDurationMinutes,
  validateWorkSessionEditWindow,
} from '@/lib/work-sessions/validation'
import type { TeamMember, WorkSession } from '@/types/database'

type RouteContext = {
  params: Promise<{ sessionId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createApiClient()
    const { userId, activeTeamId } = await requireActiveTeam(supabase)
    const { sessionId } = await context.params
    const body = await request.json()
    const checkInTime = typeof body.checkInTime === 'string' ? body.checkInTime : ''
    const checkOutTime = typeof body.checkOutTime === 'string' ? body.checkOutTime : ''

    if (!checkInTime || !checkOutTime) {
      return NextResponse.json({ error: '출근/퇴근 시간이 필요합니다.' }, { status: 400 })
    }

    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', activeTeamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership || !canManageOwnRecords(membership as TeamMember)) {
      return NextResponse.json({ error: '기록 관리 권한이 필요합니다.' }, { status: 403 })
    }

    const { data: session, error: sessionError } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('team_id', activeTeamId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: '근무 세션을 찾을 수 없습니다.' }, { status: 404 })
    }

    const workSession = session as WorkSession

    if (workSession.user_id !== userId) {
      return NextResponse.json({ error: '자기 근무 기록만 수정할 수 있습니다.' }, { status: 403 })
    }

    const editWindow = validateWorkSessionEditWindow(workSession.date)

    if (!editWindow.ok) {
      return NextResponse.json({ error: '최근 7일 이내 기록만 수정할 수 있습니다.' }, { status: 400 })
    }

    let nextDurationMinutes: number

    try {
      nextDurationMinutes = calculateWorkDurationMinutes({
        checkInTime,
        checkOutTime,
        breakMinutes: workSession.break_minutes || 0,
      })
    } catch (error) {
      return NextResponse.json({ error: '출근/퇴근 시간 범위가 올바르지 않습니다.' }, { status: 400 })
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('work_sessions')
      .update({
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        duration_minutes: nextDurationMinutes,
      })
      .eq('id', workSession.id)
      .eq('team_id', activeTeamId)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError || !updatedSession) {
      console.error('Error updating work session:', updateError)
      return NextResponse.json({ error: '근무시간 수정에 실패했습니다.' }, { status: 500 })
    }

    const { error: auditError } = await supabase
      .from('work_session_edits')
      .insert({
        team_id: activeTeamId,
        work_session_id: workSession.id,
        user_id: userId,
        edited_by: userId,
        previous_check_in_time: workSession.check_in_time,
        previous_check_out_time: workSession.check_out_time,
        previous_duration_minutes: workSession.duration_minutes,
        next_check_in_time: checkInTime,
        next_check_out_time: checkOutTime,
        next_duration_minutes: nextDurationMinutes,
        previous_break_minutes: workSession.break_minutes || 0,
        reason: typeof body.reason === 'string' ? body.reason : null,
      })

    if (auditError) {
      console.error('Error creating work session edit audit:', auditError)
      return NextResponse.json({ error: '수정 이력 저장에 실패했습니다.' }, { status: 500 })
    }

    const { error: profileError } = await refreshUserWorkTotals(supabase, activeTeamId, userId)

    if (profileError) {
      console.error('Error refreshing profile totals:', profileError)
      return NextResponse.json({ error: '누적 근무시간 갱신에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, session: updatedSession })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }
    }

    console.error('Work session edit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function refreshUserWorkTotals(
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  teamId: string,
  userId: string
) {
  const { data: sessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select('duration_minutes')
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (sessionsError) {
    return { error: sessionsError }
  }

  const totalMinutes = (sessions || []).reduce((total, session) => {
    return total + (typeof session.duration_minutes === 'number' ? session.duration_minutes : 0)
  }, 0)
  const totalWorkHours = totalMinutes / 60
  const level = Math.floor(totalWorkHours / 8) + 1

  const { error } = await supabase
    .from('profiles')
    .update({
      total_work_hours: totalWorkHours,
      level,
    })
    .eq('id', userId)

  return { error }
}
