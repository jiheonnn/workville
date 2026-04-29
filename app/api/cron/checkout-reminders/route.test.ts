import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createServiceRoleClientMock = vi.hoisted(() => vi.fn())
const sendAutoStatusNotificationMock = vi.hoisted(() => vi.fn(async () => 'sent'))
const sendWorkSummaryNotificationMock = vi.hoisted(() => vi.fn(async () => true))

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}))

vi.mock('@/lib/slack/notifications', () => ({
  sendAutoStatusNotification: sendAutoStatusNotificationMock,
  sendWorkSummaryNotification: sendWorkSummaryNotificationMock,
}))

const { GET } = await import('./route')

const createCronRequest = (secret = 'test-cron-secret') =>
  new Request('http://localhost/api/cron/checkout-reminders', {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  })

const createAdminClient = () =>
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
        {
          id: 'user-2',
          email: 'user-2@example.com',
          username: '동료',
          character_type: 2,
          level: 1,
          total_work_hours: 0,
          active_team_id: 'team-1',
          created_at: '2026-04-23T00:00:00.000Z',
        },
        {
          id: 'user-3',
          email: 'user-3@example.com',
          username: '활동중',
          character_type: 3,
          level: 1,
          total_work_hours: 10,
          active_team_id: 'team-1',
          created_at: '2026-04-23T00:00:00.000Z',
        },
      ],
      user_status: [
        {
          id: 'status-1',
          team_id: 'team-1',
          user_id: 'user-1',
          status: 'working',
          last_activity_at: '2026-04-27T05:00:00.000Z',
          last_updated: '2026-04-27T05:00:00.000Z',
        },
        {
          id: 'status-2',
          team_id: 'team-1',
          user_id: 'user-2',
          status: 'working',
          last_activity_at: '2026-04-27T01:00:00.000Z',
          last_updated: '2026-04-27T01:00:00.000Z',
        },
        {
          id: 'status-3',
          team_id: 'team-1',
          user_id: 'user-3',
          status: 'working',
          last_activity_at: '2026-04-27T07:00:00.000Z',
          last_updated: '2026-04-27T07:00:00.000Z',
        },
      ],
      work_sessions: [
        {
          id: 'auto-break-session',
          team_id: 'team-1',
          user_id: 'user-1',
          date: '2026-04-27',
          check_in_time: '2026-04-27T00:00:00.000Z',
          check_out_time: null,
          duration_minutes: null,
          break_minutes: 0,
          last_break_start: null,
        },
        {
          id: 'auto-checkout-session',
          team_id: 'team-1',
          user_id: 'user-2',
          date: '2026-04-27',
          check_in_time: '2026-04-27T00:00:00.000Z',
          check_out_time: null,
          duration_minutes: null,
          break_minutes: 0,
          last_break_start: null,
        },
        {
          id: 'active-session',
          team_id: 'team-1',
          user_id: 'user-3',
          date: '2026-04-27',
          check_in_time: '2026-04-27T06:00:00.000Z',
          check_out_time: null,
          duration_minutes: null,
          break_minutes: 0,
          last_break_start: null,
        },
      ],
      work_logs: [
        {
          id: 'log-1',
          team_id: 'team-1',
          user_id: 'user-2',
          date: '2026-04-27',
          todos: [{ id: 'todo-1', text: '남은 일', completed: false, order: 0 }],
          completed_todos: [{ id: 'done-1', text: '완료한 일', completed: true, order: 0 }],
          feedback: '',
          updated_at: '2026-04-27T01:00:00.000Z',
        },
      ],
      work_session_reminders: [],
    } as any,
  } as any)

describe('GET /api/cron/checkout-reminders', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-27T07:30:00.000Z'))
    vi.stubEnv('CRON_SECRET', 'test-cron-secret')
    createServiceRoleClientMock.mockReset()
    sendAutoStatusNotificationMock.mockReset()
    sendWorkSummaryNotificationMock.mockReset()
    sendAutoStatusNotificationMock.mockResolvedValue('sent')
    sendWorkSummaryNotificationMock.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('CRON_SECRET이 일치하지 않으면 거부합니다', async () => {
    createServiceRoleClientMock.mockReturnValue(createAdminClient())

    const response = await GET(createCronRequest('wrong-secret') as any)

    expect(response.status).toBe(401)
    expect(sendAutoStatusNotificationMock).not.toHaveBeenCalled()
  })

  it('2시간 이상 무활동 세션은 휴식으로, 6시간 이상 무활동 세션은 퇴근으로 자동 처리합니다', async () => {
    const supabase = createAdminClient()
    createServiceRoleClientMock.mockReturnValue(supabase)

    const response = await GET(createCronRequest() as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      checked: 3,
      autoBreaks: 1,
      autoCheckouts: 1,
      skipped: 0,
      failed: 0,
    })

    expect(supabase.getRows('user_status' as any)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-1',
          status: 'break',
          last_updated: '2026-04-27T07:00:00.000Z',
        }),
        expect.objectContaining({
          user_id: 'user-2',
          status: 'home',
          last_updated: '2026-04-27T07:00:00.000Z',
        }),
        expect.objectContaining({
          user_id: 'user-3',
          status: 'working',
        }),
      ])
    )
    expect(supabase.getRows('work_sessions' as any)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'auto-break-session',
          check_out_time: null,
          last_break_start: '2026-04-27T07:00:00.000Z',
        }),
        expect.objectContaining({
          id: 'auto-checkout-session',
          check_out_time: '2026-04-27T07:00:00.000Z',
          duration_minutes: 180,
          break_minutes: 240,
          last_break_start: null,
        }),
      ])
    )
    expect(supabase.getRows('profiles' as any)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'user-2',
          total_work_hours: 3,
          level: 1,
        }),
      ])
    )
    expect(sendAutoStatusNotificationMock).toHaveBeenCalledWith('team-1', {
      username: '지헌',
      action: 'break',
      effectiveTime: '16:00',
      inactiveHours: 2,
    })
    expect(sendAutoStatusNotificationMock).toHaveBeenCalledWith('team-1', {
      username: '동료',
      action: 'checkout',
      effectiveTime: '16:00',
      inactiveHours: 6,
    })
    expect(sendWorkSummaryNotificationMock).toHaveBeenCalledWith(
      'team-1',
      '동료',
      180,
      240,
      expect.objectContaining({ id: 'log-1' }),
      { automaticCheckout: true }
    )
  })

  it('업무일지 수정 시각이 더 최신이면 그 시각을 활동 기준으로 사용합니다', async () => {
    const supabase = createAdminClient()
    supabase.getRows('work_logs' as any).push({
      id: 'log-2-latest',
      team_id: 'team-1',
      user_id: 'user-2',
      date: '2026-04-27',
      todos: [],
      completed_todos: [],
      feedback: '방금 작성',
      updated_at: '2026-04-27T06:45:00.000Z',
    })
    createServiceRoleClientMock.mockReturnValue(supabase)

    const response = await GET(createCronRequest() as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.checked).toBe(3)
    expect(
      supabase.getRows('user_status' as any).find((status) => status.user_id === 'user-2')
    ).toMatchObject({ status: 'working' })
  })
})
