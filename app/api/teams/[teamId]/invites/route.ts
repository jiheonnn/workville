import { NextResponse } from 'next/server'

import {
  countActiveMembers,
  normalizeInviteEmail,
} from '@/lib/team/normalization'
import { requireAuthenticatedProfile, requireTeamRole } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createApiClient()
    const { userId } = await requireAuthenticatedProfile(supabase)
    const { teamId } = await context.params

    await requireTeamRole(supabase, teamId, userId, 'owner')

    const { data: invites, error } = await supabase
      .from('team_invites')
      .select('*')
      .eq('team_id', teamId)

    if (error) {
      return NextResponse.json({ error: '초대 목록을 불러오지 못했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      invites: (invites || []).sort((left, right) => right.created_at.localeCompare(left.created_at)),
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED' || error.message === 'TEAM_ROLE_DENIED') {
        return NextResponse.json({ error: '팀장만 초대 목록을 볼 수 있습니다.' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const supabase = await createApiClient()
    const { userId } = await requireAuthenticatedProfile(supabase)
    const { teamId } = await context.params
    await requireTeamRole(supabase, teamId, userId, 'owner')

    const body = await request.json()
    const normalizedEmail = typeof body.email === 'string'
      ? normalizeInviteEmail(body.email)
      : ''

    if (!normalizedEmail) {
      return NextResponse.json({ error: '초대 이메일이 필요합니다.' }, { status: 400 })
    }

    const [{ data: members, error: membersError }, { data: invites, error: invitesError }] =
      await Promise.all([
        supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .eq('status', 'active'),
        supabase
          .from('team_invites')
          .select('*')
          .eq('team_id', teamId)
          .eq('status', 'pending'),
      ])

    if (membersError || invitesError) {
      return NextResponse.json({ error: '초대 가능 여부를 확인하지 못했습니다.' }, { status: 500 })
    }

    if (countActiveMembers(members || []) >= 4) {
      return NextResponse.json({ error: '팀 정원이 가득 찼습니다.' }, { status: 409 })
    }

    const duplicatedInvite = (invites || []).find((invite) => {
      return normalizeInviteEmail(invite.email) === normalizedEmail
    })

    if (duplicatedInvite) {
      return NextResponse.json({ error: '이미 대기 중인 초대가 있습니다.' }, { status: 409 })
    }

    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        id: crypto.randomUUID(),
        team_id: teamId,
        email: normalizedEmail,
        invited_by: userId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: '초대 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ invite }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED' || error.message === 'TEAM_ROLE_DENIED') {
        return NextResponse.json({ error: '팀장만 초대할 수 있습니다.' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
