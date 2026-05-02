import { describe, expect, it } from 'vitest'

import {
  DEFAULT_TODO_PRIORITY,
  PRIORITY_ORDER,
  groupTodosByPriority,
  moveTodoWithinPriorityGroups,
  normalizeTodoItem,
} from './todo-priority'

describe('todo priority helpers', () => {
  it('우선순위 순서는 높음, 보통, 낮음으로 고정합니다', () => {
    expect(PRIORITY_ORDER).toEqual(['high', 'normal', 'low'])
    expect(DEFAULT_TODO_PRIORITY).toBe('normal')
  })

  it('기존 todo에 priority가 없으면 보통으로 보정합니다', () => {
    expect(
      normalizeTodoItem({ id: 'todo-1', text: '기존 할 일', completed: false, order: 3 }, 0)
    ).toEqual({
      id: 'todo-1',
      text: '기존 할 일',
      completed: false,
      order: 3,
      priority: 'normal',
    })
  })

  it('잘못된 priority 값은 보통으로 보정합니다', () => {
    expect(
      normalizeTodoItem(
        { id: 'todo-1', text: '깨진 할 일', completed: false, order: 0, priority: 'urgent' },
        0
      ).priority
    ).toBe('normal')
  })

  it('priority와 order 기준으로 할 일을 그룹화합니다', () => {
    const groups = groupTodosByPriority([
      { id: 'low-1', text: '낮음 1', completed: false, order: 0, priority: 'low' },
      { id: 'high-2', text: '높음 2', completed: false, order: 1, priority: 'high' },
      { id: 'high-1', text: '높음 1', completed: false, order: 0, priority: 'high' },
      { id: 'normal-1', text: '보통 1', completed: false, order: 0 },
    ])

    expect(groups.high.map((todo) => todo.id)).toEqual(['high-1', 'high-2'])
    expect(groups.normal.map((todo) => todo.id)).toEqual(['normal-1'])
    expect(groups.low.map((todo) => todo.id)).toEqual(['low-1'])
  })

  it('다른 priority 영역으로 이동하면 대상 그룹 순서와 priority를 함께 갱신합니다', () => {
    const moved = moveTodoWithinPriorityGroups(
      [
        { id: 'todo-1', text: '높음', completed: false, order: 0, priority: 'high' },
        { id: 'todo-2', text: '보통 1', completed: false, order: 0, priority: 'normal' },
        { id: 'todo-3', text: '보통 2', completed: false, order: 1, priority: 'normal' },
      ],
      'todo-1',
      'normal',
      1
    )

    expect(moved).toEqual([
      { id: 'todo-2', text: '보통 1', completed: false, order: 0, priority: 'normal' },
      { id: 'todo-1', text: '높음', completed: false, order: 1, priority: 'normal' },
      { id: 'todo-3', text: '보통 2', completed: false, order: 2, priority: 'normal' },
    ])
  })
})
