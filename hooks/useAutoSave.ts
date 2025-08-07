import { useEffect, useRef, useCallback } from 'react'
import { useWorkLogStore } from '@/lib/stores/work-log-store'
import { debounce } from '@/lib/utils'

export function useAutoSave() {
  const { currentLog, isDirty, saveToDB, saveToLocalStorage } = useWorkLogStore()
  const saveTimerRef = useRef<NodeJS.Timeout>()

  // Debounced save to localStorage (1 second)
  const debouncedLocalSave = useCallback(
    debounce(() => {
      if (isDirty) {
        saveToLocalStorage()
        console.log('Auto-saved to localStorage')
      }
    }, 1000),
    [isDirty]
  )

  // Save to DB every 5 seconds if dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        saveToDB()
        console.log('Auto-saved to database')
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isDirty, saveToDB])

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
        saveToDB()
        // Some browsers require returnValue to be set
        e.returnValue = '변경사항이 저장되지 않았습니다. 페이지를 나가시겠습니까?'
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isDirty) {
        saveToDB()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isDirty, saveToDB])

  return {
    isSaving: useWorkLogStore.getState().isLoading,
    lastSavedAt: useWorkLogStore.getState().lastSavedAt,
    isDirty
  }
}