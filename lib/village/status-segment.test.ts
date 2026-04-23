import { describe, expect, it } from 'vitest'

import { VILLAGE_STATUS_SEGMENTS } from './status-segment'

describe('VILLAGE_STATUS_SEGMENTS', () => {
  it('출근, 휴식, 퇴근 순서와 라벨 및 이모지를 고정합니다', () => {
    expect(VILLAGE_STATUS_SEGMENTS.map((segment) => ({
      status: segment.status,
      label: segment.label,
      emoji: segment.emoji,
    }))).toEqual([
      { status: 'working', label: '출근', emoji: '💼' },
      { status: 'break', label: '휴식', emoji: '☕' },
      { status: 'home', label: '퇴근', emoji: '🏠' },
    ])
  })

  it('현재 서비스의 상태별 강조 컬러 계약을 유지합니다', () => {
    expect(VILLAGE_STATUS_SEGMENTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'working',
          activeClassName: expect.stringContaining('from-blue-500'),
        }),
        expect.objectContaining({
          status: 'break',
          activeClassName: expect.stringContaining('from-purple-500'),
        }),
        expect.objectContaining({
          status: 'home',
          activeClassName: expect.stringContaining('from-gray-500'),
        }),
      ])
    )
  })
})
