import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { GET } = await import('./route')

describe('GET /api/me', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('로그인한 사용자의 프로필을 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 3,
            total_work_hours: 12,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })

    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.profile).toEqual(
      expect.objectContaining({
        id: 'user-1',
        username: '지헌',
        character_type: 1,
        level: 3,
        active_team_id: 'team-1',
      })
    )
  })

  it('인증되지 않은 사용자는 401을 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      authUserId: null,
    })

    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })
})

describe('PATCH /api/me', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('이름을 변경합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 3,
            total_work_hours: 12,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })

    createApiClientMock.mockResolvedValue(supabase)

    const { PATCH } = await import('./route')
    const response = await PATCH(
      new Request('http://localhost/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: '지헌2' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.profile.username).toBe('지헌2')
    expect(supabase.getRows('profiles')[0].username).toBe('지헌2')
  })

  it('캐릭터를 변경합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 3,
            total_work_hours: 12,
            active_team_id: null,
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })

    createApiClientMock.mockResolvedValue(supabase)

    const { PATCH } = await import('./route')
    const response = await PATCH(
      new Request('http://localhost/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ character_type: 8 }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.profile.character_type).toBe(8)
    expect(supabase.getRows('profiles')[0].character_type).toBe(8)
  })

  it('이름 규칙을 어기면 400을 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 3,
            total_work_hours: 12,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })

    createApiClientMock.mockResolvedValue(supabase)

    const { PATCH } = await import('./route')
    const response = await PATCH(
      new Request('http://localhost/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: '지 헌' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('이름은 한글, 영문, 숫자만 사용할 수 있습니다.')
  })

  it('허용하지 않은 캐릭터면 400을 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 3,
            total_work_hours: 12,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })

    createApiClientMock.mockResolvedValue(supabase)

    const { PATCH } = await import('./route')
    const response = await PATCH(
      new Request('http://localhost/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ character_type: 9 }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('유효한 캐릭터를 선택해주세요.')
  })

  it('중복 이름이면 409를 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 3,
            total_work_hours: 12,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
          {
            id: 'user-2',
            email: 'user-2@example.com',
            username: '아라',
            character_type: 2,
            level: 2,
            total_work_hours: 10,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })

    createApiClientMock.mockResolvedValue(supabase)

    const { PATCH } = await import('./route')
    const response = await PATCH(
      new Request('http://localhost/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: '아라' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toBe('이미 사용 중인 이름입니다.')
  })

  it('인증되지 않은 사용자는 401을 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      authUserId: null,
    })

    createApiClientMock.mockResolvedValue(supabase)

    const { PATCH } = await import('./route')
    const response = await PATCH(
      new Request('http://localhost/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: '지헌2' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })
})
