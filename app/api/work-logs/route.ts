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
      // Get existing log data to merge
      const { data: existingData } = await supabase
        .from('work_logs')
        .select('*')
        .eq('id', existingLog.id)
        .single()

      if (!existingData) {
        return NextResponse.json({ 
          error: '기존 업무 일지를 찾을 수 없습니다.' 
        }, { status: 500 })
      }

      // Merge content with session separator
      const sessionNumber = (existingData.content.match(/\[세션 \d+\]/g)?.length || 0) + 1
      const mergedContent = existingData.content 
        ? `${existingData.content}\n\n---\n\n[세션 ${sessionNumber}]\n${content}`
        : content

      // Merge arrays (remove duplicates)
      const mergedTodos = [...(existingData.todos || []), ...(todos || [])]
        .filter((todo, index, self) => 
          index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(todo))
        )
      
      const mergedCompletedTodos = [...(existingData.completed_todos || []), ...(completed_todos || [])]
        .filter((todo, index, self) => 
          index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(todo))
        )

      // Merge text fields with separator if both exist
      const mergeTextField = (existing: string | null, new_value: string) => {
        if (!existing || existing === '') return new_value
        if (!new_value || new_value === '') return existing
        return `${existing}\n---\n${new_value}`
      }

      // Update existing log with merged data
      const { data, error: updateError } = await supabase
        .from('work_logs')
        .update({
          content: mergedContent,
          todos: mergedTodos,
          completed_todos: mergedCompletedTodos,
          roi_high: mergeTextField(existingData.roi_high, roi_high),
          roi_low: mergeTextField(existingData.roi_low, roi_low),
          tomorrow_priority: mergeTextField(existingData.tomorrow_priority, tomorrow_priority),
          feedback: mergeTextField(existingData.feedback, feedback),
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

      return NextResponse.json({ success: true, id: data.id, merged: true })
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