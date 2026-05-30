/* ============================================================
   P117 糟糕陣列 — XOR 1-因子分解構造
   Single canvas (viz-canvas):
     N = 4 construction by complement-pair color, then verify
     the cross of index 0 collects {1..7}.

   Formula (0-indexed):
     i == j → N            (= 4, diagonal centre, gray)
     i  < j → i ^ j        (smaller half of complement pair)
     i  > j → 2N - (i ^ j) (larger half, pair sums to 2N = 8)

   Final A(4):
     4 1 2 3
     7 4 3 2
     6 5 4 1
     5 6 7 4
   ============================================================ */

const P117_COLOR = {
  paper:      '#faf5e6',
  cellEmpty:  '#ffffff',
  cellBorder: '#1a1a1a',
  cellText:   '#1a1a1a',
  diagTint:   '#cfcfcf',   // gray       — diagonal centre = N
  diagStroke: '#9a9590',
  pair1Tint:  '#e3edf5',   // pale blue  — complement pair {1,7}
  pair1Stroke:'#8fb3d4',
  pair2Tint:  '#f6ead8',   // pale tan   — complement pair {2,6}
  pair2Stroke:'#d4a868',
  pair3Tint:  '#d9e8c7',   // pale green — complement pair {3,5}
  pair3Stroke:'#5fa866',
  crossTint:  '#fbe2d7',   // pale coral — index-0 cross overlay
  coral:      '#d96e4e',
  ink:        '#1a1a1a',
  inkDim:     '#6b6b6b',
  chipGood:   '#d9e8c7',
  chipGoodStr:'#5fa866',
};

