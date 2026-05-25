#!/usr/bin/env python3
"""
generate_chapters.py
====================
Single source of truth for the chapter list.
Run from repo root:  python3 scripts/generate_chapters.py

Generates:
  - topics/<slug>/index.html      (one per chapter)
  - Refreshes the sidebar in index.html and any existing problem pages
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent

# (week, slug, title-en, subtitle-zh, problem-count)
CHAPTERS = [
    ('01', '01-data-structure',     'Data Structure',       '陣列、字串、堆疊、佇列、鏈表等基礎容器',          7),
    ('02', '02-complexity-tree',    'Complexity · Tree',    '複雜度分析、樹的基本結構與走訪',                  5),
    ('03', '03-graph-heap-flood',   'Graph · Heap',         'Flood Fill、Heap、基本圖論',                      6),
    ('04', '04-enum-search',        'Enumeration · Search', '枚舉策略、回溯、剪枝',                            6),
    ('05', '05-greedy',             'Greedy',               '貪心策略與正確性論證',                            5),
    ('06', '06-divide-conquer',     'Divide & Conquer',     '分治、倍增、主定理',                              6),
    ('07', '07-dp1',                'DP 1',                 'DP 入門、狀態設計、最佳化',                       6),
    ('09', '09-dp2',                'DP 2',                 '區間 DP、樹 DP',                                  4),
    ('10', '10-dp3',                'DP 3',                 '狀態壓縮、位元 DP、進階技巧',                     7),
    ('11', '11-mst-shortest',       'MST · Shortest',       '拓樸排序、最小生成樹、最短路徑',                  7),
    ('12', '12-string-trie-kmp',    'Trie · KMP',           '字串匹配、Trie、KMP',                            4),
    ('13', '13-geometry-math-game', 'Geom · Math · Game',   '計算幾何、數論、賽局理論',                       10),
    ('14', '14-connect-segtree',    'Connect · Segtree',    '連通性、線段樹',                                 11),
]

# Problems already drafted per chapter — keep these listed; new ones get appended.
# Map: week -> list of (problem_id, slug, title, status)
DRAFTED = {
    '01': [('p18', 'p18', 'Maximum Subarray Sum', 'demo')],
}


# ============================================================
#  HTML fragments
# ============================================================
def sidebar_html(active_week, base):
    """Render the curriculum sidebar nav. base is path back to root, eg '../../' """
    items = []
    for w, slug, title, _, count in CHAPTERS:
        cls = ' class="is-active"' if w == active_week else ''
        items.append(
            f'          <li><a href="{base}topics/{slug}/index.html"{cls}>'
            f'W{w} · {title} <span class="tag">{count:02d}</span></a></li>'
        )
    items_html = '\n'.join(items)
    return f'''      <div class="nav-label">// CURRICULUM</div>
      <nav>
        <ul>
{items_html}
        </ul>
      </nav>

      <div class="nav-label">// PAGES</div>
      <nav>
        <ul>
          <li><a href="{base}index.html">Home</a></li>
          <li><a href="{base}about.html">About</a></li>
        </ul>
      </nav>'''


def problems_list_html(week):
    """Render the problems list for a chapter. Empty placeholder if not yet drafted."""
    drafted = DRAFTED.get(week, [])
    if not drafted:
        return '\n          <li><em style="color:var(--concrete)">—— 待新增題目 ——</em></li>'
    rows = []
    for pid, slug, title, status in drafted:
        tag = ''
        if status == 'demo':
            tag = ' <span class="chip chip--warning" style="margin-left:8px;font-size:9px;">DEMO</span>'
        elif status == 'done':
            tag = ' <span class="chip chip--steel" style="margin-left:8px;font-size:9px;">DONE</span>'
        rows.append(
            f'          <li><a href="problems/{slug}.html">{pid.upper()} · {title}</a>{tag}</li>'
        )
    return '\n' + '\n'.join(rows)


def chapter_page(week, slug, title, subtitle, count):
    base = '../../'
    sidebar = sidebar_html(week, base)
    problems = problems_list_html(week)

    return f'''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>W{week} // {title.upper()} // ALGO WORKSHOP</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" />

  <link rel="stylesheet" href="{base}assets/css/tokens.css" />
  <link rel="stylesheet" href="{base}assets/css/base.css" />
  <link rel="stylesheet" href="{base}assets/css/components.css" />
  <link rel="stylesheet" href="{base}assets/css/problem.css" />
</head>
<body>

  <div class="rivet tl"></div>
  <div class="rivet tr"></div>
  <div class="rivet bl"></div>
  <div class="rivet br"></div>

  <div class="top-strip">
    <div class="marquee">
      <span>※ ALGO WORKSHOP ※</span>
      <span>W{week} · {title.upper()}</span>
      <span>{subtitle}</span>
      <span>⚙ NOTES IN PROGRESS</span>
      <span>※ ALGO WORKSHOP ※</span>
      <span>W{week} · {title.upper()}</span>
      <span>{subtitle}</span>
      <span>⚙ NOTES IN PROGRESS</span>
    </div>
  </div>

  <header class="workshop-header">
    <div class="meta-row">
      <span><span class="dot"></span>CHAPTER {week}</span>
      <span>WEEK {week}</span>
      <span>{count:02d} PROBLEMS</span>
    </div>
    <h1 class="workshop-title">{title}.</h1>
    <p class="workshop-subtitle">
      {subtitle}
    </p>
  </header>

  <div class="shell">

    <aside class="sidebar">
{sidebar}
    </aside>

    <main class="content">

      <div class="crumb">
        <a href="{base}index.html">Home</a>
        <span class="crumb__sep">/</span>
        <span>W{week} · {title}</span>
      </div>

      <!-- ============================================================
           CHAPTER OUTLINE (TOC for this chapter)
           ============================================================ -->
      <article>
        <span class="stamp">▼ CHAPTER OUTLINE</span>
        <h2>本章節大綱</h2>
        <div class="article-meta">
          <span>W{week}</span>
          <span>{count:02d} PROBLEMS</span>
        </div>

        <ul class="notes-list">
          <li><a href="#sec-concept">{week}.1 · 核心概念</a></li>
          <li><a href="#sec-problems">{week}.2 · 題目列表</a></li>
          <li><a href="#sec-notes">{week}.3 · 筆記與補充</a></li>
        </ul>
      </article>

      <!-- ============================================================
           SECTION 1 — 核心概念
           ============================================================ -->
      <article id="sec-concept">
        <span class="stamp">▼ {week}.1</span>
        <h2>核心概念</h2>
        <div class="article-meta">
          <span>OVERVIEW</span>
        </div>
        <p>—— 待補 ——</p>
      </article>

      <!-- ============================================================
           SECTION 2 — 題目列表
           ============================================================ -->
      <article id="sec-problems">
        <span class="stamp">▼ {week}.2</span>
        <h2>題目列表</h2>
        <div class="article-meta">
          <span>PROBLEMS</span>
        </div>
        <ul class="notes-list">{problems}
        </ul>
      </article>

      <!-- ============================================================
           SECTION 3 — 筆記與補充
           ============================================================ -->
      <article id="sec-notes">
        <span class="stamp">▼ {week}.3</span>
        <h2>筆記與補充</h2>
        <div class="article-meta">
          <span>NOTES</span>
        </div>
        <p>—— 待補 ——</p>
      </article>

    </main>

  </div>

  <footer class="workshop-footer">
    <div>© 2026 // W{week} · {title.upper()}</div>
    <div><a href="{base}index.html">← BACK TO INDEX</a></div>
    <div>SERIAL_NO. AW-W{week}-2026</div>
  </footer>

</body>
</html>
'''


# ============================================================
#  Top-level page sidebars (home / about / problem)
# ============================================================
def replace_sidebar(filepath, new_sidebar_inner):
    """Replace contents of <aside class="sidebar">...</aside> with new_sidebar_inner."""
    p = Path(filepath)
    if not p.exists():
        return False
    txt = p.read_text(encoding='utf-8')
    pattern = re.compile(
        r'(<aside class="sidebar">)(.*?)(</aside>)',
        re.DOTALL
    )
    new_txt, n = pattern.subn(
        lambda m: m.group(1) + '\n' + new_sidebar_inner + '\n    ' + m.group(3),
        txt,
        count=1,
    )
    if n == 0:
        return False
    p.write_text(new_txt, encoding='utf-8')
    return True


# ============================================================
#  Main
# ============================================================
def main():
    # 1. Write all chapter index pages
    for w, slug, title, subtitle, count in CHAPTERS:
        d = ROOT / 'topics' / slug
        d.mkdir(parents=True, exist_ok=True)
        html = chapter_page(w, slug, title, subtitle, count)
        (d / 'index.html').write_text(html, encoding='utf-8')
        print(f'wrote topics/{slug}/index.html')

    # 2. Refresh the home page sidebar (no chapter active)
    home_sidebar = sidebar_html(active_week=None, base='')
    if replace_sidebar(ROOT / 'index.html', home_sidebar):
        print('refreshed index.html sidebar')

    # 3. Refresh problem page sidebars (CURRICULUM + PAGES portion only;
    #    keep the // ON THIS PAGE TOC intact above it).
    for problem_html in (ROOT / 'topics').rglob('problems/*.html'):
        txt = problem_html.read_text(encoding='utf-8')
        # determine active week from path
        week = None
        for w, slug, *_ in CHAPTERS:
            if slug in str(problem_html):
                week = w
                break
        sidebar = sidebar_html(active_week=week, base='../../../')
        # Replace the // CURRICULUM ... </aside> block
        pat = re.compile(
            r'<div class="nav-label">// CURRICULUM</div>.*?</aside>',
            re.DOTALL
        )
        replacement = sidebar.lstrip() + '\n    </aside>'
        new_txt, n = pat.subn(replacement, txt, count=1)
        if n:
            problem_html.write_text(new_txt, encoding='utf-8')
            print(f'refreshed {problem_html.relative_to(ROOT)} sidebar')


if __name__ == '__main__':
    main()
