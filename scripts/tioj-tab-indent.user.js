// ==UserScript==
// @name         TIOJ Sprout - Tab = 4 spaces in code box
// @namespace    https://github.com/foodieteng
// @version      1.0.0
// @description  讓 tioj.sprout.tw 的 Code 框 Tab 插入 4 個空格，而不是切到「選擇檔案」按鈕。支援 Shift+Tab 反縮排、多行選取批次縮排。
// @match        https://tioj.sprout.tw/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const INDENT = '    '; // 4 spaces
  const INDENT_LEN = INDENT.length;

  function isCodeTextarea(el) {
    if (!(el instanceof HTMLTextAreaElement)) return false;
    // 提交頁面的 code 欄位 name 通常是 "submission[code]" 或 id 包含 code
    const name = (el.name || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    return name.includes('code') || id.includes('code');
  }

  function handleTab(e) {
    const ta = e.target;
    if (!isCodeTextarea(ta)) return;
    if (e.key !== 'Tab') return;
    // 不攔截 Ctrl/Cmd/Alt + Tab（讓瀏覽器自己處理切換）
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    e.preventDefault();

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;

    const selectionSpansLines = value.slice(start, end).includes('\n');

    if (!selectionSpansLines && !e.shiftKey) {
      // 單點插入 4 空格
      ta.value = value.slice(0, start) + INDENT + value.slice(end);
      ta.selectionStart = ta.selectionEnd = start + INDENT_LEN;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // 多行：找出選取所跨的行範圍
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = value.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = value.length;

    const block = value.slice(lineStart, lineEnd);
    const lines = block.split('\n');

    let newBlock;
    let deltaStart = 0;
    let deltaEnd = 0;

    if (e.shiftKey) {
      // 反縮排：每行去掉開頭最多 4 個空格（或一個 tab）
      newBlock = lines.map((ln, i) => {
        let removed = 0;
        if (ln.startsWith('\t')) {
          removed = 1;
        } else {
          while (removed < INDENT_LEN && ln[removed] === ' ') removed++;
        }
        if (i === 0) deltaStart = -removed;
        deltaEnd -= removed;
        return ln.slice(removed);
      }).join('\n');
    } else {
      // 縮排：每行前面加 4 空格
      newBlock = lines.map((ln, i) => {
        if (i === 0) deltaStart = INDENT_LEN;
        deltaEnd += INDENT_LEN;
        return INDENT + ln;
      }).join('\n');
    }

    ta.value = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
    ta.selectionStart = Math.max(lineStart, start + deltaStart);
    ta.selectionEnd = end + deltaEnd;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  document.addEventListener('keydown', handleTab, true);
})();
