import { NextResponse } from 'next/server'

import { requireAuthenticatedProfile, requireTeamRole } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export async function PUT(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createApiClient()
    const { userId } = await requireAuthenticatedProfile(supabase)
    const { teamId } = await context.params
    await requireTeamRole(supabase, teamId, userId, 'owner')

    const body = await request.json()
    const nextOwnerUserId = typeof body.userId === 'string' ? body.userId : ''

    if (!nextOwnerUserId) {
      return NextResponse.json({ error: '새 팀장 userId가 필요합니다.' }, { status: 400 })
    }

    if (nextOwnerUserId === userId) {
      return NextResponse.json({ error: '이미 현재 팀장입니다.' }, { status: 400 })
    }

    const { data: nextOwnerMembership, error: nextOwnerError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', nextOwnerUserId)
      .eq('status', 'active')
      .single()

    if (nextOwnerError || !nextOwnerMembership) {
      return NextResponse.json({ error: '같은 팀의 활성 멤버에게만 위임할 수 있습니다.' }, { status: 404 })
    }

    const { error: transferError } = await supabase.rpc('transfer_team_owner', {
      target_team_id: teamId,
      current_owner_user_id: userId,
      next_owner_user_id: nextOwnerUserId,
    })

    if (transferError) {
      return NextResponse.json({ error: '팀장 위임에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ ownerUserId: nextOwnerUserId })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED' || error.message === 'TEAM_ROLE_DENIED') {
        return NextResponse.json({ error: '현재 팀장만 위임할 수 있습니다.' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
