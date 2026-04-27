import { NextRequest, NextResponse } from 'next/server'

import { createApiClient } from '@/lib/supabase/api-client'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireAuthenticatedProfile, requireTeamRole } from '@/lib/team/server-context'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

type SlackSetting = {
  is_enabled: boolean
  notify_status_changes: boolean
  notify_work_summaries: boolean
}

const SLACK_INCOMING_WEBHOOK_PATTERN = /^https:\/\/hooks\.slack\.com\/services\/.+/

function formatSettingResponse(setting: SlackSetting | null) {
  return {
    isConfigured: Boolean(setting),
    isEnabled: setting?.is_enabled ?? true,
    notifyStatusChanges: setting?.notify_status_changes ?? true,
    notifyWorkSummaries: setting?.notify_work_summaries ?? true,
  }
}

async function requireOwner(teamId: string) {
  const supabase = await createApiClient()
  const { userId } = await requireAuthenticatedProfile(supabase)
  await requireTeamRole(supabase, teamId, userId, 'owner')

  return userId
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    await requireOwner(teamId)

    const serviceRoleSupabase = createServiceRoleClient()
    const { data, error } = await serviceRoleSupabase
      .from('team_slack_notification_settings')
      .select('is_enabled, notify_status_changes, notify_work_summaries')
      .eq('team_id', teamId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading Slack notification setting:', error)
      return NextResponse.json({ error: 'Slack 알림 설정을 불러오지 못했습니다.' }, { status: 500 })
    }

    return NextResponse.json(formatSettingResponse(data))
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED' || error.message === 'TEAM_ROLE_DENIED') {
        return NextResponse.json({ error: '팀장 권한이 필요합니다.' }, { status: 403 })
      }
    }

    console.error('Slack notification setting fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    const userId = await requireOwner(teamId)
    const body = await request.json()
    const webhookUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl.trim() : ''
    const isEnabled = body.isEnabled
    const notifyStatusChanges = body.notifyStatusChanges
    const notifyWorkSummaries = body.notifyWorkSummaries

    if (
      typeof isEnabled !== 'boolean' ||
      typeof notifyStatusChanges !== 'boolean' ||
      typeof notifyWorkSummaries !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Slack 알림 설정 값이 올바르지 않습니다.' }, { status: 400 })
    }

    const serviceRoleSupabase = createServiceRoleClient()
    const now = new Date().toISOString()
    const { data: existingSetting, error: existingError } = await serviceRoleSupabase
      .from('team_slack_notification_settings')
      .select('id, webhook_url')
      .eq('team_id', teamId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error loading Slack notification setting before save:', existingError)
      return NextResponse.json({ error: 'Slack 알림 설정 저장에 실패했습니다.' }, { status: 500 })
    }

    if (!webhookUrl && !existingSetting) {
      return NextResponse.json({ error: 'Slack Incoming Webhook URL이 필요합니다.' }, { status: 400 })
    }

    if (webhookUrl && !SLACK_INCOMING_WEBHOOK_PATTERN.test(webhookUrl)) {
      return NextResponse.json({ error: 'Slack Incoming Webhook URL 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    const settingPayload = {
      webhook_url: webhookUrl || existingSetting?.webhook_url,
      is_enabled: isEnabled,
      notify_status_changes: notifyStatusChanges,
      notify_work_summaries: notifyWorkSummaries,
      updated_by: userId,
      updated_at: now,
    }

    const result = existingSetting
      ? await serviceRoleSupabase
          .from('team_slack_notification_settings')
          .update(settingPayload)
          .eq('team_id', teamId)
          .select('is_enabled, notify_status_changes, notify_work_summaries')
          .single()
      : await serviceRoleSupabase
          .from('team_slack_notification_settings')
          .insert({
            id: crypto.randomUUID(),
            team_id: teamId,
            created_by: userId,
            created_at: now,
            ...settingPayload,
          })
          .select('is_enabled, notify_status_changes, notify_work_summaries')
          .single()

    if (result.error || !result.data) {
      console.error('Error saving Slack notification setting:', result.error)
      return NextResponse.json({ error: 'Slack 알림 설정 저장에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json(formatSettingResponse(result.data))
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED' || error.message === 'TEAM_ROLE_DENIED') {
        return NextResponse.json({ error: '팀장 권한이 필요합니다.' }, { status: 403 })
      }
    }

    console.error('Slack notification setting save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { teamId } = await context.params
    await requireOwner(teamId)

    const serviceRoleSupabase = createServiceRoleClient()
    const { error } = await serviceRoleSupabase
      .from('team_slack_notification_settings')
      .delete()
      .eq('team_id', teamId)

    if (error) {
      console.error('Error deleting Slack notification setting:', error)
      return NextResponse.json({ error: 'Slack 알림 설정 삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json(formatSettingResponse(null))
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }

      if (error.message === 'TEAM_ACCESS_DENIED' || error.message === 'TEAM_ROLE_DENIED') {
        return NextResponse.json({ error: '팀장 권한이 필요합니다.' }, { status: 403 })
      }
    }

    console.error('Slack notification setting delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
