# ALGO_NOTES

個人演算法學習筆記，依照「資訊之芽算法班」課程主題編排。

## 本地檢視

直接以瀏覽器開啟 `index.html`，或在專案根目錄執行：

```
python3 -m http.server 8000
```

然後開啟 `http://localhost:8000`。

## 目錄結構

```
.
├── index.html                 # 首頁：主題導覽
├── about.html                 # 說明頁
├── assets/
│   ├── css/                   # 工業風 design system
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── components.css
│   │   └── problem.css
│   └── js/
│       └── viz/               # 演算法動畫
└── topics/
    └── 01-data-structure/
        ├── index.html
        └── problems/
            └── p18.html
```

## 私密發布（Cloudflare Pages + Access）

1. 將此 repo 設為 GitHub Private。
2. 到 Cloudflare Pages 連結 repo，build 設定留空，輸出目錄填 `/`。
3. Pages 部署完成後到 **Zero Trust → Access → Applications** 建立 Self-hosted Application，
   把 Pages 網域加進去，設定 Email Policy 只允許自己的信箱。

## 撰寫節奏

由本人挑題，再由 Claude 依照固定六段結構整理筆記。流程封裝於
`.claude/skills/algo-notes/SKILL.md`。
