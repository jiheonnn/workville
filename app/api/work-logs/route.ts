import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { getTodayKorea } from '@/lib/utils/date'
import {
  isSameWorkLogPayload,
  normalizeWorkLogSaveInput,
} from '@/lib/work-log/content'

const CONFLICT_STATUS = 409

const fetchLatestWorkLogByDate = async (
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  userId: string,
  logDate: string
) => {
  const { data, error } = await supabase
    .from('work_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', logDate)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  return data && data.length > 0 ? data[0] : null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { date, baseVersion } = body

    // Use provided date or today (Korean timezone)
    const logDate = date || getTodayKorea()
    const normalizedInput = normalizeWorkLogSaveInput(body)
    const now = new Date().toISOString()

    const existingLog = await fetchLatestWorkLogByDate(supabase, user.id, logDate)

    if (existingLog) {
      if (typeof baseVersion !== 'number') {
        return NextResponse.json(
          {
            error: '최신 업무일지 버전 정보가 필요합니다.',
            currentLog: existingLog,
          },
          { status: CONFLICT_STATUS }
        )
      }

      if (existingLog.version !== baseVersion) {
        return NextResponse.json(
          {
            error: '다른 곳에서 먼저 수정되었습니다.',
            currentLog: existingLog,
          },
          { status: CONFLICT_STATUS }
        )
      }

      const { data, error: updateError } = await supabase
        .from('work_logs')
        .update({
          ...normalizedInput,
          version: baseVersion + 1,
          updated_at: now,
        })
        .eq('id', existingLog.id)
        .eq('version', baseVersion)
        .select()
        .single()

      if (updateError) {
        const latestLog = await fetchLatestWorkLogByDate(supabase, user.id, logDate)

        if (latestLog && latestLog.version !== baseVersion) {
          return NextResponse.json(
            {
              error: '다른 곳에서 먼저 수정되었습니다.',
              currentLog: latestLog,
            },
            { status: CONFLICT_STATUS }
          )
        }

        console.error('Error updating work log:', updateError)
        return NextResponse.json(
          { error: '업무 일지 업데이트에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, log: data })
    }

    const { data, error: insertError } = await supabase
      .from('work_logs')
      .insert({
        user_id: user.id,
        date: logDate,
        version: 1,
        updated_at: now,
        ...normalizedInput,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        const latestLog = await fetchLatestWorkLogByDate(supabase, user.id, logDate)

        if (latestLog) {
          const latestPayload = normalizeWorkLogSaveInput(latestLog)

          if (isSameWorkLogPayload(latestPayload, normalizedInput)) {
            return NextResponse.json({ success: true, log: latestLog })
          }

          return NextResponse.json(
            {
              error: '다른 곳에서 먼저 수정되었습니다.',
              currentLog: latestLog,
            },
            { status: CONFLICT_STATUS }
          )
        }
      }

      console.error('Error creating work log:', insertError)
      return NextResponse.json(
        { error: '업무 일지 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, log: data })

  } catch (error) {
    console.error('Work log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to fetch work logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build query
    let query = supabase
      .from('work_logs')
      .select('*')
      .eq('user_id', user.id)

    if (date) {
      // If specific date is requested, get only one (the latest) for that date
      query = query
        .eq('date', date)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
    } else {
      // Otherwise get recent logs
      query = query
        .order('date', { ascending: false })
        .limit(limit)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch work logs' }, { status: 500 })
    }

    return NextResponse.json({ logs: data })

  } catch (error) {
    console.error('Work logs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
