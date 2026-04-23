'use client'

import type { PendingInvite, TeamSummary } from '@/lib/stores/team-store'

import InviteMemberDialog from './InviteMemberDialog'
import PendingInvitesPanel from './PendingInvitesPanel'
import TeamCreateDialog from './TeamCreateDialog'

export interface TeamMemberSummary {
  id: string
  username: string
  character_type: number | null
  user_status: Array<{ status: string }>
}

export interface TeamInviteSummary {
  id: string
  email: string
  status: string
  created_at: string
}

interface TeamDashboardViewProps {
  userId: string | null
  teams: TeamSummary[]
  activeTeamId: string | null
  pendingInvites: PendingInvite[]
  members: TeamMemberSummary[]
  activeInvites: TeamInviteSummary[]
  pageError: string | null
  isLoading: boolean
  onCreateTeam: (name: string) => Promise<boolean>
  onAcceptInvite: (inviteId: string) => Promise<boolean>
  onInviteMember: (email: string) => Promise<boolean>
  onTransferOwner: (memberId: string) => Promise<void>
  onLeaveTeam: () => Promise<void>
  onCancelInvite: (inviteId: string) => Promise<void>
}

function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] ${className}`}>
      {children}
    </section>
  )
}

function StatusChip({ status }: { status: string | undefined }) {
  const normalizedStatus = status || 'home'
  const statusLabel =
    normalizedStatus === 'working'
      ? '업무 중'
      : normalizedStatus === 'break'
        ? '휴식 중'
        : '퇴근'

  const toneClass =
    normalizedStatus === 'working'
      ? 'bg-emerald-50 text-emerald-700'
      : normalizedStatus === 'break'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-600'

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {statusLabel}
    </span>
  )
}

export default function TeamDashboardView({
  userId,
  teams,
  activeTeamId,
  pendingInvites,
  members,
  activeInvites,
  pageError,
  isLoading,
  onCreateTeam,
  onAcceptInvite,
  onInviteMember,
  onTransferOwner,
  onLeaveTeam,
  onCancelInvite,
}: TeamDashboardViewProps) {
  const activeTeam = teams.find((team) => team.id === activeTeamId) || null
  const otherTeams = teams.filter((team) => team.id !== activeTeamId)

  return (
    <div className="space-y-6">
      {activeTeam ? (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <SectionCard className="overflow-hidden">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    활성 팀
                  </div>
                  <div>
                    <h2 className="break-keep text-3xl font-black tracking-tight text-slate-900">
                      {activeTeam.name}
                    </h2>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 ring-1 ring-emerald-100/80 backdrop-blur">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">현재 팀 멤버</h3>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                      {activeTeam.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => void onLeaveTeam()}
                          className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                        >
                          팀 탈퇴
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {members.map((member) => {
                      const isCurrentUser = member.id === userId

                      return (
                        <div
                          key={member.id}
                          className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="text-base font-bold text-slate-900">
                                {member.username}
                              </div>
                              {isCurrentUser && (
                                <>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    나
                                  </span>
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    {activeTeam.role === 'owner' ? '팀장' : '팀원'}
                                  </span>
                                </>
                              )}
                            </div>
                            <StatusChip status={member.user_status?.[0]?.status} />
                          </div>

                          {activeTeam.role === 'owner' && !isCurrentUser && (
                            <button
                              type="button"
                              onClick={() => void onTransferOwner(member.id)}
                              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                            >
                              팀장 위임
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {activeTeam.role === 'owner' ? (
                  <div className="pt-1">
                    <InviteMemberDialog onInvite={onInviteMember} compact />
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <div className="space-y-6">
              <PendingInvitesPanel invites={pendingInvites} onAccept={onAcceptInvite} compact />

              {activeTeam.role === 'owner' && (
                <SectionCard>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">보낸 초대</h3>
                  </div>

                  <div className="mt-4 space-y-3">
                    {activeInvites.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        현재 대기 중인 초대가 없습니다.
                      </div>
                    ) : (
                      activeInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex flex-col gap-3 rounded-2xl border border-gray-200 px-4 py-4"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{invite.email}</div>
                            <div className="mt-1 text-xs text-slate-500">{invite.status}</div>
                          </div>
                          {invite.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => void onCancelInvite(invite.id)}
                              className="self-start rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                            >
                              초대 취소
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </SectionCard>
              )}

              <SectionCard>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">내 다른 팀</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {otherTeams.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      현재 추가로 소속된 팀이 없습니다.
                    </div>
                  ) : (
                    otherTeams.map((team) => (
                      <div
                        key={team.id}
                        className="rounded-2xl border border-gray-200 px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">{team.name}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {team.role === 'owner' ? '팀장' : '팀원'}
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            보조 팀
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <TeamCreateDialog onCreate={onCreateTeam} isLoading={isLoading} compact />
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <SectionCard className="bg-gradient-to-br from-slate-50 via-white to-emerald-50">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-gray-200">
                시작하기
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                아직 활성 팀이 없습니다
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                새 팀을 만들거나 받은 초대를 수락하면, 그 팀을 중심으로 Workville이 동작합니다.
              </p>
            </div>
          </SectionCard>

          <div className="space-y-6">
            <PendingInvitesPanel invites={pendingInvites} onAccept={onAcceptInvite} compact />
            <TeamCreateDialog onCreate={onCreateTeam} isLoading={isLoading} compact />
          </div>
        </div>
      )}

      {pageError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}
    </div>
  )
}
