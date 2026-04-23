import { describe, expect, it } from 'vitest'

import { getCharacterContainerClassName } from './Character'

describe('getCharacterContainerClassName', () => {
  it('위치 이동은 항상 즉시 반영되도록 transition 클래스를 포함하지 않습니다', () => {
    const className = getCharacterContainerClassName()

    expect(className).not.toContain('transition-all')
    expect(className).not.toContain('duration-1000')
    expect(className).toContain('pointer-events-auto')
  })
})
