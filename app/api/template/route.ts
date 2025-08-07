import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    const { data, error } = await supabase
      .from('work_log_template')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching template:', error)
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
    }

    return NextResponse.json({ template: data })

  } catch (error) {
    console.error('API Template GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // First get the template ID
    const { data: existingTemplate } = await supabase
      .from('work_log_template')
      .select('id')
      .single()

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('work_log_template')
      .update({ 
        content,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingTemplate.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ template: data })

  } catch (error) {
    console.error('API Template PUT error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}