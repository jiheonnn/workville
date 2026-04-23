'use client'

import type { PendingInvite } from '@/lib/stores/team-store'

interface PendingInvitesPanelProps {
  invites: PendingInvite[]
  onAccept: (inviteId: string) => Promise<boolean>
  compact?: boolean
}

export default function PendingInvitesPanel({
  invites,
  onAccept,
  compact = false,
}: PendingInvitesPanelProps) {
  return (
    <section className={`bg-white border border-gray-100 ${compact ? 'rounded-3xl p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]' : 'rounded-2xl p-6 shadow-lg'}`}>
      <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>받은 초대</h2>

      <div className="mt-4 space-y-3">
        {invites.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">
            아직 수락 대기 중인 초대가 없습니다.
          </div>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {invite.team?.name || '알 수 없는 팀'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  초대 이메일: {invite.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void onAccept(invite.id)}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                초대 수락
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
