import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the most recent work session that doesn't have a check_out_time
    const { data: session, error } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    // Also get the most recent work session regardless of check_out status
    const { data: lastSession } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // No active session found, but return last session if exists
      return NextResponse.json({ session: null, lastSession: lastSession || null })
    }

    return NextResponse.json({ session, lastSession: lastSession || session })

  } catch (error) {
    console.error('Work session fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}