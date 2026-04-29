import { NextResponse } from 'next/server'

import { createApiClient } from '@/lib/supabase/api-client'
import { requireActiveTeam } from '@/lib/team/server-context'

export async function POST() {
  try {
    const supabase = await createApiClient()
    const { userId, activeTeamId } = await requireActiveTeam(supabase)
    const now = new Date().toISOString()

    const { data: existingStatus, error: existingError } = await supabase
      .from('user_status')
      .select('user_id')
      .eq('team_id', activeTeamId)
      .eq('user_id', userId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error loading user status before activity ping:', existingError)
      return NextResponse.json({ error: '활동 상태를 불러오지 못했습니다.' }, { status: 500 })
    }

    const result = existingStatus
      ? await supabase
          .from('user_status')
          .update({
            last_activity_at: now,
          })
          .eq('team_id', activeTeamId)
          .eq('user_id', userId)
      : await supabase
          .from('user_status')
          .insert({
            team_id: activeTeamId,
            user_id: userId,
            status: 'home',
            last_updated: now,
            last_activity_at: now,
          })

    if (result.error) {
      console.error('Error saving user activity ping:', result.error)
      return NextResponse.json({ error: '활동 시각 저장에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lastActivityAt: now })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }
    }

    console.error('Activity ping error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
