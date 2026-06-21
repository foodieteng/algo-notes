/* ============================================================
   P351 慘字道路規劃 — incremental Floyd-Warshall
   「加入城市 k」= Floyd 第 k 層 pivot。逐城加入、跑一層、掃 max 慘字度。
   Style: white paper background, solid-color fills.
   Sample N=5, matrix c (−1 = no road). 慘字度序列 = 0 3 −1 12 11。
   Three tidy horizontal bands, never overlapping:
     BAND 1  加入進度（城市 1..5 chips，current 高亮）
     BAND 2  dist 矩陣（k×k；新增 k 行列 tan、被鬆弛變小 coral、INF 灰）
     BAND 3  慘字度 readout（0 → 3 → −1 → 12 → 11）
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
    paper:   '#ffffff',
    grid:    '#cfcfcf',
    oldBg:   '#e3edf5',   // 已加入的格
    oldSt:   '#8fb3d4',
    newBg:   '#f6ead8',   // 本步新增的 k 行/列
    newSt:   '#d4a868',
    relBg:   '#f6d2c4',   // 被鬆弛變小的格 / max 來源
    relSt:   '#d96e4e',
    infBg:   '#ededed',   // INF
    infSt:   '#bdbdbd',
    ansBg:   '#d9e8c7',
    ansSt:   '#5fa866',
    text:    '#1f3550',
    ink:     '#1a1a1a',
    dim:     '#9a9a9a',
    coral:   '#d96e4e',
    green:   '#5fa866',
  };

  const INF = Infinity;
  const N = 5;
  // raw matrix (1-indexed), -1 → INF
  const raw = [
    [0, 1, -1, 2, 3],
    [3, 0, -1, 4, 2],
    [-1, -1, 0, 9, 8],
    [1, 3, 8, 0, 9],
    [5, 4, 3, 8, 0],
  ];
  const c = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(INF));
  for (let i = 1; i <= N; i++) for (let j = 1; j <= N; j++) {
    const v = raw[i - 1][j - 1];
    c[i][j] = (v === -1) ? INF : v;
  }

  // run incremental Floyd, snapshot after each city add
  const steps = [];
  function snapMatrix(dist, k, maxCell) {
    // copy the k×k top-left
    const m = [];
    for (let i = 1; i <= k; i++) {
      const row = [];
      for (let j = 1; j <= k; j++) row.push(dist[i][j]);
      m.push(row);
    }
    return m;
  }

  steps.push({
    k: 0, mat: [], worst: null, maxIJ: null,
    text: '<strong>INITIAL</strong> · dist 矩陣全空。城市依編號 1→5 一個一個加入。'
  });

  const dist = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(INF));
  const series = [];
  for (let k = 1; k <= N; k++) {
    for (let i = 1; i <= k; i++) {
      dist[i][k] = Math.min(dist[i][k], c[i][k]);
      dist[k][i] = Math.min(dist[k][i], c[k][i]);
    }
    dist[k][k] = Math.min(dist[k][k], 0);
    for (let m = 1; m < k; m++)
      for (let i = 1; i <= k; i++) {
        if (dist[i][m] < INF && dist[m][k] < INF) dist[i][k] = Math.min(dist[i][k], dist[i][m] + dist[m][k]);
        if (dist[k][m] < INF && dist[m][i] < INF) dist[k][i] = Math.min(dist[k][i], dist[k][m] + dist[m][i]);
      }
    for (let i = 1; i <= k; i++)
      for (let j = 1; j <= k; j++)
        if (dist[i][k] < INF && dist[k][j] < INF) dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
    // worst
    let worst = 0, bad = false, mi = -1, mj = -1;
    for (let i = 1; i <= k; i++) for (let j = 1; j <= k; j++) {
      if (dist[i][j] >= INF) { bad = true; }
      else if (dist[i][j] > worst) { worst = dist[i][j]; mi = i; mj = j; }
    }
    const ans = bad ? -1 : worst;
    series.push(ans);
    let txt = `<strong>加入城市 ${k}</strong> · 多出第 ${k} 行/列，並以 ${k} 為中繼鬆弛 {1..${k}}。`;
    if (bad) txt += ' 有點對互相不可達（INF）⇒ 慘字度 = <strong>−1</strong>（大慘字規劃）。';
    else txt += ` 目前最大最短路 dist[${mi}][${mj}] = <strong>${worst}</strong> ⇒ 慘字度 = ${worst}。`;
    if (k === 5) txt += ' 城市 5 當中繼把 2→3 從 12 壓到 5，max 由 12 降為 11。';
    steps.push({
      k, mat: snapMatrix(dist, k), worst: ans, maxIJ: bad ? null : [mi, mj],
      bad, series: series.slice(),
      text: txt
    });
  }

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 460;
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

    const PAD = 28;

    // ───────────────────── BAND 1 · 加入進度 ─────────────────────
    const band1Y = 32;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 加入進度（依編號 1→5 逐一加入城市）', PAD, band1Y);

    const chipW = 54, chipGap = 14, chipH = 36;
    const cy1 = band1Y + 14;
    for (let v = 1; v <= N; v++) {
      const x = PAD + (v - 1) * (chipW + chipGap);
      const added = v <= s.k;
      const isCur = v === s.k;
      rr(x, cy1, chipW, chipH, 4);
      ctx.fillStyle = isCur ? COLOR.relBg : (added ? COLOR.oldBg : '#f6f6f6');
      ctx.fill();
      ctx.lineWidth = isCur ? 2.6 : 1.5;
      ctx.strokeStyle = isCur ? COLOR.relSt : (added ? COLOR.oldSt : COLOR.grid);
      ctx.stroke();
      ctx.fillStyle = added ? COLOR.ink : COLOR.dim;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('城' + v, x + chipW / 2, cy1 + chipH / 2);
    }

    // ───────────────────── BAND 2 · dist 矩陣 ─────────────────────
    const band2Y = 104;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · dist 矩陣（tan = 本步新增 k 行/列 · 紅 = 最大那格 · 灰 = INF）', PAD, band2Y);

    const k = s.k;
    const gy0 = band2Y + 22;
    const gridH = 270;
    if (k === 0) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('（尚未加入任何城市）', PAD, gy0 + 12);
    } else {
      const headW = 30;  // row/col header
      const avail = w - PAD * 2 - headW;
      const cell = Math.min(46, Math.min(avail / k, gridH / k));
      const gx0 = PAD + headW;
      // column headers
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let j = 0; j < k; j++) {
        ctx.fillStyle = (j + 1 === k) ? COLOR.newSt : COLOR.dim;
        ctx.fillText(String(j + 1), gx0 + j * cell + cell / 2, gy0 - 9);
      }
      for (let i = 0; i < k; i++) {
        // row header
        ctx.fillStyle = (i + 1 === k) ? COLOR.newSt : COLOR.dim;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), gx0 - 6, gy0 + i * cell + cell / 2);
        for (let j = 0; j < k; j++) {
          const x = gx0 + j * cell, y = gy0 + i * cell;
          const val = s.mat[i][j];
          const isNew = (i + 1 === k) || (j + 1 === k);
          const isMax = s.maxIJ && s.maxIJ[0] === i + 1 && s.maxIJ[1] === j + 1;
          const isInf = val >= INF;
          let bg = COLOR.oldBg, st = COLOR.oldSt;
          if (isInf) { bg = COLOR.infBg; st = COLOR.infSt; }
          else if (isMax) { bg = COLOR.relBg; st = COLOR.relSt; }
          else if (isNew) { bg = COLOR.newBg; st = COLOR.newSt; }
          rr(x + 1, y + 1, cell - 2, cell - 2, 3);
          ctx.fillStyle = bg; ctx.fill();
          ctx.lineWidth = isMax ? 2.5 : 1.2;
          ctx.strokeStyle = st; ctx.stroke();
          ctx.fillStyle = isInf ? COLOR.infSt : COLOR.ink;
          ctx.font = (isMax ? '700 ' : '600 ') + Math.max(11, Math.min(15, cell * 0.34)) + 'px "JetBrains Mono", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(isInf ? '∞' : String(val), x + cell / 2, y + cell / 2 + 1);
        }
      }
    }

    // ───────────────────── BAND 3 · 慘字度 ─────────────────────
    const band3Y = 408;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 慘字度 = max dist[i][j]（有 ∞ ⇒ −1）', PAD, band3Y);

    const sy = band3Y + 14;
    const sw = 70, sh = 40, sgap = 12;
    const series = s.series || [];
    for (let v = 1; v <= N; v++) {
      const x = PAD + (v - 1) * (sw + sgap);
      const has = v <= series.length;
      const isCur = v === s.k;
      rr(x, sy, sw, sh, 4);
      ctx.fillStyle = isCur ? COLOR.ansBg : (has ? '#f4f4f4' : '#f9f9f9');
      ctx.fill();
      ctx.lineWidth = isCur ? 2.5 : 1.3;
      ctx.strokeStyle = isCur ? COLOR.ansSt : (has ? COLOR.grid : '#e8e8e8');
      ctx.stroke();
      // city label
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('城' + v + ' 後', x + sw / 2, sy + 4);
      // value
      ctx.fillStyle = has ? (series[v - 1] === -1 ? COLOR.coral : COLOR.ink) : COLOR.dim;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(has ? String(series[v - 1]) : '·', x + sw / 2, sy + sh - 5);
    }

    // output string on the right
    if (s.k === N) {
      const ax = PAD + N * (sw + sgap) + 6;
      const aw = w - PAD - ax;
      if (aw > 100) {
        rr(ax, sy, aw, sh, 4);
        ctx.fillStyle = COLOR.ink; ctx.fill();
        ctx.fillStyle = '#bfe3b0';
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('OUTPUT', ax + aw / 2, sy + 5);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(series.join(' '), ax + aw / 2, sy + sh - 6);
      }
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
    timer = setInterval(() => {
      if (step >= steps.length - 1) { stop(); return; }
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
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => { fitCanvas(); draw(); });
    ro.observe(canvas);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  fitCanvas();
  update();
})();
