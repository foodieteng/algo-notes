/* ============================================================
   P122 邪惡收集大作戰 — Meet in the Middle subset-sum = K.
   Split N items into left/right halves; enumerate every subset
   sum of the left half (store (sum, mask)), sort it; for each
   right-half subset sum s, binary-search the left table for K-s.
   Style: white paper, solid fills, three tidy horizontal bands:
     BAND 1  the N items, split into left | right halves
     BAND 2  left half sorted subset-sum table (sum / mask chips)
     BAND 3  right half enumeration: s, need=K-s, probe -> hit
   Walks sample solve(3, 17, {6,8,9}): left={6}, right={8,9}.
   Hit at right mask=3 (8+9=17), need=0, left empty set.
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
    paper:  '#ffffff',
    grid:   '#cfcfcf',
    cellBg: '#f4f6f8',
    left:   '#8fb3d4', leftBg: '#e3edf5',   // left half / left table
    right:  '#d4a868', rightBg: '#f6ead8',   // right half subset s
    need:   '#d96e4e', needBg: '#f7ddd2',    // the probe target K-s
    hit:    '#5fa866', hitBg: '#d9e8c7',     // matched -> answer
    zero:   '#cfcfcf',
    ink:    '#1a1a1a', dim: '#9a9a9a',
  };

  const N = 3, K = 17;
  const A = [6, 8, 9];                 // items 1..3 (0-indexed here)
  const half = Math.floor(N / 2);      // 1
  const rest = N - half;               // 2

  // left table: all subset sums of A[0..half), sorted by sum
  let leftTbl = [];
  for (let m = 0; m < (1 << half); m++) {
    let s = 0; for (let b = 0; b < half; b++) if (m >> b & 1) s += A[b];
    leftTbl.push({ sum: s, mask: m });
  }
  leftTbl.sort((p, q) => p.sum - q.sum);

  // ── build steps ──
  const steps = [];
  function snap(o) { steps.push(o); }

  snap({
    phase: 'init',
    text: '<strong>INITIAL</strong> · 物品 {6, 8, 9}，目標 K=17。切兩半：左半 = {物品1=6}，右半 = {物品2=8, 物品3=9}。',
  });

  snap({
    phase: 'build',
    text: '<strong>左半建表</strong>：枚舉左半 2¹=2 個子集 — mask0={}和0、mask1={物品1}和6 — ' +
          '存 (和, mask) 並<strong>依和排序</strong>，得查找表 [(0,m0), (6,m1)]。',
  });

  // right-half enumeration
  for (let m = 0; m < (1 << rest); m++) {
    let s = 0; const picks = [];
    for (let b = 0; b < rest; b++) if (m >> b & 1) { s += A[half + b]; picks.push(half + b + 1); }
    const need = K - s;
    // binary search need in leftTbl
    let found = -1;
    if (need >= 0) for (let i = 0; i < leftTbl.length; i++) if (leftTbl[i].sum === need) { found = i; break; }
    const picksTxt = picks.length ? '{' + picks.map(id => '物品' + id + '=' + A[id - 1]).join(', ') + '}' : '{}（空集）';
    snap({
      phase: 'probe',
      rmask: m, rsum: s, rpicks: picks, need, found,
      text: `<strong>右半 mask=${m}</strong> 選 ${picksTxt}，和 s=${s} ⇒ 在左半二分搜 K−s = ${K}−${s} = <strong>${need}</strong>：` +
            (found >= 0 ? '<strong style="color:#5fa866">命中！</strong>（左半 ' + (leftTbl[found].mask === 0 ? '選空集' : 'mask=' + leftTbl[found].mask) + '）'
                        : '表中無此和 ⇒ 換下一個右半子集'),
    });
    if (found >= 0) break;
  }

  // answer step (the hit was right mask=3, items 2&3)
  const hit = steps[steps.length - 1];
  snap({
    phase: 'done',
    rmask: hit.rmask, rsum: hit.rsum, rpicks: hit.rpicks, need: hit.need, found: hit.found,
    answerIds: hit.rpicks.slice(),
    text: `<strong>還原 + 回報</strong>：左半選空集、右半選 {物品2, 物品3} ⇒ ` +
          `Report(2); Report(3); Report(-1)。驗證 8 + 9 = 17 = K ✓。`,
  });

  let step = 0, timer = null;

  function fitCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 500;
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function bandTitle(txt, y) {
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(txt, 26, y);
  }

  // a labelled value box; returns its width
  function box(x, y, w, h, bg, st, lw, valTxt, valColor, valFont, subTxt) {
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = valColor; ctx.font = valFont;
    ctx.fillText(valTxt, x + w / 2, y + h / 2);
    if (subTxt) {
      ctx.fillStyle = COLOR.dim; ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(subTxt, x + w / 2, y + h + 3);
    }
  }

  function draw() {
    fitCanvas();
    const s = steps[step];
    const w = canvas.clientWidth;
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, canvas.clientHeight);

    const PAD = 26;
    const band1Y = 34, band2Y = 168, band3Y = 320;
    const cx = w / 2;

    // ───────── BAND 1 · the items split ─────────
    bandTitle('BAND 1 · N=3 件物品，切成 左半 | 右半', band1Y);
    {
      const cellW = 86, cellH = 60, gap = 14;
      const dividerGap = 30;
      const totalW = N * cellW + (N - 1) * gap + dividerGap;
      let x = cx - totalW / 2;
      const y = band1Y + 22;
      for (let i = 0; i < N; i++) {
        const isLeft = i < half;
        let bg = isLeft ? COLOR.leftBg : COLOR.rightBg;
        let st = isLeft ? COLOR.left : COLOR.right;
        // highlight right picks during probe/done
        if (!isLeft && (s.phase === 'probe' || s.phase === 'done') && s.rpicks && s.rpicks.includes(i + 1)) {
          bg = (s.phase === 'done' || s.found >= 0) ? COLOR.hitBg : COLOR.rightBg;
          st = (s.phase === 'done' || s.found >= 0) ? COLOR.hit : COLOR.right;
        }
        box(x, y, cellW, cellH, bg, st, 2, String(A[i]), COLOR.ink, '700 22px "JetBrains Mono", monospace', '物品' + (i + 1));
        x += cellW + gap;
        if (i === half - 1) {
          // divider line "|"
          const dx = x - gap / 2 + dividerGap / 2 - 4;
          ctx.strokeStyle = COLOR.dim; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(dx, y - 4); ctx.lineTo(dx, y + cellH + 20); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = COLOR.dim; ctx.font = '600 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText('left | right', dx, y + cellH + 22);
          x += dividerGap;
        }
      }
    }

    // ───────── BAND 2 · left sorted table ─────────
    bandTitle('BAND 2 · 左半子集和查找表（已排序） leftSum = (和, mask)', band2Y);
    if (s.phase === 'init') {
      ctx.fillStyle = COLOR.dim; ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('（即將枚舉左半所有子集和並排序…）', PAD + 4, band2Y + 42);
    } else {
      const bw2 = 120, bh2 = 52, gap2 = 22;
      const totalW = leftTbl.length * bw2 + (leftTbl.length - 1) * gap2;
      let x = cx - totalW / 2;
      const y = band2Y + 24;
      for (let i = 0; i < leftTbl.length; i++) {
        const e = leftTbl[i];
        let bg = COLOR.leftBg, st = COLOR.left, lw = 2;
        // if this entry is the binary-search target during a probe/hit
        if ((s.phase === 'probe' || s.phase === 'done') && s.found === i) { bg = COLOR.hitBg; st = COLOR.hit; lw = 3; }
        box(x, y, bw2, bh2, bg, st, lw,
            '和=' + e.sum, COLOR.ink, '700 18px "JetBrains Mono", monospace',
            e.mask === 0 ? 'mask0 {}' : 'mask' + e.mask + ' {物品1}');
        x += bw2 + gap2;
      }
    }

    // ───────── BAND 3 · right enumeration / probe ─────────
    bandTitle(s.phase === 'done' ? 'BAND 3 · 命中 → 構造答案' : 'BAND 3 · 右半枚舉：和 s，二分搜 K − s', band3Y);
    if (s.phase === 'probe' || s.phase === 'done') {
      const y = band3Y + 30;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      // right subset box
      const rpicksTxt = s.rpicks.length ? s.rpicks.map(id => '物品' + id).join('+') : '空集';
      let x = PAD + 4;
      box(x, y - 26, 200, 52, COLOR.rightBg, COLOR.right, 2,
          's = ' + s.rsum, COLOR.ink, '700 18px "JetBrains Mono", monospace', '右半 ' + rpicksTxt);
      x += 200 + 24;
      // arrow
      ctx.fillStyle = COLOR.dim; ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle'; ctx.fillText('→', x, y); x += 36;
      // need box
      const nbg = (s.found >= 0) ? COLOR.hitBg : COLOR.needBg;
      const nst = (s.found >= 0) ? COLOR.hit : COLOR.need;
      box(x, y - 26, 230, 52, nbg, nst, s.found >= 0 ? 3 : 2,
          'K−s = ' + s.need, COLOR.ink, '700 18px "JetBrains Mono", monospace', '二分搜這個和');
      x += 230 + 24;
      // verdict
      ctx.fillStyle = (s.found >= 0) ? COLOR.hit : COLOR.need;
      ctx.font = '700 20px "JetBrains Mono", monospace'; ctx.textBaseline = 'middle';
      ctx.fillText(s.found >= 0 ? '命中 ✓' : '查無 ✗', x, y);

      // running list of all probes so far (compact log)
      ctx.fillStyle = COLOR.dim; ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const probeSteps = steps.slice(0, step + 1).filter(t => t.phase === 'probe' || t.phase === 'done');
      let ly = y + 44;
      ctx.fillText('已試右半子集：', PAD + 4, ly); ly += 20;
      const seen = new Set();
      probeSteps.forEach(t => {
        if (seen.has(t.rmask)) return; seen.add(t.rmask);
        const tag = t.found >= 0 ? '命中' : '✗';
        const col = t.found >= 0 ? COLOR.hit : COLOR.dim;
        ctx.fillStyle = col;
        ctx.fillText(`  s=${t.rsum}  K−s=${t.need}  ${tag}`, PAD + 4, ly); ly += 18;
      });

      if (s.phase === 'done') {
        ctx.fillStyle = COLOR.hit; ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('Report(' + s.answerIds.join('); Report(') + '); Report(-1);', PAD + 320, y + 72);
      }
    } else {
      ctx.fillStyle = COLOR.dim; ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('（建好左半表後，逐一枚舉右半子集，每個和 s 去左半二分搜 K − s）', PAD + 4, band3Y + 42);
    }
  }

  function update() {
    const s = steps[step];
    if (stepEl) stepEl.textContent = String(step).padStart(2, '0') + ' / ' + String(steps.length - 1).padStart(2, '0');
    if (labelEl) labelEl.innerHTML = s.text;
    draw();
  }

  function next()  { if (step < steps.length - 1) { step++; update(); } else stop(); }
  function prev()  { if (step > 0) { step--; update(); } }
  function reset() { stop(); step = 0; update(); }
  function play()  {
    if (timer) { stop(); return; }
    btnPlay.textContent = 'Pause';
    timer = setInterval(() => { if (step >= steps.length - 1) { stop(); return; } next(); }, 1600);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } if (btnPlay) btnPlay.textContent = 'Play'; }

  btnPrev  && btnPrev .addEventListener('click', prev);
  btnNext  && btnNext .addEventListener('click', next);
  btnPlay  && btnPlay .addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', () => { fitCanvas(); draw(); });
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { fitCanvas(); draw(); }); ro.observe(canvas); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  fitCanvas();
  update();
})();
