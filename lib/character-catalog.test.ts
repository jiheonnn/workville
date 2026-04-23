import { describe, expect, it } from 'vitest'

import { AVAILABLE_CHARACTER_TYPES, isCharacterType } from './character-catalog'

describe('AVAILABLE_CHARACTER_TYPES', () => {
  it('선택 가능한 캐릭터 타입은 1번부터 8번까지 모두 포함합니다', () => {
    expect(AVAILABLE_CHARACTER_TYPES).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})

describe('isCharacterType', () => {
  it('지원하는 캐릭터 타입만 통과시킵니다', () => {
    expect(isCharacterType(1)).toBe(true)
    expect(isCharacterType(8)).toBe(true)
    expect(isCharacterType(0)).toBe(false)
    expect(isCharacterType(9)).toBe(false)
  })
})
