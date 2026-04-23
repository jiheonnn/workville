import type { TodoItem } from '@/types/database'

export interface WorkLogSaveInput {
  content?: string
  todos?: TodoItem[]
  completed_todos?: TodoItem[]
  roi_high?: string
  roi_low?: string
  tomorrow_priority?: string
  feedback?: string
}

export interface NormalizedWorkLogSaveInput {
  content: string
  todos: TodoItem[]
  completed_todos: TodoItem[]
  roi_high: string
  roi_low: string
  tomorrow_priority: string
  feedback: string
}

export const buildWorkLogContent = ({
  todos,
  completed_todos,
  feedback,
}: Pick<NormalizedWorkLogSaveInput, 'todos' | 'completed_todos' | 'feedback'>) =>
  `## ✈️ 오늘 할 일\n${todos.map((todo) => `- [ ] ${todo.text}`).join('\n')}\n\n## ✅ 완료한 일\n${completed_todos.map((todo) => `- [x] ${todo.text}`).join('\n')}\n\n## ✅ 자가 피드백\n${feedback}`

export const normalizeWorkLogSaveInput = (
  input: WorkLogSaveInput
): NormalizedWorkLogSaveInput => {
  const todos = Array.isArray(input.todos) ? input.todos : []
  const completedTodos = Array.isArray(input.completed_todos) ? input.completed_todos : []
  const feedback = typeof input.feedback === 'string' ? input.feedback : ''
  const roiHigh = typeof input.roi_high === 'string' ? input.roi_high : ''
  const roiLow = typeof input.roi_low === 'string' ? input.roi_low : ''
  const tomorrowPriority =
    typeof input.tomorrow_priority === 'string' ? input.tomorrow_priority : ''
  const explicitContent = typeof input.content === 'string' ? input.content : ''

  return {
    content:
      explicitContent.trim().length > 0
        ? explicitContent
        : buildWorkLogContent({
            todos,
            completed_todos: completedTodos,
            feedback,
          }),
    todos,
    completed_todos: completedTodos,
    roi_high: roiHigh,
    roi_low: roiLow,
    tomorrow_priority: tomorrowPriority,
    feedback,
  }
}

export const isSameWorkLogPayload = (
  left: NormalizedWorkLogSaveInput,
  right: NormalizedWorkLogSaveInput
) =>
  left.content === right.content &&
  left.feedback === right.feedback &&
  left.roi_high === right.roi_high &&
  left.roi_low === right.roi_low &&
  left.tomorrow_priority === right.tomorrow_priority &&
  JSON.stringify(left.todos) === JSON.stringify(right.todos) &&
  JSON.stringify(left.completed_todos) === JSON.stringify(right.completed_todos)
