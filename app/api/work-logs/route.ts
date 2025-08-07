import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { getTodayKorea } from '@/lib/utils/date'

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
    const { 
      date,
      content,
      todos = [],
      completed_todos = [],
      roi_high = '',
      roi_low = '',
      tomorrow_priority = '',
      feedback = ''
    } = body

    // Use provided date or today (Korean timezone)
    const logDate = date || getTodayKorea()

    // Check if log already exists for this date (get the latest one if multiple exist)
    const { data: existingLogs } = await supabase
      .from('work_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', logDate)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    
    const existingLog = existingLogs && existingLogs.length > 0 ? existingLogs[0] : null

    if (existingLog) {
      // Update existing log
      const { data, error: updateError } = await supabase
        .from('work_logs')
        .update({
          content,
          todos,
          completed_todos,
          roi_high,
          roi_low,
          tomorrow_priority,
          feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLog.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating work log:', updateError)
        return NextResponse.json({ 
          error: '업무 일지 업데이트에 실패했습니다.' 
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, id: data.id })
    } else {
      // Create new log
      const { data, error: insertError } = await supabase
        .from('work_logs')
        .insert({
          user_id: user.id,
          date: logDate,
          content,
          todos,
          completed_todos,
          roi_high,
          roi_low,
          tomorrow_priority,
          feedback
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating work log:', insertError)
        return NextResponse.json({ 
          error: '업무 일지 생성에 실패했습니다.' 
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, id: data.id })
    }

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