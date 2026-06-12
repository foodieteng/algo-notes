/* ============================================================
   P373 取名字好困難QQ — two-candidate non-decreasing LIS.
   Each number a[i] carries two candidate values {a[i], 2*a[i]}
   (only those >= M are usable). dp[i][c] = longest non-decreasing
   chain ending at element i using candidate c:
       dp[i][c] = 1 + max{ dp[j][cc] : j<i, v[j][cc] <= v[i][c] }
   Style: white paper, solid fills, three tidy horizontal bands:
     BAND 1  the N elements as columns; top cell = 2a[i], bottom = a[i]
             (the candidate currently computed is coral; connectable
              predecessors are blue)
     BAND 2  the dp arithmetic for the current candidate
     BAND 3  the dp table filled so far + answer / best chain
   Walks sample N=3, M=1, a=[2,1,3]: chain [2,2,3] -> 3.
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
    paper:  '#ffffff',
    grid:   '#cfcfcf',
    cellBg: '#f4f6f8',
    cur:    '#d96e4e', curBg: '#f7ddd2',   // candidate being computed
    pred:   '#8fb3d4', predBg: '#e3edf5',   // connectable predecessor (value <= it)
    done:   '#5fa866', doneBg: '#d9e8c7',   // computed dp / best chain
    dead:   '#cfcfcf', deadBg: '#ededed',   // < M unusable
    ink:    '#1a1a1a', dim: '#9a9a9a',
  };

  const N = 3, M = 1;
  const a = [2, 1, 3];
  // candidate values: v[i][0]=a[i] (keep, bottom), v[i][1]=2a[i] (double, top)
  const v = a.map(x => [x, 2 * x]);

  // ── build steps by simulating the O(N^2) dp ──
  const steps = [];
  function snap(o) { steps.push(o); }

  const dp = a.map(() => [0, 0]);
  let ans = 0;

  snap({
    phase: 'init', dp: dp.map(r => r.slice()), ans: 0,
    text: '<strong>INITIAL</strong> · 每個數字兩個候選值：a₁=2→{2,4}、a₂=1→{1,2}、a₃=3→{3,6}（皆 ≥ M=1，全可用）。',
  });

  for (let i = 0; i < N; i++) {
    for (let c = 0; c < 2; c++) {
      if (v[i][c] < M) { dp[i][c] = 0; continue; }   // unusable (won't happen for this sample)
      let best = 1;
      const preds = [];   // [{j, cc, val, dp}]
      for (let j = 0; j < i; j++)
        for (let cc = 0; cc < 2; cc++)
          if (dp[j][cc] > 0 && v[j][cc] <= v[i][c]) {
            preds.push({ j, cc, val: v[j][cc], dp: dp[j][cc] });
            best = Math.max(best, dp[j][cc] + 1);
          }
      dp[i][c] = best;
      ans = Math.max(ans, best);
      const predTxt = preds.length
        ? preds.map(p => `dp[${p.j + 1}][${p.cc}]=${p.dp}(值${p.val})`).join('、')
        : '無（前面沒有值 ≤ 它的狀態）';
      snap({
        phase: 'compute', i, c, val: v[i][c], best,
        preds, dp: dp.map(r => r.slice()), ans,
        text: `<strong>算 dp[第${i + 1}個][${c === 0 ? '維持 ×1' : '兩倍 ×2'}] = 值 ${v[i][c]}</strong>：` +
              `可接的前驅（值 ≤ ${v[i][c]}）：${predTxt} ⇒ dp = <strong>${best}</strong>` +
              (c === 1 && i === 1 ? '　★ 用兩倍才接得上前面的 2' : ''),
      });
    }
  }

  // best chain for the sample: [2(a1 keep), 2(a2 double), 3(a3 keep)]
  snap({
    phase: 'done', dp: dp.map(r => r.slice()), ans,
    chain: [{ i: 0, c: 0, val: 2 }, { i: 1, c: 1, val: 2 }, { i: 2, c: 0, val: 3 }],
    text: `<strong>答案 = max dp = ${ans}</strong>。最長鏈 [2, 2, 3]：a₁ 維持(2)、a₂ ×2(2)、a₃ 維持(3)，` +
          `非遞減且皆 ≥ M。`,
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

  function bandTitle(txt, y) {
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(txt, 26, y);
  }

  // is (j,cc) a connectable predecessor in the current step?
  function isPred(s, j, cc) {
    return s.preds && s.preds.some(p => p.j === j && p.cc === cc);
  }
  // is (i,c) on the final best chain?
  function onChain(s, i, c) {
    return s.chain && s.chain.some(x => x.i === i && x.c === c);
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, canvas.clientHeight);

    const band1Y = 34, band2Y = 250, band3Y = 366;
    const cx = w / 2;

    // ───────── BAND 1 · elements with two candidate cells each ─────────
    bandTitle('BAND 1 · 每個數字兩個候選值（上 = 2aᵢ，下 = aᵢ）', band1Y);
    const colW = 110, cellH = 56, gap = 30;
    const totalW = N * colW + (N - 1) * gap;
    const gx = cx - totalW / 2;
    const topY = band1Y + 28;          // 2a row
    const botY = topY + cellH + 14;    // a row
    const geo = [];                    // geo[i][c] = {cx, cy} centre for arrows
    for (let i = 0; i < N; i++) {
      const x = gx + i * (colW + gap);
      geo[i] = [];
      // header: a[i]
      ctx.fillStyle = COLOR.dim; ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('a' + (i + 1) + ' = ' + a[i], x + colW / 2, topY - 6);
      for (let row = 0; row < 2; row++) {
        // row 0 = top = candidate c=1 (2a); row 1 = bottom = candidate c=0 (a)
        const c = row === 0 ? 1 : 0;
        const y = row === 0 ? topY : botY;
        const usable = v[i][c] >= M;
        let bg = usable ? COLOR.cellBg : COLOR.deadBg;
        let st = usable ? COLOR.grid : COLOR.dead;
        let lw = 1;
        if (s.phase === 'compute') {
          if (s.i === i && s.c === c) { bg = COLOR.curBg; st = COLOR.cur; lw = 2.5; }
          else if (isPred(s, i, c))   { bg = COLOR.predBg; st = COLOR.pred; lw = 2; }
        }
        if (s.phase === 'done' && onChain(s, i, c)) { bg = COLOR.doneBg; st = COLOR.done; lw = 2.5; }
        ctx.fillStyle = bg; ctx.fillRect(x, y, colW, cellH);
        ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.strokeRect(x + 0.5, y + 0.5, colW - 1, cellH - 1);
        // value + tag
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = usable ? COLOR.ink : COLOR.dead;
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.fillText(String(v[i][c]), x + colW / 2, y + cellH / 2 - 6);
        ctx.fillStyle = COLOR.dim; ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText(c === 1 ? '×2' : '×1', x + colW / 2, y + cellH / 2 + 13);
        // dp value badge (right edge) if computed
        if (s.dp && s.dp[i][c] > 0 && (s.phase !== 'compute' || (i < s.i || (i === s.i && c <= s.c)))) {
          ctx.fillStyle = COLOR.done; ctx.font = '700 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'right'; ctx.textBaseline = 'top';
          ctx.fillText('dp=' + s.dp[i][c], x + colW - 4, y + 3);
        }
        geo[i][c] = { cx: x + colW / 2, cy: y + cellH / 2, top: y, bot: y + cellH };
      }
    }
    // arrows from connectable predecessors to current candidate
    if (s.phase === 'compute' && s.preds) {
      const cur = geo[s.i][s.c];
      s.preds.forEach(p => {
        const pg = geo[p.j][p.cc];
        ctx.strokeStyle = COLOR.pred; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pg.cx, pg.cy); ctx.lineTo(cur.cx, cur.cy); ctx.stroke();
      });
    }
    // arrows along final chain
    if (s.phase === 'done' && s.chain) {
      for (let k = 1; k < s.chain.length; k++) {
        const p = geo[s.chain[k - 1].i][s.chain[k - 1].c];
        const q = geo[s.chain[k].i][s.chain[k].c];
        ctx.strokeStyle = COLOR.done; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(p.cx, p.cy); ctx.lineTo(q.cx, q.cy); ctx.stroke();
      }
    }

    // ───────── BAND 2 · the arithmetic ─────────
    bandTitle('BAND 2 · 轉移  dp[i][c] = 1 + max{ dp[j][cc] : 值 ≤ v[i][c] }', band2Y);
    if (s.phase === 'compute') {
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const ey = band2Y + 38, ex = 30;
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.fillStyle = COLOR.cur;
      const lhs = `dp[${s.i + 1}][${s.c}] (值${s.val})`;
      ctx.fillText(lhs, ex, ey);
      let px = ex + ctx.measureText(lhs).width + 10;
      ctx.fillStyle = COLOR.ink; ctx.fillText('=', px, ey); px += 24;
      if (s.preds.length) {
        const bestPred = s.preds.reduce((m, p) => p.dp > m.dp ? p : m, s.preds[0]);
        ctx.fillStyle = COLOR.pred;
        const t = `1 + ${bestPred.dp}`;
        ctx.fillText(t, px, ey); px += ctx.measureText(t).width + 10;
        ctx.fillStyle = COLOR.ink; ctx.fillText('=', px, ey); px += 24;
      } else {
        ctx.fillStyle = COLOR.dim; ctx.font = '500 15px "Noto Sans TC", sans-serif';
        ctx.fillText('（無可接前驅）1 = ', px, ey); px += ctx.measureText('（無可接前驅）1 = ').width + 4;
        ctx.font = '700 20px "JetBrains Mono", monospace';
      }
      ctx.fillStyle = COLOR.done; ctx.font = '700 24px "JetBrains Mono", monospace';
      ctx.fillText(String(s.best), px, ey);
      // hint
      ctx.fillStyle = COLOR.dim; ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('藍色＝前面值 ≤ ' + s.val + ' 的候選（可接成更長鏈）；取其中 dp 最大者 +1。', 30, band2Y + 60);
    } else {
      ctx.fillStyle = COLOR.dim; ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(s.phase === 'done'
        ? '所有 dp 都算完，答案是它們的最大值；下方紅線標出最長那條鏈。'
        : '（逐個候選值計算 dp：從前面值 ≤ 它的狀態接最長鏈 +1）', 30, band2Y + 40);
    }

    // ───────── BAND 3 · dp table / answer ─────────
    bandTitle(s.phase === 'done' ? 'BAND 3 · 答案 = max dp' : 'BAND 3 · dp 表（已填部分）', band3Y);
    {
      // table: rows = candidate (×2 top, ×1 bottom), cols = element
      const tcellW = 90, tcellH = 38, tgap = 16;
      const ttotalW = N * tcellW + (N - 1) * tgap + 70;  // +70 for row labels
      let tx0 = cx - ttotalW / 2 + 70;
      const ty0 = band3Y + 16;
      // row labels
      ctx.fillStyle = COLOR.dim; ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('×2 (c=1)', tx0 - 10, ty0 + tcellH / 2);
      ctx.fillText('×1 (c=0)', tx0 - 10, ty0 + tcellH + tgap + tcellH / 2);
      for (let i = 0; i < N; i++) {
        const x = tx0 + i * (tcellW + tgap);
        // col label
        ctx.fillStyle = COLOR.dim; ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('第' + (i + 1) + '個', x + tcellW / 2, ty0 - 4);
        for (let row = 0; row < 2; row++) {
          const c = row === 0 ? 1 : 0;
          const y = ty0 + row * (tcellH + tgap);
          const val = s.dp ? s.dp[i][c] : 0;
          const filled = val > 0;
          let bg = filled ? COLOR.doneBg : COLOR.cellBg;
          let st = filled ? COLOR.done : COLOR.grid;
          let lw = 1;
          if (s.phase === 'compute' && s.i === i && s.c === c) { bg = COLOR.curBg; st = COLOR.cur; lw = 2.5; }
          if (s.phase === 'done' && onChain(s, i, c)) { st = COLOR.done; lw = 2.5; }
          ctx.fillStyle = bg; ctx.fillRect(x, y, tcellW, tcellH);
          ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.strokeRect(x + 0.5, y + 0.5, tcellW - 1, tcellH - 1);
          ctx.fillStyle = filled ? COLOR.ink : COLOR.dim;
          ctx.font = '700 16px "JetBrains Mono", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(filled ? String(val) : '·', x + tcellW / 2, y + tcellH / 2);
        }
      }
      if (s.phase === 'done') {
        // place the answer to the RIGHT of the table (avoid clipping at the canvas bottom)
        const ax = tx0 + N * (tcellW + tgap) + 6;
        ctx.fillStyle = COLOR.done; ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('答案', ax, ty0 + tcellH / 2);
        ctx.font = '700 30px "JetBrains Mono", monospace';
        ctx.fillText('= ' + s.ans, ax, ty0 + tcellH + tgap + tcellH / 2);
      }
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
    timer = setInterval(() => { if (step >= steps.length - 1) { stop(); return; } next(); }, 1600);
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
