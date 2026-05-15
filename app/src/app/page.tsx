'use client'

import { useEffect } from 'react'
import * as XLSX from 'xlsx'
import { WorkDropZone } from '@/components/work/WorkDropZone'
import { ResultsArea } from '@/components/results/ResultsArea'
import { PreviewDialog } from '@/components/preview/PreviewDialog'
import { useAppStore } from '@/store/appStore'

export default function Home() {
  const loadMaster = useAppStore(s => s.loadMaster)

  // 勤務者名簿_振分用.xlsx を public/ から自動読込
  useEffect(() => {
    fetch('/勤務者名簿_振分用.xlsx')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.arrayBuffer() })
      .then(buf => {
        const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
        loadMaster(wb)
      })
      .catch(() => { /* ファイルがなくても続行 */ })
  }, [loadMaster])

  return (
    <div className="flex flex-col gap-4 p-5 h-full overflow-hidden">
      {/* STEP 2 — 勤務ファイル投入 */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          STEP 2 — 勤務ファイル投入
        </p>
        <WorkDropZone />
      </section>

      {/* 振り分け・計算結果 */}
      <ResultsArea />

      {/* プレビューダイアログ */}
      <PreviewDialog />
    </div>
  )
}
