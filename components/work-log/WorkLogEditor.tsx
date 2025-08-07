'use client'

import { useEffect } from 'react'
import { useWorkLogStore } from '@/lib/stores/work-log-store'
import { useAutoSave } from '@/hooks/useAutoSave'
import TodoSection from './TodoSection'
import ROISection from './ROISection'
import FeedbackSection from './FeedbackSection'

export default function WorkLogEditor() {
  const { currentLog, isLoading, error, loadTodayLog, clearError } = useWorkLogStore()
  const { isSaving, lastSavedAt, isDirty } = useAutoSave()

  useEffect(() => {
    // Check if we have data in local storage first
    const state = useWorkLogStore.getState()
    
    // If we have a checkInDate, use that; otherwise use today
    const targetDate = state.checkInDate || new Date().toISOString().split('T')[0]
    
    if (state.currentLog && state.currentLog.date === targetDate) {
      // We have the correct log in local storage, no need to load from DB
      console.log('Using work log from local storage for date:', targetDate)
    } else {
      // Load from DB with the check-in date
      loadTodayLog(state.checkInDate)
    }
  }, [])

  if (isLoading && !currentLog) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl" />
        <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl" />
        <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl" />
      </div>
    )
  }

  if (!currentLog) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">업무일지를 불러오는 중 오류가 발생했습니다.</p>
        <button
          onClick={loadTodayLog}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 저장 상태 표시 */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold text-gray-800">
          📝 {new Date(currentLog.date).toLocaleDateString('ko-KR', { 
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          })} 업무일지
        </h2>
        
        <div className="flex items-center gap-2 text-sm">
          {isSaving ? (
            <span className="text-blue-600 flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              저장 중...
            </span>
          ) : isDirty ? (
            <span className="text-yellow-600">• 저장 대기 중</span>
          ) : lastSavedAt ? (
            <span className="text-green-600">
              ✓ {new Date(lastSavedAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })} 저장됨
            </span>
          ) : null}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            ⚠️ {error}
          </span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* 각 섹션 */}
      <TodoSection />
      <ROISection />
      <FeedbackSection />

      {/* 안내 메시지 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 모든 변경사항은 자동으로 저장됩니다. 
          로컬 저장소에 1초마다, 서버에는 5초마다 자동 저장됩니다.
        </p>
      </div>
    </div>
  )
}