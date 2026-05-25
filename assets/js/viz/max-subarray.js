/* ============================================================
   Kadane's Algorithm — Step Visualization (workshop theme)
   ============================================================ */

(function () {
  const canvas = document.getElementById('viz-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const stepEl = document.getElementById('viz-step');
  const btnPrev = document.getElementById('viz-prev');
  const btnNext = document.getElementById('viz-next');
  const btnPlay = document.getElementById('viz-play');
  const btnReset = document.getElementById('viz-reset');

  // Color tokens — keep in sync with assets/css/tokens.css
  const COLOR = {
    line:        '#3a3a3a',
    lineBright:  '#555555',
    bgCode:      '#0d0d0d',
    ink:         '#e8e6e1',
    inkDim:      '#9a958c',
    concrete:    '#8a847a',
    rust:        '#c1440e',
    rustBright:  '#e85d1f',
    warning:     '#d4a017',
    rustFillBest:'rgba(193, 68, 14, 0.22)',
    rustFillCur: 'rgba(193, 68, 14, 0.07)',
  };

  const arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4];

  // Precompute Kadane states
  const states = [];
  let cur = 0, best = -Infinity, bestL = 0, bestR = 0, curL = 0;
  for (let i = 0; i < arr.length; i++) {
    if (cur + arr[i] < arr[i]) { cur = arr[i]; curL = i; }
    else cur = cur + arr[i];
    if (cur > best) { best = cur; bestL = curL; bestR = i; }
    states.push({ i, cur, best, curL, bestL, bestR });
  }

  let idx = -1;
  let timer = null;

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 320 * dpr;
    canvas.style.height = '320px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = 320;
    ctx.clearRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = COLOR.line;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const n = arr.length;
    const padding = 32;
    const cellW = (w - padding * 2) / n;
    const baseY = h / 2;

    const s = idx >= 0 ? states[idx] : null;

    for (let i = 0; i < n; i++) {
      const x = padding + i * cellW;
      const isBest = s && i >= s.bestL && i <= s.bestR;
      const isCur  = s && i >= s.curL && i <= s.i;
      const isHead = s && i === s.i;

      ctx.fillStyle = isBest ? COLOR.rustFillBest :
                      isCur  ? COLOR.rustFillCur  : COLOR.bgCode;
      ctx.fillRect(x + 2, baseY - 32, cellW - 4, 64);

      ctx.strokeStyle = isHead ? COLOR.rustBright :
                        isBest ? COLOR.rust       :
                        isCur  ? COLOR.lineBright : COLOR.line;
      ctx.lineWidth = isHead ? 2 : 1;
      ctx.strokeRect(x + 2, baseY - 32, cellW - 4, 64);

      ctx.fillStyle = isHead ? COLOR.rustBright : COLOR.ink;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(arr[i]), x + cellW / 2, baseY);

      ctx.fillStyle = COLOR.concrete;
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText('[' + i + ']', x + cellW / 2, baseY + 48);
    }

    // Header info
    ctx.fillStyle = COLOR.concrete;
    ctx.font = '600 11px "Oswald", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('STEP ' + (idx < 0 ? '--' : String(idx + 1).padStart(2, '0')) + ' / ' + n, padding, 24);

    if (s) {
      ctx.textAlign = 'right';
      ctx.fillStyle = COLOR.inkDim;
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText('cur=' + s.cur + '   best=' + s.best, w - padding, 24);
    }
  }

  function update() {
    const total = states.length;
    if (stepEl) stepEl.textContent = (idx < 0 ? '--' : String(idx + 1).padStart(2, '0')) + ' / ' + String(total).padStart(2, '0');
    draw();
  }

  function next() {
    if (idx < states.length - 1) { idx++; update(); }
    else stop();
  }
  function prev() { if (idx > -1) { idx--; update(); } }
  function reset() { stop(); idx = -1; update(); }
  function play() {
    if (timer) { stop(); return; }
    btnPlay.textContent = 'Pause';
    timer = setInterval(() => {
      if (idx >= states.length - 1) { stop(); return; }
      next();
    }, 700);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (btnPlay) btnPlay.textContent = 'Play';
  }

  btnPrev && btnPrev.addEventListener('click', prev);
  btnNext && btnNext.addEventListener('click', next);
  btnPlay && btnPlay.addEventListener('click', play);
  btnReset && btnReset.addEventListener('click', reset);

  window.addEventListener('resize', () => { fitCanvas(); draw(); });
  fitCanvas();
  update();
})();
