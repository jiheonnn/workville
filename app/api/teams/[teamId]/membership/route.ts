import { NextResponse } from 'next/server'

import { requireAuthenticatedProfile } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createApiClient()
    const { userId, profile } = await requireAuthenticatedProfile(supabase)
    const { teamId } = await context.params

    const { data: myMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membershipError || !myMembership) {
      return NextResponse.json({ error: '팀 멤버십을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (myMembership.role === 'owner') {
      return NextResponse.json({ error: '팀장은 먼저 다른 멤버에게 위임해야 합니다.' }, { status: 409 })
    }

    const { error: leaveError } = await supabase
      .from('team_members')
      .update({ status: 'removed' })
      .eq('id', myMembership.id)

    if (leaveError) {
      return NextResponse.json({ error: '팀 탈퇴에 실패했습니다.' }, { status: 500 })
    }

    if (profile.active_team_id === teamId) {
      const { data: fallbackMemberships } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')

      const nextActiveTeamId = (fallbackMemberships || [])
        .filter((membership) => membership.team_id !== teamId)
        .map((membership) => membership.team_id)[0] || null

      await supabase
        .from('profiles')
        .update({ active_team_id: nextActiveTeamId })
        .eq('id', userId)
    }

    return NextResponse.json({ left: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
