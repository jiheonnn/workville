import type { TodoItem, TodoPriority } from '@/types/database'

export const PRIORITY_ORDER = ['high', 'normal', 'low'] as const satisfies readonly TodoPriority[]
export const DEFAULT_TODO_PRIORITY: TodoPriority = 'normal'

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  high: '높음',
  normal: '보통',
  low: '낮음',
}

export type TodoPriorityGroups = Record<TodoPriority, TodoItem[]>

export function isTodoPriority(value: unknown): value is TodoPriority {
  return value === 'high' || value === 'normal' || value === 'low'
}

export function normalizeTodoPriority(value: unknown): TodoPriority {
  return isTodoPriority(value) ? value : DEFAULT_TODO_PRIORITY
}

export function normalizeTodoItem(todo: Partial<TodoItem> & { text?: string }, index: number): TodoItem {
  return {
    id: typeof todo.id === 'string' && todo.id.length > 0 ? todo.id : `${Date.now()}-${index}`,
    text: typeof todo.text === 'string' ? todo.text : '',
    completed: Boolean(todo.completed),
    order: typeof todo.order === 'number' ? todo.order : index,
    priority: normalizeTodoPriority(todo.priority),
  }
}

export function normalizeTodoItems(todos: unknown): TodoItem[] {
  if (!Array.isArray(todos)) {
    return []
  }

  return todos.map((todo, index) => normalizeTodoItem(todo as Partial<TodoItem>, index))
}

export function groupTodosByPriority(todos: TodoItem[]): TodoPriorityGroups {
  const groups: TodoPriorityGroups = {
    high: [],
    normal: [],
    low: [],
  }

  normalizeTodoItems(todos).forEach((todo) => {
    groups[todo.priority || DEFAULT_TODO_PRIORITY].push(todo)
  })

  PRIORITY_ORDER.forEach((priority) => {
    groups[priority].sort((left, right) => (left.order || 0) - (right.order || 0))
  })

  return groups
}

function flattenPriorityGroups(groups: TodoPriorityGroups): TodoItem[] {
  return PRIORITY_ORDER.flatMap((priority) =>
    groups[priority].map((todo, index) => ({
      ...todo,
      priority,
      order: index,
    }))
  )
}

export function moveTodoWithinPriorityGroups(
  todos: TodoItem[],
  todoId: string,
  targetPriority: TodoPriority,
  targetIndex: number
): TodoItem[] {
  const groups = groupTodosByPriority(todos)
  const sourcePriority = PRIORITY_ORDER.find((priority) =>
    groups[priority].some((todo) => todo.id === todoId)
  )

  if (!sourcePriority) {
    return flattenPriorityGroups(groups)
  }

  const sourceItems = groups[sourcePriority]
  const sourceIndex = sourceItems.findIndex((todo) => todo.id === todoId)
  const [movingTodo] = sourceItems.splice(sourceIndex, 1)
  const targetItems = groups[targetPriority]
  const safeTargetIndex = Math.min(Math.max(targetIndex, 0), targetItems.length)

  targetItems.splice(safeTargetIndex, 0, {
    ...movingTodo,
    priority: targetPriority,
  })

  return flattenPriorityGroups(groups)
}
