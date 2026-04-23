import { describe, expect, it } from 'vitest'

import { shouldHideMainNavigation } from './layout-visibility'

describe('shouldHideMainNavigation', () => {
  it('팀이 없는 사용자가 팀 페이지에 있으면 메뉴를 숨깁니다', () => {
    expect(shouldHideMainNavigation('/team', null)).toBe(true)
    expect(shouldHideMainNavigation('/team', undefined)).toBe(true)
  })

  it('활성 팀이 있으면 팀 페이지에서도 메뉴를 유지합니다', () => {
    expect(shouldHideMainNavigation('/team', 'team-1')).toBe(false)
  })

  it('다른 메인 페이지에서는 활성 팀이 없더라도 이 함수가 메뉴를 숨기지 않습니다', () => {
    expect(shouldHideMainNavigation('/village', null)).toBe(false)
    expect(shouldHideMainNavigation('/stats', null)).toBe(false)
  })
})
