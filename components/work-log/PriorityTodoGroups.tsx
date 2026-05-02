import type { TodoItem } from '@/types/database'
import {
  PRIORITY_ORDER,
  TODO_PRIORITY_LABELS,
  groupTodosByPriority,
} from '@/lib/work-log/todo-priority'

interface PriorityTodoGroupsProps {
  todos: TodoItem[]
  completed: boolean
}

export default function PriorityTodoGroups({ todos, completed }: PriorityTodoGroupsProps) {
  const groups = groupTodosByPriority(todos)

  return (
    <div className="space-y-3">
      {PRIORITY_ORDER.map((priority) => {
        const priorityTodos = groups[priority]
        if (priorityTodos.length === 0) {
          return null
        }

        return (
          <div key={priority} className="space-y-1">
            <div className="text-xs font-bold text-gray-500">
              {TODO_PRIORITY_LABELS[priority]}
            </div>
            <ul className="space-y-1 text-sm">
              {priorityTodos.map((todo, index) => (
                <li key={todo.id || index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-gray-400">
                    {completed ? '✓' : todo.completed ? '☑️' : '☐'}
                  </span>
                  <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                    {todo.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
