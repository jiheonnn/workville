'use client'

import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'

import type { TodoItem, TodoPriority } from '@/types/database'
import TodoTextarea from './TodoTextarea'

export const TODO_DRAG_HANDLE_CLASS_NAME =
  'mt-0.5 flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing'

export const TODO_DRAGGING_ITEM_CLASS_NAME = 'opacity-0'

interface SortableTodoItemProps {
  todo: TodoItem
  priority: TodoPriority
  index: number
  isCarriedOver: boolean
  displayText: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onTextChange: (id: string, text: string) => void
}

export function getTodoDragHandleAriaLabel(text: string) {
  return `${text || '할 일'} 우선순위 이동`
}

export default function SortableTodoItem({
  todo,
  priority,
  index,
  isCarriedOver,
  displayText,
  onToggle,
  onDelete,
  onTextChange,
}: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: {
      priority,
      index,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex items-start gap-3 rounded-lg bg-white p-3 transition-all hover:shadow-sm ${
        isDragging ? TODO_DRAGGING_ITEM_CLASS_NAME : ''
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        className={TODO_DRAG_HANDLE_CLASS_NAME}
        aria-label={getTodoDragHandleAriaLabel(displayText)}
        {...attributes}
        {...listeners}
      >
        <span className="text-lg leading-none">☰</span>
      </button>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
      />
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {isCarriedOver && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
            어제 못한일
          </span>
        )}
        <TodoTextarea
          value={displayText}
          onChange={(value) => {
            const newText = isCarriedOver ? `[어제 못한일] ${value}` : value
            onTextChange(todo.id, newText)
          }}
          placeholder="할 일을 입력하세요"
        />
      </div>
      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        className="text-gray-400 hover:text-red-500 transition-colors"
        aria-label={`${displayText || '할 일'} 삭제`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
