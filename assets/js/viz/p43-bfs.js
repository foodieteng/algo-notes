/* ============================================================
   P43 喵喵抓老鼠 — BFS shortest path on a grid viz
   Style: white paper background, solid-color fills, distance labels.
   Maze (5×7), K = cat, @ = mice, # = wall, . = path:
       #######
       #K..@.#
       #.##..#
       #..@..#
       #######
   BFS from K floods outward ring by ring; each cell shows its
   distance. The first '@' popped is the answer (here dist 3).
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
    wall:       '#3a3a3a',
    path:       '#ffffff',
    pathStroke: '#cfcfcf',
    cat:        '#2f6fb6',   // K start — blue
    mouse:      '#c98a24',   // @ unreached mouse — orange
    visited:    '#e3edf5',   // popped cells — pale blue
    frontier:   '#d96e4e',   // in-queue frontier — coral
    answer:     '#5fa866',   // the found nearest mouse — green
    cellText:   '#5a5a5a',
    boardEdge:  '#1a1a1a',
  };

  // Grid: 0 path, 1 wall, 2 cat(K), 3 mouse(@)
  const RAW = [
    '#######',
    '#K..@.#',
    '#.##..#',
    '#..@..#',
    '#######',
  ];
  const R = RAW.length;
  const C = RAW[0].length;
  const grid = [];
  let catR = 0, catC = 0;
  for (let r = 0; r < R; r++) {
    const row = [];
    for (let c = 0; c < C; c++) {
      const ch = RAW[r][c];
      if (ch === '#') row.push(1);
      else if (ch === 'K') { row.push(2); catR = r; catC = c; }
      else if (ch === '@') row.push(3);
      else row.push(0);
    }
    grid.push(row);
  }
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // ── Pre-compute BFS steps deterministically ──
  // dist[r][c] = -1 unknown; status: 'frontier' (in queue) / 'visited' (popped)
  const steps = [];
  const dist = Array.from({ length: R }, () => new Array(C).fill(-1));
  const state = Array.from({ length: R }, () => new Array(C).fill(0)); // 0 none,1 frontier,2 visited

  function cloneNum(g) { return g.map(row => row.slice()); }
  function snapshot(cur, answerCell, text) {
    steps.push({
      dist: cloneNum(dist),
      state: cloneNum(state),
      cursor: cur ? cur.slice() : null,
      answer: answerCell ? answerCell.slice() : null,
      text,
    });
  }

  snapshot(null, null,
    '<strong>INITIAL</strong> · 貓 <code>K</code>（藍）在左上、老鼠 <code>@</code>（橘）有兩隻。' +
    'BFS 從 K 一圈一圈往外擴，每格記下「走幾步到得了」。第一個被取出的 <code>@</code> 就是最近的。');

  // BFS
  const queue = [[catR, catC]];
  dist[catR][catC] = 0;
  state[catR][catC] = 1;
  snapshot([catR, catC], null,
    `把起點 <code>K(${catR},${catC})</code> 推進 queue，<code>dist = 0</code>。`);

  let qi = 0;
  let answerCell = null;
  while (qi < queue.length) {
    const [r, c] = queue[qi++];
    state[r][c] = 2; // popped

    // Found a mouse? (the first popped @ is the nearest)
    if (grid[r][c] === 3) {
      answerCell = [r, c];
      snapshot([r, c], answerCell,
        `取出 <code>(${r},${c})</code> — 是老鼠 <code>@</code>！這是<strong>第一個被取出的 @</strong> ⇒ ` +
        `最近距離 = <strong>${dist[r][c]}</strong>。BFS 立刻停止。`);
      break;
    }

    const added = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      if (grid[nr][nc] === 1) continue;       // wall
      if (dist[nr][nc] !== -1) continue;       // already seen
      dist[nr][nc] = dist[r][c] + 1;
      state[nr][nc] = 1;
      queue.push([nr, nc]);
      added.push([nr, nc]);
    }
    const cellName = (r === catR && c === catC) ? 'K' : '';
    if (added.length) {
      const addedStr = added.map(([r2, c2]) => `(${r2},${c2})`).join(' ');
      snapshot([r, c], null,
        `取出 <code>${cellName}(${r},${c})</code>（dist ${dist[r][c]}）→ ` +
        `把可走的鄰居 ${addedStr} 標 <code>dist ${dist[r][c] + 1}</code> 推進 queue。`);
    } else {
      snapshot([r, c], null,
        `取出 <code>(${r},${c})</code>（dist ${dist[r][c]}）→ 四周沒有新格可走。`);
    }
  }

  if (!answerCell) {
    snapshot(null, null, 'queue 空了還沒碰到 @ ⇒ 走不到任何老鼠 ⇒ 輸出 <code>= ="</code>。');
  } else {
    snapshot(null, answerCell,
      `<strong>DONE</strong> · 最近老鼠在 <code>(${answerCell[0]},${answerCell[1]})</code>，` +
      `距離 <strong>${dist[answerCell[0]][answerCell[1]]}</strong> 步。輸出 <code>${dist[answerCell[0]][answerCell[1]]}</code>。`);
  }

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

  function gridGeometry() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const padTop = 16, padBot = 56, padX = 24;
    const availW = w - padX * 2;
    const availH = h - padTop - padBot;
    const cellSize = Math.floor(Math.min(availW / C, availH / R, 60));
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
        const isAnswer = s.answer && s.answer[0] === r && s.answer[1] === c;
        const st = s.state[r][c];
        const known = s.dist[r][c] !== -1;

        // fill
        if (grid[r][c] === 1) {
          ctx.fillStyle = COLOR.wall;
        } else if (isAnswer) {
          ctx.fillStyle = COLOR.answer;
        } else if (grid[r][c] === 3 && !known) {
          ctx.fillStyle = COLOR.mouse;
        } else if (r === catR && c === catC) {
          ctx.fillStyle = COLOR.cat;
        } else if (st === 1) {
          ctx.fillStyle = COLOR.frontier;
        } else if (st === 2) {
          ctx.fillStyle = COLOR.visited;
        } else {
          ctx.fillStyle = COLOR.path;
        }
        ctx.fillRect(x, y, cellSize, cellSize);

        // grid hairline
        ctx.strokeStyle = grid[r][c] === 1 ? COLOR.wall : COLOR.pathStroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

        // glyph + distance
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;

        if (grid[r][c] === 1) {
          // wall — no text
        } else {
          // mark K / @ as a small corner glyph
          if (r === catR && c === catC) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 ' + Math.round(cellSize * 0.34) + 'px "Oswald", sans-serif';
            ctx.fillText('K', x + cellSize * 0.26, y + cellSize * 0.28);
          } else if (grid[r][c] === 3) {
            ctx.fillStyle = isAnswer ? '#ffffff' : '#ffffff';
            ctx.font = '700 ' + Math.round(cellSize * 0.34) + 'px "Oswald", sans-serif';
            ctx.fillText('@', x + cellSize * 0.26, y + cellSize * 0.30);
          }
          // distance number (big, center) once known
          if (known) {
            const onColored = (st === 1) || isAnswer || (r === catR && c === catC);
            ctx.fillStyle = onColored ? '#ffffff' : COLOR.cellText;
            ctx.font = '700 ' + Math.round(cellSize * 0.4) + 'px "JetBrains Mono", monospace';
            ctx.fillText(String(s.dist[r][c]), cx, cy + cellSize * 0.04);
          }
        }

        // cursor outline
        if (onCursor) {
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }
      }
    }

    // outer board border
    ctx.strokeStyle = COLOR.boardEdge;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 1, y0 - 1, gridW + 2, gridH + 2);

    // ── lower band: legend / queue size ──
    const by = y0 + gridH + 22;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '600 12px "JetBrains Mono", monospace';

    // count frontier + visited for a quick readout
    let nFront = 0, nVis = 0;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (s.state[r][c] === 1) nFront++;
      else if (s.state[r][c] === 2) nVis++;
    }
    ctx.fillStyle = COLOR.frontier;
    ctx.fillRect(x0 - 1, by - 7, 14, 14);
    ctx.fillStyle = COLOR.cellText;
    ctx.fillText('frontier (queue) ' + nFront, x0 + 20, by);

    ctx.fillStyle = COLOR.visited;
    ctx.fillRect(x0 + 200, by - 7, 14, 14);
    ctx.strokeStyle = COLOR.pathStroke; ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 200.5, by - 6.5, 13, 13);
    ctx.fillStyle = COLOR.cellText;
    ctx.fillText('visited ' + nVis, x0 + 220, by);
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
