/* ============================================================
   P116 太陽軍團 — Row-max with strictly increasing peak columns
   Two canvases:
     viz-base    · BASE CASE — N=2 matrix (col-range narrowing intuition)
     viz-general · GENERAL CASE — D&C on the sample 4x5 matrix
   ============================================================ */

const P116_COLOR = {
  paper:       '#faf5e6',
  cellEmpty:   '#ffffff',
  cellActive:  '#fbe2d7',      // coral tint (current row's search range)
  cellExcluded:'#ebe6da',      // gray tint (col outside current range)
  cellBorder:  '#1a1a1a',
  cellText:    '#1a1a1a',
  cellTextDim: '#9a9590',
  coral:       '#d96e4e',
  coralSoft:   '#f3b89e',
  ink:         '#1a1a1a',
  inkDim:      '#6b6b6b',
  axisText:    '#8a847a',
  arrow:       '#d96e4e',
  bracket:     '#1a1a1a',
};

const P116_FONT = {
  head:    '700 13px "JetBrains Mono", monospace',
  sub:     '500 11px "JetBrains Mono", monospace',
  cell:    '700 13px "JetBrains Mono", monospace',
  cellSm:  '700 11px "JetBrains Mono", monospace',
  label:   '700 10px "JetBrains Mono", monospace',
  tag:     '700 11px "JetBrains Mono", monospace',
};

function p116DrawCell(ctx, x, y, w, h, value, opts) {
  opts = opts || {};
  ctx.fillStyle = opts.bg || P116_COLOR.cellEmpty;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = opts.border || P116_COLOR.cellBorder;
  ctx.lineWidth = opts.lineWidth || 1.2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (value !== null && value !== undefined) {
    ctx.fillStyle = opts.color || P116_COLOR.cellText;
    ctx.font = P116_FONT.cell;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + w / 2, y + h / 2);
  }
}

function p116DrawPeak(ctx, cx, cy, r) {
  // Draw a coral-bordered circle to mark "found max"
  ctx.save();
  ctx.strokeStyle = P116_COLOR.coral;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function p116DrawMatrix(ctx, matrix, originX, originY, cellW, cellH, opts) {
  opts = opts || {};
  const rows = matrix.length;
  const cols = matrix[0].length;
  const activeRow   = opts.activeRow;     // 0-indexed
  const colLo       = opts.colLo;         // inclusive, 0-indexed
  const colHi       = opts.colHi;         // inclusive, 0-indexed
  const peakCol     = opts.peakCol;       // 0-indexed, column of the just-found max in activeRow
  const fixedPeaks  = opts.fixedPeaks || []; // [{row, col}] already found

  // Column index labels (top)
  ctx.fillStyle = P116_COLOR.axisText;
  ctx.font = P116_FONT.label;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (let c = 0; c < cols; c++) {
    ctx.fillText(`c${c + 1}`, originX + c * cellW + cellW / 2, originY - 4);
  }
  // Row index labels (left)
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < rows; r++) {
    ctx.fillText(`r${r + 1}`, originX - 6, originY + r * cellH + cellH / 2);
  }

  // Cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = originX + c * cellW;
      const y = originY + r * cellH;
      let bg = P116_COLOR.cellEmpty;
      let color = P116_COLOR.cellText;
      let lineWidth = 1.2;

      if (r === activeRow) {
        if (colLo !== undefined && colHi !== undefined) {
          if (c >= colLo && c <= colHi) {
            bg = P116_COLOR.cellActive;
          } else {
            bg = P116_COLOR.cellExcluded;
            color = P116_COLOR.cellTextDim;
          }
        } else {
          bg = P116_COLOR.cellActive;
        }
      }
      // Rows already resolved get a paper tint and slightly dim text
      const resolved = fixedPeaks.find((p) => p.row === r);
      if (resolved && r !== activeRow) {
        bg = '#fdfaf0';
        color = P116_COLOR.cellTextDim;
      }

      p116DrawCell(ctx, x, y, cellW, cellH, matrix[r][c], { bg, color, lineWidth });
    }
  }

  // Already-found peaks (small coral circles on previously-resolved rows)
  fixedPeaks.forEach((p) => {
    if (p.row === activeRow && peakCol !== undefined) return;
    const cx = originX + p.col * cellW + cellW / 2;
    const cy = originY + p.row * cellH + cellH / 2;
    p116DrawPeak(ctx, cx, cy, Math.min(cellW, cellH) / 2 - 3);
  });

  // Current peak (bigger, brighter)
  if (peakCol !== undefined && activeRow !== undefined) {
    const cx = originX + peakCol * cellW + cellW / 2;
    const cy = originY + activeRow * cellH + cellH / 2;
    p116DrawPeak(ctx, cx, cy, Math.min(cellW, cellH) / 2 - 2);
  }

  // Bracket for column-range on active row (drawn below row)
  if (activeRow !== undefined && colLo !== undefined && colHi !== undefined &&
      (colLo > 0 || colHi < cols - 1)) {
    const y = originY + activeRow * cellH + cellH + 4;
    const x1 = originX + colLo * cellW + 3;
    const x2 = originX + (colHi + 1) * cellW - 3;
    ctx.strokeStyle = P116_COLOR.coral;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1, y + 4);
    ctx.lineTo(x2, y + 4);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }
}

