/* ============================================================
   P326 實實打怪獸 — greedy battle simulation.
   Each second: hp -= dps; hp = min(M, hp + R); if hp<=0 dead;
   then unlock spells with hp*100 <= p_i*M and cast the strongest.
   Style: white paper background, solid-color fills, three tidy bands:
     BAND 1  the boss HP bar (with threshold ticks per spell + 0 line)
     BAND 2  the per-second cycle: hp - dps + R = hp'  (+ alive/dead)
     BAND 3  spell roster (locked / ready / cast) + current dps + clock
   Walks the sample M=100, R=10, A(p=100,c=11), B(p=90,c=9) -> 19.
   Event-compressed: idle creeping seconds are shown as one "jump" step
   so every Next click visibly changes something (rule 4).
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
    grid:     '#cfcfcf',
    barBg:    '#f1f0ec',
    hp:       '#5fa866',   // HP fill (green)
    hpStroke: '#3f7a48',
    dmg:      '#d96e4e',   // damage / death (coral)
    regen:    '#5fa866',
    locked:   '#f6ead8',   // locked spell chip
    lockedSt: '#d4a868',
    ready:    '#e3edf5',   // unlocked-but-uncast (in heap)
    readySt:  '#8fb3d4',
    cast:     '#d9e8c7',   // cast spell
    castSt:   '#5fa866',
    thr:      '#d96e4e',   // threshold tick
    text:     '#1f3550',
    ink:      '#1a1a1a',
    dim:      '#9a9a9a',
  };

  const M = 100, R = 10;
  // spells: A(p=100,c=11), B(p=90,c=9)
  const SP = [
    { name: 'A', p: 100, c: 11 },
    { name: 'B', p: 90,  c: 9  },
  ];

  // ── build event-compressed steps ──
  const steps = [];
  function snap(o) { steps.push(o); }

  // helper to describe spell states given casted set
  function roster(castSet, readySet) {
    return SP.map((s, i) => ({
      ...s,
      state: castSet.has(i) ? 'cast' : (readySet.has(i) ? 'ready' : 'locked'),
    }));
  }

  snap({
    hp: M, dps: 0, sec: null, cast: new Set(), ready: new Set(),
    show: { dmg: 0, regen: R }, dead: false, jump: null,
    text: '<strong>INITIAL</strong> · 大魔王滿血 <code>100</code>。咒術 A 門檻 100%（滿血即可放）、B 門檻 90%（要血降到 90 才解鎖）。',
  });

  // sec 0: hp = min(100, 100-0+10)=100, A unlocks & cast
  snap({
    hp: M, dps: 11, sec: 0, cast: new Set([0]), ready: new Set(),
    show: { dmg: 0, regen: R, before: M, after: M }, dead: false, jump: null,
    castNow: 0,
    text: '<strong>sec 0</strong>：扣血 0 → 回血 +10（封頂 100）→ 不死。A 解鎖（hp×100=10000 ≤ 100×100）⇒ <strong>施放 A，dps = 11</strong>。',
  });

  // sec 1..10: dps=11 > R=10, hp creeps 100 -> 90 (net -1/sec)
  snap({
    hp: 90, dps: 11, sec: 10, cast: new Set([0]), ready: new Set(),
    show: { dmg: 11, regen: R, net: -1 }, dead: false,
    jump: { from: 100, to: 90, secFrom: 1, secTo: 10, net: -1 },
    text: '<strong>sec 1–10</strong>：dps=11 > R=10，每秒淨掉 1 血，生命值 100 → <strong>90</strong>（9 秒）。',
  });

  // sec 10 cast B
  snap({
    hp: 90, dps: 20, sec: 10, cast: new Set([0, 1]), ready: new Set(),
    show: { dmg: 11, regen: R, before: 90, after: 90 }, dead: false,
    castNow: 1,
    text: '<strong>sec 10</strong>：生命值剛好 90，B 解鎖（hp×100=9000 ≤ 90×100）⇒ <strong>施放 B，dps = 20</strong>。',
  });

  // sec 11..18: dps=20, hp 90 -> 10 (net -10/sec)
  snap({
    hp: 10, dps: 20, sec: 18, cast: new Set([0, 1]), ready: new Set(),
    show: { dmg: 20, regen: R, net: -10 }, dead: false,
    jump: { from: 90, to: 10, secFrom: 11, secTo: 18, net: -10 },
    text: '<strong>sec 11–18</strong>：dps=20，每秒淨掉 10 血，生命值 90 → <strong>10</strong>。',
  });

  // sec 19: dead
  snap({
    hp: 0, dps: 20, sec: 19, cast: new Set([0, 1]), ready: new Set(),
    show: { dmg: 20, regen: R, before: 10, after: 0 }, dead: true,
    text: '<strong>sec 19</strong>：10 − 20 + 10 = 0 ≤ 0 ⇒ <strong>打敗！答案 = 19</strong>。',
  });

  let step = 0, timer = null;

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth;
    const h = rect.height || canvas.clientHeight || 440;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    // only resize the backing store when it actually changed (avoids clearing mid-frame)
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width  = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    fitCanvas();                       // re-fit each frame: backing store stays crisp after fonts/layout settle
    const s = steps[step];
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = COLOR.paper;
    ctx.fillRect(0, 0, w, h);

    const PAD = 26;
    const band1Y = 34;     // HP bar title
    const band2Y = 196;    // cycle title
    const band3Y = 312;    // roster title

    // ───────────────── BAND 1 · HP bar ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 1 · 大魔王生命值（上限 M = 100）', PAD, band1Y);

    const barX = PAD, barW = w - PAD * 2, barTop = band1Y + 38, barH = 46;
    // track
    rr(barX, barTop, barW, barH, 4);
    ctx.fillStyle = COLOR.barBg; ctx.fill();
    ctx.strokeStyle = COLOR.grid; ctx.lineWidth = 1; ctx.stroke();
    // hp fill (left = full)
    const frac = Math.max(0, s.hp / M);
    if (frac > 0) {
      rr(barX, barTop, barW * frac, barH, 4);
      ctx.fillStyle = s.dead ? COLOR.dmg : COLOR.hp;
      ctx.fill();
      ctx.strokeStyle = s.dead ? '#a84a2f' : COLOR.hpStroke; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // hp value text inside/!beside bar
    ctx.fillStyle = COLOR.ink;
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const hpLabel = 'HP ' + s.hp;
    if (frac > 0.18) { ctx.fillStyle = '#ffffff'; ctx.fillText(hpLabel, barX + 10, barTop + barH / 2); }
    else { ctx.fillStyle = COLOR.ink; ctx.fillText(hpLabel, barX + barW * frac + 10, barTop + barH / 2); }

    // threshold ticks (spell p_i -> x position = p%*barW). Labels stacked on two rows
    // (by spell index) so nearby thresholds never collide, and clamped inside the canvas.
    SP.forEach((sp, idx) => {
      const x = barX + barW * (sp.p / 100);
      ctx.strokeStyle = COLOR.thr; ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x, barTop - 8); ctx.lineTo(x, barTop + barH + 8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLOR.thr;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      const labelY = barTop - 10 - (idx % 2) * 13;   // row 0 higher, row 1 lower
      const lbl = sp.name + ' 門檻 ' + sp.p + '%';
      const tw = ctx.measureText(lbl).width;
      if (x + tw / 2 > w - PAD) { ctx.textAlign = 'right'; ctx.fillText(lbl, x, labelY); }
      else if (x - tw / 2 < PAD) { ctx.textAlign = 'left'; ctx.fillText(lbl, x, labelY); }
      else { ctx.textAlign = 'center'; ctx.fillText(lbl, x, labelY); }
    });
    // 0 line caption
    ctx.fillStyle = COLOR.dim;
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('0', barX, barTop + barH + 6);
    ctx.textAlign = 'right';
    ctx.fillText('100', barX + barW, barTop + barH + 6);

    // ───────────────── BAND 2 · per-second cycle ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 2 · 每秒循環：hp − dps + R（封頂 M）→ 判死 → 施放', PAD, band2Y);

    const cy = band2Y + 38;
    if (s.jump) {
      // creeping run: show "sec a–b: hp from -> to, net/sec"
      const j = s.jump;
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('sec ' + j.secFrom + '–' + j.secTo + ' :', PAD, cy);
      ctx.fillStyle = COLOR.dmg;
      ctx.fillText('每秒 net = R − dps = ' + j.net, PAD + 150, cy);
      ctx.fillStyle = COLOR.text;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.fillText('HP ' + j.from + '  →  ' + j.to, PAD, cy + 30);
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 12px "Noto Sans TC", sans-serif';
      ctx.fillText('（這段沒有新咒解鎖，血量等速下降，動畫快轉）', PAD + 200, cy + 30);
    } else if (s.show && s.show.before != null) {
      const sh = s.show;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      // hp - dmg + R = after
      let x = PAD;
      const seg = (txt, col) => { ctx.fillStyle = col; ctx.fillText(txt, x, cy); x += ctx.measureText(txt).width + 6; };
      seg('sec ' + s.sec + ' :', COLOR.dim);
      seg(String(sh.before), COLOR.text);
      seg('−', COLOR.dim); seg(String(sh.dmg), COLOR.dmg);
      seg('+', COLOR.dim);  seg(String(sh.regen), COLOR.regen);
      seg('=', COLOR.dim);  seg(String(sh.after), s.dead ? COLOR.dmg : COLOR.text);
      // verdict
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillStyle = s.dead ? COLOR.dmg : COLOR.hpStroke;
      ctx.fillText(s.dead ? '  ≤ 0  → 打敗！' : '  > 0  → 存活', x + 4, cy);
      // cast note
      if (s.castNow != null) {
        ctx.fillStyle = COLOR.castSt;
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText('解鎖並施放 ' + SP[s.castNow].name + '（c=' + SP[s.castNow].c + '）→ dps = ' + s.dps, PAD, cy + 30);
      }
    } else {
      ctx.fillStyle = COLOR.dim;
      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('每秒：先扣已施放咒術的傷害，再回血、判死，最後施放當前可用最強咒術。', PAD, cy + 8);
    }

    // ───────────────── BAND 3 · spell roster + dps + clock ─────────────────
    ctx.fillStyle = COLOR.dim;
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('BAND 3 · 咒術狀態 · 當前 dps · 時間', PAD, band3Y);

    const r = roster(s.cast, s.ready);
    const cw = 150, ch = 56, cgap = 22;
    const ry = band3Y + 16;
    let rx = PAD;
    r.forEach((sp) => {
      let bg, st, tag;
      if (sp.state === 'cast') { bg = COLOR.cast; st = COLOR.castSt; tag = '● CAST'; }
      else if (sp.state === 'ready') { bg = COLOR.ready; st = COLOR.readySt; tag = '○ READY'; }
      else { bg = COLOR.locked; st = COLOR.lockedSt; tag = '× LOCKED'; }
      rr(rx, ry, cw, ch, 4);
      ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = st; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = COLOR.ink;
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('咒術 ' + sp.name, rx + 12, ry + 8);
      ctx.fillStyle = COLOR.text;
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText('p=' + sp.p + '%  c=' + sp.c, rx + 12, ry + 28);
      ctx.fillStyle = st;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(tag, rx + cw - 10, ry + ch - 8);
      rx += cw + cgap;
    });

    // dps + clock box on the right
    const boxX = Math.max(rx + 10, w - PAD - 220);
    const boxW = w - PAD - boxX;
    if (boxW > 120) {
      rr(boxX, ry, boxW, ch, 4);
      ctx.fillStyle = COLOR.ink; ctx.fill();
      ctx.fillStyle = '#ffd9c9';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('TOTAL DPS', boxX + 14, ry + 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(s.dps) + ' / 秒', boxX + 14, ry + ch - 8);
      // clock on far right inside box
      ctx.fillStyle = '#9fb8d8';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('SEC', boxX + boxW - 14, ry + 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(s.sec == null ? '–' : String(s.sec), boxX + boxW - 14, ry + ch - 8);
    }

    // R reminder line
    ctx.fillStyle = COLOR.dim;
    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('每秒回血 R = ' + R + '（封頂 M=' + M + '）· 可放條件 hp×100 ≤ pᵢ×M', PAD, ry + ch + 12);
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
    }, 1400);
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
  // web fonts load after first paint → text metrics shift; redraw once they're ready
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  fitCanvas();
  update();
})();
