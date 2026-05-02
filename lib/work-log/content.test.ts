import { describe, expect, it } from 'vitest'

import { buildWorkLogContent, normalizeWorkLogSaveInput } from './content'

describe('buildWorkLogContent', () => {
  it('오늘 할 일을 우선순위별로 묶어 저장 본문을 만듭니다', () => {
    const content = buildWorkLogContent({
      todos: [
        { id: 'todo-1', text: '중요한 일', completed: false, order: 0, priority: 'high' },
        { id: 'todo-2', text: '기본 일', completed: false, order: 0, priority: 'normal' },
        { id: 'todo-3', text: '나중 일', completed: false, order: 0, priority: 'low' },
      ],
      completed_todos: [],
      feedback: '좋았습니다',
    })

    expect(content).toContain('### 높음\n- [ ] 중요한 일')
    expect(content).toContain('### 보통\n- [ ] 기본 일')
    expect(content).toContain('### 낮음\n- [ ] 나중 일')
  })

  it('priority가 없는 기존 할 일은 보통 그룹에 저장합니다', () => {
    const content = buildWorkLogContent({
      todos: [{ id: 'todo-1', text: '기존 일', completed: false, order: 0 }],
      completed_todos: [],
      feedback: '',
    })

    expect(content).toContain('### 보통\n- [ ] 기존 일')
  })

  it('완료한 일도 우선순위별로 묶어 저장합니다', () => {
    const content = buildWorkLogContent({
      todos: [],
      completed_todos: [
        { id: 'done-1', text: '끝낸 중요 업무', completed: true, order: 0, priority: 'high' },
      ],
      feedback: '',
    })

    expect(content).toContain('## ✅ 완료한 일\n### 높음\n- [x] 끝낸 중요 업무')
  })
})

describe('normalizeWorkLogSaveInput', () => {
  it('저장 payload의 todos도 priority 기본값으로 정규화합니다', () => {
    const normalized = normalizeWorkLogSaveInput({
      todos: [{ id: 'todo-1', text: '기존 일', completed: false, order: 0 }],
      completed_todos: [],
    })

    expect(normalized.todos[0].priority).toBe('normal')
    expect(normalized.content).toContain('### 보통\n- [ ] 기존 일')
  })
})
