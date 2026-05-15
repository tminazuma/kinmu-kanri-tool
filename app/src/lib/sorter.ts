import * as XLSX from 'xlsx'
import { normalize, extractNameFromFilename, isLikelyHeader } from './work-utils'

export type WorkType = '7' | '8' | 'exc' | 'unmatched'

export interface MasterMaps {
  h7:  Map<string, string>
  h8:  Map<string, string>
  exc: Map<string, string>
}

export type ClassifyResult =
  | { type: '7' | '8'; matched: string }
  | { type: 'exc';       matched: string }
  | { type: 'unmatched'; extracted: string }

export function loadMasterWorkbook(wb: XLSX.WorkBook): {
  maps:   MasterMaps
  counts: { h7: number; h8: number; exc: number }
} {
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })

  const h7  = new Map<string, string>()
  const h8  = new Map<string, string>()
  const exc = new Map<string, string>()

  const start = isLikelyHeader(rows[0] as unknown[]) ? 1 : 0
  for (let i = start; i < rows.length; i++) {
    const r   = rows[i] as unknown[]
    const n7  = String(r[0] ?? '').trim()
    const n8  = String(r[1] ?? '').trim()
    const nEx = String(r[2] ?? '').trim()
    if (n7)  h7.set(normalize(n7), n7)
    if (n8)  h8.set(normalize(n8), n8)
    if (nEx) exc.set(normalize(nEx), nEx)
  }

  return {
    maps:   { h7, h8, exc },
    counts: { h7: h7.size, h8: h8.size, exc: exc.size },
  }
}

export function classifyFile(filename: string, maps: MasterMaps): ClassifyResult {
  const rawName  = extractNameFromFilename(filename)
  const normName = normalize(rawName)

  if (maps.h7.has(normName))  return { type: '7',         matched:   maps.h7.get(normName)!  }
  if (maps.h8.has(normName))  return { type: '8',         matched:   maps.h8.get(normName)!  }
  if (maps.exc.has(normName)) return { type: 'exc',       matched:   maps.exc.get(normName)! }
  return                             { type: 'unmatched', extracted: rawName                  }
}
