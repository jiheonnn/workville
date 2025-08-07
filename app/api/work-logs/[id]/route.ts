import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      content,
      todos,
      completed_todos,
      roi_high,
      roi_low,
      tomorrow_priority,
      feedback
    } = body

    // Update log
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
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user owns this log
      .select()
      .single()

    if (updateError) {
      console.error('Error updating work log:', updateError)
      return NextResponse.json({ 
        error: '업무 일지 업데이트에 실패했습니다.' 
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ 
        error: '업무 일지를 찾을 수 없습니다.' 
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Work log PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}