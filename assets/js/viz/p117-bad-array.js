/* ============================================================
   P117 糟糕陣列 — 2x2 block 遞迴構造
   Two canvases:
     viz-base    · BASE CASE — build(2) from A(1)=[1], step-by-step
     viz-general · GENERAL CASE — build(4) from A(2)
   ============================================================ */

const P117_COLOR = {
  paper:      '#faf5e6',
  cellEmpty:  '#ffffff',
  cellBorder: '#1a1a1a',
  cellText:   '#1a1a1a',
  cellTextDim:'#9a9590',
  tlTint:     '#e3edf5',   // pale blue   — TL (A(K) original)
  tlStroke:   '#8fb3d4',
  brTint:     '#f6ead8',   // pale tan    — BR (A(K) same)
  brStroke:   '#d4a868',
  blTint:     '#d9e8c7',   // pale green  — BL (+shift)
  blStroke:   '#5fa866',
  trTint:     '#fbe2d7',   // pale coral  — TR (+shift, diag = 2N-1)
  trStroke:   '#d96e4e',
  coral:      '#d96e4e',
  ink:        '#1a1a1a',
  inkDim:     '#6b6b6b',
  inactive:   '#cfcfcf',
  chipGood:   '#d9e8c7',
  chipGoodStr:'#5fa866',
};

const P117_FONT = {
  head:    '700 13px "JetBrains Mono", monospace',
  sub:     '500 11px "JetBrains Mono", monospace',
  label:   '700 10px "JetBrains Mono", monospace',
  cellLg:  '700 18px "JetBrains Mono", monospace',
  cellMd:  '700 14px "JetBrains Mono", monospace',
  cellSm:  '700 12px "JetBrains Mono", monospace',
  tag:     '700 11px "JetBrains Mono", monospace',
  tagSm:   '700 9px "JetBrains Mono", monospace',
  callout: '700 12px "JetBrains Mono", monospace',
};

// Draw one matrix cell. value=null/undefined ⇒ blank.
function p117DrawCell(ctx, x, y, w, h, value, opts) {
  opts = opts || {};
  ctx.fillStyle = opts.bg || P117_COLOR.cellEmpty;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = opts.border || P117_COLOR.cellBorder;
  ctx.lineWidth = opts.lineWidth || 1.2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (value !== null && value !== undefined) {
    ctx.fillStyle = opts.color || P117_COLOR.cellText;
    ctx.font = (Math.min(w, h) >= 42 ? P117_FONT.cellLg :
                Math.min(w, h) >= 30 ? P117_FONT.cellMd :
                                       P117_FONT.cellSm);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + w / 2, y + h / 2);
  }
}

// Draw the entire N x N matrix with per-cell fills.
// filled[r][c] = number or null; tints[r][c] = 'TL'|'BR'|'BL'|'TR'|undefined.
// highlightRC = {row, col} -- if set, draw coral border around that row & col.
function p117DrawMatrix(ctx, N, filled, tints, originX, originY, cellSize, opts) {
  opts = opts || {};
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x = originX + c * cellSize;
      const y = originY + r * cellSize;
      const t = tints[r][c];
      let bg = P117_COLOR.cellEmpty;
      if (t === 'TL') bg = P117_COLOR.tlTint;
      else if (t === 'BR') bg = P117_COLOR.brTint;
      else if (t === 'BL') bg = P117_COLOR.blTint;
      else if (t === 'TR') bg = P117_COLOR.trTint;
      const v = filled[r][c];
      p117DrawCell(ctx, x, y, cellSize, cellSize, v, { bg });
    }
  }
  // Optional coral highlight for one row + one col (for the verify step)
  if (opts.highlightRC) {
    const { row, col } = opts.highlightRC;
    ctx.save();
    ctx.strokeStyle = P117_COLOR.coral;
    ctx.lineWidth = 2.5;
    // Row stripe
    ctx.strokeRect(originX + 0.5, originY + row * cellSize + 0.5,
                   N * cellSize - 1, cellSize - 1);
    // Col stripe
    ctx.strokeRect(originX + col * cellSize + 0.5, originY + 0.5,
                   cellSize - 1, N * cellSize - 1);
    ctx.restore();
  }
}

