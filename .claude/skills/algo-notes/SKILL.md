---
name: algo-notes
description: Use this skill when the user pastes an algorithm problem (from 資訊之芽算法班) into the AlgoToG repo and wants it integrated into their personal study-notes site. Each problem becomes a 3-page "study card" set (Concept / Code / Review) in industrial-cream styling with manual-token-span syntax highlighting and step-by-step canvas animations. The skill handles file scaffolding, sidebar sync via scripts/generate_chapters.py, and git commits.
---

# algo-notes — 資訊之芽算法班 study notes workflow

## Site layout

Static HTML notebook at the AlgoToG repo root. Each chapter (week) holds a set of problems. **Default layout is 3-page study card per problem:**

```
topics/<NN>-<slug>/
├── index.html                  # chapter overview + outline (generated)
└── problems/<pXXX>/
    ├── index.html              # PAGE 1 · Concept (題意 + algo + viz)
    ├── code.html               # PAGE 2 · Code + Complexity
    └── review.html             # PAGE 3 · Review (Q&A + worked trace)
```

**Canonical templates live at `topics/06-divide-conquer/problems/p507/` (and p114, p115, p501).** All four W06 problems share this layout — read p507's three files to mirror structure when scaffolding a new problem. **Every problem gets 3 pages**, with or without animation. Problems without a canvas just skip the `.sc-viz` block and put the algorithm walkthrough straight into a `.sc-dark-box` proof or `.sc-trace` example.

⚠️ **Legacy formats deprecated:** the old 5-page workshop-dark book (Problem / Concept / Viz / Code / Review with `problem.css`) and the single-page flat `.html` variant are both gone from W06. Do not scaffold new problems in either format unless the user explicitly asks.

## Single source of truth

`scripts/generate_chapters.py` holds:
- `CHAPTERS` — 13 contiguous weeks W01–W13. The original 算法班 had a 手寫-only W08 between DP 1 and DP 2; that week is collapsed away so the displayed numbering shifts: original W09 (DP 2) → W08, W10 (DP 3) → W09, W11 → W10, W12 → W11, W13 → W12, W14 → W13. Folder slugs were renamed to match.
- `PROBLEMS` — dict of `week → list of (slug, title-zh, category, status)`
- `CATEGORY_NAMES` / `CATEGORY_ORDER` — 上機作業 (main) / Bonus / 自由練習 (practice) / 手寫作業 (hand)

Run after editing:

```
python3 scripts/generate_chapters.py
```

It rewrites every `topics/<NN>-<slug>/index.html` chapter page and refreshes the `// CURRICULUM` sidebar on every problem subpage. **Never hand-edit chapter index pages** — they get clobbered on next run.

## Integration steps when the user pastes a problem

1. **Identify the chapter (week).** Look at `CHAPTERS` for the slug. Most problems map naturally; ask the user only if ambiguous.

2. **Add entry to `PROBLEMS[week]`:**
   ```python
   ('p<id>', '<title-zh>', '<category>', 'todo'),  # before content exists
   ('p<id>', '<title-zh>', '<category>', 'done'),  # once detail page exists
   ```
   - Slug `p<number>` (no leading zero).
   - Category one of: `main`, `bonus`, `practice`, `hand`.

3. **Scaffold the 5-page set** at `topics/<NN>-<slug>/problems/<pXXX>/`. Copy the template from `p114/` and replace per-problem content. Required path adjustments:
   - All CSS / asset links use `../../../../assets/...`
   - Crumb back to chapter index uses `../../index.html`
   - Sibling subpage links use bare `concept.html` / `viz.html` / etc.

