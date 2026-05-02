'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import {
  PRIORITY_ORDER,
  groupTodosByPriority,
  isTodoPriority,
} from '@/lib/work-log/todo-priority'
import type { TodoItem, TodoPriority } from '@/types/database'
import SortableTodoItem, {
  TODO_DRAGGING_ITEM_CLASS_NAME,
  TODO_DRAG_HANDLE_CLASS_NAME,
  getTodoDragHandleAriaLabel,
} from './SortableTodoItem'
import {
  TodoPriorityColumn,
  TodoInsertionIndicator,
  TODO_INSERTION_INDICATOR_CLASS_NAME,
  getPriorityColumnItems,
  getPriorityColumnClassNames,
} from './TodoPriorityColumn'

interface TodoPriorityBoardProps {
  todos: TodoItem[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onTextChange: (id: string, text: string) => void
  onMove: (id: string, priority: TodoPriority, targetIndex: number) => void
}

export interface TodoDropTarget {
  activeId: string
  priority: TodoPriority
  targetIndex: number
}

interface TodoDragTargetEvent {
  active: {
    id: string | number
  }
  activatorEvent?: Event
  delta?: {
    x: number
    y: number
  }
  over: {
    id: string | number
    rect?: {
      top: number
      bottom: number
    }
    data?: {
      current?: Record<string, unknown>
    }
  } | null
}

type TodoOverRect = NonNullable<TodoDragTargetEvent['over']>['rect']

export const TODO_DRAG_OVERLAY_CLASS_NAME =
  'pointer-events-none flex w-full items-start gap-3 rounded-lg bg-white p-3 text-gray-700 shadow-xl'

export const TODO_DRAG_OVERLAY_CURSOR_OFFSET = {
  x: 12,
  y: 12,
} as const

export const todoPriorityCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)

  if (pointerCollisions.length > 0) {
    return pointerCollisions
  }

  return closestCenter(args)
}

function getViewportCoordinates(event: Event) {
  if (
    'clientX' in event &&
    'clientY' in event &&
    typeof event.clientX === 'number' &&
    typeof event.clientY === 'number'
  ) {
    return {
      x: event.clientX,
      y: event.clientY,
    }
  }

  const touchEvent = event as TouchEvent
  const touch = touchEvent.touches?.[0] || touchEvent.changedTouches?.[0]

  if (!touch) {
    return null
  }

  return {
    x: touch.clientX,
    y: touch.clientY,
  }
}

function getPointerY(event: TodoDragTargetEvent) {
  const activatorCoordinates = event.activatorEvent
    ? getViewportCoordinates(event.activatorEvent)
    : null

  if (!activatorCoordinates || !event.delta) {
    return null
  }

  return activatorCoordinates.y + event.delta.y
}

function getTargetIndexFromPointer(
  overIndex: number,
  overRect: TodoOverRect | undefined,
  pointerY: number | null
) {
  if (!overRect || pointerY === null) {
    return overIndex
  }

  const overMiddleY = overRect.top + (overRect.bottom - overRect.top) / 2

  return pointerY > overMiddleY ? overIndex + 1 : overIndex
}

export const attachTodoOverlayToPointer: Modifier = ({
  active,
  activatorEvent,
  activeNodeRect,
  transform,
}) => {
  const activatorCoordinates = activatorEvent
    ? getViewportCoordinates(activatorEvent)
    : null

  if (!activatorCoordinates || !activeNodeRect) {
    return transform
  }

  const initialRect = active?.rect.current.initial || activeNodeRect

  // 이유: DragOverlay wrapper는 dnd-kit 내부에서 active.rect.current.initial을
  // 기준으로 fixed 배치됩니다. 다른 rect를 기준으로 보정하면 X 좌표가 중복으로
  // 더해져 카드가 화면 바깥까지 밀릴 수 있습니다.
  return {
    ...transform,
    x:
      transform.x +
      activatorCoordinates.x -
      initialRect.left +
      TODO_DRAG_OVERLAY_CURSOR_OFFSET.x,
    y:
      transform.y +
      activatorCoordinates.y -
      initialRect.top +
      TODO_DRAG_OVERLAY_CURSOR_OFFSET.y,
  }
}

const TODO_DRAG_OVERLAY_MODIFIERS = [attachTodoOverlayToPointer]

interface TodoDragOverlayCardProps {
  text: string
  completed?: boolean
  isCarriedOver?: boolean
}

