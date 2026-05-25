---
name: algo-notes
description: Use this skill when the user pastes an algorithm problem (from 資訊之芽算法班) into the AlgoToG repo and wants it integrated into their personal study-notes site. Each problem becomes a 5-page "book chapter" set (Problem / Concept / Visualization / Code / Review) with workshop-industrial styling, VS Code Dark+ syntax highlighting, and step-by-step canvas animations. The skill handles file scaffolding, sidebar sync via scripts/generate_chapters.py, and git commits.
---

# algo-notes — 資訊之芽算法班 study notes workflow

## Site layout

Static HTML notebook at the AlgoToG repo root. Each chapter (week) and each problem is a multi-page book structure:

```
topics/<NN>-<slug>/
├── index.html                  # chapter overview + outline
└── problems/<pXXX>/
    ├── index.html              # 01 Problem (題意 + I/O + sample)
    ├── concept.html            # 02 Concept (algo + math + complexity)
    ├── viz.html                # 03 Visualization (canvas animation)
    ├── code.html               # 04 Clean Code + Walkthrough
    └── review.html             # 05 Review (Q&A + worked examples)
```

The reference template lives at `topics/06-divide-conquer/problems/p114/`. **Always start by reading those 5 files** to mirror the structure exactly when scaffolding a new problem.

## Single source of truth

`scripts/generate_chapters.py` holds:
- `CHAPTERS` — 13 weeks (W08 is intentionally skipped — that was the手寫-only week)
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

4. **If the algorithm benefits from animation**, write `assets/js/viz/<slug>-<algo>.js`. Reference `assets/js/viz/p114-lboard.js` for the pattern:
   - White paper background `#ffffff`
   - Step-by-step state machine driven by Reset / Prev / Play / Next
   - Solid color fill per discrete piece + thick black L-style outlines if pieces are L-trominoes
   - Live description text via `<div class="viz__label" id="viz-label">`
   - Special / blocked / important cell distinguished from regular cells

5. **Flip status to `'done'`** in PROBLEMS, then `python3 scripts/generate_chapters.py`.

6. **Commit:**
   ```
   feat(W<NN>/P<XXX>): <title> — <one-line algorithm summary>
   ```

## Five sub-page contracts

### 01 `index.html` — Problem

- Workshop header `<h1>Problem.</h1>` + subtitle one-liner.
- Tag chips row: algorithm family, data structure, complexity, special flags (e.g. Interactive).
- `<h2 class="section__title">題意拆解</h2>` then narrative paragraphs.
- `<h3>輸入 / 輸出</h3>` — describe the I/O contract.
- For interactive problems, include a `.code-block` showing the lib header signatures.
- `<h3>限制</h3>` + `<ul class="constraint-list">` (uses ▸ bullet).
- `<h3>範例</h3>` + `<div class="io-pair">` (two `.io-box`: `// INPUT` + `// OUTPUT`, or `// JUDGE` + `// YOUR REPORTS` for interactive).
- `<blockquote>` summary pointing to the next section.
- Pager: PREV disabled / NEXT → Concept.

### 02 `concept.html` — Concept

- Header `<h1>Concept.</h1>` + complexity subtitle.
- `<h3>觀察一 · ...</h3>` style numbered observations.
- `<div class="math-block">` for centered formulas, e.g. `T(N) = 4·T(N/2) + O(1) ⇒ Θ(N²)`.
- Complexity badges: `<span class="complexity"><span class="complexity__label">Time</span> O(...)</span>`.
- `.callout` / `.callout--warn` for key insights, pitfalls.
- Pager: ← Problem / → Visualization.

### 03 `viz.html` — Visualization

