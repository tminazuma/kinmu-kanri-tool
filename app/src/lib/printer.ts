import { extractId } from './work-utils'
import type { WorkItem } from '@/store/appStore'
import type { ProcessedData } from './calculator'

function escHtml(str: unknown): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function openAllInBrowser(
  items:         Record<string, WorkItem>,
  processedData: Record<string, ProcessedData>,
): void {
  const entries = Object.entries(processedData)
  if (entries.length === 0) {
    alert('印刷可能な処理済みファイルがありません。\nファイルの計算が完了してから実行してください。')
    return
  }

  const sorted = entries.sort(([, a], [, b]) =>
    extractId(a.originalName) - extractId(b.originalName)
  )

  let html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><title>一括印刷レポート</title>
<style>
  body { font-family: "Helvetica Neue", Arial, "Yu Gothic", sans-serif; padding: 20px; color: #333; }
  h1 { font-size: 15px; margin: 0 0 8px; border-bottom: 2px solid #6366f1; padding-bottom: 4px;
       display: flex; align-items: center; gap: 8px; }
  .badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
  .b7h  { background: #dbeafe; color: #1d4ed8; }
  .b8h  { background: #f3e8ff; color: #7e22ce; }
  .bexc { background: #fef9c3; color: #854d0e; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px; }
  th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left; white-space: nowrap; }
  th { background: #f3f4f6; font-weight: bold; }
  tr:hover { background: #f9fafb; }
  .footer-row { background: #e0e7ff !important; font-weight: bold; }
  .footer-row td { border-top: 2px solid #6366f1; }
  .no-print { text-align: center; margin-bottom: 18px; }
  .print-btn { padding: 10px 24px; font-size: 15px; cursor: pointer;
               background: #6366f1; color: #fff; border: none; border-radius: 8px; }
  @media print {
    @page { size: A4 landscape; margin: 3mm; }
    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
    .page-break { border: none; height: 0; margin: 0; page-break-after: always;
                  break-after: page; display: block !important; }
    h1 { font-size: 10px; margin: 0 0 3px; }
    table { font-size: 8px; }
    th, td { padding: 1px 3px; }
    th { background: #f3f4f6 !important; }
    .footer-row { background: #e0e7ff !important; }
    .b7h  { background: #dbeafe !important; color: #1d4ed8 !important; }
    .b8h  { background: #f3e8ff !important; color: #7e22ce !important; }
    .bexc { background: #fef9c3 !important; color: #854d0e !important; }
  }
</style></head><body>
<div class="no-print">
  <p style="font-size:13px;color:#6b7280;margin-bottom:10px;">
    印刷順：<strong>ID順</strong>　全 <strong>${sorted.length}</strong> 件
    （7h基準: ${sorted.filter(([, f]) => f.overtimeRule === '7').length}件 ／
     8h基準: ${sorted.filter(([, f]) => f.overtimeRule === '8').length}件）
  </p>
  <button class="print-btn" onclick="window.print()">🖨️ 印刷する</button>
</div>`

  sorted.forEach(([, fd], idx) => {
    const fid        = extractId(fd.originalName)
    const idLabel    = fid !== Infinity ? ` [ID: ${fid}]` : ''
    const badgeClass = fd.overtimeRule === '7' ? 'b7h' : fd.overtimeRule === '8' ? 'b8h' : 'bexc'
    const ruleLabel  = fd.overtimeRule === '7' ? '7時間基準' : fd.overtimeRule === '8' ? '8時間基準' : 'Exception'

    html += `<div>`
    html += `<h1><span class="badge ${badgeClass}">${ruleLabel}</span>${escHtml(fd.originalName)}${idLabel}</h1>`
    html += `<table>`
    fd.data.forEach((row, ri) => {
      const isFooter = ri === fd.data.length - 1 && Array.isArray(row) && row.includes('残業合計')
      html += `<tr${isFooter ? ' class="footer-row"' : ''}>`
      ;(row as unknown[]).forEach(cell => { html += `<td>${escHtml(cell ?? '')}</td>` })
      html += `</tr>`
    })
    html += `</table></div>`
    if (idx < sorted.length - 1) html += `<div class="page-break"></div>`
  })

  html += `</body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  window.open(URL.createObjectURL(blob), '_blank')
}

export function downloadFile(fd: ProcessedData): void {
  const url = URL.createObjectURL(fd.excelBlob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = fd.originalName.replace(/(\.[\w\d_-]+)$/i, '_processed.xlsx')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
