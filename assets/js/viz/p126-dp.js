/* ============================================================
   P126 円円送禮物 — coloring-count DP visualization (視角 B)
   Matches code.html exactly: fix the FIRST coin's colour, run a
   per-last-colour linear DP, then sum the last-colour cells kept by
   ok(first,last) (only (G,B)/(B,G) endpoints excluded). No subtraction.

   Colours 0=R 1=G 2=B. Linear transition (G,B never adjacent):
       r' = r+g+b ,  g' = r+g ,  b' = r+b
   Walk N = 3:  first=R → 7,  first=G → 4,  first=B → 4   ⇒ 15.
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
    cellBg:  '#f4f6f8',
    R:       '#c7352a',
    G:       '#2e9d63',
    B:       '#2f6fb6',
    active:  '#d96e4e',   // cell being computed
    src:     '#d4a017',   // feeder cells (prev column)
    keep:    '#5fa866',   // last-colour cell kept by ok()
    drop:    '#cdb4b4',   // last-colour cell dropped by ok()
    text:    '#1f3550',
    ink:     '#1a1a1a',
    dim:     '#9a9a9a',
  };

  const N = 3;
  const ROWS = ['R', 'G', 'B'];
  const ROWCOL = [COLOR.R, COLOR.G, COLOR.B];
  const FEED = [[0, 1, 2], [0, 1], [0, 2]]; // R<-{R,G,B}, G<-{R,G}, B<-{R,B}
  const ok = (x, y) => !((x === 1 && y === 2) || (x === 2 && y === 1));

  // Precompute dp[first][n][k]  (n = 1..N, k = 0/1/2)
  const dp = [];
  for (let first = 0; first < 3; first++) {
    const tab = [null];
    let r = first === 0 ? 1 : 0, g = first === 1 ? 1 : 0, b = first === 2 ? 1 : 0;
    tab[1] = [r, g, b];
    for (let n = 2; n <= N; n++) {
      const nr = r + g + b, ng = r + g, nb = r + b;
      r = nr; g = ng; b = nb;
      tab[n] = [r, g, b];
    }
    dp.push(tab);
  }
  const contrib = [0, 1, 2].map(first =>
    [0, 1, 2].filter(l => ok(first, l)).reduce((s, l) => s + dp[first][N][l], 0));
  // contrib = [7, 4, 4]

  // ── Build steps ──
  // Each step renders ONE first-colour table at a given fill state.
  const steps = [];
  function snap(o) { steps.push(o); }

  snap({ phase: 'init', first: -1, fillUpto: 0, active: null, feeders: [], kept: null, running: 0,
    text: '<strong>INITIAL</strong> · 用 DP 數塗色法。狀態 <code>dp[i][色]</code> = 「前 i 個、末位該色」的方法數。' +
          '規則：<strong>綠(G) 與藍(B) 不可相鄰</strong>，<strong>頭尾也不可一藍一綠</strong>。' +
          '做法：<strong>固定第一個 coin 的顏色</strong>跑 3 次，末位用 <code>ok()</code> 過濾加總。看 N = 3。' });

  let running = 0;
  for (let first = 0; first < 3; first++) {
    // base column
    snap({ phase: 'base', first, fillUpto: 1, active: `1,${first}`, feeders: [], kept: null, running,
      text: `<strong>固定首色 = ${ROWS[first]}</strong> · base：<code>dp[1][${ROWS[first]}] = 1</code>，` +
            `其餘為 0（第 1 個就是首色）。` });

    // fill columns 2..N
    for (let n = 2; n <= N; n++) {
      for (let k = 0; k < 3; k++) {
        const feeders = FEED[k].map(pk => `${n - 1},${pk}`);
        const sumExpr = FEED[k].map(pk => dp[first][n - 1][pk]).join(' + ');
        snap({ phase: 'compute', first, fillUpto: n, active: `${n},${k}`, feeders, kept: null, running,
          text: `首色 ${ROWS[first]}：<code>dp[${n}][${ROWS[k]}] = ${sumExpr} = ${dp[first][n][k]}</code>` +
                (k === 1 ? '（G 不接 B）' : k === 2 ? '（B 不接 G）' : '（R 接任何色）') + '。' });
      }
    }

    // endpoint filter on the last column
    const keptCols = [0, 1, 2].filter(l => ok(first, l));
    const dropCols = [0, 1, 2].filter(l => !ok(first, l));
    const kterm = keptCols.map(l => dp[first][N][l]).join(' + ');
    const dropTxt = dropCols.length
      ? `丟末位 ${dropCols.map(l => ROWS[l]).join('/')}（會跟首色 ${ROWS[first]} 形成一藍一綠）`
      : '末位三色全收（首色 R 跟誰都不衝突）';
    running += contrib[first];
    snap({ phase: 'filter', first, fillUpto: N, active: null, feeders: [], kept: keptCols, running,
      text: `首色 ${ROWS[first]} · <strong>ok() 過濾末位</strong>：${dropTxt} ⇒ ` +
            `貢獻 = <code>${kterm} = ${contrib[first]}</code>。累計 ans = <strong>${running}</strong>。` });
  }

  snap({ phase: 'done', first: -1, fillUpto: 0, active: null, feeders: [], kept: null, running,
    text: `<strong>DONE</strong> · 三個首色貢獻 <code>${contrib[0]} + ${contrib[1]} + ${contrib[2]} = ${running}</code>。` +
          `與範例 <code>N=3 → 15</code> 相符 — 全程<strong>只有加總、沒有減法</strong>。` });

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 480;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Layout bands (top→bottom): banner | column headers | grid | contrib
  const BANNER_Y   = 34;   // baseline of the banner row
  const RULE_Y     = 58;   // hairline under banner
  const COLHEAD_Y  = 84;   // baseline of #1 #2 #3
  const GRID_TOP   = 100;  // grid starts here

  function geom() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const padX = 80, padBot = 116;   // padBot leaves room for the CONTRIB band
    const availW = w - padX - 28;
    const cell = Math.min(88, availW / N, (h - GRID_TOP - padBot) / 3);
    const gridW = cell * N, gridH = cell * 3;
    const x0 = padX, y0 = GRID_TOP;
    return { w, h, cell, x0, y0, gridW, gridH };
  }

  function draw() {
    const s = steps[step];
    const g = geom();
    const { w, h, cell, x0, y0, gridW, gridH } = g;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // ── BAND 1 · top banner: which first-colour run ──
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (s.first >= 0) {
      const sw = 24;
      ctx.fillStyle = ROWCOL[s.first];
      ctx.fillRect(x0 - 1, BANNER_Y - sw / 2, sw, sw);
      ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 1.5;
      ctx.strokeRect(x0 - 0.5, BANNER_Y - sw / 2 + 0.5, sw - 1, sw - 1);
      ctx.fillStyle = '#fff'; ctx.font = '700 13px "Oswald", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ROWS[s.first], x0 - 1 + sw / 2, BANNER_Y + 1);
      ctx.textAlign = 'left';
      ctx.fillStyle = COLOR.ink; ctx.font = '700 15px "Oswald", sans-serif';
      ctx.fillText('固定首色 = ' + ROWS[s.first] + ' · 跑末位 DP', x0 + sw + 10, BANNER_Y);
    } else {
      ctx.fillStyle = COLOR.ink; ctx.font = '700 15px "Oswald", sans-serif';
      ctx.fillText(s.phase === 'done' ? '三個首色加總 → 15' : '円円送禮物 · 固定首色 DP', x0 - 1, BANNER_Y);
    }
    // hairline under banner — clearly separates banner from the table
    ctx.strokeStyle = '#e6ddc6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 - 40, RULE_Y); ctx.lineTo(w - 24, RULE_Y); ctx.stroke();

    // ── BAND 2 · column headers (coin #) ──
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 1; i <= N; i++) {
      ctx.fillStyle = COLOR.dim; ctx.font = '700 13px "Oswald", sans-serif';
      ctx.fillText('coin #' + i, x0 + (i - 0.5) * cell, COLHEAD_Y);
    }
    // row headers (swatch)
    for (let k = 0; k < 3; k++) {
      const cy = y0 + (k + 0.5) * cell;
      ctx.fillStyle = ROWCOL[k];
      ctx.fillRect(x0 - 34, cy - 11, 22, 22);
      ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 1.4;
      ctx.strokeRect(x0 - 34 + 0.5, cy - 11 + 0.5, 21, 21);
      ctx.fillStyle = '#fff'; ctx.font = '700 12px "Oswald", sans-serif';
      ctx.fillText(ROWS[k], x0 - 34 + 11, cy + 1);
    }

    // ── cells ──
    const first = s.first;
    for (let i = 1; i <= N; i++) {
      for (let k = 0; k < 3; k++) {
        const x = x0 + (i - 1) * cell, y = y0 + k * cell;
        const key = `${i},${k}`;
        const shown = first >= 0 && i <= s.fillUpto;
        const isActive = s.active === key;
        const isFeeder = s.feeders.includes(key);
        const isLastCol = (i === N);
        const inKept = isLastCol && s.kept && s.kept.includes(k);
        const inDrop = isLastCol && s.kept && !s.kept.includes(k);

        // fill
        if (inKept) ctx.fillStyle = 'rgba(95,168,102,0.30)';
        else if (inDrop) ctx.fillStyle = 'rgba(205,180,180,0.45)';
        else if (isActive) ctx.fillStyle = COLOR.active;
        else if (isFeeder) ctx.fillStyle = 'rgba(212,160,23,0.20)';
        else ctx.fillStyle = shown ? COLOR.cellBg : '#fbfbfb';
        ctx.fillRect(x, y, cell, cell);

        // border
        ctx.strokeStyle = isActive ? '#a84a2f'
          : inKept ? COLOR.keep
          : inDrop ? '#b08a8a'
          : isFeeder ? COLOR.src : COLOR.grid;
        ctx.lineWidth = (isActive ? 4 : (inKept || inDrop || isFeeder ? 2.5 : 1));
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

        // value
        if (shown) {
          ctx.fillStyle = isActive ? '#fff' : ROWCOL[k];
          ctx.font = '700 ' + Math.round(cell * 0.34) + 'px "JetBrains Mono", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(dp[first][i][k]), x + cell / 2, y + cell / 2 + 1);
        }
        // drop ✗ / keep ✓ marker on last column during filter
        if (inDrop) {
          ctx.fillStyle = '#a05550'; ctx.font = '700 ' + Math.round(cell * 0.3) + 'px "Oswald", sans-serif';
          ctx.fillText('✗', x + cell - 13, y + 13);
        } else if (inKept) {
          ctx.fillStyle = '#3f7a47'; ctx.font = '700 ' + Math.round(cell * 0.3) + 'px "Oswald", sans-serif';
          ctx.fillText('✓', x + cell - 13, y + 13);
        }
      }
    }
    // outer border
    if (first >= 0) {
      ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 2.5;
      ctx.strokeRect(x0 - 1, y0 - 1, gridW + 2, gridH + 2);
    }

    // ── BAND 4 · contribution chips as an equation: [R:7] + [G:4] + [B:4] = Σ ──
    const bandTop = y0 + gridH + 22;           // clear gap below the grid
    // separating hairline
    ctx.strokeStyle = '#e6ddc6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 - 40, bandTop); ctx.lineTo(w - 24, bandTop); ctx.stroke();

    const labelY = bandTop + 18;
    const chipY  = bandTop + 46;               // chips on their own row, well below label
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = COLOR.dim;
    ctx.fillText('每個首色的貢獻 (ok 過濾後加總)', x0 - 1, labelY);

    const doneFirsts = s.phase === 'done' ? 3
      : (s.first < 0 ? 0 : (s.phase === 'filter' ? s.first + 1 : s.first));
    const chipW = 70, gap = 30;                // gap holds the "+" sign
    for (let fi = 0; fi < 3; fi++) {
      const px = x0 + fi * (chipW + gap);
      const done = fi < doneFirsts;
      ctx.fillStyle = done ? ROWCOL[fi] : '#f0f0f0';
      ctx.fillRect(px, chipY - 16, chipW, 32);
      ctx.strokeStyle = done ? COLOR.ink : '#d8d8d8'; ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, chipY - 15.5, chipW - 1, 31);
      ctx.fillStyle = done ? '#fff' : '#bbb';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(done ? `${ROWS[fi]}: ${contrib[fi]}` : `${ROWS[fi]}: ?`, px + chipW / 2, chipY + 1);
      // "+" between chips
      if (fi < 2) {
        ctx.fillStyle = COLOR.dim; ctx.font = '700 18px "Oswald", sans-serif';
        ctx.fillText('+', px + chipW + gap / 2, chipY);
      }
    }
    // "= Σ" total on the right
    const eqX = x0 + 3 * (chipW + gap) - gap + 14;
    ctx.fillStyle = COLOR.dim; ctx.font = '700 18px "Oswald", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('=', eqX, chipY);
    ctx.fillStyle = (s.phase === 'done') ? COLOR.keep : COLOR.ink;
    ctx.font = '700 22px "Oswald", sans-serif';
    ctx.fillText(String(s.running), eqX + 22, chipY + 1);
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
    timer = setInterval(() => { if (step >= steps.length - 1) { stop(); return; } next(); }, 1100);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } if (btnPlay) btnPlay.textContent = 'Play'; }

  btnPrev  && btnPrev .addEventListener('click', prev);
  btnNext  && btnNext .addEventListener('click', next);
  btnPlay  && btnPlay .addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', () => { fitCanvas(); draw(); });
  fitCanvas();
  update();
})();
