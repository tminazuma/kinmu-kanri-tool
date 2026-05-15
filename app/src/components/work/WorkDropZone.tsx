'use client'

import { useRef, useCallback } from 'react'
import { FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

export function WorkDropZone() {
  const addWorkFiles  = useAppStore(s => s.addWorkFiles)
  const masterLoaded  = useAppStore(s => s.master.loaded)
  const addManual     = useAppStore(s => s.addWorkFilesManual)
  const inputAutoRef  = useRef<HTMLInputElement>(null)
  const input7hRef    = useRef<HTMLInputElement>(null)
  const input8hRef    = useRef<HTMLInputElement>(null)

  const handleAuto = useCallback((files: FileList | File[]) => {
    addWorkFiles(Array.from(files))
  }, [addWorkFiles])

  if (masterLoaded) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 p-6',
          'rounded-xl border-2 border-dashed border-indigo-300',
          'bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors',
          'min-h-[120px]',
        )}
        onDrop={e => { e.preventDefault(); handleAuto(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputAutoRef.current?.click()}
      >
        <input
          ref={inputAutoRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={e => e.target.files && handleAuto(e.target.files)}
        />
        <FolderOpen className="h-8 w-8 text-indigo-400" />
        <div className="text-center">
          <p className="text-sm font-semibold text-indigo-700">複数ファイルをここにドロップ</p>
          <p className="text-xs text-indigo-400 mt-0.5">またはクリックして選択（Excel / CSV）</p>
        </div>
      </div>
    )
  }

  // 手動モード
  return (
    <div className="space-y-2">
      <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
        ⚠ 参照リスト未読込 — 計算基準ごとにドロップしてください
      </p>
      <div className="grid grid-cols-2 gap-3">
        {([
          { label: '7時間基準', rule: '7' as const, ref: input7hRef, color: 'blue' },
          { label: '8時間基準', rule: '8' as const, ref: input8hRef, color: 'purple' },
        ] as const).map(({ label, rule, ref, color }) => (
          <div
            key={rule}
            className={cn(
              'flex flex-col items-center justify-center gap-1 p-4 rounded-xl',
              'border-2 border-dashed cursor-pointer transition-colors min-h-[90px]',
              color === 'blue'
                ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50'
                : 'border-purple-300 bg-purple-50/50 hover:bg-purple-50',
            )}
            onDrop={e => { e.preventDefault(); addManual(Array.from(e.dataTransfer.files), rule) }}
            onDragOver={e => e.preventDefault()}
            onClick={() => ref.current?.click()}
          >
            <input
              ref={ref}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => e.target.files && addManual(Array.from(e.target.files), rule)}
            />
            <FolderOpen className={cn('h-6 w-6', color === 'blue' ? 'text-blue-400' : 'text-purple-400')} />
            <p className={cn('text-xs font-semibold', color === 'blue' ? 'text-blue-700' : 'text-purple-700')}>
              {label}のファイル
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
