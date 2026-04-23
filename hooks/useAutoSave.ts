import { useEffect, useMemo, useRef } from 'react'
import { useWorkLogStore } from '@/lib/stores/work-log-store'
import { debounce } from '@/lib/utils'

export function useAutoSave() {
  const {
    currentLog,
    isDirty,
    isSaving,
    hasConflict,
    lastSavedAt,
    saveToDB,
    saveToLocalStorage,
    flushPendingSave,
  } = useWorkLogStore()
  const latestStateRef = useRef({
    isDirty,
    isSaving,
    hasConflict,
  })

  useEffect(() => {
    latestStateRef.current = {
      isDirty,
      isSaving,
      hasConflict,
    }
  }, [hasConflict, isDirty, isSaving])

  // Debounced save to localStorage (1 second)
  const debouncedLocalSave = useMemo(
    () => debounce(() => {
      if (isDirty) {
        saveToLocalStorage()
        console.log('Auto-saved to localStorage')
      }
    }, 1000),
    [isDirty, saveToLocalStorage]
  )

  // Save to DB every 5 seconds if dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty && !isSaving && !hasConflict) {
        saveToDB()
        console.log('Auto-saved to database')
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [hasConflict, isDirty, isSaving, saveToDB])

  // Save to localStorage when currentLog changes
  useEffect(() => {
    if (currentLog && isDirty) {
      debouncedLocalSave()
    }
  }, [currentLog, isDirty, debouncedLocalSave])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        if (!hasConflict && !isSaving) {
          saveToDB()
        }
        // Some browsers require returnValue to be set
        e.returnValue = '변경사항이 저장되지 않았습니다. 페이지를 나가시겠습니까?'
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isDirty && !hasConflict && !isSaving) {
        saveToDB()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasConflict, isDirty, isSaving, saveToDB])

  useEffect(() => {
    return () => {
      const latestState = latestStateRef.current

      // 이유:
      // village 안에서 다른 탭으로 이동하면 beforeunload 이벤트가 발생하지 않으므로,
      // 언마운트 직전에 dirty draft를 한 번 더 flush해야 5초 주기 저장 공백을 줄일 수 있습니다.
      if (latestState.isDirty && !latestState.isSaving && !latestState.hasConflict) {
        void flushPendingSave()
      }
    }
  }, [flushPendingSave])

  return {
    isSaving,
    lastSavedAt,
    isDirty,
    hasConflict,
  }
}
