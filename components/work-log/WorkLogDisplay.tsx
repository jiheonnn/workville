'use client'

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

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
            <ul className="space-y-1 text-sm">
              {todos.map((todo, index) => (
                <li key={todo.id || index} className="flex items-start gap-2 text-gray-700">
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
        {completed_todos && completed_todos.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              ✅ 완료한 일
            </h4>
            <ul className="space-y-1 text-sm">
              {completed_todos.map((todo, index) => (
                <li key={todo.id || index} className="flex items-start gap-2 text-gray-700">
                  <span>✓</span>
                  <span>{todo.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ROI 자가 진단 */}
        {(roi_high || roi_low || tomorrow_priority) && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              💡 ROI 자가 진단
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              {roi_high && (
                <div>
                  <span className="font-semibold">ROI 높은 일:</span> {roi_high}
                </div>
              )}
              {roi_low && (
                <div>
                  <span className="font-semibold">ROI 낮은 일:</span> {roi_low}
                </div>
              )}
              {tomorrow_priority && (
                <div>
                  <span className="font-semibold">내일 우선순위:</span> {tomorrow_priority}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 자가 피드백 */}
        {feedback && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              ✅ 자가 피드백
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback}</p>
          </div>
        )}
      </div>
    )
  }

  // Fallback to plain text content
  if (content) {
    return (
      <pre className="whitespace-pre-wrap font-sans text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl overflow-auto max-h-96 border border-gray-200">
        {content}
      </pre>
    )
  }

  return (
    <div className="text-gray-500 text-center py-4">
      업무일지 내용이 없습니다.
    </div>
  )
}