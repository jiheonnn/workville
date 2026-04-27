import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createServiceRoleClientMock = vi.hoisted(() => vi.fn())
const sendCheckoutReminderNotificationMock = vi.hoisted(() => vi.fn(async () => 'sent'))

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}))

vi.mock('@/lib/slack/notifications', () => ({
  sendCheckoutReminderNotification: sendCheckoutReminderNotificationMock,
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
      ],
      work_sessions: [
        {
          id: 'due-session',
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
          id: 'not-due-session',
          team_id: 'team-1',
          user_id: 'user-2',
          date: '2026-04-27',
          check_in_time: '2026-04-27T03:00:01.000Z',
          check_out_time: null,
          duration_minutes: null,
          break_minutes: 0,
          last_break_start: null,
        },
        {
          id: 'closed-session',
          team_id: 'team-1',
          user_id: 'user-1',
          date: '2026-04-27',
          check_in_time: '2026-04-26T23:00:00.000Z',
          check_out_time: '2026-04-27T08:00:00.000Z',
          duration_minutes: 540,
          break_minutes: 0,
          last_break_start: null,
        },
      ],
      work_session_reminders: [],
    } as any,
  } as any)

describe('GET /api/cron/checkout-reminders', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-27T15:00:00.000Z'))
    vi.stubEnv('CRON_SECRET', 'test-cron-secret')
    createServiceRoleClientMock.mockReset()
    sendCheckoutReminderNotificationMock.mockReset()
    sendCheckoutReminderNotificationMock.mockResolvedValue('sent')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('CRON_SECRET이 일치하지 않으면 거부합니다', async () => {
    createServiceRoleClientMock.mockReturnValue(createAdminClient())

    const response = await GET(createCronRequest('wrong-secret') as any)

    expect(response.status).toBe(401)
    expect(sendCheckoutReminderNotificationMock).not.toHaveBeenCalled()
  })

  it('12시간 이상 열린 세션에만 퇴근 리마인드를 보내고 발송 기록을 남깁니다', async () => {
    const supabase = createAdminClient()
    createServiceRoleClientMock.mockReturnValue(supabase)

    const response = await GET(createCronRequest() as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      checked: 1,
      sent: 1,
      skipped: 0,
      failed: 0,
    })
    expect(sendCheckoutReminderNotificationMock).toHaveBeenCalledWith('team-1', {
      username: '지헌',
      checkInTime: '09:00',
      elapsedTime: '15시간 0분',
    })
    expect(supabase.getRows('work_session_reminders' as any)).toHaveLength(1)
    expect(supabase.getRows('work_session_reminders' as any)[0]).toMatchObject({
      team_id: 'team-1',
      work_session_id: 'due-session',
      user_id: 'user-1',
      reminder_type: 'checkout_12h',
    })
  })

  it('이미 리마인드를 보낸 세션은 다시 보내지 않습니다', async () => {
    const supabase = createAdminClient()
    supabase.getRows('work_session_reminders' as any).push({
      id: 'reminder-1',
      team_id: 'team-1',
      work_session_id: 'due-session',
      user_id: 'user-1',
      reminder_type: 'checkout_12h',
      sent_at: '2026-04-27T12:30:00.000Z',
      created_at: '2026-04-27T12:30:00.000Z',
    })
    createServiceRoleClientMock.mockReturnValue(supabase)

    const response = await GET(createCronRequest() as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.sent).toBe(0)
    expect(sendCheckoutReminderNotificationMock).not.toHaveBeenCalled()
    expect(supabase.getRows('work_session_reminders' as any)).toHaveLength(1)
  })

  it('Slack 발송이 실패하면 발송 기록을 남기지 않습니다', async () => {
    const supabase = createAdminClient()
    createServiceRoleClientMock.mockReturnValue(supabase)
    sendCheckoutReminderNotificationMock.mockResolvedValue('failed')

    const response = await GET(createCronRequest() as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.failed).toBe(1)
    expect(supabase.getRows('work_session_reminders' as any)).toHaveLength(0)
  })
})
