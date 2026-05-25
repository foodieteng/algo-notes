/* ============================================================
   P114 王老先生 — L-tromino divide & conquer visualization
   N=4, special at (3, 4)
   ============================================================ */

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const stepEl   = document.getElementById('viz-step');
  const btnPrev  = document.getElementById('viz-prev');
  const btnNext  = document.getElementById('viz-next');
  const btnPlay  = document.getElementById('viz-play');
  const btnReset = document.getElementById('viz-reset');

  const COLOR = {
    bg:         '#0d0d0d',
    ink:        '#e8e6e1',
    inkDim:     '#9a958c',
    concrete:   '#8a847a',
    line:       '#3a3a3a',
    lineBright: '#555555',
    special:    '#5BC97E',
    L: [
      '#c1440e', // L1 · Center
      '#e85d1f', // L2 · TL
      '#d4a017', // L3 · TR
      '#b03a3a', // L4 · BL
      '#6a7a8a', // L5 · BR
    ],
  };

  const N = 4;
  const SPECIAL = [3, 4];

  // L placements in animation order (recursion-emit order: center first, then 4 quadrants).
  const LS = [
    { name: 'L1 · CENTER',  cells: [[2,2],[2,3],[3,2]] },
    { name: 'L2 · TL',      cells: [[1,1],[1,2],[2,1]] },
    { name: 'L3 · TR',      cells: [[1,3],[1,4],[2,4]] },
    { name: 'L4 · BL',      cells: [[3,1],[4,1],[4,2]] },
    { name: 'L5 · BR',      cells: [[3,3],[4,3],[4,4]] },
  ];

  let step = -1;       // -1 = initial; 0..4 = after placing LS[step]
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = Math.min(w, 440);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + 'px';
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

  function draw() {
    const w = canvas.clientWidth;
    const h = parseFloat(canvas.style.height);
    ctx.clearRect(0, 0, w, h);

    const labelH = 36;
    const pad = 16;
    const availW = w - pad * 2;
    const availH = h - labelH - pad * 2;
    const cellSize = Math.floor(Math.min(availW, availH) / N);
    const gridW = cellSize * N;
    const gridH = cellSize * N;
    const x0 = (w - gridW) / 2;
    const y0 = labelH;

    // Top label
    ctx.fillStyle = COLOR.concrete;
    ctx.font = '700 11px "Oswald", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const label = (step === -1)
      ? `INITIAL · N=${N} · SPECIAL = (${SPECIAL[0]}, ${SPECIAL[1]})`
      : `STEP ${String(step + 1).padStart(2,'0')} · PLACE ${LS[step].name}`;
    ctx.fillText(label, x0, 16);

    // Right-side counter
    ctx.textAlign = 'right';
    ctx.fillStyle = COLOR.inkDim;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    const placed = step + 1;
    ctx.fillText(`${placed} / ${LS.length} TROMINOES`, x0 + gridW, 16);

    // Draw cells
    for (let r = 1; r <= N; r++) {
      for (let c = 1; c <= N; c++) {
        const x = x0 + (c - 1) * cellSize;
        const y = y0 + (r - 1) * cellSize;
        const owner = ownerOf(r, c);

        if (owner === -1) {
          ctx.fillStyle = COLOR.special;
        } else if (owner === null) {
          ctx.fillStyle = COLOR.bg;
        } else {
          ctx.fillStyle = COLOR.L[owner];
        }
        ctx.fillRect(x, y, cellSize, cellSize);

        ctx.strokeStyle = COLOR.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        // Coordinate label
        ctx.fillStyle = (owner === null) ? COLOR.concrete : '#0d0d0d';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`(${r},${c})`, x + 5, y + 5);

        // Special marker
        if (owner === -1) {
          ctx.fillStyle = '#0d0d0d';
          ctx.font = '700 14px "Oswald", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Quadrant divider (after step >= 0)
    if (step >= 0) {
      ctx.strokeStyle = COLOR.lineBright;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 + gridW / 2, y0);
      ctx.lineTo(x0 + gridW / 2, y0 + gridH);
      ctx.moveTo(x0, y0 + gridH / 2);
      ctx.lineTo(x0 + gridW, y0 + gridH / 2);
      ctx.stroke();
    }
  }

  function update() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(LS.length).padStart(2, '0')}`;
    }
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
    }, 900);
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
