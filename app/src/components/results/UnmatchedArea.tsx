'use client'

import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'

export function UnmatchedArea() {
  const items = useAppStore(s => s.items)

  const unmatched = Object.entries(items).filter(([, item]) => item.type === 'unmatched')
  if (unmatched.length === 0) return null

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <span className="font-semibold text-sm">参照リストに見つからなかったファイル</span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {unmatched.map(([id, item]) => (
            <Badge
              key={id}
              variant="outline"
              className="border-amber-300 text-amber-800 bg-amber-100 text-xs"
            >
              {item.extracted ?? item.file.name}
            </Badge>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}
