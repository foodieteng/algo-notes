/* ============================================================
   P474 石油 — virtual-source MST
   「開井」= 連到虛擬油源 0。加虛邊 (0,i,cᵢ) + 道路，對 N+1 點跑 Kruskal。
   Style: white paper background, solid-color fills.
   Example: N=3, c=[5,4,6], roads 1-2(1), 2-3(2). MST = roads 1+2 + drill@2(4) = 7。
   Three tidy horizontal bands, never overlapping:
     BAND 1  邊列表（排序後；綠=進MST、粉=跳過、tan=虛邊、藍=道路）
     BAND 2  圖：虛源 0（含 well 虛邊）+ 道路，Kruskal 上色
     BAND 3  計數：累計 total + 開井/修路決策 → 答案 7
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
    wellBg:  '#f6ead8',   // 虛邊（開井）
    wellSt:  '#d4a868',
    roadBg:  '#e3edf5',   // 道路
    roadSt:  '#8fb3d4',
    addBg:   '#d9e8c7',   // 進 MST
    addSt:   '#5fa866',
    skipBg:  '#f0d9d2',   // 跳過
    skipSt:  '#c97b7b',
    curBg:   '#f6d2c4',
    curSt:   '#d96e4e',
    srcBg:   '#1a1a1a',   // 油源節點 0
    text:    '#1f3550',
    ink:     '#1a1a1a',
    dim:     '#9a9a9a',
    coral:   '#d96e4e',
    green:   '#5fa866',
  };

  // example graph: nodes 0 (source) + 1,2,3
  const N = 3;
  // edges: {w, u, v, kind}  kind: 'well' | 'road'
  // sorted ascending by weight
  const EDGES = [
    { w: 1, u: 1, v: 2, kind: 'road' },
    { w: 2, u: 2, v: 3, kind: 'road' },
    { w: 4, u: 0, v: 2, kind: 'well' },   // drill at 2
    { w: 5, u: 0, v: 1, kind: 'well' },
    { w: 6, u: 0, v: 3, kind: 'well' },
  ];

  // node positions (0 = source at top center; 1,2,3 along a lower arc)
  const POS = {
    0: { x: 0.50, y: 0.16 },
    1: { x: 0.22, y: 0.82 },
    2: { x: 0.50, y: 0.82 },
    3: { x: 0.78, y: 0.82 },
  };

  // simulate Kruskal, record snapshots
  const steps = [];
  function st0() { return EDGES.map(() => 'pending'); }

  steps.push({
    cur: -1, states: st0(), par: [0, 1, 2, 3],
    total: 0, used: 0, picks: [],
    text: '<strong>INITIAL</strong> · 加虛擬油源 0。每國一條「開井」虛邊 (0,i,cᵢ)：' +
          '(0,1)=5、(0,2)=4、(0,3)=6。道路 1–2=1、2–3=2。全部邊排序。'
  });

  const par = [0, 1, 2, 3];
  function f(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
  const states = st0();
  let total = 0, used = 0;
  const picks = [];
  for (let i = 0; i < EDGES.length; i++) {
    const e = EDGES[i];
    const ru = f(e.u), rv = f(e.v);
    let txt;
    if (ru !== rv) {
      par[rv] = ru; total += e.w; used++;
      states[i] = 'add';
      picks.push(e);
      const what = e.kind === 'well' ? `在國家 ${e.v} 開井` : `建道路 ${e.u}–${e.v}`;
      txt = `<strong>邊 (${e.u===0?'源':e.u}–${e.v}, w=${e.w})</strong> · 不同塊 ⇒ <strong>選用</strong>（${what}）。total = ${total}，已用 ${used}/${N}。`;
      if (used === N) txt += ' 連滿 N 條，全國都連到油源 ⇒ 結束。';
    } else {
      states[i] = 'skip';
      txt = `<strong>邊 (${e.u===0?'源':e.u}–${e.v}, w=${e.w})</strong> · 已同塊 ⇒ 成環 ⇒ <strong>跳過</strong>。`;
    }
    steps.push({
      cur: i, states: states.slice(), par: par.slice(),
      total, used, picks: picks.slice(),
      text: txt
    });
    if (used === N) {
      // mark remaining as not-processed (leave pending)
      break;
    }
  }

  // final
  steps.push({
    cur: -1, states: states.slice(), par: par.slice(),
    total, used, picks: picks.slice(), final: true,
    text: `<strong>DONE</strong> · 選了 道路 1–2(1) + 道路 2–3(2) + 在國家 2 開井(4) = <strong>${total}</strong>。` +
          ` 比「各國各開井」(5+4+6=15) 省很多 —— MST 自動權衡開井 vs 修路。`
  });

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
    ctx.fillText('BAND 1 · 排序後的邊（tan = 開井虛邊 · 藍 = 道路 · 綠 = 進 MST · 粉 = 跳過）', PAD, band1Y);

    const ne = EDGES.length;
    const chipGap = 12;
    const chipW = Math.min(110, (w - PAD * 2 - (ne - 1) * chipGap) / ne);
    const chipH = 50;
    const cy1 = band1Y + 14;
    for (let i = 0; i < ne; i++) {
      const e = EDGES[i];
      const x = PAD + i * (chipW + chipGap);
      const stt = s.states[i];
      const isCur = s.cur === i;
      let bg, sk;
      if (stt === 'add') { bg = COLOR.addBg; sk = COLOR.addSt; }
      else if (stt === 'skip') { bg = COLOR.skipBg; sk = COLOR.skipSt; }
      else { // pending: tint by kind
        if (e.kind === 'well') { bg = COLOR.wellBg; sk = COLOR.wellSt; }
        else { bg = COLOR.roadBg; sk = COLOR.roadSt; }
      }
      if (isCur) { bg = COLOR.curBg; sk = COLOR.curSt; }
      rr(x, cy1, chipW, chipH, 4);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = isCur ? 2.8 : 1.5;
      ctx.strokeStyle = sk; ctx.stroke();
      // edge label
      const lab = (e.u === 0 ? '源' : e.u) + '–' + e.v;
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(lab, x + chipW / 2, cy1 + 6);
      ctx.fillStyle = COLOR.dim;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText('w=' + e.w, x + chipW / 2, cy1 + 24);
      const tag = stt === 'add' ? '● 選' : stt === 'skip' ? '× 跳過' : (isCur ? '… NOW' : (e.kind === 'well' ? '開井' : '道路'));
      ctx.fillStyle = stt === 'add' ? COLOR.green : stt === 'skip' ? COLOR.skipSt : (isCur ? COLOR.coral : COLOR.dim);
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(tag, x + chipW / 2, cy1 + chipH - 4);
    }

    // ───────────────────── BAND 2 · 圖 ─────────────────────
    const band2Y = 124;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · 圖（黑 = 虛擬油源 0 · tan 虛線 = 開井邊）· 同色 = 同連通塊', PAD, band2Y);

    const gx0 = PAD, gy0 = band2Y + 12;
    const gw = w - PAD * 2, gh = 198;
    const nx = id => gx0 + POS[id].x * gw;
    const ny = id => gy0 + POS[id].y * gh;
    const NR = 22;

    // edges
    for (let i = 0; i < ne; i++) {
      const e = EDGES[i];
      const stt = s.states[i];
      const isCur = s.cur === i;
      const x1 = nx(e.u), y1 = ny(e.u), x2 = nx(e.v), y2 = ny(e.v);
      let col, lw, dash;
      if (stt === 'add') { col = COLOR.addSt; lw = 3.4; dash = []; }
      else if (stt === 'skip') { col = COLOR.skipSt; lw = 2; dash = [5, 4]; }
      else { // pending
        if (e.kind === 'well') { col = COLOR.wellSt; lw = 1.8; dash = [6, 4]; }
        else { col = COLOR.roadSt; lw = 1.8; dash = []; }
      }
      if (isCur) { col = COLOR.curSt; lw = 3.6; }
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      // weight label
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      const lbl = String(e.w);
      const tw = ctx.measureText(lbl).width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - tw / 2 - 4, my - 9, tw + 8, 17);
      ctx.fillStyle = stt === 'add' ? COLOR.green : stt === 'skip' ? COLOR.skipSt : (isCur ? COLOR.coral : COLOR.dim);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, mx, my);
    }

    // component coloring (nodes 1..3 by DSU; node 0 special black)
    const roots = [];
    for (let vtx = 0; vtx <= N; vtx++) { const r = froot(s.par, vtx); if (!roots.includes(r)) roots.push(r); }
    const COMP = ['#e3edf5', '#f6ead8', '#d9e8c7', '#efe0ef'];
    const COMPST = ['#8fb3d4', '#d4a868', '#5fa866', '#b48fb4'];
    const compIdx = {}; roots.forEach((r, k) => compIdx[r] = k);

    for (let vtx = 0; vtx <= N; vtx++) {
      const cx = nx(vtx), cy = ny(vtx);
      if (vtx === 0) {
        // source node — black, with oil drop
        ctx.beginPath(); ctx.arc(cx, cy, NR, 0, Math.PI * 2);
        ctx.fillStyle = COLOR.srcBg; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
        ctx.fillStyle = '#ffd9c9';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('油源', cx, cy - 1);
        ctx.fillStyle = '#ffd9c9';
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillText('0', cx, cy + 12);
      } else {
        const k = compIdx[froot(s.par, vtx)] % COMP.length;
        // if same component as source (got oil) → tint green-ish via comp color of root 0
        const sameAsSrc = froot(s.par, vtx) === froot(s.par, 0);
        ctx.beginPath(); ctx.arc(cx, cy, NR, 0, Math.PI * 2);
        ctx.fillStyle = sameAsSrc ? COLOR.addBg : COMP[k];
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = sameAsSrc ? COLOR.addSt : COMPST[k]; ctx.stroke();
        ctx.fillStyle = COLOR.ink;
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(vtx), cx, cy);
      }
    }

    // ───────────────────── BAND 3 · 計數 ─────────────────────
    const band3Y = 358;
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 已選的邊 + 累計花費', PAD, band3Y);

    const by = band3Y + 16;
    const boxH = 46;
    let bx = PAD;
    const picks = s.picks || [];
    if (picks.length === 0) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('（尚未選任何邊）', PAD, by + boxH / 2);
    } else {
      for (let i = 0; i < picks.length; i++) {
        const e = picks[i];
        const cw = 96;
        rr(bx, by, cw, boxH, 4);
        ctx.fillStyle = e.kind === 'well' ? COLOR.wellBg : COLOR.roadBg;
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = e.kind === 'well' ? COLOR.wellSt : COLOR.roadSt;
        ctx.stroke();
        ctx.fillStyle = COLOR.dim;
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(e.kind === 'well' ? ('開井@' + e.v) : ('道路 ' + e.u + '–' + e.v), bx + cw / 2, by + 6);
        ctx.fillStyle = COLOR.ink;
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText('+' + e.w, bx + cw / 2, by + boxH - 6);
        bx += cw + 10;
        if (i < picks.length - 1) {
          ctx.fillStyle = COLOR.dim; ctx.font = '700 16px "JetBrains Mono", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('+', bx - 7, by + boxH / 2);
        }
      }
    }

    // total chip on right
    const tx = Math.max(bx + 6, w - PAD - 150);
    const tw2 = w - PAD - tx;
    if (tw2 > 110) {
      rr(tx, by, tw2, boxH, 4);
      ctx.fillStyle = (s.final || s.used === N) ? COLOR.ink : '#efefef';
      ctx.fill();
      ctx.fillStyle = (s.final || s.used === N) ? '#bfe3b0' : COLOR.dim;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('TOTAL (' + s.used + '/' + N + ' 邊)', tx + tw2 / 2, by + 6);
      ctx.fillStyle = (s.final || s.used === N) ? '#ffffff' : COLOR.ink;
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(s.total), tx + tw2 / 2, by + boxH - 5);
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
