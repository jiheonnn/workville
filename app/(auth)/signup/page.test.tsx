import { beforeEach, describe, expect, it, vi } from 'vitest'

import SignupPage from './page'

const redirectMock = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

describe('/signup page', () => {
  beforeEach(() => {
    redirectMock.mockReset()
  })

  it('회원가입 경로로 접근하면 로그인 화면으로 이동시킵니다', async () => {
    await SignupPage()

    expect(redirectMock).toHaveBeenCalledWith('/login')
  })
})
