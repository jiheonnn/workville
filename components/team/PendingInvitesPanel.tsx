'use client'

import type { PendingInvite } from '@/lib/stores/team-store'

interface PendingInvitesPanelProps {
  invites: PendingInvite[]
  onAccept: (inviteId: string) => Promise<boolean>
}

export default function PendingInvitesPanel({
  invites,
  onAccept,
}: PendingInvitesPanelProps) {
  return (
    <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800">받은 초대</h2>
      <p className="text-sm text-gray-600 mt-2">
        현재 로그인한 이메일로 온 초대만 표시됩니다.
      </p>

      <div className="mt-4 space-y-3">
        {invites.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
            아직 수락 대기 중인 초대가 없습니다.
          </div>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
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
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
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
