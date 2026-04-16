// js/sorter.js — マスターリスト管理と振り分けロジック
// utils.js の関数に依存。DOM への依存なし。

/** マスターリストの状態（モジュールスコープ） */
const master = {
  h7:     new Map(), // normalize(名前) → 元の名前  (7時間勤務者)
  h8:     new Map(), // normalize(名前) → 元の名前  (8時間勤務者)
  exc:    new Map(), // normalize(名前) → 元の名前  (Exception)
  loaded: false
};

/**
 * XLSXワークブックからマスターリストを読み込む
 * A列：7時間勤務者、B列：8時間勤務者、C列：Exception
 * @param {object} wb - XLSX.read() の返り値
 * @returns {{ h7: number, h8: number, exc: number }} 各カテゴリの人数
 */
function loadMasterWorkbook(wb) {
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  master.h7  = new Map();
  master.h8  = new Map();
  master.exc = new Map();

  // 1行目がヘッダーっぽければスキップ
  const start = isLikelyHeader(rows[0]) ? 1 : 0;
  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    const n7  = String(r[0] || '').trim();
    const n8  = String(r[1] || '').trim();
    const nEx = String(r[2] || '').trim();
    if (n7)  master.h7.set(normalize(n7), n7);
    if (n8)  master.h8.set(normalize(n8), n8);
    if (nEx) master.exc.set(normalize(nEx), nEx);
  }
  master.loaded = true;

  return { h7: master.h7.size, h8: master.h8.size, exc: master.exc.size };
}

/**
 * ファイル名をマスターリストで照合し、種別を返す
 * @param {string} filename
 * @returns {
 *   { type: '7'|'8', matched: string }      // マッチ（overtime計算対象）
 *   | { type: 'exc', matched: string }       // Exception（計算除外）
 *   | { type: 'unmatched', extracted: string } // 未マッチ
 * }
 */
function classifyFile(filename) {
  const rawName  = extractNameFromFilename(filename);
  const normName = normalize(rawName);

  if (master.h7.has(normName))  return { type: '7',         matched:   master.h7.get(normName)  };
  if (master.h8.has(normName))  return { type: '8',         matched:   master.h8.get(normName)  };
  if (master.exc.has(normName)) return { type: 'exc',       matched:   master.exc.get(normName) };
  return                               { type: 'unmatched', extracted: rawName                  };
}
