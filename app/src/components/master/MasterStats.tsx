'use client'

import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'

export function MasterStats() {
  const counts = useAppStore(s => s.master.counts)
  const loaded = useAppStore(s => s.master.loaded)

  if (!loaded) return null

  return (
    <div className="flex flex-col gap-1 px-2">
      <div className="flex items-center justify-between text-xs">
        <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">7時間</Badge>
        <span className="text-muted-foreground">{counts.h7}名</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">8時間</Badge>
        <span className="text-muted-foreground">{counts.h8}名</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Exc</Badge>
        <span className="text-muted-foreground">{counts.exc}名</span>
      </div>
    </div>
  )
}
