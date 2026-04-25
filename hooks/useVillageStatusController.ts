'use client'

import { useEffect, useMemo, useState } from 'react'

import { useVillageStore } from '@/lib/stores/village-store'
import { type UserStatus } from '@/lib/types'
import { getTodayKorea } from '@/lib/utils/date'
import { createVillageTraceId, logVillageDebug } from '@/lib/village/debug'
import { getDisplayedStatusSummary } from '@/lib/village/status-summary'

export function useVillageStatusController() {
  const [showWorkLogModal, setShowWorkLogModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const {
    currentUserStatus,
    todaySessions,
    completedDurationMinutes,
    error,
    fetchCurrentStatus,
    updateMyStatus,
  } = useVillageStore()

  useEffect(() => {
    void fetchCurrentStatus()

    const initializeCheckInDate = async () => {
      try {
        const sessionResponse = await fetch('/api/work-sessions/today')
        if (!sessionResponse.ok) {
          return
        }

        const { session } = await sessionResponse.json()
        if (session && session.date && !session.check_out_time) {
          const { setCheckInDate } = await import('@/lib/stores/work-log-store').then(
            (module) => module.useWorkLogStore.getState()
          )

          setCheckInDate(session.date)
        }
      } catch (initializeError) {
        console.error('Failed to initialize checkInDate:', initializeError)
      }
    }

    void initializeCheckInDate()

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [fetchCurrentStatus])

  const statusSummary = useMemo(
    () =>
      getDisplayedStatusSummary({
        currentUserStatus,
        currentTime,
        todaySessions,
        completedDurationMinutes,
      }),
    [currentTime, currentUserStatus, todaySessions, completedDurationMinutes]
  )

  const latestCheckInTime = useMemo(() => {
    if (!todaySessions || todaySessions.length === 0) {
      return null
    }

    return todaySessions[todaySessions.length - 1]?.check_in_time ?? null
  }, [todaySessions])

  const handleStatusChange = (newStatus: UserStatus) => {
    const traceId = createVillageTraceId(newStatus)

    logVillageDebug('VillageStatusController: click', {
      traceId,
      currentUserStatus,
      newStatus,
    })

    if (currentUserStatus === newStatus) {
      logVillageDebug('VillageStatusController: skipped same status', {
        traceId,
        status: newStatus,
      })
      return
    }

    if ((currentUserStatus === 'working' || currentUserStatus === 'break') && newStatus === 'home') {
      logVillageDebug('VillageStatusController: open work log modal', {
        traceId,
        previousStatus: currentUserStatus,
      })
      setShowWorkLogModal(true)
      return
    }

    void updateMyStatus(newStatus, traceId)
      .then(async (success) => {
        logVillageDebug('VillageStatusController: updateMyStatus resolved', {
          traceId,
          success,
          status: newStatus,
        })

        if (!success || newStatus !== 'working') {
          return
        }

        try {
          // 이유:
          // 출근 직후 업무일지 대상 날짜는 현재 활성 세션과 같은 KST date를 사용해야
          // 밤샘 근무/재출근 시에도 편집 대상이 API와 어긋나지 않습니다.
          const today = getTodayKorea()
          const sessionResponse = await fetch('/api/work-sessions/today')
          let checkInDate = today

          if (sessionResponse.ok) {
            const { session } = await sessionResponse.json()
            if (session && session.date && !session.check_out_time) {
              checkInDate = session.date
            }
          }

          const { setCheckInDate } = await import('@/lib/stores/work-log-store').then(
            (module) => module.useWorkLogStore.getState()
          )

          setCheckInDate(checkInDate)
        } catch (initializeError) {
          console.error('Failed to initialize work log date:', initializeError)
        }
      })
      .catch((updateError) => {
        console.error('Failed to update status:', updateError)
      })
  }

  const handleWorkLogSubmit = async () => {
    const traceId = createVillageTraceId('home')
    const success = await updateMyStatus('home', traceId)

    logVillageDebug('VillageStatusController: work log submit resolved', {
      traceId,
      success,
    })

    if (!success) {
      return
    }

    setShowWorkLogModal(false)

    const { setCheckInDate } = await import('@/lib/stores/work-log-store').then(
      (module) => module.useWorkLogStore.getState()
    )
    setCheckInDate('')
  }

  const handleWorkLogSkip = () => {
    setShowWorkLogModal(false)
  }

  return {
    currentUserStatus,
    error,
    latestCheckInTime,
    showWorkLogModal,
    statusSummary,
    handleStatusChange,
    handleWorkLogSubmit,
    handleWorkLogSkip,
  }
}
