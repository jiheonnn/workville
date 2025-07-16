import TemplateEditor from '@/components/work-log/TemplateEditor'

export default function TemplatePage() {
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-8">템플릿 관리</h1>
        <TemplateEditor />
      </div>
    </div>
  )
}