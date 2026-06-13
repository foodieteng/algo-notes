/* ============================================================
   P373 取名字好困難QQ — the AC algorithm: LIS tails + upper_bound.
   Each number a[i] carries two candidate values {2*a[i], a[i]}
   (only those >= M). Process big-first; for each value x do
   upper_bound(tails, x): push if x is largest, else overwrite the
   first tail strictly greater than x. Answer = tails.size().

   TWO canvases (base case + general case), per the study-card rule
   that the base-case animation must be the SAME algorithm on its
   smallest non-trivial input:
     VIZ A (base)    : N=1, a=[3], M=1 — one element's two candidates
                       drive tails  [] -push6-> [6] -ub(3)→replace-> [3]
                       teaches: push-to-empty, big-first / small-replaces
     VIZ B (general) : N=3, a=[2,1,3], M=1 — full walk
                       [4]->[2]->[2,2]->[1,2]->[1,2,6]->[1,2,3], answer 3
   Shared makeTailsViz() factory; called twice with prefixed IDs.
   Style: white paper, solid fills, tidy horizontal bands.
   ============================================================ */

(function () {

  const COLOR = {
    paper:  '#ffffff',
    grid:   '#cfcfcf',
    cellBg: '#f4f6f8',
    cur:    '#d96e4e', curBg: '#f7ddd2',   // the value x being processed
    tail:   '#8fb3d4', tailBg: '#e3edf5',   // tails cells
    push:   '#5fa866', pushBg: '#d9e8c7',    // pushed / extended cell
    repl:   '#d4a868', replBg: '#f6ead8',    // replaced (compressed) cell
    dead:   '#cfcfcf',
    ink:    '#1a1a1a', dim: '#9a9a9a',
  };

  // ---- build the step list for a given input ----
  function buildSteps(N, M, a, opts) {
    const steps = [];
    const tails = [];
    const cand = (i) => [2 * a[i], a[i]];   // big first, small second

    steps.push({
      kind: 'init', i: -1, x: null, tails: [],
      text: opts.initText,
    });

    for (let i = 0; i < N; i++) {
      const cs = cand(i);
      for (let k = 0; k < 2; k++) {
        const x = cs[k];
        const tag = k === 0 ? '大候選 2a' : '小候選 a';
        if (x < M) {
          steps.push({
            kind: 'skip', i, x, tag, tails: tails.slice(),
            text: `<strong>第 ${i + 1} 個數的${tag} = ${x}</strong> &lt; M=${M} ⇒ 不可用，跳過。`,
          });
          continue;
        }
        // upper_bound: first index with tails[idx] > x
        let idx = tails.length;
        for (let t = 0; t < tails.length; t++) if (tails[t] > x) { idx = t; break; }
        const isPush = (idx === tails.length);
        const before = tails.slice();
        const oldVal = isPush ? null : tails[idx];
        if (isPush) tails.push(x); else tails[idx] = x;
        steps.push({
          kind: isPush ? 'push' : 'replace',
          i, x, tag, idx, oldVal,
          before, tails: tails.slice(),
          text: `<strong>第 ${i + 1} 個數的${tag} = ${x}</strong>：upper_bound 找第一個 &gt; ${x} 的位置 ⇒ ` +
                (isPush
                  ? `沒有（${x} 比所有 tail 大）⇒ <strong style="color:#5fa866">push，鏈長 +1</strong> → tails = [${tails.join(', ')}]`
                  : `位置 ${idx}（值 ${oldVal}）⇒ <strong style="color:#b8862f">壓小成 ${x}</strong> → tails = [${tails.join(', ')}]`),
        });
      }
    }
    steps.push({
      kind: 'done', i: N, x: null, tails: tails.slice(), ans: tails.length,
      text: opts.doneText(tails),
    });
    return steps;
  }

  // ---- the per-canvas renderer/controller ----
  function makeTailsViz(opts) {
    const canvas = document.getElementById(opts.canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stepEl  = document.getElementById(opts.stepId);
    const labelEl = document.getElementById(opts.labelId);
    const btnPrev = document.getElementById(opts.prevId);
    const btnNext = document.getElementById(opts.nextId);
    const btnPlay = document.getElementById(opts.playId);
    const btnReset= document.getElementById(opts.resetId);

    const { N, M, a } = opts;
    const steps = buildSteps(N, M, a, opts);
    let step = 0, timer = null;

    function fit() {
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.clientWidth;
      const h = rect.height || canvas.clientHeight || 320;
      const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function bandTitle(txt, y) {
      ctx.fillStyle = COLOR.dim; ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(txt, 24, y);
    }

    // draw the N input numbers, each with its two candidate values stacked
    function drawInputs(s, y) {
      const w = canvas.clientWidth, cx = w / 2;
      const colW = Math.min(96, (w - 60) / N - 16);
      const gap = 16, cellH = 30;
      const totalW = N * colW + (N - 1) * gap;
      const gx = cx - totalW / 2;
      for (let i = 0; i < N; i++) {
        const x = gx + i * (colW + gap);
        ctx.fillStyle = COLOR.dim; ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('a' + (i + 1) + '=' + a[i], x + colW / 2, y - 4);
        const cs = [2 * a[i], a[i]];   // top=2a, bottom=a
        for (let row = 0; row < 2; row++) {
          const cy = y + row * (cellH + 6);
          const val = cs[row];
          const isCur = (s.i === i) && (s.x === val) &&
                        ((row === 0 && s.tag && s.tag.indexOf('大') >= 0) ||
                         (row === 1 && s.tag && s.tag.indexOf('小') >= 0));
          let bg = COLOR.cellBg, st = COLOR.grid, lw = 1;
          if (val < M) { bg = '#ededed'; st = COLOR.dead; }
          if (isCur)   { bg = COLOR.curBg; st = COLOR.cur; lw = 2.5; }
          ctx.fillStyle = bg; ctx.fillRect(x, cy, colW, cellH);
          ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.strokeRect(x + 0.5, cy + 0.5, colW - 1, cellH - 1);
          ctx.fillStyle = (val < M) ? COLOR.dead : COLOR.ink;
          ctx.font = '700 15px "JetBrains Mono", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(val), x + colW / 2 - 12, cy + cellH / 2);
          ctx.fillStyle = COLOR.dim; ctx.font = '600 9px "JetBrains Mono", monospace';
          ctx.fillText(row === 0 ? '×2' : '×1', x + colW / 2 + 22, cy + cellH / 2);
        }
      }
    }

    // draw the tails array
    function drawTails(s, y) {
      const w = canvas.clientWidth, cx = w / 2;
      const arr = s.tails;
      const cellW = 64, cellH = 48, gap = 12;
      const maxCells = Math.max(arr.length, 1);
      const totalW = maxCells * cellW + (maxCells - 1) * gap;
      const gx = cx - totalW / 2;
      if (arr.length === 0) {
        ctx.fillStyle = COLOR.dim; ctx.font = '500 15px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('tails = [ ]  （空）', cx, y + cellH / 2);
        return;
      }
      for (let t = 0; t < arr.length; t++) {
        const x = gx + t * (cellW + gap);
        let bg = COLOR.tailBg, st = COLOR.tail, lw = 1.5;
        if (s.kind === 'push' && t === s.idx)    { bg = COLOR.pushBg; st = COLOR.push; lw = 2.5; }
        if (s.kind === 'replace' && t === s.idx) { bg = COLOR.replBg; st = COLOR.repl; lw = 2.5; }
        ctx.fillStyle = bg; ctx.fillRect(x, y, cellW, cellH);
        ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
        ctx.fillStyle = COLOR.ink; ctx.font = '700 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(arr[t]), x + cellW / 2, y + cellH / 2 - 5);
        ctx.fillStyle = COLOR.dim; ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textBaseline = 'top';
        ctx.fillText('len ' + (t + 1), x + cellW / 2, y + cellH - 1);
      }
      // upper_bound pointer + x chip above the affected cell
      if ((s.kind === 'push' || s.kind === 'replace')) {
        const t = s.idx;
        const px = gx + t * (cellW + gap) + cellW / 2;
        const chipY = y - 30;
        ctx.fillStyle = COLOR.cur; ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('x=' + s.x + (s.kind === 'push' ? ' ↓ push' : ' ↓ 壓小'), px, chipY + 4);
        ctx.strokeStyle = COLOR.cur; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, chipY + 8); ctx.lineTo(px, y - 2); ctx.stroke();
      }
    }

    function draw() {
      fit();
      const s = steps[step];
      const w = canvas.clientWidth;
      ctx.fillStyle = COLOR.paper;
      ctx.fillRect(0, 0, w, canvas.clientHeight);

      bandTitle('BAND 1 · 輸入數字（上 2aᵢ · 下 aᵢ；珊瑚 = 正在處理的候選 x）', 26);
      drawInputs(s, 46);

      bandTitle('BAND 2 · tails 陣列（每格 = 該長度鏈的最小結尾）', 132);
      drawTails(s, 192);

      // answer line
      if (s.kind === 'done') {
        ctx.fillStyle = COLOR.push; ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('答案 = tails.size() = ' + s.ans, w / 2, 268);
      }
    }

    function update() {
      if (stepEl) stepEl.textContent = String(step).padStart(2, '0') + ' / ' + String(steps.length - 1).padStart(2, '0');
      if (labelEl) labelEl.innerHTML = steps[step].text;
      draw();
    }
    function next()  { if (step < steps.length - 1) { step++; update(); } else stop(); }
    function prev()  { if (step > 0) { step--; update(); } }
    function reset() { stop(); step = 0; update(); }
    function play()  {
      if (timer) { stop(); return; }
      if (btnPlay) btnPlay.textContent = 'Pause';
      timer = setInterval(() => { if (step >= steps.length - 1) { stop(); return; } next(); }, 1500);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } if (btnPlay) btnPlay.textContent = 'Play'; }

    btnPrev  && btnPrev .addEventListener('click', prev);
    btnNext  && btnNext .addEventListener('click', next);
    btnPlay  && btnPlay .addEventListener('click', play);
    btnReset && btnReset.addEventListener('click', reset);

    window.addEventListener('resize', () => { fit(); draw(); });
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => { fit(); draw(); }); ro.observe(canvas); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    fit(); update();
  }

  // ===== VIZ A · BASE CASE — single element, two candidates =====
  makeTailsViz({
    canvasId: 'viz-base', stepId: 'vb-step', labelId: 'vb-label',
    prevId: 'vb-prev', nextId: 'vb-next', playId: 'vb-play', resetId: 'vb-reset',
    N: 1, M: 1, a: [3],
    initText: '<strong>INITIAL</strong> · 一個數字 a₁=3，候選 {6, 3}（大先小後）。tails 一開始是空的。',
    doneText: (t) => `<strong>答案 = tails.size() = ${t.length}</strong>。一個數字最多貢獻長度 1：` +
                     `先 push 6 變 [6]，再用小候選 3 把它<strong>壓小成 [3]</strong>（同一數字只算一次，不會變 [3,6]）。`,
  });

  // ===== VIZ B · GENERAL CASE — full sample a=[2,1,3] =====
  makeTailsViz({
    canvasId: 'viz-general', stepId: 'vg-step', labelId: 'vg-label',
    prevId: 'vg-prev', nextId: 'vg-next', playId: 'vg-play', resetId: 'vg-reset',
    N: 3, M: 1, a: [2, 1, 3],
    initText: '<strong>INITIAL</strong> · a=[2,1,3]，M=1。每個數字兩候選值大先小後，逐一更新 tails。',
    doneText: (t) => `<strong>答案 = tails.size() = ${t.length}</strong>。tails 終值 [${t.join(', ')}]，` +
                     `對應最長非遞減鏈 [2, 2, 3]（a₁ 維持、a₂ ×2、a₃ 維持）。`,
  });

})();
