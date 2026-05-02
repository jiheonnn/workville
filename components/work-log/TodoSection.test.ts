import { describe, expect, it } from 'vitest'

import {
  COMPLETED_TODO_TEXT_CLASS_NAME,
  TODO_PRIORITY_LABEL_CLASS_NAME,
  TODO_TEXTAREA_CLASS_NAME,
  TODO_TEXTAREA_MAX_HEIGHT_PX,
  TODO_TEXTAREA_MIN_HEIGHT_PX,
} from './TodoSection'
import { shouldSubmitTodoOnEnter } from './TodoTextarea'

describe('TodoSection text wrapping layout', () => {
  it('진행 중 할 일은 줄넘김 가능한 textarea로 3줄 높이까지만 확장합니다', () => {
    expect(TODO_TEXTAREA_CLASS_NAME).toContain('whitespace-pre-wrap')
    expect(TODO_TEXTAREA_CLASS_NAME).toContain('break-words')
    expect(TODO_TEXTAREA_CLASS_NAME).toContain('overflow-y-auto')
    expect(TODO_TEXTAREA_CLASS_NAME).toContain('resize-none')
    expect(TODO_TEXTAREA_MIN_HEIGHT_PX).toBeLessThan(TODO_TEXTAREA_MAX_HEIGHT_PX)
    expect(TODO_TEXTAREA_MAX_HEIGHT_PX).toBe(72)
  })

  it('우선순위 컬럼 위에는 우선순위 라벨을 표시합니다', () => {
    expect(TODO_PRIORITY_LABEL_CLASS_NAME).toContain('text-xs')
    expect(TODO_PRIORITY_LABEL_CLASS_NAME).toContain('font-bold')
    expect(TODO_PRIORITY_LABEL_CLASS_NAME).toContain('text-gray-500')
  })

  it('완료한 일은 읽기 전용 텍스트를 최대 3줄 높이로 보여줍니다', () => {
    expect(COMPLETED_TODO_TEXT_CLASS_NAME).toContain('whitespace-pre-wrap')
    expect(COMPLETED_TODO_TEXT_CLASS_NAME).toContain('break-words')
    expect(COMPLETED_TODO_TEXT_CLASS_NAME).toContain('max-h-[72px]')
    expect(COMPLETED_TODO_TEXT_CLASS_NAME).toContain('overflow-y-auto')
  })

  it('한글 IME 조합 중 Enter는 할 일 추가로 처리하지 않습니다', () => {
    expect(
      shouldSubmitTodoOnEnter({
        key: 'Enter',
        shiftKey: false,
        isComposing: true,
        isCompositionInProgress: false,
      })
    ).toBe(false)

    expect(
      shouldSubmitTodoOnEnter({
        key: 'Enter',
        shiftKey: false,
        isComposing: false,
        isCompositionInProgress: true,
      })
    ).toBe(false)
  })

  it('조합 중이 아닌 일반 Enter만 할 일 추가로 처리합니다', () => {
    expect(
      shouldSubmitTodoOnEnter({
        key: 'Enter',
        shiftKey: false,
        isComposing: false,
        isCompositionInProgress: false,
      })
    ).toBe(true)

    expect(
      shouldSubmitTodoOnEnter({
        key: 'Enter',
        shiftKey: true,
        isComposing: false,
        isCompositionInProgress: false,
      })
    ).toBe(false)
  })
})
