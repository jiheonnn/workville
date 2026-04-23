import TeamManagementPanel from '@/components/team/TeamManagementPanel'

export default function TeamPage() {
  return (
    <div className="max-w-5xl mx-auto animate-fadeIn p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          팀 관리
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          팀 생성, 활성 팀 전환, 초대 수락, 팀원 초대를 한 곳에서 관리할 수 있습니다.
        </p>
      </div>

      <TeamManagementPanel />
    </div>
  )
}
