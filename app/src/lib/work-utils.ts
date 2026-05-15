// 勤務管理ユーティリティ — 全モジュールで共有する純粋関数

export function normalize(str: string | null | undefined): string {
  if (str == null) return ''
  return String(str).normalize('NFKC').replace(/[\s　]+/g, '').trim()
}

export function isLikelyHeader(row: unknown[]): boolean {
  if (!row || row.length === 0) return false
  const kws = ['7時間', '8時間', '名前', '氏名', '7h', '8h', 'name', '区分']
  return row.some(cell =>
    kws.some(kw => String(cell).toLowerCase().includes(kw.toLowerCase()))
  )
}

export function extractNameFromFilename(filename: string): string {
  const noExt = filename.replace(/\.[^.]+$/, '')
  return noExt.split('_')[0].trim()
}

export function extractId(filename: string): number {
  const m = filename.match(/_(\d+)_/)
  if (m) return parseInt(m[1], 10)
  const m2 = filename.match(/_(\d+)\./)
  if (m2) return parseInt(m2[1], 10)
  return Infinity
}

export function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function minutesToTimeString(m: number): string {
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`
}

export function minutesToDecimal(m: number): number {
  return Math.round((m / 60) * 100) / 100
}

export function parseToMinutes(val: number | string | null | undefined): number | null {
  if (typeof val === 'number') return Math.round(val * 24 * 60)
  if (typeof val === 'string' && val.includes(':')) {
    const [h, m] = val.split(':')
    return parseInt(h, 10) * 60 + parseInt(m, 10)
  }
  return null
}

export function isValidTime(val: unknown): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'string') return /^\d{1,3}:\d{2}/.test(val)
  if (typeof val === 'number') return val >= 0
  return false
}

export function uid(): string {
  return 'f-' + Math.random().toString(36).substr(2, 9)
}

export function getRoundedTime(val: number | string, mode: RoundMode): { text: string; minutes: number } {
  let totalMinutes = 0
  if (typeof val === 'number') {
    totalMinutes = Math.round(val * 24 * 60)
  } else if (typeof val === 'string') {
    const parts = val.split(':')
    if (parts.length < 2) return { text: val, minutes: 0 }
    totalMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
  } else {
    return { text: String(val), minutes: 0 }
  }
  const iv = 15
  let rm: number
  if (mode === 'floor')     rm = Math.floor(totalMinutes / iv) * iv
  else if (mode === 'ceil') rm = Math.ceil(totalMinutes / iv) * iv
  else                      rm = Math.round(totalMinutes / iv) * iv
  return { text: minutesToTimeString(rm), minutes: rm }
}

export type RoundMode = 'floor' | 'ceil' | 'round'
