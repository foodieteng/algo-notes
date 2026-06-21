/* ============================================================
   P473 道路工程 — min deletions to make MST unique (cost unchanged)
   每權重類別：冗餘 = 候選邊數 − 實際合併數。加總即答案。
   Style: white paper background, solid-color fills.
   Sample 2: 3 nodes, 3 edges all weight 1 (三角形). 候選 3、合併 2 ⇒ 冗餘 1。
   Three tidy horizontal bands, never overlapping:
     BAND 1  邊列表（pending / merge / redundant / current）
     BAND 2  三角形圖：節點依連通塊上色，合併邊綠、冗餘邊粉虛線
     BAND 3  計數：候選 / 合併 / 冗餘 → 答案
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
    pendBg:  '#e3edf5',
    pendSt:  '#8fb3d4',
    mergeBg: '#d9e8c7',
    mergeSt: '#5fa866',
    redBg:   '#f0d9d2',
    redSt:   '#c97b7b',
    curBg:   '#f6d2c4',
    curSt:   '#d96e4e',
    text:    '#1f3550',
    ink:     '#1a1a1a',
    dim:     '#9a9a9a',
    coral:   '#d96e4e',
    green:   '#5fa866',
  };

  // component tint
  const COMP = ['#e3edf5', '#f6ead8', '#d9e8c7'];
  const COMPST = ['#8fb3d4', '#d4a868', '#5fa866'];

  // ── sample 2 ──
  const N = 3;
  const EDGES = [
    [1, 2, 1],
    [2, 3, 1],
    [3, 1, 1],
  ];
  const POS = {
    1: { x: 0.50, y: 0.16 },
    2: { x: 0.16, y: 0.82 },
    3: { x: 0.84, y: 0.82 },
  };

  // ── simulate: collect candidates (all 3, since组前 all different), then union ──
  const steps = [];
  function st0() { return EDGES.map(() => 'pending'); }

  steps.push({
    cur: -1, states: st0(), par: [0, 1, 2, 3],
    candCount: 0, mergeCount: 0, phase: 'init',
    text: '<strong>INITIAL</strong> · 3 條邊都是權重 1，同一個權重類別。三點各自一塊。'
  });

  // candidate collection (uses 組前 DSU = all separate → all 3 are candidates)
  const par0 = [0, 1, 2, 3];
  function f0(x) { while (par0[x] !== x) x = par0[x]; return x; }
  // all candidates (find differs for all in 組前 state)
  steps.push({
    cur: -1, states: st0(), par: [0, 1, 2, 3],
    candCount: 3, mergeCount: 0, phase: 'collect',
    text: '<strong>收集候選</strong> · 用「組前」DSU 判定：三點互不同塊 ⇒ 三條都是候選邊（候選 = 3）。'
  });

  // now union them one by one
  const par = [0, 1, 2, 3];
  function f(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
  const states = st0();
  let merges = 0;
  const order = [0, 1, 2]; // edge indices in this group
  for (let idx = 0; idx < order.length; idx++) {
    const ei = order[idx];
    const [u, v] = EDGES[ei];
    const ru = f(u), rv = f(v);
    let did = false;
    if (ru !== rv) { par[rv] = ru; merges++; did = true; states[ei] = 'merge'; }
    else { states[ei] = 'redundant'; }
    let txt;
    if (did) txt = `<strong>邊 ${u}—${v}</strong> · find(${u})≠find(${v}) ⇒ <strong>合併</strong>（進 MST）。合併數 = ${merges}。`;
    else txt = `<strong>邊 ${u}—${v}</strong> · find(${u})=find(${v}) 已同塊 ⇒ <strong>冗餘</strong>（加了成環、可換）⇒ 要刪。`;
    steps.push({
      cur: ei, states: states.slice(), par: par.slice(),
      candCount: 3, mergeCount: merges, phase: 'merge',
      text: txt
    });
  }

  // final
  steps.push({
    cur: -1, states: states.slice(), par: par.slice(),
    candCount: 3, mergeCount: merges, phase: 'done', final: true,
    text: `<strong>DONE</strong> · 冗餘 = 候選 ${3} − 合併 ${merges} = <strong>${3 - merges}</strong>。` +
          ` 刪 1 條後剩 2 條成一條路徑 ⇒ MST 唯一、最小花費不變。`
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

  function froot(p, x) { while (p[x] !== x) x = p[x]; return x; }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const PAD = 28;

    // ───────────────────── BAND 1 · 邊列表 ─────────────────────
    const band1Y = 32;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 權重 1 類別的 3 條邊（綠 = 合併進 MST · 粉 = 冗餘要刪）', PAD, band1Y);

    const ne = EDGES.length;
    const chipW = 130, chipGap = 16, chipH = 48;
    const cy1 = band1Y + 14;
    for (let i = 0; i < ne; i++) {
      const [u, v, ww] = EDGES[i];
      const x = PAD + i * (chipW + chipGap);
      const stt = s.states[i];
      const isCur = s.cur === i;
      let bg = COLOR.pendBg, sk = COLOR.pendSt;
      if (stt === 'merge') { bg = COLOR.mergeBg; sk = COLOR.mergeSt; }
      else if (stt === 'redundant') { bg = COLOR.redBg; sk = COLOR.redSt; }
      if (isCur) { bg = COLOR.curBg; sk = COLOR.curSt; }
      rr(x, cy1, chipW, chipH, 4);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = isCur ? 2.8 : 1.5;
      ctx.strokeStyle = sk; ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(`${u}—${v}`, x + chipW / 2, cy1 + 7);
      ctx.fillStyle = COLOR.dim;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText('w=' + ww, x + chipW / 2, cy1 + 26);
      const tag = stt === 'merge' ? '● MERGE' : stt === 'redundant' ? '× 冗餘 DELETE' : (isCur ? '… NOW' : 'pending');
      ctx.fillStyle = stt === 'merge' ? COLOR.green : stt === 'redundant' ? COLOR.redSt : (isCur ? COLOR.coral : COLOR.dim);
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(tag, x + chipW / 2, cy1 + chipH - 4);
    }

    // ───────────────────── BAND 2 · 三角形圖 ─────────────────────
    const band2Y = 118;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · 圖（同色 = 同連通塊）', PAD, band2Y);

    const gx0 = PAD, gy0 = band2Y + 12;
    const gw = w - PAD * 2, gh = 196;
    const nx = id => gx0 + POS[id].x * gw;
    const ny = id => gy0 + POS[id].y * gh;
    const NR = 22;

    // edges
    for (let i = 0; i < ne; i++) {
      const [u, v] = EDGES[i];
      const stt = s.states[i];
      const isCur = s.cur === i;
      const x1 = nx(u), y1 = ny(u), x2 = nx(v), y2 = ny(v);
      let col = COLOR.pendSt, lw = 1.6, dash = [];
      if (stt === 'merge') { col = COLOR.mergeSt; lw = 3.4; }
      else if (stt === 'redundant') { col = COLOR.redSt; lw = 2.4; dash = [7, 4]; }
      if (isCur) { col = COLOR.curSt; lw = 3.6; }
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      // weight label
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      const lbl = '1';
      const tw = ctx.measureText(lbl).width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - tw / 2 - 4, my - 9, tw + 8, 17);
      ctx.fillStyle = stt === 'merge' ? COLOR.green : stt === 'redundant' ? COLOR.redSt : (isCur ? COLOR.coral : COLOR.dim);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, mx, my);
    }

    // component coloring
    const roots = [];
    for (let vtx = 1; vtx <= N; vtx++) { const r = froot(s.par, vtx); if (!roots.includes(r)) roots.push(r); }
    const compIdx = {}; roots.forEach((r, k) => compIdx[r] = k);

    for (let vtx = 1; vtx <= N; vtx++) {
      const cx = nx(vtx), cy = ny(vtx);
      const k = compIdx[froot(s.par, vtx)] % COMP.length;
      ctx.beginPath(); ctx.arc(cx, cy, NR, 0, Math.PI * 2);
      ctx.fillStyle = COMP[k]; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = COMPST[k]; ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(vtx), cx, cy);
    }

    // ───────────────────── BAND 3 · 計數 ─────────────────────
    const band3Y = 352;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 冗餘 = 候選 − 合併', PAD, band3Y);

    const by = band3Y + 16;
    const boxH = 48;
    function tallyBox(x, wch, lab, val, bg, st, valCol) {
      rr(x, by, wch, boxH, 4);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = st; ctx.stroke();
      ctx.fillStyle = COLOR.dim;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(lab, x + wch / 2, by + 6);
      ctx.fillStyle = valCol || COLOR.ink;
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(val, x + wch / 2, by + boxH - 6);
    }

    const redundant = (s.phase === 'done' || s.phase === 'merge') ? (s.candCount - s.mergeCount) : 0;
    let bx = PAD;
    tallyBox(bx, 96, '候選 cand', String(s.candCount), COLOR.pendBg, COLOR.pendSt); bx += 96;
    ctx.fillStyle = COLOR.dim; ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('−', bx + 14, by + boxH / 2); bx += 28;
    tallyBox(bx, 96, '合併 merge', String(s.mergeCount), COLOR.mergeBg, COLOR.mergeSt); bx += 96;
    ctx.fillStyle = COLOR.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('=', bx + 16, by + boxH / 2); bx += 32;
    tallyBox(bx, 110, '冗餘 = 要刪', (s.phase === 'init' || s.phase === 'collect') ? '·' : String(redundant),
      COLOR.redBg, COLOR.redSt, COLOR.coral); bx += 110 + 18;

    // answer chip when done
    if (s.final) {
      const ax = Math.max(bx, w - PAD - 150);
      const aw = w - PAD - ax;
      if (aw > 110) {
        rr(ax, by, aw, boxH, 4);
        ctx.fillStyle = COLOR.ink; ctx.fill();
        ctx.fillStyle = '#bfe3b0';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('OUTPUT 刪除數', ax + aw / 2, by + 6);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(redundant), ax + aw / 2, by + boxH - 6);
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
    }, 1400);
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
