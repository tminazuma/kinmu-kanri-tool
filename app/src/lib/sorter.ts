import * as XLSX from 'xlsx'
import { normalize, extractNameFromFilename, isLikelyHeader } from './work-utils'

export type WorkType = '6' | '8' | 'exc' | 'unmatched'

export interface MasterMaps {
  h6:  Map<string, string>
  h8:  Map<string, string>
  exc: Map<string, string>
}

export type ClassifyResult =
  | { type: '6' | '8'; matched: string }
  | { type: 'exc';       matched: string }
  | { type: 'unmatched'; extracted: string }

export function loadMasterWorkbook(wb: XLSX.WorkBook): {
  maps:   MasterMaps
  counts: { h6: number; h8: number; exc: number }
} {
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })

  const h6  = new Map<string, string>()
  const h8  = new Map<string, string>()
  const exc = new Map<string, string>()

  const start = isLikelyHeader(rows[0] as unknown[]) ? 1 : 0
  for (let i = start; i < rows.length; i++) {
    const r   = rows[i] as unknown[]
    const n6  = String(r[0] ?? '').trim()
    const n8  = String(r[1] ?? '').trim()
    const nEx = String(r[2] ?? '').trim()
    if (n6)  h6.set(normalize(n6), n6)
    if (n8)  h8.set(normalize(n8), n8)
    if (nEx) exc.set(normalize(nEx), nEx)
  }

  return {
    maps:   { h6, h8, exc },
    counts: { h6: h6.size, h8: h8.size, exc: exc.size },
  }
}

export function classifyFile(filename: string, maps: MasterMaps): ClassifyResult {
  const rawName  = extractNameFromFilename(filename)
  const normName = normalize(rawName)

  if (maps.h6.has(normName))  return { type: '6',         matched:   maps.h6.get(normName)!  }
  if (maps.h8.has(normName))  return { type: '8',         matched:   maps.h8.get(normName)!  }
  if (maps.exc.has(normName)) return { type: 'exc',       matched:   maps.exc.get(normName)! }
  return                             { type: 'unmatched', extracted: rawName                  }
}
