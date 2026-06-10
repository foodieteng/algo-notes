/* ============================================================
   P369 玩電梯 — counting DP with range transition (diff array).
   cur[f] = #ways to be on floor f. Each ride spreads cur[x] to the
   contiguous range [x-d+1, x+d-1] (d=|x-b|), minus y==x.
   Style: white paper background, solid fills, three tidy bands:
     BAND 1  cur[] before this ride (source x highlighted)
     BAND 2  the legal landing range bracket [x-d+1, x+d-1]
     BAND 3  nxt[] accumulating after the ride + answer
   Walks sample n=8, a=2, b=5, K=2 -> 5.
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
    src:      '#d96e4e', srcBg: '#f7ddd2',   // spreading source x
    range:    '#8fb3d4', rangeBg: '#e3edf5', // legal landing range
    acc:      '#5fa866', accBg: '#d9e8c7',    // accumulating result
    ban:      '#d96e4e',                       // forbidden floor b
    banBg:    '#f0d9d2',
    zero:     '#cfcfcf',
    text:     '#1f3550', ink: '#1a1a1a', dim: '#9a9a9a',
  };

  const n = 8, a = 2, b = 5;
  const K = 2;

  // ── build steps by simulating, snapshotting source spreads ──
  const steps = [];
  function snap(o) { steps.push(o); }

  function arr0() { return new Array(n + 1).fill(0); }

  let cur = arr0(); cur[a] = 1;

  snap({
    cur: cur.slice(), nxt: null, ride: 0, src: null, range: null,
    text: '<strong>INITIAL</strong> · 只有起點 a=' + a + ' 有 1 種方法（其餘 0）。禁止樓層 b=' + b + '（紅）。',
  });

  for (let s = 0; s < K; s++) {
    const before = cur.slice();
    let nxt = arr0();
    // list sources in floor order
    const srcs = [];
    for (let x = 1; x <= n; x++) if (before[x]) srcs.push(x);

    srcs.forEach((x, idx) => {
      const d = Math.abs(x - b);
      const lo = Math.max(1, x - d + 1), hi = Math.min(n, x + d - 1);
      // apply spread (range add, minus self)
      for (let y = lo; y <= hi; y++) if (y !== x) nxt[y] += before[x];
      snap({
        cur: before.slice(), nxt: nxt.slice(), ride: s + 1,
        src: x, d, range: [lo, hi], stuck: (lo === hi),
        text: `<strong>第 ${s + 1} 趟 · 從 x=${x} 散播</strong>（cur=${before[x]}）：d=|${x}−${b}|=${d}，` +
              `合法落點 [${lo}, ${hi}]` + (lo === hi ? '（只剩自己 ⇒ 扣掉後無落點，<strong>卡住</strong>）' :
              `，扣掉 y=${x} ⇒ 把 ${before[x]} 灑到其餘格`),
      });
    });

    cur = nxt;
    snap({
      cur: nxt.slice(), nxt: null, ride: s + 1, src: null, range: null, settled: true,
      text: `<strong>第 ${s + 1} 趟完成</strong>：cur[] 更新。` +
            (s + 1 < K ? '繼續下一趟。' : '已搭滿 K 趟。'),
    });
  }

  const total = cur.reduce((p, v) => p + v, 0);
  snap({
    cur: cur.slice(), nxt: null, ride: K, src: null, range: null, done: true, answer: total,
    text: `<strong>答案 = Σ cur[f] = ${cur.slice(1).filter(v => v).join(' + ')} = ${total}</strong>。停在任一樓層都算一種搭法。`,
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

  // draw a floor-array row; returns the geometry used
  function drawArray(arr, gy, opts) {
    const w = canvas.clientWidth;
    const PAD = 26, labelW = 0;
    const cell = Math.min(58, (w - PAD * 2) / n);
    const gridW = cell * n;
    const gx = (w - gridW) / 2;
    for (let f = 1; f <= n; f++) {
      const x = gx + (f - 1) * cell;
      let bg = COLOR.cellBg, st = COLOR.grid, lw = 1;
      if (f === b) { bg = COLOR.banBg; st = COLOR.ban; lw = 1.5; }
      if (opts.range && f >= opts.range[0] && f <= opts.range[1] && f !== opts.src) { bg = COLOR.rangeBg; st = COLOR.range; lw = 2; }
      if (opts.src === f) { bg = COLOR.srcBg; st = COLOR.src; lw = 2.5; }
      if (opts.acc && arr[f] > 0 && !opts.range && opts.src == null) { bg = COLOR.accBg; st = COLOR.acc; lw = 1.5; }
      ctx.fillStyle = bg; ctx.fillRect(x + 2, gy, cell - 4, cell - 4);
      ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.strokeRect(x + 2.5, gy + 0.5, cell - 5, cell - 5);
      // value (or '禁' for b)
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (f === b) {
        ctx.fillStyle = COLOR.ban; ctx.font = '700 ' + Math.round(cell * 0.3) + 'px "Noto Sans TC", sans-serif';
        ctx.fillText('禁', x + cell / 2, gy + (cell - 4) / 2);
      } else {
        ctx.fillStyle = arr[f] > 0 ? COLOR.ink : COLOR.zero;
        ctx.font = '700 ' + Math.round(cell * 0.34) + 'px "JetBrains Mono", monospace';
        ctx.fillText(String(arr[f]), x + cell / 2, gy + (cell - 4) / 2);
      }
      // floor index
      ctx.fillStyle = COLOR.dim; ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(String(f), x + cell / 2, gy + cell - 1);
    }
    return { gx, cell, gridW };
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, canvas.clientHeight);

    const PAD = 26;
    const band1Y = 32, band2Y = 168, band3Y = 320;

    // ───────────────── BAND 1 · cur[] before ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · cur[f] = 停在樓層 f 的方法數' + (s.ride ? '（第 ' + s.ride + ' 趟前）' : ''), PAD, band1Y);
    const g1 = drawArray(s.cur, band1Y + 22, { src: s.src, range: s.range, acc: s.settled || s.done });

    // ───────────────── BAND 2 · range bracket ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · 合法落點區間 [x−d+1, x+d−1]（碰不到禁止樓層 b）', PAD, band2Y);

    if (s.src != null && s.range) {
      const { gx, cell } = g1;
      const x0 = gx + (s.range[0] - 1) * cell + 4;
      const x1 = gx + (s.range[1] - 1) * cell + cell - 4;
      const sx = gx + (s.src - 1) * cell + cell / 2;
      const srcLabelY = band2Y + 26;       // source label sits clear below the band title
      const by = band2Y + 56;              // bracket top
      // bracket
      ctx.strokeStyle = COLOR.range; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, by + 10); ctx.lineTo(x0, by); ctx.lineTo(x1, by); ctx.lineTo(x1, by + 10);
      ctx.stroke();
      // source marker down from x
      ctx.strokeStyle = COLOR.src; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, srcLabelY + 4); ctx.lineTo(sx, by); ctx.stroke();
      ctx.fillStyle = COLOR.src; ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('x=' + s.src + ' (d=' + s.d + ')', sx, srcLabelY);
      // range label
      ctx.fillStyle = COLOR.range; ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('[' + s.range[0] + ', ' + s.range[1] + ']  把 cur[' + s.src + ']=' + s.cur[s.src] + ' 灑進去（扣 y=' + s.src + '）',
        (x0 + x1) / 2, by + 16);
      if (s.stuck) {
        ctx.fillStyle = COLOR.src; ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.fillText('區間只剩自己 → 無落點，這條路卡住', (x0 + x1) / 2, by + 38);
      }
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('條件 |y−x| < |b−x| ⟺ y 落在以 x 為中心、半徑 d−1 的連續區間（碰不到 b）。', PAD, band2Y + 44);
    }

    // ───────────────── BAND 3 · nxt[] / answer ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s.done ? 'BAND 3 · 答案 = Σ cur[f]' : 'BAND 3 · nxt[f] = 本趟累積中的方法數', PAD, band3Y);

    if (s.nxt) {
      drawArray(s.nxt, band3Y + 22, { src: null, range: null, acc: true });
    } else if (s.done) {
      drawArray(s.cur, band3Y + 22, { src: null, range: null, acc: true });
      ctx.fillStyle = COLOR.acc;
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Σ = ' + s.answer, PAD, band3Y + 22 + 58 + 20);
    } else if (s.settled) {
      drawArray(s.cur, band3Y + 22, { src: null, range: null, acc: true });
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('每趟把所有來源的區間貢獻累加，得到下一趟的 cur[]。', PAD, band3Y + 44);
    }
  }

  function update() {
    const s = steps[step];
    if (stepEl) stepEl.textContent = String(step).padStart(2, '0') + ' / ' + String(steps.length - 1).padStart(2, '0');
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
