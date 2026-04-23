import { describe, expect, it } from 'vitest'

import {
  applyVillageUserStatus,
  buildVillageCharacters,
  normalizeVillageUsers,
} from './map-data'

describe('normalizeVillageUsers', () => {
  it('API 응답의 user_status 형태가 배열이어도 화면용 사용자 상태로 정규화합니다', () => {
    const users = normalizeVillageUsers([
      {
        id: 'me',
        username: '지헌',
        character_type: 1,
        user_status: [{ status: 'working' }],
      },
      {
        id: 'teammate',
        username: '아라',
        character_type: 2,
        user_status: null,
      },
      {
        id: 'no-character',
        username: '익명',
        character_type: null,
        user_status: [{ status: 'break' }],
      },
    ])

    expect(users).toEqual([
      {
        id: 'me',
        username: '지헌',
        characterType: 1,
        status: 'working',
      },
      {
        id: 'teammate',
        username: '아라',
        characterType: 2,
        status: 'home',
      },
    ])
  })
})

describe('applyVillageUserStatus', () => {
  it('현재 사용자 상태를 즉시 바꿔 맵 렌더 기준 데이터를 바로 갱신합니다', () => {
    const nextUsers = applyVillageUserStatus(
      [
        {
          id: 'me',
          username: '지헌',
          characterType: 1,
          status: 'home',
        },
        {
          id: 'teammate',
          username: '아라',
          characterType: 2,
          status: 'working',
        },
      ],
      'me',
      'break'
    )

    expect(nextUsers).toEqual([
      {
        id: 'me',
        username: '지헌',
        characterType: 1,
        status: 'break',
      },
      {
        id: 'teammate',
        username: '아라',
        characterType: 2,
        status: 'working',
      },
    ])
  })
})

describe('buildVillageCharacters', () => {
  it('동일 상태 사용자끼리 묶어 좌표를 안정적으로 계산합니다', () => {
    const characters = buildVillageCharacters([
      {
        id: 'working-1',
        username: '지헌',
        characterType: 1,
        status: 'working',
      },
      {
        id: 'working-2',
        username: '아라',
        characterType: 2,
        status: 'working',
      },
      {
        id: 'break-1',
        username: '민수',
        characterType: 3,
        status: 'break',
      },
      {
        id: 'home-1',
        username: '서연',
        characterType: 4,
        status: 'home',
      },
    ])

    expect(characters.map((character) => ({
      id: character.id,
      status: character.status,
      position: character.position,
    }))).toEqual([
      {
        id: 'working-1',
        status: 'working',
        position: { x: 4, y: 4 },
      },
      {
        id: 'working-2',
        status: 'working',
        position: { x: 5, y: 4 },
      },
      {
        id: 'break-1',
        status: 'break',
        position: { x: 4, y: 6 },
      },
      {
        id: 'home-1',
        status: 'home',
        position: { x: 2, y: 1 },
      },
    ])
  })
})
