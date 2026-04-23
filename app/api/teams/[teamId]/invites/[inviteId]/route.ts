import { NextResponse } from 'next/server'

import { requireAuthenticatedProfile, requireTeamRole } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ teamId: string; inviteId: string }> }
) {
  try {
    const supabase = await createApiClient()
    const { userId } = await requireAuthenticatedProfile(supabase)
    const { teamId, inviteId } = await context.params

    await requireTeamRole(supabase, teamId, userId, 'owner')

    const { error } = await supabase
      .from('team_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId)
      .eq('team_id', teamId)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json({ error: '초대 취소에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ cancelled: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED' || error.message === 'TEAM_ROLE_DENIED') {
        return NextResponse.json({ error: '팀장만 초대를 취소할 수 있습니다.' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
