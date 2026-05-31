/* ============================================================
   P124 円円數磁磚 — 3×N domino tiling count visualization
   Style: white paper background, solid-color domino fills.
   Part A: enumerate the 3 ways to tile a 3×2 block (base f[2]=3),
           placing dominoes one at a time.
   Part B: show the coupled-state recurrence building f[4] = 11
           ( f[n] = f[n-2] + 2·g[n-1] , g[n] = f[n-1] + g[n-2] ).
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
    empty:   '#f4f6f8',
    grid:    '#cfcfcf',
    ink:     '#1a1a1a',
    dim:     '#9a9a9a',
    text:    '#1f3550',
    // domino palette — solid, distinct
    dom: ['#c7352a', '#2f6fb6', '#2e9d63', '#c98a24', '#6e41c8', '#0f9b9b'],
    active:  '#d96e4e',
    good:    '#5fa866',
  };

  const ROWS = 3;

  // The three tilings of a 3×2 block (cols 0..1, rows 0..2).
  // Each tiling = list of dominoes; each domino = [[r,c],[r,c]] + color index.
  // Tiling 1: three horizontal dominoes (each spans the 2 columns of its row)
  // Tiling 2: left column = 1 vertical (rows0-1) ... must pair 6 cells with 1x2.
  // Enumerate the 3 valid perfect matchings of a 3x2 grid:
  const TILINGS = [
    { name: '三條橫的', dominoes: [
        { cells: [[0,0],[0,1]], c: 0 },
        { cells: [[1,0],[1,1]], c: 1 },
        { cells: [[2,0],[2,1]], c: 2 },
      ] },
    { name: '上橫 + 兩直', dominoes: [
        { cells: [[0,0],[0,1]], c: 0 },   // top row horizontal
        { cells: [[1,0],[2,0]], c: 3 },   // left vertical (rows 1-2)
        { cells: [[1,1],[2,1]], c: 4 },   // right vertical (rows 1-2)
      ] },
    { name: '下橫 + 兩直', dominoes: [
        { cells: [[2,0],[2,1]], c: 2 },   // bottom row horizontal
        { cells: [[0,0],[1,0]], c: 3 },   // left vertical (rows 0-1)
        { cells: [[0,1],[1,1]], c: 4 },   // right vertical (rows 0-1)
      ] },
  ];

  // ── Build steps ──
  // Part A: for each tiling, place dominoes one by one.
  const steps = [];
  function snap(o) { steps.push(o); }

  snap({ part: 'A', tiling: -1, placed: 0,
    text: '<strong>INITIAL</strong> · 數「用 1×2 骨牌鋪滿 3×N 走廊」的方法數。' +
          '先看最小的非平凡情形 <strong>3×2</strong> — 動畫列出全部 3 種鋪法（base case f[2]=3）。' });

  for (let t = 0; t < TILINGS.length; t++) {
    const til = TILINGS[t];
    snap({ part: 'A', tiling: t, placed: 0,
      text: `<strong>鋪法 ${t + 1} / 3 · ${til.name}</strong> · 空的 3×2，開始放骨牌。` });
    for (let d = 1; d <= til.dominoes.length; d++) {
      const justCells = til.dominoes[d - 1].cells.map(([r, c]) => `(${r},${c})`).join('–');
      const orient = (til.dominoes[d - 1].cells[0][0] === til.dominoes[d - 1].cells[1][0]) ? '橫放' : '直放';
      snap({ part: 'A', tiling: t, placed: d,
        text: `鋪法 ${t + 1}：放第 ${d} 塊骨牌（${orient}）覆蓋 ${justCells}。` +
              (d === til.dominoes.length ? ' ✓ 鋪滿！' : '') });
    }
  }

  snap({ part: 'A', tiling: -2, placed: 0,
    text: '<strong>base case 完成</strong> · 3×2 共 <strong>3</strong> 種鋪法 ⇒ f[2] = 3。' +
          '注意 3×(奇數) 因格子數是奇數、骨牌蓋偶數格 ⇒ <strong>無法鋪滿，答案 0</strong>。' });

  // Part B: recurrence building f[4]
  snap({ part: 'B', show: 'states',
    text: '<strong>怎麼推到大的 N？</strong> 定義兩個狀態：' +
          '<code>f[n]</code> = 完整鋪滿 3×n；<code>g[n]</code> = 3×n 但<strong>多凸出一格</strong>（鋸齒邊界）。' });

  snap({ part: 'B', show: 'recur',
    text: '邊界只有「平的」或「凸一格」兩種型態 ⇒ 互相遞推：<br/>' +
          '<code>f[n] = f[n−2] + 2·g[n−1]</code>　·　<code>g[n] = f[n−1] + g[n−2]</code>。' });

  // numeric build f,g up to 4
  const f = [1, 0, 3, 0, 11];
  const g = [0, 1, 0, 4, 0];
  // compute g[2], g[3] for display: g[2]=f[1]+g[0]=0+0=0; g[3]=f[2]+g[1]=3+1=4
  snap({ part: 'B', show: 'table', upto: 1,
    text: 'base：<code>f[0]=1, f[1]=0</code>；<code>g[0]=0, g[1]=1</code>。' });
  snap({ part: 'B', show: 'table', upto: 2,
    text: '<code>f[2] = f[0] + 2·g[1] = 1 + 2 = 3</code>　·　<code>g[2] = f[1] + g[0] = 0</code>。' });
  snap({ part: 'B', show: 'table', upto: 3,
    text: '<code>f[3] = f[1] + 2·g[2] = 0</code>（奇數果然 0）　·　<code>g[3] = f[2] + g[1] = 3 + 1 = 4</code>。' });
  snap({ part: 'B', show: 'table', upto: 4,
    text: '<code>f[4] = f[2] + 2·g[3] = 3 + 8 = 11</code> ✓ 與範例 N=4 → 11 相符！' });

  snap({ part: 'B', show: 'compact',
    text: '<strong>消去 g 後</strong>得單一遞迴：<code>f[n] = 4·f[n−2] − f[n−4]</code>。' +
          '一次預處理所有 N，每筆查表 O(1)。N=100000 → 232803。' });

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

  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGrid3x2(s) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const cols = 2;
    const cell = Math.min(78, (h - 150) / ROWS, (w - 80) / cols);
    const gridW = cell * cols, gridH = cell * ROWS;
    const x0 = (w - gridW) / 2;
    const y0 = 64;

    // title
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.ink;
    ctx.font = '700 15px "Oswald", sans-serif';
    if (s.tiling >= 0) ctx.fillText('3 × 2 · ' + TILINGS[s.tiling].name, w / 2, 40);
    else ctx.fillText('3 × 2', w / 2, 40);

    // empty cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * cell, y = y0 + r * cell;
        ctx.fillStyle = COLOR.empty;
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = COLOR.grid; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      }
    }

    // placed dominoes
    if (s.tiling >= 0) {
      const til = TILINGS[s.tiling];
      for (let d = 0; d < s.placed; d++) {
        const dom = til.dominoes[d];
        const rs = dom.cells.map(c => c[0]), cs = dom.cells.map(c => c[1]);
        const rMin = Math.min(...rs), cMin = Math.min(...cs);
        const rMax = Math.max(...rs), cMax = Math.max(...cs);
        const x = x0 + cMin * cell + 4;
        const y = y0 + rMin * cell + 4;
        const ww = (cMax - cMin + 1) * cell - 8;
        const hh = (rMax - rMin + 1) * cell - 8;
        const isLast = (d === s.placed - 1);
        ctx.fillStyle = COLOR.dom[dom.c % COLOR.dom.length];
        roundRectPath(x, y, ww, hh, 7); ctx.fill();
        ctx.strokeStyle = isLast ? COLOR.ink : 'rgba(0,0,0,0.25)';
        ctx.lineWidth = isLast ? 3 : 1.5;
        roundRectPath(x, y, ww, hh, 7); ctx.stroke();
      }
    }

    // counter chips below (how many tilings shown so far)
    const by = y0 + gridH + 34;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillStyle = COLOR.dim;
    const shownCount = s.tiling === -2 ? 3 : (s.tiling >= 0 ? s.tiling + (s.placed === TILINGS[s.tiling].dominoes.length ? 1 : 0) : 0);
    ctx.fillText('TILINGS FOUND', x0 - 0, by);
    for (let i = 0; i < 3; i++) {
      const px = x0 + 132 + i * 30;
      ctx.fillStyle = i < shownCount ? COLOR.good : '#eeeeee';
      ctx.fillRect(px, by - 11, 22, 22);
      ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 1.4;
      ctx.strokeRect(px + 0.5, by - 10.5, 21, 21);
    }
    ctx.fillStyle = COLOR.good;
    ctx.font = '700 16px "Oswald", sans-serif';
    ctx.fillText('f[2] = ' + shownCount, x0 + 132 + 3 * 30 + 8, by);
  }

  function drawPartB(s) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // two state diagrams: flat boundary (f) and bump boundary (g)
    const drawProfile = (cx, cy, label, bump, color) => {
      const cell = 26;
      const x0 = cx - cell, y0 = cy - cell * 1.5;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          const x = x0 + c * cell, y = y0 + r * cell;
          ctx.fillStyle = '#eef2f6';
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = COLOR.grid; ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        }
      }
      // boundary marker
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      if (!bump) {
        ctx.beginPath(); ctx.moveTo(x0 + 2 * cell, y0); ctx.lineTo(x0 + 2 * cell, y0 + 3 * cell); ctx.stroke();
      } else {
        // jutting one cell at middle row
        ctx.fillStyle = color;
        ctx.fillRect(x0 + 2 * cell, y0 + cell, cell, cell);
        ctx.beginPath();
        ctx.moveTo(x0 + 2 * cell, y0); ctx.lineTo(x0 + 2 * cell, y0 + cell);
        ctx.lineTo(x0 + 3 * cell, y0 + cell); ctx.lineTo(x0 + 3 * cell, y0 + 2 * cell);
        ctx.lineTo(x0 + 2 * cell, y0 + 2 * cell); ctx.lineTo(x0 + 2 * cell, y0 + 3 * cell);
        ctx.stroke();
      }
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillText(label, cx + cell * 0.5, y0 + 3 * cell + 22);
    };

    if (s.show === 'states' || s.show === 'recur') {
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 15px "Oswald", sans-serif';
      ctx.fillText('兩種邊界型態', w / 2, 36);
      drawProfile(w * 0.32, h * 0.42, 'f[n] · 平邊界', false, COLOR.dom[1]);
      drawProfile(w * 0.66, h * 0.42, 'g[n] · 凸一格', true, COLOR.active);

      if (s.show === 'recur') {
        ctx.fillStyle = COLOR.text;
        ctx.font = '700 15px "JetBrains Mono", monospace';
        ctx.fillText('f[n] = f[n−2] + 2·g[n−1]', w / 2, h - 70);
        ctx.fillText('g[n] = f[n−1] + g[n−2]', w / 2, h - 44);
      }
      return;
    }

    if (s.show === 'table') {
      // f / g table for n = 0..4
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 15px "Oswald", sans-serif';
      ctx.fillText('遞推表 · f[n] 與 g[n]', w / 2, 36);

      const f = [1, 0, 3, 0, 11];
      const g = [0, 1, 0, 4, 0];
      const cols = 5;
      const cw = Math.min(82, (w - 120) / cols);
      const x0 = (w - cw * cols) / 2 + 30;
      const yF = h * 0.40, yG = h * 0.40 + 52;

      ctx.textAlign = 'right';
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillStyle = COLOR.dom[1]; ctx.fillText('f[n]', x0 - 12, yF + 18);
      ctx.fillStyle = COLOR.active; ctx.fillText('g[n]', x0 - 12, yG + 18);
      ctx.textAlign = 'center';
      ctx.fillStyle = COLOR.dim;
      for (let n = 0; n <= cols - 1; n++) ctx.fillText('n=' + n, x0 + n * cw + cw / 2, yF - 14);

      for (let n = 0; n < cols; n++) {
        const x = x0 + n * cw;
        const shown = n <= s.upto;
        // f cell
        ctx.fillStyle = shown ? '#eef2f6' : '#fbfbfb';
        ctx.fillRect(x, yF, cw - 6, 40);
        ctx.strokeStyle = (n === s.upto) ? COLOR.active : COLOR.grid;
        ctx.lineWidth = (n === s.upto) ? 3 : 1;
        ctx.strokeRect(x + 0.5, yF + 0.5, cw - 7, 39);
        if (shown) { ctx.fillStyle = COLOR.text; ctx.font = '700 16px "JetBrains Mono", monospace';
          ctx.fillText(String(f[n]), x + (cw - 6) / 2, yF + 21); }
        // g cell
        ctx.fillStyle = shown ? '#eef2f6' : '#fbfbfb';
        ctx.fillRect(x, yG, cw - 6, 40);
        ctx.strokeStyle = (n === s.upto) ? COLOR.active : COLOR.grid;
        ctx.lineWidth = (n === s.upto) ? 3 : 1;
        ctx.strokeRect(x + 0.5, yG + 0.5, cw - 7, 39);
        if (shown) { ctx.fillStyle = COLOR.text; ctx.font = '700 16px "JetBrains Mono", monospace';
          ctx.fillText(String(g[n]), x + (cw - 6) / 2, yG + 21); }
      }

      if (s.upto >= 4) {
        ctx.fillStyle = COLOR.good;
        ctx.font = '700 17px "Oswald", sans-serif';
        ctx.fillText('f[4] = 11  ✓', w / 2, yG + 80);
      }
      return;
    }

    if (s.show === 'compact') {
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 16px "Oswald", sans-serif';
      ctx.fillText('消去 g 後的單一遞迴', w / 2, h * 0.34);
      ctx.fillStyle = COLOR.active;
      ctx.font = '700 26px "JetBrains Mono", monospace';
      ctx.fillText('f[n] = 4·f[n−2] − f[n−4]', w / 2, h * 0.5);
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.fillText('f[0]=1, f[2]=3；奇數 N → 0；mod 1000007', w / 2, h * 0.62);
      ctx.fillStyle = COLOR.good;
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillText('N=100000 → 232803', w / 2, h * 0.74);
      return;
    }
  }

  function draw() {
    const s = steps[step];
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);
    if (s.part === 'A') drawGrid3x2(s);
    else drawPartB(s);
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
