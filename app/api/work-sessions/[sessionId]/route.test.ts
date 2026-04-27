import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { PATCH } = await import('./route')

const createPatchRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/work-sessions/session-1', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

const createBaseTables = () => ({
  profiles: [
    {
      id: 'user-1',
      email: 'user-1@example.com',
      username: '지헌',
      character_type: 1,
      level: 1,
      total_work_hours: 10,
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
    {
      id: 'membership-2',
      team_id: 'team-1',
      user_id: 'user-2',
      role: 'member',
      status: 'active',
      can_manage_own_records: false,
      joined_at: '2026-04-23T00:00:00.000Z',
      created_at: '2026-04-23T00:00:00.000Z',
    },
  ],
  work_sessions: [
    {
      id: 'session-1',
      team_id: 'team-1',
      user_id: 'user-1',
      date: '2026-04-27',
      check_in_time: '2026-04-27T00:00:00.000Z',
      check_out_time: '2026-04-27T10:00:00.000Z',
      duration_minutes: 540,
      break_minutes: 60,
      last_break_start: null,
      created_at: '2026-04-27T00:00:00.000Z',
    },
    {
      id: 'other-session',
      team_id: 'team-1',
      user_id: 'user-1',
      date: '2026-04-26',
      check_in_time: '2026-04-26T00:00:00.000Z',
      check_out_time: '2026-04-26T02:00:00.000Z',
      duration_minutes: 120,
      break_minutes: 0,
      last_break_start: null,
      created_at: '2026-04-26T00:00:00.000Z',
    },
  ],
})

describe('PATCH /api/work-sessions/[sessionId]', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-27T12:00:00.000Z'))
    createApiClientMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('기록 관리 권한이 있는 사용자는 자기 세션의 출근/퇴근 시간을 수정하고 감사 기록을 남깁니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: createBaseTables(),
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await PATCH(
      createPatchRequest({
        checkInTime: '2026-04-27T01:00:00.000Z',
        checkOutTime: '2026-04-27T09:00:00.000Z',
      }) as any,
      { params: Promise.resolve({ sessionId: 'session-1' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.session.duration_minutes).toBe(420)
    expect(supabase.getRows('work_sessions')[0]).toMatchObject({
      check_in_time: '2026-04-27T01:00:00.000Z',
      check_out_time: '2026-04-27T09:00:00.000Z',
      duration_minutes: 420,
      break_minutes: 60,
    })
    expect(supabase.getRows('work_session_edits')).toEqual([
      expect.objectContaining({
        team_id: 'team-1',
        work_session_id: 'session-1',
        edited_by: 'user-1',
        previous_check_in_time: '2026-04-27T00:00:00.000Z',
        previous_check_out_time: '2026-04-27T10:00:00.000Z',
        previous_duration_minutes: 540,
        next_duration_minutes: 420,
      }),
    ])
    expect(supabase.getRows('profiles')[0]).toMatchObject({
      total_work_hours: 9,
      level: 2,
    })
  })

  it('기록 관리 권한이 없는 팀원은 자기 세션도 수정할 수 없습니다', async () => {
    const tables = createBaseTables()
    tables.team_members[0].can_manage_own_records = false
    const supabase = new MockSupabaseClient({ tables })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await PATCH(
      createPatchRequest({
        checkInTime: '2026-04-27T01:00:00.000Z',
        checkOutTime: '2026-04-27T09:00:00.000Z',
      }) as any,
      { params: Promise.resolve({ sessionId: 'session-1' }) }
    )

    expect(response.status).toBe(403)
    expect(supabase.getRows('work_session_edits')).toHaveLength(0)
  })

  it('권한이 있어도 다른 사람의 세션은 수정할 수 없습니다', async () => {
    const tables = createBaseTables()
    tables.work_sessions[0].user_id = 'user-2'
    const supabase = new MockSupabaseClient({ tables })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await PATCH(
      createPatchRequest({
        checkInTime: '2026-04-27T01:00:00.000Z',
        checkOutTime: '2026-04-27T09:00:00.000Z',
      }) as any,
      { params: Promise.resolve({ sessionId: 'session-1' }) }
    )

    expect(response.status).toBe(403)
  })

  it('최근 7일이 지난 세션 수정은 거부합니다', async () => {
    const tables = createBaseTables()
    tables.work_sessions[0].date = '2026-04-20'
    const supabase = new MockSupabaseClient({ tables })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await PATCH(
      createPatchRequest({
        checkInTime: '2026-04-20T01:00:00.000Z',
        checkOutTime: '2026-04-20T09:00:00.000Z',
      }) as any,
      { params: Promise.resolve({ sessionId: 'session-1' }) }
    )

    expect(response.status).toBe(400)
  })
})