4. **🔴 MANDATORY: compile & run the C++ on the sample I/O before pasting it into `code.html`.** This is not optional — a wrong solution in the notes is worse than no notes. Do it in a scratch dir, never commit the scratch files:
   ```bash
   mkdir -p /tmp/algo-check && cd /tmp/algo-check
   cat > sol.cpp <<'CPP'
   ... the exact code you intend to put on the page ...
   CPP
   g++ -O2 -std=c++17 sol.cpp -o sol && ./sol < sample.in
   # compare stdout against EVERY sample output line-for-line (incl. the largest N)
   ```
   - Run **every** sample case the problem gives (and the big stress one like `N=100000` when the statement lists its answer — that catches off-by-one / overflow / mod bugs).
   - If the page shows **two implementations** (e.g. a `_fg` / recurrence variant), compile-run **both**; they must agree.
   - If you can't reproduce the expected output, the code is wrong — **fix it before writing the page**, don't paste hopeful code.
   - **Never leave dead placeholder lines** like `if (!(cond && 1)) {}` or `// 見下方` stubs in submitted code — they compile but signal the logic was never actually run. (This rule exists because P126 shipped exactly such a stub.)
   - The page's `// OUTPUT` trace block and any per-step hand-trace must match what the verified binary actually prints.

5. **If the algorithm benefits from animation**, write `assets/js/viz/<slug>-<algo>.js`. Reference `assets/js/viz/p114-lboard.js` for the pattern:
   - White paper background `#ffffff`
   - Step-by-step state machine driven by Reset / Prev / Play / Next
   - Single canvas per page; canvas + control IDs are `viz-canvas`, `viz-reset`, `viz-prev`, `viz-play`, `viz-next`, `viz-step`, `viz-label` (read these via `getElementById`)
   - Live description text via `<div class="sc-viz__label" id="viz-label">`
   - Special / blocked / important cell distinguished from regular cells
   - If a page needs TWO animations (base case + general case, like P507), use prefixed IDs `viz-base` / `vb-*` and `viz-general` / `vg-*`

6. **🟠 MANDATORY: screenshot-verify the animation layout before flipping to done.** The user cares a lot that the canvas is *整齊好看、不被切到* (tidy, well-aligned, nothing clipped). Eyeballing the JS is not enough — you MUST render every animation step in headless Chrome and look at the image. Do it in the scratch dir:
   ```bash
   # 1. Make a copy of the viz that draws ALL steps stacked, or one frame per file.
   #    Wrap the IIFE so it exposes a (canvas, step) draw fn (see the P157 harness for the pattern).
   # 2. Build an HTML page that loads study-card-equivalent fonts + the viz, renders each step.
   # 3. Screenshot with the installed browser at a realistic canvas width AND a narrow one:
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-sandbox \
     --screenshot=/tmp/algo-check/render.png --window-size=980,5200 --virtual-time-budget=4000 \
     "file:///tmp/algo-check/render.html"
   # 4. Read the PNG and CHECK: no text/cells clipped at any edge, no two elements overlapping,
   #    no dead zone > ~80px, every step visibly changes something. Test ~920px AND ~720px widths.
   ```
   - The cheap text-bbox stub (counting `string.length`) is **unreliable for CJK** — it mis-measures multibyte widths and lies about overflow. Trust the actual rendered PNG, not the stub.
   - Also screenshot the real `index.html` once (the viz embedded with study-card.css) to confirm the script tag resolves and the canvas sits inside its section.
   - If anything is clipped/overlapping/has a big dead zone, **fix the JS geometry and re-render** before moving on. Repacking into clear horizontal bands (see `p157-incexc.js`) is the reliable fix.

7. **Flip status to `'done'`** in PROBLEMS, then `python3 scripts/generate_chapters.py`.

8. **Commit:**
   ```
   feat(W<NN>/P<XXX>): <title> — <one-line algorithm summary>
   ```

## Three sub-page contracts (default)

