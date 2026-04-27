import type { TeamMember } from '@/types/database'

export function canManageOwnRecords(membership: Pick<TeamMember, 'role' | 'can_manage_own_records'>) {
  return membership.role === 'owner' || membership.can_manage_own_records === true
}
