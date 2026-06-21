/* ============================================================
   P378 江神與他的小火車 — two-sided Dijkstra, O(1) per candidate edge
   候選邊 c→d 只能讓路長「1⇝c → d⇝N」。預處理 d1[]（從 1）與 dN[]（到 N），
   每個 query = min(d1[N], d1[c] + 1 + dN[d])。
   Style: white paper background, solid-color fills.
   Sample 1: 6-city chain 1→2→…→6 (每段長 1)，候選邊 2→5 ⇒ ans = 1+1+1 = 3。
   Three tidy horizontal bands, never overlapping:
     BAND 1  城市鏈圖 + 候選邊 2→5（query 階段以 coral 弧線出現）
     BAND 2  d1[]（藍，從起點 1）/ dN[]（tan，到終點 6）兩列
     BAND 3  查詢計算：d1[c] + 1 + dN[d] vs base → 答案
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
    d1Bg:     '#e3edf5',   // d1 (forward)
    d1St:     '#8fb3d4',
    dNBg:     '#f6ead8',   // dN (reverse)
    dNSt:     '#d4a868',
    candBg:   '#f6d2c4',   // candidate edge / new path
    candSt:   '#d96e4e',
    ansBg:    '#d9e8c7',   // answer
    ansSt:    '#5fa866',
    node:     '#ffffff',
    nodeSt:   '#8fb3d4',
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
    coral:    '#d96e4e',
    green:    '#5fa866',
  };

  // ── sample 1 ──
  const N = 6;
  const d1 = [null, 0, 1, 2, 3, 4, 5];   // index 1..6
  const dN = [null, 5, 4, 3, 2, 1, 0];
  const base = d1[N];                     // 5
  const Cq = 2, Dq = 5;                   // candidate 2→5
  const cand = d1[Cq] + 1 + dN[Dq];       // 3
  const ans = Math.min(base, cand);       // 3

  // ── build steps ──
  // phase: forward fill (show d1 growing), reverse fill (dN), then query.
  const steps = [];

  steps.push({
    kind: 'init', d1n: 0, dNn: 0, showCand: false, calc: null,
    text: '<strong>INITIAL</strong> · 6 城市鏈 1→2→…→6（每段長 1）。先預處理兩個距離陣列。'
  });
  // forward dijkstra reveal (one city per step)
  for (let k = 1; k <= N; k++) {
    steps.push({
      kind: 'fwd', d1n: k, dNn: 0, showCand: false, calc: null,
      text: `<strong>正向 Dijkstra</strong> · 從起點 1 擴張，定下 d1[${k}] = ${d1[k]}（1 到 ${k} 的最短距離）。`
    });
  }
  // reverse dijkstra reveal
  for (let k = N; k >= 1; k--) {
    const idx = N - k + 1;
    steps.push({
      kind: 'rev', d1n: N, dNn: idx, showCand: false, calc: null,
      text: `<strong>反向 Dijkstra</strong> · 在反圖從終點 6 擴張，定下 dN[${k}] = ${dN[k]}（${k} 到 6 的最短距離）。`
    });
  }
  // base ready
  steps.push({
    kind: 'base', d1n: N, dNn: N, showCand: false, calc: null,
    text: `<strong>預處理完成</strong> · base = d1[6] = <strong>${base}</strong>（不加任何候選邊的原最短路）。`
  });
  // query: show candidate edge
  steps.push({
    kind: 'q-edge', d1n: N, dNn: N, showCand: true, calc: 'edge',
    text: `<strong>QUERY 2→5</strong> · 假設加一條候選邊 2→5（長度 1）。新路徑只能長「1⇝2 → 5⇝6」。`
  });
  // query: compute the three terms
  steps.push({
    kind: 'q-calc', d1n: N, dNn: N, showCand: true, calc: 'terms',
    text: `<strong>套公式</strong> · d1[2] + 1 + dN[5] = ${d1[Cq]} + 1 + ${dN[Dq]} = <strong>${cand}</strong>。`
  });
  // query: min vs base → answer
  steps.push({
    kind: 'q-ans', d1n: N, dNn: N, showCand: true, calc: 'ans',
    text: `<strong>取 min</strong> · ans = min(base=${base}, ${cand}) = <strong>${ans}</strong>。借 2→5 抄捷徑，3 &lt; 5 ⇒ 採用。`
  });

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 450;
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

    // node x positions (chain)
    const nodeR = 21;
    const span = w - PAD * 2 - nodeR * 2;
    const nx = v => PAD + nodeR + (span / (N - 1)) * (v - 1);

    // ───────────────────── BAND 1 · 城市鏈 ─────────────────────
    const band1Y = 34;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 城市鏈（每段長 1）· 候選邊 2→5 在 query 階段以弧線出現', PAD, band1Y);

    const nodeCY = band1Y + 56;

    // chain edges
    for (let v = 1; v < N; v++) {
      const x1 = nx(v) + nodeR, x2 = nx(v + 1) - nodeR;
      ctx.strokeStyle = COLOR.nodeSt; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, nodeCY); ctx.lineTo(x2, nodeCY); ctx.stroke();
      // arrowhead
      ctx.fillStyle = COLOR.nodeSt;
      ctx.beginPath();
      ctx.moveTo(x2, nodeCY); ctx.lineTo(x2 - 7, nodeCY - 4); ctx.lineTo(x2 - 7, nodeCY + 4);
      ctx.closePath(); ctx.fill();
      // weight 1
      ctx.fillStyle = COLOR.dim;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('1', (x1 + x2) / 2, nodeCY - 5);
    }

    // candidate edge arc 2→5 (above the chain)
    if (s.showCand) {
      const x1 = nx(Cq), x2 = nx(Dq);
      const topY = nodeCY - 44;
      ctx.strokeStyle = COLOR.candSt; ctx.lineWidth = 2.6;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, nodeCY - nodeR);
      ctx.bezierCurveTo(x1, topY, x2, topY, x2, nodeCY - nodeR);
      ctx.stroke();
      ctx.setLineDash([]);
      // arrowhead near node 5
      ctx.fillStyle = COLOR.candSt;
      ctx.beginPath();
      ctx.moveTo(x2, nodeCY - nodeR);
      ctx.lineTo(x2 - 5, nodeCY - nodeR - 8);
      ctx.lineTo(x2 + 5, nodeCY - nodeR - 8);
      ctx.closePath(); ctx.fill();
      // label "+1"
      ctx.fillStyle = COLOR.candSt;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('候選 2→5 (長 1)', (x1 + x2) / 2, topY - 2);
    }

    // nodes
    for (let v = 1; v <= N; v++) {
      const cx = nx(v);
      const isOnPath = s.showCand && (v === 1 || v === Cq || v === Dq || v === N);
      ctx.beginPath(); ctx.arc(cx, nodeCY, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = isOnPath ? COLOR.candBg : COLOR.node;
      ctx.fill();
      ctx.lineWidth = isOnPath ? 2.6 : 2;
      ctx.strokeStyle = isOnPath ? COLOR.candSt : COLOR.nodeSt;
      ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(v), cx, nodeCY);
      // S / E tag
      if (v === 1 || v === N) {
        ctx.fillStyle = COLOR.coral;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textBaseline = 'top';
        ctx.fillText(v === 1 ? 'S=1' : 'E=N', cx, nodeCY + nodeR + 5);
      }
    }

    // ───────────────────── BAND 2 · d1[] / dN[] ─────────────────────
    const band2Y = 184;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · d1[v]（藍 · 從起點 1）   /   dN[v]（tan · 到終點 6）', PAD, band2Y);

    const cellW = Math.min(74, (w - PAD * 2 - 70) / N);
    const cellH = 34;
    const labelW = 64;
    // row labels + cells
    const rowY1 = band2Y + 16;          // d1
    const rowY2 = band2Y + 16 + cellH + 22;  // dN

    function drawRow(rowY, arr, n, bg, st, name) {
      ctx.fillStyle = st;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(name, PAD, rowY + cellH / 2);
      for (let v = 1; v <= N; v++) {
        const x = PAD + labelW + (v - 1) * cellW;
        const shown = v <= n;   // (for d1: first n; dN handled by caller mapping)
        rr(x, rowY, cellW - 8, cellH, 4);
        ctx.fillStyle = shown ? bg : '#f6f6f6';
        ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = shown ? st : COLOR.grid; ctx.stroke();
        // index
        ctx.fillStyle = COLOR.dim;
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('[' + v + ']', x + (cellW - 8) / 2, rowY + 3);
        // value
        ctx.fillStyle = shown ? COLOR.ink : COLOR.dim;
        ctx.font = '700 15px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(shown ? String(arr[v]) : '·', x + (cellW - 8) / 2, rowY + cellH - 4);
      }
    }

    // d1 row: reveal first s.d1n cities
    drawRow(rowY1, d1, s.d1n, COLOR.d1Bg, COLOR.d1St, 'd1[]');
    // dN row: reveal last s.dNn cities (from N down). Build a "shown" predicate.
    {
      ctx.fillStyle = COLOR.dNSt;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('dN[]', PAD, rowY2 + cellH / 2);
      for (let v = 1; v <= N; v++) {
        const x = PAD + labelW + (v - 1) * cellW;
        const shown = v >= (N - s.dNn + 1);   // dN reveals from N downward
        rr(x, rowY2, cellW - 8, cellH, 4);
        ctx.fillStyle = shown ? COLOR.dNBg : '#f6f6f6';
        ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = shown ? COLOR.dNSt : COLOR.grid; ctx.stroke();
        ctx.fillStyle = COLOR.dim;
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('[' + v + ']', x + (cellW - 8) / 2, rowY2 + 3);
        ctx.fillStyle = shown ? COLOR.ink : COLOR.dim;
        ctx.font = '700 15px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(shown ? String(dN[v]) : '·', x + (cellW - 8) / 2, rowY2 + cellH - 4);
      }
    }

    // highlight d1[Cq] and dN[Dq] when in query phase
    if (s.calc === 'terms' || s.calc === 'ans') {
      const xc = PAD + labelW + (Cq - 1) * cellW;
      rr(xc, rowY1, cellW - 8, cellH, 4);
      ctx.lineWidth = 3; ctx.strokeStyle = COLOR.candSt; ctx.stroke();
      const xd = PAD + labelW + (Dq - 1) * cellW;
      rr(xd, rowY2, cellW - 8, cellH, 4);
      ctx.lineWidth = 3; ctx.strokeStyle = COLOR.candSt; ctx.stroke();
    }

    // ───────────────────── BAND 3 · 查詢計算 ─────────────────────
    const band3Y = 358;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 查詢計算 · ans = min(base, d1[c] + 1 + dN[d])', PAD, band3Y);

    const by = band3Y + 16;
    const boxH = 46;
    // base chip (always once base ready)
    let bx = PAD;
    function chip(x, wch, topLab, val, bg, st, valCol) {
      rr(x, by, wch, boxH, 4);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = st; ctx.stroke();
      ctx.fillStyle = COLOR.dim;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(topLab, x + wch / 2, by + 5);
      ctx.fillStyle = valCol || COLOR.ink;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(val, x + wch / 2, by + boxH - 6);
    }

    if (s.kind === 'base' || s.calc) {
      chip(bx, 86, 'base = d1[6]', String(base), COLOR.d1Bg, COLOR.d1St);
      bx += 86 + 14;
    }
    if (s.calc === 'terms' || s.calc === 'ans') {
      // d1[c] + 1 + dN[d]
      chip(bx, 70, 'd1[' + Cq + ']', String(d1[Cq]), COLOR.d1Bg, COLOR.d1St); bx += 70;
      // plus
      ctx.fillStyle = COLOR.dim; ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', bx + 11, by + boxH / 2); bx += 22;
      chip(bx, 54, '邊長', '1', COLOR.candBg, COLOR.candSt); bx += 54;
      ctx.fillStyle = COLOR.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', bx + 11, by + boxH / 2); bx += 22;
      chip(bx, 70, 'dN[' + Dq + ']', String(dN[Dq]), COLOR.dNBg, COLOR.dNSt); bx += 70;
      ctx.fillStyle = COLOR.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('=', bx + 13, by + boxH / 2); bx += 26;
      chip(bx, 64, 'cand', String(cand), COLOR.candBg, COLOR.candSt, COLOR.coral); bx += 64 + 16;
    }
    if (s.calc === 'ans') {
      // answer box on the right
      const ax = Math.max(bx, w - PAD - 150);
      const aw = w - PAD - ax;
      if (aw > 110) {
        rr(ax, by, aw, boxH, 4);
        ctx.fillStyle = COLOR.ink; ctx.fill();
        ctx.fillStyle = '#bfe3b0';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('ANSWER = min(' + base + ',' + cand + ')', ax + aw / 2, by + 6);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 20px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(ans), ax + aw / 2, by + boxH - 5);
      }
    }
    if (s.kind === 'q-edge') {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('新路徑 = 1⇝2（走 d1）→ 2→5（候選邊，長 1）→ 5⇝6（走 dN）', PAD + 100, by + boxH / 2);
    }
    if (s.kind !== 'base' && !s.calc) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('（預處理 d1[]、dN[] 完成後，每個 query 只是一次加法 + 一次 min ⇒ O(1)）', PAD, by + 14);
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
    }, 1200);
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
