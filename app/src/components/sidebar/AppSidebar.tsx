'use client'

import { Printer } from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { MasterDropZone } from '@/components/master/MasterDropZone'
import { MasterStats } from '@/components/master/MasterStats'
import { useAppStore } from '@/store/appStore'
import { openAllInBrowser } from '@/lib/printer'
import type { RoundMode, TimeFormat } from '@/lib/calculator'

export function AppSidebar() {
  const roundMode    = useAppStore(s => s.roundMode)
  const timeFormat   = useAppStore(s => s.timeFormat)
  const setRoundMode = useAppStore(s => s.setRoundMode)
  const setTimeFormat= useAppStore(s => s.setTimeFormat)
  const items        = useAppStore(s => s.items)
  const processedData= useAppStore(s => s.processedData)

  return (
    <Sidebar>
      {/* ヘッダー */}
      <SidebarHeader className="px-4 pt-5 pb-3">
        <h1 className="text-sm font-bold leading-tight text-sidebar-foreground">
          勤務管理ツール
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">
          振り分け＆残業計算
        </p>
      </SidebarHeader>

      <SidebarContent className="gap-0">

        {/* STEP 1 */}
        <SidebarGroup>
          <SidebarGroupLabel>STEP 1 — 参照ファイル</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <MasterDropZone />
            <div className="mt-2">
              <MasterStats />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-2" />

        {/* 計算設定 */}
        <SidebarGroup>
          <SidebarGroupLabel>計算設定</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-4">

            <div>
              <p className="text-xs font-medium text-sidebar-foreground/70 mb-2">15分丸め方法</p>
              <RadioGroup
                value={roundMode}
                onValueChange={v => setRoundMode(v as RoundMode)}
                className="gap-1.5"
              >
                {([['floor', '切り下げ'], ['ceil', '切り上げ'], ['round', '四捨五入']] as const).map(([v, label]) => (
                  <div key={v} className="flex items-center gap-2">
                    <RadioGroupItem value={v} id={`round-${v}`} />
                    <Label htmlFor={`round-${v}`} className="text-xs cursor-pointer">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <p className="text-xs font-medium text-sidebar-foreground/70 mb-2">時間表示形式</p>
              <RadioGroup
                value={timeFormat}
                onValueChange={v => setTimeFormat(v as TimeFormat)}
                className="gap-1.5"
              >
                {([['decimal', '10進法（1.25）'], ['time', '時分（01:15）']] as const).map(([v, label]) => (
                  <div key={v} className="flex items-center gap-2">
                    <RadioGroupItem value={v} id={`fmt-${v}`} />
                    <Label htmlFor={`fmt-${v}`} className="text-xs cursor-pointer">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* フッター — 一括印刷ボタン */}
      <SidebarFooter className="p-3">
        <Button
          className="w-full gap-2"
          onClick={() => openAllInBrowser(items, processedData)}
          disabled={Object.keys(processedData).length === 0}
        >
          <Printer className="h-4 w-4" />
          一括印刷（ID順）
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
