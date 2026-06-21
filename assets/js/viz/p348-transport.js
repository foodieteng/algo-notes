/* ============================================================
   P348 可魚果運輸問題 — concave-cost transport → single-path shortest path
   折扣 = 凹成本 ⇒ F 箱全集中一條路最省 ⇒ 邊權壓成「運完 F 箱的花費」後跑 Dijkstra。
   Style: white paper background, solid-color fills.
   Sample 2: N=4, S=1, E=4, F=2, edges:
     1→2 C1 D1 C'1 → w2 ; 2→4 C5 D1 C'3 → w8 ;
     1→3 C1 D1 C'1 → w2 ; 3→4 C6 D1 C'1 → w7 (折扣猛)
   最短路 1→3→4 = 9。
   Three tidy horizontal bands, never overlapping:
     BAND 1  邊權壓縮：4 條邊各算出運 F 箱的花費（折扣邊 tinted）
     BAND 2  圖 + Dijkstra：節點/邊隨鬆弛上色，最短路徑變 coral
     BAND 3  dist 陣列：dist[1..4] 逐步更新
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
    edgeBg:   '#e3edf5',   // 一般邊
    edgeSt:   '#8fb3d4',
    discBg:   '#f6ead8',   // 吃到折扣 (F>D)
    discSt:   '#d4a868',
    pathSt:   '#d96e4e',   // 最短路徑邊 / active
    pathBg:   '#f6d2c4',
    doneBg:   '#d9e8c7',   // 已定距離的點
    doneSt:   '#5fa866',
    nodeBg:   '#ffffff',
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
    coral:    '#d96e4e',
    green:    '#5fa866',
  };

  // ── sample 2 ──
  const N = 4, S = 1, E = 4, F = 2;
  // edges: [A, B, C, D, Cp]
  const EDGES = [
    [1, 2, 1, 1, 1],
    [2, 4, 5, 1, 3],
    [1, 3, 1, 1, 1],
    [3, 4, 6, 1, 1],
  ];
  function edgeW(C, D, Cp) { return (F <= D) ? F * C : D * C + (F - D) * Cp; }
  const W = EDGES.map(([a, b, C, D, Cp]) => edgeW(C, D, Cp));
  const disc = EDGES.map(([a, b, C, D, Cp]) => F > D);   // 是否吃折扣

  // node positions (graph in BAND 2). Layout left→right: 1 | {2,3} | 4
  const POS = {
    1: { x: 0.10, y: 0.50 },
    2: { x: 0.42, y: 0.22 },
    3: { x: 0.42, y: 0.78 },
    4: { x: 0.74, y: 0.50 },
  };

  // ── build steps ──
  // Phase A: reveal each edge weight (4 steps), edges accumulate as "computed".
  // Phase B: Dijkstra (init + pops), tracking dist[], settled set, and path edges.
  const steps = [];

  // adjacency for Dijkstra
  const adj = {};
  for (let v = 1; v <= N; v++) adj[v] = [];
  EDGES.forEach(([a, b], i) => adj[a].push({ to: b, w: W[i], ei: i }));

  // Phase A
  steps.push({
    phase: 'A', revealed: 0,
    dist: null, settled: new Set(), pathEdges: new Set(), active: -1, popped: -1,
    text: '<strong>INITIAL</strong> · 先把每條方案「運 F=2 箱」的花費壓成單一邊權。' +
          'F=2 都 &gt; D=1 ⇒ 走折扣分支 D·C+(F−D)·C'
  });
  for (let i = 0; i < EDGES.length; i++) {
    const [a, b, C, D, Cp] = EDGES[i];
    steps.push({
      phase: 'A', revealed: i + 1,
      dist: null, settled: new Set(), pathEdges: new Set(), active: i, popped: -1,
      text: `<strong>壓邊權</strong> · ${a}→${b}：F=2 &gt; D=${D} ⇒ ` +
            `w = ${D}·${C} + ${F - D}·${Cp} = <strong>${W[i]}</strong>` +
            (disc[i] ? `（折扣：${C}→${Cp}）` : '')
    });
  }

  // Phase B — Dijkstra, recording snapshots
  const INF = Infinity;
  const dist = {}; for (let v = 1; v <= N; v++) dist[v] = INF;
  const settled = new Set();
  const fromEdge = {};            // node -> edge index used to reach it (current best)
  dist[S] = 0;

  steps.push({
    phase: 'B', revealed: EDGES.length,
    dist: { ...dist }, settled: new Set(settled), pathEdges: new Set(), active: -1, popped: -1,
    text: `<strong>DIJKSTRA INIT</strong> · dist[${S}]=0，其餘 ∞。從 S=${S} 開始貪心擴張。`
  });

  // simple Dijkstra with a manual "pick min unsettled"
  function pickMin() {
    let best = -1, bd = INF;
    for (let v = 1; v <= N; v++) {
      if (!settled.has(v) && dist[v] < bd) { bd = dist[v]; best = v; }
    }
    return best;
  }
  while (true) {
    const u = pickMin();
    if (u === -1) break;
    settled.add(u);
    // relax
    const relaxedTxt = [];
    for (const { to, w, ei } of adj[u]) {
      if (dist[u] + w < dist[to]) {
        dist[to] = dist[u] + w;
        fromEdge[to] = ei;
        relaxedTxt.push(`dist[${to}]→${dist[to]}`);
      }
    }
    // current best-path edges (reconstruct from fromEdge for settled+reached nodes)
    const pe = new Set();
    for (let v = 1; v <= N; v++) {
      if (fromEdge[v] !== undefined && dist[v] !== INF) pe.add(fromEdge[v]);
    }
    let txt = `<strong>POP ${u}</strong> · 取目前最近的未定點（dist=${dist[u]}），定下它的最短距離。`;
    if (relaxedTxt.length) txt += ' 鬆弛 ' + relaxedTxt.join('、') + '。';
    else txt += ' 沒有可改善的鄰居。';
    if (u === 3) txt += ' 經 3→4(w=7) 把 dist[4] 從 10 壓到 9 ⇒ <strong>1→3→4 勝出</strong>。';
    if (u === E) txt += ' 抵達終點 E，答案 = <strong>' + dist[E] + '</strong>。';

    steps.push({
      phase: 'B', revealed: EDGES.length,
      dist: { ...dist }, settled: new Set(settled),
      pathEdges: pe, active: -1, popped: u,
      text: txt
    });
  }

  // final: highlight the S→E path only
  {
    const pe = new Set();
    let v = E;
    while (v !== S && fromEdge[v] !== undefined) {
      pe.add(fromEdge[v]);
      v = EDGES[fromEdge[v]][0];
    }
    steps.push({
      phase: 'B', revealed: EDGES.length, final: true,
      dist: { ...dist }, settled: new Set(settled),
      pathEdges: pe, active: -1, popped: -1,
      text: `<strong>DONE</strong> · 最短路 1→3→4，把 2 箱整批走這條 ⇒ 花費 2+7 = <strong>${dist[E]}</strong>。` +
            ` 沒有拆箱，凹成本的最優就是集中單路徑。`
    });
  }

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 440;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw; canvas.height = bh;
    }
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

    // ───────────────────── BAND 1 · 邊權壓縮 ─────────────────────
    const band1Y = 32;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 邊權壓縮（運 F=2 箱的花費）', PAD, band1Y);

    const rowH = 26, rowGap = 4;
    const colW = (w - PAD * 2 - 18) / 2;   // two columns of 2 rows
    for (let i = 0; i < EDGES.length; i++) {
      const [a, b, C, D, Cp] = EDGES[i];
      const col = i % 2, rowi = Math.floor(i / 2);
      const x = PAD + col * (colW + 18);
      const y = band1Y + 14 + rowi * (rowH + rowGap);
      const shown = i < s.revealed;
      const isActive = s.phase === 'A' && s.active === i;
      rr(x, y, colW, rowH, 4);
      if (!shown) {
        ctx.fillStyle = '#f6f6f6'; ctx.fill();
        ctx.strokeStyle = COLOR.grid; ctx.lineWidth = 1; ctx.stroke();
        continue;
      }
      ctx.fillStyle = isActive ? COLOR.pathBg : (disc[i] ? COLOR.discBg : COLOR.edgeBg);
      ctx.fill();
      ctx.lineWidth = isActive ? 2.5 : 1.4;
      ctx.strokeStyle = isActive ? COLOR.pathSt : (disc[i] ? COLOR.discSt : COLOR.edgeSt);
      ctx.stroke();
      // edge label  A→B
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`${a}→${b}`, x + 10, y + rowH / 2);
      // formula
      ctx.fillStyle = COLOR.text;
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText(`${D}·${C}+${F - D}·${Cp}`, x + 56, y + rowH / 2);
      // = w  (right aligned)
      ctx.fillStyle = disc[i] ? COLOR.discSt : COLOR.coral;
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('w=' + W[i], x + colW - 10, y + rowH / 2);
    }

    // ───────────────────── BAND 2 · 圖 + Dijkstra ─────────────────────
    const band2Y = 150;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · 圖（邊權已壓好）· Dijkstra 從 S=1 擴張', PAD, band2Y);

    // graph drawing area
    const gx0 = PAD, gy0 = band2Y + 16;
    const gw = w - PAD * 2, gh = 168;
    const nx = id => gx0 + POS[id].x * gw;
    const ny = id => gy0 + POS[id].y * gh;
    const NR = 22;

    // edges
    for (let i = 0; i < EDGES.length; i++) {
      if (i >= s.revealed) continue;
      const [a, b] = EDGES[i];
      const x1 = nx(a), y1 = ny(a), x2 = nx(b), y2 = ny(b);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const sx = x1 + Math.cos(ang) * NR, sy = y1 + Math.sin(ang) * NR;
      const ex = x2 - Math.cos(ang) * NR, ey = y2 - Math.sin(ang) * NR;
      const onPath = s.pathEdges.has(i);
      ctx.strokeStyle = onPath ? COLOR.pathSt : (disc[i] ? COLOR.discSt : COLOR.edgeSt);
      ctx.lineWidth = onPath ? 3.2 : 1.8;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      // arrowhead
      const ah = 8;
      ctx.fillStyle = onPath ? COLOR.pathSt : (disc[i] ? COLOR.discSt : COLOR.edgeSt);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ah * Math.cos(ang - 0.4), ey - ah * Math.sin(ang - 0.4));
      ctx.lineTo(ex - ah * Math.cos(ang + 0.4), ey - ah * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
      // weight label at mid, with white bg pad
      const mx = (sx + ex) / 2, my = (sy + ey) / 2;
      const lbl = 'w=' + W[i];
      ctx.font = '700 12px "JetBrains Mono", monospace';
      const tw = ctx.measureText(lbl).width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - tw / 2 - 3, my - 9, tw + 6, 16);
      ctx.fillStyle = onPath ? COLOR.coral : COLOR.text;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, mx, my);
    }

    // nodes
    for (let v = 1; v <= N; v++) {
      const cx = nx(v), cy = ny(v);
      const isSettled = s.settled && s.settled.has(v);
      const isPop = s.popped === v;
      ctx.beginPath(); ctx.arc(cx, cy, NR, 0, Math.PI * 2);
      ctx.fillStyle = isPop ? COLOR.pathBg : (isSettled ? COLOR.doneBg : COLOR.nodeBg);
      ctx.fill();
      ctx.lineWidth = isPop ? 3 : 2;
      ctx.strokeStyle = isPop ? COLOR.pathSt : (isSettled ? COLOR.doneSt : COLOR.edgeSt);
      ctx.stroke();
      // node id
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(v), cx, cy - 1);
      // S / E tags
      if (v === S || v === E) {
        ctx.fillStyle = COLOR.coral;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.textBaseline = 'top';
        ctx.fillText(v === S ? 'S' : 'E', cx, cy + NR + 4);
      }
      // dist value above node (phase B)
      if (s.dist) {
        const dv = s.dist[v];
        ctx.fillStyle = (dv === INF) ? COLOR.dim : COLOR.green;
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText('d=' + (dv === INF ? '∞' : dv), cx, cy - NR - 5);
      }
    }

    // ───────────────────── BAND 3 · dist 陣列 ─────────────────────
    const band3Y = 366;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · dist[] 陣列（最短距離；綠 = 已定）', PAD, band3Y);

    const cellW = 60, cellH = 40, cellGap = 12;
    const cy3 = band3Y + 14;
    for (let v = 1; v <= N; v++) {
      const x = PAD + (v - 1) * (cellW + cellGap);
      const dv = s.dist ? s.dist[v] : INF;
      const isSettled = s.settled && s.settled.has(v);
      rr(x, cy3, cellW, cellH, 4);
      ctx.fillStyle = isSettled ? COLOR.doneBg : (s.popped === v ? COLOR.pathBg : '#f6f6f6');
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isSettled ? COLOR.doneSt : (s.popped === v ? COLOR.pathSt : COLOR.grid);
      ctx.stroke();
      // index
      ctx.fillStyle = COLOR.dim;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('[' + v + ']' + (v === S ? ' S' : v === E ? ' E' : ''), x + cellW / 2, cy3 + 5);
      // value
      ctx.fillStyle = (!s.dist || dv === INF) ? COLOR.dim : COLOR.ink;
      ctx.font = '700 17px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      const show = !s.dist ? '·' : (dv === INF ? '∞' : String(dv));
      ctx.fillText(show, x + cellW / 2, cy3 + cellH - 6);
    }

    // answer chip on the right of band 3
    if (s.dist && s.dist[E] !== INF) {
      const ax = PAD + N * (cellW + cellGap) + 8;
      const aw = w - PAD - ax;
      if (aw > 110) {
        rr(ax, cy3, aw, cellH, 4);
        ctx.fillStyle = (s.popped === E || s.final) ? COLOR.ink : '#efefef';
        ctx.fill();
        ctx.fillStyle = (s.popped === E || s.final) ? '#ffd9c9' : COLOR.dim;
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('ANSWER dist[E]', ax + aw / 2, cy3 + 6);
        ctx.fillStyle = (s.popped === E || s.final) ? '#ffffff' : COLOR.ink;
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(s.dist[E]), ax + aw / 2, cy3 + cellH - 6);
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
    }, 1300);
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
