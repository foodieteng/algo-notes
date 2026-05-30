/* ============================================================
   P500 好的連續子序列 — 分治 + max/min 重新框架
   Two canvases:
     viz-base    · BASE CASE — D&C on small N=3 input [2,1,3] (algorithm walked)
     viz-general · GENERAL CASE — D&C on N=5 [5,1,2,4,3] with 4-case crossing
   ============================================================ */

const P500_COLOR = {
  paper:      '#faf5e6',
  cellBg:     '#ffffff',
  cellBorder: '#1a1a1a',
  cellText:   '#1a1a1a',
  leftTint:   '#e3edf5',      // pale blue for L side
  rightTint:  '#f6ead8',      // pale tan for R side
  leftStrong: '#8fb3d4',
  rightStrong:'#d4a868',
  goodFill:   '#d9e8c7',      // pale green for good intervals
  goodStroke: '#5fa866',
  badFill:    '#f0d4d4',
  coral:      '#d96e4e',
  ink:        '#1a1a1a',
  inkDim:     '#6b6b6b',
  inactive:   '#cfcfcf',
};

const P500_FONT = {
  head:    '700 13px "JetBrains Mono", monospace',
  sub:     '500 11px "JetBrains Mono", monospace',
  label:   '700 10px "JetBrains Mono", monospace',
  cellLg:  '700 19px "JetBrains Mono", monospace',
  cellMd:  '700 15px "JetBrains Mono", monospace',
  tag:     '700 10px "JetBrains Mono", monospace',
  tagSm:   '700 9px "JetBrains Mono", monospace',
  callout: '700 12px "JetBrains Mono", monospace',
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
    ctx.font = size >= 36 ? P500_FONT.cellLg : P500_FONT.cellMd;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + size / 2, y + size / 2);
  }
}

// Draw a horizontal array row with optional cell-state tints.
// states[i] ∈ {undefined, 'L', 'R', 'mid', 'good', 'bad', 'dim'}
function p500DrawArray(ctx, values, originX, originY, cellSize, gap, states) {
  for (let i = 0; i < values.length; i++) {
    const x = originX + i * (cellSize + gap);
    const s = states && states[i];
    let bg = P500_COLOR.cellBg;
    let borderColor = P500_COLOR.cellBorder;
    let txtColor = P500_COLOR.cellText;
    if (s === 'L')    bg = P500_COLOR.leftTint;
    else if (s === 'R')    bg = P500_COLOR.rightTint;
    else if (s === 'mid')  { bg = P500_COLOR.coral; txtColor = '#fff'; }
    else if (s === 'good') { bg = P500_COLOR.goodFill; borderColor = P500_COLOR.goodStroke; }
    else if (s === 'bad')  { bg = P500_COLOR.badFill; }
    else if (s === 'dim')  { txtColor = P500_COLOR.inactive; }
    p500DrawCell(ctx, x, originY, cellSize, values[i],
                 { bg, border: borderColor, color: txtColor });
  }
}

// Draw a bracket below a range of cells, with a label.
function p500DrawBracket(ctx, originX, cellSize, gap, lo, hi, y, label, color) {
  const x1 = originX + lo * (cellSize + gap);
  const x2 = originX + hi * (cellSize + gap) + cellSize;
  ctx.strokeStyle = color || P500_COLOR.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1, y + 4);
  ctx.lineTo(x2, y + 4);
  ctx.lineTo(x2, y);
  ctx.stroke();
  if (label) {
    ctx.fillStyle = color || P500_COLOR.ink;
    ctx.font = P500_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, (x1 + x2) / 2, y + 7);
  }
}

