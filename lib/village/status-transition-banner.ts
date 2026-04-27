import type { UserStatus } from '@/lib/types'

export interface StatusTransitionBanner {
  tone: 'info'
  title: string
  message: string
  autoCloseMs: number
}

const STATUS_TRANSITION_BANNER_MS = 3000

export function getStatusTransitionBanner(
  previousStatus: UserStatus,
  nextStatus: UserStatus
): StatusTransitionBanner | null {
  if (previousStatus === nextStatus) {
    return null
  }

  if (nextStatus === 'working') {
    return {
      tone: 'info',
      title: previousStatus === 'break' ? '업무로 돌아왔어요' : '출근했어요',
      message:
        previousStatus === 'break'
          ? '좋아요. 다시 천천히 집중 모드로 들어가볼게요.'
          : '오늘도 차근차근 좋은 흐름으로 시작해봐요.',
      autoCloseMs: STATUS_TRANSITION_BANNER_MS,
    }
  }

  if (nextStatus === 'break') {
    return {
      tone: 'info',
      title: '휴식을 시작했어요',
      message: '잠깐의 휴식은 업무 효율을 높여요!',
      autoCloseMs: STATUS_TRANSITION_BANNER_MS,
    }
  }

  return {
    tone: 'info',
    title: '퇴근했어요',
    message: '오늘도 수고 많으셨어요. 이제 편히 쉬어도 좋아요.',
    autoCloseMs: STATUS_TRANSITION_BANNER_MS,
  }
}