/* ============================================================
   ===== A · BASE CASE — build(2) from A(1) = [1] =====

   Algorithm walked step-by-step:
     K = 1, shift = 2K-1 = 1, 2N-1 = 3
     STEP 1: TL ← A(1) = 1                 (M[1][1] = 1)
     STEP 2: BR ← A(1) = 1                 (M[2][2] = 1)
     STEP 3: BL ← A(1)[1][1] + shift = 2   (M[2][1] = 2)
     STEP 4: TR diag (i==j ⇒ 1==1) ← 2N-1=3 (M[1][2] = 3)
     STEP 5: DONE — verify row 1 ∪ col 1 = {1,3} ∪ {1,2} = {1,2,3} ✓
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

  const N = 2;
  // Steps produce cumulative matrix states.
  // Matrix is 2x2, addressed [row][col] with 0-indexed positions.
  // Final A(2) = [[1, 3], [2, 1]]
  const STEPS = [
    {
      title: 'STEP 01 · TL ← A(1) = 1',
      detail:
        '遞迴 <code>build(1, 0, 0, 0)</code>：填 <code>M[1][1] = base + 1 = 1</code>。<br/>' +
        '<span style="color:#6b6b6b">這是 base case，最小的非 trivial 寫入。</span>',
      filled: [[1, null], [null, null]],
      tints:  [['TL', null], [null, null]],
    },
    {
      title: 'STEP 02 · BR ← A(1) = 1',
      detail:
        '遞迴 <code>build(1, 1, 1, 0)</code>：填 <code>M[2][2] = base + 1 = 1</code>。<br/>' +
        '<span style="color:#6b6b6b">BR 與 TL <em>同值</em>（不平移）。</span>',
      filled: [[1, null], [null, 1]],
      tints:  [['TL', null], [null, 'BR']],
    },
    {
      title: 'STEP 03 · BL ← A(1) + shift = 1 + 1 = 2',
      detail:
        '掃 TL[1][1] = 1，<code>shift = 2K − 1 = 1</code>：<br/>' +
        '<code>M[2][1] = 1 + 1 = 2</code>。',
      filled: [[1, null], [2, 1]],
      tints:  [['TL', null], ['BL', 'BR']],
    },
    {
      title: 'STEP 04 · TR 對角 ← 2N − 1 = 3',
      detail:
        'TR 子塊 local (i=1, j=1)：<code>i == j</code> ⇒ 對角！<br/>' +
        '<code>M[1][2] = base + 2N − 1 = 0 + 3 = 3</code>。',
      filled: [[1, 3], [2, 1]],
      tints:  [['TL', 'TR'], ['BL', 'BR']],
    },
    {
      title: 'STEP 05 · DONE · row 1 ∪ col 1 = {1, 2, 3} ✓',
      detail:
        '<code>A(2) = [[1, 3], [2, 1]]</code>。<br/>' +
        'row 1 = {1, 3}, col 1 = {1, 2}, 聯集 = <strong>{1, 2, 3}</strong> ✓ (= {1..2N−1}).',
      filled: [[1, 3], [2, 1]],
      tints:  [['TL', 'TR'], ['BL', 'BR']],
      highlightRC: { row: 0, col: 0 },
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
    ctx.fillStyle = P117_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // Headline
    ctx.fillStyle = P117_COLOR.ink;
    ctx.font = P117_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = step === -1
      ? 'INITIAL · build(2) from A(1) = [1]'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 10);

    // Sub-line
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.font = P117_FONT.sub;
    ctx.fillText('K = 1 · shift = 1 · 2N − 1 = 3', w / 2, 28);

    // Matrix layout — center, responsive.
    // Reserve left band for the value-tag legend, bottom band for chips.
    const matAreaTop = 50;
    const matAreaBot = h - 56;     // leaves bottom 56px for chips
    const matAreaH = matAreaBot - matAreaTop;
    const sidePad = 16;
    const maxCellByW = (w - sidePad * 2 - 200) / N;   // 200px for legend column
    const maxCellByH = matAreaH / N;
    const cellSize = Math.max(28, Math.min(maxCellByW, maxCellByH, 72));
    const totalW = cellSize * N;
    const totalH = cellSize * N;
    const originX = (w - totalW) / 2 + 60;   // shift slightly right to make room for legend
    const originY = matAreaTop + (matAreaH - totalH) / 2;

    const cur = step === -1 ? null : STEPS[step];
    const filled = cur ? cur.filled : [[null, null], [null, null]];
    const tints  = cur ? cur.tints  : [[null, null], [null, null]];

    // Row/col index labels
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.font = P117_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let c = 0; c < N; c++) {
      ctx.fillText(`c${c + 1}`, originX + c * cellSize + cellSize / 2, originY - 4);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < N; r++) {
      ctx.fillText(`r${r + 1}`, originX - 6, originY + r * cellSize + cellSize / 2);
    }

    p117DrawMatrix(ctx, N, filled, tints, originX, originY, cellSize,
                   { highlightRC: cur && cur.highlightRC });

    // Legend on the left (TL/BR/BL/TR keys with their colored squares)
    const legendX = 18;
    const legendY = matAreaTop + 8;
    const legendRowH = 16;
    const items = [
      ['TL', P117_COLOR.tlTint, P117_COLOR.tlStroke, 'A(K) 原值'],
      ['BR', P117_COLOR.brTint, P117_COLOR.brStroke, 'A(K) 原值'],
      ['BL', P117_COLOR.blTint, P117_COLOR.blStroke, '+ shift'],
      ['TR', P117_COLOR.trTint, P117_COLOR.trStroke, '對角 = 2N−1'],
    ];
    ctx.font = P117_FONT.tagSm;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < items.length; i++) {
      const y = legendY + i * legendRowH;
      ctx.fillStyle = items[i][1];
      ctx.fillRect(legendX, y - 5, 10, 10);
      ctx.strokeStyle = items[i][2];
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX + 0.5, y - 5 + 0.5, 9, 9);
      ctx.fillStyle = P117_COLOR.ink;
      ctx.fillText(items[i][0], legendX + 16, y);
      ctx.fillStyle = P117_COLOR.inkDim;
      ctx.fillText(items[i][3], legendX + 38, y);
    }

    // Bottom chip row: row 1 ∪ col 1 progress
    const chipY = h - 30;
    const phase = step;
    // collect row 1 and col 1 values from filled
    const row1 = [];
    const col1 = [];
    for (let c = 0; c < N; c++) {
      if (filled[0][c] !== null) row1.push(filled[0][c]);
    }
    for (let r = 0; r < N; r++) {
      if (filled[r][0] !== null) col1.push(filled[r][0]);
    }
    const unionSet = new Set([...row1, ...col1]);
    const allUniverse = '{1,2,3}';
    const unionDisplay = unionSet.size === 0 ? '∅'
                       : '{' + Array.from(unionSet).sort((a,b)=>a-b).join(',') + '}';

    ctx.font = P117_FONT.tag;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.fillText('row 1 ∪ col 1 =', 18, chipY);

    // Chip with current union set
    const chipText = unionDisplay;
    const targetMet = phase === STEPS.length - 1 && unionSet.size === 3;
    const chipBg = targetMet ? P117_COLOR.chipGood : P117_COLOR.cellEmpty;
    const chipStroke = targetMet ? P117_COLOR.chipGoodStr : P117_COLOR.ink;
    ctx.font = P117_FONT.tag;
    const chipW = Math.max(80, ctx.measureText(chipText).width + 18);
    const chipX = 138;
    ctx.fillStyle = chipBg;
    ctx.fillRect(chipX, chipY - 10, chipW, 20);
    ctx.strokeStyle = chipStroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(chipX + 0.5, chipY - 10 + 0.5, chipW - 1, 19);
    ctx.fillStyle = P117_COLOR.ink;
    ctx.textAlign = 'center';
    ctx.fillText(chipText, chipX + chipW / 2, chipY);

    // Target chip
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.textAlign = 'left';
    ctx.fillText('target = {1..2N−1} = ' + allUniverse, chipX + chipW + 14, chipY);

    // Tick or count to the right
    if (targetMet) {
      ctx.fillStyle = P117_COLOR.chipGoodStr;
      ctx.font = P117_FONT.callout;
      ctx.textAlign = 'right';
      ctx.fillText('✓ match', w - 18, chipY);
    } else {
      ctx.fillStyle = P117_COLOR.inkDim;
      ctx.font = P117_FONT.tagSm;
      ctx.textAlign = 'right';
      ctx.fillText(`size = ${unionSet.size} / 3`, w - 18, chipY);
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
          '<strong>INITIAL</strong> · 2 × 2 空格，準備從 <code>A(1) = [1]</code> 建出 <code>A(2)</code>。<br/>' +
          '<span style="color:#6b6b6b">按 Play 走過 5 步：TL → BR → BL → TR 對角 → 驗證 row 1 ∪ col 1。</span>';
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

/* ============================================================
   ===== B · GENERAL CASE — build(4) from A(2) = [[1,3],[2,1]] =====

   Algorithm walked step-by-step:
     N = 4, K = 2, shift = 2K-1 = 3, 2N-1 = 7
     STEP 1: TL ← A(2)                  M[1..2][1..2] = [[1,3],[2,1]]
     STEP 2: BR ← A(2)                  M[3..4][3..4] = [[1,3],[2,1]]
     STEP 3: BL ← A(2) + 3              M[3..4][1..2] = [[4,6],[5,4]]
     STEP 4: TR off-diag +3, diag = 7   M[1..2][3..4] = [[7,6],[5,7]]
     STEP 5: DONE — verify all 4 row∪col = {1..7}

   Final A(4):
     1 3 | 7 6
     2 1 | 5 7
     ----+----
     4 6 | 1 3
     5 4 | 2 1
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

  const N = 4;
  const A2 = [[1, 3], [2, 1]];

  // Final A(4) (verified):
  //   1 3 7 6
  //   2 1 5 7
  //   4 6 1 3
  //   5 4 2 1
  const FINAL = [
    [1, 3, 7, 6],
    [2, 1, 5, 7],
    [4, 6, 1, 3],
    [5, 4, 2, 1],
  ];

  function makeBlank() {
    return [[null,null,null,null],
            [null,null,null,null],
            [null,null,null,null],
            [null,null,null,null]];
  }
  function makeTints() {
    return [[null,null,null,null],
            [null,null,null,null],
            [null,null,null,null],
            [null,null,null,null]];
  }

  // STEP 1: fill TL (rows 0..1, cols 0..1) with A2
  const F1 = makeBlank(), T1 = makeTints();
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { F1[i][j] = A2[i][j]; T1[i][j] = 'TL'; }

  // STEP 2: also fill BR (rows 2..3, cols 2..3) with A2
  const F2 = JSON.parse(JSON.stringify(F1)), T2 = JSON.parse(JSON.stringify(T1));
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { F2[i+2][j+2] = A2[i][j]; T2[i+2][j+2] = 'BR'; }

  // STEP 3: fill BL (rows 2..3, cols 0..1) with A2 + 3
  const F3 = JSON.parse(JSON.stringify(F2)), T3 = JSON.parse(JSON.stringify(T2));
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { F3[i+2][j] = A2[i][j] + 3; T3[i+2][j] = 'BL'; }

  // STEP 4: fill TR (rows 0..1, cols 2..3): diag = 7, off-diag = A2 + 3
  const F4 = JSON.parse(JSON.stringify(F3)), T4 = JSON.parse(JSON.stringify(T3));
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const v = (i === j) ? 7 : A2[i][j] + 3;
    F4[i][j+2] = v;
    T4[i][j+2] = 'TR';
  }

  // STEP 5: same as step 4, all done.
  const F5 = JSON.parse(JSON.stringify(F4)), T5 = JSON.parse(JSON.stringify(T4));

  const STEPS = [
    {
      title: 'STEP 01 · TL ← A(2) = [[1, 3], [2, 1]]',
      detail:
        '遞迴 <code>build(2, 0, 0, 0)</code> 填左上角 2×2 子塊。<br/>' +
        '<code>M[1..2][1..2] = [[1, 3], [2, 1]]</code>。',
      filled: F1, tints: T1,
    },
    {
      title: 'STEP 02 · BR ← A(2)（與 TL 同值）',
      detail:
        '遞迴 <code>build(2, 2, 2, 0)</code> 填右下角 2×2 子塊。<br/>' +
        '<code>M[3..4][3..4] = [[1, 3], [2, 1]]</code>（與 TL 一致，<em>不平移</em>）。',
      filled: F2, tints: T2,
    },
    {
      title: 'STEP 03 · BL ← A(2) + shift = A(2) + 3',
      detail:
        '掃 TL，每格 +3 寫進 BL：<br/>' +
        '<code>M[3..4][1..2] = [[4, 6], [5, 4]]</code>。',
      filled: F3, tints: T3,
    },
    {
      title: 'STEP 04 · TR 對角 ← 7，其餘 ← A(2) + 3',
      detail:
        'TR local (i, j)：<code>i == j</code> ⇒ <strong>2N − 1 = 7</strong>；其餘 +3。<br/>' +
        '<code>M[1..2][3..4] = [[7, 6], [5, 7]]</code>。',
      filled: F4, tints: T4,
    },
    {
      title: 'STEP 05 · DONE · 每個 row ∪ col 都 = {1..7} ✓',
      detail:
        '完整 <code>A(4)</code>：<br/>' +
        '<code>[[1,3,7,6], [2,1,5,7], [4,6,1,3], [5,4,2,1]]</code>。<br/>' +
        '4 條 row、4 條 col 與其聯集都覆蓋 {1..7}。',
      filled: F5, tints: T5,
      highlightRC: { row: 0, col: 0 },
    },
  ];

  let step = -1;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 320;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function computeUnion(filled, idx) {
    // Returns Set of values in row `idx` and col `idx`.
    const s = new Set();
    for (let c = 0; c < N; c++) if (filled[idx][c] !== null) s.add(filled[idx][c]);
    for (let r = 0; r < N; r++) if (filled[r][idx] !== null) s.add(filled[r][idx]);
    return s;
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = P117_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // Headline
    ctx.fillStyle = P117_COLOR.ink;
    ctx.font = P117_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = step === -1
      ? 'INITIAL · build(4) from A(2) = [[1,3],[2,1]]'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 12);

    // Sub-line
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.font = P117_FONT.sub;
    ctx.fillText('K = 2 · shift = 3 · 2N − 1 = 7', w / 2, 30);

    // Matrix layout — center, responsive.
    // Reserve bottom 80px for chips (4 unions).
    const matAreaTop = 52;
    const matAreaBot = h - 86;
    const matAreaH = matAreaBot - matAreaTop;
    const sidePad = 16;
    const maxCellByW = (w - sidePad * 2 - 220) / N;   // 220px for legend column
    const maxCellByH = matAreaH / N;
    const cellSize = Math.max(28, Math.min(maxCellByW, maxCellByH, 56));
    const totalW = cellSize * N;
    const totalH = cellSize * N;
    const originX = (w - totalW) / 2 + 70;
    const originY = matAreaTop + (matAreaH - totalH) / 2;

    const cur = step === -1 ? null : STEPS[step];
    const filled = cur ? cur.filled : makeBlank();
    const tints  = cur ? cur.tints  : makeTints();

    // Row/col index labels
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.font = P117_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let c = 0; c < N; c++) {
      ctx.fillText(`c${c + 1}`, originX + c * cellSize + cellSize / 2, originY - 4);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < N; r++) {
      ctx.fillText(`r${r + 1}`, originX - 6, originY + r * cellSize + cellSize / 2);
    }

    p117DrawMatrix(ctx, N, filled, tints, originX, originY, cellSize,
                   { highlightRC: cur && cur.highlightRC });

    // Mid divider lines (separating K = 2 blocks)
    ctx.save();
    ctx.strokeStyle = P117_COLOR.ink;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    // horizontal divider at row 2
    ctx.beginPath();
    ctx.moveTo(originX, originY + 2 * cellSize);
    ctx.lineTo(originX + totalW, originY + 2 * cellSize);
    ctx.stroke();
    // vertical divider at col 2
    ctx.beginPath();
    ctx.moveTo(originX + 2 * cellSize, originY);
    ctx.lineTo(originX + 2 * cellSize, originY + totalH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Block labels (TL/TR/BL/BR) in small text at quadrant corners
    ctx.font = P117_FONT.tagSm;
    ctx.textBaseline = 'middle';
    const quadLabels = [
      { txt: 'TL', x: originX + cellSize * 1.0, y: originY + cellSize * 1.0, color: P117_COLOR.tlStroke },
      { txt: 'TR', x: originX + cellSize * 3.0, y: originY + cellSize * 1.0, color: P117_COLOR.trStroke },
      { txt: 'BL', x: originX + cellSize * 1.0, y: originY + cellSize * 3.0, color: P117_COLOR.blStroke },
      { txt: 'BR', x: originX + cellSize * 3.0, y: originY + cellSize * 3.0, color: P117_COLOR.brStroke },
    ];
    // Place quadrant labels just outside the bottom-right corner of each quadrant.
    // Actually, keep this off-matrix to avoid clutter — only show in the legend.

    // Legend on the left
    const legendX = 16;
    const legendY = matAreaTop + 6;
    const legendRowH = 16;
    const items = [
      ['TL', P117_COLOR.tlTint, P117_COLOR.tlStroke, 'A(K)'],
      ['BR', P117_COLOR.brTint, P117_COLOR.brStroke, 'A(K)'],
      ['BL', P117_COLOR.blTint, P117_COLOR.blStroke, '+ shift'],
      ['TR', P117_COLOR.trTint, P117_COLOR.trStroke, '對角 = 2N−1'],
    ];
    ctx.font = P117_FONT.tagSm;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < items.length; i++) {
      const y = legendY + i * legendRowH;
      ctx.fillStyle = items[i][1];
      ctx.fillRect(legendX, y - 5, 10, 10);
      ctx.strokeStyle = items[i][2];
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX + 0.5, y - 5 + 0.5, 9, 9);
      ctx.fillStyle = P117_COLOR.ink;
      ctx.fillText(items[i][0], legendX + 16, y);
      ctx.fillStyle = P117_COLOR.inkDim;
      ctx.fillText(items[i][3], legendX + 38, y);
    }

    // shift / max value indicators below legend
    ctx.fillStyle = P117_COLOR.coral;
    ctx.font = P117_FONT.tag;
    ctx.fillText('shift = 3', legendX, legendY + 4 * legendRowH + 6);
    ctx.fillText('2N−1 = 7', legendX, legendY + 4 * legendRowH + 24);

    // Bottom chip row: 4 row∪col union summaries
    const chipY = h - 50;
    const chipH = 20;
    // Equal-width chips spanning canvas width
    const chipBandLeft = 18;
    const chipBandRight = w - 18;
    const chipBandW = chipBandRight - chipBandLeft;
    const chipGap = 8;
    const chipW = (chipBandW - chipGap * (N - 1)) / N;

    ctx.font = P117_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const universe = '{1..7}';
    for (let i = 0; i < N; i++) {
      const x = chipBandLeft + i * (chipW + chipGap);
      const s = computeUnion(filled, i);
      const sorted = Array.from(s).sort((a, b) => a - b);
      const display = sorted.length === 0 ? '∅'
                    : '{' + sorted.join(',') + '}';
      const complete = sorted.length === 7;
      const bg = complete ? P117_COLOR.chipGood : P117_COLOR.cellEmpty;
      const stroke = complete ? P117_COLOR.chipGoodStr : P117_COLOR.ink;
      ctx.fillStyle = bg;
      ctx.fillRect(x, chipY - chipH / 2, chipW, chipH);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, chipY - chipH / 2 + 0.5, chipW - 1, chipH - 1);
      // Heading inside chip
      ctx.fillStyle = P117_COLOR.ink;
      ctx.font = P117_FONT.tagSm;
      ctx.fillText(`r${i+1}∪c${i+1}`, x + chipW / 2, chipY - 3);
      // Set value below
      ctx.fillStyle = complete ? P117_COLOR.chipGoodStr : P117_COLOR.inkDim;
      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillText(display, x + chipW / 2, chipY + 7);
    }

    // Caption above chips: "verify row i ∪ col i = {1..7}"
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.font = P117_FONT.tagSm;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('verify  row i ∪ col i = {1..7}:', chipBandLeft, chipY - chipH / 2 - 10);

    // Completeness count on the right
    let completeCount = 0;
    for (let i = 0; i < N; i++) {
      if (computeUnion(filled, i).size === 7) completeCount++;
    }
    ctx.fillStyle = completeCount === N ? P117_COLOR.chipGoodStr : P117_COLOR.inkDim;
    ctx.font = P117_FONT.callout;
    ctx.textAlign = 'right';
    ctx.fillText(`${completeCount} / ${N} ${completeCount === N ? '✓' : ''}`,
                 chipBandRight, chipY - chipH / 2 - 10);
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 4 × 4 空格，準備從 <code>A(2)</code> 建出 <code>A(4)</code>。<br/>' +
          '<span style="color:#6b6b6b">按 Play 走過 5 步：TL → BR → BL → TR（含對角）→ 驗證 4 條 row ∪ col。</span>';
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
    }, 1900);
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