const P117_FONT = {
  head:    '700 13px "JetBrains Mono", monospace',
  sub:     '500 11px "JetBrains Mono", monospace',
  cellLg:  '700 18px "JetBrains Mono", monospace',
  cellMd:  '700 14px "JetBrains Mono", monospace',
  tag:     '700 11px "JetBrains Mono", monospace',
  tagSm:   '700 9px "JetBrains Mono", monospace',
  callout: '700 12px "JetBrains Mono", monospace',
};

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stepEl   = document.getElementById('viz-step');
  const labelEl  = document.getElementById('viz-label');
  const btnPrev  = document.getElementById('viz-prev');
  const btnNext  = document.getElementById('viz-next');
  const btnPlay  = document.getElementById('viz-play');
  const btnReset = document.getElementById('viz-reset');

  const N = 4;               // demo size
  const TWO_N = 2 * N;       // 8

  // value(i, j) per the formula
  function valAt(i, j) {
    if (i === j) return N;
    if (i < j)   return i ^ j;
    return TWO_N - (i ^ j);
  }
  // which complement pair {k, 2N-k} a cell belongs to (k = i^j); 0 for diagonal
  function pairOf(i, j) { return (i === j) ? 0 : (i ^ j); }

  // Build full matrix once.
  const FULL = [];
  for (let i = 0; i < N; i++) {
    FULL.push([]);
    for (let j = 0; j < N; j++) FULL[i].push(valAt(i, j));
  }

  // tint for a complement-pair index (k = i^j) — N=4 ⇒ k ∈ {1,2,3}
  function pairTint(k) {
    if (k === 1) return [P117_COLOR.pair1Tint, P117_COLOR.pair1Stroke];
    if (k === 2) return [P117_COLOR.pair2Tint, P117_COLOR.pair2Stroke];
    return [P117_COLOR.pair3Tint, P117_COLOR.pair3Stroke];
  }

  // A step is defined by which cells are "revealed".
  // reveal[i][j] = true once that cell has been filled by the current step.
  // Steps:
  //   0  diagonal (all N)
  //   1  pair k=1 cells
  //   2  pair k=2 cells
  //   3  pair k=3 cells
  //   4  highlight cross of index 0 (collect values)
  //   5  done — all four crosses verified
  const STEPS = [
    {
      title: 'STEP 01 · 對角線中心 ← N = 4',
      detail:
        '所有對角格 <code>(i, i)</code> 同屬 row i 與 col i，填同一個常數 <code>N = 4</code>（灰色）。<br/>' +
        '<span style="color:#6b6b6b">剩下 8 格要分給 3 組「和為 8」的互補對。</span>',
      revealPairs: [],           // only diagonal
    },
    {
      title: 'STEP 02 · 互補對 1 ← {1, 7}',
      detail:
        '所有 <code>i ^ j = 1</code> 的格子（藍）。<code>i&lt;j</code> 填 <code>1</code>、<code>i&gt;j</code> 填 <code>8−1 = 7</code>。<br/>' +
        '<span style="color:#6b6b6b">兩半永遠分居對角線兩側，相加 = 8。</span>',
      revealPairs: [1],
    },
    {
      title: 'STEP 03 · 互補對 2 ← {2, 6}',
      detail:
        '所有 <code>i ^ j = 2</code> 的格子（褐）。<code>i&lt;j</code> 填 <code>2</code>、<code>i&gt;j</code> 填 <code>8−2 = 6</code>。',
      revealPairs: [1, 2],
    },
    {
      title: 'STEP 04 · 互補對 3 ← {3, 5}',
      detail:
        '所有 <code>i ^ j = 3</code> 的格子（綠）。<code>i&lt;j</code> 填 <code>3</code>、<code>i&gt;j</code> 填 <code>8−3 = 5</code>。<br/>' +
        '<span style="color:#6b6b6b">A(4) 填滿。每色都是一個完美配對 = 1-因子分解。</span>',
      revealPairs: [1, 2, 3],
    },
    {
      title: 'STEP 05 · index 0 的十字 (紅框)',
      detail:
        '紅框圈出 row 0 與 col 0。它收集到 <code>row 0 = {4,1,2,3}</code> 加 <code>col 0 = {4,7,6,5}</code>。<br/>' +
        '<span style="color:#6b6b6b">對角的 4 是兩條線的共用中心，只算一次。</span>',
      revealPairs: [1, 2, 3],
      highlightRC: { row: 0, col: 0 },
    },
    {
      title: 'STEP 06 · DONE · 每個十字都 = {1..7} ✓',
      detail:
        'index 0 的十字 = <strong>{1, 2, 3, 4, 5, 6, 7}</strong> ✓（= {1..2N−1}）。<br/>' +
        '其餘三個 index 的十字同理，每組互補對各被碰一次。',
      revealPairs: [1, 2, 3],
      highlightRC: { row: 0, col: 0 },
      verifyAll: true,
    },
  ];

  // For a given step, is cell (i,j) revealed?
  function isRevealed(s, i, j) {
    if (i === j) return true;          // diagonal revealed from step 0
    return s.revealPairs.indexOf(i ^ j) !== -1;
  }

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

  function drawCell(x, y, sz, value, tint, stroke, dim) {
    ctx.fillStyle = tint || P117_COLOR.cellEmpty;
    ctx.fillRect(x, y, sz, sz);
    ctx.strokeStyle = stroke || P117_COLOR.cellBorder;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 0.5, y + 0.5, sz - 1, sz - 1);
    if (value !== null && value !== undefined) {
      ctx.fillStyle = dim ? P117_COLOR.inkDim : P117_COLOR.cellText;
      ctx.font = sz >= 42 ? P117_FONT.cellLg : P117_FONT.cellMd;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value), x + sz / 2, y + sz / 2);
    }
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
      ? 'INITIAL · build A(4) by color = i ^ j'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 14);

    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.font = P117_FONT.sub;
    ctx.fillText('N = 4 · 2N = 8 · 對角 = N · 互補對和 = 2N', w / 2, 38);

    // Matrix layout
    const matAreaTop = 72;
    const matAreaBot = h - 84;
    const matAreaH = matAreaBot - matAreaTop;
    const sidePad = 16;
    const maxCellByW = (w - sidePad * 2 - 230) / N;   // 230px for legend
    const maxCellByH = matAreaH / N;
    const cellSize = Math.max(30, Math.min(maxCellByW, maxCellByH, 60));
    const totalW = cellSize * N;
    const totalH = cellSize * N;
    const originX = (w - totalW) / 2 + 75;
    const originY = matAreaTop + (matAreaH - totalH) / 2;

    const cur = step === -1 ? null : STEPS[step];

    // index labels
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.font = P117_FONT.tagSm;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let c = 0; c < N; c++) {
      ctx.fillText(`c${c}`, originX + c * cellSize + cellSize / 2, originY - 4);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < N; r++) {
      ctx.fillText(`r${r}`, originX - 6, originY + r * cellSize + cellSize / 2);
    }

    // cells
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = originX + j * cellSize;
        const y = originY + i * cellSize;
        const revealed = cur ? isRevealed(cur, i, j) : false;
        if (!revealed) {
          drawCell(x, y, cellSize, null, P117_COLOR.cellEmpty, P117_COLOR.cellBorder);
          continue;
        }
        if (i === j) {
          drawCell(x, y, cellSize, FULL[i][j], P117_COLOR.diagTint, P117_COLOR.diagStroke);
        } else {
          const [tint, stroke] = pairTint(i ^ j);
          drawCell(x, y, cellSize, FULL[i][j], tint, stroke);
        }
      }
    }

    // cross highlight (coral border around row 0 + col 0)
    if (cur && cur.highlightRC) {
      const { row, col } = cur.highlightRC;
      ctx.save();
      ctx.strokeStyle = P117_COLOR.coral;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(originX + 0.5, originY + row * cellSize + 0.5,
                     totalW - 1, cellSize - 1);
      ctx.strokeRect(originX + col * cellSize + 0.5, originY + 0.5,
                     cellSize - 1, totalH - 1);
      ctx.restore();
    }

    // Legend on the left
    const legendX = 16;
    const legendY = matAreaTop + 4;
    const legendRowH = 16;
    const items = [
      ['對角', P117_COLOR.diagTint,  P117_COLOR.diagStroke,  '= N = 4'],
      ['對 1', P117_COLOR.pair1Tint, P117_COLOR.pair1Stroke, '{1, 7}'],
      ['對 2', P117_COLOR.pair2Tint, P117_COLOR.pair2Stroke, '{2, 6}'],
      ['對 3', P117_COLOR.pair3Tint, P117_COLOR.pair3Stroke, '{3, 5}'],
      ['十字', P117_COLOR.crossTint, P117_COLOR.coral,       'index 0'],
    ];
    ctx.font = P117_FONT.tagSm;
    ctx.textBaseline = 'middle';
    for (let i = 0; i < items.length; i++) {
      const y = legendY + i * legendRowH;
      ctx.fillStyle = items[i][1];
      ctx.fillRect(legendX, y - 5, 10, 10);
      ctx.strokeStyle = items[i][2];
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX + 0.5, y - 5 + 0.5, 9, 9);
      ctx.fillStyle = P117_COLOR.ink;
      ctx.textAlign = 'left';
      ctx.fillText(items[i][0], legendX + 16, y);
      ctx.fillStyle = P117_COLOR.inkDim;
      ctx.fillText(items[i][3], legendX + 48, y);
    }

    // Bottom: cross-of-index-0 collected set
    drawCrossPanel(w, h, cur, originX, originY, cellSize);
  }

  function drawCrossPanel(w, h, cur, originX, originY, cellSize) {
    const chipY = h - 52;

    // Collect row0 ∪ col0 from revealed cells
    const set = new Set();
    let showCross = cur && cur.highlightRC;
    if (showCross) {
      for (let c = 0; c < N; c++) if (isRevealed(cur, 0, c)) set.add(FULL[0][c]);
      for (let r = 0; r < N; r++) if (isRevealed(cur, r, 0)) set.add(FULL[r][0]);
    }
    const sorted = Array.from(set).sort((a, b) => a - b);
    const complete = sorted.length === TWO_N - 1;
    const display = sorted.length === 0 ? '（按到 STEP 5 顯示）'
                  : '{' + sorted.join(',') + '}';

    ctx.font = P117_FONT.tag;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.fillText('row 0 ∪ col 0 =', 18, chipY);

    // chip
    const chipX = 150;
    const chipBg = complete ? P117_COLOR.chipGood : P117_COLOR.cellEmpty;
    const chipStroke = complete ? P117_COLOR.chipGoodStr : P117_COLOR.ink;
    const chipW = Math.max(120, ctx.measureText(display).width + 18);
    ctx.fillStyle = chipBg;
    ctx.fillRect(chipX, chipY - 11, chipW, 22);
    ctx.strokeStyle = chipStroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(chipX + 0.5, chipY - 11 + 0.5, chipW - 1, 21);
    ctx.fillStyle = complete ? P117_COLOR.chipGoodStr : P117_COLOR.ink;
    ctx.textAlign = 'center';
    ctx.fillText(display, chipX + chipW / 2, chipY);

    // target / tick
    ctx.textAlign = 'left';
    ctx.fillStyle = P117_COLOR.inkDim;
    ctx.font = P117_FONT.tagSm;
    ctx.fillText('target = {1..7}', chipX + chipW + 14, chipY);

    if (complete) {
      ctx.fillStyle = P117_COLOR.chipGoodStr;
      ctx.font = P117_FONT.callout;
      ctx.textAlign = 'right';
      ctx.fillText('✓ match', w - 18, chipY);
    } else if (showCross) {
      ctx.fillStyle = P117_COLOR.inkDim;
      ctx.font = P117_FONT.tagSm;
      ctx.textAlign = 'right';
      ctx.fillText(`size = ${sorted.length} / 7`, w - 18, chipY);
    }

    // verify-all banner on final step
    if (cur && cur.verifyAll) {
      ctx.fillStyle = P117_COLOR.chipGoodStr;
      ctx.font = P117_FONT.callout;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('每個 index 的十字都 = {1..7} ✓', 18, h - 24);
    } else {
      // hint line
      ctx.fillStyle = P117_COLOR.inkDim;
      ctx.font = P117_FONT.tagSm;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('a[i][j] + a[j][i] = 2N = 8（互補對不變量）', 18, h - 24);
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
          '<strong>INITIAL</strong> · 4 × 4 空格，準備用 <code>color = i ^ j</code> 填滿。<br/>' +
          '<span style="color:#6b6b6b">按 Play 走過 6 步：對角 → 互補對 1/2/3 → 圈十字 → 驗證。</span>';
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
