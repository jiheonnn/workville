import { NextResponse } from 'next/server'

import { requireAuthenticatedProfile } from '@/lib/team/server-context'
import {
  countActiveMembers,
  normalizeInviteEmail,
} from '@/lib/team/normalization'
import { createApiClient } from '@/lib/supabase/api-client'

export async function POST(
  request: Request,
  context: { params: Promise<{ inviteId: string }> }
) {
  try {
    const supabase = await createApiClient()
    const { userId, profile } = await requireAuthenticatedProfile(supabase)
    const { inviteId } = await context.params

    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('id', inviteId)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: '초대를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: '이미 처리된 초대입니다.' }, { status: 409 })
    }

    if (normalizeInviteEmail(profile.email) !== normalizeInviteEmail(invite.email)) {
      return NextResponse.json({ error: '초대 이메일이 현재 계정과 일치하지 않습니다.' }, { status: 403 })
    }

    const { data: activeMembers, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', invite.team_id)
      .eq('status', 'active')

    if (memberError) {
      return NextResponse.json({ error: '팀 멤버 정보를 불러오지 못했습니다.' }, { status: 500 })
    }

    if (countActiveMembers(activeMembers || []) >= 4) {
      return NextResponse.json({ error: '팀 정원이 가득 찼습니다.' }, { status: 409 })
    }

    const { data: existingMembership } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', invite.team_id)
      .eq('user_id', userId)
      .single()

    const now = new Date().toISOString()

    if (!existingMembership) {
      const { error: membershipInsertError } = await supabase
        .from('team_members')
        .insert({
          id: crypto.randomUUID(),
          team_id: invite.team_id,
          user_id: userId,
          role: 'member',
          status: 'active',
          joined_at: now,
          created_at: now,
        })

      if (membershipInsertError) {
        return NextResponse.json({ error: '팀 합류 처리에 실패했습니다.' }, { status: 500 })
      }
    } else if (existingMembership.status !== 'active') {
      const { error: membershipUpdateError } = await supabase
        .from('team_members')
        .update({
          role: 'member',
          status: 'active',
          joined_at: now,
        })
        .eq('id', existingMembership.id)

      if (membershipUpdateError) {
        return NextResponse.json({ error: '팀 합류 처리에 실패했습니다.' }, { status: 500 })
      }
    }

    const { data: existingStatus } = await supabase
      .from('user_status')
      .select('id')
      .eq('team_id', invite.team_id)
      .eq('user_id', userId)
      .single()

    if (!existingStatus) {
      const { error: statusInsertError } = await supabase
        .from('user_status')
        .insert({
          id: crypto.randomUUID(),
          team_id: invite.team_id,
          user_id: userId,
          status: 'home',
          last_updated: now,
        })

      if (statusInsertError) {
        return NextResponse.json({ error: '초기 팀 상태 생성에 실패했습니다.' }, { status: 500 })
      }
    }

    const acceptedAt = new Date().toISOString()
    const { error: inviteUpdateError } = await supabase
      .from('team_invites')
      .update({
        status: 'accepted',
        accepted_at: acceptedAt,
      })
      .eq('id', inviteId)

    if (inviteUpdateError) {
      return NextResponse.json({ error: '초대 상태 변경에 실패했습니다.' }, { status: 500 })
    }

    if (!profile.active_team_id) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          active_team_id: invite.team_id,
        })
        .eq('id', userId)

      if (profileUpdateError) {
        return NextResponse.json({ error: '활성 팀 설정에 실패했습니다.' }, { status: 500 })
      }
    }

    return NextResponse.json({
      accepted: true,
      teamId: invite.team_id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
