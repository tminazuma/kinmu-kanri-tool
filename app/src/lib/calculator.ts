import * as XLSX from 'xlsx'
import {
  isValidTime,
  parseToMinutes,
  minutesToTimeString,
  minutesToDecimal,
  getRoundedTime,
  type RoundMode,
} from './work-utils'

export type { RoundMode }
export type TimeFormat   = 'decimal' | 'time'
export type OvertimeRule = '7' | '8'

export interface ProcessedData {
  data:         unknown[][]
  headerIndex:  number
  changes:      number
  excelBlob:    Blob
  originalName: string
  overtimeRule: OvertimeRule
  processedAt:  string
}

export interface CalcSuccess {
  status:        'success'
  data:          unknown[][]
  changes:       number
  headerRowIndex: number
}
export interface CalcError {
  status:  'error'
  message: string
}
export type CalcResult = CalcSuccess | CalcError

function getRounded(val: unknown, mode: RoundMode) {
  return getRoundedTime(val as number | string, mode)
}

export function calcSheetData(
  data:         unknown[][],
  roundMode:    RoundMode,
  overtimeRule: OvertimeRule,
  timeFormat:   TimeFormat,
): CalcResult {
  const WK = '勤務時間', OT = '残業時間', BK = '休憩時間'
  const ST = '始業時刻',  ET = '終業時刻',  LV = '退勤時刻', AT = '出勤時刻'
  const ROW_KEYWORDS = ['始業', '終業', '勤怠', '出勤', '退勤', '日付', '曜日']

  let headerRowIndex = -1
  let wIdx = -1, oIdx = -1, bIdx = -1, stIdx = -1, etIdx = -1, lvIdx = -1, atIdx = -1

  for (let i = 0; i < Math.min(data.length, 50); i++) {
    const row = data[i]
    if (!Array.isArray(row)) continue
    const wi = row.findIndex((c: unknown) => String(c).includes(WK))
    if (wi !== -1 && row.some((c: unknown) => ROW_KEYWORDS.some(k => String(c).includes(k)))) {
      headerRowIndex = i
      wIdx  = wi
      oIdx  = row.findIndex((c: unknown) => String(c).includes(OT))
      bIdx  = row.findIndex((c: unknown) => String(c).includes(BK))
      stIdx = row.findIndex((c: unknown) => String(c).includes(ST))
      etIdx = row.findIndex((c: unknown) => String(c).includes(ET))
      lvIdx = row.findIndex((c: unknown) => String(c).includes(LV))
      atIdx = row.findIndex((c: unknown) => String(c).includes(AT))
      break
    }
  }
  if (wIdx === -1) return { status: 'error', message: '「勤務時間」列が見つかりません' }

  let changes = 0, totalWork = 0, totalOT = 0
  const zero = timeFormat === 'decimal' ? 0 : '00:00'

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i] as unknown[]
    if (!row) continue

    const hasStamps = (atIdx !== -1 && lvIdx !== -1)
      ? (isValidTime(row[atIdx]) && isValidTime(row[lvIdx]))
      : true
    if (!hasStamps) {
      if (row[wIdx] !== zero)                   { row[wIdx] = zero; changes++ }
      if (oIdx !== -1 && row[oIdx] !== zero)    { row[oIdx] = zero; changes++ }
      if (bIdx !== -1 && row[bIdx] !== zero)    { row[bIdx] = zero; changes++ }
      continue
    }

    const orig = row[wIdx]
    if (!isValidTime(orig)) continue

    const rounded = getRounded(orig, roundMode)
    totalWork += rounded.minutes
    const fmtWork = timeFormat === 'decimal'
      ? minutesToDecimal(rounded.minutes)
      : minutesToTimeString(rounded.minutes)
    if (fmtWork !== orig) { row[wIdx] = fmtWork; changes++ }

    const sv = stIdx !== -1 ? String(row[stIdx]).trim() : ''
    const ev = etIdx !== -1 ? String(row[etIdx]).trim() : ''

    const isSpecial = overtimeRule === '8' && sv.includes('17:00') && ev.includes('33:00')
    const isFree    = sv === '' && ev === ''
    let   isShort   = false
    if (overtimeRule === '7' && stIdx !== -1 && etIdx !== -1) {
      const sm = parseToMinutes(row[stIdx] as number | string)
      const em = parseToMinutes(row[etIdx] as number | string)
      if (sm !== null && em !== null) {
        let diff = em - sm
        if (diff < 0) diff += 1440
        if (diff === 210) isShort = true
      }
    }

    let otMin = 0
    if (isSpecial && lvIdx !== -1 && isValidTime(row[lvIdx])) {
      otMin = Math.max(0, rounded.minutes - (overtimeRule === '8' ? 900 : 420))
    } else if (isShort) {
      otMin = Math.max(0, rounded.minutes - 210)
    } else if (isFree) {
      if (overtimeRule === '7') {
        if (rounded.minutes > 420) {
          const bv = timeFormat === 'decimal' ? 0.75 : '00:45'
          if (bIdx !== -1 && row[bIdx] !== bv) { row[bIdx] = bv; changes++ }
          totalWork -= 45; rounded.minutes -= 45
          const nw = timeFormat === 'decimal'
            ? minutesToDecimal(rounded.minutes)
            : minutesToTimeString(rounded.minutes)
          if (row[wIdx] !== nw) { row[wIdx] = nw; changes++ }
        }
        otMin = Math.max(0, rounded.minutes - 420)
      } else {
        if (rounded.minutes > 480) {
          const bv = timeFormat === 'decimal' ? 1.0 : '01:00'
          if (bIdx !== -1 && row[bIdx] !== bv) { row[bIdx] = bv; changes++ }
          totalWork -= 60; rounded.minutes -= 60
          const nw = timeFormat === 'decimal'
            ? minutesToDecimal(rounded.minutes)
            : minutesToTimeString(rounded.minutes)
          if (row[wIdx] !== nw) { row[wIdx] = nw; changes++ }
        }
        otMin = Math.max(0, rounded.minutes - 480)
      }
    } else {
      otMin = Math.max(0, rounded.minutes - (overtimeRule === '7' ? 420 : 480))
    }

    const fmtOT = timeFormat === 'decimal' ? minutesToDecimal(otMin) : minutesToTimeString(otMin)
    if (oIdx !== -1 && fmtOT !== row[oIdx]) { row[oIdx] = fmtOT; changes++ }
    totalOT += otMin
  }

  if (headerRowIndex > 0) {
    const twv = timeFormat === 'decimal' ? minutesToDecimal(totalWork) : minutesToTimeString(totalWork)
    const tov = timeFormat === 'decimal' ? minutesToDecimal(totalOT)   : minutesToTimeString(totalOT)
    for (let i = 0; i < headerRowIndex; i++) {
      const row = data[i] as unknown[]
      if (!Array.isArray(row)) continue
      const wi2 = row.findIndex((c: unknown) => String(c).trim() === WK)
      if (wi2 !== -1 && row.length > wi2 + 1) { row[wi2 + 1] = twv; changes++ }
      const oi2 = row.findIndex((c: unknown) => String(c).trim() === OT)
      if (oi2 !== -1 && row.length > oi2 + 1) { row[oi2 + 1] = tov; changes++ }
    }
  }

  if (oIdx !== -1) {
    const colCount = (data[headerRowIndex] as unknown[]).length
    const footer   = new Array<unknown>(colCount).fill('')
    if (oIdx > 0) footer[oIdx - 1] = '残業合計'
    footer[oIdx] = timeFormat === 'decimal' ? minutesToDecimal(totalOT) : minutesToTimeString(totalOT)
    data.push(footer)
    changes++
  }

  return { status: 'success', data, changes, headerRowIndex }
}

export async function processWorkFile(
  file:         File,
  overtimeRule: OvertimeRule,
  roundMode:    RoundMode,
  timeFormat:   TimeFormat,
): Promise<{ status: 'error'; message: string } | ProcessedData> {
  const buf     = await file.arrayBuffer()
  const wb      = XLSX.read(buf, { type: 'array', cellDates: true, cellStyles: true })
  const shName  = wb.SheetNames[0]
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[shName], { header: 1, defval: '' })

  const result = calcSheetData(rawData, roundMode, overtimeRule, timeFormat)
  if (result.status === 'error') return result

  const newSheet  = XLSX.utils.aoa_to_sheet(result.data)
  const newWb     = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(newWb, newSheet, shName)
  const outBuf    = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const excelBlob = new Blob([outBuf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  return {
    data:         result.data,
    headerIndex:  result.headerRowIndex,
    changes:      result.changes,
    excelBlob,
    originalName: file.name,
    overtimeRule,
    processedAt:  new Date().toISOString(),
  }
}
