/* ============================================================
   P500 好的連續子序列 — 分治 + max/min 重新框架
   Two canvases:
     viz-base    · BASE CASE — O(N²) brute on [5,1,2,4,3] (find 10 good intervals)
     viz-general · GENERAL CASE — D&C split + recurse + cross on [5,1,2,4,3]
   ============================================================ */

const P500_COLOR = {
  paper:     '#faf5e6',
  cellBg:    '#ffffff',
  cellBorder:'#1a1a1a',
  cellText:  '#1a1a1a',
  leftTint:  '#ecf0f5',
  rightTint: '#f3eee6',
  goodTint:  '#e3f0d8',
  badTint:   '#f7e6e6',
  coral:     '#d96e4e',
  ink:       '#1a1a1a',
  inkDim:    '#6b6b6b',
  inactive:  '#cfcfcf',
};

const P500_FONT = {
  head:    '700 13px "JetBrains Mono", monospace',
  sub:     '500 11px "JetBrains Mono", monospace',
  label:   '700 10px "JetBrains Mono", monospace',
  cellLg:  '700 18px "JetBrains Mono", monospace',
  cellMd:  '700 14px "JetBrains Mono", monospace',
  tag:     '700 10px "JetBrains Mono", monospace',
  tagSm:   '700 9px "JetBrains Mono", monospace',
};

function p500DrawCell(ctx, x, y, size, value, opts) {
  opts = opts || {};
  ctx.fillStyle = opts.bg || P500_COLOR.cellBg;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = opts.border || P500_COLOR.cellBorder;
  ctx.lineWidth = opts.lineWidth || 1.4;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  if (value !== null && value !== undefined) {
    ctx.fillStyle = opts.color || P500_COLOR.cellText;
    ctx.font = size >= 32 ? P500_FONT.cellLg : P500_FONT.cellMd;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + size / 2, y + size / 2);
  }
}

