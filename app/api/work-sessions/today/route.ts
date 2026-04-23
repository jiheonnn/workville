import { NextRequest, NextResponse } from 'next/server'

import { requireActiveTeam } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { userId, activeTeamId } = await requireActiveTeam(supabase)

    // Get the most recent work session that doesn't have a check_out_time
    const { data: session, error } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('team_id', activeTeamId)
      .eq('user_id', userId)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    // Also get the most recent work session regardless of check_out status
    const { data: lastSession } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('team_id', activeTeamId)
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // No active session found, but return last session if exists
      return NextResponse.json({ session: null, lastSession: lastSession || null })
    }

    return NextResponse.json({ session, lastSession: lastSession || session })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }
    }

    console.error('Work session fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
