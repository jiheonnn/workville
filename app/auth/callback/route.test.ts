import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.hoisted(() => vi.fn())
const exchangeCodeForSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

const { GET } = await import('./route')

describe('GET /auth/callback', () => {
  beforeEach(() => {
    exchangeCodeForSessionMock.mockReset()
    createClientMock.mockReset()
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: exchangeCodeForSessionMock,
      },
    })
  })

  it('code 교환에 성공하면 next 경로로 이동합니다', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })

    const response = await GET(new Request('http://localhost:3000/auth/callback?code=test-code&next=/team'))

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('test-code')
    expect(response.headers.get('location')).toBe('http://localhost:3000/team')
  })

  it('code 교환에 실패하면 로그인 화면으로 돌려보냅니다', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: new Error('oauth failed'),
    })

    const response = await GET(new Request('http://localhost:3000/auth/callback?code=test-code'))

    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=social_login_failed')
  })

  it('외부 next 경로는 무시하고 기본 화면으로 이동합니다', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })

    const response = await GET(
      new Request('http://localhost:3000/auth/callback?code=test-code&next=https://evil.example.com/phishing')
    )

    expect(response.headers.get('location')).toBe('http://localhost:3000/village')
  })
})
