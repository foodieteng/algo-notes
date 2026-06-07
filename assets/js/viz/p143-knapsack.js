/* ============================================================
   P143 高棕櫚農場 — 0/1 knapsack, 1-D rolling array (descending w).
   dp[w] = max(dp[w], dp[w - A_i] + B_i),  w from cap down to A_i.
   Style: white paper background, solid-color fills, three tidy bands:
     BAND 1  the items (current one highlighted)
     BAND 2  the dp[0..cap] array (active w coral, source w-A blue, grew=green)
     BAND 3  the live transition: dp[w] = max(dp[w], dp[w-A]+B)
   Walks the sample M=5, items (A=2,B=4) and (A=3,B=3) -> 7.
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
    active:   '#d96e4e',   // dp[w] being updated
    activeBg: '#f7ddd2',
    source:   '#8fb3d4',   // dp[w - A] source
    sourceBg: '#e3edf5',
    grew:     '#5fa866',   // updated (got larger)
    grewBg:   '#d9e8c7',
    tooSmall: '#cfcfcf',   // w < A, can't place
    itemBg:   '#f6ead8',
    itemSt:   '#d4a868',
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
  };

  const M = 5;
  const ITEMS = [ { A: 2, B: 4 }, { A: 3, B: 3 } ];
  const cap = Math.min(M, ITEMS.reduce((s, it) => s + it.A, 0)); // 5

  // ── build steps ──
  const steps = [];
  function snap(o) { steps.push(o); }

  let dp = new Array(cap + 1).fill(0);

  snap({
    dp: dp.slice(), item: null, w: null, src: null, grew: false,
    text: '<strong>INITIAL</strong> · dp[0..' + cap + '] 全部歸零（什麼都沒吃，滿足感 0）。逐物品、w 由大到小更新。',
  });

  for (let i = 0; i < ITEMS.length; i++) {
    const { A, B } = ITEMS[i];
    for (let w = cap; w >= A; w--) {
      const keep = dp[w];
      const take = dp[w - A] + B;
      const grew = take > keep;
      dp[w] = Math.max(keep, take);
      snap({
        dp: dp.slice(), item: i, w, src: w - A, A, B, keep, take, grew,
        text: `<strong>物品${i} (A=${A},B=${B})</strong> · w=${w}：` +
              `不吃=<span style="color:#b07c2f">dp[${w}]=${keep}</span>、` +
              `吃=<span style="color:#6f93b4">dp[${w - A}]=${dp[w - A]}</span>+${B}=${take} ⇒ ` +
              (grew ? `<strong style="color:#5fa866">取 ${dp[w]}（變大）</strong>` : `保持 ${dp[w]}`),
      });
    }
  }

  snap({
    dp: dp.slice(), item: null, w: null, src: null, grew: false, done: true,
    text: `<strong>答案 = dp[${cap}] = ${dp[cap]}</strong>。兩個都吃（飽足 2+3=5 ≤ 5、滿足 4+3=7）。`,
  });

  let step = 0, timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 440;
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

    const PAD = 26;
    const band1Y = 34;     // items title
    const band2Y = 168;    // dp array title
    const band3Y = 320;    // transition title

    // ───────────────── BAND 1 · items ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 高棕櫚（A=飽足/重量 · B=滿足/價值）', PAD, band1Y);

    const iw = 172, ih = 64, igap = 24, iy = band1Y + 16;
    let ix = PAD;
    ITEMS.forEach((it, idx) => {
      const isCur = s.item === idx;
      rr(ix, iy, iw, ih, 4);
      ctx.fillStyle = isCur ? COLOR.activeBg : COLOR.itemBg;
      ctx.fill();
      ctx.strokeStyle = isCur ? COLOR.active : COLOR.itemSt;
      ctx.lineWidth = isCur ? 2.5 : 1.5;
      ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.fillText('物品 ' + idx, ix + 14, iy + 11);
      ctx.fillStyle = COLOR.text;
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillText('A=' + it.A + '  B=' + it.B, ix + 14, iy + 36);
      if (isCur) {
        ctx.fillStyle = COLOR.active;
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('▶ 處理中', ix + iw - 12, iy + ih - 8);
      }
      ix += iw + igap;
    });

    // ───────────────── BAND 2 · dp array ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · dp[w] = 飽足感 ≤ w 時的最大滿足感（w 由大到小更新）', PAD, band2Y);

    const n = cap + 1;
    const cell = Math.min(70, (w - PAD * 2) / n);
    const gridW = cell * n;
    const gx = (w - gridW) / 2;
    const gy = band2Y + 30;
    for (let wi = 0; wi <= cap; wi++) {
      const x = gx + wi * cell;
      const isActive = s.w === wi;
      const isSrc = s.src === wi;
      const A = s.A;
      const tooSmall = s.item != null && A != null && wi < A && s.w == null; // not used much
      let bg = COLOR.cellBg, st = COLOR.grid, lw = 1;
      if (isSrc)    { bg = COLOR.sourceBg; st = COLOR.source; lw = 2; }
      if (isActive) { bg = s.grew ? COLOR.grewBg : COLOR.activeBg; st = s.grew ? COLOR.grew : COLOR.active; lw = 2.5; }
      rr(x + 2, gy, cell - 4, cell - 4, 3);
      ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.stroke();
      // value
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 ' + Math.round(cell * 0.32) + 'px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(s.dp[wi]), x + cell / 2, gy + (cell - 4) / 2);
      // index label below
      ctx.fillStyle = (isActive || isSrc) ? st : COLOR.dim;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('w=' + wi, x + cell / 2, gy + cell + 2);
    }
    // arrow from source to active
    if (s.w != null && s.src != null && s.src >= 0) {
      const xs = gx + s.src * cell + cell / 2;
      const xa = gx + s.w * cell + cell / 2;
      const ay = gy + cell + 22;
      ctx.strokeStyle = COLOR.source; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xs, ay); ctx.lineTo(xs, ay + 8); ctx.lineTo(xa, ay + 8); ctx.lineTo(xa, ay + 2);
      ctx.stroke();
      // arrowhead
      ctx.beginPath(); ctx.moveTo(xa, ay - 2); ctx.lineTo(xa - 4, ay + 5); ctx.lineTo(xa + 4, ay + 5); ctx.closePath();
      ctx.fillStyle = COLOR.source; ctx.fill();
      ctx.fillStyle = COLOR.source;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('dp[w−A]', (xs + xa) / 2, ay + 11);
    }

    // ───────────────── BAND 3 · transition ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 轉移：dp[w] = max( dp[w] , dp[w−A] + B )', PAD, band3Y);

    const ty = band3Y + 40;
    if (s.w != null) {
      ctx.font = '700 19px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      let x = PAD;
      const seg = (txt, col) => { ctx.fillStyle = col; ctx.fillText(txt, x, ty); x += ctx.measureText(txt).width + 7; };
      seg('dp[' + s.w + '] = max(', COLOR.ink);
      seg(String(s.keep), COLOR.itemSt);              // keep
      seg(',', COLOR.dim);
      seg('dp[' + s.src + ']+' + s.B, COLOR.source);  // take expr
      seg('=' + s.take, COLOR.source);
      seg(')', COLOR.ink);
      seg('→', COLOR.dim);
      seg(String(s.dp[s.w]), s.grew ? COLOR.grew : COLOR.ink);
      // verdict line
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = s.grew ? COLOR.grew : COLOR.dim;
      ctx.textBaseline = 'middle';
      ctx.fillText(s.grew ? '✓ 吃第 ' + s.item + ' 個更好 → 更新' : '不吃比較好 → 保持',
        PAD, ty + 32);
    } else if (s.done) {
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillStyle = COLOR.grew;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('答案 dp[' + cap + '] = ' + s.dp[cap], PAD, ty);
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.fillStyle = COLOR.dim;
      ctx.fillText('飽足 2+3 = 5 ≤ 5（容量剛好），滿足 4+3 = 7。', PAD, ty + 30);
    } else {
      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.fillStyle = COLOR.dim;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('每格比較「不吃這個物品」與「吃這個物品（dp[w−A]+B）」，取較大者。', PAD, ty);
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
