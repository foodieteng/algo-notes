/* ============================================================
   P129 合成円円 — min-cost adjacent merge (stone merging / interval DP)
   dp[i][j] = min over split k of dp[i][k] + dp[k+1][j] + sum(i..j).
   Style: white paper background, solid-color fills.
   Walks the sample a = [1, 2, 3] (answer 9): fills the dp table by
   increasing interval length, showing each split candidate and the
   running sum that every merge of [i..j] must pay, then highlights
   the chosen optimal split as a small merge tree.
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
    arrBg:    '#e3edf5',
    arrStroke:'#8fb3d4',
    active:   '#d96e4e',   // dp[i][j] being computed / chosen cell
    left:     '#8fb3d4',   // dp[i][k] sub-interval
    right:    '#d4a868',   // dp[k+1][j] sub-interval
    sum:      '#d4a017',   // the +sum(i..j) merge cost
    chosen:   '#5fa866',   // optimal split
    diag:     '#d9e8c7',   // base diagonal dp[i][i]=0
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
  };

  // 1-indexed sample
  const Araw = [1, 2, 3];
  const N    = Araw.length;
  const A    = [0, ...Araw];

  const prefix = new Array(N + 1).fill(0);
  for (let i = 1; i <= N; i++) prefix[i] = prefix[i - 1] + A[i];
  const rangeSum = (i, j) => prefix[j] - prefix[i - 1];

  // dp[i][j], bestK[i][j]
  const dp    = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));
  const bestK = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(-1));
  for (let len = 2; len <= N; len++) {
    for (let i = 1; i + len - 1 <= N; i++) {
      const j = i + len - 1;
      const sum = rangeSum(i, j);
      let best = Infinity, bk = -1;
      for (let k = i; k < j; k++) {
        const cand = dp[i][k] + dp[k + 1][j] + sum;
        if (cand < best) { best = cand; bk = k; }
      }
      dp[i][j] = best; bestK[i][j] = bk;
    }
  }

  // ── steps ──
  const steps = [];
  function snap(o) { steps.push(o); }

  snap({ phase: 'init', filled: {}, active: null, cand: null,
    text: '<strong>INITIAL</strong> · N 隻円円排成一列，<strong>只有相鄰兩隻能合成</strong>；' +
          '每次合成的高棕櫚成本 = 兩隻糟糕值之和。求把全部合成成一隻的<strong>最小總高棕櫚</strong>。' +
          '範例 a = [1, 2, 3]。' });

  // base diagonal
  const filled = {};
  const key = (i, j) => i + ',' + j;
  snap({ phase: 'base', filled: { ...filled }, active: null, cand: null,
    text: '<strong>base</strong>：單一隻円円不必合成 ⇒ <code>dp[i][i] = 0</code>（綠色對角線）。' });
  for (let i = 1; i <= N; i++) filled[key(i, i)] = true;

  // fill by length
  for (let len = 2; len <= N; len++) {
    for (let i = 1; i + len - 1 <= N; i++) {
      const j = i + len - 1;
      const sum = rangeSum(i, j);
      // show each candidate split
      for (let k = i; k < j; k++) {
        const cand = dp[i][k] + dp[k + 1][j] + sum;
        snap({ phase: 'compare', filled: { ...filled }, active: [i, j], k, sum,
          leftV: dp[i][k], rightV: dp[k + 1][j], candV: cand,
          isBest: k === bestK[i][j],
          text: `算 <code>dp[${i}][${j}]</code>（合成 a[${i}..${j}]）。試切點 <code>k=${k}</code>：` +
                `<span style="color:#6f93b4">dp[${i}][${k}]=${dp[i][k]}</span> + ` +
                `<span style="color:#b07c2f">dp[${k + 1}][${j}]=${dp[k + 1][j]}</span> + ` +
                `<span style="color:#a8830d">sum[${i}..${j}]=${sum}</span> = <strong>${cand}</strong>` +
                (k === bestK[i][j] ? '　← 目前最佳' : '') });
      }
      filled[key(i, j)] = true;
      snap({ phase: 'settle', filled: { ...filled }, active: [i, j], k: bestK[i][j], sum,
        candV: dp[i][j], settled: true,
        text: `<code>dp[${i}][${j}] = ${dp[i][j]}</code>（最佳切點 k=${bestK[i][j]}）。` +
              `不論怎麼切，最後合成 [${i}..${j}] 都要付一次 <code>sum=${sum}</code>；差別在子問題誰更省。` });
    }
  }

  snap({ phase: 'answer', filled: { ...filled }, active: [1, N], k: bestK[1][N], sum: rangeSum(1, N),
    text: `<strong>答案 = dp[1][${N}] = ${dp[1][N]}</strong>。右上角格子就是「全部合成」的最小高棕櫚。` +
          `本例最佳：先合 [1..${bestK[1][N]}] 與 [${bestK[1][N] + 1}..${N}]，再合兩者。` });

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 360;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width  = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function geom() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // Two bands: left = dp matrix, right = array + breakdown panel.
    // Give the matrix the left ~46% and a comfortable row-label gutter.
    const labelGutter = 42;                 // room for "i=1" row labels
    const leftBandX = 24 + labelGutter;     // matrix grid origin x
    const leftBandW = w * 0.46 - labelGutter;
    const cell = Math.min(78, leftBandW / N, (h - 110) / N);
    const gridH = cell * N;
    const gx0 = leftBandX;
    // vertically center the matrix in the canvas (leave room for the title row)
    const gy0 = Math.max(54, (h - gridH) / 2 + 14);
    // right panel starts past the matrix with a clear ~64px gap
    const panelX = Math.max(gx0 + cell * N + 64, w * 0.52);
    return { w, h, cell, gx0, gy0, panelX, gridH, labelGutter };
  }

  function draw() {
    fitCanvas();                       // re-fit each frame: backing store stays crisp after fonts/layout settle
    const s = steps[step];
    const g = geom();
    const { w, h, cell, gx0, gy0, panelX, labelGutter } = g;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // title for matrix — lifted well above the column headers
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('dp[i][j]   i = 列 · j = 行', gx0 - labelGutter + 2, gy0 - 30);

    const key = (i, j) => i + ',' + j;

    // column headers (j) and row headers (i)
    ctx.font = '600 11px "JetBrains Mono", monospace';
    for (let j = 1; j <= N; j++) {
      ctx.fillStyle = COLOR.dim;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('j=' + j, gx0 + (j - 1) * cell + cell / 2, gy0 - 5);
    }
    for (let i = 1; i <= N; i++) {
      ctx.fillStyle = COLOR.dim;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('i=' + i, gx0 - 6, gy0 + (i - 1) * cell + cell / 2);
    }

    // cells (only upper triangle i<=j is meaningful)
    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        const x = gx0 + (j - 1) * cell;
        const y = gy0 + (i - 1) * cell;
        if (i > j) continue; // lower triangle blank

        const isActive = s.active && s.active[0] === i && s.active[1] === j;
        const isLeftSub  = s.active && s.k != null && i === s.active[0] && j === s.k;
        const isRightSub = s.active && s.k != null && i === s.k + 1 && j === s.active[1];
        const filledNow = s.filled[key(i, j)];

        let fill = COLOR.cellBg;
        if (i === j) fill = COLOR.diag;
        if (filledNow && i !== j) fill = '#eef1f4';
        if (isLeftSub)  fill = 'rgba(143,179,212,0.40)';
        if (isRightSub) fill = 'rgba(212,168,104,0.40)';
        if (isActive)   fill = s.settled || s.phase === 'answer' ? COLOR.chosen : COLOR.active;

        ctx.fillStyle = fill;
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = isActive ? '#a84a2f' : COLOR.grid;
        ctx.lineWidth = isActive ? 2.5 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

        // value
        const showVal = (i === j) || filledNow || isActive;
        if (showVal) {
          let v = dp[i][j];
          if (isActive && !s.settled && s.phase === 'compare') v = s.candV;
          ctx.fillStyle = (isActive) ? '#ffffff' : COLOR.text;
          ctx.font = '700 ' + Math.round(cell * 0.36) + 'px "JetBrains Mono", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(v), x + cell / 2, y + cell / 2 + 1);
        }
      }
    }

    // ── right panel: array (top band) + split breakdown (mid band) ──
    const panelW = w - panelX - 24;
    // ARRAY BAND — sits near the matrix's top edge
    let py = gy0;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('a[1..' + N + ']', panelX, py + 2);
    py += 14;

    const ac = Math.min(52, panelW / N);
    const arrTop = py;
    for (let i = 1; i <= N; i++) {
      const x = panelX + (i - 1) * ac;
      let inActive = s.active && i >= s.active[0] && i <= s.active[1];
      let inLeft   = s.active && s.k != null && i >= s.active[0] && i <= s.k;
      let inRight  = s.active && s.k != null && i >= s.k + 1 && i <= s.active[1];
      let fill = COLOR.arrBg;
      if (inLeft)  fill = 'rgba(143,179,212,0.55)';
      if (inRight) fill = 'rgba(212,168,104,0.55)';
      ctx.fillStyle = fill;
      ctx.fillRect(x, arrTop, ac - 4, ac - 4);
      ctx.strokeStyle = inActive ? COLOR.active : COLOR.arrStroke;
      ctx.lineWidth = inActive ? 2 : 1;
      ctx.strokeRect(x + 0.5, arrTop + 0.5, ac - 5, ac - 5);
      ctx.fillStyle = COLOR.text;
      ctx.font = '700 ' + Math.round(ac * 0.34) + 'px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(A[i]), x + (ac - 4) / 2, arrTop + (ac - 4) / 2);
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(String(i), x + (ac - 4) / 2, arrTop + ac - 2);
    }

    // BREAKDOWN BAND — generous gap below the array, roomy line spacing
    py = arrTop + ac + 30;
    const valX = panelX + Math.min(210, panelW - 70);   // right-aligned value column
    const LH = 27;                                       // line height

    if (s.phase === 'compare' || s.phase === 'settle' || s.phase === 'answer') {
      const [i, j] = s.active;
      // header
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillText('dp[' + i + '][' + j + ']'
        + (s.phase === 'compare' ? '   試切點 k=' + s.k : '   k=' + s.k), panelX, py);
      py += LH + 4;

      const line = (label, val, color) => {
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = color; ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.fillText(label, panelX, py);
        ctx.fillStyle = COLOR.ink;
        ctx.textAlign = 'right';
        ctx.fillText('= ' + val, valX, py);
        py += LH;
      };

      if (s.phase === 'compare') {
        line('左 dp[' + i + '][' + s.k + ']', s.leftV, '#6f93b4');
        line('右 dp[' + (s.k + 1) + '][' + j + ']', s.rightV, '#b07c2f');
        line('+ sum[' + i + '..' + j + ']', s.sum, '#a8830d');
        // divider then total
        py += 4;
        ctx.strokeStyle = COLOR.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(panelX, py); ctx.lineTo(valX + 20, py); ctx.stroke();
        py += LH;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = s.isBest ? COLOR.chosen : COLOR.ink;
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.fillText('合計 = ' + s.candV + (s.isBest ? '   ✓ 最佳' : ''), panelX, py);
      } else {
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = COLOR.chosen;
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.fillText('dp[' + i + '][' + j + '] = ' + dp[i][j], panelX, py);
        py += LH + 6;
        ctx.fillStyle = COLOR.dim;
        ctx.font = '500 12px "Noto Sans TC", sans-serif';
        ctx.fillText('每次合成 [' + i + '..' + j + '] 必付 sum = ' + s.sum, panelX, py);
      }
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('dp[i][j] = min over k of', panelX, py);
      ctx.fillText('dp[i][k] + dp[k+1][j] + sum(i..j)', panelX, py + 24);
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
    }, 1100);
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
