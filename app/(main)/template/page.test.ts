import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectMock = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

describe('/template page', () => {
  beforeEach(() => {
    redirectMock.mockReset()
  })

  it('별도 작성 탭 대신 village로 리다이렉트합니다', async () => {
    const pageModule = await import('./page')

    pageModule.default()

    expect(redirectMock).toHaveBeenCalledWith('/village')
  })
})
