/* ============================================================
   P369 玩電梯 — counting DP on the DISTANCE axis with suffix sums.
   State f[a] = #ways to be at distance a=|x-B| from the forbidden
   floor B (only the side containing S survives, since you can never
   cross B). Each ride: target a' collects the SUFFIX {a >= amin},
   amin = ceil((a'+1)/2), minus the self term f[a']:
       nf[a'] = suf[amin] - f[a']
   Style: white paper, solid fills, three tidy horizontal bands:
     BAND 1  f[a] this ride — target a' (coral), suffix [amin,L] (blue), threshold marker
     BAND 2  the arithmetic   suf[amin] - f[a'] = nf[a']
     BAND 3  nf[a] accumulating after the ride + answer
   Walks sample N=8, S=2, B=5, K=2 (side below B): L=4, a0=3 -> 5.
   Distance a maps to floor B-a (=5-a): a=1->floor4 ... a=4->floor1.
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
    tgt:      '#d96e4e', tgtBg: '#f7ddd2',   // target a' being computed
    suf:      '#8fb3d4', sufBg: '#e3edf5',   // suffix [amin, L] being summed
    acc:      '#5fa866', accBg: '#d9e8c7',   // result nf[a']
    thr:      '#d4a868',                      // threshold amin marker
    zero:     '#cfcfcf',
    text:     '#1f3550', ink: '#1a1a1a', dim: '#9a9a9a',
  };

  const N = 8, S = 2, B = 5, K = 2;
  // side below B
  const L = B - 1, a0 = B - S;            // L=4, a0=3
  const floorOf = (a) => B - a;           // distance a -> floor (for label)

  function arr0() { return new Array(L + 1).fill(0); }
  const amin = (ap) => Math.floor((ap + 2) / 2);     // ceil((ap+1)/2)

  // ── build steps by simulating, snapshotting each target a' compute ──
  const steps = [];
  function snap(o) { steps.push(o); }

  let f = arr0(); f[a0] = 1;

  snap({
    f: f.slice(), nf: null, ride: 0, tgt: null,
    text: '<strong>INITIAL</strong> · 起點 S=2 在 B=5 下側 ⇒ 只留 L=4 層。' +
          '距離 a₀=|2−5|=3 ⇒ f[3]=1，其餘 0。',
  });

  for (let s = 0; s < K; s++) {
    const before = f.slice();
    // suffix sums of `before`
    const suf = new Array(L + 2).fill(0);
    for (let j = L; j >= 1; j--) suf[j] = suf[j + 1] + before[j];
    const nf = arr0();

    for (let ap = 1; ap <= L; ap++) {
      const m = amin(ap);
      const sufVal = suf[m];
      nf[ap] = sufVal - before[ap];
      snap({
        f: before.slice(), nf: nf.slice(), ride: s + 1,
        tgt: ap, amin: m, sufVal, self: before[ap], result: nf[ap],
        text: `<strong>第 ${s + 1} 趟 · 算 nf[a'=${ap}]</strong>：門檻 amin=⌈(${ap}+1)/2⌉=${m}，` +
              `收後綴 [${m}, ${L}] 之和 suf[${m}]=${sufVal}，再扣自身 f[${ap}]=${before[ap]} ` +
              `⇒ nf[${ap}] = ${sufVal} − ${before[ap]} = <strong>${nf[ap]}</strong>` +
              (nf[ap] === 0 ? '（這格沒有來源）' : ''),
      });
    }

    f = nf;
    snap({
      f: nf.slice(), nf: null, ride: s + 1, tgt: null, settled: true,
      text: `<strong>第 ${s + 1} 趟完成</strong>：f[] ← nf[]（swap 滾動）。` +
            (s + 1 < K ? '繼續下一趟。' : '已搭滿 K 趟。'),
    });
  }

  const total = f.reduce((p, v) => p + v, 0);
  snap({
    f: f.slice(), nf: null, ride: K, tgt: null, done: true, answer: total,
    text: `<strong>答案 = Σ f[a] = ${f.slice(1).filter(v => v).join(' + ')} = ${total}</strong>。` +
          '停在任一距離都算一種搭法。',
  });

  let step = 0, timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 500;
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // draw a distance-array row; returns geometry {gx, cell}
  function drawArray(arr, gy, opts) {
    opts = opts || {};
    const w = canvas.clientWidth;
    const PAD = 26;
    const cell = Math.min(72, (w - PAD * 2) / L);
    const gridW = cell * L;
    const gx = (w - gridW) / 2;
    for (let a = 1; a <= L; a++) {
      const x = gx + (a - 1) * cell;
      let bg = COLOR.cellBg, st = COLOR.grid, lw = 1;
      // suffix tint
      if (opts.suffix && a >= opts.suffix[0] && a <= opts.suffix[1]) { bg = COLOR.sufBg; st = COLOR.suf; lw = 2; }
      // target cell
      if (opts.tgt === a) { bg = COLOR.tgtBg; st = COLOR.tgt; lw = 2.5; }
      // accumulated result row
      if (opts.acc && arr[a] > 0) { bg = COLOR.accBg; st = COLOR.acc; lw = 1.5; }
      ctx.fillStyle = bg; ctx.fillRect(x + 3, gy, cell - 6, cell - 6);
      ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.strokeRect(x + 3.5, gy + 0.5, cell - 7, cell - 7);
      // value
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = arr[a] > 0 ? COLOR.ink : COLOR.zero;
      ctx.font = '700 ' + Math.round(cell * 0.34) + 'px "JetBrains Mono", monospace';
      ctx.fillText(String(arr[a]), x + cell / 2, gy + (cell - 6) / 2);
      // distance index + floor below
      ctx.fillStyle = COLOR.dim; ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('a=' + a, x + cell / 2, gy + cell - 3);
      ctx.fillStyle = '#bdbdbd'; ctx.font = '500 10px "Noto Sans TC", sans-serif';
      ctx.fillText('f' + floorOf(a), x + cell / 2, gy + cell + 11);
    }
    return { gx, cell, gridW };
  }

  function bandTitle(txt, y) {
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(txt, 26, y);
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, canvas.clientHeight);

    const band1Y = 34, band2Y = 210, band3Y = 340;
    const PAD = 26;

    // ───────── BAND 1 · f[a] this ride ─────────
    const b1suffix = s.done ? '（搭滿 K 趟後）' : s.settled ? '（第 ' + s.ride + ' 趟後）' : s.ride ? '（第 ' + s.ride + ' 趟前）' : '';
    bandTitle('BAND 1 · f[a] = 停在「距 B 距離 a」的方法數' + b1suffix, band1Y);
    const suffix = (s.tgt != null) ? [s.amin, L] : null;
    const g1 = drawArray(s.f, band1Y + 20, { tgt: s.tgt, suffix, acc: s.settled || s.done });

    // threshold marker (coral-tan dashed line at left edge of cell amin)
    if (s.tgt != null) {
      const { gx, cell } = g1;
      const tx = gx + (s.amin - 1) * cell + 1.5;
      const top = band1Y + 14, bot = band1Y + 20 + cell + 4;
      ctx.save();
      ctx.strokeStyle = COLOR.thr; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(tx, top); ctx.lineTo(tx, bot); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COLOR.thr; ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('amin=' + s.amin + ' ▸ 收右側後綴', tx + 4, top + 2);
    }

    // ───────── BAND 2 · the arithmetic ─────────
    bandTitle('BAND 2 · 轉移式  nf[a\'] = suf[amin] − f[a\']', band2Y);
    if (s.tgt != null) {
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const ey = band2Y + 44, ex = PAD + 4;
      ctx.font = '700 22px "JetBrains Mono", monospace';
      // nf[a'] =
      ctx.fillStyle = COLOR.acc;
      ctx.fillText('nf[' + s.tgt + ']', ex, ey);
      let cx = ex + ctx.measureText('nf[' + s.tgt + ']').width + 8;
      ctx.fillStyle = COLOR.ink; ctx.fillText('=', cx, ey); cx += 26;
      // suf[amin]
      ctx.fillStyle = COLOR.suf;
      const t1 = 'suf[' + s.amin + ']=' + s.sufVal;
      ctx.fillText(t1, cx, ey); cx += ctx.measureText(t1).width + 10;
      ctx.fillStyle = COLOR.ink; ctx.fillText('−', cx, ey); cx += 22;
      // f[a'] (self)
      ctx.fillStyle = COLOR.tgt;
      const t2 = 'f[' + s.tgt + ']=' + s.self;
      ctx.fillText(t2, cx, ey); cx += ctx.measureText(t2).width + 10;
      ctx.fillStyle = COLOR.ink; ctx.fillText('=', cx, ey); cx += 26;
      ctx.fillStyle = COLOR.acc; ctx.font = '700 24px "JetBrains Mono", monospace';
      ctx.fillText(String(s.result), cx, ey);
      // hint line
      ctx.fillStyle = COLOR.dim; ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('藍色＝後綴 [' + s.amin + ', ' + L + '] 之和（所有能跳到 a\'=' + s.tgt + ' 的來源）；扣掉珊瑚色的自身（電梯要動）。',
        PAD + 4, band2Y + 70);
    } else {
      ctx.fillStyle = COLOR.dim; ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('|y−x| < |B−x| 在距離軸上化簡為 a\' ∈ [1, 2a−1] ⟺ 來源 a ≥ ⌈(a\'+1)/2⌉ = amin。', PAD + 4, band2Y + 44);
    }

    // ───────── BAND 3 · nf[a] / answer ─────────
    bandTitle(s.done ? 'BAND 3 · 答案 = Σ f[a]' : 'BAND 3 · nf[a] = 本趟累積中的方法數', band3Y);
    if (s.nf) {
      drawArray(s.nf, band3Y + 20, { acc: true, tgt: s.tgt });
    } else if (s.done) {
      const g3 = drawArray(s.f, band3Y + 20, { acc: true });
      ctx.fillStyle = COLOR.acc;
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Σ = ' + s.answer, g3.gx, band3Y + 20 + g3.cell + 34);
    } else if (s.settled) {
      drawArray(s.f, band3Y + 20, { acc: true });
    } else {
      ctx.fillStyle = COLOR.dim; ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('每個目標 a\' 收下右側後綴，逐格填滿 nf[]，就是下一趟的 f[]。', PAD + 4, band3Y + 44);
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