export function TodoDragOverlayCard({
  text,
  completed = false,
  isCarriedOver = false,
}: TodoDragOverlayCardProps) {
  return (
    <div className={TODO_DRAG_OVERLAY_CLASS_NAME}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-gray-400">
        ☰
      </span>
      <span
        aria-hidden="true"
        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
          completed ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
        }`}
      >
        {completed ? '✓' : ''}
      </span>
      <span className="flex min-w-0 flex-1 items-start gap-2">
        {isCarriedOver && (
          <span className="inline-flex items-center whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            어제 못한일
          </span>
        )}
        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-6">
          {text || '할 일'}
        </span>
      </span>
    </div>
  )
}

export function getDropTarget(
  event: TodoDragTargetEvent,
  groups: ReturnType<typeof groupTodosByPriority>,
  previousTarget: TodoDropTarget | null = null
): TodoDropTarget | null {
  const { active, over } = event
  if (!over) {
    return null
  }

  const activeId = String(active.id)
  const overId = String(over.id)
  const overData = over.data?.current || {}
  const overPriority = overData.priority
  const pointerY = getPointerY(event)

  if (overId.startsWith('priority:')) {
    const priority = overId.replace('priority:', '')
    if (isTodoPriority(priority)) {
      if (groups[priority].length > 0) {
        return previousTarget?.priority === priority ? previousTarget : null
      }

      return {
        activeId,
        priority,
        targetIndex: 0,
      }
    }
  }

  if (isTodoPriority(overPriority)) {
    const overIndex =
      typeof overData.index === 'number' ? overData.index : groups[overPriority].length

    return {
      activeId,
      priority: overPriority,
      targetIndex: getTargetIndexFromPointer(overIndex, over.rect, pointerY),
    }
  }

  return null
}

export default function TodoPriorityBoard({
  todos,
  onToggle,
  onDelete,
  onTextChange,
  onMove,
}: TodoPriorityBoardProps) {
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TodoDropTarget | null>(null)
  const groups = groupTodosByPriority(todos)
  const activeTodo = useMemo(
    () => todos.find((todo) => todo.id === activeTodoId) || null,
    [activeTodoId, todos]
  )
  const activeTodoIsCarriedOver = activeTodo?.text.startsWith('[어제 못한일]') ?? false
  const activeTodoDisplayText = activeTodo
    ? activeTodoIsCarriedOver
      ? activeTodo.text.replace('[어제 못한일] ', '')
      : activeTodo.text
    : ''
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const clearDragState = () => {
    setActiveTodoId(null)
    setDropTarget(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTodoId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    setDropTarget((currentDropTarget) => getDropTarget(event, groups, currentDropTarget))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const target = getDropTarget(event, groups, dropTarget)
    clearDragState()

    if (!target) {
      return
    }

    onMove(target.activeId, target.priority, target.targetIndex)
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    clearDragState()
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={todoPriorityCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-3">
        {PRIORITY_ORDER.map((priority) => {
          const priorityDropIndex =
            dropTarget?.priority === priority ? dropTarget.targetIndex : null

          return (
            <TodoPriorityColumn
              key={priority}
              priority={priority}
              todos={groups[priority]}
              isDragTarget={dropTarget?.priority === priority}
              showEmptyInsertionIndicator={
                groups[priority].length === 0 &&
                priorityDropIndex === 0 &&
                Boolean(activeTodo)
              }
            >
              <SortableContext
                items={getPriorityColumnItems(groups, priority)}
                strategy={verticalListSortingStrategy}
              >
                {groups[priority].map((todo, index) => {
                  const isCarriedOver = todo.text.startsWith('[어제 못한일]')
                  const displayText = isCarriedOver
                    ? todo.text.replace('[어제 못한일] ', '')
                    : todo.text

                  return (
                    <div key={todo.id} className="relative">
                      {priorityDropIndex === index && activeTodo && (
                        <TodoInsertionIndicator />
                      )}
                      <SortableTodoItem
                        todo={todo}
                        priority={priority}
                        index={index}
                        isCarriedOver={isCarriedOver}
                        displayText={displayText}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onTextChange={onTextChange}
                      />
                      {index === groups[priority].length - 1 &&
                        priorityDropIndex === index + 1 &&
                        activeTodo && <TodoInsertionIndicator placement="after" />}
                    </div>
                  )
                })}
              </SortableContext>
            </TodoPriorityColumn>
          )
        })}
      </div>
      <DragOverlay
        dropAnimation={null}
        modifiers={TODO_DRAG_OVERLAY_MODIFIERS}
      >
        {activeTodo ? (
          <TodoDragOverlayCard
            text={activeTodoDisplayText}
            completed={activeTodo.completed}
            isCarriedOver={activeTodoIsCarriedOver}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export {
  TODO_DRAGGING_ITEM_CLASS_NAME,
  TODO_DRAG_HANDLE_CLASS_NAME,
  TODO_INSERTION_INDICATOR_CLASS_NAME,
  TodoPriorityColumn,
  getPriorityColumnClassNames,
  getTodoDragHandleAriaLabel,
}
