import { NextRequest, NextResponse } from 'next/server'

import { requireActiveTeam } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { activeTeamId } = await requireActiveTeam(supabase)

    const { data, error } = await supabase
      .from('work_log_template')
      .select('*')
      .eq('team_id', activeTeamId)
      .single()

    if (error) {
      console.error('Error fetching template:', error)
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
    }

    return NextResponse.json({ template: data })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }
    }

    console.error('API Template GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    const { userId, activeTeamId } = await requireActiveTeam(supabase)
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data: existingTemplate } = await supabase
      .from('work_log_template')
      .select('id')
      .eq('team_id', activeTeamId)
      .single()

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('work_log_template')
      .update({
        content,
        updated_by: userId,
        updated_at: new Date().toISOString(),
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
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (error.message === 'ACTIVE_TEAM_REQUIRED') {
        return NextResponse.json({ error: '활성 팀이 필요합니다.' }, { status: 409 })
      }
    }

    console.error('API Template PUT error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
