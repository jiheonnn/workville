import { describe, expect, it } from 'vitest'

import {
  COMPLETED_TODO_TEXT_CLASS_NAME,
  TODO_TEXTAREA_CLASS_NAME,
  TODO_TEXTAREA_MAX_HEIGHT_PX,
  TODO_TEXTAREA_MIN_HEIGHT_PX,
} from './TodoSection'

describe('TodoSection text wrapping layout', () => {
  it('진행 중 할 일은 줄넘김 가능한 textarea로 3줄 높이까지만 확장합니다', () => {
    expect(TODO_TEXTAREA_CLASS_NAME).toContain('whitespace-pre-wrap')
    expect(TODO_TEXTAREA_CLASS_NAME).toContain('break-words')
    expect(TODO_TEXTAREA_CLASS_NAME).toContain('overflow-y-auto')
    expect(TODO_TEXTAREA_CLASS_NAME).toContain('resize-none')
    expect(TODO_TEXTAREA_MIN_HEIGHT_PX).toBeLessThan(TODO_TEXTAREA_MAX_HEIGHT_PX)
    expect(TODO_TEXTAREA_MAX_HEIGHT_PX).toBe(72)
  })

  it('완료한 일은 읽기 전용 텍스트를 최대 3줄 높이로 보여줍니다', () => {
    expect(COMPLETED_TODO_TEXT_CLASS_NAME).toContain('whitespace-pre-wrap')
    expect(COMPLETED_TODO_TEXT_CLASS_NAME).toContain('break-words')
    expect(COMPLETED_TODO_TEXT_CLASS_NAME).toContain('max-h-[72px]')
    expect(COMPLETED_TODO_TEXT_CLASS_NAME).toContain('overflow-y-auto')
  })
})
