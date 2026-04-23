import MyPagePanel from '@/components/profile/MyPagePanel'

export default function MyPagePage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <div className="mb-6">
        <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-black text-transparent">
          마이페이지
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          이름, 캐릭터, 계정 상태를 한 곳에서 관리할 수 있습니다.
        </p>
      </div>

      <MyPagePanel />
    </div>
  )
}
