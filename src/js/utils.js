// js/utils.js — 全モジュールで共有する純粋ユーティリティ関数
// DOM・状態への依存なし

/** 全角・半角・スペース類を正規化して比較用文字列を返す */
function normalize(str) {
  if (str == null) return '';
  return String(str).normalize('NFKC').replace(/[\s　]+/g, '').trim();
}

/** Excelシートの1行目がヘッダーっぽいか判定 */
function isLikelyHeader(row) {
  if (!row || row.length === 0) return false;
  const kws = ['7時間', '8時間', '名前', '氏名', '7h', '8h', 'name', '区分'];
  return row.some(cell =>
    kws.some(kw => String(cell).toLowerCase().includes(kw.toLowerCase()))
  );
}

/**
 * ファイル名から照合用の名前を抽出する
 * ルール：拡張子を除き、最初の「_」より前を使用
 * 例）田中太郎_20260416.xlsx → "田中太郎"
 */
function extractNameFromFilename(filename) {
  const noExt = filename.replace(/\.[^.]+$/, '');
  return noExt.split('_')[0].trim();
}

/**
 * ファイル名からID番号を抽出（印刷時のソートに使用）
 * 例）xxx_12345_yyy.xlsx → 12345
 */
function extractId(filename) {
  const m = filename.match(/_(\d+)_/);
  if (m) return parseInt(m[1], 10);
  const m2 = filename.match(/_(\d+)\./);
  if (m2) return parseInt(m2[1], 10);
  return Infinity;
}

/** 日時を "YYYY/MM/DD HH:MM" 形式にフォーマット */
function formatDate(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 分 → "HH:MM" 文字列 */
function minutesToTimeString(m) {
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

/** 分 → 10進数（小数点2桁） */
function minutesToDecimal(m) {
  return Math.round((m / 60) * 100) / 100;
}

/** 時刻値（数値 or "HH:MM" 文字列）を分に変換 */
function parseToMinutes(val) {
  if (typeof val === 'number') return Math.round(val * 24 * 60);
  if (typeof val === 'string' && val.includes(':')) {
    const [h, m] = val.split(':');
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }
  return null;
}

/** セル値が有効な時刻として使えるか判定 */
function isValidTime(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return /^\d{1,3}:\d{2}/.test(val);
  if (typeof val === 'number') return val >= 0;
  return false;
}

/** ランダムなID文字列を生成 */
function uid() {
  return 'f-' + Math.random().toString(36).substr(2, 9);
}
