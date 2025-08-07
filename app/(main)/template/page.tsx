import WorkLogEditor from '@/components/work-log/WorkLogEditor'

export default function TemplatePage() {
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8">업무일지 작성</h1>
        <WorkLogEditor />
      </div>
    </div>
  )
}