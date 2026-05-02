import { describe, expect, it } from 'vitest'

import { getMainContentClassName } from './main-content-layout'

describe('getMainContentClassName', () => {
  it('village 페이지는 업무일지 패널 확장을 위해 더 넓은 최대폭을 사용합니다', () => {
    const className = getMainContentClassName({
      pathname: '/village',
      hideMainNavigation: false,
    })

    expect(className).toContain('max-w-[1536px]')
    expect(className).not.toContain('max-w-7xl')
  })

  it('village 외 메인 페이지는 기존 최대폭을 유지합니다', () => {
    const className = getMainContentClassName({
      pathname: '/logs',
      hideMainNavigation: false,
    })

    expect(className).toContain('max-w-7xl')
    expect(className).not.toContain('max-w-[1536px]')
  })

  it('팀 온보딩 화면의 여백 정책은 기존과 동일하게 유지합니다', () => {
    const className = getMainContentClassName({
      pathname: '/team',
      hideMainNavigation: true,
    })

    expect(className).toContain('py-12')
    expect(className).toContain('px-4')
    expect(className).not.toContain('pb-20')
  })
})
