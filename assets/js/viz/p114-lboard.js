/* ============================================================
   P114 王老先生 — L-tromino divide & conquer visualization
   Style: white paper background, solid-color L fills
   ============================================================ */

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const stepEl    = document.getElementById('viz-step');
  const labelEl   = document.getElementById('viz-label');
  const btnPrev   = document.getElementById('viz-prev');
  const btnNext   = document.getElementById('viz-next');
  const btnPlay   = document.getElementById('viz-play');
  const btnReset  = document.getElementById('viz-reset');

  const COLOR = {
    paper:      '#ffffff',
    grid:       '#cfcfcf',
    cellBorder: '#888888',
    cellText:   '#666666',
    special:    '#1a1a1a',
    specialMark:'#ffffff',
    boardEdge:  '#1a1a1a',
    activeEdge: '#000000',
    // L fill colors — solid, distinct, readable on white
    L: [
      '#c1440e', // L1 · Center  · rust
      '#e85d1f', // L2 · TL      · bright orange
      '#d4a017', // L3 · TR      · warning yellow
      '#6ba368', // L4 · BL      · green
      '#6a7a8a', // L5 · BR      · steel blue
    ],
    LText: [    // text color used on top of each L fill
      '#ffffff','#ffffff','#1a1a1a','#ffffff','#ffffff',
    ],
  };

  const N = 4;
  const SPECIAL = [3, 4];

  // L placements in animation order
  const LS = [
    {
      cells: [[2,2],[2,3],[3,2]],
      title: 'L1 · CENTER',
      desc:  '在棋盤正中央放第 1 個 L，覆蓋 TL / TR / BL 三象限最靠近中心的角落。這 3 格之後在各自象限的遞迴裡會被當成新的 blocked。',
      isBase: false,
      call:   'tile(1, 1, 4, 3, 4) — 遞迴非 base 部份'
    },
    {
      cells: [[1,1],[1,2],[2,1]],
      title: 'L2 · TL  ▸  BASE CASE',
      desc:  '遞迴到左上 2×2 子板。<strong>n = 2 命中 base case</strong> — 4 格扣掉 blocked (2,2) 後剩 3 格本身就是 L，直接 Report。',
      isBase: true,
      call:   'tile(1, 1, 2, 2, 2)  →  base case'
    },
    {
      cells: [[1,3],[1,4],[2,4]],
      title: 'L3 · TR  ▸  BASE CASE',
      desc:  '右上 2×2 子板。<strong>base case</strong>：4 格扣掉 blocked (2,3) 後剩 3 格組成 L3。',
      isBase: true,
      call:   'tile(1, 3, 2, 2, 3)  →  base case'
    },
    {
      cells: [[3,1],[4,1],[4,2]],
      title: 'L4 · BL  ▸  BASE CASE',
      desc:  '左下 2×2 子板。<strong>base case</strong>：4 格扣掉 blocked (3,2) 後剩 3 格組成 L4。',
      isBase: true,
      call:   'tile(3, 1, 2, 3, 2)  →  base case'
    },
    {
      cells: [[3,3],[4,3],[4,4]],
      title: 'L5 · BR  ▸  BASE CASE',
      desc:  '右下 2×2 子板。<strong>base case</strong>：4 格扣掉「原本的 special (3,4)」剩 3 格組成 L5 — 王老先生的格子保留。',
      isBase: true,
      call:   'tile(3, 3, 2, 3, 4)  →  base case'
    },
  ];

  let step = -1;       // -1 = initial; 0..4 = after placing LS[step]
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

  function ownerOf(r, c) {
    if (r === SPECIAL[0] && c === SPECIAL[1]) return -1;
    for (let i = 0; i <= step; i++) {
      for (const [rr, cc] of LS[i].cells) {
        if (rr === r && cc === c) return i;
      }
    }
    return null;
  }

  function gridGeometry() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pad = 28;
    const availW = w - pad * 2;
    const availH = h - pad * 2;
    const cellSize = Math.floor(Math.min(availW, availH) / N);
    const gridW = cellSize * N;
    const x0 = (w - gridW) / 2;
    const y0 = (h - gridW) / 2;
    return { cellSize, gridW, x0, y0 };
  }

  function drawCell(r, c, geom) {
    const { cellSize, x0, y0 } = geom;
    const x = x0 + (c - 1) * cellSize;
    const y = y0 + (r - 1) * cellSize;
    const owner = ownerOf(r, c);

    if (owner === -1) {
      ctx.fillStyle = COLOR.special;
    } else if (owner === null) {
      ctx.fillStyle = COLOR.paper;
    } else {
      ctx.fillStyle = COLOR.L[owner];
    }
    ctx.fillRect(x, y, cellSize, cellSize);

    ctx.strokeStyle = COLOR.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

    // Coordinate label
    if (owner === -1) {
      ctx.fillStyle = COLOR.specialMark;
    } else if (owner === null) {
      ctx.fillStyle = COLOR.cellText;
    } else {
      ctx.fillStyle = COLOR.LText[owner];
    }
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`(${r},${c})`, x + 6, y + 6);

    // Special marker
    if (owner === -1) {
      ctx.fillStyle = COLOR.specialMark;
      ctx.font = '700 24px "Oswald", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', x + cellSize / 2, y + cellSize / 2 + 2);
    }

    // L label (large number in the middle of one cell of each L)
    if (owner !== null && owner !== -1) {
      const ls = LS[owner];
      const isCenter = (r === ls.cells[0][0] && c === ls.cells[0][1]);
      if (isCenter) {
        ctx.fillStyle = COLOR.LText[owner];
        ctx.font = '700 28px "Oswald", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`L${owner + 1}`, x + cellSize / 2, y + cellSize / 2 + 4);
      }
    }
  }

  function drawLBorder(L, geom, color, width) {
    const { cellSize, x0, y0 } = geom;
    const cellSet = new Set(L.cells.map(([r, c]) => `${r},${c}`));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    for (const [r, c] of L.cells) {
      const x = x0 + (c - 1) * cellSize;
      const y = y0 + (r - 1) * cellSize;
      if (!cellSet.has(`${r - 1},${c}`)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); }
      if (!cellSet.has(`${r + 1},${c}`)) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
      if (!cellSet.has(`${r},${c - 1}`)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke(); }
      if (!cellSet.has(`${r},${c + 1}`)) { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
    }
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Paint full canvas paper-white
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const geom = gridGeometry();

    for (let r = 1; r <= N; r++) {
      for (let c = 1; c <= N; c++) {
        drawCell(r, c, geom);
      }
    }

    // Outer board border
    ctx.strokeStyle = COLOR.boardEdge;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(geom.x0 - 1, geom.y0 - 1, geom.gridW + 2, geom.gridW + 2);

    // L outlines — keep them sharp on top of the fills
    for (let i = 0; i <= step; i++) {
      const isCurrent = (i === step);
      const color = isCurrent ? COLOR.activeEdge : COLOR.boardEdge;
      const width = isCurrent ? 4 : 2.5;
      drawLBorder(LS[i], geom, color, width);
    }
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(LS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 4×4 paper board · special = <code>(3, 4)</code><br/>' +
          '<span style="color:var(--ink-dim)">按 Play 自動播放 5 步 — 第 1 步是中央 L，第 2–5 步全部是 base case (n=2) 直接解。</span>';
      } else {
        const ls = LS[step];
        const baseBadge = ls.isBase
          ? '<span class="chip chip--warning" style="margin-left:8px;font-size:9px;">BASE CASE</span>'
          : '';
        labelEl.innerHTML =
          `<strong>STEP ${String(step + 1).padStart(2, '0')} · ${ls.title}</strong>${baseBadge}` +
          `<br/><span style="color:var(--ink-dim)">${ls.desc}</span>` +
          `<br/><span style="color:var(--concrete);font-size:11px;letter-spacing:0.05em">▸ ${ls.call}</span>`;
      }
    }
  }

  function update() {
    updateLabel();
    draw();
  }

  function next()  { if (step < LS.length - 1) { step++; update(); } else stop(); }
  function prev()  { if (step > -1) { step--; update(); } }
  function reset() { stop(); step = -1; update(); }
  function play()  {
    if (timer) { stop(); return; }
    btnPlay.textContent = 'Pause';
    timer = setInterval(() => {
      if (step >= LS.length - 1) { stop(); return; }
      next();
    }, 1300);
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
