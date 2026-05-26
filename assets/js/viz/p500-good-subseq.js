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
      ? 'INITIAL · solve(1, 3) on [2, 1, 3]'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 10);

    // Sub-line
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.sub;
    ctx.fillText('GOOD ⇔ max − min = R − L', w / 2, 28);

    // Array row (responsive)
    const sidePad = 32;
    const gap = 6;
    const cellSize = Math.min((w - sidePad * 2 - gap * (ARR.length - 1)) / ARR.length, 56);
    const totalW = cellSize * ARR.length + gap * (ARR.length - 1);
    const originX = (w - totalW) / 2;
    const originY = 60;

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

    // Index labels above
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let i = 0; i < ARR.length; i++) {
      ctx.fillText(String(i + 1), originX + i * (cellSize + gap) + cellSize / 2, originY - 4);
    }

    // Brackets + range info below
    const bracketY = originY + cellSize + 6;
    if (phase === 'split' || phase === 'cross') {
      p500DrawBracket(ctx, originX, cellSize, gap, 0, 1, bracketY,
                      phase === 'split' ? 'LEFT  L=1..2' : 'LEFT (L picks from)',
                      P500_COLOR.leftStrong);
      p500DrawBracket(ctx, originX, cellSize, gap, 2, 2, bracketY,
                      phase === 'split' ? 'RIGHT  R=3..3' : 'RIGHT (R picks from)',
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

    // Running totals panel (bottom)
    const panelY = h - 38;
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.tag;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Left contrib
    const leftDone = phase === 'left' || phase === 'right' || phase === 'cross' || phase === 'done';
    const rightDone = phase === 'right' || phase === 'cross' || phase === 'done';
    const crossDone = phase === 'cross' || phase === 'done';

    ctx.fillStyle = leftDone ? P500_COLOR.leftStrong : P500_COLOR.inactive;
    ctx.fillText(`LEFT  = ${leftDone ? '3' : '?'}`, originX, panelY);
    ctx.fillStyle = rightDone ? P500_COLOR.rightStrong : P500_COLOR.inactive;
    ctx.fillText(`RIGHT = ${rightDone ? '1' : '?'}`, originX + 100, panelY);
    ctx.fillStyle = crossDone ? P500_COLOR.coral : P500_COLOR.inactive;
    ctx.fillText(`CROSS = ${crossDone ? '1' : '?'}`, originX + 200, panelY);

    // Total chip
    ctx.fillStyle = phase === 'done' ? P500_COLOR.coral : P500_COLOR.inkDim;
    ctx.font = P500_FONT.callout;
    ctx.textAlign = 'right';
    ctx.fillText(phase === 'done' ? 'TOTAL = 5' : 'TOTAL = ?', originX + totalW, panelY);
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
   ===== B · GENERAL CASE — D&C on [5, 1, 2, 4, 3] =====
   Walk solve(1, 5):
     STEP 1: SPLIT mid=3 → left [5,1,2], right [4,3]
     STEP 2: LEFT  solve(1,3) = 4   (3 singletons + (2,3)=[1,2])
     STEP 3: RIGHT solve(4,5) = 3   (2 singletons + (4,5)=[4,3])
     STEP 4: CROSS — extend maxL/minL leftward from mid, maxR/minR rightward
     STEP 5: CROSS — check 4 cases, find good crossings
     STEP 6: TOTAL = 4 + 3 + 3 = 10
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
  // Indices 0..4 correspond to positions 1..5.
  // mid index in code = (0+4)/2 = 2 (which is position 3, value 2).
  // So mid = 2 (0-indexed) = position 3, value 2.
  // Left = positions 1..3 = indices 0..2 = [5,1,2]
  // Right = positions 4..5 = indices 3..4 = [4,3]

  // Precomputed max/min extending from mid for the CROSS step visualization.
  // Left side (from mid index 2 leftward): maxL/minL of a[L..mid]
  //   L=2: a[2..2] = [2]      maxL=2, minL=2
  //   L=1: a[1..2] = [1,2]    maxL=2, minL=1
  //   L=0: a[0..2] = [5,1,2]  maxL=5, minL=1
  // Right side (from mid+1 index 3 rightward): maxR/minR of a[mid+1..R]
  //   R=3: a[3..3] = [4]      maxR=4, minR=4
  //   R=4: a[3..4] = [4,3]    maxR=4, minR=3
  const maxL = [5, 2, 2];   // indexed by L (0,1,2)
  const minL = [1, 1, 2];
  const maxR = [4, 4];      // indexed by R-3 (0=R=3, 1=R=4)
  const minR = [4, 3];

  // Good crossing pairs:
  //   (L=0, R=4): [5,1,2,4,3]  max-min = 5-1 = 4, R-L = 4 ✓
  //   (L=1, R=4): [1,2,4,3]    max-min = 4-1 = 3, R-L = 3 ✓
  //   (L=2, R=4): [2,4,3]      max-min = 4-2 = 2, R-L = 2 ✓
  // Total cross = 3.

  const STEPS = [
    { phase: 'split',
      title: 'STEP 01 · SPLIT · mid = 3',
      detail:
        '<code>solve(1, 5)</code> 取 <code>mid = 3</code>：<br/>' +
        '左半 = <code>a[1..3] = [5, 1, 2]</code>，右半 = <code>a[4..5] = [4, 3]</code>。',
    },
    { phase: 'left',
      title: 'STEP 02 · LEFT · solve(1, 3) = 4',
      detail:
        '遞迴左半，回傳 <strong>4</strong>：<br/>' +
        '<code>(1,1)=[5] · (2,2)=[1] · (3,3)=[2]</code> 三個 singleton，' +
        '加 <code>(2,3)=[1,2]</code>（max−min=1=R−L ✓）= 4 個 good。',
    },
    { phase: 'right',
      title: 'STEP 03 · RIGHT · solve(4, 5) = 3',
      detail:
        '遞迴右半，回傳 <strong>3</strong>：<br/>' +
        '<code>(4,4)=[4] · (5,5)=[3]</code> 兩個 singleton，' +
        '加 <code>(4,5)=[4,3]</code>（max−min=1=R−L ✓）= 3 個 good。',
    },
    { phase: 'cross-prep',
      title: 'STEP 04 · CROSS · 算 maxL/minL · maxR/minR',
      detail:
        '從 <code>mid</code> 往兩邊滑，逐步更新 <code>maxL[L]、minL[L]</code>' +
        '（左半延伸）與 <code>maxR[R]、minR[R]</code>（右半延伸）。<br/>' +
        '<span style="color:#6b6b6b">這是 O(N) 預備，4 種 case 都會用到。</span>',
    },
    { phase: 'cross-check',
      title: 'STEP 05 · CROSS · 4 case 計數',
      detail:
        '對每個跨界 (L, R)，依 max/min 來自哪半分 4 case：<br/>' +
        '<code>(L=3, R=4)=[2,4]</code> max=4 min=2, R−L=1 ≠ 2 ✗<br/>' +
        '<code>(L=3, R=5)=[2,4,3]</code> max=4 min=2, R−L=2 ✓<br/>' +
        '<code>(L=2, R=5)=[1,2,4,3]</code> max=4 min=1, R−L=3 ✓<br/>' +
        '<code>(L=1, R=5)=[5,1,2,4,3]</code> max=5 min=1, R−L=4 ✓<br/>' +
        '跨界貢獻 = <strong>3</strong>',
    },
    { phase: 'done',
      title: 'STEP 06 · TOTAL = 4 + 3 + 3 = 10',
      detail:
        '左半 4 + 右半 3 + 跨界 3 = <strong>10</strong>。<br/>' +
        '<span style="color:#6b6b6b">遞迴完整展開：所有 size = 1 的 base case + ' +
        '每一層分治的跨界貢獻 — O(N log N) 總和。</span>',
    },
  ];

  let step = -1;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 300;
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
      ? 'INITIAL · solve(1, 5) on [5, 1, 2, 4, 3]'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 10);

    // Sub-line
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.sub;
    ctx.fillText('count(lo, hi) = count(lo, mid) + count(mid+1, hi) + count_crossing(...)', w / 2, 28);

    // Array row (centered, responsive)
    const sidePad = 32;
    const gap = 8;
    const cellSize = Math.min((w - sidePad * 2 - gap * (ARR.length - 1)) / ARR.length, 64);
    const totalW = cellSize * ARR.length + gap * (ARR.length - 1);
    const originX = (w - totalW) / 2;
    const originY = 60;

    const phase = step >= 0 ? STEPS[step].phase : null;

    // Cell tints
    const states = new Array(ARR.length).fill(undefined);
    if (phase === 'split' || phase === 'cross-prep' || phase === 'cross-check') {
      states[0] = 'L'; states[1] = 'L'; states[2] = 'L';
      states[3] = 'R'; states[4] = 'R';
    } else if (phase === 'left') {
      states[0] = 'L'; states[1] = 'L'; states[2] = 'L';
      states[3] = 'dim'; states[4] = 'dim';
    } else if (phase === 'right') {
      states[0] = 'dim'; states[1] = 'dim'; states[2] = 'dim';
      states[3] = 'R'; states[4] = 'R';
    } else if (phase === 'done') {
      for (let i = 0; i < ARR.length; i++) states[i] = 'good';
    }
    p500DrawArray(ctx, ARR, originX, originY, cellSize, gap, states);

    // Position labels above
    ctx.fillStyle = P500_COLOR.inkDim;
    ctx.font = P500_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let i = 0; i < ARR.length; i++) {
      ctx.fillText(String(i + 1), originX + i * (cellSize + gap) + cellSize / 2, originY - 4);
    }

    // Mid marker line
    if (phase && phase !== 'done') {
      const midX = originX + 3 * (cellSize + gap) - gap / 2;
      ctx.strokeStyle = P500_COLOR.coral;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(midX, originY - 14);
      ctx.lineTo(midX, originY + cellSize + 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = P500_COLOR.coral;
      ctx.font = P500_FONT.tagSm;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('mid = 3', midX, originY - 16);
    }

    // Brackets below array
    const bracketY = originY + cellSize + 8;
    if (phase === 'split' || phase === 'cross-prep' || phase === 'cross-check') {
      p500DrawBracket(ctx, originX, cellSize, gap, 0, 2, bracketY,
                      'LEFT  [1, 3]',  P500_COLOR.leftStrong);
      p500DrawBracket(ctx, originX, cellSize, gap, 3, 4, bracketY,
                      'RIGHT [4, 5]', P500_COLOR.rightStrong);
    } else if (phase === 'left') {
      p500DrawBracket(ctx, originX, cellSize, gap, 0, 2, bracketY,
                      'solve(1, 3) → 4', P500_COLOR.leftStrong);
    } else if (phase === 'right') {
      p500DrawBracket(ctx, originX, cellSize, gap, 3, 4, bracketY,
                      'solve(4, 5) → 3', P500_COLOR.rightStrong);
    }

    // Max/min table — only when in cross phases
    if (phase === 'cross-prep' || phase === 'cross-check') {
      const tableY = bracketY + 32;
      drawMaxMinTable(ctx, w, tableY, originX, cellSize, gap, phase === 'cross-check');
    }

    // Running totals panel (bottom)
    const panelY = h - 36;
    const leftDone  = ['left','right','cross-prep','cross-check','done'].includes(phase);
    const rightDone = ['right','cross-prep','cross-check','done'].includes(phase);
    const crossDone = ['cross-check','done'].includes(phase);

    ctx.font = P500_FONT.tag;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = leftDone ? P500_COLOR.leftStrong : P500_COLOR.inactive;
    ctx.fillText(`LEFT  = ${leftDone ? '4' : '?'}`, originX, panelY);
    ctx.fillStyle = rightDone ? P500_COLOR.rightStrong : P500_COLOR.inactive;
    ctx.fillText(`RIGHT = ${rightDone ? '3' : '?'}`, originX + 110, panelY);
    ctx.fillStyle = crossDone ? P500_COLOR.coral : P500_COLOR.inactive;
    ctx.fillText(`CROSS = ${crossDone ? '3' : '?'}`, originX + 220, panelY);

    ctx.fillStyle = phase === 'done' ? P500_COLOR.coral : P500_COLOR.inkDim;
    ctx.font = P500_FONT.callout;
    ctx.textAlign = 'right';
    ctx.fillText(phase === 'done' ? 'TOTAL = 10' : 'TOTAL = ?', originX + totalW, panelY);
  }

  function drawMaxMinTable(ctx, w, y, originX, cellSize, gap, highlightGoods) {
    // Layout: a small grid showing maxL/minL for L=1..3 and maxR/minR for R=4..5
    // Use the array columns as anchors so the table aligns under the array.
    const labelX = originX - 18;
    const rowGap = 12;

    ctx.font = P500_FONT.tagSm;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Row 1: maxL
    ctx.fillStyle = P500_COLOR.leftStrong;
    ctx.fillText('maxL', labelX, y);
    ctx.fillText('minL', labelX, y + rowGap);
    ctx.fillStyle = P500_COLOR.rightStrong;
    ctx.fillText('maxR', labelX, y + rowGap * 2);
    ctx.fillText('minR', labelX, y + rowGap * 3);

    // Values per column
    const cellCenterX = (i) => originX + i * (cellSize + gap) + cellSize / 2;
    ctx.textAlign = 'center';

    // L side (indices 0,1,2)
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = P500_COLOR.leftStrong;
      ctx.fillText(String(maxL[i]), cellCenterX(i), y);
      ctx.fillText(String(minL[i]), cellCenterX(i), y + rowGap);
    }
    // R side (indices 3,4 ⇒ R=3,4 in 0-indexed = positions 4,5)
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = P500_COLOR.rightStrong;
      ctx.fillText(String(maxR[j]), cellCenterX(j + 3), y + rowGap * 2);
      ctx.fillText(String(minR[j]), cellCenterX(j + 3), y + rowGap * 3);
    }

    if (highlightGoods) {
      // Below: show the 3 good crossings as chips
      const blockW = cellSize * ARR.length + gap * (ARR.length - 1);
      const chipY = y + rowGap * 4 + 6;
      ctx.font = P500_FONT.tagSm;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const chips = [
        { text: '(3, 5)  +1', x: originX + blockW * 0.22 },
        { text: '(2, 5)  +1', x: originX + blockW * 0.50 },
        { text: '(1, 5)  +1', x: originX + blockW * 0.78 },
      ];
      for (const c of chips) {
        ctx.fillStyle = P500_COLOR.goodFill;
        ctx.fillRect(c.x - 32, chipY - 2, 64, 16);
        ctx.strokeStyle = P500_COLOR.goodStroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(c.x - 32 + 0.5, chipY - 2 + 0.5, 64 - 1, 16 - 1);
        ctx.fillStyle = P500_COLOR.ink;
        ctx.fillText(c.text, c.x, chipY);
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
          '<strong>INITIAL</strong> · <code>solve(1, 5)</code> on <code>[5, 1, 2, 4, 3]</code><br/>' +
          '<span style="color:#6b6b6b">按 Play 走過 6 步分治：SPLIT → LEFT → RIGHT → CROSS (準備) → CROSS (計數) → TOTAL。</span>';
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
