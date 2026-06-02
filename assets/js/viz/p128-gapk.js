/* ============================================================
   P128 取數字2 — max subset sum with any-two-distance >= K
   Generalises P127 (House Robber): dp[i] = max(dp[i-1], dp[i-K] + a[i]).
   Style: white paper background, solid-color fills.
   Walks the 1-indexed dp over a = [1,3,4,2] with K = 3 (sample #2,
   answer 4). Shows the array, the dp row filling left→right, which of
   the two candidates wins each step (with the dp[i-K] feeder
   highlighted K cells back), and a final backtrack of the chosen set.
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
    active:   '#d96e4e',   // current dp[i] being computed
    skip:     '#d4a017',   // candidate: dp[i-1]  (skip a[i])
    take:     '#5fa866',   // candidate: dp[i-K]+a[i] (take a[i])
    chosen:   '#5fa866',   // picked elements in backtrack
    dimEl:    '#cfcfcf',
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
  };

  // 1-indexed. A[0] is a dummy/sentinel so a[1..N] match the problem.
  const Araw = [1, 3, 4, 2];        // sample #2 array
  const K    = 3;                   // sample #2 K (answer 4)
  const N    = Araw.length;
  const A    = [0, ...Araw];        // A[1..N]

  // dp[i] = best using a[1..i], any two picked indices differ by >= K.
  // dp[0] = 0; take a[i] -> connect dp[i-K] (i-K may be <= 0 => dp[0]=0).
  const dp   = new Array(N + 1).fill(0);
  const took = new Array(N + 1).fill(false); // did dp[i] take a[i]?
  for (let i = 1; i <= N; i++) {
    const skipV = dp[i - 1];
    const feeder = (i - K >= 0) ? dp[i - K] : 0;
    const takeV = feeder + A[i];
    if (takeV > skipV) { dp[i] = takeV; took[i] = true; }
    else { dp[i] = skipV; took[i] = false; }
  }
  // backtrack chosen set
  const chosen = new Array(N + 1).fill(false);
  {
    let i = N;
    while (i >= 1) {
      if (took[i]) { chosen[i] = true; i -= K; }
      else { i -= 1; }
    }
  }

  // ── steps ──
  const steps = [];
  function snap(o) { steps.push(o); }

  snap({ filledUpto: 0, active: -1, cand: null, phase: 'init',
    text: '<strong>INITIAL</strong> · 從陣列取一些數、<strong>任兩個被取的 index 距離 ≥ K</strong>，求最大總和。' +
          `本例 a = [1, 3, 4, 2]、<strong>K = ${K}</strong>（取了某格後，下一個最近能取的在 K 格之後）。` +
          '用 1-indexed <code>dp[i]</code> = 「只看 a[1..i] 的最大合法和」，<code>dp[0]=0</code>。' });

  for (let i = 1; i <= N; i++) {
    const skipV = dp[i - 1];
    const feederIdx = i - K;
    const feeder = (feederIdx >= 0) ? dp[feederIdx] : 0;
    const takeV = feeder + A[i];
    snap({ filledUpto: i - 1, active: i, cand: 'pre', skipV, takeV,
           feederIdx, feeder, phase: 'compare',
      text: `算 <code>dp[${i}]</code>：兩個選擇 —<br/>` +
            `<span style="color:#d4a017">跳過 a[${i}]</span> ⇒ <code>dp[${i - 1}] = ${skipV}</code>　·　` +
            `<span style="color:#5fa866">取 a[${i}]=${A[i]}</span> ⇒ 接 <code>dp[${feederIdx >= 0 ? feederIdx : 0}] = ${feeder}</code>` +
            ` ⇒ <code>${feeder} + ${A[i]} = ${takeV}</code>` +
            (feederIdx <= 0 ? '（i−K ≤ 0 ⇒ 接 dp[0]=0，等於只取這一個）' : `（往回跳 K=${K} 格保證距離 ≥ K）`) });
    snap({ filledUpto: i, active: i, cand: 'pre', skipV, takeV,
           feederIdx, feeder, phase: 'compute', winnerTook: took[i],
      text: `<code>dp[${i}] = max(${skipV}, ${takeV}) = ${dp[i]}</code> ` +
            `（${took[i] ? '<span style="color:#5fa866">取 a[' + i + ']</span>' : '<span style="color:#d4a017">跳過 a[' + i + ']</span>'}）。` });
  }

  snap({ filledUpto: N, active: -1, cand: null, phase: 'answer',
    text: `<strong>答案 = dp[${N}] = ${dp[N]}</strong>。最後一格就是整個陣列的最佳解。` });

  snap({ filledUpto: N, active: -1, cand: null, phase: 'backtrack',
    text: `<strong>回溯被選中的數</strong>：綠色就是被取的元素（彼此 index 距離 ≥ ${K}）。本例取 ` +
          (chosen.map((c, i) => c ? `a[${i}]=${A[i]}` : null).filter(Boolean).join(' + ') || '（空）') +
          ` = ${dp[N]}。` });

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 360;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function geom() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const padX = 56, padTop = 58, rowGap = 36;
    // N cells for a[1..N]; reserve a little left margin for the row label
    const cell = Math.min(86, (w - padX * 2) / N);
    const gridW = cell * N;
    const x0 = (w - gridW) / 2;
    const arrY = padTop;
    const dpY = arrY + cell + rowGap;
    return { w, h, cell, x0, arrY, dpY, gridW };
  }

  // draw a row of cells for indices 1..N (i maps to slot i-1)
  function drawRow(label, y, vals, opts) {
    const { cell, x0 } = geom();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(label, x0 - 12, y + cell / 2);

    for (let i = 1; i <= N; i++) {
      const x = x0 + (i - 1) * cell;
      const show = opts.show(i);
      ctx.fillStyle = opts.fill(i, show);
      ctx.fillRect(x, y, cell, cell);

      ctx.strokeStyle = opts.stroke ? opts.stroke(i) : COLOR.grid;
      ctx.lineWidth = opts.lw ? opts.lw(i) : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

      if (show) {
        ctx.fillStyle = opts.textColor ? opts.textColor(i) : COLOR.text;
        ctx.font = '700 ' + Math.round(cell * 0.34) + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(vals[i]), x + cell / 2, y + cell / 2 + 1);
      }
      // index label (1-based)
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (opts.idx) ctx.fillText(String(i), x + cell / 2, y + cell + 4);
    }
  }

  function draw() {
    const s = steps[step];
    const g = geom();
    const { w, h, cell, x0, arrY, dpY } = g;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // array row
    drawRow('a[ ]', arrY, A, {
      show: () => true,
      idx: true,
      fill: (i) => {
        if (s.phase === 'backtrack' && chosen[i]) return COLOR.chosen;
        if (s.active === i) return COLOR.active;
        return COLOR.arrBg;
      },
      stroke: (i) => {
        if (s.phase === 'backtrack' && chosen[i]) return '#3f7a47';
        if (s.active === i) return '#a84a2f';
        return COLOR.arrStroke;
      },
      lw: (i) => (s.active === i || (s.phase === 'backtrack' && chosen[i])) ? 2.5 : 1,
      textColor: (i) => {
        if (s.phase === 'backtrack' && chosen[i]) return '#ffffff';
        if (s.active === i) return '#ffffff';
        return COLOR.text;
      },
    });

    // dp row
    drawRow('dp[ ]', dpY, dp, {
      show: (i) => i <= s.filledUpto,
      idx: true,
      fill: (i) => {
        if (i > s.filledUpto) return '#fbfbfb';
        if (s.active === i) return COLOR.active;
        if ((s.phase === 'compare' || s.phase === 'compute') && s.cand === 'pre') {
          if (i === s.active - 1) return 'rgba(212,160,23,0.30)';   // skip feeder dp[i-1]
          if (i === s.feederIdx && s.feederIdx >= 1) return 'rgba(95,168,102,0.30)'; // take feeder dp[i-K]
        }
        return COLOR.cellBg;
      },
      stroke: (i) => {
        if (s.active === i) return '#a84a2f';
        if ((s.phase === 'compare' || s.phase === 'compute') && s.cand === 'pre') {
          if (i === s.active - 1) return COLOR.skip;
          if (i === s.feederIdx && s.feederIdx >= 1) return COLOR.take;
        }
        return COLOR.grid;
      },
      lw: (i) => (s.active === i) ? 4
        : ((s.cand === 'pre' && (i === s.active - 1 || (i === s.feederIdx && s.feederIdx >= 1))) ? 2.5 : 1),
      textColor: (i) => (s.active === i) ? '#ffffff' : COLOR.text,
    });

    // arrow showing the K-jump from active dp[i] back to dp[i-K] (the "take" link)
    if (s.cand === 'pre' && s.feederIdx >= 1 && s.active >= 1) {
      const ax = x0 + (s.active - 1) * cell + cell / 2;
      const fx = x0 + (s.feederIdx - 1) * cell + cell / 2;
      const ay = dpY - 8;
      ctx.strokeStyle = COLOR.take;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.bezierCurveTo(ax, ay - 26, fx, ay - 26, fx, ay);
      ctx.stroke();
      ctx.setLineDash([]);
      // little arrowhead at feeder
      ctx.fillStyle = COLOR.take;
      ctx.beginPath();
      ctx.moveTo(fx, ay);
      ctx.lineTo(fx - 4, ay - 7);
      ctx.lineTo(fx + 4, ay - 7);
      ctx.closePath();
      ctx.fill();
      // label "K"
      ctx.fillStyle = COLOR.take;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('jump K=' + K, (ax + fx) / 2, ay - 28);
    }

    // candidate comparison panel (lower band)
    const by = dpY + cell + 34;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (s.cand === 'pre') {
      const win = s.winnerTook;  // undefined during compare
      const drawChip = (cx, color, label, val, isWin) => {
        ctx.fillStyle = isWin ? color : '#ffffff';
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.fillRect(cx, by - 16, 232, 32);
        ctx.strokeRect(cx + 0.5, by - 15.5, 231, 31);
        ctx.fillStyle = isWin ? '#ffffff' : color;
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(label + ' = ' + val, cx + 12, by);
      };
      drawChip(x0, COLOR.skip, '跳過: dp[i-1]', s.skipV, win === false);
      drawChip(x0 + 252, COLOR.take, '取 : dp[i-K]+a[i]', s.takeV, win === true);
      if (win !== undefined) {
        ctx.fillStyle = COLOR.ink;
        ctx.font = '700 18px "Oswald", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('→ ' + Math.max(s.skipV, s.takeV), x0 + 504, by);
      }
    } else if (s.phase === 'answer' || s.phase === 'backtrack') {
      ctx.fillStyle = COLOR.chosen;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('answer = dp[' + N + '] = ' + dp[N], x0, by);
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 12px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('dp[i] = max( 跳過 a[i] = dp[i-1] ,  取 a[i] = dp[i-K] + a[i] )', x0, by);
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
  fitCanvas();
  update();
})();
