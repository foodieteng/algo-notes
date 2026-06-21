/* ============================================================
   P472 最小生成樹 — Kruskal + DSU
   邊權由小到大，貪心加「不成環」的邊；並查集判環。
   Style: white paper background, solid-color fills.
   Sample: 5 nodes, 6 edges (sorted):
     (1-2,1)(2-3,2)(1-3,3 SKIP)(3-4,4)(4-5,5)(2-5,6 SKIP)  → MST = 12
   Three tidy horizontal bands, never overlapping:
     BAND 1  排序後的邊列表（pending / added / skipped / current）
     BAND 2  圖：節點依連通塊上色，加入邊綠、跳過邊粉、當前邊 coral
     BAND 3  連通塊 + 累計權和 total
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
    pendBg:   '#e3edf5',
    pendSt:   '#8fb3d4',
    addBg:    '#d9e8c7',
    addSt:    '#5fa866',
    skipBg:   '#f0d9d2',
    skipSt:   '#c97b7b',
    curBg:    '#f6d2c4',
    curSt:    '#d96e4e',
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
    coral:    '#d96e4e',
    green:    '#5fa866',
  };

  // component tint palette (muted), index by representative
  const COMP = ['#e3edf5', '#f6ead8', '#d9e8c7', '#efe0ef', '#e0efef'];
  const COMPST = ['#8fb3d4', '#d4a868', '#5fa866', '#b48fb4', '#8fb4b4'];

  // ── sample ──
  const N = 5;
  // edges already in sorted-by-weight order: [u, v, w]
  const EDGES = [
    [1, 2, 1],
    [2, 3, 2],
    [1, 3, 3],   // will be skipped (cycle)
    [3, 4, 4],
    [4, 5, 5],
    [2, 5, 6],   // will be skipped (cycle)
  ];

  // node positions (graph layout, pentagon-ish)
  const POS = {
    1: { x: 0.12, y: 0.30 },
    2: { x: 0.12, y: 0.78 },
    3: { x: 0.45, y: 0.54 },
    4: { x: 0.78, y: 0.30 },
    5: { x: 0.78, y: 0.78 },
  };

  // ── simulate Kruskal, record snapshots ──
  const steps = [];
  // edge state: 'pending' | 'added' | 'skipped'
  function initStates() { return EDGES.map(() => 'pending'); }

  steps.push({
    cur: -1, states: initStates(),
    par: Array.from({ length: N + 1 }, (_, i) => i),
    total: 0, used: 0,
    text: '<strong>INITIAL</strong> · 6 條邊已按權重由小到大排好。每個點各自一塊，準備依序嘗試。'
  });

  // DSU
  const par = Array.from({ length: N + 1 }, (_, i) => i);
  function find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
  const states = initStates();
  let total = 0, used = 0;

  for (let i = 0; i < EDGES.length; i++) {
    const [u, v, w] = EDGES[i];
    const ru = find(u), rv = find(v);
    if (ru !== rv) {
      par[rv] = ru;
      total += w; used++;
      states[i] = 'added';
      let txt = `<strong>邊 ${u}—${v} (w=${w})</strong> · find(${u})≠find(${v}) 不同塊 ⇒ ` +
                `<strong>加入 MST</strong>，total = ${total}，已用 ${used}/${N - 1} 條。`;
      const done = used === N - 1;
      if (done) txt += ' 連滿 N−1 條 ⇒ 結束。';
      steps.push({
        cur: i, states: states.slice(), par: par.slice(),
        total, used, text: txt
      });
      if (done) break;
    } else {
      states[i] = 'skipped';
      steps.push({
        cur: i, states: states.slice(), par: par.slice(),
        total, used,
        text: `<strong>邊 ${u}—${v} (w=${w})</strong> · find(${u})=find(${v}) 已同塊 ⇒ ` +
              `加了會成環 ⇒ <strong>跳過</strong>。total 不變 = ${total}。`
      });
    }
  }

  // final
  steps.push({
    cur: -1, states: states.slice(), par: par.slice(),
    total, used, final: true,
    text: `<strong>DONE</strong> · MST 取了 4 條邊（綠），跳過 2 條成環邊（粉）。` +
          `權重和 = 1+2+4+5 = <strong>${total}</strong>。`
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

  // find on a snapshot par array (no compression mutation)
  function froot(p, x) { while (p[x] !== x) x = p[x]; return x; }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const PAD = 26;

    // ───────────────────── BAND 1 · 排序後的邊列表 ─────────────────────
    const band1Y = 32;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 排序後的邊（由小到大依序嘗試）', PAD, band1Y);

    const ne = EDGES.length;
    const chipGap = 12;
    const chipW = Math.min(118, (w - PAD * 2 - (ne - 1) * chipGap) / ne);
    const chipH = 46;
    const cy1 = band1Y + 14;
    for (let i = 0; i < ne; i++) {
      const [u, v, ww] = EDGES[i];
      const x = PAD + i * (chipW + chipGap);
      const st = s.states[i];
      const isCur = s.cur === i;
      let bg = COLOR.pendBg, sk = COLOR.pendSt;
      if (st === 'added') { bg = COLOR.addBg; sk = COLOR.addSt; }
      else if (st === 'skipped') { bg = COLOR.skipBg; sk = COLOR.skipSt; }
      if (isCur) { bg = COLOR.curBg; sk = COLOR.curSt; }
      rr(x, cy1, chipW, chipH, 4);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = isCur ? 2.8 : 1.5;
      ctx.strokeStyle = sk; ctx.stroke();
      // edge
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(`${u}—${v}`, x + chipW / 2, cy1 + 6);
      // weight
      ctx.fillStyle = COLOR.text;
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText('w=' + ww, x + chipW / 2, cy1 + 24);
      // state tag
      const tag = st === 'added' ? '✓ ADD' : st === 'skipped' ? '× SKIP' : (isCur ? '… NOW' : '');
      if (tag) {
        ctx.fillStyle = st === 'added' ? COLOR.green : st === 'skipped' ? COLOR.skipSt : COLOR.coral;
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(tag, x + chipW / 2, cy1 + chipH - 3);
      }
    }

    // ───────────────────── BAND 2 · 圖 ─────────────────────
    const band2Y = 118;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · 圖（同色 = 同連通塊）· 綠邊 = MST、粉邊 = 跳過', PAD, band2Y);

    const gx0 = PAD, gy0 = band2Y + 14;
    const gw = w - PAD * 2, gh = 196;
    const nx = id => gx0 + POS[id].x * gw;
    const ny = id => gy0 + POS[id].y * gh;
    const NR = 21;

    // assign component color index by root order
    const roots = [];
    for (let vtx = 1; vtx <= N; vtx++) { const r = froot(s.par, vtx); if (!roots.includes(r)) roots.push(r); }
    const compIdx = {};
    roots.forEach((r, k) => compIdx[r] = k);

    // edges
    for (let i = 0; i < ne; i++) {
      const [u, v] = EDGES[i];
      const st = s.states[i];
      const isCur = s.cur === i;
      // only draw edges that are pending(faint), added(green), skipped(pink dashed), current(coral)
      const x1 = nx(u), y1 = ny(u), x2 = nx(v), y2 = ny(v);
      let col = COLOR.pendSt, lw = 1.4, dash = [];
      if (st === 'added') { col = COLOR.addSt; lw = 3.2; }
      else if (st === 'skipped') { col = COLOR.skipSt; lw = 2; dash = [6, 4]; }
      if (isCur) { col = COLOR.curSt; lw = 3.4; }
      if (st === 'pending' && !isCur) { col = '#dfe6ec'; lw = 1.2; }
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      // weight label at mid w/ white bg
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const lbl = String(EDGES[i][2]);
      ctx.font = '700 12px "JetBrains Mono", monospace';
      const tw = ctx.measureText(lbl).width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - tw / 2 - 4, my - 9, tw + 8, 17);
      ctx.fillStyle = (st === 'added') ? COLOR.green : (st === 'skipped') ? COLOR.skipSt : (isCur ? COLOR.coral : COLOR.dim);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, mx, my);
    }

    // nodes (colored by component)
    for (let vtx = 1; vtx <= N; vtx++) {
      const cx = nx(vtx), cy = ny(vtx);
      const r = froot(s.par, vtx);
      const k = compIdx[r] % COMP.length;
      ctx.beginPath(); ctx.arc(cx, cy, NR, 0, Math.PI * 2);
      ctx.fillStyle = COMP[k]; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = COMPST[k]; ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(vtx), cx, cy);
    }

    // ───────────────────── BAND 3 · 連通塊 + 權和 ─────────────────────
    const band3Y = 360;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 連通塊 + 累計權和', PAD, band3Y);

    // group members by root
    const groups = {};
    for (let vtx = 1; vtx <= N; vtx++) { const r = froot(s.par, vtx); (groups[r] = groups[r] || []).push(vtx); }
    let bx = PAD;
    const by = band3Y + 14;
    const bh3 = 38;
    roots.forEach((r) => {
      const members = groups[r];
      const k = compIdx[r] % COMP.length;
      const label = '{' + members.join(',') + '}';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width;
      const cw = tw + 22;
      rr(bx, by, cw, bh3, 4);
      ctx.fillStyle = COMP[k]; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = COMPST[k]; ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + cw / 2, by + bh3 / 2);
      bx += cw + 12;
    });

    // total chip on the right
    const tx = Math.max(bx + 8, w - PAD - 200);
    const tw2 = w - PAD - tx;
    if (tw2 > 120) {
      rr(tx, by, tw2, bh3, 4);
      ctx.fillStyle = (s.final || (s.used === N - 1)) ? COLOR.ink : '#efefef';
      ctx.fill();
      ctx.fillStyle = (s.final || (s.used === N - 1)) ? '#ffd9c9' : COLOR.dim;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('MST total (' + s.used + '/' + (N - 1) + ' 邊)', tx + tw2 / 2, by + 5);
      ctx.fillStyle = (s.final || (s.used === N - 1)) ? '#ffffff' : COLOR.ink;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(s.total), tx + tw2 / 2, by + bh3 - 5);
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
