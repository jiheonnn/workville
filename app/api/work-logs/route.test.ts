import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { POST } = await import('./route')

const createRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/work-logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

describe('POST /api/work-logs', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('같은 날짜 로그가 있으면 병합하지 않고 현재 화면 상태로 전체 교체 저장합니다', async () => {
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
        work_logs: [
          {
            id: 'log-1',
            team_id: 'team-1',
            user_id: 'user-1',
            date: '2026-04-23',
            content: 'old',
            todos: [{ id: 'todo-old', text: '이전 할 일', completed: false, order: 0 }],
            completed_todos: [{ id: 'done-old', text: '예전 완료', completed: true, order: 0 }],
            roi_high: '',
            roi_low: '',
            tomorrow_priority: '',
            feedback: '예전 피드백',
            version: 3,
            created_at: '2026-04-23T00:00:00.000Z',
            updated_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await POST(
      createRequest({
        date: '2026-04-23',
        baseVersion: 3,
        content: 'new',
        todos: [{ id: 'todo-new', text: '새 할 일', completed: false, order: 0 }],
        completed_todos: [],
        feedback: '새 피드백',
      }) as any
    )

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.log.version).toBe(4)
    expect(body.log.todos).toEqual([{ id: 'todo-new', text: '새 할 일', completed: false, order: 0 }])
    expect(body.log.completed_todos).toEqual([])
    expect(body.log.feedback).toBe('새 피드백')
  })

  it('baseVersion이 현재 버전과 다르면 409 충돌을 반환합니다', async () => {
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
        work_logs: [
          {
            id: 'log-1',
            team_id: 'team-1',
            user_id: 'user-1',
            date: '2026-04-23',
            content: 'old',
            todos: [],
            completed_todos: [],
            roi_high: '',
            roi_low: '',
            tomorrow_priority: '',
            feedback: '',
            version: 5,
            created_at: '2026-04-23T00:00:00.000Z',
            updated_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await POST(
      createRequest({
        date: '2026-04-23',
        baseVersion: 4,
        content: 'new',
        todos: [],
        completed_todos: [],
      }) as any
    )

    expect(response.status).toBe(409)

    const body = await response.json()
    expect(body.currentLog.version).toBe(5)
  })

  it('기존 로그가 없으면 version 1로 새 로그를 생성합니다', async () => {
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

    const response = await POST(
      createRequest({
        date: '2026-04-23',
        content: 'new',
        todos: [{ id: 'todo-1', text: '첫 할 일', completed: false, order: 0 }],
        completed_todos: [],
      }) as any
    )

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.log.version).toBe(1)
    expect(body.log.date).toBe('2026-04-23')
    expect(body.log.team_id).toBe('team-1')
  })

  it('생성 시 unique 충돌이 나도 동일 payload면 기존 row를 재사용해 성공 응답합니다', async () => {
    const uniqueInsertRaceKeys = new Set(['team-1:user-1:2026-04-23'])
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
      uniqueInsertRaceKeys,
      raceInsertRows: {
        'team-1:user-1:2026-04-23': {
          id: 'log-1',
          team_id: 'team-1',
          user_id: 'user-1',
          date: '2026-04-23',
          content: 'new',
          todos: [{ id: 'todo-1', text: '첫 할 일', completed: false, order: 0 }],
          completed_todos: [],
          roi_high: '',
          roi_low: '',
          tomorrow_priority: '',
          feedback: '',
          version: 1,
          created_at: '2026-04-23T00:00:00.000Z',
          updated_at: '2026-04-23T00:00:00.000Z',
        },
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await POST(
      createRequest({
        date: '2026-04-23',
        content: 'new',
        todos: [{ id: 'todo-1', text: '첫 할 일', completed: false, order: 0 }],
        completed_todos: [],
      }) as any
    )

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.log.id).toBe('log-1')
    expect(body.log.version).toBe(1)
  })
})
