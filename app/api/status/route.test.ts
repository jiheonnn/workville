import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'
import { getTodayKorea } from '@/lib/utils/date'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { GET, POST } = await import('./route')

describe('GET /api/status', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('팀 상태 row가 아직 없어도 기본 home 상태로 응답합니다', async () => {
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
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request('http://localhost/api/status') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('home')
    expect(body.userId).toBe('user-1')
  })

  it('오늘 완료된 세션만 완료 근무 시간으로 합산하고 진행 중 세션은 sessions로만 내려줍니다', async () => {
    const today = getTodayKorea()
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
            last_updated: '2026-04-23T00:00:00.000Z',
          },
        ],
        work_sessions: [
          {
            id: 'completed-session',
            team_id: 'team-1',
            user_id: 'user-1',
            date: today,
            check_in_time: '2026-04-23T00:00:00.000Z',
            check_out_time: '2026-04-23T01:00:00.000Z',
            duration_minutes: 60,
            break_minutes: 0,
            last_break_start: null,
          },
          {
            id: 'active-session',
            team_id: 'team-1',
            user_id: 'user-1',
            date: today,
            check_in_time: '2026-04-23T02:00:00.000Z',
            check_out_time: null,
            duration_minutes: null,
            break_minutes: 0,
            last_break_start: null,
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request('http://localhost/api/status') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.completedDurationMinutes).toBe(60)
    expect(body.totalDurationMinutes).toBeUndefined()
    expect(body.todaySessions).toHaveLength(2)
    expect(body.todaySessions[1].check_out_time).toBeNull()
  })
})

describe('POST /api/status', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-27T14:00:00.000Z'))
    createApiClientMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('퇴근 후 근무시간이 14시간 이상이면 기록 검토 배너 정보를 응답합니다', async () => {
    const today = getTodayKorea()
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
            role: 'member',
            status: 'active',
            can_manage_own_records: true,
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
            last_updated: '2026-04-27T00:00:00.000Z',
          },
        ],
        work_sessions: [
          {
            id: 'session-1',
            team_id: 'team-1',
            user_id: 'user-1',
            date: today,
            check_in_time: '2026-04-27T00:00:00.000Z',
            check_out_time: null,
            duration_minutes: null,
            break_minutes: 0,
            last_break_start: null,
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await POST(
      new Request('http://localhost/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'home' }),
      }) as any
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.recordReview).toEqual({
      required: true,
      canManageOwnRecords: true,
      sessionId: 'session-1',
      durationMinutes: 840,
    })
  })
})
