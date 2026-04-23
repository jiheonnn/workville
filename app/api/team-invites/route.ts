import { NextResponse } from 'next/server'

import { normalizeInviteEmail } from '@/lib/team/normalization'
import { requireAuthenticatedProfile } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET() {
  try {
    const supabase = await createApiClient()
    const { profile } = await requireAuthenticatedProfile(supabase)
    const normalizedEmail = normalizeInviteEmail(profile.email)

    const { data: invites, error: invitesError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('status', 'pending')

    if (invitesError) {
      return NextResponse.json({ error: '초대 목록을 불러오지 못했습니다.' }, { status: 500 })
    }

    const matchingInvites = (invites || []).filter((invite) => {
      return normalizeInviteEmail(invite.email) === normalizedEmail
    })

    const teamIds = [...new Set(matchingInvites.map((invite) => invite.team_id))]
    const { data: teams } = teamIds.length > 0
      ? await supabase
          .from('teams')
          .select('id, name, created_by, created_at')
          .in('id', teamIds)
      : { data: [] }

    const teamMap = new Map((teams || []).map((team) => [team.id, team]))

    return NextResponse.json({
      invites: matchingInvites.map((invite) => ({
        ...invite,
        team: teamMap.get(invite.team_id) || null,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
