import type { UserStatus } from '@/lib/types'

export interface VillageStatusSegment {
  status: UserStatus
  label: string
  emoji: string
  activeClassName: string
  inactiveClassName: string
}

export const VILLAGE_STATUS_SEGMENTS: VillageStatusSegment[] = [
  {
    status: 'working',
    label: '출근',
    emoji: '💼',
    activeClassName:
      'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400',
    inactiveClassName: 'text-blue-700 hover:text-blue-800',
  },
  {
    status: 'break',
    label: '휴식',
    emoji: '☕',
    activeClassName:
      'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 border-purple-400',
    inactiveClassName: 'text-purple-700 hover:text-purple-800',
  },
  {
    status: 'home',
    label: '퇴근',
    emoji: '🏠',
    activeClassName:
      'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25 border-gray-400',
    inactiveClassName: 'text-gray-700 hover:text-gray-800',
  },
]