/* ============================================================
   ===== A · BASE CASE — D&C on [2, 1, 3] =====
   The smallest non-trivial D&C run:
     solve(1, 3) →
       mid = 2, split [2,1] | [3]
       left  solve(1, 2) = 3   (singletons {2}, {1}, and pair [2,1] is good since max−min=1=R−L)
       right solve(3, 3) = 1   (singleton {3})
       cross: pairs (L,R) with L∈{1,2}, R∈{3}
              (L=2, R=3): [1, 3]  max−min=2, R−L=1 ✗
              (L=1, R=3): [2,1,3] max−min=2, R−L=2 ✓
              cross count = 1
     total = 3 + 1 + 1 = 5
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

  const ARR = [2, 1, 3];

  // Each step describes the algorithm phase.
  const STEPS = [
    {
      title: 'STEP 01 · SPLIT · mid = 2',
      phase: 'split',
      detail:
        '<code>solve(1, 3)</code>：取 <code>mid = (1+3)/2 = 2</code> ⇒ ' +
        '左半 <code>[2, 1]</code>、右半 <code>[3]</code>，遞迴解兩半。',
    },
    {
      title: 'STEP 02 · LEFT · solve(1, 2) = 3',
      phase: 'left',
      detail:
        '左半 <code>[2, 1]</code> 內的 good (L, R)：<br/>' +
        '<code>(1,1)=[2] ✓</code> · <code>(2,2)=[1] ✓</code> · ' +
        '<code>(1,2)=[2,1]</code>，<code>max−min=1=R−L</code> ✓ ' +
        '<br/>左半貢獻 = <strong>3</strong>',
    },
    {
      title: 'STEP 03 · RIGHT · solve(3, 3) = 1',
      phase: 'right',
      detail:
        '右半 <code>[3]</code>：只有 <code>(3,3)=[3] ✓</code> 一個。<br/>' +
        '右半貢獻 = <strong>1</strong>',
    },
    {
      title: 'STEP 04 · CROSS · L ≤ mid < R',
      phase: 'cross',
      detail:
        '跨界 (L, R)：<code>L ∈ {1,2}</code>、<code>R = 3</code>。<br/>' +
        '<code>(L=2, R=3)</code>: <code>[1,3]</code>，max−min=2、R−L=1 ✗<br/>' +
        '<code>(L=1, R=3)</code>: <code>[2,1,3]</code>，max−min=2、R−L=2 ✓ ' +
        '<br/>跨界貢獻 = <strong>1</strong>',
    },
    {
      title: 'STEP 05 · TOTAL = 3 + 1 + 1 = 5',
      phase: 'done',
      detail:
        '左半 3 + 右半 1 + 跨界 1 = <strong>5</strong>。<br/>' +
        '<span style="color:#6b6b6b">每個 base case (size = 1) 自己 return 1，' +
        '其餘往上一層加總 — 就是分治的標準骨架。</span>',
    },
  ];

  let step = -1;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 240;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = P500_COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // Headline — top band
    ctx.fillStyle = P500_COLOR.ink;
    ctx.font = P500_FONT.head;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = step === -1
      ? 'INITIAL · solve(1, 3) on [2, 1, 3]'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 14);

    // Sub-line — separated band (gap ≥ 12 from headline)
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.sub;
    ctx.fillText('GOOD ⇔ max − min = R − L', w / 2, 38);

    // Array row (responsive)
    const sidePad = 32;
    const gap = 6;
    const cellSize = Math.min((w - sidePad * 2 - gap * (ARR.length - 1)) / ARR.length, 52);
    const totalW = cellSize * ARR.length + gap * (ARR.length - 1);
    const originX = (w - totalW) / 2;
    const originY = 84;   // 38 (sub) + 11 (sub h) + 11 (index labels) + 8 (gutter) + 16 (cell padding) ≈ 84

    // Cell states depending on phase
    const states = new Array(ARR.length).fill(undefined);
    const phase = step >= 0 ? STEPS[step].phase : null;
    if (phase === 'split') {
      states[0] = 'L'; states[1] = 'L'; states[2] = 'R';
    } else if (phase === 'left') {
      states[0] = 'L'; states[1] = 'L'; states[2] = 'dim';
    } else if (phase === 'right') {
      states[0] = 'dim'; states[1] = 'dim'; states[2] = 'R';
    } else if (phase === 'cross') {
      states[0] = 'L'; states[1] = 'L'; states[2] = 'R';
    } else if (phase === 'done') {
      states[0] = 'good'; states[1] = 'good'; states[2] = 'good';
    }
    p500DrawArray(ctx, ARR, originX, originY, cellSize, gap, states);

    // Index labels above — sit 10px above the cell top (clear of sub-line)
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let i = 0; i < ARR.length; i++) {
      ctx.fillText(String(i + 1), originX + i * (cellSize + gap) + cellSize / 2, originY - 10);
    }

    // Brackets + range info below (gap 12 from cell bottom).
    // Keep labels short so the LEFT and RIGHT brackets never overlap on
    // a narrow canvas (cross phase used long "(... picks from)" text that
    // collided — shortened to "L=1..2" / "R=3").
    const bracketY = originY + cellSize + 12;
    if (phase === 'split' || phase === 'cross') {
      p500DrawBracket(ctx, originX, cellSize, gap, 0, 1, bracketY,
                      'LEFT  L=1..2',
                      P500_COLOR.leftStrong);
      p500DrawBracket(ctx, originX, cellSize, gap, 2, 2, bracketY,
                      'RIGHT  R=3',
                      P500_COLOR.rightStrong);
    } else if (phase === 'left') {
      p500DrawBracket(ctx, originX, cellSize, gap, 0, 1, bracketY,
                      'solve(1, 2) — recurse',
                      P500_COLOR.leftStrong);
    } else if (phase === 'right') {
      p500DrawBracket(ctx, originX, cellSize, gap, 2, 2, bracketY,
                      'solve(3, 3) — recurse',
                      P500_COLOR.rightStrong);
    }

    // Running totals panel (bottom).
    // Distribute LEFT / RIGHT / CROSS evenly across the band LEFT-of the
    // TOTAL chip, instead of fixed +0/+100/+200 px which collided with the
    // right-aligned TOTAL on a narrow canvas. TOTAL gets a reserved right zone.
    const panelY = h - 38;
    ctx.font = P500_FONT.tag;
    ctx.textBaseline = 'middle';

    const leftDone = phase === 'left' || phase === 'right' || phase === 'cross' || phase === 'done';
    const rightDone = phase === 'right' || phase === 'cross' || phase === 'done';
    const crossDone = phase === 'cross' || phase === 'done';

    const totalZoneW = 96;                       // reserved for the TOTAL chip
    const bandLeft = sidePad;
    const bandRight = w - sidePad - totalZoneW;
    const slot = (bandRight - bandLeft) / 3;     // 3 counters, left-anchored in each slot
    ctx.textAlign = 'left';
    ctx.fillStyle = leftDone ? P500_COLOR.leftStrong : P500_COLOR.inactive;
    ctx.fillText(`LEFT = ${leftDone ? '3' : '?'}`, bandLeft + slot * 0, panelY);
    ctx.fillStyle = rightDone ? P500_COLOR.rightStrong : P500_COLOR.inactive;
    ctx.fillText(`RIGHT = ${rightDone ? '1' : '?'}`, bandLeft + slot * 1, panelY);
    ctx.fillStyle = crossDone ? P500_COLOR.coral : P500_COLOR.inactive;
    ctx.fillText(`CROSS = ${crossDone ? '1' : '?'}`, bandLeft + slot * 2, panelY);

    // Total chip — right-align to canvas edge so it never overlaps CROSS
    ctx.fillStyle = phase === 'done' ? P500_COLOR.coral : P500_COLOR.inkDim;
    ctx.font = P500_FONT.callout;
    ctx.textAlign = 'right';
    ctx.fillText(phase === 'done' ? 'TOTAL = 5' : 'TOTAL = ?', w - sidePad, panelY);
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · <code>solve(1, 3)</code> on <code>[2, 1, 3]</code><br/>' +
          '<span style="color:#6b6b6b">按 Play 走過分治的 5 步：SPLIT → LEFT → RIGHT → CROSS → TOTAL。</span>';
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
   ===== B · CROSS 4-CASE — D&C on [1, 3, 2, 4] =====
   The smallest permutation where all four crossing cases fire,
   exactly once each (found by brute force). Top-level solve(1,4):
     mid = 2 → left [1,3] (pos 1,2), right [2,4] (pos 3,4)
   The four crossing pairs (L ≤ mid < R), one per case:
     (1,3) [1,3,2]   max=3@L min=1@L  2=2 ✓  CASE 1 (max+min LEFT)
     (2,4) [3,2,4]   max=4@R min=2@R  2=2 ✓  CASE 2 (max+min RIGHT)
     (2,3) [3,2]     max=3@L min=2@R  1=1 ✓  CASE 3 (max LEFT, min RIGHT)
     (1,4) [1,3,2,4] max=4@R min=1@L  3=3 ✓  CASE 4 (max RIGHT, min LEFT)
   cross total = 4.
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

  const ARR = [1, 3, 2, 4];   // positions 1..4
  const MID = 2;              // index (1-based) of the split: left = 1..2, right = 3..4

  // Each step = one crossing pair = one case.
  // maxSide / minSide ∈ 'L' | 'R' tells which half the extreme comes from.
  const STEPS = [
    {
      caseNo: 1, L: 1, R: 3, maxPos: 2, minPos: 1, maxSide: 'L', minSide: 'L',
      maxV: 3, minV: 1,
      title: 'STEP 01 · CASE 1 · max + min 都在左半',
      detail:
        '跨界 <code>(L=1, R=3) = [1, 3, 2]</code>。<br/>' +
        'max = 3、min = 1 <strong>都在左半</strong>（藍）。<br/>' +
        '<code>max − min = 2 = R − L = 2</code> ✓ ⇒ good。' +
        '<span style="color:#6b6b6b"> 公式：<code>R = L + maxL − minL</code>。</span>',
    },
    {
      caseNo: 2, L: 2, R: 4, maxPos: 4, minPos: 3, maxSide: 'R', minSide: 'R',
      maxV: 4, minV: 2,
      title: 'STEP 02 · CASE 2 · max + min 都在右半',
      detail:
        '跨界 <code>(L=2, R=4) = [3, 2, 4]</code>。<br/>' +
        'max = 4、min = 2 <strong>都在右半</strong>（褐）。<br/>' +
        '<code>max − min = 2 = R − L = 2</code> ✓ ⇒ good。' +
        '<span style="color:#6b6b6b"> 公式：<code>L = R − (maxR − minR)</code>。</span>',
    },
    {
      caseNo: 3, L: 2, R: 3, maxPos: 2, minPos: 3, maxSide: 'L', minSide: 'R',
      maxV: 3, minV: 2,
      title: 'STEP 03 · CASE 3 · max 在左、min 在右',
      detail:
        '跨界 <code>(L=2, R=3) = [3, 2]</code>。<br/>' +
        'max = 3 <strong>在左</strong>（藍）、min = 2 <strong>在右</strong>（褐）。<br/>' +
        '<code>max − min = 1 = R − L = 1</code> ✓ ⇒ good。' +
        '<span style="color:#6b6b6b"> 公式：<code>L + maxL = R + minR</code>（two-pointer）。</span>',
    },
    {
      caseNo: 4, L: 1, R: 4, maxPos: 4, minPos: 1, maxSide: 'R', minSide: 'L',
      maxV: 4, minV: 1,
      title: 'STEP 04 · CASE 4 · max 在右、min 在左',
      detail:
        '跨界 <code>(L=1, R=4) = [1, 3, 2, 4]</code>。<br/>' +
        'max = 4 <strong>在右</strong>（褐）、min = 1 <strong>在左</strong>（藍）。<br/>' +
        '<code>max − min = 3 = R − L = 3</code> ✓ ⇒ good。' +
        '<span style="color:#6b6b6b"> 公式：<code>maxR − R = minL − L</code>（two-pointer）。</span>',
    },
    {
      caseNo: 0, done: true,
      title: 'STEP 05 · CROSS = 4 · 四種 case 各 1',
      detail:
        '四個跨界 good 各對應一種 case：<br/>' +
        '<code>CASE 1 (1,3)</code> · <code>CASE 2 (2,4)</code> · ' +
        '<code>CASE 3 (2,3)</code> · <code>CASE 4 (1,4)</code>。<br/>' +
        '跨界貢獻 = <strong>4</strong>（再加左半 2 + 右半 2 = 全序列共 8 個 good）。',
    },
  ];

  let step = -1;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 360;
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
      ? 'INITIAL · 跨界 4-case on [1, 3, 2, 4]'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 14);

    // Sub-line
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.sub;
    ctx.fillText('依「max / min 各來自左半還右半」分 4 種 case', w / 2, 38);

    // Array row
    const sidePad = 32;
    const gap = 8;
    const cellSize = Math.min((w - sidePad * 2 - gap * (ARR.length - 1)) / ARR.length, 56);
    const totalW = cellSize * ARR.length + gap * (ARR.length - 1);
    const originX = (w - totalW) / 2;
    const originY = 92;

    const cur = step === -1 ? null : STEPS[step];

    // Cell tints: highlight the current crossing range; color max cell / min cell
    // by which half they come from (L=blue, R=tan). Cells outside the range dimmed.
    const states = new Array(ARR.length).fill(undefined);
    if (cur && !cur.done) {
      for (let p = 1; p <= ARR.length; p++) {
        if (p < cur.L || p > cur.R) { states[p - 1] = 'dim'; }
      }
    } else if (cur && cur.done) {
      for (let i = 0; i < ARR.length; i++) states[i] = 'good';
    }
    p500DrawArray(ctx, ARR, originX, originY, cellSize, gap, states);

    // Position labels above
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let i = 0; i < ARR.length; i++) {
      ctx.fillText(String(i + 1), originX + i * (cellSize + gap) + cellSize / 2, originY - 10);
    }

    // mid divider — coral dashed, between position 2 and 3
    const midX = originX + MID * (cellSize + gap) - gap / 2;
    ctx.strokeStyle = P500_COLOR.coral;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, originY - 6);
    ctx.lineTo(midX, originY + cellSize + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = P500_COLOR.coral;
    ctx.font = P500_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('mid', midX, originY - 22);

    // Half labels under the array (always shown): LEFT / RIGHT
    const halfY = originY + cellSize + 10;
    p500DrawBracket(ctx, originX, cellSize, gap, 0, MID - 1, halfY, 'LEFT 左半', P500_COLOR.leftStrong);
    p500DrawBracket(ctx, originX, cellSize, gap, MID, ARR.length - 1, halfY, 'RIGHT 右半', P500_COLOR.rightStrong);

    if (cur && !cur.done) {
      // Outline the current crossing range [L, R] with a coral rectangle
      const rx = originX + (cur.L - 1) * (cellSize + gap) - 3;
      const rw = (cur.R - cur.L) * (cellSize + gap) + cellSize + 6;
      ctx.strokeStyle = P500_COLOR.coral;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(rx, originY - 3, rw, cellSize + 6);

      // Tag the max cell and min cell with side-colored dots + "max"/"min"
      drawExtremeTag(ctx, originX, originY, cellSize, gap, cur.maxPos, 'max', cur.maxSide, -1);
      drawExtremeTag(ctx, originX, originY, cellSize, gap, cur.minPos, 'min', cur.minSide, +1);
    }

    // Case-classification 2x2 mini-grid + equation panel (lower half).
    // Anchor to a fixed left position (not originX, which is centered and
    // drifts right on narrow canvases — the equation text would overflow).
    const panelX = sidePad + 56;   // 56px gutter for the "max 在左/右" row labels
    drawCasePanel(ctx, w, h, panelX, cur);

    // Running CROSS counter (bottom-right)
    const panelY = h - 28;
    const crossVal = cur ? (cur.done ? 4 : cur.caseNo) : 0;
    ctx.font = P500_FONT.callout;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = (cur && cur.done) ? P500_COLOR.coral : P500_COLOR.inkDim;
    ctx.fillText(cur ? `CROSS = ${crossVal}${cur.done ? '' : ' / 4'}` : 'CROSS = 0 / 4',
                 w - sidePad, panelY);
  }

  // Draw a "max"/"min" tag above (dir=-1) or below (dir=+1) a cell,
  // colored by side (L=blue, R=tan).
  function drawExtremeTag(ctx, originX, originY, cellSize, gap, pos, text, side, dir) {
    const cx = originX + (pos - 1) * (cellSize + gap) + cellSize / 2;
    const color = side === 'L' ? P500_COLOR.leftStrong : P500_COLOR.rightStrong;
    ctx.fillStyle = color;
    ctx.font = P500_FONT.tag;
    ctx.textAlign = 'center';
    if (dir < 0) {
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, cx, originY - 30);
    } else {
      ctx.textBaseline = 'top';
      ctx.fillText(text, cx, originY + cellSize + 30);
    }
  }

  // 2x2 case grid showing which (maxSide, minSide) the current step is,
  // plus the good equation worked out.
  function drawCasePanel(ctx, w, h, originX, cur) {
    const gx = originX;
    const gy = h - 150;
    const cellW = 86, cellH = 30;

    // grid header row/col labels
    ctx.font = P500_FONT.tagSm;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.fillText('min 在左', gx + cellW * 0.5, gy - 12);
    ctx.fillText('min 在右', gx + cellW * 1.5, gy - 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = P500_COLOR.leftStrong;
    ctx.fillText('max 在左', gx - 8, gy + cellH * 0.5);
    ctx.fillStyle = P500_COLOR.rightStrong;
    ctx.fillText('max 在右', gx - 8, gy + cellH * 1.5);

    // 2x2 cells:  [max L,min L]=C1  [max L,min R]=C3
    //             [max R,min L]=C4  [max R,min R]=C2
    const grid = [
      [{ n: 1, mx: 'L', mn: 'L' }, { n: 3, mx: 'L', mn: 'R' }],
      [{ n: 4, mx: 'R', mn: 'L' }, { n: 2, mx: 'R', mn: 'R' }],
    ];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const x = gx + c * cellW;
        const y = gy + r * cellH;
        const g = grid[r][c];
        const active = cur && !cur.done && cur.caseNo === g.n;
        ctx.fillStyle = active ? P500_COLOR.coral
                      : (cur && cur.done) ? P500_COLOR.goodFill : P500_COLOR.cellBg;
        ctx.fillRect(x, y, cellW - 4, cellH - 4);
        ctx.strokeStyle = active ? P500_COLOR.coral
                        : (cur && cur.done) ? P500_COLOR.goodStroke : P500_COLOR.cellBorder;
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellW - 4 - 1, cellH - 4 - 1);
        ctx.fillStyle = active ? '#fff' : P500_COLOR.ink;
        ctx.font = P500_FONT.tag;
        ctx.fillText(`CASE ${g.n}`, x + (cellW - 4) / 2, y + (cellH - 4) / 2);
      }
    }

    // Equation worked out to the right of the grid
    if (cur && !cur.done) {
      const ex = gx + cellW * 2 + 24;
      const ey = gy + cellH;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = P500_FONT.callout;
      ctx.fillStyle = P500_COLOR.ink;
      ctx.fillText(`max − min = ${cur.maxV} − ${cur.minV} = ${cur.maxV - cur.minV}`, ex, ey - 12);
      ctx.fillStyle = P500_COLOR.coral;
      ctx.fillText(`R − L = ${cur.R} − ${cur.L} = ${cur.R - cur.L}  ⇒ good ✓`, ex, ey + 12);
    } else if (cur && cur.done) {
      const ex = gx + cellW * 2 + 24;
      const ey = gy + cellH;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = P500_FONT.callout;
      ctx.fillStyle = P500_COLOR.goodStroke;
      ctx.fillText('四格全亮 ⇒ 四種 case 各命中一次', ex, ey);
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
          '<strong>INITIAL</strong> · 跨界計數 on <code>[1, 3, 2, 4]</code>，<code>mid = 2</code>。<br/>' +
          '<span style="color:#6b6b6b">這是最小的「四種 case 各發生一次」範例。按 Play 一步一個 case。</span>';
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
    }, 2000);
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
