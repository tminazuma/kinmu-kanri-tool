import { useEffect } from 'react'
import * as XLSX from 'xlsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { WorkDropZone } from '@/components/work/WorkDropZone'
import { ResultsArea } from '@/components/results/ResultsArea'
import { PreviewDialog } from '@/components/preview/PreviewDialog'
import { useAppStore } from '@/store/appStore'

export function App() {
  const loadMaster = useAppStore(s => s.loadMaster)

  useEffect(() => {
    fetch('./勤務者名簿_振分用.xlsx')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.arrayBuffer() })
      .then(buf => {
        const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
        loadMaster(wb)
      })
      .catch(() => {})
  }, [loadMaster])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">
          <div className="flex flex-col gap-4 p-5 h-full overflow-hidden">
            <section>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                STEP 2 — 勤務ファイル投入
              </p>
              <WorkDropZone />
            </section>
            <ResultsArea />
            <PreviewDialog />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
