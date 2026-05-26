/* ============================================================
   P507 最近點對 — Closest Pair of Points
   Two animations: base case (brute on 3 pts) + general case (D&C on 5 pts)
   ============================================================ */

(function () {

  // ------------------------------------------------------------
  // Shared color tokens (study card light theme)
  // ------------------------------------------------------------
  const C = {
    bg:           '#fdf8ee',                       // matches --paper
    grid:         '#ece1c8',
    axis:         '#a59c91',
    axisText:     '#7d7770',
    ptDefault:    '#7eb2dc',                       // pastel blue
    ptDim:        '#cbc6bd',
    ptFocus:      '#f9a8b4',                       // pastel pink-deep
    ptBest:       '#8fc480',                       // pastel green-deep
    ptStrip:      '#f5d76e',                       // pastel yellow-deep
    lineFocus:    '#f9a8b4',
    lineDim:      '#b4ada1',
    lineBest:     '#8fc480',
    stripFill:    'rgba(245, 215, 110, 0.30)',
    stripEdge:    '#d2a648',
    midline:      '#f9a8b4',
    halfL:        'rgba(126, 178, 220, 0.08)',
    halfR:        'rgba(249, 168, 180, 0.08)',
    text:         '#3a3531',
    textDim:      '#6a625c',
  };

  // ------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------
  function drawGrid(ctx, geom) {
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.6;
    for (let x = 0; x <= geom.maxX; x++) {
      const px = geom.toX(x);
      ctx.beginPath(); ctx.moveTo(px, geom.toY(0)); ctx.lineTo(px, geom.toY(geom.maxY)); ctx.stroke();
    }
    for (let y = 0; y <= geom.maxY; y++) {
      const py = geom.toY(y);
      ctx.beginPath(); ctx.moveTo(geom.toX(0), py); ctx.lineTo(geom.toX(geom.maxX), py); ctx.stroke();
    }
  }

  function drawAxes(ctx, geom) {
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(geom.toX(0), geom.toY(0));
    ctx.lineTo(geom.toX(geom.maxX), geom.toY(0));
    ctx.moveTo(geom.toX(0), geom.toY(0));
    ctx.lineTo(geom.toX(0), geom.toY(geom.maxY));
    ctx.stroke();

    ctx.fillStyle = C.axisText;
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = 1; y <= geom.maxY; y++) {
      ctx.fillText(String(y), geom.toX(0) - 5, geom.toY(y));
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = 1; x <= geom.maxX; x++) {
      ctx.fillText(String(x), geom.toX(x), geom.toY(0) + 5);
    }
  }

  function drawLine(ctx, geom, p, q, color, opts) {
    const dashed = opts && opts.dashed;
    const width = (opts && opts.width) || 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(geom.toX(p.x), geom.toY(p.y));
    ctx.lineTo(geom.toX(q.x), geom.toY(q.y));
    ctx.stroke();
    ctx.restore();
  }

  function drawLineLabel(ctx, geom, p, q, text, color) {
    const mx = (geom.toX(p.x) + geom.toX(q.x)) / 2;
    const my = (geom.toY(p.y) + geom.toY(q.y)) / 2;
    ctx.fillStyle = '#fff';
    const w = ctx.measureText(text).width + 10;
    ctx.fillRect(mx - w / 2, my - 9, w, 18);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - w / 2 + 0.5, my - 8.5, w - 1, 17);
    ctx.fillStyle = color;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, mx, my);
  }

  function drawPoint(ctx, geom, p, color, opts) {
    const r = (opts && opts.r) || 6;
    const labelColor = (opts && opts.labelColor) || C.text;
    const labelDx = (opts && opts.labelDx);
    const labelDy = (opts && opts.labelDy);
    const px = geom.toX(p.x), py = geom.toY(p.y);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const dx = labelDx !== undefined ? labelDx : 10;
    const dy = labelDy !== undefined ? labelDy : -10;
    ctx.fillText(`${p.name} (${p.x},${p.y})`, px + dx, py + dy);
  }

  // ------------------------------------------------------------
  // Animation engine
  // ------------------------------------------------------------
  function bind(opts) {
    const canvas = document.getElementById(opts.canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepEl  = document.getElementById(opts.stepId);
    const labelEl = document.getElementById(opts.labelId);

    function fit() {
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      canvas.width  = r.width * dpr;
      canvas.height = (r.height || opts.height) * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const geom = opts.geom(w, h);
      drawGrid(ctx, geom);
      drawAxes(ctx, geom);
      opts.render(ctx, geom, state.step);
    }

    function updateLabel() {
      const total = opts.steps.length;
      if (stepEl) {
        const cur = state.step < 0 ? '--' : String(state.step + 1).padStart(2, '0');
        stepEl.textContent = `${cur} / ${String(total).padStart(2, '0')}`;
      }
      if (labelEl) {
        const text = state.step < 0
          ? (opts.initLabel || 'INITIAL · 按 Play 自動播放')
          : opts.steps[state.step].label;
        labelEl.innerHTML = text;
      }
    }

    const state = { step: -1, timer: null };
    function update() { updateLabel(); draw(); }
    function next()   { if (state.step < opts.steps.length - 1) { state.step++; update(); } else stop(); }
    function prev()   { if (state.step > -1) { state.step--; update(); } }
    function reset()  { stop(); state.step = -1; update(); }
    function play()  {
      if (state.timer) { stop(); return; }
      const pb = document.getElementById(opts.playId);
      if (pb) pb.textContent = 'Pause';
      state.timer = setInterval(() => {
        if (state.step >= opts.steps.length - 1) { stop(); return; }
        next();
      }, opts.tick || 1300);
    }
    function stop() {
      if (state.timer) { clearInterval(state.timer); state.timer = null; }
      const pb = document.getElementById(opts.playId);
      if (pb) pb.textContent = 'Play';
    }

    const $ = (id) => id && document.getElementById(id);
    $(opts.prevId)  && $(opts.prevId) .addEventListener('click', prev);
    $(opts.nextId)  && $(opts.nextId) .addEventListener('click', next);
    $(opts.playId)  && $(opts.playId) .addEventListener('click', play);
    $(opts.resetId) && $(opts.resetId).addEventListener('click', reset);

    window.addEventListener('resize', () => { fit(); draw(); });
    fit();
    update();
  }

  // ============================================================
  //  ANIMATION 1 — Base case (brute on 3 points)
  // ============================================================
  const BASE_PTS = [
    { name: 'P1', x: 1, y: 1 },
    { name: 'P2', x: 2, y: 4 },
    { name: 'P3', x: 5, y: 2 },
  ];

  // d² for each pair
  function d2(a, b) { return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y); }
  // d²: P1-P2=10, P1-P3=17, P2-P3=13 → best (P1, P2) = 10

  const BASE_STEPS = [
    {
      kind: 'compare',
      i: 0, j: 1,                              // P1 vs P2
      bestNow: { i: 0, j: 1, d2: 10 },
      newBest: true,
      label:
        '<strong>STEP 01 · 比較 (P1, P2)</strong>' +
        '<br/>d² = (2−1)² + (4−1)² = 1 + 9 = <strong>10</strong> · 第一個 pair 直接設為當前最佳。'
    },
    {
      kind: 'compare',
      i: 0, j: 2,                              // P1 vs P3
      bestNow: { i: 0, j: 1, d2: 10 },
      newBest: false,
      label:
        '<strong>STEP 02 · 比較 (P1, P3)</strong>' +
        '<br/>d² = (5−1)² + (2−1)² = 16 + 1 = 17 · <span style="color:var(--sc-muted)">17 ≥ 10，未更新。</span>'
    },
    {
      kind: 'compare',
      i: 1, j: 2,                              // P2 vs P3
      bestNow: { i: 0, j: 1, d2: 10 },
      newBest: false,
      label:
        '<strong>STEP 03 · 比較 (P2, P3)</strong>' +
        '<br/>d² = (5−2)² + (2−4)² = 9 + 4 = 13 · <span style="color:var(--sc-muted)">13 ≥ 10，未更新。</span>'
    },
    {
      kind: 'final',
      bestNow: { i: 0, j: 1, d2: 10 },
      label:
        '<strong>FINAL · 最近 pair = (P1, P2)，d² = 10</strong>' +
        '<br/>3 個 pair 全部比完，最小者勝出。 n ≤ 3 時 brute force 就是 base case 的最佳策略。'
    },
  ];

  function renderBase(ctx, geom, stepIdx) {
    const step = stepIdx < 0 ? null : BASE_STEPS[stepIdx];

    // Draw existing best-line first (so focus line overlays it)
    if (step && step.bestNow && step.kind !== 'compare') {
      const b = step.bestNow;
      drawLine(ctx, geom, BASE_PTS[b.i], BASE_PTS[b.j], C.lineBest, { width: 2.5 });
    }

    // Draw current comparison line
    if (step && step.kind === 'compare') {
      const color = step.newBest ? C.lineFocus : C.lineDim;
      drawLine(ctx, geom, BASE_PTS[step.i], BASE_PTS[step.j], color, {
        dashed: !step.newBest, width: step.newBest ? 3 : 1.8
      });
      const d = d2(BASE_PTS[step.i], BASE_PTS[step.j]);
      drawLineLabel(ctx, geom, BASE_PTS[step.i], BASE_PTS[step.j], `d²=${d}`, color);
    }

    // Draw points
    BASE_PTS.forEach((p, idx) => {
      let color = C.ptDefault;
      let r = 6;
      if (step) {
        const inFocus = (step.kind === 'compare') && (idx === step.i || idx === step.j);
        const inBest = step.bestNow && (idx === step.bestNow.i || idx === step.bestNow.j);
        if (step.kind === 'final' && inBest) { color = C.ptBest; r = 8; }
        else if (inFocus && step.newBest)    { color = C.ptFocus; r = 8; }
        else if (inFocus)                    { color = C.ptFocus; r = 7; }
        else if (inBest)                     { color = C.ptBest;  r = 7; }
      }
      drawPoint(ctx, geom, p, color, { r });
    });
  }

  bind({
    canvasId: 'viz-base',  prevId: 'vb-prev', nextId: 'vb-next', playId: 'vb-play', resetId: 'vb-reset',
    stepId:   'vb-step',   labelId: 'vb-label',
    initLabel:
      '<strong>INITIAL</strong> · 3 點直接 brute force — 比較所有 C(3, 2) = 3 個 pair' +
      '<br/><span style="color:var(--sc-muted)">P1 (1,1) &nbsp; P2 (2,4) &nbsp; P3 (5,2)</span>',
    height: 280,
    geom: (w, h) => ({
      maxX: 6, maxY: 5,
      toX: (x) => 50 + x * ((w - 80) / 6),
      toY: (y) => h - 40 - y * ((h - 60) / 5),
    }),
    steps: BASE_STEPS,
    render: renderBase,
    tick: 1500,
  });

  // ============================================================
  //  ANIMATION 2 — General case (D&C on 5 points)
  // ============================================================
  const GEN_PTS = [
    { name: 'P1', x: 1, y: 1 },
    { name: 'P2', x: 2, y: 5 },
    { name: 'P3', x: 4, y: 2 },
    { name: 'P4', x: 5, y: 4 },
    { name: 'P5', x: 7, y: 6 },
  ];

  const MID_X = 4;             // GEN_PTS[2].x
  const D_FROM_RECURSE = 8;    // d after recurse left+right
  const STRIP_HALF = Math.sqrt(D_FROM_RECURSE);   // ≈ 2.83

  // States:
  //  init / midline / left-brute / left-done / right-brute / right-done
  //  / strip-drawn / strip-collected / strip-check / final
  const GEN_STEPS = [
    {
      kind: 'midline',
      label:
        '<strong>STEP 01 · 按 x 切一半</strong>' +
        '<br/>取 mid 索引 = (0 + 4) / 2 = 2，<code>mid_x = pts[2].x = 4</code>。畫出垂直中線分隔左右兩半。'
    },
    {
      kind: 'left-brute',
      d_L: 10,
      bestPair: { i: 0, j: 2, d2: 10 },        // P1-P3 = 10 is best in left
      otherPairs: [
        { i: 0, j: 1, d2: 17 },                // P1-P2 = 17
        { i: 1, j: 2, d2: 13 },                // P2-P3 = 13
      ],
      label:
        '<strong>STEP 02 · 遞迴左半 {P1, P2, P3}</strong>' +
        '<br/>左半 n = 3 命中 base case，brute 3 個 pair：' +
        '<br/>· P1−P2: 17 &nbsp;·&nbsp; P1−P3: <strong>10</strong> &nbsp;·&nbsp; P2−P3: 13' +
        '<br/>⇒ <code>d_L = 10</code>'
    },
    {
      kind: 'right-brute',
      d_R: 8,
      bestPair: { i: 3, j: 4, d2: 8 },          // P4-P5 = 8
      label:
        '<strong>STEP 03 · 遞迴右半 {P4, P5}</strong>' +
        '<br/>右半 n = 2，唯一 pair P4−P5: (5−7)² + (4−6)² = <strong>8</strong>' +
        '<br/>⇒ <code>d_R = 8</code>'
    },
    {
      kind: 'd-merge',
      d: 8,
      label:
        '<strong>STEP 04 · 合併取 d = min(d_L, d_R) = 8</strong>' +
        '<br/>√8 ≈ 2.83 — 畫一條<strong>寬 2·√d ≈ 5.66</strong> 的 strip 跨在中線兩側。' +
        '<br/>跨界 pair 只可能落在這個 strip 內，外面的點不必看。'
    },
    {
      kind: 'strip-collect',
      d: 8,
      stripIdx: [1, 2, 3],                      // P2, P3, P4 in strip
      label:
        '<strong>STEP 05 · 收集 strip 內的點</strong>' +
        '<br/>條件 <code>|x − 4|² &lt; 8</code>：' +
        '<br/>P1(1,1): 9 ❌ &nbsp;·&nbsp; P2(2,5): 4 ✓ &nbsp;·&nbsp; P3(4,2): 0 ✓ &nbsp;·&nbsp; P4(5,4): 1 ✓ &nbsp;·&nbsp; P5(7,6): 9 ❌' +
        '<br/>strip = [P2, P3, P4]，再按 y 排序為 [P3(y=2), P4(y=4), P2(y=5)]'
    },
    {
      kind: 'strip-check',
      d: 5,
      stripIdx: [1, 2, 3],
      foundLine: { i: 2, j: 3, d2: 5 },        // P3-P4 = 5
      label:
        '<strong>STEP 06 · strip 內每點看下 7 個鄰居</strong>' +
        '<br/>· P3 vs P4: <code>1 + 4 = </code><strong>5</strong> ✓ 比 d=8 小，更新 d ← 5' +
        '<br/>· P3 vs P2: 4 + 9 = 13 &nbsp;·&nbsp; P4 vs P2: 9 + 1 = 10 &nbsp;<span style="color:var(--sc-muted)">未更新</span>'
    },
    {
      kind: 'final',
      d: 5,
      foundLine: { i: 2, j: 3, d2: 5 },
      label:
        '<strong>FINAL · 最近 pair = (P3, P4)，d² = 5</strong>' +
        '<br/>跨界比賽贏了單邊遞迴：左半最佳 10、右半最佳 8，但 strip 抓到的 (P3, P4) 才是真答案。<strong>沒有 strip 合併就會錯過</strong>。'
    },
  ];

  function renderGeneral(ctx, geom, stepIdx) {
    const step = stepIdx < 0 ? null : GEN_STEPS[stepIdx];

    // Half-pane shading (after midline shown)
    if (step && stepIdx >= 0) {
      const midPx = geom.toX(MID_X);
      ctx.fillStyle = C.halfL;
      ctx.fillRect(geom.toX(0), geom.toY(geom.maxY), midPx - geom.toX(0), geom.toY(0) - geom.toY(geom.maxY));
      ctx.fillStyle = C.halfR;
      ctx.fillRect(midPx, geom.toY(geom.maxY), geom.toX(geom.maxX) - midPx, geom.toY(0) - geom.toY(geom.maxY));
    }

    // Strip (after merge step)
    if (step && (step.kind === 'd-merge' || step.kind === 'strip-collect' ||
                 step.kind === 'strip-check' || step.kind === 'final')) {
      const midPx = geom.toX(MID_X);
      const halfPx = STRIP_HALF * ((geom.toX(1) - geom.toX(0)));
      ctx.fillStyle = C.stripFill;
      ctx.fillRect(midPx - halfPx, geom.toY(geom.maxY), halfPx * 2, geom.toY(0) - geom.toY(geom.maxY));

      ctx.strokeStyle = C.stripEdge;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(midPx - halfPx, geom.toY(geom.maxY));
      ctx.lineTo(midPx - halfPx, geom.toY(0));
      ctx.moveTo(midPx + halfPx, geom.toY(geom.maxY));
      ctx.lineTo(midPx + halfPx, geom.toY(0));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Midline (after step 0)
    if (step) {
      const midPx = geom.toX(MID_X);
      ctx.strokeStyle = C.midline;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(midPx, geom.toY(0));
      ctx.lineTo(midPx, geom.toY(geom.maxY));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = C.midline;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('mid_x = 4', midPx + 6, geom.toY(geom.maxY) - 14);
    }

    // Pair lines drawn before points
    if (step && step.kind === 'left-brute') {
      // Show all 3 left-pair lines
      step.otherPairs.forEach((pp) => {
        drawLine(ctx, geom, GEN_PTS[pp.i], GEN_PTS[pp.j], C.lineDim, { dashed: true, width: 1.5 });
      });
      drawLine(ctx, geom, GEN_PTS[step.bestPair.i], GEN_PTS[step.bestPair.j], C.lineFocus, { width: 3 });
      drawLineLabel(ctx, geom, GEN_PTS[step.bestPair.i], GEN_PTS[step.bestPair.j],
                    `d_L = ${step.bestPair.d2}`, C.lineFocus);
    }

    if (step && step.kind === 'right-brute') {
      drawLine(ctx, geom, GEN_PTS[step.bestPair.i], GEN_PTS[step.bestPair.j], C.lineFocus, { width: 3 });
      drawLineLabel(ctx, geom, GEN_PTS[step.bestPair.i], GEN_PTS[step.bestPair.j],
                    `d_R = ${step.bestPair.d2}`, C.lineFocus);
    }

    if (step && (step.kind === 'strip-check' || step.kind === 'final')) {
      drawLine(ctx, geom, GEN_PTS[step.foundLine.i], GEN_PTS[step.foundLine.j],
               C.lineBest, { width: 3 });
      drawLineLabel(ctx, geom, GEN_PTS[step.foundLine.i], GEN_PTS[step.foundLine.j],
                    `d² = ${step.foundLine.d2}`, C.lineBest);
    }

    // Points
    GEN_PTS.forEach((p, idx) => {
      let color = C.ptDefault;
      let r = 6;

      if (step) {
        const inStrip = step.stripIdx && step.stripIdx.includes(idx);
        const isBest  = (step.kind === 'final')
                      && step.foundLine && (idx === step.foundLine.i || idx === step.foundLine.j);
        const inLeft  = (step.kind === 'left-brute')  && idx <= 2;
        const inRight = (step.kind === 'right-brute') && idx >= 3;
        const onPair  = (step.kind === 'left-brute' || step.kind === 'right-brute')
                       && (idx === step.bestPair.i || idx === step.bestPair.j);
        const isFoundPair = (step.kind === 'strip-check')
                       && step.foundLine && (idx === step.foundLine.i || idx === step.foundLine.j);

        if (isBest)             { color = C.ptBest;   r = 8; }
        else if (isFoundPair)   { color = C.ptBest;   r = 7; }
        else if (onPair)        { color = C.ptFocus;  r = 7; }
        else if (inStrip)       { color = C.ptStrip;  r = 7; }
        else if (inLeft || inRight) { color = C.ptFocus; r = 6; }
        else if (step.kind === 'left-brute'  && idx > 2) color = C.ptDim;
        else if (step.kind === 'right-brute' && idx < 3) color = C.ptDim;
      }

      drawPoint(ctx, geom, p, color, { r });
    });
  }

  bind({
    canvasId: 'viz-general', prevId: 'vg-prev', nextId: 'vg-next', playId: 'vg-play', resetId: 'vg-reset',
    stepId:   'vg-step',     labelId: 'vg-label',
    initLabel:
      '<strong>INITIAL</strong> · 5 點按 x 排序：P1(1,1) P2(2,5) P3(4,2) P4(5,4) P5(7,6)' +
      '<br/><span style="color:var(--sc-muted)">按 Play 自動播放 7 步：切半 → 遞迴左 → 遞迴右 → 合併 strip → 找跨界 pair。</span>',
    height: 380,
    geom: (w, h) => ({
      maxX: 8, maxY: 7,
      toX: (x) => 56 + x * ((w - 90) / 8),
      toY: (y) => h - 44 - y * ((h - 70) / 7),
    }),
    steps: GEN_STEPS,
    render: renderGeneral,
    tick: 1700,
  });

})();
