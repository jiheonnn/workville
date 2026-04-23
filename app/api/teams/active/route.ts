import { NextResponse } from 'next/server'

import { requireActiveMembership, requireAuthenticatedProfile } from '@/lib/team/server-context'
import { shouldBlockTeamSwitch } from '@/lib/team/normalization'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET() {
  try {
    const supabase = await createApiClient()
    const { profile } = await requireAuthenticatedProfile(supabase)

    return NextResponse.json({
      activeTeamId: profile.active_team_id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createApiClient()
    const { userId, profile } = await requireAuthenticatedProfile(supabase)
    const body = await request.json()
    const teamId = typeof body.teamId === 'string' ? body.teamId : ''

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    await requireActiveMembership(supabase, teamId, userId)

    let openSession = null

    if (profile.active_team_id) {
      const { data: activeTeamOpenSession } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('team_id', profile.active_team_id)
        .eq('user_id', userId)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single()

      openSession = activeTeamOpenSession
    }

    if (shouldBlockTeamSwitch(openSession)) {
      return NextResponse.json(
        { error: '진행 중인 근무 세션이 있으면 팀을 전환할 수 없습니다.' },
        { status: 409 }
      )
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        active_team_id: teamId,
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: '활성 팀 변경에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ activeTeamId: teamId })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED') {
        return NextResponse.json({ error: '해당 팀에 접근할 수 없습니다.' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
