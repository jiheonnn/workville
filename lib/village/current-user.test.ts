import { describe, expect, it } from 'vitest'

import { resolveVillageCurrentUserId } from './current-user'

describe('resolveVillageCurrentUserId', () => {
  it('마을 store에 저장된 현재 사용자 id를 우선 사용합니다', () => {
    expect(
      resolveVillageCurrentUserId({
        villageStoreUserId: 'village-user',
        authStoreUserId: 'auth-user',
      })
    ).toBe('village-user')
  })

  it('마을 store 값이 없으면 auth store id를 fallback으로 사용합니다', () => {
    expect(
      resolveVillageCurrentUserId({
        villageStoreUserId: null,
        authStoreUserId: 'auth-user',
      })
    ).toBe('auth-user')
  })

  it('둘 다 없으면 null을 반환합니다', () => {
    expect(
      resolveVillageCurrentUserId({
        villageStoreUserId: null,
        authStoreUserId: null,
      })
    ).toBeNull()
  })
})
