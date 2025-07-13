import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    }

    // Create work log
    const today = new Date().toISOString().split('T')[0]
    
    // Check if log already exists for today
    const { data: existingLog } = await supabase
      .from('work_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (existingLog) {
      // Update existing log
      const { error: updateError } = await supabase
        .from('work_logs')
        .update({ content })
        .eq('id', existingLog.id)

      if (updateError) {
        console.error('Error updating work log:', updateError)
        return NextResponse.json({ error: 'Failed to update work log' }, { status: 500 })
      }
    } else {
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
        return NextResponse.json({ error: 'Failed to create work log' }, { status: 500 })
      }
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