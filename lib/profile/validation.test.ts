import { describe, expect, it } from 'vitest'

import { sanitizeUsername, validateUsername } from './validation'

describe('sanitizeUsername', () => {
  it('앞뒤 공백만 제거하고 내부 문자열은 유지합니다', () => {
    expect(sanitizeUsername('  지헌123  ')).toBe('지헌123')
  })
})

describe('validateUsername', () => {
  it('한글, 영문, 숫자 조합 2~12자는 허용합니다', () => {
    expect(validateUsername('지헌')).toEqual({ ok: true })
    expect(validateUsername('jiheon12')).toEqual({ ok: true })
    expect(validateUsername('지헌2026')).toEqual({ ok: true })
  })

  it('2자 미만이면 거절합니다', () => {
    expect(validateUsername('지')).toEqual({
      ok: false,
      error: '이름은 2자 이상 12자 이하여야 합니다.',
    })
  })

  it('12자 초과면 거절합니다', () => {
    expect(validateUsername('abcdefghijklmn')).toEqual({
      ok: false,
      error: '이름은 2자 이상 12자 이하여야 합니다.',
    })
  })

  it('공백이 포함되면 거절합니다', () => {
    expect(validateUsername('지 헌')).toEqual({
      ok: false,
      error: '이름은 한글, 영문, 숫자만 사용할 수 있습니다.',
    })
  })

  it('특수문자가 포함되면 거절합니다', () => {
    expect(validateUsername('jiheon!')).toEqual({
      ok: false,
      error: '이름은 한글, 영문, 숫자만 사용할 수 있습니다.',
    })
  })

  it('앞뒤 공백을 제거한 뒤 검증합니다', () => {
    expect(validateUsername('  지헌12  ')).toEqual({ ok: true })
  })

  it('비어 있으면 거절합니다', () => {
    expect(validateUsername('   ')).toEqual({
      ok: false,
      error: '이름을 입력해주세요.',
    })
  })
})
