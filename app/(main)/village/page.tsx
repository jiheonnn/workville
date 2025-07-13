import VillageMap from '@/components/village/VillageMap'
import StatusControl from '@/components/StatusControl'

export default function VillagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <VillageMap />
          </div>
          <div className="lg:col-span-1">
            <StatusControl />
          </div>
        </div>
      </div>
    </div>
  )
}