'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileItem } from './FileItem'
import { useAppStore, type WorkItem } from '@/store/appStore'
import { cn } from '@/lib/utils'
import type { WorkType } from '@/lib/sorter'

interface Props {
  type:        WorkType
  label:       string
  colorClass:  string
  headerClass: string
}

export function ResultsPanel({ type, label, colorClass, headerClass }: Props) {
  const items = useAppStore(s => s.items)

  const filtered = Object.entries(items).filter(
    ([, item]) => item.type === type
  ) as [string, WorkItem][]

  return (
    <div className={cn('flex flex-col rounded-xl border overflow-hidden', colorClass)}>
      {/* パネルヘッダー */}
      <div className={cn('flex items-center justify-between px-3 py-2', headerClass)}>
        <span className="text-sm font-semibold text-white">{label}</span>
        <Badge className="bg-white/20 text-white hover:bg-white/20 text-xs">
          {filtered.length}件
        </Badge>
      </div>

      {/* ファイルリスト */}
      <ScrollArea className="flex-1 bg-background">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            データがありません
          </p>
        ) : (
          filtered.map(([id, item]) => (
            <FileItem key={id} id={id} item={item} />
          ))
        )}
      </ScrollArea>
    </div>
  )
}
