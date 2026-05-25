/* ============================================================
   P115 逆序數對 — merge sort with inversion-pair sum
   Sample: [5, 4, 2, 1, 3] → answer 51
   ============================================================ */

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const stepEl   = document.getElementById('viz-step');
  const labelEl  = document.getElementById('viz-label');
  const btnPrev  = document.getElementById('viz-prev');
  const btnNext  = document.getElementById('viz-next');
  const btnPlay  = document.getElementById('viz-play');
  const btnReset = document.getElementById('viz-reset');

  const COLOR = {
    paper:      '#ffffff',
    grid:       '#cfcfcf',
    cellBorder: '#888888',
    cellText:   '#1a1a1a',
    outside:    '#f3f1ed',
    left:       '#9bc4f0', // light blue – left half being merged
    right:      '#f5c98a', // light yellow – right half being merged
    merged:     '#c1440e', // rust – cells already sorted at the current level
    mergedText: '#ffffff',
    boardEdge:  '#1a1a1a',
  };

  const N = 5;
  const ARR_INITIAL = [5, 4, 2, 1, 3];

  // Each step = one merge event with its full contribution.
  const STEPS = [
    {
      title: 'STEP 01 · MERGE [5] | [4]',
      leftRange:  [0, 0],
      rightRange: [1, 1],
      before: [5, 4, 2, 1, 3],
      after:  [4, 5, 2, 1, 3],
      addedContrib: 9,
      runningSum: 9,
      detail:
        '左半 [5]、右半 [4]。<br/>' +
        '<code>5 &gt; 4</code> ⇒ 1 個逆序對。<br/>' +
        '貢獻 = (左半剩餘和) + <code>a[j]</code> × count = (5) + 4 × 1 = <strong>9</strong>。',
    },
    {
      title: 'STEP 02 · MERGE [4, 5] | [2]',
      leftRange:  [0, 1],
      rightRange: [2, 2],
      before: [4, 5, 2, 1, 3],
      after:  [2, 4, 5, 1, 3],
      addedContrib: 13,
      runningSum: 22,
      detail:
        '左半 [4, 5]、右半 [2]。<br/>' +
        '<code>4 &gt; 2</code> ⇒ 左半剩 (4, 5) 兩個都 &gt; 2，2 個逆序對。<br/>' +
        '貢獻 = (4 + 5) + 2 × 2 = <strong>13</strong>。',
    },
    {
      title: 'STEP 03 · MERGE [1] | [3]',
      leftRange:  [3, 3],
      rightRange: [4, 4],
      before: [2, 4, 5, 1, 3],
      after:  [2, 4, 5, 1, 3],
      addedContrib: 0,
      runningSum: 22,
      detail:
        '左半 [1]、右半 [3]。<br/>' +
        '<code>1 ≤ 3</code> ⇒ 取左、<strong>無逆序對</strong>。<br/>' +
        '本步貢獻 = 0。',
    },
    {
      title: 'STEP 04 · MERGE [2, 4, 5] | [1, 3]',
      leftRange:  [0, 2],
      rightRange: [3, 4],
      before: [2, 4, 5, 1, 3],
      after:  [1, 2, 3, 4, 5],
      addedContrib: 29,
      runningSum: 51,
      detail:
        '左半 [2, 4, 5]、右半 [1, 3]。Merge 過程內含 2 次貢獻：<br/>' +
        '① <code>2 &gt; 1</code> ⇒ 左半剩 (2,4,5) 都 &gt; 1，貢獻 (2+4+5) + 1×3 = <strong>14</strong>。<br/>' +
        '② <code>4 &gt; 3</code> ⇒ 左半剩 (4,5) 都 &gt; 3，貢獻 (4+5) + 3×2 = <strong>15</strong>。<br/>' +
        '本步合計 14 + 15 = <strong>29</strong>。',
    },
  ];

  let step = -1;
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

  function currentArray() {
    return step === -1 ? ARR_INITIAL : STEPS[step].after;
  }

  function classifyCell(idx) {
    if (step === -1) return 'outside';
    const s = STEPS[step];
    if (idx >= s.leftRange[0]  && idx <= s.leftRange[1])  return 'left';
    if (idx >= s.rightRange[0] && idx <= s.rightRange[1]) return 'right';
    return 'outside';
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // White paper bg
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    // Grid geometry
    const pad = 32;
    const labelArea = 60;
    const cellSize = Math.min(Math.floor((w - pad * 2) / N), 92);
    const totalW = cellSize * N;
    const x0 = (w - totalW) / 2;
    const y0 = labelArea + Math.max(20, (h - labelArea - cellSize - 40) / 2);

    // Top headline
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '700 14px "Oswald", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headline = (step === -1)
      ? `INITIAL · 序列 [5, 4, 2, 1, 3]`
      : STEPS[step].title;
    ctx.fillText(headline, w / 2, 20);

    // Sub headline for running sum
    ctx.fillStyle = '#888';
    ctx.font = '500 12px "JetBrains Mono", monospace';
    const sumText = (step === -1)
      ? `inv_sum = 0`
      : `inv_sum = ${STEPS[step].runningSum}` +
        (STEPS[step].addedContrib > 0
          ? `   ( +${STEPS[step].addedContrib} )`
          : '');
    ctx.fillText(sumText, w / 2, 42);

    // Draw cells
    const arr = currentArray();
    for (let i = 0; i < N; i++) {
      const x = x0 + i * cellSize;
      const y = y0;
      const kind = classifyCell(i);

      const fill = (kind === 'left')  ? COLOR.left
                 : (kind === 'right') ? COLOR.right
                 :                       COLOR.outside;

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = COLOR.cellBorder;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

      // Value
      ctx.fillStyle = COLOR.cellText;
      ctx.font = `700 ${Math.floor(cellSize * 0.45)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(arr[i]), x + cellSize / 2, y + cellSize / 2);

      // Index label below
      ctx.fillStyle = '#888';
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(`[${i}]`, x + cellSize / 2, y + cellSize + 6);

      // L / R tag above
      if (kind === 'left' || kind === 'right') {
        ctx.fillStyle = kind === 'left' ? '#1f5a99' : '#9c6a1d';
        ctx.font = '700 11px "Oswald", sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(kind === 'left' ? 'L' : 'R', x + cellSize / 2, y - 4);
      }
    }

    // Outer board
    ctx.strokeStyle = COLOR.boardEdge;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 1, y0 - 1, totalW + 2, cellSize + 2);
  }

  function updateLabel() {
    if (stepEl) {
      const cur = step === -1 ? '--' : String(step + 1).padStart(2, '0');
      stepEl.textContent = `${cur} / ${String(STEPS.length).padStart(2, '0')}`;
    }
    if (labelEl) {
      if (step === -1) {
        labelEl.innerHTML =
          '<strong>INITIAL</strong> · 原始序列 [5, 4, 2, 1, 3]<br/>' +
          '<span style="color:var(--ink-dim)">按 Play 自動播放 4 步 merge — 每一步是某一層的合併。</span>';
      } else {
        const s = STEPS[step];
        labelEl.innerHTML =
          `<strong>${s.title}</strong>` +
          (s.addedContrib > 0
            ? `<span class="chip chip--rust" style="margin-left:8px;font-size:9px;">+${s.addedContrib}</span>`
            : `<span class="chip" style="margin-left:8px;font-size:9px;">NO INVERSION</span>`) +
          `<br/>${s.detail}` +
          `<br/><span style="color:var(--concrete);font-size:11px;letter-spacing:0.05em">▸ 累計 inv_sum = ${s.runningSum}</span>`;
      }
    }
  }

  function update() { updateLabel(); draw(); }
  function next()   { if (step < STEPS.length - 1) { step++; update(); } else stop(); }
  function prev()   { if (step > -1) { step--; update(); } }
  function reset()  { stop(); step = -1; update(); }
  function play()   {
    if (timer) { stop(); return; }
    btnPlay.textContent = 'Pause';
    timer = setInterval(() => {
      if (step >= STEPS.length - 1) { stop(); return; }
      next();
    }, 1500);
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
