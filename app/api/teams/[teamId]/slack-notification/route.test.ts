import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())
const createServiceRoleClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}))

const { DELETE, GET, PUT } = await import('./route')

const createAuthClient = (role: 'owner' | 'member' = 'owner') =>
  new MockSupabaseClient({
    tables: {
      profiles: [
        {
          id: 'user-1',
          email: 'user-1@example.com',
          username: '지헌',
          character_type: 1,
          level: 1,
          total_work_hours: 0,
          active_team_id: 'team-1',
          created_at: '2026-04-23T00:00:00.000Z',
        },
      ],
      team_members: [
        {
          id: 'membership-1',
          team_id: 'team-1',
          user_id: 'user-1',
          role,
          status: 'active',
          can_manage_own_records: false,
          joined_at: '2026-04-23T00:00:00.000Z',
          created_at: '2026-04-23T00:00:00.000Z',
        },
      ],
    },
  })

const createAdminClient = (settings: Record<string, unknown>[] = []) =>
  new MockSupabaseClient({
    tables: {
      team_slack_notification_settings: settings,
    } as any,
  } as any)

const routeContext = {
  params: Promise.resolve({ teamId: 'team-1' }),
}

describe('/api/teams/[teamId]/slack-notification', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
    createServiceRoleClientMock.mockReset()
  })

  it('팀장이 Slack 알림 설정 상태를 조회해도 webhook URL 원문은 반환하지 않습니다', async () => {
    createApiClientMock.mockResolvedValue(createAuthClient('owner'))
    createServiceRoleClientMock.mockReturnValue(
      createAdminClient([
        {
          id: 'setting-1',
          team_id: 'team-1',
          webhook_url: 'https://hooks.slack.com/services/team-1',
          is_enabled: true,
          notify_status_changes: true,
          notify_work_summaries: false,
          created_by: 'user-1',
          updated_by: 'user-1',
          created_at: '2026-04-23T00:00:00.000Z',
          updated_at: '2026-04-23T00:00:00.000Z',
        },
      ])
    )

    const response = await GET(new Request('http://localhost/api/teams/team-1/slack-notification') as any, routeContext)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      isConfigured: true,
      isEnabled: true,
      notifyStatusChanges: true,
      notifyWorkSummaries: false,
    })
    expect(body.webhookUrl).toBeUndefined()
  })

  it('팀장이 Slack 알림 설정을 저장합니다', async () => {
    const adminClient = createAdminClient()
    createApiClientMock.mockResolvedValue(createAuthClient('owner'))
    createServiceRoleClientMock.mockReturnValue(adminClient)

    const response = await PUT(
      new Request('http://localhost/api/teams/team-1/slack-notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: 'https://hooks.slack.com/services/team-1',
          isEnabled: true,
          notifyStatusChanges: true,
          notifyWorkSummaries: true,
        }),
      }) as any,
      routeContext
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.isConfigured).toBe(true)
    expect(adminClient.getRows('team_slack_notification_settings' as any)[0]).toMatchObject({
      team_id: 'team-1',
      webhook_url: 'https://hooks.slack.com/services/team-1',
      is_enabled: true,
      notify_status_changes: true,
      notify_work_summaries: true,
      created_by: 'user-1',
      updated_by: 'user-1',
    })
  })

  it('팀원이 Slack 알림 설정을 저장하려 하면 거부합니다', async () => {
    createApiClientMock.mockResolvedValue(createAuthClient('member'))
    createServiceRoleClientMock.mockReturnValue(createAdminClient())

    const response = await PUT(
      new Request('http://localhost/api/teams/team-1/slack-notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: 'https://hooks.slack.com/services/team-1',
          isEnabled: true,
          notifyStatusChanges: true,
          notifyWorkSummaries: true,
        }),
      }) as any,
      routeContext
    )

    expect(response.status).toBe(403)
  })

  it('팀장이 Slack 알림 설정을 삭제합니다', async () => {
    const adminClient = createAdminClient([
      {
        id: 'setting-1',
        team_id: 'team-1',
        webhook_url: 'https://hooks.slack.com/services/team-1',
        is_enabled: true,
        notify_status_changes: true,
        notify_work_summaries: true,
      },
    ])
    createApiClientMock.mockResolvedValue(createAuthClient('owner'))
    createServiceRoleClientMock.mockReturnValue(adminClient)

    const response = await DELETE(
      new Request('http://localhost/api/teams/team-1/slack-notification', { method: 'DELETE' }) as any,
      routeContext
    )

    expect(response.status).toBe(200)
    expect(adminClient.getRows('team_slack_notification_settings' as any)).toEqual([])
  })
})
