/* ============================================================
   P501 好的序列 — 奇偶切構造法
   Two canvases:
     viz-base    · BASE CASE — build f(2) from two f(1)
     viz-general · GENERAL CASE — full recursion tree of f(8)
   ============================================================ */

const P501_COLOR = {
  paper:      '#faf5e6',
  cellEmpty:  '#ffffff',
  cellFilled: '#ffffff',
  cellBorder: '#1a1a1a',
  cellText:   '#1a1a1a',
  leftTint:   '#ecf0f5',     // pale blue – odd-value side
  rightTint:  '#f3eee6',     // pale tan – even-value side
  edge:       '#999999',
  edgeActive: '#d96e4e',
  coral:      '#d96e4e',
  ink:        '#1a1a1a',
  inkDim:     '#6b6b6b',
  inactive:   '#cfcfcf',
};

const P501_FONT = {
  head:   '700 13px "JetBrains Mono", monospace',
  sub:    '500 11px "JetBrains Mono", monospace',
  label:  '700 10px "JetBrains Mono", monospace',
  cellLg: '700 18px "JetBrains Mono", monospace',
  cellMd: '700 14px "JetBrains Mono", monospace',
  cellSm: '700 12px "JetBrains Mono", monospace',
  tag:    '700 9px "JetBrains Mono", monospace',
};

function p501DrawCell(ctx, x, y, size, value, opts) {
  opts = opts || {};
  ctx.fillStyle = opts.bg || P501_COLOR.cellEmpty;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = opts.border || P501_COLOR.cellBorder;
  ctx.lineWidth = opts.lineWidth || 1.4;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  if (value !== null && value !== undefined) {
    ctx.fillStyle = opts.color || P501_COLOR.cellText;
    ctx.font = size >= 36 ? P501_FONT.cellLg : (size >= 24 ? P501_FONT.cellMd : P501_FONT.cellSm);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + size / 2, y + size / 2);
  }
}

function p501DrawSequence(ctx, cx, cy, cellSize, gap, values, fills) {
  const n = values.length;
  const totalW = cellSize * n + gap * (n - 1);
  const x0 = cx - totalW / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cellSize + gap);
    const v = values[i];
    const bg = (fills && fills[i]) || P501_COLOR.cellEmpty;
    p501DrawCell(ctx, x, cy - cellSize / 2, cellSize, v, { bg });
  }
  return { x0, totalW };
}

