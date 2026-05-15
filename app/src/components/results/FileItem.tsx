'use client'

import { Trash2, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type WorkItem } from '@/store/appStore'
import { downloadFile } from '@/lib/printer'

interface Props {
  id:   string
  item: WorkItem
}

function StatusBadge({ item }: { item: WorkItem }) {
  if (item.status === 'pending' || item.status === 'processing') {
    return (
      <Badge variant="secondary" className="text-xs animate-pulse">
        {item.status === 'pending' ? '待機中' : '計算中…'}
      </Badge>
    )
  }
  if (item.status === 'error') {
    return <Badge variant="destructive" className="text-xs">{item.errorMsg ?? 'エラー'}</Badge>
  }
  if (item.status === 'exc') {
    return <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">Exception</Badge>
  }
  return (
    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
      ✓ {item.changes}セル更新
    </Badge>
  )
}

export function FileItem({ id, item }: Props) {
  const openPreview   = useAppStore(s => s.openPreview)
  const removeItem    = useAppStore(s => s.removeItem)
  const processedData = useAppStore(s => s.processedData)
  const pd            = processedData[id]

  const displayName = item.matched ?? item.extracted ?? item.file.name

  return (
    <div className="flex flex-col gap-1 px-3 py-2 border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium leading-tight break-all line-clamp-2">
          {displayName}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-1">
        <StatusBadge item={item} />

        {pd && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={() => openPreview(id)}
              title="プレビュー"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={() => downloadFile(pd)}
              title="Excelをダウンロード"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
