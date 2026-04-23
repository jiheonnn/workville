import { CharacterType, UserStatus } from '@/lib/types'

export interface ApiVillageUserStatus {
  status: UserStatus
}

export interface ApiVillageUser {
  id: string
  username: string | null
  character_type: CharacterType | null
  user_status?: ApiVillageUserStatus[] | ApiVillageUserStatus | null
}

export interface VillageUser {
  id: string
  username: string
  characterType: CharacterType
  status: UserStatus
}

export interface VillageCharacter extends VillageUser {
  position: {
    x: number
    y: number
  }
}

const HOUSE_POSITIONS = [
  { x: 2, y: 1 },
  { x: 4, y: 1 },
  { x: 6, y: 1 },
  { x: 8, y: 1 },
] as const

const OFFICE_POSITIONS = [
  { x: 4, y: 4 },
  { x: 5, y: 4 },
  { x: 6, y: 4 },
  { x: 5, y: 3 },
] as const

const BREAK_POSITIONS = [
  { x: 4, y: 6 },
  { x: 5, y: 6 },
  { x: 6, y: 6 },
  { x: 5, y: 7 },
] as const

function resolveUserStatus(user: ApiVillageUser): UserStatus {
  if (!user.user_status) {
    return 'home'
  }

  if (Array.isArray(user.user_status) && user.user_status.length > 0) {
    return user.user_status[0].status
  }

  if (typeof user.user_status === 'object' && 'status' in user.user_status) {
    return user.user_status.status
  }

  return 'home'
}

export function normalizeVillageUsers(users: ApiVillageUser[]): VillageUser[] {
  return users
    .filter((user): user is ApiVillageUser & { character_type: CharacterType } => user.character_type !== null)
    .map((user) => ({
      id: user.id,
      username: user.username || 'Anonymous',
      characterType: user.character_type,
      status: resolveUserStatus(user),
    }))
}

export function applyVillageUserStatus(
  users: VillageUser[],
  userId: string,
  status: UserStatus
): VillageUser[] {
  return users.map((user) => {
    if (user.id !== userId) {
      return user
    }

    return {
      ...user,
      status,
    }
  })
}

export function getPositionForStatus(status: UserStatus, characterIndex: number) {
  switch (status) {
    case 'working':
      return OFFICE_POSITIONS[characterIndex % OFFICE_POSITIONS.length]
    case 'home':
      return HOUSE_POSITIONS[characterIndex % HOUSE_POSITIONS.length]
    case 'break':
      return BREAK_POSITIONS[characterIndex % BREAK_POSITIONS.length]
    default:
      return OFFICE_POSITIONS[0]
  }
}

export function buildVillageCharacters(users: VillageUser[]): VillageCharacter[] {
  const usersByStatus: Record<UserStatus, VillageUser[]> = {
    working: [],
    home: [],
    break: [],
  }

  users.forEach((user) => {
    usersByStatus[user.status].push(user)
  })

  return users.map((user) => {
    // 이유:
    // 좌표는 DB 값이 아니라 "같은 상태 그룹 안에서 몇 번째인가"로만 결정합니다.
    // 이렇게 계산을 한 곳으로 모아야 낙관적 업데이트와 Realtime 재동기화가 같은 규칙을 사용합니다.
    const statusIndex = usersByStatus[user.status].findIndex((candidate) => candidate.id === user.id)

    return {
      ...user,
      position: getPositionForStatus(user.status, statusIndex),
    }
  })
}