All three pages use `assets/css/study-card.css` and `<body class="study-card">`. Each page has:
- Top nav strip `.sc-topnav` (Home / W## / P###  ·  原題 link)
- Masthead `.sc-mast` (chip "學習卡 · STUDY CARD" + title + subtitle "// <page name>" + stars/meta row)
- Page indicator `.sc-pageind` (`PAGE N / 3 · <NAME>` with 3 dots, current is `is-active`)
- Rule divider `.sc-mast__rule`
- Numbered `<section class="sc-section">` blocks
- Pager `.sc-pager` (PREV / NEXT)
- Final `.sc-summary-bar` (ink-black bg, one-line summary)

### PAGE 1 · `index.html` — Concept

Sections (mirror p507/index.html ordering — adjust count to fit content, 6–8 typical):

1. **題目簡介** · `.sc-question` — coral left-border quote of the problem brief. Mono `QUESTION` label.
2. **為什麼用 X** · `.sc-ko` knockout layout — 2 eliminated options side-by-side (`--bad`, `--mid`) → mono arrow `BOTH FAIL · ADOPT` → winner card (`--good`). Verdicts: `× REJECT · TLE`, `△ REJECT · UNSTABLE`, `● ADOPT · STABLE` (mono uppercase, never emoji).
3. **核心策略 · 三步驟** · plain ordered list — keep it terse (3–5 lines max).
4. **動畫演示** · `.sc-viz` with `<canvas>` + Reset/Prev/Play/Next/step controls + `.sc-viz__label`. If two animations needed (base + general case), prefix IDs as noted above. Reference the existing JS at bottom of body.
5. **(optional) 關鍵步驟 / 證明** · `.sc-dark-box` titled `// LEMMA NAME` — multi-step proof or detailed mechanism, with ink-black square chips for numbered steps.
6. **複雜度** · brief paragraph + `.sc-formula` (paper bg, mono `FORMULA` corner label) showing the recurrence, then a 4-row `.sc-table` (Time / Space / Recursion Depth / Constant factor).
7. **一句洞察** · `.sc-insight` — one-line takeaway, paper bg + coral left border, mono `INSIGHT` label.

Pager: PREV disabled / NEXT → `code.html`.

### PAGE 2 · `code.html` — Code + Complexity

1. **完整實作** · `.sc-codewindow` (macOS chrome with red/yellow/green dots + `<filename>.cpp` tab + `C++17` lang label) containing a `<pre class="sc-code">` with **manual token spans** — `<span class="k">` keyword, `<span class="t">` type, `<span class="f">` function, `<span class="s">` string, `<span class="n">` number, `<span class="c">` comment, `<span class="p">` punctuation. **Never use Prism + `language-cpp` here** — token classes are pre-styled by `study-card.css`.
2. **複雜度分析** · table breaking down per-step cost → `.sc-formula` showing the recurrence → second `.sc-table` summarizing Time / Space / Recursion Depth / Constant factor.
3. **邊界與陷阱** · `.sc-table` of named pitfalls + their fix/explanation.
4. **細節走讀** · phase-by-phase walk using `.sc-trace` blocks. Each block starts with `<span class="sc-trace__head">// <PHASE>: <name></span>` then pseudocode/comments. `.sc-trace` is for non-C++ trace text (Chinese, arrows, pseudocode) — never add `language-cpp` to a trace block.

Pager: PREV → `index.html` / NEXT → `review.html`.

### PAGE 3 · `review.html` — Review

1. **重點回顧** · `.sc-table` of key insights — left column the concept name, right column the one-sentence point.
2. **觀念題** · 5 `.qa` blocks. Each has `<span class="qa__id">Q1</span>`, `<span class="qa__tag">topic</span>`, and a `<h4>` question. No answer here yet.
3. **範例 Trace** · small input (N=3..6) walked through the actual code, using sequential `.sc-trace` blocks (`// CALL 1`, `// CALL 2`, …). End with `// OUTPUT` block. Conclude with a `.sc-insight` observation.
4. **應用題** · 3 `.qa` blocks tagged `App 1..3` — practical/derived questions (max recursion depth, edge cases, related problems).
5. **`.answer-divider`** (the `// ANSWERS` band) then sequential `.qa.qa--answer` blocks providing full answers to all Q1..Q5 + App1..App3. Inside an answer, `.sc-trace` and `<ul>` are fair game.

Pager: PREV → `code.html` / NEXT → `../../index.html` ("↑ 回 W## 章節").

### Animation is universal

Every problem gets a `.sc-viz` block on PAGE 1, even ones without obvious geometry. If the algorithm is sequence construction (P501) or counting (P115), animate the recursive structure: split → recurse → combine. The JS lives at `assets/js/viz/<slug>-<algo>.js` and follows the step-state-machine pattern in `p114-lboard.js` / `p507-closest.js`.

### Animation rules (these were learned the hard way — follow them)

1. **Base case animation = the algorithm itself on its smallest non-trivial input.** *Never* show "暴力 O(N²) brute force on the full problem" as the "base case" animation. That conveys a *different algorithm*, which contradicts the lesson. P500's first attempt got this wrong (brute on N=5) and was rewritten to "D&C on N=3"; P507 is OK because n≤3 brute *is* the algorithm's own base case behavior. Rule of thumb: if Canvas A shows code the user wouldn't submit, you've drawn the wrong thing.

2. **Fill the canvas — no big dead zones.** Cell sizes are responsive (`Math.min((w − padX*2) / cols, maxCap)`), arrays span most of the canvas width, supplementary panels (maxL/minL tables, running totals, contribution chips) live in the lower half *inside the canvas* rather than below it. If you see vertical whitespace > 80px between content rows, repack.

3. **Don't cram either — center generously.** The previous brittle layouts had labels and cells colliding (the 「不要擋著彼此」 fix). Between any two text/graphics elements leave at least ~12px clear; use `textBaseline` + `textAlign` consistently. Mid markers (coral dashed lines), bracket annotations, and chips need their own band — don't stack them in the same Y range as the array cells.

4. **Show *what changes per step* — not just an end state.** Each animation step should change *something visible* on the canvas (a cell tint, a chip appearing, a count updating, an edge becoming coral). If two consecutive steps would render identical pixels, merge them or add an indicator. The user should be able to click Next and immediately see *what just happened*.

5. **Palette for animation canvases** (in addition to study-card palette):
   - Paper bg `#faf5e6` (matches the section)
   - Cell empty/normal `#ffffff` with ink border
   - Left/upper side tint: pale blue `#e3edf5` + stroke `#8fb3d4` for headers
   - Right/lower side tint: pale tan `#f6ead8` + stroke `#d4a868`
   - Active / mid / "the answer" → coral `#d96e4e`
   - "Good"/"accepted" → pale green `#d9e8c7` + stroke `#5fa866`
   - "Bad"/"rejected" → pale pink `#f0d4d4`
   - Inactive/excluded → light gray `#cfcfcf`
   These are intentionally muted so the coral accents pop. **Don't introduce new tints** without a reason.

6. **Screenshot-verify, don't eyeball.** Layout bugs (clipped text at a canvas edge, two labels overlapping, a band that runs off the bottom, a huge dead zone) are invisible when reading the JS but obvious in a rendered PNG. Before calling an animation done, render every step in headless Chrome at both a wide (~920px) and a narrow (~720px) canvas width and *look at the image* — the user has repeatedly flagged 排版被切到 / 不整齊. The `string.length`-based bbox stub does NOT work for CJK text; only the real screenshot is trustworthy. The reliable layout that survives this check is **clear horizontal bands** with a title row each, generous gaps, and `textAlign`/`textBaseline` set consistently (see `p157-incexc.js`). This is Integration step 6 — it is mandatory, not optional.

## Required `<head>` includes per page (study-card variant)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" />

<link rel="stylesheet" href="../../../../assets/css/study-card.css" />
```

That's it — `<body class="study-card">` and you're done. **Do NOT load** `tokens.css`, `base.css`, `components.css`, `problem.css`, `prism-workshop.css`, or any Prism script. Code highlighting is via manual `<span class="k/t/f/s/n/c/p">` token spans, pre-styled by `study-card.css`.

Animation pages add at the bottom of `<body>`:

```html
<script src="../../../../assets/js/viz/<slug>-<algo>.js"></script>
```

## C++ code conventions (from user's preferences)

- **Plain C arrays only.** Do not use `std::array<T, N>`, `struct Cell { int x, y; }`, or any STL container that obscures the cell layout. Use parallel `int` arrays: `int cx[4]`, `int cy[4]`, `int lx[3]`, `int ly[3]`, `int ox[4]`, `int oy[4]`.
- **Descriptive variable names** rather than mathematical short forms:
  - `top` / `left` instead of `r` / `c` for sub-board origin
  - `midX` / `midY` instead of `mr` / `mc` for the divider row/column
  - `blockedX` / `blockedY` for the special cell
  - `bq` for the blocked quadrant index (0..3)
- Always begin `solve()` with:
  ```cpp
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  ```
  Even on interactive problems where it's not strictly needed — user prefers it as a habit.

## Visual design (workshop-industrial)

Tokens in `assets/css/tokens.css`. Key:
- `--rust` `#c1440e`, `--rust-bright` `#e85d1f` — primary accent
- `--warning` `#d4a017` — yellow accent
- `--bg` `#1a1a1a`, `--ink` `#e8e6e1` — page bg + body text
- `--font-display` Oswald (UPPERCASE headings), `--font-mono` JetBrains Mono, body Noto Sans TC

Decorations: 4 fixed corner rivets, top scrolling marquee strip, yellow/black hazard stripe under the workshop header, barcode at footer.

## Study-card variant (single-page or 3-page condensed)

`assets/css/study-card.css` powers the cream/coral "study card" track (P501 single-page; P507 3-page concept/code/review). Used when the 5-page book structure is overkill.

### Industrial-mono palette discipline (the most important rule)

After several pastel iterations the user landed on a restrained industrial-mono look. **The palette is exactly three layers:**

1. **Paper** — `var(--sc-paper)` `#faf5e6` — every block's background
2. **Ink** — `var(--sc-ink)` — body text, 1px hairline borders, section numbers' shadow
3. **Coral** — `var(--sc-coral)` — *one accent per block*, used only on:
   - Section number chips (`.sc-section__num` — the structural spine)
   - One left-border or top-border accent per callout
   - The "winner" in a knockout/comparison
   - `strong` inside `.sc-formula__main`, `.sc-formula__hint`, `.sc-insight`, `.sc-question`
   - Hard `box-shadow` on the final summary bar

**No other colors.** Specifically forbidden in this variant:
- Pink/yellow/green pastel backgrounds (e.g. `#fde6ec`, `#fff4cf`, `#e3f0d8`) — drop them; uniform paper bg instead
- Emoji in verdicts (`❌` `⚠️` `✓`) — use mono symbols `×` `△` `●` with uppercase `REJECT` / `ADOPT`
- Wobble SVG filter `filter: url(#sn-wobble)` — was a sketchnote experiment, dropped
- Decorative pseudo-elements like `'∑'` medallion, `'』'` quote mark, `'✦'` bullet — drop
- Rounded `border-radius: 10px+` — use `2px` (industrial chip corners)
- Coral bullets/circles for numbered lists — use ink-black square chips (`background: var(--sc-ink)`)

### Knockout layout — comparing options where one wins

Use `.sc-ko` when the narrative is *"considered N options, rejected most, adopted one"*. Pattern (eliminated options grayscaled side-by-side on top, arrow, winner card below with coral border + ink hard shadow):

```html
<div class="sc-ko">
  <div class="sc-ko__row">
    <div class="sc-ko-card sc-ko-card--bad">
      <div class="sc-ko-card__head">
        <span class="sc-ko-card__badge">A</span>
        <span class="sc-ko-card__title">暴力</span>
        <span class="sc-ko-card__o">O(N²)</span>
      </div>
      <div class="sc-ko-card__body">N = 2×10⁵ ⇒ ~2×10¹⁰ 次運算</div>
      <div class="sc-ko-card__verdict">× REJECT · TLE</div>
    </div>
    <div class="sc-ko-card sc-ko-card--mid">
      <!-- 同結構，verdict 用 △ REJECT · UNSTABLE -->
    </div>
  </div>

  <div class="sc-ko__arrow">BOTH FAIL · ADOPT</div>

  <div class="sc-ko-card sc-ko-card--good">
    <!-- 同結構，verdict 用 ● ADOPT · STABLE -->
  </div>
</div>
```

Variant modifiers:
- `--bad` / `--mid` → grayscale + opacity 0.62 + strikethrough on title (visually "eliminated")
- `--good` → coral border, hard ink shadow, larger padding, coral badge

Use `.sc-points` (3-up uniform grid) instead when the items are *parallel* (e.g. "3 cases of a proof") rather than competing.

### Reusable industrial-mono components

| Component | When to use | Visual signature |
|---|---|---|
| `.sc-section` | Numbered top-level section | Paper bg, 1px ink border, coral `.sc-section__num` chip in head |
| `.sc-question` | Quote the problem statement verbatim | Paper bg, 3px coral left border, mono `QUESTION` chip |
| `.sc-dark-box` | Multi-step proof / lemma (e.g. PIGEONHOLE) | Paper bg, 1px ink border, mono title `// LEMMA NAME`, numbered ink-black square chips for steps |
| `.sc-formula` | Centered recurrence / closed-form | Paper bg, 1px ink border, mono `FORMULA` label cut into top-left of border |
| `.sc-insight` | One-line takeaway you want highlighted | Paper bg, 3px coral left border, mono `INSIGHT` label |
| `.sc-summary-bar` | Final one-line page summary | **Ink-black bg with coral hard shadow** — the one "dark" block per page |
| `.sc-table` | Structured comparison | Paper bg, mono uppercase th, coral underline below header |
| `.sc-case` | Inline lemma case ("Case ①") | Cream bg, 3px coral left border |

Verdict / label text in this variant is **always** uppercase mono with `letter-spacing: 0.1em+`. Never handwriting (`Caveat`) or italic serif.

## Common pitfalls (memorize these)

1. **Trace blocks must not have `language-cpp` class.** Trace text has Chinese + `→` arrows; adding the class makes Prism slap a `// CODE` badge in the top-right corner.
2. **Don't include a "Variants / 延伸題" section.** User removed it; no section 06.
3. **Animations are white-bg with solid-color fills**, not dark with outlined cells. Reference `p114-lboard.js`.
4. **Code blocks use `.code-block--editor`** for the macOS-window dark VS Code chrome. Light-theme overrides under `.code-block--editor .token.*` should NOT exist — `prism-workshop.css` already provides VS Code Dark+ tokens.
5. **Use `prism.min.js`** (full bundle with autoloader), not `prism-core.min.js`.
6. **Re-run the generator** after any change to `PROBLEMS` or `CHAPTERS`. Sidebars desync silently otherwise.
7. **Study-card variant: no pastel-per-position fills.** Cards in a row must share the paper bg `#faf5e6`; the *winner* gets coral border + ink hard shadow. Pink/yellow/green fills (`#fde6ec` / `#fff4cf` / `#e3f0d8`) and emoji verdicts (`❌` `⚠️` `✓`) were explicitly rejected — use mono uppercase `× REJECT` / `△ REJECT` / `● ADOPT` and ink-black square chips for badges.
8. **No wobble filter** in the study-card variant. `filter: url(#sn-wobble)` and decorative pseudo-elements (`'∑'`, `'』'`, `'✦'`) belong to the abandoned sketchnote experiment — don't reintroduce them.
9. **Never ship unverified C++.** The code on `code.html` must have been compiled and run against every sample (see Integration step 4). No dead `if (!(cond && 1)) {}` placeholders, no "probably correct" code. If the page's `// OUTPUT` trace or hand-trace disagrees with the verified binary, the page is wrong.
10. **SVG `<text>` cannot contain `<strong>`/HTML tags** — use `<tspan font-weight="700">`. An HTML tag inside SVG severs the SVG at that point (the rest leaks out as plain text and half the figure vanishes). This bit P124's STEP 1 figure. Screenshot-check figures, don't just tag-balance them.
11. **Animation layout MUST be screenshot-verified (整齊、不被切到).** Render every canvas step in headless Chrome and read the PNG at ~920px and ~720px widths before marking the problem done — see Integration step 6. The CJK-unaware `string.length` bbox stub gives false overflow reports; trust the rendered image. Clear horizontal bands (à la `p157-incexc.js`) are the layout that reliably passes. The user has flagged clipped/cramped animations more than once — this check is not skippable.

## Git workflow

After integrating a problem:

```bash
python3 scripts/generate_chapters.py
git add -A
git commit -m "feat(W<NN>/P<XXX>): <title> — <one-line summary>"
```

Commit message style: see `git log --oneline` for tone. Use scope prefixes: `feat(W##/P###)`, `fix(...)`, `style(...)`, `chore(...)`, `refactor(...)`. Don't push without explicit user request.

## When the user simply pastes problem text

Treat that as: "integrate this into my notes site." Follow the integration steps above without further prompting unless the chapter is ambiguous.
