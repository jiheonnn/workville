'use client'

import type { TodoItem } from '@/types/database'
import PriorityTodoGroups from './PriorityTodoGroups'

interface WorkLogDisplayProps {
  content?: string
  todos?: TodoItem[]
  completed_todos?: TodoItem[]
  roi_high?: string
  roi_low?: string
  tomorrow_priority?: string
  feedback?: string
}

export default function WorkLogDisplay({
  content,
  todos,
  completed_todos,
  roi_high,
  roi_low,
  tomorrow_priority,
  feedback
}: WorkLogDisplayProps) {
  // Parse content to check for multiple sessions
  const renderContent = (text: string) => {
    const sessions = text.split(/\[세션 \d+\]/)
    const hasMultipleSessions = sessions.length > 1
    
    if (hasMultipleSessions) {
      return (
        <div className="space-y-4">
          {sessions.map((sessionContent, index) => {
            if (!sessionContent.trim()) return null
            const sessionNumber = index === 0 ? null : index
            
            return (
              <div key={index} className="border-l-4 border-blue-400 pl-4">
                {sessionNumber && (
                  <div className="text-xs font-semibold text-blue-600 mb-2">
                    세션 {sessionNumber}
                  </div>
                )}
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {sessionContent.replace(/^[\n\r-]+|[\n\r-]+$/g, '').trim()}
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    
    return (
      <div className="text-sm text-gray-700 whitespace-pre-wrap">
        {text}
      </div>
    )
  }

  // Parse fields that might have multiple entries separated by ---
  const renderMultipleEntries = (text: string, label: string) => {
    const entries = text.split('---').map(e => e.trim()).filter(e => e)
    
    if (entries.length > 1) {
      return (
        <div>
          <span className="font-semibold">{label}:</span>
          <div className="mt-1 space-y-2">
            {entries.map((entry, index) => (
              <div key={index} className="pl-4 border-l-2 border-gray-300">
                <span className="text-xs text-gray-500">항목 {index + 1}</span>
                <div className="text-sm">{entry}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    
    return (
      <div>
        <span className="font-semibold">{label}:</span> {text}
      </div>
    )
  }
  // If we have structured data, display it nicely
  if (todos || completed_todos || roi_high || roi_low || tomorrow_priority || feedback) {
    return (
      <div className="space-y-4">
        {/* 오늘 할 일 */}
        {todos && todos.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              ✈️ 오늘 할 일
            </h4>
            <PriorityTodoGroups todos={todos} completed={false} />
          </div>
        )}

        {/* 완료한 일 */}
        {completed_todos && completed_todos.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              ✅ 완료한 일
            </h4>
            <PriorityTodoGroups todos={completed_todos} completed />
          </div>
        )}

        {/* ROI 자가 진단 */}
        {(roi_high || roi_low || tomorrow_priority) && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              💡 ROI 자가 진단
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              {roi_high && renderMultipleEntries(roi_high, 'ROI 높은 일')}
              {roi_low && renderMultipleEntries(roi_low, 'ROI 낮은 일')}
              {tomorrow_priority && renderMultipleEntries(tomorrow_priority, '내일 우선순위')}
            </div>
          </div>
        )}

        {/* 자가 피드백 */}
        {feedback && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              ✅ 자가 피드백
            </h4>
            <div className="text-sm text-gray-700">
              {renderMultipleEntries(feedback, '')}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback to plain text content
  if (content) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl overflow-auto max-h-96 border border-gray-200">
        {renderContent(content)}
      </div>
    )
  }

  return (
    <div className="text-gray-500 text-center py-4">
      업무일지 내용이 없습니다.
    </div>
  )
}
