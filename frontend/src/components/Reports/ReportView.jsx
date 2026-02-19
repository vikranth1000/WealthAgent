// Report display component — renders ClientReport output
// Props: report (ClientReport | null)
export default function ReportView({ report }) {
  if (!report) return null

  return (
    <div className="prose prose-sm max-w-none p-4">
      <h2>{report.greeting}</h2>
      <p>{report.executive_summary}</p>
    </div>
  )
}
