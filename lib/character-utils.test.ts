import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { getCharacterImagePath, getCharacterSpritePaths } from './character-utils'

describe('getCharacterImagePath', () => {
  it('캐릭터 스프라이트 경로는 webp 확장자를 사용합니다', () => {
    expect(getCharacterImagePath(1, 'normal')).toBe('/characters/character1/normal.webp')
    expect(getCharacterImagePath(2, 'working', 1)).toBe('/characters/character2/working_1.webp')
    expect(getCharacterImagePath(3, 'home', 2)).toBe('/characters/character3/home_2.webp')
    expect(getCharacterImagePath(4, 'break', 1)).toBe('/characters/character4/break_1.webp')
  })
})

describe('Character component implementation', () => {
  it('next/image 대신 일반 img 태그를 사용합니다', () => {
    const source = readFileSync(
      path.resolve(__dirname, '../components/village/Character.tsx'),
      'utf8'
    )

    expect(source).not.toContain("from 'next/image'")
    expect(source).toContain('<img')
    expect(source).not.toContain('decoding="async"')
  })
})

describe('getCharacterSpritePaths', () => {
  it('상태 전환 전에 필요한 모든 스프라이트를 미리 불러올 수 있습니다', () => {
    expect(getCharacterSpritePaths(2)).toEqual([
      '/characters/character2/normal.webp',
      '/characters/character2/working_1.webp',
      '/characters/character2/working_2.webp',
      '/characters/character2/home_1.webp',
      '/characters/character2/home_2.webp',
      '/characters/character2/break_1.webp',
      '/characters/character2/break_2.webp',
    ])
  })
})
