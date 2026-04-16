// js/ui.js — すべての DOM 操作・レンダリング・イベントヘルパー
// app.js で定義される `app` グローバルを参照する

// ─────────────────────────────────────────────────────────────────────────────
// ドロップゾーン セットアップ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 汎用ドロップゾーンを初期化する
 * @param {string} zoneId  - ゾーン要素のID
 * @param {string} inputId - <input type="file"> のID
 * @param {function} handler - handler(files: File[]) コールバック
 */
function setupDropZone(zoneId, inputId, handler) {
  const zone  = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dz-over'); });
  zone.addEventListener('dragleave', ()  => zone.classList.remove('dz-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dz-over');
    const files = [...e.dataTransfer.files];
    if (files.length) handler(files);
  });
  input.addEventListener('change', e => {
    const files = [...e.target.files];
    if (files.length) handler(files);
    e.target.value = '';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 モード切り替え（自動 / 手動）
// ─────────────────────────────────────────────────────────────────────────────

/** マスター読込済 → 自動振り分けモード */
function setWorkModeAuto() {
  document.getElementById('workModeAuto').classList.remove('hidden');
  document.getElementById('workModeManual').classList.add('hidden');
}

/** マスター未読込 → 手動振り分けモード（デフォルト） */
function setWorkModeManual() {
  document.getElementById('workModeAuto').classList.add('hidden');
  document.getElementById('workModeManual').classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// エラー表示
// ─────────────────────────────────────────────────────────────────────────────

function showWorkError(msg) {
  const el = document.getElementById('workZoneError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideWorkError() {
  document.getElementById('workZoneError').classList.add('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// ファイルアイテムの追加・更新
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 結果パネルにファイル行を追加する
 * @param {string} listId     - "list7h" | "list8h" | "listExc"
 * @param {string} fileId     - 一意のID
 * @param {string} filename
 * @param {string|null} matchedName - 照合名（手動モードはnull）
 * @param {'7'|'8'|'exc'} type
 */
function addFileItem(listId, fileId, filename, matchedName, type) {
  const listEl = document.getElementById(listId);
  const emptyMsg = listEl.querySelector('.empty-msg');
  if (emptyMsg) emptyMsg.remove();

  const div = document.createElement('div');
  div.id = `item-${fileId}`;
  div.className = 'file-item';
  div.innerHTML = `
    <span class="file-icon">📄</span>
    <div class="file-info">
      <div class="file-name" title="${escHtml(filename)}">${escHtml(filename)}</div>
      ${matchedName ? `<div class="file-matched">照合名：${escHtml(matchedName)}</div>` : ''}
      <div id="status-${fileId}" class="file-status">
        ${type === 'exc' ? statusHTML('exc') : statusHTML('pending')}
      </div>
    </div>
    <div id="actions-${fileId}" class="file-actions">
      <button onclick="removeItem('${fileId}')" class="btn-remove" title="削除">✕</button>
    </div>
  `;
  listEl.appendChild(div);
}

/** ファイル行のステータスとアクションボタンを更新する */
function updateFileItemStatus(fileId, state, changes, errMsg) {
  const statusEl  = document.getElementById(`status-${fileId}`);
  const actionsEl = document.getElementById(`actions-${fileId}`);
  if (!statusEl || !actionsEl) return;

  if (state === 'success') {
    statusEl.innerHTML = statusHTML('success', changes);
    actionsEl.innerHTML = `
      <button onclick="openPreview('${fileId}')" class="btn-preview">プレビュー</button>
      <button onclick="downloadFile('${fileId}')" class="btn-excel" title="Excelダウンロード">📊</button>
      <button onclick="removeItem('${fileId}')" class="btn-remove" title="削除">✕</button>
    `;
  } else if (state === 'error') {
    statusEl.innerHTML = statusHTML('error', null, errMsg);
    actionsEl.innerHTML = `
      <button onclick="removeItem('${fileId}')" class="btn-remove" title="削除">✕</button>
    `;
  }
}

/** ステータス表示のHTML断片を生成 */
function statusHTML(state, changes, errMsg) {
  switch (state) {
    case 'pending':
      return `<span class="status-pending"><span class="loader-xs"></span>計算中...</span>`;
    case 'success':
      return `<span class="status-success">✓ 完了${changes != null ? `（${changes}件変更）` : ''}</span>`;
    case 'error':
      return `<span class="status-error">✗ エラー${errMsg ? '：' + escHtml(errMsg) : ''}</span>`;
    case 'exc':
      return `<span class="status-exc">除外対象</span>`;
    default:
      return '';
  }
}

/** HTML特殊文字をエスケープ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────────────────────
// カウントバッジ・未マッチ表示
// ─────────────────────────────────────────────────────────────────────────────

function updateCountBadges() {
  const items = Object.values(app.items);
  document.getElementById('count7h').textContent  = items.filter(i => i.type === '7').length  + '件';
  document.getElementById('count8h').textContent  = items.filter(i => i.type === '8').length  + '件';
  document.getElementById('countExc').textContent = items.filter(i => i.type === 'exc').length + '件';
}

function renderUnmatched() {
  const unmatched = Object.values(app.items).filter(i => i.type === 'unmatched');
  const area = document.getElementById('unmatchedArea');
  const list = document.getElementById('unmatchedList');
  if (unmatched.length > 0) {
    area.classList.remove('hidden');
    list.innerHTML = unmatched
      .map(i => `<span class="unmatched-tag" title="${escHtml(i.file.name)}">${escHtml(i.file.name)}</span>`)
      .join('');
  } else {
    area.classList.add('hidden');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// アイテム削除・クリア
// ─────────────────────────────────────────────────────────────────────────────

function removeItem(fileId) {
  const el = document.getElementById(`item-${fileId}`);
  if (el) el.remove();
  delete app.items[fileId];
  delete app.processedData[fileId];

  updateCountBadges();
  renderUnmatched();

  // パネルが空になったら「データなし」メッセージを表示
  ['list7h', 'list8h', 'listExc'].forEach(listId => {
    const listEl = document.getElementById(listId);
    if (listEl && listEl.children.length === 0) {
      listEl.innerHTML = '<p class="empty-msg">対象ファイルがありません</p>';
    }
  });

  // 全件削除されたら結果エリアを非表示
  if (Object.keys(app.items).length === 0) {
    document.getElementById('resultsArea').classList.add('hidden');
  }
}

function clearResults() {
  Object.keys(app.items).forEach(k => delete app.items[k]);
  Object.keys(app.processedData).forEach(k => delete app.processedData[k]);

  ['list7h', 'list8h', 'listExc'].forEach(id => {
    document.getElementById(id).innerHTML = '<p class="empty-msg">データがありません</p>';
  });

  document.getElementById('resultsArea').classList.add('hidden');
  document.getElementById('unmatchedArea').classList.add('hidden');
  updateCountBadges();
}

// ─────────────────────────────────────────────────────────────────────────────
// ファイルダウンロード
// ─────────────────────────────────────────────────────────────────────────────

function downloadFile(fileId) {
  const fd = app.processedData[fileId];
  if (!fd) return;
  const url = URL.createObjectURL(fd.excelBlob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = fd.originalName.replace(/(\.[\w\d_-]+)$/i, '_processed.xlsx');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// プレビューモーダル
// ─────────────────────────────────────────────────────────────────────────────

function openPreview(fileId) {
  const fd = app.processedData[fileId];
  if (!fd) return;

  document.getElementById('modalTitle').textContent = fd.originalName;
  const cont = document.getElementById('modalTableContainer');
  cont.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'preview-table';

  // ヘッダー行
  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  (fd.data[fd.headerIndex] || []).forEach(cell => {
    const th = document.createElement('th');
    th.textContent = cell ?? '';
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  // データ行
  const tbody = document.createElement('tbody');
  for (let i = fd.headerIndex + 1; i < fd.data.length; i++) {
    const rd = fd.data[i];
    if (!rd || rd.length === 0) continue;
    const tr = document.createElement('tr');
    const isFooter = i === fd.data.length - 1 && rd.includes('残業合計');
    if (isFooter) tr.classList.add('footer-row');
    rd.forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell ?? '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  cont.appendChild(table);

  document.getElementById('modalExcelBtn').onclick = () => downloadFile(fileId);
  openModal();
}

function openModal() {
  const m = document.getElementById('previewModal');
  m.classList.remove('opacity-0', 'pointer-events-none');
  m.classList.add('opacity-100', 'pointer-events-auto');
  document.body.classList.add('overflow-hidden');
}

function closeModal() {
  const m = document.getElementById('previewModal');
  m.classList.remove('opacity-100', 'pointer-events-auto');
  m.classList.add('opacity-0', 'pointer-events-none');
  document.body.classList.remove('overflow-hidden');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─────────────────────────────────────────────────────────────────────────────
// 振り分け結果 Excel エクスポート
// ─────────────────────────────────────────────────────────────────────────────

function exportSortResult() {
  const all = Object.values(app.items);
  if (all.length === 0) { alert('エクスポートするデータがありません。'); return; }

  const groups = {
    h7:        all.filter(i => i.type === '7'),
    h8:        all.filter(i => i.type === '8'),
    exc:       all.filter(i => i.type === 'exc'),
    unmatched: all.filter(i => i.type === 'unmatched'),
  };

  const wb   = XLSX.utils.book_new();
  const rows = arr => [
    ['ファイル名', '照合名'],
    ...arr.map(i => [i.file.name, i.matched || i.extracted || ''])
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows(groups.h7)),        '7時間勤務者');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows(groups.h8)),        '8時間勤務者');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows(groups.exc)),       'Exception');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows(groups.unmatched)), '未振り分け');

  const now   = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(wb, `振り分け結果_${stamp}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 一括印刷（ID順）
// ─────────────────────────────────────────────────────────────────────────────

function openAllInBrowser() {
  const entries = Object.entries(app.processedData);
  if (entries.length === 0) {
    alert('印刷可能な処理済みファイルがありません。\nファイルの計算が完了してから実行してください。');
    return;
  }

  // ファイル名のID番号でソート
  const sorted = entries.sort(([, a], [, b]) =>
    extractId(a.originalName) - extractId(b.originalName)
  );

  let html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><title>一括印刷レポート</title>
<style>
  body { font-family: "Helvetica Neue", Arial, "Yu Gothic", sans-serif; padding: 20px; color: #333; }
  h1 { font-size: 15px; margin: 0 0 8px; border-bottom: 2px solid #6366f1; padding-bottom: 4px;
       display: flex; align-items: center; gap: 8px; }
  .badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
  .b7h { background: #dbeafe; color: #1d4ed8; }
  .b8h { background: #f3e8ff; color: #7e22ce; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px; }
  th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left; white-space: nowrap; }
  th { background: #f3f4f6; font-weight: bold; }
  tr:hover { background: #f9fafb; }
  .footer-row { background: #e0e7ff !important; font-weight: bold; }
  .footer-row td { border-top: 2px solid #6366f1; }
  .no-print { text-align: center; margin-bottom: 18px; }
  .print-btn { padding: 10px 24px; font-size: 15px; cursor: pointer;
               background: #6366f1; color: #fff; border: none; border-radius: 8px; }
  @media print {
    @page { size: A4 landscape; margin: 5mm; }
    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
    .page-break { border: none; height: 0; margin: 0; page-break-after: always;
                  break-after: page; display: block !important; }
    h1 { font-size: 12px; }
    table { font-size: 9px; }
    th, td { padding: 2px 4px; }
    th { background: #f3f4f6 !important; }
    .footer-row { background: #e0e7ff !important; }
    .b7h { background: #dbeafe !important; color: #1d4ed8 !important; }
    .b8h { background: #f3e8ff !important; color: #7e22ce !important; }
  }
</style></head><body>
<div class="no-print">
  <p style="font-size:13px;color:#6b7280;margin-bottom:10px;">
    印刷順：<strong>ID順</strong>　全 <strong>${sorted.length}</strong> 件
    （7h基準: ${sorted.filter(([, f]) => f.overtimeRule === '7').length}件 ／
     8h基準: ${sorted.filter(([, f]) => f.overtimeRule === '8').length}件）
  </p>
  <button class="print-btn" onclick="window.print()">🖨️ 印刷する</button>
</div>`;

  sorted.forEach(([, fd], idx) => {
    const fid        = extractId(fd.originalName);
    const idLabel    = fid !== Infinity ? ` [ID: ${fid}]` : '';
    const badgeClass = fd.overtimeRule === '7' ? 'b7h' : 'b8h';
    const ruleLabel  = fd.overtimeRule === '7' ? '7時間基準' : '8時間基準';

    html += `<div>`;
    html += `<h1><span class="badge ${badgeClass}">${ruleLabel}</span>${escHtml(fd.originalName)}${idLabel}</h1>`;
    html += `<table>`;
    fd.data.forEach((row, ri) => {
      const isFooter = ri === fd.data.length - 1 && Array.isArray(row) && row.includes('残業合計');
      html += `<tr${isFooter ? ' class="footer-row"' : ''}>`;
      row.forEach(cell => { html += `<td>${cell ?? ''}</td>`; });
      html += `</tr>`;
    });
    html += `</table></div>`;
    if (idx < sorted.length - 1) html += `<div class="page-break"></div>`;
  });

  html += `</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
}
