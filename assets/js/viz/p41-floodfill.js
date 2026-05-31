/* ============================================================
   P41 庭院裡的水池 — Flood Fill / connected components viz
   Style: white paper background, solid-color pool fills.
   Grid is the problem's own Sample #4 (4×4 → 3 pools):
       . # # #
       # . . #
       # . . #
       # # # .
   Water = '.', obstacle = '#'. 4-directional adjacency.
   The animation walks the main loop scan + a BFS flood from each
   fresh water cell, tinting every visited cell with its pool color
   and bumping the pool counter when a new flood starts.
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
    paper:      '#ffffff',
    grid:       '#cfcfcf',
    obstacle:   '#3a3a3a',   // '#' wall
    water:      '#e3edf5',   // unvisited '.' water — pale blue
    waterStroke:'#8fb3d4',
    scan:       '#d96e4e',   // current scan cursor / BFS frontier — coral
    cellText:   '#5a5a5a',
    boardEdge:  '#1a1a1a',
    // distinct solid fills per discovered pool
    pool: [
      '#5fa866', // pool 1 · green
      '#2f6fb6', // pool 2 · blue
      '#c98a24', // pool 3 · orange
      '#6e41c8', // pool 4 · purple
    ],
  };

  // 0 = water ('.'), 1 = obstacle ('#')
  const GRID = [
    [0, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
  ];
  const R = GRID.length;
  const C = GRID[0].length;
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // ── Pre-compute the full step list (deterministic, no Math.random) ──
  // Each step is a snapshot: { pool[r][c] (0=none,1..=pool id), cursor:[r,c]|null,
  //                            frontier:Set, count, kind, text }
  const steps = [];

  function cloneGrid(g) { return g.map(row => row.slice()); }

  // pool[r][c] = 0 (none) or pool id (1-based). -1 reserved for obstacle paint? no.
  let pool = Array.from({ length: R }, () => new Array(C).fill(0));
  let count = 0;

  function snapshot(cursor, frontier, kind, text) {
    steps.push({
      pool: cloneGrid(pool),
      cursor: cursor ? cursor.slice() : null,
      frontier: new Set(frontier || []),
      count,
      kind,
      text,
    });
  }

  // INITIAL
  snapshot(null, null, 'init',
    '<strong>INITIAL</strong> · 4×4 地圖，<code>.</code> 是水、<code>#</code> 是障礙。' +
    'pool 計數 = 0。我們由左上往右下掃，遇到「沒走過的水」就 +1 並 BFS 淹滿整灘。');

  // Main loop: scan row-major
  for (let sr = 0; sr < R; sr++) {
    for (let sc = 0; sc < C; sc++) {
      if (GRID[sr][sc] === 1) {
        snapshot([sr, sc], null, 'scan-wall',
          `掃到 <code>(${sr},${sc})</code> = <code>#</code> 障礙 → 跳過。`);
        continue;
      }
      if (pool[sr][sc] !== 0) {
        snapshot([sr, sc], null, 'scan-visited',
          `掃到 <code>(${sr},${sc})</code> 是水，但已屬於 pool ${pool[sr][sc]} → 跳過（避免重複數）。`);
        continue;
      }
      // Fresh water cell → new pool, BFS flood it
      count++;
      const id = count;
      const queue = [[sr, sc]];
      pool[sr][sc] = id;
      snapshot([sr, sc], queue.map(([r, c]) => `${r},${c}`), 'new-pool',
        `掃到 <code>(${sr},${sc})</code> 是<strong>沒走過的水</strong> → 新水池！` +
        `pool 計數 <code>${count - 1} → ${count}</code>，把它丟進 queue 開始 BFS。`);

      // BFS expansion, one frontier-pop per step
      let qi = 0;
      while (qi < queue.length) {
        const [r, c] = queue[qi++];
        const added = [];
        for (const [dr, dc] of DIRS) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          if (GRID[nr][nc] === 1) continue;
          if (pool[nr][nc] !== 0) continue;
          pool[nr][nc] = id;
          queue.push([nr, nc]);
          added.push([nr, nc]);
        }
        if (added.length) {
          const addedStr = added.map(([r2, c2]) => `(${r2},${c2})`).join(' ');
          snapshot([r, c],
            queue.slice(qi).map(([r2, c2]) => `${r2},${c2}`),
            'bfs',
            `從 <code>(${r},${c})</code> 看四方向 → 新淹 ${addedStr} 加進 pool ${id}。`);
        } else {
          snapshot([r, c],
            queue.slice(qi).map(([r2, c2]) => `${r2},${c2}`),
            'bfs',
            `從 <code>(${r},${c})</code> 看四方向 → 周圍沒有新水可淹。`);
        }
      }
      snapshot(null, null, 'pool-done',
        `pool ${id} 淹完，queue 空了。回到主迴圈繼續往後掃。`);
    }
  }

  snapshot(null, null, 'done',
    `<strong>DONE</strong> · 整張地圖掃完 → 共數到 <strong>${count} 灘水池</strong>。輸出 <code>${count}</code>。`);

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 320;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function gridGeometry() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const padTop = 16, padBot = 64, padX = 24;
    const availW = w - padX * 2;
    const availH = h - padTop - padBot;
    const cellSize = Math.floor(Math.min(availW / C, availH / R, 64));
    const gridW = cellSize * C;
    const gridH = cellSize * R;
    const x0 = (w - gridW) / 2;
    const y0 = padTop + (availH - gridH) / 2;
    return { cellSize, gridW, gridH, x0, y0 };
  }

  function draw() {
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const geom = gridGeometry();
    const { cellSize, x0, y0, gridW, gridH } = geom;

    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const x = x0 + c * cellSize;
        const y = y0 + r * cellSize;
        const onCursor = s.cursor && s.cursor[0] === r && s.cursor[1] === c;
        const inFrontier = s.frontier.has(`${r},${c}`);

        if (GRID[r][c] === 1) {
          ctx.fillStyle = COLOR.obstacle;
        } else if (s.pool[r][c] !== 0) {
          ctx.fillStyle = COLOR.pool[(s.pool[r][c] - 1) % COLOR.pool.length];
        } else {
          ctx.fillStyle = COLOR.water;
        }
        ctx.fillRect(x, y, cellSize, cellSize);

        // frontier highlight ring (cells waiting in queue)
        if (inFrontier) {
          ctx.strokeStyle = COLOR.scan;
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 2.5, y + 2.5, cellSize - 5, cellSize - 5);
        }

        // grid hairline
        ctx.strokeStyle = GRID[r][c] === 1 ? COLOR.obstacle : COLOR.waterStroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

        // glyph: '#' for obstacle, '.' for untouched water, pool id for filled
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (GRID[r][c] === 1) {
          ctx.fillStyle = '#9a9a9a';
          ctx.font = '600 ' + Math.round(cellSize * 0.42) + 'px "JetBrains Mono", monospace';
          ctx.fillText('#', x + cellSize / 2, y + cellSize / 2 + 1);
        } else if (s.pool[r][c] !== 0) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 ' + Math.round(cellSize * 0.4) + 'px "Oswald", sans-serif';
          ctx.fillText(String(s.pool[r][c]), x + cellSize / 2, y + cellSize / 2 + 1);
        } else {
          ctx.fillStyle = '#7fa0bd';
          ctx.font = '600 ' + Math.round(cellSize * 0.42) + 'px "JetBrains Mono", monospace';
          ctx.fillText('.', x + cellSize / 2, y + cellSize / 2 - cellSize * 0.12);
        }

        // scan cursor outline (coral, on top)
        if (onCursor) {
          ctx.strokeStyle = COLOR.scan;
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }
      }
    }

    // outer board border
    ctx.strokeStyle = COLOR.boardEdge;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 1, y0 - 1, gridW + 2, gridH + 2);

    // ── lower band: pool counter chip ──
    const by = y0 + gridH + 20;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.cellText;
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('POOL COUNT', x0 - 1, by);

    // counter pills
    const pillX = x0 - 1 + 108;
    for (let i = 0; i < Math.max(s.count, 1); i++) {
      const px = pillX + i * 34;
      const filled = i < s.count;
      ctx.fillStyle = filled ? COLOR.pool[i % COLOR.pool.length] : '#eeeeee';
      ctx.fillRect(px, by - 12, 26, 24);
      ctx.strokeStyle = COLOR.boardEdge;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, by - 11.5, 25, 23);
      if (filled) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px "Oswald", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), px + 13, by + 1);
        ctx.textAlign = 'left';
      }
    }
    ctx.fillStyle = COLOR.scan;
    ctx.font = '700 16px "Oswald", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('= ' + s.count, pillX + Math.max(s.count, 1) * 34 + 6, by + 1);
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
    }, 950);
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
