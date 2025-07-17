import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '업무 일지 내용을 입력해주세요.' }, { status: 400 })
    }

    // Save work log - always create a new log
    const today = new Date().toISOString().split('T')[0]
    
    // Create new log
    const { error: insertError } = await supabase
      .from('work_logs')
      .insert({
        user_id: user.id,
        date: today,
        content
      })

    if (insertError) {
      console.error('Error creating work log:', insertError)
      return NextResponse.json({ 
        error: '업무 일지 생성에 실패했습니다.' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Work log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to fetch work logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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
      .order('date', { ascending: false })
      .limit(limit)

    if (date) {
      query = query.eq('date', date)
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