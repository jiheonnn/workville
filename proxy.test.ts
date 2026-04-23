import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const createServerClientMock = vi.hoisted(() => vi.fn())

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

function createProxySupabase({
  userId,
  profile,
}: {
  userId: string | null
  profile?: { character_type: number | null; active_team_id: string | null } | null
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: userId ? { id: userId } : null,
        },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: profile ?? null,
        error: null,
      }),
    }),
  }
}

const { proxy } = await import('./proxy')

describe('proxy', () => {
  beforeEach(() => {
    createServerClientMock.mockReset()
  })

  it('캐릭터를 아직 선택하지 않은 사용자의 API 요청은 그대로 통과시킵니다', async () => {
    createServerClientMock.mockReturnValue(
      createProxySupabase({
        userId: 'user-1',
        profile: {
          character_type: null,
          active_team_id: null,
        },
      })
    )

    const request = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
    })

    const response = await proxy(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('캐릭터를 아직 선택하지 않은 사용자의 페이지 요청은 선택 화면으로 이동시킵니다', async () => {
    createServerClientMock.mockReturnValue(
      createProxySupabase({
        userId: 'user-1',
        profile: {
          character_type: null,
          active_team_id: null,
        },
      })
    )

    const request = new NextRequest('http://localhost/team')

    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/character-select')
  })
})
