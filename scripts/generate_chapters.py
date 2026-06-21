#!/usr/bin/env python3
"""
generate_chapters.py
====================
Single source of truth for the chapter list and per-chapter problem set.

Run from repo root:
    python3 scripts/generate_chapters.py

Generates:
  - topics/<slug>/index.html      (one per chapter)
  - Refreshes the sidebar in index.html and any existing problem pages

To add a problem to a chapter:
  1. Add an entry to PROBLEMS[week]
  2. Re-run this script
  3. Create the actual problem detail page at topics/<slug>/problems/<pid>.html

Status values:
  - 'todo'  → grayed out, no link (placeholder)
  - 'done'  → normal link
  - 'demo'  → linked + DEMO badge
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

# ============================================================
#  Chapter list (single source of truth)
# ============================================================
# (week, slug, title-en, subtitle-zh, total-problem-count)
CHAPTERS = [
    ('01', '01-data-structure',     'Data Structure',       '陣列、字串、堆疊、佇列、鏈表等基礎容器',          7),
    ('02', '02-complexity-tree',    'Complexity · Tree',    '複雜度分析、樹的基本結構與走訪',                  5),
    ('03', '03-graph-heap-flood',   'Graph · Heap',         'Flood Fill、Heap、基本圖論',                      6),
    ('04', '04-enum-search',        'Enumeration · Search', '枚舉策略、回溯、剪枝',                            6),
    ('05', '05-greedy',             'Greedy',               '貪心策略與正確性論證',                            5),
    ('06', '06-divide-conquer',     'Divide & Conquer',     '分治、倍增、主定理',                              7),
    ('07', '07-dp1',                'DP 1',                 'DP 入門、狀態設計、最佳化',                       6),
    ('08', '08-dp2',                'DP 2',                 '區間 DP、樹 DP',                                  5),
    ('09', '09-dp3',                'DP 3',                 '狀態壓縮、位元 DP、進階技巧',                    10),
    ('10', '10-mst-shortest',       'MST · Shortest',       '拓樸排序、最小生成樹、最短路徑',                 10),
    ('11', '11-string-trie-kmp',    'Trie · KMP',           '字串匹配、Trie、KMP',                            4),
    ('12', '12-geometry-math-game', 'Geom · Math · Game',   '計算幾何、數論、賽局理論',                       10),
    ('13', '13-connect-segtree',    'Connect · Segtree',    '連通性、線段樹',                                 11),
]

# ============================================================
#  Per-chapter problem set
# ============================================================
# Map: week -> list of (problem_slug, title-zh, category, status)
# Categories: 'main' (上機作業), 'bonus', 'practice' (自由練習), 'hand' (手寫)
PROBLEMS = {
    '01': [
        ('p18', 'Maximum Subarray Sum', 'main', 'demo'),
    ],
    '03': [
        ('p41',  '庭院裡的水池',          'main',  'done'),
        ('p43',  '喵喵抓老鼠',            'main',  'done'),
        ('p57',  'heap 練習',             'main',  'done'),
        ('p604', '哪裡有卦，哪裡就有源',  'main',  'done'),
        ('p45',  '染色遊戲',              'bonus', 'todo'),
        ('p364', 'Game',                  'bonus', 'todo'),
    ],
    '06': [
        ('p114', '王老先生',       'main',     'done'),
        ('p115', '逆序數對',       'main',     'done'),
        ('p501', '好的序列',       'main',     'done'),
        ('p507', '最近點對',       'main',     'done'),
        ('p116', '太陽軍團',       'bonus',    'done'),
        ('p117', '糟糕陣列',       'bonus',    'done'),
        ('p500', '好的連續子序列', 'practice', 'done'),
    ],
    '07': [
        ('p124', '円円數磁磚',                      'main',  'done'),
        ('p126', '円円送禮物',                      'main',  'done'),
        ('p127', '取數字1',                         'main',  'done'),
        ('p128', '取數字2',                         'main',  'done'),
        ('p129', '合成円円',                        'main',  'done'),
        ('p157', '分送高棕櫚',                      'bonus', 'done'),
        ('p326', '實實打怪獸',                      'bonus', 'done'),
    ],
    '08': [
        ('p143', '高棕櫚農場',                      'main',  'done'),
        ('p144', '高棕櫚農場2',                     'main',  'done'),
        ('p369', '玩電梯',                          'main',  'done'),
        ('p373', '取名字好困難QQ',                  'main',  'done'),
        ('p122', '邪惡收集大作戰',                  'bonus', 'done'),
    ],
    '09': [
        ('p499', '芽芽與圖',                        'main',     'todo'),
        ('p171', '高棕櫚觀光農場',                  'main',     'todo'),
        ('p172', '円円賣漢堡',                      'main',     'todo'),
        ('p145', '硬幣問題',                        'main',     'todo'),
        ('p233', '憤怒的小鳥',                      'bonus',    'todo'),
        ('p169', '烏龜疊疊樂---易',                 'bonus',    'todo'),
        ('p375', '上海自來水來自海上',              'practice', 'todo'),
        ('p234', '憤怒的小鳥 - Extra',             'practice', 'todo'),
        ('p374', '島嶼',                            'practice', 'todo'),
        ('p170', '烏龜疊疊樂',                      'practice', 'todo'),
    ],
    '10': [
        ('p151', '陣線推進',                        'main',     'done'),
        ('p348', '可魚果運輸問題',                  'main',     'done'),
        ('p378', '江神與他的小火車',                'main',     'done'),
        ('p472', '最小生成樹',                      'main',     'done'),
        ('p351', '慘字道路規劃',                    'bonus',    'done'),
        ('p473', '道路工程',                        'bonus',    'done'),
        ('p474', '石油',                            'bonus',    'todo'),
        ('p150', '關鍵邏輯閘',                      'practice', 'todo'),
        ('p352', '次短距離',                        'practice', 'todo'),
        ('p370', '邪教的咒語',                      'practice', 'todo'),
    ],
}

CATEGORY_NAMES = {
    'main':     '上機作業',
    'bonus':    'Bonus',
    'practice': '自由練習',
    'hand':     '手寫作業',
}
CATEGORY_ORDER = ['main', 'bonus', 'practice', 'hand']

# TIOJ contest id per week (the "原題 ↗" links). Different weeks live in
# different sprout contests. Falls back to DEFAULT_CONTEST when unmapped.
WEEK_CONTEST = {
    '03': 11,
    '06': 20,
    '07': 24,
    '08': 26,
    '09': 28,
    '10': 30,
}
DEFAULT_CONTEST = 20


# ============================================================
#  Sidebar
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


# ============================================================
#  Problem rendering helpers
# ============================================================
def resolve_problem_link(week_slug, prob_slug):
    """Pick the right URL for a problem detail page.

    Multi-page layout (preferred):  problems/<slug>/index.html
    Single-page legacy:              problems/<slug>.html
    Falls back to multi-page form for not-yet-created entries.
    """
    chap_dir = ROOT / 'topics' / week_slug
    multi = chap_dir / 'problems' / prob_slug / 'index.html'
    single = chap_dir / 'problems' / f'{prob_slug}.html'
    if multi.exists():
        return f'problems/{prob_slug}/index.html'
    if single.exists():
        return f'problems/{prob_slug}.html'
    return f'problems/{prob_slug}/index.html'


def tioj_url(slug, week=None):
    """Build TIOJ source URL from a problem slug like 'p114' → .../problems/114/.

    The contest id is chosen per week via WEEK_CONTEST (falls back to
    DEFAULT_CONTEST), because each week maps to a different sprout contest.
    """
    digits = ''.join(ch for ch in slug if ch.isdigit())
    contest = WEEK_CONTEST.get(week, DEFAULT_CONTEST)
    return f'https://tioj.sprout.tw/contests/{contest}/problems/{digits}/'


def render_problem_item(week, week_slug, slug, title, status, *, indent=''):
    """Render a single <li> for a problem (used in both chapter outline and section list)."""
    pid = slug.upper()
    source = (
        f' <a href="{tioj_url(slug, week)}" target="_blank" rel="noopener" '
        f'style="margin-left:8px;font-size:11px;color:var(--rust-bright);border:none;">'
        f'原題 ↗</a>'
    )
    if status == 'todo':
        return (
            f'{indent}<li><span style="color:var(--concrete)">{pid} · {title} '
            f'<span style="color:var(--line-bright)">(待補)</span></span>{source}</li>'
        )
    href = resolve_problem_link(week_slug, slug)
    if status == 'demo':
        return (
            f'{indent}<li><a href="{href}">{pid} · {title}</a>'
            f'<span class="chip chip--warning" style="margin-left:8px;font-size:9px;">DEMO</span>'
            f'{source}</li>'
        )
    # 'done' or anything else
    return f'{indent}<li><a href="{href}">{pid} · {title}</a>{source}</li>'


def group_problems(probs):
    """Group problems by category, preserving order."""
    out = {}
    for p in probs:
        out.setdefault(p[2], []).append(p)
    return out


def chapter_quick_index(week, week_slug, probs):
    """Flat quick-reference table of every problem in the chapter."""
    if not probs:
        return ''
    rows = []
    for slug, title, cat, status in probs:
        cat_name = CATEGORY_NAMES.get(cat, cat)
        pid = slug.upper()
        href = resolve_problem_link(week_slug, slug)
        source = tioj_url(slug, week)

        if status == 'done':
            status_html = '<span style="color:#6ba368">✓ done</span>'
        elif status == 'demo':
            status_html = '<span class="chip chip--warning" style="font-size:9px;">DEMO</span>'
        else:
            status_html = '<span style="color:var(--concrete)">○ todo</span>'

        if status in ('done', 'demo'):
            title_cell = f'<a href="{href}">{title}</a>'
        else:
            title_cell = f'<span style="color:var(--concrete)">{title}</span>'

        rows.append(
            f'            <tr>'
            f'<td><span class="chip">{cat_name}</span></td>'
            f'<td style="font-family:var(--font-mono);">{pid}</td>'
            f'<td>{title_cell}</td>'
            f'<td><a href="{source}" target="_blank" rel="noopener" '
            f'style="color:var(--rust-bright);border:none;">原題 ↗</a></td>'
            f'<td>{status_html}</td>'
            f'</tr>'
        )
    rows_html = '\n'.join(rows)
    return f'''      <article id="sec-quick-index">
        <span class="stamp">▼ QUICK INDEX</span>
        <h2>題目快速索引</h2>
        <div class="article-meta">
          <span>SUMMARY</span>
          <span>{len(probs)} PROBLEMS</span>
        </div>
        <table>
          <thead>
            <tr><th>類別</th><th>題號</th><th>題目</th><th>原題</th><th>狀態</th></tr>
          </thead>
          <tbody>
{rows_html}
          </tbody>
        </table>
      </article>'''


def chapter_outline(week, week_slug, probs):
    """Build the chapter TOC at the top of the chapter page."""
    by_cat = group_problems(probs)
    items = []
    if probs:
        items.append(f'          <li><a href="#sec-quick-index">⚡ 快速索引</a></li>')
    items.append(f'          <li><a href="#sec-concept">{week}.1 · 核心概念</a></li>')

    idx = 2
    if not probs:
        items.append(f'          <li><a href="#sec-problems">{week}.{idx} · 題目列表</a></li>')
        idx += 1
    else:
        for cat in CATEGORY_ORDER:
            cat_items = by_cat.get(cat)
            if not cat_items:
                continue
            sec_id = f'sec-{cat}'
            items.append(f'          <li><a href="#{sec_id}">{week}.{idx} · {CATEGORY_NAMES[cat]}</a>')
            sub = '\n'.join(
                render_problem_item(week, week_slug, slug, title, status, indent='              ')
                for slug, title, _, status in cat_items
            )
            items.append(f'            <ul class="notes-list" style="margin: 6px 0 6px 16px;">')
            items.append(sub)
            items.append(f'            </ul>')
            items.append(f'          </li>')
            idx += 1

    items.append(f'          <li><a href="#sec-notes">{week}.{idx} · 筆記與補充</a></li>')
    return '\n'.join(items)


def chapter_sections(week, week_slug, probs):
    """Build the main content sections of the chapter page (quick index + concept + per-category + notes)."""
    by_cat = group_problems(probs)

    out = []

    # Quick reference table at the top (only if there are problems)
    qi = chapter_quick_index(week, week_slug, probs)
    if qi:
        out.append(qi)

    out.append(f'''      <article id="sec-concept">
        <span class="stamp">▼ {week}.1</span>
        <h2>核心概念</h2>
        <div class="article-meta">
          <span>OVERVIEW</span>
        </div>
        <p>—— 待補 ——</p>
      </article>''')

    idx = 2
    if not probs:
        out.append(f'''      <article id="sec-problems">
        <span class="stamp">▼ {week}.{idx}</span>
        <h2>題目列表</h2>
        <div class="article-meta">
          <span>PROBLEMS</span>
        </div>
        <ul class="notes-list">
          <li><span style="color:var(--concrete)">—— 待新增題目 ——</span></li>
        </ul>
      </article>''')
        idx += 1
    else:
        for cat in CATEGORY_ORDER:
            cat_items = by_cat.get(cat)
            if not cat_items:
                continue
            sec_id = f'sec-{cat}'
            cat_name = CATEGORY_NAMES[cat]
            items = '\n          '.join(
                render_problem_item(week, week_slug, slug, title, status)
                for slug, title, _, status in cat_items
            )
            count = len(cat_items)
            out.append(f'''      <article id="{sec_id}">
        <span class="stamp">▼ {week}.{idx}</span>
        <h2>{cat_name}</h2>
        <div class="article-meta">
          <span>{count} {"PROBLEM" if count == 1 else "PROBLEMS"}</span>
        </div>
        <ul class="notes-list">
          {items}
        </ul>
      </article>''')
            idx += 1

    # Last: Notes
    out.append(f'''      <article id="sec-notes">
        <span class="stamp">▼ {week}.{idx}</span>
        <h2>筆記與補充</h2>
        <div class="article-meta">
          <span>NOTES</span>
        </div>
        <p>—— 待補 ——</p>
      </article>''')

    return '\n\n'.join(out)


# ============================================================
#  Chapter page template
# ============================================================
def chapter_page(week, slug, title, subtitle, count):
    base = '../../'
    sidebar = sidebar_html(week, base)
    probs = PROBLEMS.get(week, [])
    outline = chapter_outline(week, slug, probs)
    sections = chapter_sections(week, slug, probs)
    actual_count = len(probs) if probs else count

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
      <span>{actual_count:02d} PROBLEMS</span>
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
          <span>{actual_count:02d} PROBLEMS</span>
        </div>

        <ul class="notes-list">
{outline}
        </ul>
      </article>

{sections}

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
#  Sidebar refresh for existing pages (home + problem detail pages)
# ============================================================
def refresh_home_sidebar():
    """Replace the sidebar block in index.html (no chapter is active on home)."""
    home = ROOT / 'index.html'
    if not home.exists():
        return False
    txt = home.read_text(encoding='utf-8')
    new_sidebar = sidebar_html(active_week=None, base='')
    pat = re.compile(r'(<aside class="sidebar">)(.*?)(</aside>)', re.DOTALL)
    new_txt, n = pat.subn(
        lambda m: m.group(1) + '\n' + new_sidebar + '\n    ' + m.group(3),
        txt, count=1
    )
    if n:
        home.write_text(new_txt, encoding='utf-8')
        return True
    return False


def refresh_problem_sidebars():
    """Refresh the CURRICULUM portion of every existing problem page's sidebar.
    Handles both single-page (problems/p18.html) and multi-page (problems/p114/*.html)."""
    for problem_html in (ROOT / 'topics').rglob('*.html'):
        rel = problem_html.relative_to(ROOT)
        path_str = str(rel)
        if '/problems/' not in path_str.replace('\\', '/'):
            continue
        # active week from path
        week = None
        for w, slug, *_ in CHAPTERS:
            if f'topics/{slug}/'.replace('/', '\\') in path_str \
               or f'topics/{slug}/' in path_str.replace('\\', '/'):
                week = w
                break
        # base path back to root = (n_parts - 1) levels up
        depth = len(rel.parts) - 1
        base = '../' * depth

        txt = problem_html.read_text(encoding='utf-8')
        sidebar = sidebar_html(active_week=week, base=base)
        pat = re.compile(
            r'<div class="nav-label">// CURRICULUM</div>.*?</aside>',
            re.DOTALL,
        )
        replacement = sidebar.lstrip() + '\n    </aside>'
        new_txt, n = pat.subn(replacement, txt, count=1)
        if n:
            problem_html.write_text(new_txt, encoding='utf-8')
            print(f'refreshed {rel} sidebar')


# ============================================================
#  Main
# ============================================================
def main():
    for w, slug, title, subtitle, count in CHAPTERS:
        d = ROOT / 'topics' / slug
        d.mkdir(parents=True, exist_ok=True)
        html = chapter_page(w, slug, title, subtitle, count)
        (d / 'index.html').write_text(html, encoding='utf-8')
        print(f'wrote topics/{slug}/index.html')

    if refresh_home_sidebar():
        print('refreshed index.html sidebar')

    refresh_problem_sidebars()


if __name__ == '__main__':
    main()
