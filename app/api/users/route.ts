import { NextRequest, NextResponse } from 'next/server'

import { requireActiveTeam } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { activeTeamId } = await requireActiveTeam(supabase)

    const { data: memberships, error: membershipsError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', activeTeamId)
      .eq('status', 'active')

    if (membershipsError) {
      console.error('Error fetching team members:', membershipsError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const membershipMap = new Map(
      (memberships || []).map((membership) => [membership.user_id, membership])
    )
    const memberIds = (memberships || []).map((membership) => membership.user_id)

    if (memberIds.length === 0) {
      return NextResponse.json({ users: [] })
    }

    const [{ data: profiles, error: profilesError }, { data: statuses, error: statusesError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, character_type')
          .in('id', memberIds),
        supabase
          .from('user_status')
          .select('user_id, status')
          .eq('team_id', activeTeamId)
          .in('user_id', memberIds),
      ])

    if (profilesError || statusesError) {
      console.error('Error fetching users:', profilesError || statusesError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const statusMap = new Map((statuses || []).map((status) => [status.user_id, status.status]))
    const users = (profiles || [])
      .sort((left, right) => left.username.localeCompare(right.username, 'ko'))
      .map((profile) => ({
        ...profile,
        membership_id: membershipMap.get(profile.id)?.id,
        role: membershipMap.get(profile.id)?.role || 'member',
        can_manage_own_records: membershipMap.get(profile.id)?.can_manage_own_records === true,
        user_status: [
          {
            status: statusMap.get(profile.id) || 'home',
          },
        ],
      }))

    return NextResponse.json({ users })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }
    }

    console.error('API Users GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
