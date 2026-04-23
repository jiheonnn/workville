import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import VillageStatusSummaryCard from './VillageStatusSummaryCard'

describe('VillageStatusSummaryCard', () => {
  it('근무 요약과 최근 출근 시간을 함께 표시합니다', () => {
    const html = renderToStaticMarkup(
      <VillageStatusSummaryCard
        label="오늘 근무"
        totalMinutes={135}
        latestCheckInTime="2026-04-23T00:00:00.000Z"
      />
    )

    expect(html).toContain('오늘 근무')
    expect(html).toContain('2시간 15분')
    expect(html).toContain('최근 출근')
  })

  it('최근 출근 시간이 없으면 보조 문구를 숨깁니다', () => {
    const html = renderToStaticMarkup(
      <VillageStatusSummaryCard
        label="휴식 시간"
        totalMinutes={20}
        latestCheckInTime={null}
      />
    )

    expect(html).toContain('20분')
    expect(html).not.toContain('최근 출근')
  })
})
