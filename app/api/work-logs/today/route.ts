import { NextRequest, NextResponse } from 'next/server'

import { requireActiveTeam } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'
import { getTodayKorea } from '@/lib/utils/date'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { userId, activeTeamId } = await requireActiveTeam(supabase)

    // Get query params
    const { searchParams } = new URL(request.url)
    const requestedDate = searchParams.get('date')
    
    const [{ data: activeSession }, { data: lastSession }] = await Promise.all([
      supabase
        .from('work_sessions')
        .select('*')
        .eq('team_id', activeTeamId)
        .eq('user_id', userId)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('work_sessions')
        .select('*')
        .eq('team_id', activeTeamId)
        .eq('user_id', userId)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single(),
    ])

    // 이유:
    // 업무일지와 근무 세션은 이미 KST 기준 date 컬럼을 함께 저장합니다.
    // check_in_time을 다시 서버 시간대로 계산하면 자정 경계에서 다른 날짜를 볼 수 있으므로,
    // 읽기 기준도 date 컬럼 하나로 통일합니다.
    const sessionDate = activeSession?.date || lastSession?.date || null
    const targetDate = requestedDate || sessionDate || getTodayKorea()

    const { data: logs } = await supabase
      .from('work_logs')
      .select('*')
      .eq('team_id', activeTeamId)
      .eq('user_id', userId)
      .eq('date', targetDate)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)

    let workLog = logs && logs.length > 0 ? logs[0] : null

    // If no work log exists, return empty structure
    if (!workLog) {
      workLog = {
        team_id: activeTeamId,
        date: targetDate,
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
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }
    }

    console.error('Work log today fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
