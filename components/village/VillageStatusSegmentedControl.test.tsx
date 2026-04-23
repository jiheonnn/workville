import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import VillageStatusSegmentedControl from './VillageStatusSegmentedControl'

describe('VillageStatusSegmentedControl', () => {
  it('출근, 휴식, 퇴근 세그먼트를 이모지와 함께 렌더합니다', () => {
    const html = renderToStaticMarkup(
      <VillageStatusSegmentedControl currentStatus="working" onStatusChange={vi.fn()} />
    )

    expect(html).toContain('💼')
    expect(html).toContain('출근')
    expect(html).toContain('☕')
    expect(html).toContain('휴식')
    expect(html).toContain('🏠')
    expect(html).toContain('퇴근')
  })

  it('현재 상태 세그먼트만 강조 스타일을 사용합니다', () => {
    const html = renderToStaticMarkup(
      <VillageStatusSegmentedControl currentStatus="break" onStatusChange={vi.fn()} />
    )

    expect(html).toContain('from-purple-500')
    expect(html).not.toContain('from-blue-500')
    expect(html).toContain('translateX(100%)')
    expect(html).toContain('border-gray-200')
  })
})
