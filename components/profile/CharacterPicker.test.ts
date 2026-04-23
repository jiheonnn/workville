import { describe, expect, it } from 'vitest'

import {
  getCharacterPickerCardClassName,
  getCharacterPickerImageClassName,
} from './CharacterPicker'

describe('getCharacterPickerCardClassName', () => {
  it('선택된 카드는 강조 스타일을 사용합니다', () => {
    const className = getCharacterPickerCardClassName(true)

    expect(className).toContain('border-emerald-500')
    expect(className).toContain('bg-emerald-50')
  })

  it('선택되지 않은 카드는 기본 스타일을 사용합니다', () => {
    const className = getCharacterPickerCardClassName(false)

    expect(className).toContain('border-gray-200')
    expect(className).toContain('hover:border-emerald-300')
  })

  it('마우스 클릭 시 이중 테두리가 생기지 않도록 포커스 스타일은 focus-visible로만 적용합니다', () => {
    const className = getCharacterPickerCardClassName(true)

    expect(className).toContain('focus-visible:ring-2')
    expect(className).not.toContain('focus:ring-2')
  })
})

describe('getCharacterPickerImageClassName', () => {
  it('캐릭터가 충분히 크게 보이도록 축소 배치 대신 꽉 차는 배치를 사용합니다', () => {
    const className = getCharacterPickerImageClassName()

    expect(className).toContain('object-cover')
    expect(className).not.toContain('object-contain')
    expect(className).not.toContain('p-4')
  })
})
