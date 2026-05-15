'use client'

import { useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

export function MasterDropZone() {
  const loadMaster = useAppStore(s => s.loadMaster)
  const loaded     = useAppStore(s => s.master.loaded)
  const inputRef   = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const file = Array.from(files)[0]
    if (!file) return
    const buf = await file.arrayBuffer()
    const wb  = XLSX.read(new Uint8Array(buf), { type: 'array' })
    loadMaster(wb)
  }, [loadMaster])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-1',
        'rounded-lg border-2 border-dashed p-4 text-center cursor-pointer',
        'transition-colors text-xs',
        loaded
          ? 'border-green-400 bg-green-50 text-green-700'
          : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/50',
      )}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />
      <span className="text-lg">{loaded ? '✓' : '📋'}</span>
      {loaded ? (
        <span className="font-medium">読み込み済み</span>
      ) : (
        <>
          <span className="font-medium text-muted-foreground">参照ファイルをドロップ</span>
          <span className="text-muted-foreground/70">勤務者名簿_振分用.xlsx</span>
        </>
      )}
    </div>
  )
}
