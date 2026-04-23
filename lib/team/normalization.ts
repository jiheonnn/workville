import type {
  TeamInvite,
  TeamMember,
  WorkSession,
} from '@/types/database'

export const DEFAULT_TEAM_TEMPLATE_CONTENT = `## 오늘 한 일
- 

## 내일 할 일
- 

## 이슈 및 특이사항
- `

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase()
}

export function countActiveMembers(
  members: Array<Pick<TeamMember, 'status'>>
) {
  return members.filter((member) => member.status === 'active').length
}

export function shouldBlockTeamSwitch(
  session: Pick<WorkSession, 'check_out_time'> | null
) {
  return session?.check_out_time === null
}

export function isPendingInvite(invite: Pick<TeamInvite, 'status'>) {
  return invite.status === 'pending'
}
