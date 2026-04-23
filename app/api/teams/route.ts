import { NextResponse } from 'next/server'

import { requireAuthenticatedProfile } from '@/lib/team/server-context'
import { DEFAULT_TEAM_TEMPLATE_CONTENT } from '@/lib/team/normalization'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET() {
  try {
    const supabase = await createApiClient()
    const { userId, profile } = await requireAuthenticatedProfile(supabase)

    const { data: memberships, error: membershipsError } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (membershipsError) {
      return NextResponse.json({ error: '팀 목록을 불러오지 못했습니다.' }, { status: 500 })
    }

    const membershipByTeamId = new Map(
      (memberships || []).map((membership) => [membership.team_id, membership])
    )
    const teamIds = [...membershipByTeamId.keys()]

    if (teamIds.length === 0) {
      return NextResponse.json({
        teams: [],
        activeTeamId: profile.active_team_id,
      })
    }

    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds)

    if (teamsError) {
      return NextResponse.json({ error: '팀 목록을 불러오지 못했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      teams: (teams || [])
        .sort((left, right) => left.name.localeCompare(right.name, 'ko'))
        .map((team) => ({
          ...team,
          role: membershipByTeamId.get(team.id)?.role || 'member',
        })),
      activeTeamId: profile.active_team_id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createApiClient()
    const { userId } = await requireAuthenticatedProfile(supabase)
    const body = await request.json()
    const rawName = typeof body.name === 'string' ? body.name.trim() : ''

    if (!rawName) {
      return NextResponse.json({ error: '팀 이름이 필요합니다.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const teamId = crypto.randomUUID()
    const team = {
      id: teamId,
      name: rawName,
      created_by: userId,
      created_at: now,
    }

    const { error: teamError } = await supabase
      .from('teams')
      .insert(team)

    if (teamError) {
      return NextResponse.json({ error: '팀 생성에 실패했습니다.' }, { status: 500 })
    }

    const { error: membershipError } = await supabase
      .from('team_members')
      .insert({
        id: crypto.randomUUID(),
        team_id: teamId,
        user_id: userId,
        role: 'owner',
        status: 'active',
        joined_at: now,
        created_at: now,
      })

    if (membershipError) {
      return NextResponse.json({ error: '팀 멤버 생성에 실패했습니다.' }, { status: 500 })
    }

    const { error: templateError } = await supabase
      .from('work_log_template')
      .insert({
        id: crypto.randomUUID(),
        team_id: teamId,
        content: DEFAULT_TEAM_TEMPLATE_CONTENT,
        updated_at: now,
        updated_by: userId,
      })

    if (templateError) {
      return NextResponse.json({ error: '팀 템플릿 생성에 실패했습니다.' }, { status: 500 })
    }

    const { error: statusError } = await supabase
      .from('user_status')
      .insert({
        id: crypto.randomUUID(),
        team_id: teamId,
        user_id: userId,
        status: 'home',
        last_updated: now,
      })

    if (statusError) {
      return NextResponse.json({ error: '초기 팀 상태 생성에 실패했습니다.' }, { status: 500 })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        active_team_id: teamId,
      })
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json({ error: '활성 팀 설정에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
