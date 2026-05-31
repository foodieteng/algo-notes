/* ============================================================
   P127 取數字1 — max non-adjacent subset sum (House Robber) viz
   Style: white paper background, solid-color fills.
   Walks dp[i] = max(dp[i-1], dp[i-2] + a[i]) over a = [1,3,4,2]
   (sample #2, answer 5). Shows the array, the dp row filling
   left→right, which of the two candidates wins each step, and a
   final backtrack highlighting the chosen (non-adjacent) elements.
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
    take:     '#5fa866',   // candidate: dp[i-2]+a[i] (take a[i])
    chosen:   '#5fa866',   // picked elements in backtrack
    dimEl:    '#cfcfcf',
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
  };

  const A = [1, 3, 4, 2];          // sample #2
  const N = A.length;

  // dp[i] = best using a[0..i]; dp[-1]=0, dp[0]=a[0]
  const dp = new Array(N).fill(0);
  const took = new Array(N).fill(false); // did dp[i] take a[i]?
  dp[0] = A[0]; took[0] = true;
  if (N > 1) {
    if (A[1] > A[0]) { dp[1] = A[1]; took[1] = true; }
    else { dp[1] = A[0]; took[1] = false; }
  }
  for (let i = 2; i < N; i++) {
    const skipV = dp[i - 1];
    const takeV = dp[i - 2] + A[i];
    if (takeV > skipV) { dp[i] = takeV; took[i] = true; }
    else { dp[i] = skipV; took[i] = false; }
  }
  // backtrack chosen set
  const chosen = new Array(N).fill(false);
  {
    let i = N - 1;
    while (i >= 0) {
      if (took[i]) { chosen[i] = true; i -= 2; }
      else { i -= 1; }
    }
  }

  // ── steps ──
  const steps = [];
  function snap(o) { steps.push(o); }

  snap({ filledUpto: -1, active: -1, cand: null, phase: 'init',
    text: '<strong>INITIAL</strong> · 從陣列取一些數、<strong>任兩個不相鄰</strong>，求最大總和。' +
          '用 <code>dp[i]</code> = 「只看 a[0..i] 時的最大和」。範例 a = [1, 3, 4, 2]。' });

  // i=0
  snap({ filledUpto: 0, active: 0, cand: 'base', phase: 'compute',
    text: `<code>dp[0] = a[0] = ${A[0]}</code>。只有一個數，取它最大。` });
  // i=1
  snap({ filledUpto: 1, active: 1, cand: 'pair', skipV: A[0], takeV: A[1], phase: 'compute',
    text: `<code>dp[1] = max(a[0], a[1]) = max(${A[0]}, ${A[1]}) = ${dp[1]}</code>。` +
          `相鄰只能二選一，取大的。` });
  // i>=2
  for (let i = 2; i < N; i++) {
    const skipV = dp[i - 1], takeV = dp[i - 2] + A[i];
    snap({ filledUpto: i - 1, active: i, cand: 'pre', skipV, takeV, phase: 'compare',
      text: `算 <code>dp[${i}]</code>：兩個選擇 —<br/>` +
            `<span style="color:#d4a017">跳過 a[${i}]</span> ⇒ <code>dp[${i - 1}] = ${skipV}</code>　·　` +
            `<span style="color:#5fa866">取 a[${i}]=${A[i]}</span> ⇒ <code>dp[${i - 2}] + ${A[i]} = ${dp[i - 2]} + ${A[i]} = ${takeV}</code>` });
    snap({ filledUpto: i, active: i, cand: 'pre', skipV, takeV, phase: 'compute', winnerTook: took[i],
      text: `<code>dp[${i}] = max(${skipV}, ${takeV}) = ${dp[i]}</code> ` +
            `（${took[i] ? '<span style="color:#5fa866">取 a[' + i + ']</span>' : '<span style="color:#d4a017">跳過 a[' + i + ']</span>'}）。` });
  }

  snap({ filledUpto: N - 1, active: -1, cand: null, phase: 'answer',
    text: `<strong>答案 = dp[${N - 1}] = ${dp[N - 1]}</strong>。最後一格就是整個陣列的最佳解。` });

  snap({ filledUpto: N - 1, active: -1, cand: null, phase: 'backtrack',
    text: `<strong>回溯被選中的數</strong>：綠色就是被取的元素（彼此不相鄰）。本例取 ` +
          chosen.map((c, i) => c ? `a[${i}]=${A[i]}` : null).filter(Boolean).join(' + ') +
          ` = ${dp[N - 1]}。` });

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 340;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function geom() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const padX = 48, padTop = 56, rowGap = 34;
    const cell = Math.min(86, (w - padX * 2) / N);
    const gridW = cell * N;
    const x0 = (w - gridW) / 2;
    const arrY = padTop;
    const dpY = arrY + cell + rowGap;
    return { w, h, cell, x0, arrY, dpY, gridW };
  }

  function drawRow(label, y, vals, opts) {
    const { cell, x0 } = geom();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(label, x0 - 12, y + cell / 2);

    for (let i = 0; i < N; i++) {
      const x = x0 + i * cell;
      const show = opts.show(i);
      let fill = opts.fill(i, show);
      ctx.fillStyle = fill;
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
      // index
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
        // highlight a[i-2] feeder when taking
        if (s.cand === 'pre' && i === s.active) return COLOR.active;
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
        // feeders during compare/compute on active i
        if ((s.phase === 'compare' || s.phase === 'compute') && s.cand === 'pre') {
          if (i === s.active - 1) return 'rgba(212,160,23,0.30)';  // skip feeder dp[i-1]
          if (i === s.active - 2) return 'rgba(95,168,102,0.30)';  // take feeder dp[i-2]
        }
        return COLOR.cellBg;
      },
      stroke: (i) => {
        if (s.active === i) return '#a84a2f';
        if ((s.phase === 'compare' || s.phase === 'compute') && s.cand === 'pre') {
          if (i === s.active - 1) return COLOR.skip;
          if (i === s.active - 2) return COLOR.take;
        }
        return COLOR.grid;
      },
      lw: (i) => (s.active === i) ? 4 : ((s.cand === 'pre' && (i === s.active - 1 || i === s.active - 2)) ? 2.5 : 1),
      textColor: (i) => (s.active === i) ? '#ffffff' : COLOR.text,
    });

    // candidate comparison panel (lower band)
    const by = dpY + cell + 30;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    if (s.cand === 'pre') {
      // two chips: skip vs take
      const win = s.winnerTook;  // undefined during compare
      const drawChip = (cx, color, label, val, isWin) => {
        ctx.fillStyle = isWin ? color : '#ffffff';
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.fillRect(cx, by - 16, 210, 32);
        ctx.strokeRect(cx + 0.5, by - 15.5, 209, 31);
        ctx.fillStyle = isWin ? '#ffffff' : color;
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(label + ' = ' + val, cx + 12, by);
      };
      drawChip(x0, COLOR.skip, '跳過: dp[i-1]', s.skipV, win === false);
      drawChip(x0 + 230, COLOR.take, '取 : dp[i-2]+a[i]', s.takeV, win === true);
      if (win !== undefined) {
        ctx.fillStyle = COLOR.ink;
        ctx.font = '700 18px "Oswald", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('→ ' + Math.max(s.skipV, s.takeV), x0 + 460, by);
      }
    } else if (s.phase === 'answer' || s.phase === 'backtrack') {
      ctx.fillStyle = COLOR.chosen;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('answer = dp[' + (N - 1) + '] = ' + dp[N - 1], x0, by);
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 12px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('dp[i] = max( 跳過 a[i] = dp[i-1] ,  取 a[i] = dp[i-2] + a[i] )', x0, by);
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
