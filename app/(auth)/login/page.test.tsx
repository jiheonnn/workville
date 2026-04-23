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
  it('로고 중심 로그인 레이아웃의 핵심 요소를 렌더합니다', () => {
    const html = renderToStaticMarkup(<LoginPage />)

    expect(html).toContain('워크빌')
    expect(html).toContain('Workville 로고')
    expect(html).toContain('회원가입')
    expect(html).toContain('비밀번호를 잊으셨나요?')
    expect(html).toContain('이메일')
    expect(html).toContain('비밀번호')
  })
})
