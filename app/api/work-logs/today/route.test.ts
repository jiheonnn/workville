import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { GET } = await import('./route')

describe('GET /api/work-logs/today', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('요청 날짜가 없으면 check_in_time 재계산이 아니라 세션 date 기준으로 로그를 조회합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        work_sessions: [
          {
            id: 'session-1',
            user_id: 'user-1',
            check_in_time: '2026-04-22T15:30:00.000Z',
            check_out_time: null,
            duration_minutes: null,
            break_minutes: 0,
            last_break_start: null,
            date: '2026-04-23',
            created_at: '2026-04-22T15:30:00.000Z',
          },
        ],
        work_logs: [
          {
            id: 'log-1',
            user_id: 'user-1',
            date: '2026-04-23',
            content: 'today',
            todos: [],
            completed_todos: [],
            roi_high: '',
            roi_low: '',
            tomorrow_priority: '',
            feedback: '',
            version: 2,
            created_at: '2026-04-23T00:00:00.000Z',
            updated_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request('http://localhost/api/work-logs/today') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.session.date).toBe('2026-04-23')
    expect(body.workLog.id).toBe('log-1')
    expect(body.workLog.date).toBe('2026-04-23')
  })
})
