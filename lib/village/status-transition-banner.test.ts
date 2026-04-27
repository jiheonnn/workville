import { describe, expect, it } from 'vitest'

import { getStatusTransitionBanner } from './status-transition-banner'

describe('getStatusTransitionBanner', () => {
  it('근무에서 휴식으로 전환하면 휴식 시작 메시지를 반환합니다', () => {
    expect(getStatusTransitionBanner('working', 'break')).toEqual({
      tone: 'info',
      title: '휴식을 시작했어요',
      message: '잠깐의 휴식은 업무 효율을 높여요!',
      autoCloseMs: 3000,
    })
  })

  it('퇴근에서 근무로 전환하면 출근 메시지를 반환합니다', () => {
    expect(getStatusTransitionBanner('home', 'working')).toEqual({
      tone: 'info',
      title: '출근했어요',
      message: '오늘도 차근차근 좋은 흐름으로 시작해봐요.',
      autoCloseMs: 3000,
    })
  })

  it('근무 또는 휴식에서 퇴근으로 전환하면 퇴근 메시지를 반환합니다', () => {
    expect(getStatusTransitionBanner('working', 'home')).toEqual({
      tone: 'info',
      title: '퇴근했어요',
      message: '오늘도 수고 많으셨어요. 이제 편히 쉬어도 좋아요.',
      autoCloseMs: 3000,
    })
    expect(getStatusTransitionBanner('break', 'home')?.title).toBe('퇴근했어요')
  })
})