- Header `<h1>Viz.</h1>`.
- If algorithm has a base case worth diagramming: include a "Base Case · ..." subsection FIRST with inline SVGs (one per case — see `viz.html`'s `.base-case-row` with 4 SVGs for n=2 L-tromino) and a `.callout` explaining why the base case always works.
- Main animation: `<div class="viz viz--lg">` with `<canvas id="viz-canvas">` + `.viz__controls` (Reset / Prev / Play / Next / step counter) + `<div class="viz__label" id="viz-label">` for the live description.
- Recursion-order table after the animation if helpful.
- Pager: ← Concept / → Code.

### 04 `code.html` — Clean Code + Walkthrough

- Header `<h1>Code.</h1>`.
- Main code in macOS-window dark chrome:
  ```html
  <div class="code-block code-block--editor">
    <div class="code-block__head">
      <span class="code-block__window">
        <span class="code-block__dot code-block__dot--red"></span>
        <span class="code-block__dot code-block__dot--yellow"></span>
        <span class="code-block__dot code-block__dot--green"></span>
        <span class="code-block__tab">p<NNN>.cpp</span>
      </span>
      <span class="code-block__lang">C++17</span>
    </div>
    <pre><code class="language-cpp">...</code></pre>
  </div>
  ```
- `<h2 class="section__title">逐段走讀</h2>`.
- `<div class="code-annotated">` with `.code-annotated__line` rows, each row = left `.code-annotated__code` (containing `<pre><code class="language-cpp">...</code></pre>`) + right `.code-annotated__note` (explanation).
- `.callout.callout--warn` "// Common Pitfalls" at the end.
- Pager: ← Viz / → Review.

### 05 `review.html` — Review

- Header `<h1>Review.</h1>`.
- `<section class="section">` blocks numbered 5.1 / 5.2 / 5.3 / 5.4:
  1. **Concept Recap** — summary table of key insights.
  2. **Concept Questions** — Q1..Q5 with `<div class="qa">` + `.qa__id` + `.qa__tag` + `<h4>`.
  3. **Worked Examples** — Ex 1..N (base case → full trace → tricky inputs).
  4. **Quick Calculations** — App 1..N (count formulas, depth, etc.).
- `.answer-divider` (the dashed yellow separator) between Q and A.
- Answer blocks: `<div class="qa qa--answer">` (yellow accent).
- Worked-example traces use `<pre class="trace-block">` — cream-yellow paper, monospace. **DO NOT add `language-cpp` to trace-block** — trace content has Chinese / arrows / non-C++ syntax; adding the class triggers Prism's `// CODE` badge.
- Pager: ← Code / → Back to W## chapter index.

## Required `<head>` includes per page

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" />

<link rel="stylesheet" href="../../../../assets/css/tokens.css" />
<link rel="stylesheet" href="../../../../assets/css/base.css" />
<link rel="stylesheet" href="../../../../assets/css/components.css" />
<link rel="stylesheet" href="../../../../assets/css/problem.css" />
```

Code-bearing pages also add:

```html
<link rel="stylesheet" href="../../../../assets/css/prism-workshop.css" />
```

…and at the bottom of `<body>`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js"></script>
<script>document.addEventListener('DOMContentLoaded', () => { if (window.Prism) Prism.highlightAll(); });</script>
```

⚠️ Use `prism.min.js`, **not** `prism-core.min.js`. Core has no auto-highlight; code blocks will appear plain monospace if you load the wrong one.

## Sidebar contract per subpage

```html
<aside class="sidebar">
  <div class="nav-label">// P<XXX> SECTIONS</div>
  <nav><ul>
    <li><a href="index.html" [class="is-active"]>01 · Problem</a></li>
    <li><a href="concept.html" [class="is-active"]>02 · Concept</a></li>
    <li><a href="viz.html"     [class="is-active"]>03 · Visualization</a></li>
    <li><a href="code.html"    [class="is-active"]>04 · Code</a></li>
    <li><a href="review.html"  [class="is-active"]>05 · Review</a></li>
  </ul></nav>

  <div class="nav-label">// CURRICULUM</div>
  <nav><ul>
    <!-- 13 chapter links — let scripts/generate_chapters.py refresh these -->
  </ul></nav>

  <div class="nav-label">// PAGES</div>
  <nav><ul>
    <li><a href="../../../../index.html">Home</a></li>
    <li><a href="../../../../about.html">About</a></li>
  </ul></nav>
</aside>
```

Only one `is-active` per nav block. The // CURRICULUM block is auto-managed by the generator — write any placeholder and the generator rewrites it.

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

## Common pitfalls (memorize these)

1. **Trace blocks must not have `language-cpp` class.** Trace text has Chinese + `→` arrows; adding the class makes Prism slap a `// CODE` badge in the top-right corner.
2. **Don't include a "Variants / 延伸題" section.** User removed it; no section 06.
3. **Animations are white-bg with solid-color fills**, not dark with outlined cells. Reference `p114-lboard.js`.
4. **Code blocks use `.code-block--editor`** for the macOS-window dark VS Code chrome. Light-theme overrides under `.code-block--editor .token.*` should NOT exist — `prism-workshop.css` already provides VS Code Dark+ tokens.
5. **Use `prism.min.js`** (full bundle with autoloader), not `prism-core.min.js`.
6. **Re-run the generator** after any change to `PROBLEMS` or `CHAPTERS`. Sidebars desync silently otherwise.

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
