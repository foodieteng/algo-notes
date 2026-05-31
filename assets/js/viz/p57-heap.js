/* ============================================================
   P57 heap 練習 — binary min-heap insert / pop-min visualization
   Style: white paper background, solid-color fills.
   Shows the heap BOTH as a 1-indexed array and as a binary tree,
   animating sift-up (after insert) and sift-down (after pop) one
   swap at a time. Walks the problem's own sample:
       1 2 · 1 3 · 2 · 1 1 · 2 · 2 · 2
   Output: 2, 1, 3, empty!
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
    node:     '#e3edf5',   // normal node — pale blue
    nodeStroke:'#8fb3d4',
    active:   '#d96e4e',   // the node being sifted — coral
    compare:  '#d4a017',   // node being compared against — yellow
    popped:   '#5fa866',   // the value just popped — green
    edge:     '#9ab0c2',
    text:     '#1f3550',
    boardEdge:'#1a1a1a',
    dim:      '#9a9a9a',
  };

  // Operations from the sample. type: 'ins' n / 'pop'
  const OPS = [
    { t: 'ins', n: 2 },
    { t: 'ins', n: 3 },
    { t: 'pop' },
    { t: 'ins', n: 1 },
    { t: 'pop' },
    { t: 'pop' },
    { t: 'pop' },
  ];

  // ── Simulate the min-heap and record one snapshot per micro-step ──
  // Snapshot: { heap:[...1-indexed...], active, compare, popped, text, opLabel, out }
  const steps = [];
  let heap = [0]; // index 0 unused (1-indexed)
  let outLog = []; // accumulated output lines

  function snap(active, compare, popped, opLabel, text) {
    steps.push({
      heap: heap.slice(),
      active: active == null ? null : active,
      compare: compare == null ? null : compare,
      popped: popped == null ? null : popped,
      out: outLog.slice(),
      opLabel,
      text,
    });
  }

  snap(null, null, null, 'START',
    '<strong>INITIAL</strong> · 空的 min-heap。用 1-indexed 陣列存，' +
    '左子 = <code>2i</code>、右子 = <code>2i+1</code>、父 = <code>i/2</code>。最小值永遠在 <code>heap[1]</code>。');

  for (let oi = 0; oi < OPS.length; oi++) {
    const op = OPS[oi];

    if (op.t === 'ins') {
      const opLabel = `OP ${oi + 1}: 1 ${op.n}  (insert ${op.n})`;
      heap.push(op.n);
      let i = heap.length - 1;
      snap(i, null, null, opLabel,
        `插入 <code>${op.n}</code> 到陣列尾端（位置 ${i}）。接著 <strong>sift-up</strong>：與父比，若比父小就上浮。`);

      // sift-up
      while (i > 1) {
        const parent = i >> 1;
        snap(i, parent, null, opLabel,
          `比較 <code>heap[${i}]=${heap[i]}</code> 與父 <code>heap[${parent}]=${heap[parent]}</code>。`);
        if (heap[i] < heap[parent]) {
          [heap[i], heap[parent]] = [heap[parent], heap[i]];
          snap(parent, null, null, opLabel,
            `${heap[parent] !== heap[i] ? '' : ''}子比父小 → 交換，<code>${heap[parent]}</code> 上浮到位置 ${parent}。繼續往上。`);
          i = parent;
        } else {
          snap(i, null, null, opLabel,
            `子 ≥ 父，<strong>停止</strong>。<code>${heap[i]}</code> 留在位置 ${i}，heap 性質恢復。`);
          break;
        }
      }
      if (i === 1) {
        snap(1, null, null, opLabel, `到達根（位置 1）→ sift-up 結束。最小值 <code>${heap[1]}</code> 在頂。`);
      }
    } else {
      const opLabel = `OP ${oi + 1}: 2  (pop-min)`;
      if (heap.length <= 1) {
        outLog.push('empty!');
        snap(null, null, null, opLabel,
          `heap 是空的 → 輸出 <code>empty!</code>。`);
        continue;
      }
      const minVal = heap[1];
      // record popped
      snap(1, null, minVal, opLabel,
        `pop 最小值 = 根 <code>heap[1] = ${minVal}</code>，輸出 <code>${minVal}</code>。`);
      outLog.push(String(minVal));

      // move last to root
      const last = heap.pop();
      if (heap.length > 1) {
        heap[1] = last;
        snap(1, null, null, opLabel,
          `把陣列<strong>最後一個 <code>${last}</code> 搬到根</strong>，size 減 1。接著 <strong>sift-down</strong>：與較小的子比、往下沉。`);

        // sift-down
        let i = 1;
        const n = heap.length - 1;
        while (true) {
          let smallest = i;
          const l = i * 2, r = i * 2 + 1;
          if (l <= n && heap[l] < heap[smallest]) smallest = l;
          if (r <= n && heap[r] < heap[smallest]) smallest = r;
          // show the comparison
          const cmpNode = (smallest !== i) ? smallest
                          : (l <= n ? l : null);
          snap(i, cmpNode, null, opLabel,
            (l > n)
              ? `位置 ${i} 沒有子節點 → sift-down 結束。`
              : `位置 ${i}（<code>${heap[i]}</code>）與較小的子比較。`);
          if (smallest === i) {
            snap(i, null, null, opLabel,
              `父 ≤ 兩子 → <strong>停止</strong>。<code>${heap[i]}</code> 留在位置 ${i}，heap 性質恢復。`);
            break;
          }
          [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
          snap(smallest, null, null, opLabel,
            `父比子大 → 與較小子交換，<code>${heap[smallest]}</code> 下沉到位置 ${smallest}。繼續往下。`);
          i = smallest;
        }
      } else {
        // heap now empty
        snap(null, null, null, opLabel,
          `pop 後 heap 變空。`);
      }
    }
  }

  snap(null, null, null, 'DONE',
    `<strong>DONE</strong> · 七個操作跑完，輸出依序為 <code>2 · 1 · 3 · empty!</code>。`);

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 420;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // tree node position for 1-indexed heap node i (depth d, index within level)
  function treePos(i, w, treeTop, treeH) {
    const depth = Math.floor(Math.log2(i));      // 0,1,2,...
    const levelStart = 1 << depth;               // first index at this depth
    const posInLevel = i - levelStart;           // 0-based
    const countInLevel = 1 << depth;
    const x = w * (posInLevel + 0.5) / countInLevel;
    const levelGap = treeH / 4;                  // up to 4 levels visible
    const y = treeTop + depth * levelGap + 24;
    return { x, y, depth };
  }

  function draw() {
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const n = s.heap.length - 1; // number of elements

    // ===== TOP: binary tree =====
    const treeTop = 10;
    const treeH = h * 0.52;
    const nodeR = 17;

    // edges first
    ctx.strokeStyle = COLOR.edge;
    ctx.lineWidth = 1.6;
    for (let i = 2; i <= n; i++) {
      const p = treePos(i >> 1, w, treeTop, treeH);
      const c = treePos(i, w, treeTop, treeH);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
    }
    // nodes
    for (let i = 1; i <= n; i++) {
      const pos = treePos(i, w, treeTop, treeH);
      let fill = COLOR.node, stroke = COLOR.nodeStroke;
      if (s.active === i)  { fill = COLOR.active;  stroke = '#a84a2f'; }
      else if (s.compare === i) { fill = COLOR.compare; stroke = '#a07e10'; }
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = (s.active === i) ? '#ffffff' : COLOR.text;
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(s.heap[i]), pos.x, pos.y + 1);

      // index label below node
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillText('[' + i + ']', pos.x, pos.y + nodeR + 9);
    }
    if (n === 0) {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 15px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('（heap 空）', w / 2, treeTop + treeH / 2);
    }

    // ===== MIDDLE: array view =====
    const arrTop = treeTop + treeH + 14;
    const cellSize = Math.min(40, (w - 60) / Math.max(8, n + 1));
    const arrW = cellSize * Math.max(n, 1);
    const arrX0 = (w - arrW) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = COLOR.dim;
    ctx.fillText('ARRAY (1-indexed)', w / 2, arrTop - 4);

    for (let i = 1; i <= Math.max(n, 1); i++) {
      const x = arrX0 + (i - 1) * cellSize;
      const y = arrTop + 8;
      const has = i <= n;
      let fill = has ? COLOR.node : '#f4f4f4';
      let stroke = COLOR.nodeStroke;
      if (has && s.active === i)  { fill = COLOR.active;  stroke = '#a84a2f'; }
      else if (has && s.compare === i) { fill = COLOR.compare; stroke = '#a07e10'; }
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = has ? stroke : '#dddddd';
      ctx.lineWidth = has ? 1.8 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
      if (has) {
        ctx.fillStyle = (s.active === i) ? '#ffffff' : COLOR.text;
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.fillText(String(s.heap[i]), x + cellSize / 2, y + cellSize / 2 + 1);
      }
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillText(String(i), x + cellSize / 2, y + cellSize + 9);
    }

    // ===== BOTTOM: output log =====
    const outTop = arrTop + 8 + cellSize + 26;
    ctx.textAlign = 'left';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = COLOR.dim;
    ctx.fillText('OUTPUT', 24, outTop);
    ctx.font = '700 14px "JetBrains Mono", monospace';
    let ox = 92;
    for (const line of s.out) {
      const isEmpty = line === 'empty!';
      ctx.fillStyle = isEmpty ? COLOR.dim : COLOR.popped;
      const tw = ctx.measureText(line).width;
      ctx.fillText(line, ox, outTop);
      // tiny separator dot
      ox += tw + 14;
    }
    if (s.popped != null) {
      // highlight the just-popped value as a chip near output
      ctx.fillStyle = COLOR.popped;
      ctx.font = '600 12px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('◀ 剛 pop: ' + s.popped, w - 24, outTop);
      ctx.textAlign = 'left';
    }
  }

  function update() {
    const s = steps[step];
    if (stepEl) {
      stepEl.textContent = String(step).padStart(2, '0') + ' / ' +
        String(steps.length - 1).padStart(2, '0');
    }
    if (labelEl) {
      labelEl.innerHTML =
        '<span style="color:var(--sc-coral);font-family:\'JetBrains Mono\',monospace;font-size:11px;letter-spacing:0.06em;">▸ ' +
        s.opLabel + '</span><br/>' + s.text;
    }
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
