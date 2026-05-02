'use client'

import { type ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'

import {
  TODO_PRIORITY_LABELS,
  type TodoPriorityGroups,
} from '@/lib/work-log/todo-priority'
import type { TodoItem, TodoPriority } from '@/types/database'

interface TodoPriorityColumnProps {
  priority: TodoPriority
  todos: TodoItem[]
  children: ReactNode
  isDragTarget?: boolean
  showEmptyInsertionIndicator?: boolean
}

export const TODO_INSERTION_INDICATOR_CLASS_NAME =
  'pointer-events-none absolute left-0 right-0 z-10 h-0.5 rounded-full bg-blue-400'

const PRIORITY_COLUMN_CLASS_NAMES: Record<
  TodoPriority,
  {
    section: string
    active: string
    badge: string
    empty: string
  }
> = {
  high: {
    section: 'border-orange-200 bg-orange-50/70',
    active: 'border-orange-300 bg-orange-100/80 ring-2 ring-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    empty: 'border-orange-200 bg-orange-50/70 text-orange-600',
  },
  normal: {
    section: 'border-blue-200 bg-blue-50/70',
    active: 'border-blue-300 bg-blue-100/80 ring-2 ring-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    empty: 'border-blue-200 bg-blue-50/70 text-blue-600',
  },
  low: {
    section: 'border-green-200 bg-green-50/70',
    active: 'border-green-300 bg-green-100/80 ring-2 ring-green-200',
    badge: 'bg-green-100 text-green-700',
    empty: 'border-green-200 bg-green-50/70 text-green-600',
  },
}

export function getPriorityColumnClassNames(priority: TodoPriority) {
  return PRIORITY_COLUMN_CLASS_NAMES[priority]
}

export function TodoInsertionIndicator({
  placement = 'before',
}: {
  placement?: 'before' | 'after'
}) {
  return (
    <div
      aria-hidden="true"
      className={`${TODO_INSERTION_INDICATOR_CLASS_NAME} ${
        placement === 'after' ? '-bottom-1' : '-top-1'
      }`}
    />
  )
}

export function TodoPriorityColumn({
  priority,
  todos,
  children,
  isDragTarget = false,
  showEmptyInsertionIndicator = false,
}: TodoPriorityColumnProps) {
  const colorClassNames = getPriorityColumnClassNames(priority)
  const { setNodeRef, isOver } = useDroppable({
    id: `priority:${priority}`,
    data: {
      priority,
      index: todos.length,
    },
  })

  return (
    <section
      ref={setNodeRef}
      className={`rounded-xl border p-3 transition-all ${colorClassNames.section} ${
        isOver || isDragTarget ? colorClassNames.active : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-black text-gray-700">{TODO_PRIORITY_LABELS[priority]}</h4>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colorClassNames.badge}`}>
          {todos.length}
        </span>
      </div>

      <div className="space-y-2">
        {children}
        {todos.length === 0 && (
          <div className={`relative rounded-lg border border-dashed px-3 py-4 text-center text-xs font-medium ${colorClassNames.empty}`}>
            {showEmptyInsertionIndicator && <TodoInsertionIndicator />}
            이 영역으로 끌어 놓으세요
          </div>
        )}
      </div>
    </section>
  )
}

export function getPriorityColumnItems(
  groups: TodoPriorityGroups,
  priority: TodoPriority
) {
  return groups[priority].map((todo) => todo.id)
}