/* ============================================================
   ===== A · BASE CASE — brute O(N²) on [5,1,2,4,3] =====
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

  const ARR = [5, 1, 2, 4, 3];

  // Each step fixes L and sweeps R = L..N-1, showing which (L,R) are good.
  // Good (L,R) pairs (0-indexed) for [5,1,2,4,3]:
  //   L=0: (0,0) {5} ✓ ; (0,4) {5,1,2,4,3} mm=4=R-L ✓
  //   L=1: (1,1) {1} ; (1,2) {1,2} mm=1=R-L ; (1,4) {1,2,4,3} mm=3=R-L ✓
  //   L=2: (2,2) {2} ; (2,4) {2,4,3} mm=2=R-L ✓
  //   L=3: (3,3) {4} ; (3,4) {4,3} mm=1=R-L ✓
  //   L=4: (4,4) {3}
  // Total = 2 + 3 + 2 + 2 + 1 = 10 ✓
  const GOOD = {
    0: [[0, 0], [0, 4]],
    1: [[1, 1], [1, 2], [1, 4]],
    2: [[2, 2], [2, 4]],
    3: [[3, 3], [3, 4]],
    4: [[4, 4]],
  };
  const COUNTS = [2, 3, 2, 2, 1];

  const STEPS = [
    { L: 0, title: 'STEP 01 · L = 1 · 掃 R = 1..5',
      detail: '固定 L = 1（值 5）。<br/>R = 1 [5] ✓ · R = 2..4 max−min = 4 卻 R−L &lt; 4 ×<br/>R = 5 [5,1,2,4,3] max−min = 4 = R−L ✓<br/>本 L 共 <strong>2</strong> 個 good。' },
    { L: 1, title: 'STEP 02 · L = 2 · 掃 R = 2..5',
      detail: '固定 L = 2（值 1）。<br/>R = 2 [1] ✓ · R = 3 [1,2] mm=1 ✓ · R = 4 [1,2,4] mm=3≠2 ×<br/>R = 5 [1,2,4,3] mm=3=R−L ✓<br/>本 L 共 <strong>3</strong> 個 good。' },
    { L: 2, title: 'STEP 03 · L = 3 · 掃 R = 3..5',
      detail: '固定 L = 3（值 2）。<br/>R = 3 [2] ✓ · R = 4 [2,4] mm=2≠1 × · R = 5 [2,4,3] mm=2=R−L ✓<br/>本 L 共 <strong>2</strong> 個 good。' },
    { L: 3, title: 'STEP 04 · L = 4 · 掃 R = 4..5',
      detail: '固定 L = 4（值 4）。<br/>R = 4 [4] ✓ · R = 5 [4,3] mm=1=R−L ✓<br/>本 L 共 <strong>2</strong> 個 good。' },
    { L: 4, title: 'STEP 05 · L = 5 · 掃 R = 5',
      detail: '固定 L = 5（值 3）。<br/>R = 5 [3] 單元素 ✓<br/>本 L 共 <strong>1</strong> 個 good。' },
    { L: -1, title: 'STEP 06 · DONE · 合計 10 個 good 區間',
      detail: '把各 L 的計數加總：<br/><code>2 + 3 + 2 + 2 + 1 = <strong>10</strong></code> ✓<br/><span style="color:#6b6b6b">這個 O(N²) brute 可在 N ≤ 5000 (20% 子任務) 通過。</span>' },
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
    ctx.fillStyle = P500_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // Headline
    ctx.fillStyle = P500_COLOR.ink;
    ctx.font = P500_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = step === -1
      ? 'INITIAL · BRUTE FORCE O(N²) ON [5,1,2,4,3]'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 8);

    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.sub;
    ctx.fillText('GOOD ⇔ max − min == R − L', w / 2, 26);

    // Array cells — wide layout
    const n = ARR.length;
    const padX = 32;
    const cellSize = Math.min((w - padX * 2) / n * 0.85, 50);
    const gap = Math.min((w - padX * 2) / n * 0.15, 10);
    const totalW = cellSize * n + gap * (n - 1);
    const x0 = (w - totalW) / 2;
    const arrY = 56;

    // Determine highlight state
    let curL = -1;
    if (step >= 0 && step <= 4) curL = STEPS[step].L;

    // Index labels above cells
    ctx.font = P500_FONT.tagSm;
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (cellSize + gap);
      ctx.fillText(String(i + 1), x + cellSize / 2, arrY - 4);
    }

    // Cells
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (cellSize + gap);
      let bg = P500_COLOR.cellBg;
      if (step >= 0 && step <= 4 && i === curL) {
        bg = P500_COLOR.leftTint;
      } else if (step >= 0 && step <= 4 && i > curL) {
        bg = P500_COLOR.rightTint;
      } else if (step === 5) {
        bg = P500_COLOR.goodTint;
      }
      p500DrawCell(ctx, x, arrY, cellSize, ARR[i], { bg });
    }

    // L-pointer marker (under current L cell)
    if (curL >= 0) {
      const x = x0 + curL * (cellSize + gap) + cellSize / 2;
      ctx.fillStyle = P500_COLOR.coral;
      ctx.font = P500_FONT.tag;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('L', x, arrY + cellSize + 4);
    }

    // GOOD intervals strip below — show as little ticks under [L..R]
    const stripY = arrY + cellSize + 28;
    ctx.font = P500_FONT.tagSm;
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('GOOD (L,R):', 8, stripY);

    const collected = [];
    if (step === -1) {
      // nothing yet
    } else if (step === 5) {
      // all
      for (let s = 0; s <= 4; s++) collected.push(...GOOD[s]);
    } else {
      for (let s = 0; s <= step; s++) collected.push(...GOOD[s]);
    }

    // Render the (L,R) pairs in mono
    ctx.font = P500_FONT.tagSm;
    ctx.fillStyle = P500_COLOR.ink;
    ctx.textAlign = 'left';
    const labelStart = 92;
    const pairW = 42;
    const maxPerRow = Math.floor((w - labelStart - 8) / pairW);
    for (let k = 0; k < collected.length; k++) {
      const row = Math.floor(k / maxPerRow);
      const col = k % maxPerRow;
      const tx = labelStart + col * pairW;
      const ty = stripY + row * 14;
      const [L, R] = collected[k];
      ctx.fillStyle = (k === collected.length - 1 && step >= 0 && step < 5) ? P500_COLOR.coral : P500_COLOR.ink;
      ctx.fillText(`(${L + 1},${R + 1})`, tx, ty);
    }

    // Running total on the right
    const totalSoFar = collected.length;
    ctx.font = P500_FONT.tag;
    ctx.fillStyle = step === 5 ? P500_COLOR.coral : P500_COLOR.inkDim;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`COUNT = ${totalSoFar}`, w - 8, stripY);
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 序列 [5,1,2,4,3]，準備 brute O(N²)<br/>' +
          '<span style="color:#6b6b6b">按 Play 看 6 步固定 L 掃 R，累計 good 區間。</span>';
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
    }, 1600);
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
   ===== B · GENERAL CASE — D&C on [5,1,2,4,3] =====
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

  const ARR = [5, 1, 2, 4, 3];

  // The D&C decomposition. From hand trace:
  //   solve(1,5) → solve(1,3) + solve(4,5) + crossing(1,3,5)
  //   solve(1,3) = 4
  //   solve(4,5) = 3
  //   crossing(1,3,5) = 3
  //   total = 10
  const STEPS = [
    {
      title: 'STEP 01 · SPLIT · mid = 3',
      detail:
        'solve(1, 5)：mid = ⌊(1+5)/2⌋ = 3。<br/>' +
        '左半 = [5, 1, 2]（index 1..3）／右半 = [4, 3]（index 4..5）。<br/>' +
        '<span style="color:#6b6b6b">先各自遞迴，最後算跨界。</span>',
    },
    {
      title: 'STEP 02 · RECURSE LEFT · solve(1, 3) = 4',
      detail:
        '左半 [5, 1, 2] 共 4 個 good 區間：<br/>' +
        '<code>(1,1) (2,2) (3,3)</code>（3 個單元素） + <code>(2,3)</code>（[1,2]：max−min=1）。<br/>' +
        '<span style="color:#6b6b6b">recursion 內部自動遞迴算出。</span>',
    },
    {
      title: 'STEP 03 · RECURSE RIGHT · solve(4, 5) = 3',
      detail:
        '右半 [4, 3] 共 3 個 good 區間：<br/>' +
        '<code>(4,4) (5,5)</code>（2 個單元素） + <code>(4,5)</code>（[4,3]：max−min=1）。',
    },
    {
      title: 'STEP 04 · COUNT CROSSING · 4-CASE',
      detail:
        '跨界 (L ≤ 3 &lt; R)，依 max/min 來自哪半分 4 case：<br/>' +
        '<code>Case 1</code>(全左)：(1,5)＝[5,1,2,4,3]，max=5、min=1、R−L=4 ✓<br/>' +
        '<code>Case 4</code>(maxR/minL)：(2,5)＝[1,2,4,3] ✓ 和 (3,5)＝[2,4,3] ✓<br/>' +
        '共 <strong>3</strong> 個跨界 good。',
    },
    {
      title: 'STEP 05 · DONE · 4 + 3 + 3 = 10',
      detail:
        '<strong>solve(1, 5) = 4 + 3 + 3 = 10</strong> ✓<br/>' +
        '<span style="color:#6b6b6b">與 brute force 結果完全一致。整體複雜度 O(N log N)。</span>',
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
    ctx.fillStyle = P500_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // Headline
    ctx.fillStyle = P500_COLOR.ink;
    ctx.font = P500_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = step === -1
      ? 'INITIAL · D&C ON [5,1,2,4,3]'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 10);

    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.sub;
    ctx.fillText('T(N) = 2·T(N/2) + O(N)  ⇒  O(N log N)', w / 2, 28);

    // Top row: full array
    const n = ARR.length;
    const padX = 24;
    const usableW = w - padX * 2;
    const topCellSize = Math.min(usableW / n * 0.78, 46);
    const topGap = Math.min(usableW / n * 0.22, 12);
    const topTotalW = topCellSize * n + topGap * (n - 1);
    const topX0 = (w - topTotalW) / 2;
    const topY = 60;

    // Index labels above
    ctx.font = P500_FONT.tagSm;
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let i = 0; i < n; i++) {
      const x = topX0 + i * (topCellSize + topGap);
      ctx.fillText(String(i + 1), x + topCellSize / 2, topY - 4);
    }

    // Top row cells — color left/right after split
    for (let i = 0; i < n; i++) {
      const x = topX0 + i * (topCellSize + topGap);
      let bg = P500_COLOR.cellBg;
      if (step >= 0) {
        bg = i < 3 ? P500_COLOR.leftTint : P500_COLOR.rightTint;
      }
      p500DrawCell(ctx, x, topY, topCellSize, ARR[i], { bg });
    }

    // mid marker
    if (step >= 0) {
      const midI = 2; // 0-indexed
      const midX = topX0 + midI * (topCellSize + topGap) + topCellSize + topGap / 2;
      ctx.strokeStyle = P500_COLOR.coral;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(midX, topY - 8);
      ctx.lineTo(midX, topY + topCellSize + 14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = P500_FONT.tagSm;
      ctx.fillStyle = P500_COLOR.coral;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('mid = 3', midX, topY + topCellSize + 4);
    }

    // Middle row — two sub-arrays (after split)
    if (step >= 0) {
      const subY = 150;
      const subCell = Math.min(topCellSize * 0.85, 38);
      const subGap = 8;
      const leftN = 3, rightN = 2;
      const leftW = subCell * leftN + subGap * (leftN - 1);
      const rightW = subCell * rightN + subGap * (rightN - 1);
      const leftCx = w * 0.30;
      const rightCx = w * 0.72;
      const leftX0 = leftCx - leftW / 2;
      const rightX0 = rightCx - rightW / 2;

      // Sub-array tags
      ctx.font = P500_FONT.label;
      ctx.fillStyle = step >= 1 ? P500_COLOR.coral : P500_COLOR.inkDim;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('solve(1, 3)' + (step >= 1 ? ' = 4' : ''), leftCx, subY - 6);

      ctx.fillStyle = step >= 2 ? P500_COLOR.coral : P500_COLOR.inkDim;
      ctx.fillText('solve(4, 5)' + (step >= 2 ? ' = 3' : ''), rightCx, subY - 6);

      // Left sub cells
      for (let i = 0; i < leftN; i++) {
        const x = leftX0 + i * (subCell + subGap);
        const dim = step >= 1;
        p500DrawCell(ctx, x, subY, subCell, ARR[i], {
          bg: P500_COLOR.leftTint,
          border: dim ? '#888' : P500_COLOR.cellBorder,
        });
      }
      // Right sub cells
      for (let i = 0; i < rightN; i++) {
        const x = rightX0 + i * (subCell + subGap);
        const dim = step >= 2;
        p500DrawCell(ctx, x, subY, subCell, ARR[3 + i], {
          bg: P500_COLOR.rightTint,
          border: dim ? '#888' : P500_COLOR.cellBorder,
        });
      }

      // Connectors from top row to sub-arrays
      ctx.strokeStyle = P500_COLOR.inkDim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Left connector
      const leftTopX = topX0 + (topCellSize + topGap) * 1 + topCellSize / 2;
      ctx.moveTo(leftTopX, topY + topCellSize);
      ctx.lineTo(leftCx, subY);
      // Right connector
      const rightTopX = topX0 + (topCellSize + topGap) * 3.5;
      ctx.moveTo(rightTopX, topY + topCellSize);
      ctx.lineTo(rightCx, subY);
      ctx.stroke();
    }

    // Crossing area (step >= 3)
    if (step >= 3) {
      const crossY = 230;
      const crossH = 70;
      const boxX = 24;
      const boxW = w - 48;
      ctx.fillStyle = step >= 4 ? P500_COLOR.goodTint : '#f0ebde';
      ctx.fillRect(boxX, crossY, boxW, crossH);
      ctx.strokeStyle = P500_COLOR.coral;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(boxX + 0.5, crossY + 0.5, boxW - 1, crossH - 1);

      ctx.font = P500_FONT.label;
      ctx.fillStyle = P500_COLOR.coral;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('// CROSSING  L ∈ {1,2,3}  R ∈ {4,5}', boxX + 10, crossY + 8);

      ctx.font = P500_FONT.tag;
      ctx.fillStyle = P500_COLOR.ink;
      ctx.textBaseline = 'top';
      const lines = [
        'Case 1 (max+min in L): (1,5) [5,1,2,4,3] ✓',
        'Case 4 (max R, min L):  (2,5) [1,2,4,3] ✓ · (3,5) [2,4,3] ✓',
      ];
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], boxX + 10, crossY + 24 + i * 14);
      }

      // Crossing count
      ctx.font = P500_FONT.tag;
      ctx.fillStyle = step >= 4 ? P500_COLOR.coral : P500_COLOR.inkDim;
      ctx.textAlign = 'right';
      ctx.fillText(step >= 3 ? 'CROSSING = 3' : 'CROSSING = ?', boxX + boxW - 10, crossY + 8);
    }

    // Final total
    if (step >= 4) {
      ctx.font = P500_FONT.head;
      ctx.fillStyle = P500_COLOR.coral;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('TOTAL = 4 + 3 + 3 = 10', w / 2, h - 28);
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
          '<strong>INITIAL</strong> · 序列 [5,1,2,4,3]，準備分治<br/>' +
          '<span style="color:#6b6b6b">按 Play 看 5 步：切半 → 遞迴左右 → 跨界 4-case → 合計。</span>';
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
    }, 1800);
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
