import { NextRequest, NextResponse } from 'next/server'

import { createApiClient } from '@/lib/supabase/api-client'
import { requireAuthenticatedProfile, requireTeamRole } from '@/lib/team/server-context'

type RouteContext = {
  params: Promise<{ teamId: string; memberId: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createApiClient()
    const { userId } = await requireAuthenticatedProfile(supabase)
    const { teamId, memberId } = await context.params
    const body = await request.json()
    const canManageOwnRecords = body.canManageOwnRecords

    if (typeof canManageOwnRecords !== 'boolean') {
      return NextResponse.json({ error: 'canManageOwnRecords must be boolean' }, { status: 400 })
    }

    await requireTeamRole(supabase, teamId, userId, 'owner')

    const { data: membership, error } = await supabase
      .from('team_members')
      .update({ can_manage_own_records: canManageOwnRecords })
      .eq('id', memberId)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .select()
      .single()

    if (error || !membership) {
      console.error('Error updating record permission:', error)
      return NextResponse.json({ error: '기록 관리 권한 변경에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ membership })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED' || error.message === 'TEAM_ROLE_DENIED') {
        return NextResponse.json({ error: '팀장 권한이 필요합니다.' }, { status: 403 })
      }
    }

    console.error('Record permission update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
