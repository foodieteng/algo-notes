/* ============================================================
   P501 好的序列 — 奇偶切構造法
   範例 N = 8 ⇒ f(8) = [1, 5, 3, 7, 2, 6, 4, 8]
   ============================================================ */

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

  const COLOR = {
    paper:      '#faf5e6',
    cellEmpty:  '#ffffff',
    cellFilled: '#ffffff',
    cellBorder: '#1a1a1a',
    cellText:   '#1a1a1a',
    leftTint:   '#ecf0f5',   // very pale blue – odd-value half
    rightTint:  '#f3eee6',   // very pale tan – even-value half
    coral:      '#d96e4e',
    coralTint:  '#fbe8e0',
    ink:        '#1a1a1a',
    inkDim:     '#6b6b6b',
    insetBg:    '#ffffff',
    insetBorder:'#1a1a1a',
    odd:        '#1a1a1a',
    even:       '#1a1a1a',
  };

  const N = 8;
  const F4   = [1, 3, 2, 4];                       // f(4)
  const ODD  = F4.map((v) => 2 * v - 1);           // [1, 5, 3, 7]
  const EVEN = F4.map((v) => 2 * v);               // [2, 6, 4, 8]
  const FINAL = ODD.concat(EVEN);                  // [1, 5, 3, 7, 2, 6, 4, 8]

  // step = -1 → initial empty
  // step = 0  → split 8 = 4 + 4, colour halves
  // step = 1  → reveal f(4) inset
  // step = 2  → odd map: fill left 4 with 2x − 1
  // step = 3  → even map: fill right 4 with 2x
  // step = 4  → final answer, fade inset

  const STEPS = [
    {
      title: 'STEP 01 · SPLIT N = 4 + 4',
      detail:
        '把 8 個位置切兩半：<br/>' +
        '<strong>左半 4 格</strong>放 <em>奇數值</em>（1, 3, 5, 7）<br/>' +
        '<strong>右半 4 格</strong>放 <em>偶數值</em>（2, 4, 6, 8）<br/>' +
        '<span style="color:#6b6b6b">⇒ 任何 3-AP 的中位數 b 滿足 a + c = 2b 是偶數，</span><br/>' +
        '<span style="color:#6b6b6b">若 a 在左半（奇）、c 在右半（偶），a + c 是奇 ≠ 偶數 2b，3-AP 不成立。</span>',
    },
    {
      title: 'STEP 02 · RECURSE f(4) = [1, 3, 2, 4]',
      detail:
        '小子問題 <code>f(4)</code> 已知答案 = <strong>[1, 3, 2, 4]</strong>（同樣是奇偶切遞迴下去得到）。<br/>' +
        '兩邊都會「複製」這個 pattern — 一邊乘 2 變偶，一邊乘 2 減 1 變奇。',
    },
    {
      title: 'STEP 03 · ODD MAP · 左半 = 2 · f(4) − 1',
      detail:
        '取 <code>f(4)</code> 每個值套 <code>2x − 1</code>：<br/>' +
        '<code>2·1−1 = 1</code> · <code>2·3−1 = 5</code> · <code>2·2−1 = 3</code> · <code>2·4−1 = 7</code><br/>' +
        '⇒ 左半 = <strong>[1, 5, 3, 7]</strong>（全奇數，順序繼承 f(4)）',
    },
    {
      title: 'STEP 04 · EVEN MAP · 右半 = 2 · f(4)',
      detail:
        '取 <code>f(4)</code> 每個值套 <code>2x</code>：<br/>' +
        '<code>2·1 = 2</code> · <code>2·3 = 6</code> · <code>2·2 = 4</code> · <code>2·4 = 8</code><br/>' +
        '⇒ 右半 = <strong>[2, 6, 4, 8]</strong>（全偶數，順序繼承 f(4)）',
    },
    {
      title: 'STEP 05 · DONE · f(8) = [1, 5, 3, 7, 2, 6, 4, 8]',
      detail:
        '左半奇數 + 右半偶數 拼起來：<br/>' +
        '<strong>[1, 5, 3, 7, 2, 6, 4, 8]</strong>　⇒ 3-AP free ✓<br/>' +
        '<span style="color:#6b6b6b">遞迴：每層 O(N) merge，深度 O(log N) ⇒ 整體 O(N log N)。</span>',
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

  function cellValueAt(idx) {
    if (step <= 1) return null;
    if (step === 2) return idx < 4 ? ODD[idx] : null;
    if (step >= 3) return idx < 4 ? ODD[idx] : EVEN[idx - 4];
    return null;
  }

  function tintFor(idx) {
    if (step < 0) return COLOR.cellEmpty;
    return idx < 4 ? COLOR.leftTint : COLOR.rightTint;
  }

  function drawMainRow(w, h) {
    const pad = 32;
    const gap = 4;
    const slotsW = w - pad * 2;
    const cellSize = Math.min(Math.floor((slotsW - gap * (N - 1)) / N), 64);
    const totalW = cellSize * N + gap * (N - 1);
    const x0 = (w - totalW) / 2;
    const y0 = h - cellSize - 70;

    // half-band labels (above)
    if (step >= 0) {
      ctx.fillStyle = '#3a5a7a';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('LEFT · ODD VALUES', x0 + 2 * cellSize + 1.5 * gap, y0 - 8);
      ctx.fillStyle = '#7a5a3a';
      ctx.fillText('RIGHT · EVEN VALUES', x0 + 6 * cellSize + 5.5 * gap, y0 - 8);
    }

    for (let i = 0; i < N; i++) {
      const x = x0 + i * (cellSize + gap);
      const y = y0;
      const fill = (step < 0) ? COLOR.cellEmpty : tintFor(i);

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = COLOR.cellBorder;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

      const v = cellValueAt(i);
      if (v !== null) {
        ctx.fillStyle = COLOR.cellText;
        ctx.font = `700 ${Math.floor(cellSize * 0.48)}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(v), x + cellSize / 2, y + cellSize / 2);
      }

      ctx.fillStyle = COLOR.inkDim;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`[${i}]`, x + cellSize / 2, y + cellSize + 6);
    }

    // divider line between halves
    if (step >= 0) {
      const dividerX = x0 + 4 * cellSize + 3.5 * gap;
      ctx.strokeStyle = COLOR.coral;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(dividerX, y0 - 14);
      ctx.lineTo(dividerX, y0 + cellSize + 14);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    return { x0, y0, cellSize, gap, totalW };
  }

  function drawInset(w, main) {
    if (step < 1 || step >= 4) return;

    const cellSize = 38;
    const gap = 3;
    const padX = 16;
    const insetW = cellSize * 4 + gap * 3 + padX * 2;
    const titleH = 22;
    const cellsH = cellSize;
    const insetH = titleH + cellsH + 14;

    const x = (w - insetW) / 2;
    const arrowH = 38;
    const y = main.y0 - insetH - arrowH - 14;

    // Inset box
    ctx.fillStyle = COLOR.insetBg;
    ctx.fillRect(x, y, insetW, insetH);
    ctx.strokeStyle = COLOR.insetBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, insetW - 1, insetH - 1);

    // Title (centered)
    ctx.fillStyle = COLOR.ink;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('// f(4) = [1, 3, 2, 4]', x + insetW / 2, y + titleH / 2 + 4);

    // f(4) cells
    const innerX = x + padX;
    const innerY = y + titleH + 4;
    for (let i = 0; i < 4; i++) {
      const cx = innerX + i * (cellSize + gap);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx, innerY, cellSize, cellSize);
      ctx.strokeStyle = COLOR.cellBorder;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx + 0.5, innerY + 0.5, cellSize - 1, cellSize - 1);
      ctx.fillStyle = COLOR.cellText;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(F4[i]), cx + cellSize / 2, innerY + cellSize / 2);
    }

    // Arrow + transform hint between inset and main row (only on map steps)
    if (step === 2 || step === 3) {
      const arrowY = y + insetH + 4;
      const mapText = step === 2
        ? '↓   × 2 − 1   →   ODD (left half)'
        : '↓   × 2   →   EVEN (right half)';
      ctx.fillStyle = COLOR.coral;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(mapText, w / 2, arrowY);
    } else {
      // Plain down-arrow for step 1 (recurse reveal)
      ctx.fillStyle = COLOR.inkDim;
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('↓', w / 2, y + insetH + 4);
    }
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // headline
    ctx.fillStyle = COLOR.ink;
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = (step === -1)
      ? 'INITIAL · BUILD f(8) — 3-AP free permutation of 1..8'
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 16);

    // sub-line (running formula)
    ctx.fillStyle = COLOR.inkDim;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    const sub = (step === -1)
      ? 'f(N) = (2 · f(⌈N/2⌉) − 1)  ++  (2 · f(⌊N/2⌋))'
      : (step < 4
          ? 'f(8) = (2 · f(4) − 1)  ++  (2 · f(4))'
          : 'f(8) = [1, 5, 3, 7]  ++  [2, 6, 4, 8] = [1, 5, 3, 7, 2, 6, 4, 8]');
    ctx.fillText(sub, w / 2, 38);

    const main = drawMainRow(w, h);
    drawInset(w, main);
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 目標：建構 1..8 的排列，使任意 i &lt; j &lt; k 都有 ' +
          '<code>a[i] + a[k] ≠ 2 · a[j]</code>。<br/>' +
          '<span style="color:#6b6b6b">按 Play 看 5 步遞迴構造 — 核心是「奇偶切」。</span>';
      } else {
        const s = STEPS[step];
        labelEl.innerHTML =
          `<strong>${s.title}</strong><br/>${s.detail}`;
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
