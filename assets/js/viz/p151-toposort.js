/* ============================================================
   P151 陣線推進 — lexicographically smallest topological order
   min-heap Kahn: 反覆從「目前 indeg=0 的點」取編號最小者。
   Style: white paper background, solid-color fills.
   Sample: n=5, edges 0→1, 3→2 (攻 1 前先攻 0；攻 2 前先攻 3).
   Output 0 1 3 2 4 — 2 比 3 小卻被迫延後（還欠前置 3）。
   Three tidy horizontal bands, never overlapping:
     BAND 1  the 5 陣地 nodes (number + 現在 indeg + 狀態色)
     BAND 2  the min-heap contents (sorted chips, min highlighted)
     BAND 3  the built output 序列 (order)
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
    blockBg:  '#e3edf5',   // indeg > 0 (還欠前置)
    blockSt:  '#8fb3d4',
    heapBg:   '#d9e8c7',   // 在堆裡（可選）
    heapSt:   '#5fa866',
    popBg:    '#f6d2c4',   // 本步取出
    popSt:    '#d96e4e',
    doneBg:   '#ececec',   // 已輸出
    doneSt:   '#b8b8b8',
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
    coral:    '#d96e4e',
    green:    '#5fa866',
  };

  // ── sample graph ──
  const N = 5;
  const EDGES = [[0, 1], [3, 2]];        // a → b
  const adj = Array.from({ length: N }, () => []);
  const indeg0 = new Array(N).fill(0);
  for (const [a, b] of EDGES) { adj[a].push(b); indeg0[b]++; }

  // ── simulate min-heap Kahn, recording a snapshot per logical move ──
  // state per node: 'block' | 'heap' | 'pop' | 'done'
  const steps = [];
  function statesFrom(indeg, inHeap, done, popped) {
    const st = [];
    for (let v = 0; v < N; v++) {
      if (v === popped) st.push('pop');
      else if (done.has(v)) st.push('done');
      else if (inHeap.has(v)) st.push('heap');
      else st.push('block');
    }
    return st;
  }
  function heapSorted(inHeap) {
    return Array.from(inHeap).sort((a, b) => a - b);
  }

  // INITIAL — indeg computed, nothing seeded yet
  {
    const indeg = indeg0.slice();
    steps.push({
      indeg, states: statesFrom(indeg, new Set(), new Set(), -1),
      heap: [], order: [], popped: -1,
      text: '<strong>INITIAL</strong> · 算好入度 indeg=[0,1,1,0,0]。' +
            '1 欠前置 0、2 欠前置 3 ⇒ 它們暫時不能選。'
    });
  }

  const indeg = indeg0.slice();
  const inHeap = new Set();
  const done = new Set();
  const order = [];

  // SEED
  for (let v = 0; v < N; v++) if (indeg[v] === 0) inHeap.add(v);
  steps.push({
    indeg: indeg.slice(), states: statesFrom(indeg, inHeap, done, -1),
    heap: heapSorted(inHeap), order: order.slice(), popped: -1,
    text: '<strong>SEED</strong> · 把 indeg=0 的 {0, 3, 4} 推進 min-heap，' +
          '堆頂永遠是目前可選的最小編號。'
  });

  // main loop
  while (inHeap.size > 0) {
    // pop the smallest
    const sorted = heapSorted(inHeap);
    const u = sorted[0];
    inHeap.delete(u);

    // snapshot: u popped (before relaxation), still shown as 'pop'
    const relaxed = [];   // [node, newIndeg, unlocked]
    for (const w of adj[u]) {
      indeg[w]--;
      const unlocked = indeg[w] === 0;
      if (unlocked) inHeap.add(w);
      relaxed.push([w, indeg[w], unlocked]);
    }
    order.push(u);
    done.add(u);

    let txt = `<strong>POP ${u}</strong> · 取堆頂（目前可選的最小）→ 加入輸出。`;
    if (relaxed.length) {
      const parts = relaxed.map(([w, d, ok]) =>
        `indeg[${w}]→${d}` + (ok ? ' <strong>解鎖→進堆</strong>' : ''));
      txt += ' 鬆弛 ' + parts.join('、') + '。';
    } else {
      txt += ' 它沒有解鎖任何陣地。';
    }
    // special callout when 3 is taken before 2
    if (u === 3) txt += ' 注意：2 比 3 小，但此刻 2 還欠前置，<strong>不在堆裡</strong>，只能等。';
    if (u === 2) txt += ' 2 此時才被解鎖、排進序列 ——<strong>排在 3 之後</strong>。';

    steps.push({
      indeg: indeg.slice(), states: statesFrom(indeg, inHeap, done, u),
      heap: heapSorted(inHeap), order: order.slice(), popped: u,
      text: txt
    });
  }

  // DONE
  steps.push({
    indeg: indeg.slice(), states: statesFrom(indeg, inHeap, done, -1),
    heap: [], order: order.slice(), popped: -1,
    text: `<strong>DONE</strong> · 堆空、共輸出 ${order.length} 個 = n ⇒ 合法。` +
          `答案 = ${order.join(' ')}（若個數 &lt; n 就代表有環 ⇒ QAQ）。`
  });

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 430;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width  = bw;
      canvas.height = bh;
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

  function fillFor(state) {
    if (state === 'pop')  return [COLOR.popBg, COLOR.popSt];
    if (state === 'heap') return [COLOR.heapBg, COLOR.heapSt];
    if (state === 'done') return [COLOR.doneBg, COLOR.doneSt];
    return [COLOR.blockBg, COLOR.blockSt];
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const PAD = 26;
    const band1Y = 34;    // nodes title baseline
    const band2Y = 210;   // heap title baseline
    const band3Y = 318;   // order title baseline

    // ───────────────────── BAND 1 · 陣地節點 ─────────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · ' + N + ' 個陣地（數字下方 = 現在的 indeg 入度）', PAD, band1Y);

    const nbR = 26;
    const nbGap = Math.min(46, (w - PAD * 2 - N * nbR * 2) / (N - 1));
    const nbTotalW = N * (nbR * 2) + (N - 1) * nbGap;
    const nbStartX = (w - nbTotalW) / 2;
    const nbCY = band1Y + 30 + nbR;

    // draw dependency arrows first (behind nodes): 0→1, 3→2
    const cxOf = v => nbStartX + v * (nbR * 2 + nbGap) + nbR;
    function arrow(a, b) {
      const x1 = cxOf(a), x2 = cxOf(b), y = nbCY;
      const dir = Math.sign(x2 - x1);
      const sx = x1 + dir * nbR, ex = x2 - dir * nbR;
      const lift = 40;
      ctx.strokeStyle = COLOR.dim;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx, y - nbR + 4);
      ctx.bezierCurveTo(sx, y - nbR - lift, ex, y - nbR - lift, ex, y - nbR + 4);
      ctx.stroke();
      // arrowhead at ex
      const ah = 6;
      ctx.fillStyle = COLOR.dim;
      ctx.beginPath();
      ctx.moveTo(ex, y - nbR + 4);
      ctx.lineTo(ex - ah * dir - dir, y - nbR - 4);
      ctx.lineTo(ex + ah * dir - dir, y - nbR - 4);
      ctx.closePath();
      ctx.fill();
    }
    for (const [a, b] of EDGES) arrow(a, b);

    for (let v = 0; v < N; v++) {
      const cx = cxOf(v);
      const [bg, st] = fillFor(s.states[v]);
      ctx.beginPath();
      ctx.arc(cx, nbCY, nbR, 0, Math.PI * 2);
      ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = (s.states[v] === 'pop') ? 3 : 2;
      ctx.strokeStyle = st; ctx.stroke();
      // node number
      ctx.fillStyle = (s.states[v] === 'done') ? COLOR.dim : COLOR.ink;
      ctx.font = '700 19px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(v), cx, nbCY - 1);
      // indeg below
      ctx.fillStyle = (s.indeg[v] === 0 && s.states[v] === 'block') ? COLOR.green : COLOR.dim;
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('in=' + s.indeg[v], cx, nbCY + nbR + 8);
    }

    // legend row
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const legY = nbCY + nbR + 34;
    let lx = nbStartX;
    const legend = [
      ['block', '欠前置'], ['heap', '可選'], ['pop', '本步取出'], ['done', '已輸出']
    ];
    for (const [stt, lab] of legend) {
      const [bg, st] = fillFor(stt);
      ctx.fillStyle = bg; rr(lx, legY - 7, 14, 14, 3); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = st; ctx.stroke();
      ctx.fillStyle = COLOR.dim;
      ctx.fillText(lab, lx + 20, legY);
      lx += 20 + ctx.measureText(lab).width + 22;
    }

    // ───────────────────── BAND 2 · min-heap ─────────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · min-heap（可選集合 · 已排序，左端 = 堆頂最小）', PAD, band2Y);

    const heap = s.heap;
    const chipW = 46, chipH = 44, chipGap = 14;
    const hy = band2Y + 16;
    if (heap.length === 0) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('（空）', PAD, hy + 12);
    } else {
      let hx = PAD;
      for (let i = 0; i < heap.length; i++) {
        const isMin = i === 0;
        rr(hx, hy, chipW, chipH, 4);
        ctx.fillStyle = isMin ? COLOR.popBg : COLOR.heapBg;
        ctx.fill();
        ctx.lineWidth = isMin ? 2.5 : 1.5;
        ctx.strokeStyle = isMin ? COLOR.popSt : COLOR.heapSt;
        ctx.stroke();
        ctx.fillStyle = COLOR.ink;
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(heap[i]), hx + chipW / 2, hy + chipH / 2);
        hx += chipW + chipGap;
      }
      // "↑ 堆頂" marker under min chip
      ctx.fillStyle = COLOR.coral;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('↑ top', PAD + chipW / 2, hy + chipH + 6);
    }

    // ───────────────────── BAND 3 · 輸出序列 ─────────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 輸出序列 order（字典序最小的攻破順序）', PAD, band3Y);

    const ord = s.order;
    const oy = band3Y + 16;
    if (ord.length === 0) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('（尚無輸出）', PAD, oy + 12);
    } else {
      let ox = PAD;
      for (let i = 0; i < ord.length; i++) {
        const justAdded = (i === ord.length - 1) && (s.popped === ord[i]);
        rr(ox, oy, chipW, chipH, 4);
        ctx.fillStyle = justAdded ? COLOR.popBg : COLOR.doneBg;
        ctx.fill();
        ctx.lineWidth = justAdded ? 2.5 : 1.5;
        ctx.strokeStyle = justAdded ? COLOR.popSt : COLOR.doneSt;
        ctx.stroke();
        ctx.fillStyle = justAdded ? COLOR.ink : '#555';
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(ord[i]), ox + chipW / 2, oy + chipH / 2);
        // position index
        ctx.fillStyle = COLOR.dim;
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('#' + i, ox + chipW / 2, oy + chipH + 5);
        ox += chipW + chipGap;
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
