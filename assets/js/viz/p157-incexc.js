/* ============================================================
   P157 分送高棕櫚 — inclusion–exclusion counting
   answer = Σ_{j=0..M} (-1)^j C(M,j) · ∏_i C(M-j, a_i)
   Style: white paper background, solid-color fills.
   Walks the sample N=3, M=3, a=[1,2,2] (answer 21).
   Three tidy horizontal bands, never overlapping:
     BAND 1  the M neighbours (j of them greyed out per term)
     BAND 2  the term factors  C(M,j) · ∏ C(M-j, a_i)  = term
     BAND 3  the running accumulator (signed bars + total)
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
    nbActive: '#e3edf5',   // a neighbour still in play
    nbStroke: '#8fb3d4',
    nbExcl:   '#e6e6e6',   // an excluded neighbour
    nbExclSt: '#bdbdbd',
    typeBg:   '#f6ead8',   // a palm type chip
    typeSt:   '#d4a868',
    add:      '#5fa866',   // even j  (added term)
    addBg:    '#d9e8c7',
    sub:      '#d96e4e',   // odd  j  (subtracted term)
    subBg:    '#f0d9d2',
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
    zero:     '#b9b9b9',
  };

  // ── sample ──
  const M = 3;
  const A = [1, 2, 2];        // a_i
  const N = A.length;

  // C(n,k) via Pascal
  const C = Array.from({ length: M + 1 }, () => new Array(M + 1).fill(0));
  for (let n = 0; n <= M; n++) {
    C[n][0] = 1;
    for (let k = 1; k <= n; k++) C[n][k] = C[n - 1][k - 1] + C[n - 1][k];
  }
  const comb = (n, k) => (k < 0 || k > n) ? 0 : C[n][k];

  // ── build steps ──
  // For each j: a "compute" snapshot (factors shown) then "accumulate".
  const steps = [];
  function snap(o) { steps.push(o); }

  snap({ kind: 'init', j: null, running: null,
    text: '<strong>INITIAL</strong> · M=3 位鄰居、3 類高棕櫚 a=[1,2,2]。' +
          '用容斥逐項計算 <code>Σ (−1)ʲ C(M,j) ∏ C(M−j, aᵢ)</code>。' });

  let running = 0;
  const termVals = [];   // signed term per j, for the accumulator band
  for (let j = 0; j <= M; j++) {
    const remain = M - j;
    // factor list
    const factors = [{ label: `C(${M},${j})`, val: comb(M, j), kind: 'choose' }];
    let term = comb(M, j);
    let zeroed = false;
    for (let i = 0; i < N; i++) {
      const c = comb(remain, A[i]);
      factors.push({ label: `C(${remain},${A[i]})`, val: c, kind: 'type', ai: A[i], zero: c === 0 });
      if (c === 0) zeroed = true;
      term *= c;
    }
    const signed = (j % 2 === 0) ? term : -term;
    const even = (j % 2 === 0);

    // compute snapshot
    snap({ kind: 'compute', j, remain, factors, term, signed, even, zeroed,
      running, termVals: termVals.slice(),
      text: `<strong>j = ${j}</strong> · 排除 ${j} 位鄰居（剩 ${remain} 位）。` +
            `本項 = <code>C(${M},${j})·∏C(${remain},aᵢ) = ${term}</code>` +
            (zeroed ? '（某類要的比剩下的人多 ⇒ <strong>歸零</strong>）' : '') +
            `，依符號 <strong>${even ? '加' : '減'}</strong>。` });

    running += signed;
    termVals.push({ j, signed, even, term });

    // accumulate snapshot
    snap({ kind: 'accum', j, remain, factors, term, signed, even, zeroed,
      running, termVals: termVals.slice(),
      text: `累加：${formatRun(termVals)} = <strong>${running}</strong>。` });
  }

  snap({ kind: 'done', j: null, running,
    termVals: termVals.slice(),
    text: `<strong>答案 = ${running}</strong>。j=0 是全集（不管至少一個）；` +
          `負項扣掉「有人沒拿到」的分法；j 大時剩的人不夠分自然歸零。` });

  function formatRun(tv) {
    return tv.map((t, idx) => {
      const sign = idx === 0 ? '' : (t.even ? ' + ' : ' − ');
      return sign + t.term;
    }).join('');
  }

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

  // rounded rect helper
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
    fitCanvas();                       // re-fit each frame: backing store stays crisp after fonts/layout settle
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const PAD = 26;
    // three bands with fixed, generous vertical budget
    const band1Y = 34;          // neighbours title baseline
    const band2Y = 150;         // term factors title baseline
    const band3Y = 286;         // accumulator title baseline

    // how many neighbours are excluded this step?
    const jNow = (s.kind === 'compute' || s.kind === 'accum') ? s.j : null;

    // ───────────────────── BAND 1 · neighbours ─────────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · M = ' + M + ' 位鄰居' +
      (jNow != null ? '（灰 = 本項排除的 ' + jNow + ' 位）' : ''), PAD, band1Y);

    const nbR = 24;
    const nbGap = 30;
    const nbTotalW = M * (nbR * 2) + (M - 1) * nbGap;
    const nbStartX = (w - nbTotalW) / 2;
    const nbCY = band1Y + 22 + nbR;
    for (let t = 0; t < M; t++) {
      const cx = nbStartX + t * (nbR * 2 + nbGap) + nbR;
      const excluded = (jNow != null) && (t >= M - jNow);  // last j neighbours greyed
      ctx.beginPath();
      ctx.arc(cx, nbCY, nbR, 0, Math.PI * 2);
      ctx.fillStyle = excluded ? COLOR.nbExcl : COLOR.nbActive;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = excluded ? COLOR.nbExclSt : COLOR.nbStroke;
      ctx.stroke();
      // face
      ctx.fillStyle = excluded ? COLOR.zero : COLOR.text;
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('N' + (t + 1), cx, nbCY);
      if (excluded) {
        ctx.strokeStyle = COLOR.nbExclSt;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - nbR * 0.6, nbCY - nbR * 0.6);
        ctx.lineTo(cx + nbR * 0.6, nbCY + nbR * 0.6);
        ctx.stroke();
      }
    }
    // remain caption
    if (jNow != null) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('剩 M−j = ' + s.remain + ' 位可分配', w / 2, nbCY + nbR + 8);
    }

    // ───────────────────── BAND 2 · term factors ─────────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · 本項 = C(M,j) · ∏ C(M−j, aᵢ)', PAD, band2Y);

    if (s.kind === 'compute' || s.kind === 'accum') {
      const chips = s.factors;
      const cw = 88, ch = 50, cgap = 30;
      // chips + (n-1) "·" separators + " = term"
      const totalChipsW = chips.length * cw + (chips.length - 1) * cgap;
      const eqW = 96;                                   // room for "= term"
      let bx = (w - (totalChipsW + eqW)) / 2;
      const by = band2Y + 18;
      for (let ci = 0; ci < chips.length; ci++) {
        const f = chips[ci];
        const isType = f.kind === 'type';
        rr(bx, by, cw, ch, 4);
        ctx.fillStyle = f.zero ? '#efefef' : (isType ? COLOR.typeBg : COLOR.nbActive);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = f.zero ? COLOR.zero : (isType ? COLOR.typeSt : COLOR.nbStroke);
        ctx.stroke();
        // label
        ctx.fillStyle = f.zero ? COLOR.zero : COLOR.text;
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(f.label, bx + cw / 2, by + 7);
        // value
        ctx.fillStyle = f.zero ? COLOR.zero : COLOR.ink;
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText('= ' + f.val, bx + cw / 2, by + ch - 6);
        // separator "·"
        if (ci < chips.length - 1) {
          ctx.fillStyle = COLOR.dim;
          ctx.font = '700 18px "JetBrains Mono", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('·', bx + cw + cgap / 2, by + ch / 2);
        }
        bx += cw + cgap;
      }
      // = term
      const even = s.even;
      ctx.fillStyle = even ? COLOR.add : COLOR.sub;
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('= ' + (even ? '+' : '−') + s.term, bx + 8, by + ch / 2);
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('每類獨立選 aᵢ 位鄰居 ⇒ ∏ C(M, aᵢ) ；容斥扣掉有人沒拿到的分法',
        w / 2, band2Y + 44);
    }

    // ───────────────────── BAND 3 · accumulator ─────────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 交錯累加 → 總和', PAD, band3Y);

    const tv = s.termVals || [];
    // signed term bars: one slot per j (0..M), fixed grid so layout never jumps
    const slotW = Math.min(120, (w - PAD * 2 - 150) / (M + 1));
    const barsX = PAD;
    const barTop = band3Y + 18;
    const barH = 46;
    for (let j = 0; j <= M; j++) {
      const x = barsX + j * slotW;
      const t = tv.find(e => e.j === j);
      rr(x, barTop, slotW - 14, barH, 4);
      if (!t) {
        ctx.fillStyle = '#f6f6f6';
        ctx.fill();
        ctx.strokeStyle = COLOR.grid; ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = COLOR.zero;
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('j=' + j, x + (slotW - 14) / 2, barTop + barH / 2);
      } else {
        ctx.fillStyle = t.even ? COLOR.addBg : COLOR.subBg;
        ctx.fill();
        ctx.strokeStyle = t.even ? COLOR.add : COLOR.sub; ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = COLOR.dim;
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('j=' + j, x + (slotW - 14) / 2, barTop + 5);
        ctx.fillStyle = t.even ? COLOR.add : COLOR.sub;
        ctx.font = '700 17px "JetBrains Mono", monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText((t.even ? '+' : '−') + t.term, x + (slotW - 14) / 2, barTop + barH - 6);
      }
    }

    // total box on the right
    const totX = barsX + (M + 1) * slotW + 14;
    const totW = w - PAD - totX;
    if (totW > 90) {
      rr(totX, barTop, totW, barH, 4);
      ctx.fillStyle = COLOR.ink;
      ctx.fill();
      ctx.fillStyle = '#ffd9c9';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('TOTAL', totX + totW / 2, barTop + 6);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      const showTot = (s.kind === 'init') ? '·' : String(s.running);
      ctx.fillText(showTot, totX + totW / 2, barTop + barH - 6);
    }

    // running expression line under the bars
    if (tv.length) {
      ctx.fillStyle = COLOR.text;
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(formatRun(tv) + ' = ' + s.running, barsX, barTop + barH + 12);
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
