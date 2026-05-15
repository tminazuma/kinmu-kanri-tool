'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResultsPanel } from './ResultsPanel'
import { UnmatchedArea } from './UnmatchedArea'
import { useAppStore } from '@/store/appStore'

export function ResultsArea() {
  const items       = useAppStore(s => s.items)
  const clearResults= useAppStore(s => s.clearResults)

  const hasItems = Object.keys(items).length > 0

  if (!hasItems) return null

  return (
    <div className="flex flex-col gap-3 flex-1 overflow-hidden">
      {/* アクションバー */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">振り分け・計算結果</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive gap-1"
          onClick={clearResults}
        >
          <Trash2 className="h-3 w-3" />
          クリア
        </Button>
      </div>

      {/* 3カラムパネル */}
      <div className="grid grid-cols-3 gap-3 flex-1 overflow-hidden min-h-0">
        <ResultsPanel
          type="7"
          label="7時間勤務者"
          colorClass="border-blue-200"
          headerClass="bg-blue-600"
        />
        <ResultsPanel
          type="8"
          label="8時間勤務者"
          colorClass="border-purple-200"
          headerClass="bg-purple-600"
        />
        <ResultsPanel
          type="exc"
          label="Exception"
          colorClass="border-amber-200"
          headerClass="bg-amber-500"
        />
      </div>

      {/* 未マッチ */}
      <UnmatchedArea />
    </div>
  )
}
