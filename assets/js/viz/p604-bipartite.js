/* ============================================================
   P604 哪裡有卦，哪裡就有源 — BFS 2-coloring (bipartite check) viz
   Style: white paper background, solid-color node fills.
   Sample 1: n = 3, edges 0–1, 1–2, 2–0 (a triangle = odd cycle).
   BFS from node 0 colours 0, paints neighbours the opposite
   colour, then the edge 1–2 turns out to join two same-coloured
   nodes ⇒ odd cycle ⇒ RAINBOW.
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
    paper:     '#ffffff',
    uncolored: '#8a847a',   // not yet coloured — gray
    c0:        '#1f5a99',   // colour 0 — blue
    c1:        '#d4a017',   // colour 1 — gold
    active:    '#d96e4e',   // current node / conflict — coral
    edge:      '#bdb4a6',   // normal edge
    edgeTree:  '#1a1a1a',   // edge BFS traversed (tree edge)
    edgeBad:   '#d96e4e',   // conflicting edge
    nodeText:  '#ffffff',
    label:     '#5a5a5a',
  };

  const N = 3;
  // triangle layout — equilateral, centred; positions set in geometry()
  const NODE_BASE = [
    { ux: 0.5,  uy: 0.16 },  // node 0 — top
    { ux: 0.22, uy: 0.78 },  // node 1 — bottom-left
    { ux: 0.78, uy: 0.78 },  // node 2 — bottom-right
  ];
  const EDGES = [ [0, 1], [1, 2], [2, 0] ];

  // ── Pre-compute BFS coloring steps deterministically ──
  const steps = [];
  function snap(state) {
    steps.push({
      color: state.color.slice(),
      queue: state.queue.slice(),
      cursor: state.cursor,        // node being popped, or null
      edgeStates: state.edgeStates.slice(), // per-edge: 0 normal,1 tree,2 bad
      conflict: state.conflict,    // [u,v] of bad edge or null
      text: state.text,
    });
  }

  const color = new Array(N).fill(-1);
  const edgeStates = new Array(EDGES.length).fill(0);
  let queue = [];

  const st = () => ({ color, queue, edgeStates, cursor: null, conflict: null, text: '' });

  // helper: edge index between a,b
  function edgeIdx(a, b) {
    for (let i = 0; i < EDGES.length; i++) {
      const [x, y] = EDGES[i];
      if ((x === a && y === b) || (x === b && y === a)) return i;
    }
    return -1;
  }

  // step 0: initial
  snap({ ...st(),
    text: '<strong>INITIAL</strong> · 3 點（人）、3 條卦源邊（0–1、1–2、2–0），全部<span style="color:#8a847a">未著色</span>。' });

  // push start 0
  color[0] = 0;
  queue = [0];
  snap({ ...st(),
    text: '從點 <code>0</code> 出發：塗<span style="color:#1f5a99">顏色 0</span>，推進 queue。<code>queue = [0]</code>。' });

  // BFS
  let qi = 0;
  let conflict = null;
  outer:
  while (qi < queue.length) {
    const u = queue[qi++];
    // pop u → highlight
    snap({ ...st(), queue: queue.slice(qi), cursor: u,
      text: `取出點 <code>${u}</code>（顏色 ${color[u]}）。檢查它的鄰居 <code>adj[${u}] = [${
        EDGES.filter(e => e.includes(u)).map(e => e[0] === u ? e[1] : e[0]).join(', ')}]</code>。` });

    for (const [a, b] of EDGES) {
      if (a !== u && b !== u) continue;
      const v = (a === u) ? b : a;
      const ei = edgeIdx(u, v);
      if (color[v] === -1) {
        color[v] = color[u] ^ 1;
        edgeStates[ei] = 1; // tree edge
        queue.push(v);
        snap({ ...st(), queue: queue.slice(qi), cursor: u,
          text: `鄰居 <code>${v}</code> 未著色 → 塗成反色 <code>color[${u}]^1 = ${color[v]}</code>（${
            color[v] === 0 ? '<span style="color:#1f5a99">藍</span>' : '<span style="color:#d4a017">金</span>'
          }），推進 queue。` });
      } else if (color[v] === color[u]) {
        edgeStates[ei] = 2; // bad edge
        conflict = [u, v];
        snap({ ...st(), queue: queue.slice(qi), cursor: u, conflict,
          text: `鄰居 <code>${v}</code> 已著色，而且 <code>color[${v}] = color[${u}] = ${color[u]}</code> — ` +
                `<strong style="color:#d96e4e">同色相鄰！</strong>邊 <code>${u}–${v}</code> 把三角形這個<strong>奇環</strong>封口。` });
        break outer;
      } else {
        // already coloured, opposite — the edge we came from (tree edge already)
        if (edgeStates[ei] === 0) edgeStates[ei] = 1;
        snap({ ...st(), queue: queue.slice(qi), cursor: u,
          text: `鄰居 <code>${v}</code> 已著色且為反色（<code>${color[v]} ≠ ${color[u]}</code>）→ 沒問題，這是來時的樹邊。` });
      }
    }
  }

  // final
  if (conflict) {
    snap({ ...st(), conflict,
      text: `<strong>DONE</strong> · 偵測到奇環 ⇒ 無法二著色 ⇒ 三人不可能兩兩異性。輸出 <code>RAINBOW.</code>` });
  } else {
    snap({ ...st(),
      text: `<strong>DONE</strong> · 全部塗完、沒有同色相鄰 ⇒ 可二著色 ⇒ 輸出 <code>NORMAL.</code>` });
  }

  let step = 0;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 360;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function geometry() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const padX = 40, padTop = 24, padBot = 96;
    const availW = w - padX * 2;
    const availH = h - padTop - padBot;
    const side = Math.min(availW, availH);
    const x0 = (w - side) / 2;
    const y0 = padTop + (availH - side) / 2;
    const pos = NODE_BASE.map(p => ({ x: x0 + p.ux * side, y: y0 + p.uy * side }));
    const r = Math.max(20, Math.min(34, side * 0.10));
    return { pos, r, w, h };
  }

  function nodeFill(c, isCursor, isConflict) {
    if (isConflict) return COLOR.active;
    if (c === -1) return COLOR.uncolored;
    if (c === 0) return COLOR.c0;
    return COLOR.c1;
  }

  function draw() {
    const s = steps[step];
    const { pos, r, w, h } = geometry();

    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // ── edges first ──
    for (let i = 0; i < EDGES.length; i++) {
      const [a, b] = EDGES[i];
      const es = s.edgeStates[i];
      ctx.beginPath();
      ctx.moveTo(pos[a].x, pos[a].y);
      ctx.lineTo(pos[b].x, pos[b].y);
      if (es === 2)      { ctx.strokeStyle = COLOR.edgeBad;  ctx.lineWidth = 5; }
      else if (es === 1) { ctx.strokeStyle = COLOR.edgeTree; ctx.lineWidth = 3; }
      else               { ctx.strokeStyle = COLOR.edge;     ctx.lineWidth = 2; }
      ctx.stroke();

      // edge label (endpoints)
      const mx = (pos[a].x + pos[b].x) / 2;
      const my = (pos[a].y + pos[b].y) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - 16, my - 9, 32, 18);
      ctx.fillStyle = es === 2 ? COLOR.edgeBad : COLOR.label;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${a}–${b}`, mx, my);
    }

    // ── nodes ──
    const conflictNodes = s.conflict || [];
    for (let i = 0; i < N; i++) {
      const isCursor = s.cursor === i;
      const isConflict = conflictNodes.includes(i);
      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, r, 0, Math.PI * 2);
      ctx.fillStyle = nodeFill(s.color[i], isCursor, isConflict);
      ctx.fill();
      // outline: thick black for the node being popped
      ctx.lineWidth = isCursor ? 4.5 : 2;
      ctx.strokeStyle = isCursor ? '#1a1a1a' : '#1a1a1a';
      ctx.stroke();

      // node id
      ctx.fillStyle = COLOR.nodeText;
      ctx.font = '700 ' + Math.round(r * 0.8) + 'px "Oswald", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), pos[i].x, pos[i].y + 1);

      // colour tag below node
      const tag = s.color[i] === -1 ? '未塗' : ('色 ' + s.color[i]);
      ctx.fillStyle = COLOR.label;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText(tag, pos[i].x, pos[i].y + r + 14);
    }

    // ── lower band: queue + legend ──
    const by = h - 56;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    ctx.fillStyle = COLOR.label;
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const qstr = s.queue.length ? '[' + s.queue.join(', ') + ']' : '[ ]';
    ctx.fillText('queue ' + qstr, 40, by);

    // colour legend
    const ly = h - 30;
    function chip(x, fill, text) {
      ctx.beginPath();
      ctx.arc(x + 7, ly, 7, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#1a1a1a'; ctx.stroke();
      ctx.fillStyle = COLOR.label;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(text, x + 20, ly);
    }
    chip(40,  COLOR.c0,        '色 0');
    chip(120, COLOR.c1,        '色 1');
    chip(200, COLOR.uncolored, '未塗');
    chip(290, COLOR.active,    '焦點/衝突');
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
