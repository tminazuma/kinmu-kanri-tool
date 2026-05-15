'use client'

import { create } from 'zustand'
import * as XLSX from 'xlsx'
import { uid, formatDate } from '@/lib/work-utils'
import { loadMasterWorkbook, classifyFile, type MasterMaps, type WorkType } from '@/lib/sorter'
import { processWorkFile, type RoundMode, type TimeFormat, type OvertimeRule, type ProcessedData } from '@/lib/calculator'

export type ItemStatus = 'pending' | 'processing' | 'success' | 'error' | 'exc'

export interface WorkItem {
  file:       File
  type:       WorkType
  matched?:   string
  extracted?: string
  status:     ItemStatus
  changes?:   number
  errorMsg?:  string
}

interface MasterState {
  maps:   MasterMaps
  counts: { h7: number; h8: number; exc: number }
  loaded: boolean
}

interface AppState {
  master:        MasterState
  roundMode:     RoundMode
  timeFormat:    TimeFormat
  items:         Record<string, WorkItem>
  processedData: Record<string, ProcessedData>
  previewId:     string | null

  loadMaster:          (wb: XLSX.WorkBook) => void
  addWorkFiles:        (files: File[]) => void
  addWorkFilesManual:  (files: File[], overtimeRule: OvertimeRule) => void
  setRoundMode:        (m: RoundMode) => void
  setTimeFormat:       (f: TimeFormat) => void
  updateItem:          (id: string, patch: Partial<WorkItem>) => void
  setProcessed:        (id: string, data: ProcessedData) => void
  removeItem:          (id: string) => void
  clearResults:        () => void
  openPreview:         (id: string) => void
  closePreview:        () => void
}

const emptyMaster: MasterState = {
  maps:   { h7: new Map(), h8: new Map(), exc: new Map() },
  counts: { h7: 0, h8: 0, exc: 0 },
  loaded: false,
}

export const useAppStore = create<AppState>((set, get) => ({
  master:        emptyMaster,
  roundMode:     'floor',
  timeFormat:    'decimal',
  items:         {},
  processedData: {},
  previewId:     null,

  loadMaster(wb) {
    const { maps, counts } = loadMasterWorkbook(wb)
    set({ master: { maps, counts, loaded: true } })
  },

  addWorkFiles(files) {
    const { master, roundMode, timeFormat } = get()
    const validExts = /\.(xlsx|xls|csv)$/i

    for (const file of files) {
      if (!validExts.test(file.name)) continue
      const id = uid()

      let type: WorkType
      let matched: string | undefined
      let extracted: string | undefined

      if (master.loaded) {
        const result = classifyFile(file.name, master.maps)
        type = result.type
        if (result.type !== 'unmatched') matched   = result.matched
        else                             extracted = result.extracted
      } else {
        // 手動モード時は呼び出し元が type を上書きするので仮置き
        type = 'unmatched'
        extracted = file.name
      }

      set(s => ({
        items: {
          ...s.items,
          [id]: { file, type, matched, extracted, status: 'pending' },
        },
      }))

      if (type === 'exc') {
        // Exception はそのまま保存（計算なし）
        file.arrayBuffer().then(buf => {
          const wb2 = XLSX.read(buf, { type: 'array' })
          const sh  = wb2.SheetNames[0]
          const data = XLSX.utils.sheet_to_json<unknown[]>(wb2.Sheets[sh], { header: 1, defval: '' })
          const out  = XLSX.write(wb2, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
          const blob = new Blob([out], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })
          set(s => ({
            items:         { ...s.items,         [id]: { ...s.items[id], status: 'exc' } },
            processedData: {
              ...s.processedData,
              [id]: { data, headerIndex: 0, changes: 0, excelBlob: blob, originalName: file.name, overtimeRule: '7', processedAt: formatDate(new Date()) },
            },
          }))
        }).catch(() => {
          set(s => ({ items: { ...s.items, [id]: { ...s.items[id], status: 'error', errorMsg: '読み込み失敗' } } }))
        })
        continue
      }

      if (type === 'unmatched') {
        set(s => ({ items: { ...s.items, [id]: { ...s.items[id], status: 'error', errorMsg: '未マッチ' } } }))
        continue
      }

      // 7h / 8h 計算
      const rule: OvertimeRule = type === '7' ? '7' : '8'
      set(s => ({ items: { ...s.items, [id]: { ...s.items[id], status: 'processing' } } }))
      processWorkFile(file, rule, roundMode, timeFormat).then(result => {
        if ('message' in result) {
          set(s => ({ items: { ...s.items, [id]: { ...s.items[id], status: 'error', errorMsg: result.message } } }))
          return
        }
        set(s => ({
          items:         { ...s.items,         [id]: { ...s.items[id], status: 'success', changes: result.changes } },
          processedData: { ...s.processedData, [id]: result },
        }))
      }).catch(e => {
        const msg = e instanceof Error ? e.message : '計算エラー'
        set(s => ({ items: { ...s.items, [id]: { ...s.items[id], status: 'error', errorMsg: msg } } }))
      })
    }
  },

  addWorkFilesManual(files: File[], overtimeRule: OvertimeRule) {
    const { roundMode, timeFormat } = get()
    const validExts = /\.(xlsx|xls|csv)$/i

    for (const file of files) {
      if (!validExts.test(file.name)) continue
      const id = uid()
      const type: WorkType = overtimeRule

      set(s => ({
        items: { ...s.items, [id]: { file, type, status: 'processing' } },
      }))

      processWorkFile(file, overtimeRule, roundMode, timeFormat).then(result => {
        if ('message' in result) {
          set(s => ({ items: { ...s.items, [id]: { ...s.items[id], status: 'error', errorMsg: result.message } } }))
          return
        }
        set(s => ({
          items:         { ...s.items,         [id]: { ...s.items[id], status: 'success', changes: result.changes } },
          processedData: { ...s.processedData, [id]: result },
        }))
      }).catch(e => {
        const msg = e instanceof Error ? e.message : '計算エラー'
        set(s => ({ items: { ...s.items, [id]: { ...s.items[id], status: 'error', errorMsg: msg } } }))
      })
    }
  },

  setRoundMode:  m => set({ roundMode: m }),
  setTimeFormat: f => set({ timeFormat: f }),

  updateItem(id, patch) {
    set(s => ({ items: { ...s.items, [id]: { ...s.items[id], ...patch } } }))
  },

  setProcessed(id, data) {
    set(s => ({ processedData: { ...s.processedData, [id]: data } }))
  },

  removeItem(id) {
    set(s => {
      const items = { ...s.items }
      const processedData = { ...s.processedData }
      delete items[id]
      delete processedData[id]
      return { items, processedData }
    })
  },

  clearResults: () => set({ items: {}, processedData: {} }),
  openPreview:  id => set({ previewId: id }),
  closePreview: ()  => set({ previewId: null }),
}))
