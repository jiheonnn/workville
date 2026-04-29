import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { POST } = await import('./route')

describe('POST /api/activity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-27T07:30:00.000Z'))
    createApiClientMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('현재 사용자의 팀 상태 row에 서버 기준 마지막 활동 시각을 저장합니다', async () => {
    const supabase = new MockSupabaseClient({
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
            role: 'owner',
            status: 'active',
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        user_status: [
          {
            id: 'status-1',
            team_id: 'team-1',
            user_id: 'user-1',
            status: 'working',
            last_activity_at: '2026-04-27T07:00:00.000Z',
            last_updated: '2026-04-27T07:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true, lastActivityAt: '2026-04-27T07:30:00.000Z' })
    expect(supabase.getRows('user_status')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-1',
          last_activity_at: '2026-04-27T07:30:00.000Z',
        }),
      ])
    )
  })
})
