// js/app.js — アプリ全体の状態管理とイベント連携
// 読み込み順：utils.js → calculator.js → sorter.js → ui.js → app.js

// ─────────────────────────────────────────────────────────────────────────────
// グローバル状態
// ─────────────────────────────────────────────────────────────────────────────

const app = {
  /**
   * items: 投入された全ファイルの情報
   * fileId → {
   *   file: File,
   *   type: '7' | '8' | 'exc' | 'unmatched',
   *   matched?:   string,  // マスターで見つかった元の名前
   *   extracted?: string,  // 未マッチ時のファイル名から抽出した名前
   * }
   */
  items: {},

  /**
   * processedData: 計算完了ファイルの出力データ（プレビュー・印刷・DLに使用）
   * fileId → {
   *   data:         any[][],  // 2次元配列
   *   headerIndex:  number,
   *   excelBlob:    Blob,
   *   originalName: string,
   *   overtimeRule: '7' | '8',
   *   processedAt:  string,
   * }
   */
  processedData: {}
};

// ─────────────────────────────────────────────────────────────────────────────
// 設定値ヘルパー
// ─────────────────────────────────────────────────────────────────────────────

function getRoundMode()  { return 'floor'; }
function getTimeFormat() { return 'decimal'; }

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: マスターファイル読み込み
// ─────────────────────────────────────────────────────────────────────────────

async function onMasterFiles(files) {
  const file = files[0];
  if (!file) return;
  try {
    const data = await file.arrayBuffer();
    const wb   = XLSX.read(new Uint8Array(data), { type: 'array' });
    const counts = loadMasterWorkbook(wb);

    // ゾーンの表示を「読み込み済み」に更新
    const zone = document.getElementById('masterZone');
    zone.classList.add('dz-loaded');
    zone.querySelector('.dz-main').textContent = '✓ ' + file.name;
    zone.querySelector('.dz-sub').textContent  = '読み込み完了';

    // 人数バッジを表示
    document.getElementById('masterInfo').classList.remove('hidden');
    document.getElementById('count7hMaster').textContent  = counts.h7  + '名';
    document.getElementById('count8hMaster').textContent  = counts.h8  + '名';
    document.getElementById('countExcMaster').textContent = counts.exc + '名';

    // STEP 2 を自動モードに切り替え
    setWorkModeAuto();
  } catch (e) {
    console.error(e);
    alert('参照ファイルの読み込みに失敗しました：\n' + e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2（自動モード）: マスター照合 → 振り分け → 残業計算
// ─────────────────────────────────────────────────────────────────────────────

async function onWorkFilesAuto(files) {
  const valid = filterValid(files);
  if (!valid.length) { showWorkError('処理可能な Excel / CSV が見つかりませんでした。'); return; }
  hideWorkError();
  document.getElementById('resultsArea').classList.remove('hidden');

  for (const file of valid) {
    const cls    = classifyFile(file.name);    // sorter.js
    const fileId = uid();                       // utils.js
    app.items[fileId] = { file, ...cls };

    if (cls.type === 'unmatched') {
      // 未マッチは結果パネルには追加しない
      renderUnmatched();
      updateCountBadges();
      continue;
    }

    const listId = cls.type === '7' ? 'list7h' : cls.type === '8' ? 'list8h' : 'listExc';
    addFileItem(listId, fileId, file.name, cls.matched, cls.type);
    updateCountBadges();

    // Exception は残業計算しない
    if (cls.type === 'exc') continue;

    await runCalc(file, fileId, cls.type);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2（手動モード）: 7h / 8h ゾーンへのドロップ
// ─────────────────────────────────────────────────────────────────────────────

async function onWorkFiles7h(files) { await onWorkFilesManual(files, '7', 'list7h'); }
async function onWorkFiles8h(files) { await onWorkFilesManual(files, '8', 'list8h'); }

async function onWorkFilesManual(files, overtimeRule, listId) {
  const valid = filterValid(files);
  if (!valid.length) { showWorkError('処理可能な Excel / CSV が見つかりませんでした。'); return; }
  hideWorkError();
  document.getElementById('resultsArea').classList.remove('hidden');

  for (const file of valid) {
    const fileId = uid();
    app.items[fileId] = { file, type: overtimeRule };
    addFileItem(listId, fileId, file.name, null, overtimeRule);
    updateCountBadges();
    await runCalc(file, fileId, overtimeRule);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 残業計算の実行と結果保存
// ─────────────────────────────────────────────────────────────────────────────

async function runCalc(file, fileId, overtimeRule) {
  try {
    const result = await processWorkFile(  // calculator.js
      file,
      overtimeRule,
      getRoundMode(),
      getTimeFormat()
    );
    if (result.status === 'success') {
      app.processedData[fileId] = {
        data:         result.data,
        headerIndex:  result.headerIndex,
        excelBlob:    result.excelBlob,
        originalName: file.name,
        overtimeRule,
        processedAt:  formatDate(new Date())  // utils.js
      };
      updateFileItemStatus(fileId, 'success', result.changes);
    } else {
      updateFileItemStatus(fileId, 'error', null, result.message);
    }
  } catch (e) {
    console.error(e);
    updateFileItemStatus(fileId, 'error', null, e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────────────────────────────────────

/** Excel / CSV のみ、一時ファイル（~$...）を除外 */
function filterValid(files) {
  return files.filter(f =>
    /\.(xlsx|xls|csv)$/i.test(f.name) && !f.name.startsWith('~$')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 初期化
// ─────────────────────────────────────────────────────────────────────────────

setupDropZone('masterZone',    'masterInput',    onMasterFiles);
setupDropZone('workZoneAuto',  'workInputAuto',  onWorkFilesAuto);
setupDropZone('workZone7',     'workInput7',     onWorkFiles7h);
setupDropZone('workZone8',     'workInput8',     onWorkFiles8h);
