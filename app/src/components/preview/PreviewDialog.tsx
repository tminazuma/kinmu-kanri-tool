'use client'

import { Download } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/store/appStore'
import { downloadFile } from '@/lib/printer'

export function PreviewDialog() {
  const previewId   = useAppStore(s => s.previewId)
  const closePreview= useAppStore(s => s.closePreview)
  const processedData = useAppStore(s => s.processedData)

  const pd = previewId ? processedData[previewId] : null

  if (!pd) return null

  const headers = (pd.data[pd.headerIndex] ?? []) as unknown[]
  const rows    = pd.data.slice(pd.headerIndex + 1).filter(r => r && (r as unknown[]).length > 0)

  return (
    <Dialog open={!!previewId} onOpenChange={open => !open && closePreview()}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col gap-3">
        <DialogHeader className="flex-row items-center justify-between gap-2 shrink-0">
          <DialogTitle className="text-sm font-semibold truncate">{pd.originalName}</DialogTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={() => downloadFile(pd)}
          >
            <Download className="h-4 w-4" />
            Excel DL
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((h, i) => (
                  <TableHead key={i} className="text-xs whitespace-nowrap py-1.5 px-2">
                    {String(h ?? '')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, ri) => {
                const cells     = row as unknown[]
                const isFooter  = ri === rows.length - 1 && cells.includes('残業合計')
                return (
                  <TableRow key={ri} className={isFooter ? 'bg-indigo-50 font-semibold' : undefined}>
                    {cells.map((cell, ci) => (
                      <TableCell key={ci} className="text-xs whitespace-nowrap py-1 px-2">
                        {String(cell ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
