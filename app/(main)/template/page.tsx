import TemplateEditor from '@/components/work-log/TemplateEditor'

export default function TemplatePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">템플릿 관리</h1>
      <TemplateEditor />
    </div>
  )
}