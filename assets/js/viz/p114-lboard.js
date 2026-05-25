/* ============================================================
   P114 王老先生 — L-tromino divide & conquer visualization
   Style: IMG_4850 (thick L outlines, no per-L color)
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
    bg:         '#0d0d0d',
    grid:       '#3a3a3a',
    fillCell:   'rgba(193, 68, 14, 0.06)',
    fillActive: 'rgba(232, 93, 31, 0.18)',
    special:    '#5BC97E',
    border:     '#e8e6e1',
    borderHi:   '#e85d1f',
    text:       '#e8e6e1',
    textDim:    '#9a958c',
    textMuted:  '#8a847a',
  };

  const N = 4;
  const SPECIAL = [3, 4];

  // L placements with recursion description (matches the tile() emit order)
  const LS = [
    {
      cells: [[2,2],[2,3],[3,2]],
      title: 'L1 · CENTER',
      desc:  '在棋盤正中央放第 1 個 L，覆蓋 TL/TR/BL 三象限最靠近中心的角落。'
    },
    {
      cells: [[1,1],[1,2],[2,1]],
      title: 'L2 · TL QUADRANT',
      desc:  '遞迴解左上 2×2 子板，special = (2, 2)（剛剛中央 L 在 TL 角落留下的）。'
    },
    {
      cells: [[1,3],[1,4],[2,4]],
      title: 'L3 · TR QUADRANT',
      desc:  '遞迴解右上 2×2 子板，special = (2, 3)。'
    },
    {
      cells: [[3,1],[4,1],[4,2]],
      title: 'L4 · BL QUADRANT',
      desc:  '遞迴解左下 2×2 子板，special = (3, 2)。'
    },
    {
      cells: [[3,3],[4,3],[4,4]],
      title: 'L5 · BR QUADRANT',
      desc:  '遞迴解右下 2×2 子板，special = (3, 4) — 原本王老先生選的格子。'
    },
  ];

  let step = -1;       // -1 = initial; 0..4 = after placing LS[step]
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    // height comes from CSS; keep DPR-aware
    const h = rect.height || 480;
    canvas.width = w * dpr;
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
    const isCurrent = (step >= 0 && owner === step);

    if (owner === -1) {
      ctx.fillStyle = COLOR.special;
    } else if (owner === null) {
      ctx.fillStyle = COLOR.bg;
    } else if (isCurrent) {
      ctx.fillStyle = COLOR.fillActive;
    } else {
      ctx.fillStyle = COLOR.fillCell;
    }
    ctx.fillRect(x, y, cellSize, cellSize);

    ctx.strokeStyle = COLOR.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

    // coordinate label
    ctx.fillStyle = (owner === -1) ? '#0d0d0d' : COLOR.textMuted;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`(${r},${c})`, x + 6, y + 6);

    // special star
    if (owner === -1) {
      ctx.fillStyle = '#0d0d0d';
      ctx.font = '700 22px "Oswald", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', x + cellSize / 2, y + cellSize / 2 + 2);
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

      // Top
      if (!cellSet.has(`${r - 1},${c}`)) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
        ctx.stroke();
      }
      // Bottom
      if (!cellSet.has(`${r + 1},${c}`)) {
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      // Left
      if (!cellSet.has(`${r},${c - 1}`)) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();
      }
      // Right
      if (!cellSet.has(`${r},${c + 1}`)) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
    }
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const geom = gridGeometry();

    // Draw all cells
    for (let r = 1; r <= N; r++) {
      for (let c = 1; c <= N; c++) {
        drawCell(r, c, geom);
      }
    }

    // Outer board border
    ctx.strokeStyle = COLOR.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(
      geom.x0 - 1,
      geom.y0 - 1,
      geom.gridW + 2,
      geom.gridW + 2
    );

    // Draw all placed L outlines
    for (let i = 0; i <= step; i++) {
      const isCurrent = (i === step);
      const color = isCurrent ? COLOR.borderHi : COLOR.border;
      const width = isCurrent ? 5 : 4;
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
          '<strong>INITIAL</strong> · 4×4 board · special = <code>(3, 4)</code>';
      } else {
        const ls = LS[step];
        labelEl.innerHTML =
          `<strong>STEP ${String(step + 1).padStart(2, '0')} · ${ls.title}</strong>` +
          `<br/><span style="color:var(--ink-dim)">${ls.desc}</span>`;
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