/* ============================================================
   ===== A · BASE CASE — build f(2) =====
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

  // Steps:
  //   -1  INITIAL  · two f(1) leaves, target f(2) empty
  //    0  ODD MAP  · left = 2·1 − 1 = 1
  //    1  EVEN MAP · right = 2·1 = 2
  //    2  DONE     · f(2) = [1, 2]
  const STEPS = [
    {
      title: 'STEP 01 · ODD MAP · 左半 = 2 · f(1) − 1',
      detail:
        '左半套 <code>2x − 1</code>：<code>2·1 − 1 = 1</code>。<br/>' +
        '左格填入 <strong>1</strong>（奇數）。',
    },
    {
      title: 'STEP 02 · EVEN MAP · 右半 = 2 · f(1)',
      detail:
        '右半套 <code>2x</code>：<code>2·1 = 2</code>。<br/>' +
        '右格填入 <strong>2</strong>（偶數）。',
    },
    {
      title: 'STEP 03 · DONE · f(2) = [1, 2]',
      detail:
        '串接完成：<strong>[1, 2]</strong>。<br/>' +
        '<span style="color:#6b6b6b">任意 3-AP 至少需 3 個元素；f(2) 只有 2 個 ⇒ 自動 3-AP free。</span>',
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
    ctx.fillStyle = P501_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // headline (tighter)
    ctx.fillStyle = P501_COLOR.ink;
    ctx.font = P501_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = (step === -1)
      ? 'INITIAL · BUILD f(2) FROM TWO f(1)'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 10);

    // sub-line
    ctx.fillStyle = P501_COLOR.inkDim;
    ctx.font = P501_FONT.sub;
    ctx.fillText('f(2) = [ 2·f(1) − 1 ]  ∥  [ 2·f(1) ]', w / 2, 28);

    // Compact layout — sources upper, destinations lower, single screen height
    const sourceCellSize = 30;
    const destCellSize = 36;
    const sourceY = 65;          // source cells y=50..80
    const destY = h - 38;         // dest cells y=130..166 (for h=200)
    const leftX = w * 0.32;
    const rightX = w * 0.68;

    // Source f(1) cells (value 1 inside makes "f(1)" caption redundant)
    p501DrawCell(ctx, leftX - sourceCellSize / 2, sourceY - sourceCellSize / 2,
                 sourceCellSize, 1, { bg: '#fff' });
    p501DrawCell(ctx, rightX - sourceCellSize / 2, sourceY - sourceCellSize / 2,
                 sourceCellSize, 1, { bg: '#fff' });

    // Edge labels (transform on connectors)
    const edgeY = (sourceY + sourceCellSize / 2 + destY - destCellSize / 2) / 2;
    const leftActive = step >= 0;
    const rightActive = step >= 1;

    // Left connector
    ctx.strokeStyle = leftActive ? P501_COLOR.edgeActive : P501_COLOR.edge;
    ctx.lineWidth = leftActive ? 2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(leftX, sourceY + sourceCellSize / 2);
    ctx.lineTo(leftX, destY - destCellSize / 2);
    ctx.stroke();

    // Right connector
    ctx.strokeStyle = rightActive ? P501_COLOR.edgeActive : P501_COLOR.edge;
    ctx.lineWidth = rightActive ? 2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(rightX, sourceY + sourceCellSize / 2);
    ctx.lineTo(rightX, destY - destCellSize / 2);
    ctx.stroke();

    // Edge labels — pinned right next to each connector
    ctx.font = P501_FONT.tag;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = leftActive ? P501_COLOR.coral : P501_COLOR.inkDim;
    ctx.fillText('× 2 − 1', leftX + 8, edgeY);
    ctx.fillStyle = rightActive ? P501_COLOR.coral : P501_COLOR.inkDim;
    ctx.fillText('× 2', rightX + 8, edgeY);

    // Destination cells (the f(2) being built)
    const leftVal  = step >= 0 ? 1 : null;
    const rightVal = step >= 1 ? 2 : null;
    p501DrawCell(ctx, leftX - destCellSize / 2, destY - destCellSize / 2,
                 destCellSize, leftVal, { bg: P501_COLOR.leftTint });
    p501DrawCell(ctx, rightX - destCellSize / 2, destY - destCellSize / 2,
                 destCellSize, rightVal, { bg: P501_COLOR.rightTint });

    // Dest band labels (below) — small, no headline above to avoid collision
    ctx.font = P501_FONT.tag;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#3a5a7a';
    ctx.fillText('ODD · [0]', leftX, destY + destCellSize / 2 + 5);
    ctx.fillStyle = '#7a5a3a';
    ctx.fillText('EVEN · [1]', rightX, destY + destCellSize / 2 + 5);
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 兩份 f(1) = [1] 等待組合<br/>' +
          '<span style="color:#6b6b6b">按 Play 看 3 步從 f(1) 組出 f(2) = [1, 2]。</span>';
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
   ===== B · GENERAL CASE — full recursion tree of f(8) =====
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

  // Tree values per level (filled top-down for inspection,
  // shown bottom-up via STEPS):
  //   level 3 (leaves) · 8 × f(1) = [1]
  //   level 2          · 4 × f(2) = [1, 2]
  //   level 1          · 2 × f(4) = [1, 3, 2, 4]
  //   level 0 (root)   · 1 × f(8) = [1, 5, 3, 7, 2, 6, 4, 8]
  const F1 = [1];
  const F2 = [1, 2];
  const F4 = [1, 3, 2, 4];
  const F8 = [1, 5, 3, 7, 2, 6, 4, 8];

  //   step = -1  initial · empty skeleton
  //   step =  0  fill leaves (f(1) × 8)
  //   step =  1  combine to f(2) × 4
  //   step =  2  combine to f(4) × 2
  //   step =  3  combine to f(8) × 1  (DONE)
  const STEPS = [
    {
      title: 'STEP 01 · LEAVES · 8 × f(1) = [1]',
      detail:
        '遞迴最底層 — 8 個 <code>f(1)</code> 都直接回傳 <code>[1]</code>。<br/>' +
        '<span style="color:#6b6b6b">這是 base case，沒有實際工作。</span>',
    },
    {
      title: 'STEP 02 · LEVEL 2 · 4 × f(2) = [1, 2]',
      detail:
        '每對 <code>f(1)</code> 組成一個 <code>f(2)</code>：<br/>' +
        '左 <code>2·1 − 1 = 1</code> · 右 <code>2·1 = 2</code> ⇒ <strong>[1, 2]</strong>。<br/>' +
        '共 4 個 <code>f(2)</code>。',
    },
    {
      title: 'STEP 03 · LEVEL 1 · 2 × f(4) = [1, 3, 2, 4]',
      detail:
        '每對 <code>f(2)</code> 組成一個 <code>f(4)</code>：<br/>' +
        '左 <code>2·[1,2] − 1 = [1, 3]</code> · 右 <code>2·[1,2] = [2, 4]</code> ⇒ <strong>[1, 3, 2, 4]</strong>。',
    },
    {
      title: 'STEP 04 · ROOT · f(8) = [1, 5, 3, 7, 2, 6, 4, 8]',
      detail:
        '兩個 <code>f(4)</code> 組成 <code>f(8)</code>：<br/>' +
        '左 <code>2·[1,3,2,4] − 1 = [1, 5, 3, 7]</code> · 右 <code>2·[1,3,2,4] = [2, 6, 4, 8]</code><br/>' +
        '⇒ <strong>[1, 5, 3, 7, 2, 6, 4, 8]</strong>　✓ 3-AP free',
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

  function computeLayout(w, h) {
    const padX = 24;
    const headTop = 44;
    const bottom = 22;
    const usableW = w - padX * 2;
    const usableH = h - headTop - bottom;

    // Vertical: 4 rows for (root, f(4), f(2), leaves), top → bottom
    // Row Ys (centers):
    const rowYs = [
      headTop + usableH * 0.08,
      headTop + usableH * 0.36,
      headTop + usableH * 0.64,
      headTop + usableH * 0.92,
    ];

    // 8 leaf X centers
    const leafXs = [];
    for (let i = 0; i < 8; i++) {
      leafXs.push(padX + usableW * (i + 0.5) / 8);
    }
    // Parents are midpoints of children pairs
    const f2Xs = [
      (leafXs[0] + leafXs[1]) / 2,
      (leafXs[2] + leafXs[3]) / 2,
      (leafXs[4] + leafXs[5]) / 2,
      (leafXs[6] + leafXs[7]) / 2,
    ];
    const f4Xs = [
      (f2Xs[0] + f2Xs[1]) / 2,
      (f2Xs[2] + f2Xs[3]) / 2,
    ];
    const f8X = (f4Xs[0] + f4Xs[1]) / 2;

    // Cell sizes per level — smaller at leaves, bigger at root
    const cellSizes = {
      leaf: 22,   // f(1) · 1 cell · width 22
      f2:   20,   // f(2) · 2 cells
      f4:   20,   // f(4) · 4 cells
      f8:   22,   // f(8) · 8 cells
    };
    const gaps = { leaf: 0, f2: 3, f4: 3, f8: 3 };

    return { rowYs, leafXs, f2Xs, f4Xs, f8X, cellSizes, gaps };
  }

  function drawTreeEdges(L, levelActive) {
    // Edges between parent (above) and child (below). Annotated as ODD/EVEN.
    // Edge active when both endpoints are filled OR currently being formed.

    function drawEdge(parentX, parentY, parentCellHalf, childX, childY, childCellHalf, active, side) {
      const from = { x: parentX, y: parentY + parentCellHalf };
      const to   = { x: childX,  y: childY - childCellHalf };

      ctx.strokeStyle = active ? P501_COLOR.edgeActive : (levelActive ? P501_COLOR.edge : P501_COLOR.inactive);
      ctx.lineWidth = active ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Tag near parent end
      if (active) {
        const tagX = (from.x + to.x) / 2 + (side === 'L' ? -10 : 10);
        const tagY = (from.y + to.y) / 2;
        ctx.font = P501_FONT.tag;
        ctx.fillStyle = P501_COLOR.coral;
        ctx.textAlign = side === 'L' ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(side === 'L' ? '×2−1' : '×2', tagX, tagY);
      }
    }

    // Each f(N) node has cells of width cellSizes[type] × N + gap × (N-1).
    // The parent-to-child edge attaches at center bottom of parent and center top of child.
    // For visual clarity: parent->left-child edge starts from LEFT-half center of parent block,
    //                    parent->right-child edge starts from RIGHT-half center.

    function nodeWidth(type, n) {
      return L.cellSizes[type] * n + L.gaps[type] * (n - 1);
    }
    function halfCenterX(parentX, type, n, side) {
      const w = nodeWidth(type, n);
      // parent block spans parentX - w/2 to parentX + w/2
      // left half center = parentX - w/4
      // right half center = parentX + w/4
      return parentX + (side === 'L' ? -w / 4 : w / 4);
    }

    // f(8) -> f(4) edges (level 0 -> 1)
    const f8w = nodeWidth('f8', 8);
    const f4w = nodeWidth('f4', 4);
    const f2w = nodeWidth('f2', 2);
    const leafw = nodeWidth('leaf', 1);

    const a1 = step >= 3; // root edges become active when DONE step plays
    drawEdge(
      halfCenterX(L.f8X, 'f8', 8, 'L'), L.rowYs[0], L.cellSizes.f8 / 2,
      L.f4Xs[0], L.rowYs[1], L.cellSizes.f4 / 2,
      a1, 'L'
    );
    drawEdge(
      halfCenterX(L.f8X, 'f8', 8, 'R'), L.rowYs[0], L.cellSizes.f8 / 2,
      L.f4Xs[1], L.rowYs[1], L.cellSizes.f4 / 2,
      a1, 'R'
    );

    // f(4) -> f(2) edges (level 1 -> 2)
    const a2 = step >= 2;
    for (let i = 0; i < 2; i++) {
      drawEdge(
        halfCenterX(L.f4Xs[i], 'f4', 4, 'L'), L.rowYs[1], L.cellSizes.f4 / 2,
        L.f2Xs[i * 2], L.rowYs[2], L.cellSizes.f2 / 2,
        a2, 'L'
      );
      drawEdge(
        halfCenterX(L.f4Xs[i], 'f4', 4, 'R'), L.rowYs[1], L.cellSizes.f4 / 2,
        L.f2Xs[i * 2 + 1], L.rowYs[2], L.cellSizes.f2 / 2,
        a2, 'R'
      );
    }

    // f(2) -> leaf edges (level 2 -> 3)
    const a3 = step >= 1;
    for (let i = 0; i < 4; i++) {
      drawEdge(
        halfCenterX(L.f2Xs[i], 'f2', 2, 'L'), L.rowYs[2], L.cellSizes.f2 / 2,
        L.leafXs[i * 2], L.rowYs[3], L.cellSizes.leaf / 2,
        a3, 'L'
      );
      drawEdge(
        halfCenterX(L.f2Xs[i], 'f2', 2, 'R'), L.rowYs[2], L.cellSizes.f2 / 2,
        L.leafXs[i * 2 + 1], L.rowYs[3], L.cellSizes.leaf / 2,
        a3, 'R'
      );
    }
  }

  function drawTreeNodes(L) {
    // Row 0: f(8) root  – filled when step >= 3
    const f8Vals = step >= 3 ? F8 : F8.map(() => null);
    const f8Fills = F8.map((_, i) => (i < 4 ? P501_COLOR.leftTint : P501_COLOR.rightTint));
    p501DrawSequence(ctx, L.f8X, L.rowYs[0], L.cellSizes.f8, L.gaps.f8,
                     step >= 3 ? F8 : F8.map(() => null), f8Fills);

    // Row 1: f(4) × 2 – filled when step >= 2
    for (let i = 0; i < 2; i++) {
      const vals = step >= 2 ? F4 : F4.map(() => null);
      const fills = F4.map((_, j) => (j < 2 ? P501_COLOR.leftTint : P501_COLOR.rightTint));
      p501DrawSequence(ctx, L.f4Xs[i], L.rowYs[1], L.cellSizes.f4, L.gaps.f4, vals, fills);
    }

    // Row 2: f(2) × 4 – filled when step >= 1
    for (let i = 0; i < 4; i++) {
      const vals = step >= 1 ? F2 : F2.map(() => null);
      const fills = [P501_COLOR.leftTint, P501_COLOR.rightTint];
      p501DrawSequence(ctx, L.f2Xs[i], L.rowYs[2], L.cellSizes.f2, L.gaps.f2, vals, fills);
    }

    // Row 3: f(1) leaves – filled when step >= 0
    for (let i = 0; i < 8; i++) {
      const vals = step >= 0 ? F1 : [null];
      p501DrawSequence(ctx, L.leafXs[i], L.rowYs[3], L.cellSizes.leaf, L.gaps.leaf, vals, ['#fff']);
    }
  }

  function drawLevelLabels(L, w) {
    // Vertical level tags on the left margin
    const labels = [
      { y: L.rowYs[0], text: 'f(8)' },
      { y: L.rowYs[1], text: 'f(4)' },
      { y: L.rowYs[2], text: 'f(2)' },
      { y: L.rowYs[3], text: 'f(1)' },
    ];
    ctx.font = P501_FONT.label;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const lab of labels) {
      ctx.fillStyle = P501_COLOR.inkDim;
      ctx.fillText(lab.text, 6, lab.y);
    }

    // Right-side count annotation
    const counts = [
      { y: L.rowYs[0], text: '× 1' },
      { y: L.rowYs[1], text: '× 2' },
      { y: L.rowYs[2], text: '× 4' },
      { y: L.rowYs[3], text: '× 8' },
    ];
    ctx.textAlign = 'right';
    for (const c of counts) {
      ctx.fillStyle = P501_COLOR.inkDim;
      ctx.fillText(c.text, w - 6, c.y);
    }
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = P501_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // Headline
    ctx.fillStyle = P501_COLOR.ink;
    ctx.font = P501_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = (step === -1)
      ? 'INITIAL · RECURSION TREE SKELETON'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 10);

    // Sub-line (formula)
    ctx.fillStyle = P501_COLOR.inkDim;
    ctx.font = P501_FONT.sub;
    ctx.fillText('f(N) = [ 2·f(⌈N/2⌉) − 1 ]  ∥  [ 2·f(⌊N/2⌋) ]  ·  bottom-up', w / 2, 26);

    const L = computeLayout(w, h);
    drawTreeEdges(L, step >= 0);
    drawTreeNodes(L);
    drawLevelLabels(L, w);
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 空遞迴樹骨架 · 4 層 · 從葉子開始往上組合<br/>' +
          '<span style="color:#6b6b6b">按 Play 看 4 步從 f(1) → f(2) → f(4) → f(8)。</span>';
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
