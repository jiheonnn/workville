'use client'

import dynamic from 'next/dynamic'

const VillageMap = dynamic(() => import('@/components/village/VillageMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-white rounded-2xl shadow-xl animate-pulse" />
})

const StatusControl = dynamic(() => import('@/components/StatusControl'), {
  ssr: false,
  loading: () => <div className="h-32 bg-white rounded-xl shadow-md animate-pulse" />
})

export default function VillagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
          <div className="xl:col-span-5">
            <VillageMap />
          </div>
          <div className="xl:col-span-2">
            <StatusControl />
          </div>
        </div>
      </div>
    </div>
  )
}