/* ============================================================
   ===== A · BASE CASE — N=2 matrix, intuition for range narrowing =====
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-base');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl   = document.getElementById('vb-step');
  const labelEl  = document.getElementById('vb-label');
  const btnPrev  = document.getElementById('vb-prev');
  const btnNext  = document.getElementById('vb-next');
  const btnPlay  = document.getElementById('vb-play');
  const btnReset = document.getElementById('vb-reset');

  // 2 x 4 matrix:
  //   row 1: 7  3  5  2  -> max at col 1 (val 7)
  //   row 2: 2  8  6  4  -> col search range [2..4], max at col 2 (val 8)
  const MAT = [
    [7, 3, 5, 2],
    [2, 8, 6, 4],
  ];
  // Peaks in 0-indexed columns
  const PEAKS_0IDX = [0, 1];

  const STEPS = [
    {
      title: 'STEP 01 · SCAN ROW 1 · cols 1..4',
      detail:
        '第一列搜尋範圍是全部欄位 <code>cols [1..4]</code>。<br/>' +
        '掃過 7, 3, 5, 2 ⇒ <strong>max = 7 在 col 1</strong>。',
      activeRow: 0,
      colLo: 0,
      colHi: 3,
      peakCol: 0,
      fixedPeaks: [],
    },
    {
      title: 'STEP 02 · SCAN ROW 2 · cols 2..4 (col 1 排除)',
      detail:
        '<strong>關鍵限制</strong>：第 2 列的峰<em>必須嚴格在第 1 列峰的右邊</em>。' +
        '<br/>第 1 列峰在 col 1 ⇒ 第 2 列搜尋範圍縮為 <code>cols [2..4]</code>。' +
        '<br/>掃過 8, 6, 4 ⇒ <strong>max = 8 在 col 2</strong>。',
      activeRow: 1,
      colLo: 1,
      colHi: 3,
      peakCol: 1,
      fixedPeaks: [{ row: 0, col: 0 }],
    },
    {
      title: 'STEP 03 · DONE · peaks = [1, 2]',
      detail:
        '兩列的峰欄分別是 <strong>1, 2</strong>（嚴格遞增 ✓）。' +
        '<br/><span style="color:#6b6b6b">這就是「列峰嚴格遞增」對搜尋範圍的縮減效果。</span>',
      activeRow: undefined,
      colLo: undefined,
      colHi: undefined,
      peakCol: undefined,
      fixedPeaks: [{ row: 0, col: 0 }, { row: 1, col: 1 }],
    },
  ];

  let step = -1;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 200;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = P116_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // headline
    ctx.fillStyle = P116_COLOR.ink;
    ctx.font = P116_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = (step === -1)
      ? 'INITIAL · 2 × 4 MATRIX · find row-max with monotone columns'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 10);

    ctx.fillStyle = P116_COLOR.inkDim;
    ctx.font = P116_FONT.sub;
    ctx.fillText('row i 的峰欄位必須嚴格大於 row i−1 的峰欄位', w / 2, 28);

    // Matrix — responsive: fill width up to a sensible max
    const cols = MAT[0].length;
    const rows = MAT.length;
    const sidePad = 48;                       // leaves room for r1/r2 row labels
    const cellW = Math.min((w - sidePad * 2) / cols, 110);
    const cellH = Math.min((h - 100) / rows, 56);
    const totalW = cellW * cols;
    const totalH = cellH * rows;
    const originX = (w - totalW) / 2;
    const originY = 58;

    const cur = (step === -1) ? null : STEPS[step];
    p116DrawMatrix(ctx, MAT, originX, originY, cellW, cellH, cur || {});

    // Bottom caption for peaks-so-far
    if (step >= 0) {
      const fp = STEPS[step].fixedPeaks || [];
      const curPeak = STEPS[step].peakCol !== undefined
        ? [{ row: STEPS[step].activeRow, col: STEPS[step].peakCol }]
        : [];
      const all = fp.concat(curPeak.filter((p) => !fp.find((q) => q.row === p.row)));
      if (all.length > 0) {
        ctx.fillStyle = P116_COLOR.ink;
        ctx.font = P116_FONT.tag;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const list = all.sort((a, b) => a.row - b.row)
                        .map((p) => `r${p.row + 1}→c${p.col + 1}`)
                        .join('  ·  ');
        ctx.fillText(`peaks: ${list}`, w / 2, originY + totalH + 24);
      }
    }
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 2 × 4 矩陣，每列找峰；' +
          'row 2 的峰欄必須 &gt; row 1 的峰欄。<br/>' +
          '<span style="color:#6b6b6b">按 Play 看欄位範圍如何被前一列的答案縮減。</span>';
      } else {
        const s = STEPS[step];
        labelEl.innerHTML = `<strong>${s.title}</strong><br/>${s.detail}`;
      }
    }
  }

  function update() { updateLabel(); draw(); }
  function next()   { if (step < STEPS.length - 1) { step++; update(); } else stop(); }
  function prev()   { if (step > -1) { step--; update(); } }
  function reset()  { stop(); step = -1; update(); }
  function play()   {
    if (timer) { stop(); return; }
    btnPlay.textContent = 'Pause';
    timer = setInterval(() => {
      if (step >= STEPS.length - 1) { stop(); return; }
      next();
    }, 1500);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (btnPlay) btnPlay.textContent = 'Play';
  }

  btnPrev  && btnPrev .addEventListener('click', prev);
  btnNext  && btnNext .addEventListener('click', next);
  btnPlay  && btnPlay .addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', () => { fitCanvas(); draw(); });
  fitCanvas();
  update();
})();

/* ============================================================
   ===== B · GENERAL CASE — D&C on sample 4 x 5 matrix =====
   ============================================================ */
