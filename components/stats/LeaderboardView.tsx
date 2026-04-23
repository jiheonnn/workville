'use client'

import Image from 'next/image'

import type { LeaderboardStats } from '@/lib/stats/calculations'
import { getCharacterImagePath } from '@/lib/character-utils'

interface LeaderboardViewProps {
  selectedMemberId: string | null
  stats: LeaderboardStats
  onSelectMember: (memberId: string) => void
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return '🥇'
    case 2:
      return '🥈'
    case 3:
      return '🥉'
    default:
      return String(rank)
  }
}

export default function LeaderboardView({
  selectedMemberId,
  stats,
  onSelectMember,
}: LeaderboardViewProps) {
  return (
    <section className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">리더보드</h3>
          <p className="text-sm text-gray-500 mt-1">
            선택 기간의 총 근무시간 기준으로 정렬됩니다.
          </p>
        </div>
        <p className="text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full">
          팀원 카드를 누르면 아래에서 상세 통계를 볼 수 있습니다.
        </p>
      </div>

      <div className="space-y-3">
        {stats.members.map((member) => {
          const isSelected = member.id === selectedMemberId
          const isTopRanker = member.rank <= 3

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectMember(member.id)}
              className={`w-full text-left rounded-2xl border-2 px-5 py-4 transition-all duration-300 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                  : 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-white'
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                      isTopRanker ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {getRankBadge(member.rank)}
                  </div>

                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-md bg-white">
                    <Image
                      src={getCharacterImagePath(member.characterType, 'normal')}
                      alt={member.username}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-gray-800">{member.username}</span>
                      {member.isCurrentUser && (
                        <span className="px-2 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-semibold">
                          나
                        </span>
                      )}
                      {isSelected && (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          선택됨
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Lv.{member.level}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 md:min-w-[280px]">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">총 근무시간</p>
                    <p className="text-lg font-black text-emerald-600">{member.totalHours}시간</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">근무일수</p>
                    <p className="text-lg font-black text-purple-600">{member.workDays}일</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">평균</p>
                    <p className="text-lg font-black text-blue-600">{member.averageHours}시간</p>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
