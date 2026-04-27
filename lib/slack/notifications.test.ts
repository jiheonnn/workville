import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createServiceRoleClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}))

const { sendCheckoutReminderNotification, sendSlackNotification, sendWorkSummaryNotification } =
  await import('./notifications')

const createAdminClient = (settings: Record<string, unknown>[]) =>
  new MockSupabaseClient({
    tables: {
      team_slack_notification_settings: settings,
    } as any,
  } as any)

describe('Slack team notifications', () => {
  beforeEach(() => {
    createServiceRoleClientMock.mockReset()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })))
  })

  it('팀 Slack 설정의 webhook URL로 상태 변경 알림을 전송합니다', async () => {
    createServiceRoleClientMock.mockReturnValue(
      createAdminClient([
        {
          id: 'setting-1',
          team_id: 'team-1',
          webhook_url: 'https://hooks.slack.com/services/team-1',
          is_enabled: true,
          notify_status_changes: true,
          notify_work_summaries: true,
          notify_checkout_reminders: true,
        },
      ])
    )

    const result = await sendSlackNotification('team-1', {
      username: '지헌',
      previousStatus: 'home',
      newStatus: 'working',
      timestamp: '2026-04-27T01:00:00.000Z',
    })

    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/team-1',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('지헌'),
      })
    )
  })

  it('팀 Slack 설정이 없으면 알림을 생략하고 성공으로 처리합니다', async () => {
    createServiceRoleClientMock.mockReturnValue(createAdminClient([]))

    const result = await sendSlackNotification('team-1', {
      username: '지헌',
      previousStatus: 'home',
      newStatus: 'working',
    })

    expect(result).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('상태 변경 알림 토글이 꺼져 있으면 상태 알림을 보내지 않습니다', async () => {
    createServiceRoleClientMock.mockReturnValue(
      createAdminClient([
        {
          id: 'setting-1',
          team_id: 'team-1',
          webhook_url: 'https://hooks.slack.com/services/team-1',
          is_enabled: true,
          notify_status_changes: false,
          notify_work_summaries: true,
          notify_checkout_reminders: true,
        },
      ])
    )

    const result = await sendSlackNotification('team-1', {
      username: '지헌',
      previousStatus: 'working',
      newStatus: 'break',
    })

    expect(result).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('퇴근 요약 알림 토글이 켜져 있으면 팀 webhook URL로 요약을 전송합니다', async () => {
    createServiceRoleClientMock.mockReturnValue(
      createAdminClient([
        {
          id: 'setting-1',
          team_id: 'team-1',
          webhook_url: 'https://hooks.slack.com/services/team-1',
          is_enabled: true,
          notify_status_changes: true,
          notify_work_summaries: true,
          notify_checkout_reminders: true,
        },
      ])
    )

    const result = await sendWorkSummaryNotification('team-1', '지헌', 125, 15)

    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/team-1',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('오늘 근무 요약'),
      })
    )
  })

  it('퇴근 요약 알림 토글이 꺼져 있으면 요약 알림을 보내지 않습니다', async () => {
    createServiceRoleClientMock.mockReturnValue(
      createAdminClient([
        {
          id: 'setting-1',
          team_id: 'team-1',
          webhook_url: 'https://hooks.slack.com/services/team-1',
          is_enabled: true,
          notify_status_changes: true,
          notify_work_summaries: false,
          notify_checkout_reminders: true,
        },
      ])
    )

    const result = await sendWorkSummaryNotification('team-1', '지헌', 125, 15)

    expect(result).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('퇴근 리마인드 토글이 켜져 있으면 팀 webhook URL로 리마인드를 전송합니다', async () => {
    createServiceRoleClientMock.mockReturnValue(
      createAdminClient([
        {
          id: 'setting-1',
          team_id: 'team-1',
          webhook_url: 'https://hooks.slack.com/services/team-1',
          is_enabled: true,
          notify_status_changes: true,
          notify_work_summaries: true,
          notify_checkout_reminders: true,
        },
      ])
    )

    const result = await sendCheckoutReminderNotification('team-1', {
      username: '지헌',
      checkInTime: '09:00',
      elapsedTime: '12시간 30분',
    })

    expect(result).toBe('sent')
    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/team-1',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('퇴근을 잊으신 것 같아요'),
      })
    )
    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/team-1',
      expect.objectContaining({
        body: expect.stringContaining('09:00'),
      })
    )
    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/team-1',
      expect.objectContaining({
        body: expect.stringContaining('12시간 30분'),
      })
    )
  })

  it('퇴근 리마인드 토글이 꺼져 있으면 리마인드를 보내지 않습니다', async () => {
    createServiceRoleClientMock.mockReturnValue(
      createAdminClient([
        {
          id: 'setting-1',
          team_id: 'team-1',
          webhook_url: 'https://hooks.slack.com/services/team-1',
          is_enabled: true,
          notify_status_changes: true,
          notify_work_summaries: true,
          notify_checkout_reminders: false,
        },
      ])
    )

    const result = await sendCheckoutReminderNotification('team-1', {
      username: '지헌',
      checkInTime: '09:00',
      elapsedTime: '12시간 30분',
    })

    expect(result).toBe('skipped')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('퇴근 리마인드 Slack 발송이 실패하면 failed를 반환합니다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, statusText: 'Not Found' })))
    createServiceRoleClientMock.mockReturnValue(
      createAdminClient([
        {
          id: 'setting-1',
          team_id: 'team-1',
          webhook_url: 'https://hooks.slack.com/services/team-1',
          is_enabled: true,
          notify_status_changes: true,
          notify_work_summaries: true,
          notify_checkout_reminders: true,
        },
      ])
    )

    const result = await sendCheckoutReminderNotification('team-1', {
      username: '지헌',
      checkInTime: '09:00',
      elapsedTime: '12시간 30분',
    })

    expect(result).toBe('failed')
  })
})