(function () {
  const canvas = document.getElementById('viz-general');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl   = document.getElementById('vg-step');
  const labelEl  = document.getElementById('vg-label');
  const btnPrev  = document.getElementById('vg-prev');
  const btnNext  = document.getElementById('vg-next');
  const btnPlay  = document.getElementById('vg-play');
  const btnReset = document.getElementById('vg-reset');

  // Sample 4 x 5 matrix from the problem statement
  //   row 1: 74 59 36 28 51  -> max at col 1 (74)
  //   row 2: 36 63 15 25 17  -> max at col 2 (63)
  //   row 3: 71 64 95 43 56  -> max at col 3 (95)
  //   row 4: 72 62 30 24 74  -> max at col 5 (74)
  const MAT = [
    [74, 59, 36, 28, 51],
    [36, 63, 15, 25, 17],
    [71, 64, 95, 43, 56],
    [72, 62, 30, 24, 74],
  ];

  // D&C steps in the order the algorithm executes them:
  //   solve(1..4, 1..5)
  //     mid = 2  → scan row 2 cols 1..5, peak col 2
  //       upper: solve(1..1, 1..2) → scan row 1 cols 1..2, peak col 1
  //       lower: solve(3..4, 2..5)
  //         mid = 3 → scan row 3 cols 2..5, peak col 3
  //           upper: solve(3..2, ...) empty
  //           lower: solve(4..4, 3..5) → scan row 4 cols 3..5, peak col 5
  const STEPS = [
    {
      title: 'STEP 01 · dnc(rows 1..4, cols 1..5) · scan mid row 2',
      detail:
        '<code>mid = (1 + 4) / 2 = 2</code>。掃 row 2 的 cols 1..5：' +
        '36, <strong>63</strong>, 15, 25, 17 ⇒ <strong>peak at col 2</strong>。' +
        '<br/>切割欄位範圍：upper 用 [1..2]，lower 用 [2..5]。',
      callTag: 'dnc(1..4, 1..5)',
      activeRow: 1,
      colLo: 0,
      colHi: 4,
      peakCol: 1,
      fixedPeaks: [],
    },
    {
      title: 'STEP 02 · dnc(rows 1..1, cols 1..2) · scan mid row 1',
      detail:
        '上半遞迴：<code>rowLo = 1, rowHi = 1, mid = 1</code>，欄位範圍 <code>[1..2]</code>。' +
        '<br/>掃 row 1 cols 1..2：<strong>74</strong>, 59 ⇒ <strong>peak at col 1</strong>。',
      callTag: 'dnc(1..1, 1..2)',
      activeRow: 0,
      colLo: 0,
      colHi: 1,
      peakCol: 0,
      fixedPeaks: [{ row: 1, col: 1 }],
    },
    {
      title: 'STEP 03 · dnc(rows 3..4, cols 2..5) · scan mid row 3',
      detail:
        '回到下半遞迴：<code>rowLo = 3, rowHi = 4, mid = 3</code>，欄位範圍 <code>[2..5]</code>。' +
        '<br/>掃 row 3 cols 2..5：64, <strong>95</strong>, 43, 56 ⇒ <strong>peak at col 3</strong>。',
      callTag: 'dnc(3..4, 2..5)',
      activeRow: 2,
      colLo: 1,
      colHi: 4,
      peakCol: 2,
      fixedPeaks: [{ row: 1, col: 1 }, { row: 0, col: 0 }],
    },
    {
      title: 'STEP 04 · dnc(rows 4..4, cols 3..5) · scan row 4',
      detail:
        '下下半遞迴：<code>rowLo = 4, rowHi = 4, mid = 4</code>，欄位範圍 <code>[3..5]</code>。' +
        '<br/>掃 row 4 cols 3..5：30, 24, <strong>74</strong> ⇒ <strong>peak at col 5</strong>。',
      callTag: 'dnc(4..4, 3..5)',
      activeRow: 3,
      colLo: 2,
      colHi: 4,
      peakCol: 4,
      fixedPeaks: [
        { row: 1, col: 1 },
        { row: 0, col: 0 },
        { row: 2, col: 2 },
      ],
    },
    {
      title: 'STEP 05 · DONE · peaks = [1, 2, 3, 5]',
      detail:
        '4 列的峰欄分別是 <strong>1, 2, 3, 5</strong>（嚴格遞增 ✓）。' +
        '<br/>最後依序 <code>Report(1); Report(2); Report(3); Report(5);</code>。' +
        '<br/><span style="color:#6b6b6b">GetVal 次數：5 + 2 + 4 + 3 = 14（單純掃會 4×5 = 20）。</span>',
      callTag: 'OUTPUT',
      activeRow: undefined,
      colLo: undefined,
      colHi: undefined,
      peakCol: undefined,
      fixedPeaks: [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 },
        { row: 3, col: 4 },
      ],
    },
  ];

  let step = -1;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 340;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = P116_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // headline
    ctx.fillStyle = P116_COLOR.ink;
    ctx.font = P116_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = (step === -1)
      ? 'INITIAL · 4 × 5 sample matrix · solve(N=4, M=5)'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 12);

    ctx.fillStyle = P116_COLOR.inkDim;
    ctx.font = P116_FONT.sub;
    ctx.fillText('Divide & Conquer on rows · column-range narrows down each recurse', w / 2, 32);

    // Side annotation: current dnc call (top-right)
    if (step >= 0) {
      const s = STEPS[step];
      ctx.fillStyle = P116_COLOR.coral;
      ctx.font = P116_FONT.label;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`// CALL: ${s.callTag}`, w - 14, 12);
    }

    // Matrix — responsive: fill width up to a sensible max
    const cols = MAT[0].length;
    const rows = MAT.length;
    const sidePad = 48;
    const cellW = Math.min((w - sidePad * 2) / cols, 110);
    const cellH = Math.min((h - 130) / rows, 56);
    const totalW = cellW * cols;
    const totalH = cellH * rows;
    const originX = (w - totalW) / 2;
    const originY = 64;

    const cur = (step === -1) ? null : STEPS[step];
    p116DrawMatrix(ctx, MAT, originX, originY, cellW, cellH, cur || {});

    // Bottom caption: peaks list so far
    if (step >= 0) {
      const fp = (STEPS[step].fixedPeaks || []).slice();
      if (STEPS[step].peakCol !== undefined && STEPS[step].activeRow !== undefined) {
        if (!fp.find((p) => p.row === STEPS[step].activeRow)) {
          fp.push({ row: STEPS[step].activeRow, col: STEPS[step].peakCol });
        }
      }
      if (fp.length > 0) {
        ctx.fillStyle = P116_COLOR.ink;
        ctx.font = P116_FONT.tag;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const list = fp.sort((a, b) => a.row - b.row)
                       .map((p) => `r${p.row + 1}→c${p.col + 1}`)
                       .join('   ·   ');
        ctx.fillText(`peaks so far: ${list}`, w / 2, originY + totalH + 28);
      }
    }
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 4 × 5 矩陣，準備 D&amp;C on rows。<br/>' +
          '<span style="color:#6b6b6b">按 Play 看 5 步：mid 列直接掃 → 縮上半範圍 → 縮下半範圍 → ... → 收尾。</span>';
      } else {
        const s = STEPS[step];
        labelEl.innerHTML = `<strong>${s.title}</strong><br/>${s.detail}`;
      }
    }
  }

  function update() { updateLabel(); draw(); }
  function next()   { if (step < STEPS.length - 1) { step++; update(); } else stop(); }
  function prev()   { if (step > -1) { step--; update(); } }
  function reset()  { stop(); step = -1; update(); }
  function play()   {
    if (timer) { stop(); return; }
    btnPlay.textContent = 'Pause';
    timer = setInterval(() => {
      if (step >= STEPS.length - 1) { stop(); return; }
      next();
    }, 1700);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (btnPlay) btnPlay.textContent = 'Play';
  }

  btnPrev  && btnPrev .addEventListener('click', prev);
  btnNext  && btnNext .addEventListener('click', next);
  btnPlay  && btnPlay .addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', () => { fitCanvas(); draw(); });
  fitCanvas();
  update();
})();
