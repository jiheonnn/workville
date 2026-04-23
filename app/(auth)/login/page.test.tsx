import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import LoginPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe('/login page', () => {
  it('Google 로그인 중심 레이아웃의 핵심 요소를 렌더합니다', () => {
    const html = renderToStaticMarkup(<LoginPage />)

    expect(html).toContain('Workville')
    expect(html).toContain('Workville 로고')
    expect(html).toContain('Google로 시작하기')
    expect(html).toContain('이메일 인증 없이')
    expect(html).not.toContain('회원가입')
    expect(html).not.toContain('비밀번호를 잊으셨나요?')
    expect(html).not.toContain('비밀번호')
    expect(html).not.toContain('name@workville.app')
  })
})
