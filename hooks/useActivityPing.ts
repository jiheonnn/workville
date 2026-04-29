'use client'

import { useEffect, useRef } from 'react'

import { ACTIVITY_PING_MIN_INTERVAL_MINUTES } from '@/lib/work-sessions/auto-status'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const
const ACTIVITY_PING_MIN_INTERVAL_MS = ACTIVITY_PING_MIN_INTERVAL_MINUTES * 60 * 1000

export function useActivityPing(enabled: boolean) {
  const lastSentAtRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const sendActivityPing = () => {
      const now = Date.now()

      if (now - lastSentAtRef.current < ACTIVITY_PING_MIN_INTERVAL_MS) {
        return
      }

      lastSentAtRef.current = now

      void fetch('/api/activity', {
        method: 'POST',
        keepalive: true,
      }).catch((error) => {
        console.error('Failed to save activity ping:', error)
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendActivityPing()
      }
    }

    // 이유:
    // 자동 휴식/퇴근은 브라우저 안에서 확인 가능한 활동만 기준으로 삼습니다.
    // 이벤트마다 DB를 쓰지 않고 5분 간격으로 제한해 2시간/6시간 정책에 충분한 정확도만 유지합니다.
    sendActivityPing()
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, sendActivityPing, { passive: true })
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, sendActivityPing)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled])
}
