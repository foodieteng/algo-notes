/* ============================================================
   P144 高棕櫚農場2 — 0/1 knapsack with a count cap K.
   dp[j][l] = max(dp[j][l], dp[j-1][l - A_i] + B_i),  j,l both descending.
   Style: white paper background, solid-color fills, three tidy bands:
     BAND 1  items (current one highlighted)
     BAND 2  the (K+1)x(M+1) dp matrix; active cell coral, source dp[j-1][l-A] blue
     BAND 3  the live transition + answer
   Walks sample M=6, K=3, items (2,4)(3,5)(4,6) -> 10.
   Event-compressed: settled table after each item, plus the key updates.
   ============================================================ */

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const stepEl   = document.getElementById('viz-step');
  const labelEl  = document.getElementById('viz-label');
  const btnPrev  = document.getElementById('viz-prev');
  const btnNext  = document.getElementById('viz-next');
  const btnPlay  = document.getElementById('viz-play');
  const btnReset = document.getElementById('viz-reset');

  const COLOR = {
    paper:    '#ffffff',
    grid:     '#cfcfcf',
    cellBg:   '#f4f6f8',
    active:   '#d96e4e', activeBg: '#f7ddd2',
    source:   '#8fb3d4', sourceBg: '#e3edf5',
    grew:     '#5fa866', grewBg:   '#d9e8c7',
    itemBg:   '#f6ead8', itemSt:   '#d4a868',
    header:   '#eef2f6',
    text:     '#1f3550', ink: '#1a1a1a', dim: '#9a9a9a',
  };

  const M = 6, K = 3;
  const ITEMS = [ { A: 2, B: 4 }, { A: 3, B: 5 }, { A: 4, B: 6 } ];

  // compute full per-item dp snapshots
  function zeros() { return Array.from({ length: K + 1 }, () => new Array(M + 1).fill(0)); }
  const after = [zeros()];
  {
    let dp = zeros();
    for (let i = 0; i < ITEMS.length; i++) {
      const { A, B } = ITEMS[i];
      for (let j = K; j >= 1; j--)
        for (let l = M; l >= A; l--)
          dp[j][l] = Math.max(dp[j][l], dp[j - 1][l - A] + B);
      after.push(dp.map(r => r.slice()));
    }
  }

  // ── steps ──
  const steps = [];
  function snap(o) { steps.push(o); }

  snap({
    dp: after[0], item: null, cell: null, src: null, grew: false,
    text: '<strong>INITIAL</strong> · dp[j][l] 全部歸零。列 j = 已選個數、行 l = 飽足感。逐物品、j 與 l 都由大到小更新。',
  });

  // item 0 settled
  snap({
    dp: after[1], item: 0, cell: null, src: null, grew: false,
    text: '<strong>物品0 (A=2,B=4) 處理完</strong>：只要 l≥2，任一列 j≥1 都能放下這顆 ⇒ dp[j≥1][l≥2] = 4。',
  });

  // item 1: highlight key update dp[2][5] = dp[1][2]+5 = 9 (keep before = after[1][2][5] = 4)
  snap({
    dp: after[2], item: 1, cell: [2, 5], src: [1, 2], A: 3, B: 5, grew: true, keep: after[1][2][5],
    text: '<strong>物品1 (A=3,B=5)</strong> · 關鍵格 dp[2][5]：吃 = dp[1][2]+5 = 4+5 = <strong>9</strong>（吃物品0+物品1，用 2 個、飽足 5）。',
  });
  snap({
    dp: after[2], item: 1, cell: null, src: null, grew: false,
    text: '<strong>物品1 處理完</strong>：j=2 那列開始出現「吃兩個」的組合（如 dp[2][5]=dp[2][6]=9）。',
  });

  // item 2: highlight dp[2][6] = dp[1][2]+6 = 10 (keep before = after[2][2][6] = 9)
  snap({
    dp: after[3], item: 2, cell: [2, 6], src: [1, 2], A: 4, B: 6, grew: true, keep: after[2][2][6],
    text: '<strong>物品2 (A=4,B=6)</strong> · 關鍵格 dp[2][6]：吃 = dp[1][2]+6 = 4+6 = <strong>10</strong>（吃物品0+物品2，飽足 2+4=6，用 2 個）。',
  });
  snap({
    dp: after[3], item: 2, cell: null, src: null, grew: false,
    text: '<strong>物品2 處理完</strong>：所有物品都考慮過了。',
  });

  snap({
    dp: after[3], item: null, cell: [K, M], src: null, grew: false, done: true,
    text: '<strong>答案 = dp[K=3][M=6] = 10</strong>。最佳：吃物品0+物品2，飽足 6≤6、用 2 個 ≤ 3、滿足 10。',
  });

  let step = 0, timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 480;
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const PAD = 26;
    const band1Y = 32;
    const band2Y = 150;
    const band3Y = 396;

    // ───────────────── BAND 1 · items ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 高棕櫚（A=飽足 · B=滿足）· 最多吃 K=' + K + ' 個', PAD, band1Y);

    const iw = 132, ih = 58, igap = 18, iy = band1Y + 14;
    let ix = PAD;
    ITEMS.forEach((it, idx) => {
      const isCur = s.item === idx;
      rr(ix, iy, iw, ih, 4);
      ctx.fillStyle = isCur ? COLOR.activeBg : COLOR.itemBg;
      ctx.fill();
      ctx.strokeStyle = isCur ? COLOR.active : COLOR.itemSt;
      ctx.lineWidth = isCur ? 2.5 : 1.5; ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = COLOR.ink; ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillText('物品 ' + idx, ix + 12, iy + 9);
      ctx.fillStyle = COLOR.text; ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText('A=' + it.A + ' B=' + it.B, ix + 12, iy + 30);
      if (isCur) {
        ctx.fillStyle = COLOR.active; ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('▶', ix + iw - 10, iy + ih - 7);
      }
      ix += iw + igap;
    });

    // ───────────────── BAND 2 · dp matrix ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · dp[j][l] = 選 ≤ j 個、飽足 ≤ l 的最大滿足感（j、l 都倒序更新）', PAD, band2Y);

    const rows = K + 1, cols = M + 1;
    const labelW = 42, headH = 22;
    const availW = w - PAD * 2 - labelW;
    const availH = band3Y - (band2Y + 22) - headH - 8;
    const cell = Math.min(46, availW / cols, availH / rows);
    const gridW = cell * cols, gridH = cell * rows;
    const gx = PAD + labelW + (availW - gridW) / 2;
    const gy = band2Y + 22 + headH;

    // column headers (l)
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = COLOR.dim;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (let l = 0; l <= M; l++) ctx.fillText('l=' + l, gx + l * cell + cell / 2, gy - 5);
    // row headers (j)
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let j = 0; j <= K; j++) ctx.fillText('j=' + j, gx - 8, gy + j * cell + cell / 2);

    for (let j = 0; j <= K; j++) {
      for (let l = 0; l <= M; l++) {
        const x = gx + l * cell, y = gy + j * cell;
        const isActive = s.cell && s.cell[0] === j && s.cell[1] === l;
        const isSrc = s.src && s.src[0] === j && s.src[1] === l;
        let bg = COLOR.cellBg, st = COLOR.grid, lw = 1;
        if (isSrc)    { bg = COLOR.sourceBg; st = COLOR.source; lw = 2; }
        if (isActive) { bg = s.grew ? COLOR.grewBg : COLOR.activeBg; st = s.grew ? COLOR.grew : COLOR.active; lw = 2.5; }
        ctx.fillStyle = bg; ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = st; ctx.lineWidth = lw;
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        ctx.fillStyle = COLOR.ink;
        ctx.font = '700 ' + Math.round(cell * 0.36) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(s.dp[j][l]), x + cell / 2, y + cell / 2 + 1);
      }
    }

    // arrow source -> active (diagonal up-left)
    if (s.cell && s.src) {
      const ax = gx + s.cell[1] * cell + cell / 2, ay2 = gy + s.cell[0] * cell;
      const sx = gx + s.src[1] * cell + cell / 2,  sy = gy + s.src[0] * cell + cell / 2;
      ctx.strokeStyle = COLOR.source; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ax, ay2 - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, ay2); ctx.lineTo(ax - 5, ay2 - 6); ctx.lineTo(ax + 5, ay2 - 6); ctx.closePath();
      ctx.fillStyle = COLOR.source; ctx.fill();
    }

    // ───────────────── BAND 3 · transition ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 轉移：dp[j][l] = max( dp[j][l] , dp[j−1][l−A] + B )', PAD, band3Y);

    const ty = band3Y + 32;
    if (s.cell && s.src && !s.done) {
      const [j, l] = s.cell, [sj, sl] = s.src;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      let x = PAD;
      const seg = (txt, col) => { ctx.fillStyle = col; ctx.fillText(txt, x, ty); x += ctx.measureText(txt).width + 7; };
      seg('dp[' + j + '][' + l + '] = max(', COLOR.ink);
      seg(String(s.keep), COLOR.itemSt);                       // value before this item
      seg(',', COLOR.dim);
      seg('dp[' + sj + '][' + sl + ']+' + s.B, COLOR.source);
      seg('=' + (s.dp[sj][sl] + s.B), COLOR.source);
      seg(') →', COLOR.ink);
      seg(String(s.dp[j][l]), COLOR.grew);
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = COLOR.grew; ctx.textBaseline = 'middle';
      ctx.fillText('✓ 吃第 ' + s.item + ' 個（用 1 名額 + A=' + s.A + ' 飽足）→ 更新', PAD, ty + 28);
    } else if (s.done) {
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.fillStyle = COLOR.grew; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('答案 dp[' + K + '][' + M + '] = ' + s.dp[K][M], PAD, ty);
      ctx.font = '500 13px "Noto Sans TC", sans-serif'; ctx.fillStyle = COLOR.dim;
      ctx.fillText('吃物品0+物品2：飽足 2+4=6 ≤ 6、用 2 個 ≤ K=3、滿足 4+6 = 10。', PAD, ty + 26);
    } else {
      ctx.font = '500 14px "Noto Sans TC", sans-serif'; ctx.fillStyle = COLOR.dim;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('每格比較「不吃」與「吃（看左上方 dp[j−1][l−A]，加 B）」，取較大者。', PAD, ty);
    }
  }

  function update() {
    const s = steps[step];
    if (stepEl) {
      stepEl.textContent = String(step).padStart(2, '0') + ' / ' +
        String(steps.length - 1).padStart(2, '0');
    }
    if (labelEl) labelEl.innerHTML = s.text;
    draw();
  }

  function next()  { if (step < steps.length - 1) { step++; update(); } else stop(); }
  function prev()  { if (step > 0) { step--; update(); } }
  function reset() { stop(); step = 0; update(); }
  function play()  {
    if (timer) { stop(); return; }
    btnPlay.textContent = 'Pause';
    timer = setInterval(() => { if (step >= steps.length - 1) { stop(); return; } next(); }, 1500);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } if (btnPlay) btnPlay.textContent = 'Play'; }

  btnPrev  && btnPrev .addEventListener('click', prev);
  btnNext  && btnNext .addEventListener('click', next);
  btnPlay  && btnPlay .addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', () => { fitCanvas(); draw(); });
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { fitCanvas(); draw(); }); ro.observe(canvas); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  fitCanvas();
  update();
})();
