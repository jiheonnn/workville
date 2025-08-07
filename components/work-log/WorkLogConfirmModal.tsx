'use client'

import { useEffect, useState } from 'react'
import { useWorkLogStore } from '@/lib/stores/work-log-store'

interface WorkLogConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

interface WorkLog {
  todos: Array<{ text: string; completed: boolean }>
  completed_todos: Array<{ text: string }>
  roi_high: string
  roi_low: string
  tomorrow_priority: string
  feedback: string
}

export default function WorkLogConfirmModal({ isOpen, onClose, onConfirm }: WorkLogConfirmModalProps) {
  const [workLog, setWorkLog] = useState<WorkLog | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [displayDate, setDisplayDate] = useState<string | null>(null)
  const { checkInDate } = useWorkLogStore()

  useEffect(() => {
    if (isOpen) {
      fetchTodayWorkLog()
    } else {
      // Reset state when modal closes
      setWorkLog(null)
    }
  }, [isOpen, checkInDate])

  const fetchTodayWorkLog = async () => {
    setIsLoading(true)
    try {
      // First try to get active session to determine the correct date
      let targetDate = checkInDate
      
      if (!targetDate) {
        // If no checkInDate in store, try to get from active session
        try {
          const sessionResponse = await fetch('/api/work-sessions/today')
          if (sessionResponse.ok) {
            const { session } = await sessionResponse.json()
            if (session && session.date) {
              targetDate = session.date
              console.log('Using date from active session:', targetDate)
            }
          }
        } catch (error) {
          console.error('Failed to fetch active session:', error)
        }
      }
      
      // If still no date, use today
      if (!targetDate) {
        targetDate = new Date().toISOString().split('T')[0]
        console.log('No active session found, using today:', targetDate)
      }
      
      console.log('Fetching work log for date:', targetDate)
      setDisplayDate(targetDate)
      
      const response = await fetch(`/api/work-logs?date=${targetDate}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch work log')
      }

      const { logs } = await response.json()
      console.log('Fetched logs:', logs)
      console.log('Target date:', targetDate)
      
      if (logs && logs.length > 0) {
        // Filter logs to find the exact date match
        const targetLog = logs.find((log: any) => log.date === targetDate)
        
        if (targetLog) {
          console.log('Found log for target date:', targetLog)
          // Ensure arrays are properly formatted
          setWorkLog({
            todos: Array.isArray(targetLog.todos) ? targetLog.todos : [],
            completed_todos: Array.isArray(targetLog.completed_todos) ? targetLog.completed_todos : [],
            roi_high: targetLog.roi_high || '',
            roi_low: targetLog.roi_low || '',
            tomorrow_priority: targetLog.tomorrow_priority || '',
            feedback: targetLog.feedback || ''
          })
        } else {
          console.log('No log found matching target date in returned logs')
          console.log('First log date:', logs[0].date)
          console.log('All log dates:', logs.map((l: any) => l.date))
          setWorkLog(null)
        }
      } else {
        console.log('No work log found for date:', targetDate)
        setWorkLog(null)
      }
    } catch (err) {
      console.error('Error fetching work log:', err)
      setWorkLog(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100 animate-slideIn">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
          <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            업무일지 확인
          </h2>
          <p className="text-gray-600 mt-1 text-sm">
            {displayDate ? `${displayDate} 업무일지` : '퇴근 전 오늘의 업무를 확인해주세요'}
          </p>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-100 rounded-xl" />
              <div className="h-32 bg-gray-100 rounded-xl" />
              <div className="h-32 bg-gray-100 rounded-xl" />
            </div>
          ) : workLog ? (
            <div className="space-y-6">
              {/* 오늘 할 일 */}
              {workLog.todos && workLog.todos.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    ✈️ 오늘 할 일
                  </h3>
                  <ul className="space-y-1">
                    {workLog.todos.map((todo, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-gray-400">
                          {todo.completed ? '☑️' : '☐'}
                        </span>
                        <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                          {todo.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 완료한 일 */}
              {workLog.completed_todos && workLog.completed_todos.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    ✅ 완료한 일
                  </h3>
                  <ul className="space-y-1">
                    {workLog.completed_todos.map((todo, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span>✓</span>
                        <span>{todo.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ROI 자가 진단 */}
              {(workLog.roi_high || workLog.roi_low || workLog.tomorrow_priority) && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    💡 ROI 자가 진단
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    {workLog.roi_high && (
                      <div>
                        <span className="font-semibold">ROI 높은 일:</span> {workLog.roi_high}
                      </div>
                    )}
                    {workLog.roi_low && (
                      <div>
                        <span className="font-semibold">ROI 낮은 일:</span> {workLog.roi_low}
                      </div>
                    )}
                    {workLog.tomorrow_priority && (
                      <div>
                        <span className="font-semibold">내일 우선순위:</span> {workLog.tomorrow_priority}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 자가 피드백 */}
              {workLog.feedback && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    ✅ 자가 피드백
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{workLog.feedback}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              오늘 작성한 업무일지가 없습니다.
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200"
          >
            취소
          </button>
          
          <button
            onClick={onConfirm}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2"
          >
            확인 후 퇴근 →
          </button>
        </div>
      </div>
    </div>
  )
}