// Re-export types from database
export type { UserStatus } from '@/types/database'

// Define CharacterType as string type to match usage
export type CharacterType = 'character1' | 'character2' | 'character3' | 'character4'

// Type conversions
export function numberToCharacterType(num: 1 | 2 | 3 | 4): CharacterType {
  return `character${num}` as CharacterType
}

export function characterTypeToNumber(type: CharacterType): 1 | 2 | 3 | 4 {
  const num = parseInt(type.replace('character', ''))
  return num as 1 | 2 | 3 | 4
}