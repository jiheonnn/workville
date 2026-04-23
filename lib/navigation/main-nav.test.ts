import { describe, expect, it } from 'vitest'

import { MAIN_NAV_ITEMS } from './main-nav'

describe('MAIN_NAV_ITEMS', () => {
  it('업무 기록 탭을 포함하고 별도 작성 탭은 노출하지 않습니다', () => {
    expect(MAIN_NAV_ITEMS).toEqual([
      { href: '/village', label: '마을', icon: '🏘️' },
      { href: '/logs', label: '업무 기록', icon: '📝' },
      { href: '/stats', label: '통계', icon: '📊' },
    ])
  })
})
