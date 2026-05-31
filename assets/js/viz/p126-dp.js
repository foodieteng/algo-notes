/* ============================================================
   P126 円円送禮物 — DP coloring count visualization
   Style: white paper background, solid-color fills.
   Shows the per-coin DP table (3 colors R/G/B) filling left→right
   for N = 3, with the transition rule (G,B not adjacent), then the
   endpoint correction (頭尾不能一藍一綠) giving the final 15.

   Linear DP per position i, by last color:
       r[i] = r[i-1] + g[i-1] + b[i-1]   // R 可接任何色
       g[i] = r[i-1] + g[i-1]            // G 不可接 B
       b[i] = r[i-1] + b[i-1]            // B 不可接 G
   Linear total(3) = 17; minus 2 forbidden {G,B}-end seqs = 15.
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
    R:       '#c7352a',
    G:       '#2e9d63',
    B:       '#2f6fb6',
    cellBg:  '#f4f6f8',
    active:  '#d96e4e',   // cell being computed — coral outline
    src:     '#d4a017',   // source cells feeding the active one — yellow
    text:    '#1f3550',
    ink:     '#1a1a1a',
    dim:     '#9a9a9a',
    good:    '#5fa866',
  };

  const N = 3;
  const ROWS = ['R', 'G', 'B'];
  const ROWCOL = [COLOR.R, COLOR.G, COLOR.B];

  // which previous rows feed row k:  R<-{R,G,B}, G<-{R,G}, B<-{R,B}
  const FEED = [[0, 1, 2], [0, 1], [0, 2]];

  // Precompute dp values: dp[i][k], i=1..N (1-indexed), k=0 R,1 G,2 B
  const dp = [];
  dp[1] = [1, 1, 1];
  for (let i = 2; i <= N; i++) {
    dp[i] = [
      dp[i - 1][0] + dp[i - 1][1] + dp[i - 1][2],
      dp[i - 1][0] + dp[i - 1][1],
      dp[i - 1][0] + dp[i - 1][2],
    ];
  }

  // ── Build steps ──
  // A step reveals/animates one cell (i,k) or a summary action.
  // step kinds: 'init', 'base', 'compute' (with feeders), 'lineartotal',
  //             'endpoint', 'final'
  const steps = [];
  function snap(filled, active, feeders, kind, text) {
    steps.push({ filled: filled.map(r => r.slice()), active, feeders: feeders ? feeders.slice() : [], kind, text });
  }

  // filled[i][k] = whether cell shown (1-indexed; index 0 unused)
  const empty = () => [null, [false, false, false], [false, false, false], [false, false, false]];
  let filled = empty();

  snap(filled, null, [], 'init',
    '<strong>INITIAL</strong> · 用 DP 數塗色方法。狀態 <code>dp[i][色]</code> = 「前 i 個、第 i 個塗該色」的方法數。' +
    '規則：<strong>綠 (G) 與藍 (B) 不可相鄰</strong>。先看 N = 3。');

  // base case i=1
  for (let k = 0; k < 3; k++) {
    filled[1][k] = true;
  }
  snap(filled, null, [], 'base',
    '<strong>base</strong> · <code>dp[1][R]=dp[1][G]=dp[1][B]=1</code>。第 1 個 coin 隨便塗，三色各一種。');

  // compute i=2,3
  for (let i = 2; i <= N; i++) {
    for (let k = 0; k < 3; k++) {
      const feeders = FEED[k].map(pk => `${i - 1},${pk}`);
      snap(filled, `${i},${k}`, feeders, 'compute-pre',
        `算 <code>dp[${i}][${ROWS[k]}]</code>：第 ${i} 個塗 <strong>${ROWS[k]}</strong>，` +
        `要加總「第 ${i - 1} 個塗 ${FEED[k].map(x => ROWS[x]).join(' / ')}」的方法數` +
        (k === 1 ? '（不能接 B）' : k === 2 ? '（不能接 G）' : '（接誰都行）') + '。');
      filled[i][k] = true;
      const sumExpr = FEED[k].map(pk => dp[i - 1][pk]).join(' + ');
      snap(filled, `${i},${k}`, feeders, 'compute',
        `<code>dp[${i}][${ROWS[k]}] = ${sumExpr} = ${dp[i][k]}</code>。`);
    }
  }

  const linearTotal = dp[N][0] + dp[N][1] + dp[N][2];
  snap(filled, null, [`${N},0`, `${N},1`, `${N},2`], 'lineartotal',
    `把最後一欄加起來：<code>${dp[N][0]} + ${dp[N][1]} + ${dp[N][2]} = ${linearTotal}</code>。` +
    `這是「只管相鄰」的<strong>線性</strong>方法數，但<strong>還沒處理頭尾</strong>。`);

  snap(filled, null, [], 'endpoint',
    `<strong>頭尾修正</strong> · 規則還要求「第 1 個與第 N 個<strong>不能一藍一綠</strong>」。` +
    `在這 ${linearTotal} 種裡，頭尾恰為 {G,B} 的有 <strong>2</strong> 種（G…B 與 B…G）⇒ 扣掉。`);

  snap(filled, null, [], 'final',
    `<strong>DONE</strong> · 答案 = <code>${linearTotal} − 2 = ${linearTotal - 2}</code>。` +
    `與題目範例 <code>N=3 → 15</code> 相符。`);

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 380;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function geom() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const padTop = 54, padX = 70, padBot = 70;
    const availW = w - padX - 24;
    const cell = Math.min(96, availW / N, (h - padTop - padBot) / 3);
    const gridW = cell * N, gridH = cell * 3;
    const x0 = padX;
    const y0 = padTop;
    return { w, h, cell, x0, y0, gridW, gridH };
  }

  function draw() {
    const s = steps[step];
    const g = geom();
    const { w, h, cell, x0, y0, gridW, gridH } = g;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // column headers (coin 1..N)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('coin →', x0 + gridW / 2, y0 - 34);
    for (let i = 1; i <= N; i++) {
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 14px "Oswald", sans-serif';
      ctx.fillText('#' + i, x0 + (i - 0.5) * cell, y0 - 14);
    }

    // row headers (R/G/B swatch)
    for (let k = 0; k < 3; k++) {
      const cy = y0 + (k + 0.5) * cell;
      ctx.fillStyle = ROWCOL[k];
      ctx.fillRect(x0 - 34, cy - 11, 22, 22);
      ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 1.5;
      ctx.strokeRect(x0 - 34 + 0.5, cy - 11 + 0.5, 21, 21);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 12px "Oswald", sans-serif';
      ctx.fillText(ROWS[k], x0 - 34 + 11, cy + 1);
    }

    // cells
    for (let i = 1; i <= N; i++) {
      for (let k = 0; k < 3; k++) {
        const x = x0 + (i - 1) * cell;
        const y = y0 + k * cell;
        const key = `${i},${k}`;
        const isActive = s.active === key;
        const isFeeder = s.feeders.includes(key);
        const shown = s.filled[i] && s.filled[i][k];

        ctx.fillStyle = shown ? COLOR.cellBg : '#fbfbfb';
        ctx.fillRect(x, y, cell, cell);

        if (isFeeder) {
          ctx.fillStyle = 'rgba(212,160,23,0.18)';
          ctx.fillRect(x, y, cell, cell);
        }

        ctx.strokeStyle = COLOR.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

        if (shown) {
          ctx.fillStyle = ROWCOL[k];
          ctx.font = '700 ' + Math.round(cell * 0.34) + 'px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(dp[i][k]), x + cell / 2, y + cell / 2 + 1);
        }

        if (isFeeder) {
          ctx.strokeStyle = COLOR.src;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
        }
        if (isActive) {
          ctx.strokeStyle = COLOR.active;
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        }
      }
    }

    // last-column highlight + total when relevant
    if (s.kind === 'lineartotal' || s.kind === 'endpoint' || s.kind === 'final') {
      const lx = x0 + (N - 1) * cell;
      ctx.strokeStyle = COLOR.good;
      ctx.lineWidth = 3;
      ctx.strokeRect(lx + 1, y0 + 1, cell - 2, gridH - 2);
    }

    // ── lower band: running formula ──
    const by = y0 + gridH + 26;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const linTot = dp[N][0] + dp[N][1] + dp[N][2];

    if (s.kind === 'lineartotal') {
      ctx.fillStyle = COLOR.text;
      ctx.fillText(`linear total = ${dp[N][0]} + ${dp[N][1]} + ${dp[N][2]} = ${linTot}`, x0 - 34, by);
    } else if (s.kind === 'endpoint') {
      ctx.fillStyle = COLOR.text;
      ctx.fillText(`linear ${linTot}  −  頭尾 {G,B} 的 2 種`, x0 - 34, by);
    } else if (s.kind === 'final') {
      ctx.fillStyle = COLOR.good;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillText(`答案 = ${linTot} − 2 = ${linTot - 2}`, x0 - 34, by);
    } else {
      // show the transition rule legend
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 12px "Noto Sans TC", sans-serif';
      ctx.fillText('轉移：R 接任何色 · G 不接 B · B 不接 G（黃框 = 來源格）', x0 - 34, by);
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
    }, 1150);
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
