// @ts-nocheck -- this file is ported VERBATIM from the previously hand-edited
// lib/client.js bundle (plain JS semantics: untyped params, Set<unknown>
// listeners, loose component signatures). The build pipeline is the safety
// net; type checking would only churn over ported JS.
/**
 * dsh-file-explorer — browser half.
 *
 * Mount form (reviewed 2026-08-31):
 *  - shell.overlay (id 'file-explorer', order 90): the fixed right-side panel
 *    — resizable tree (list/search/read/write/open-vscode/open-folder HTTP
 *    routes registered by the HOST half), preview pane, in-panel editor.
 *    Panel shift is applied to [data-phase=active] via CSS custom properties
 *    on documentElement (--fe-panel-width/--fe-preview-width/--fe-panel-shift)
 *    with an INSTANT padding change — no transition/will-change on the chat
 *    column (that compositor animation while streaming left the column
 *    painted stale: messages jumped, the bottom raised, or the whole column
 *    blanked until an input forced a repaint).
 *  - conversation.session.header.actions (id 'file-explorer-toggle'): the
 *    toolbar toggle button.
 *  - document 'dblclick' listener on the conversation area (collapses both
 *    panes) — disposed with the plugin.
 *  - Shared module-level store (open/width/query/tabs/status) + a
 *    plain listener set; components subscribe via useStore (useState tick).
 *
 * This file was regenerated VERBATIM from the previously hand-edited
 * lib/client.js bundle (v0.1.6 + hot fixes). Keep CSS in the SKIN_CSS-style
 * template below; NEVER put backticks inside that template literal — that
 * backtick comment once terminated the template early, produced a
 * SyntaxError, and the loader reported "loaded without registering".
 *
 * i18n (2026-09-02): UI copy is registered as the 'file-explorer' locale
 * namespace (src/client/locales.ts) and reaches components through the
 * `t` prop the slots framework synthesizes for a 'locale: NS' registration
 * (ExplorerPanel, ToggleButton). It follows whatever language DSH's own
 * settings panel has active — this plugin owns no switcher UI. The shared
 * store's `status` field holds { key, params } (or { raw } for opaque
 * host/exception text) instead of a baked string, so a toast still shown
 * mid-switch re-resolves through `t` on the next render instead of going
 * stale.
 */
import * as react from 'react';
import { NS, zh, en } from './locales.js';
// ---------- styles ----------
const CSS = `
html {
  --fe-panel-width: 303px;
  --fe-preview-width: 0px;
  --fe-panel-shift: calc(var(--fe-panel-width) + var(--fe-preview-width) + 12px);
}
html[data-fe-panel-open] [data-phase=active] {
  box-sizing: border-box;
  padding-right: var(--fe-panel-shift);
}
/* The pane shift is applied INSTANTLY. The previous "transition: padding-right"
   + "will-change: padding-right" animated the scroll container's width over
   0.36s while the transcript streams: the chat flow re-wrapped every frame,
   the sticky composer and ChatView's bottom-follow raced the browser's scroll
   anchoring on each frame, and (on a promoted compositor layer) the column
   could be left painted stale — messages jumping up / the bottom rising /
   the whole column blank until an input forced a repaint. One synchronous
   reflow is what ChatView's width-reflow contract covers. */
.fe-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 100;
  display: flex; flex-direction: column;
  background: var(--dsw-alias-bg-overlay);
  border-left: 1px solid var(--dsw-alias-border-l1);
  box-shadow: -4px 0 16px rgba(0,0,0,.12);
  color: var(--dsw-alias-label-primary);
  font-size: 13px; line-height: 1.45;
  max-width: 78vw; min-width: 220px;
  pointer-events: auto;
  box-sizing: border-box;
}
.fe-panel * { box-sizing: border-box; }
.fe-resize {
  position: absolute; left: -4px; top: 0; bottom: 0; width: 8px;
  cursor: col-resize; z-index: 5;
}
.fe-resize:hover { background: var(--dsw-alias-brand-primary); opacity: .35; }
.fe-collapse-tab {
  position: absolute; left: -17px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l1); border-right: none;
  border-radius: 7px 0 0 7px;
  background: var(--dsw-alias-bg-overlay);
  color: var(--dsw-alias-label-secondary);
  box-shadow: -3px 0 8px rgba(0,0,0,.10);
  cursor: pointer; z-index: 6;
}
.fe-collapse-tab:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); }
.fe-collapse-tab:active { color: var(--dsw-alias-brand-primary); }
.fe-drag-capture {
  position: fixed; inset: 0; z-index: 9999; cursor: col-resize;
  background: transparent;
}
.fe-header {
  display: flex; align-items: center; gap: 2px;
  padding: 7px 8px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  flex: none;
}
.fe-title { font-weight: 600; flex: 1; padding: 0 4px; }
.fe-iconbtn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; padding: 0;
  border: none; border-radius: 5px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.fe-iconbtn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.fe-iconbtn-on { color: var(--dsw-alias-brand-primary); }
.fe-icon-vscode { color: #007acc; }
.fe-icon-vscode:hover { color: #007acc; background: var(--dsw-alias-bg-layer-2); }
.fe-searchbar { position: relative; padding: 6px 8px 4px; flex: none; }
.fe-search {
  width: 100%; padding: 5px 22px 5px 8px;
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 5px;
  color: var(--dsw-alias-label-primary); font-size: 12px; outline: none;
}
.fe-search:focus { border-color: var(--dsw-alias-brand-primary); }
.fe-search::placeholder { color: var(--dsw-alias-label-secondary); }
.fe-search-state {
  position: absolute; right: 16px; top: 10px;
  color: var(--dsw-alias-label-secondary); font-size: 11px;
}
.fe-status { padding: 4px 10px; font-size: 11px; flex: none; }
.fe-status-ok { color: var(--dsw-alias-state-success-primary); }
.fe-status-err { color: var(--dsw-alias-state-error-primary); }
.fe-tree { flex: 1; overflow: auto; padding: 2px 0 8px; user-select: none; }
.fe-row {
  display: flex; align-items: center; gap: 4px;
  padding: 2px 8px; margin: 0 4px;
  border-radius: 5px; cursor: pointer; white-space: nowrap;
}
.fe-row:hover { background: var(--dsw-alias-bg-layer-1); }
.fe-row-selected { background: var(--dsw-alias-bg-layer-2); }
.fe-row-selected .fe-node-name { color: var(--dsw-alias-label-primary); }
.fe-chevron {
  width: 14px; height: 14px; flex: none;
  display: flex; align-items: center; justify-content: center;
  color: var(--dsw-alias-label-secondary);
}
.fe-chevron-none { visibility: hidden; }
.fe-node-icon { display: flex; flex: none; }
.fe-node-dir { color: var(--dsw-alias-brand-primary); }
.fe-node-file { color: var(--dsw-alias-label-secondary); }
.fe-node-name { overflow: hidden; text-overflow: ellipsis; }
.fe-node-size, .fe-node-rel {
  margin-left: auto; padding-left: 8px; flex: none;
  color: var(--dsw-alias-label-secondary); font-size: 11px;
}
.fe-node-rel { max-width: 45%; overflow: hidden; text-overflow: ellipsis; }
.fe-node-loading { color: var(--dsw-alias-label-secondary); font-size: 11px; }
.fe-node-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; padding: 4px 8px; }
.fe-empty { color: var(--dsw-alias-label-secondary); padding: 14px 10px; font-size: 12px; }
.fe-preview {
  position: fixed; top: 0; bottom: 0; z-index: 99;
  display: flex; flex-direction: column;
  background: var(--dsw-alias-bg-overlay);
  border-right: 1px solid var(--dsw-alias-border-l1);
  box-shadow: -4px 0 16px rgba(0,0,0,.12);
  color: var(--dsw-alias-label-primary);
  font-size: 13px; line-height: 1.45;
  min-width: 180px;
  pointer-events: auto;
  box-sizing: border-box;
}
.fe-preview * { box-sizing: border-box; }
.fe-preview-resize {
  position: absolute; left: -4px; top: 0; bottom: 0; width: 8px;
  cursor: col-resize; z-index: 5;
}
.fe-preview-resize:hover { background: var(--dsw-alias-brand-primary); opacity: .35; }
.fe-preview-body { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.fe-preview-plain {
  flex: 1; overflow: auto; margin: 0;
  padding: 8px 10px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Courier New', monospace;
  font-size: 12px; line-height: 1.5;
  white-space: pre-wrap; word-break: break-word;
}
.fe-editor-head {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 8px; flex: none;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary); font-size: 12px;
}
.fe-editor-name { font-weight: 600; color: var(--dsw-alias-label-primary); flex: none; }
.fe-editor-path { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.fe-btn {
  padding: 2px 9px; flex: none;
  border: 1px solid var(--dsw-alias-border-l2); border-radius: 5px;
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
  font-size: 12px; cursor: pointer;
}
.fe-btn:hover { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.fe-editor-textarea {
  flex: 1; width: 100%; resize: none;
  padding: 8px; border: none; outline: none;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Courier New', monospace;
  font-size: 12px; line-height: 1.5; white-space: pre;
}
.fe-editor-msg { padding: 10px 12px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.fe-editor-msg.fe-err { color: var(--dsw-alias-state-error-primary); }
.fe-tabbar {
  display: flex; align-items: stretch; gap: 2px;
  padding: 4px 6px 0; overflow-x: auto; flex: none;
  background: var(--dsw-alias-bg-layer-1);
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.fe-tab {
  display: flex; align-items: center; gap: 5px;
  max-width: 170px; min-width: 0; padding: 4px 4px 4px 9px;
  border: 1px solid var(--dsw-alias-border-l1); border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font-size: 12px; cursor: pointer; white-space: nowrap;
}
.fe-tab:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.fe-tab-active { background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); }
.fe-tab-name { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.fe-tab-close {
  display: flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; flex: none;
  border-radius: 3px; opacity: .6;
}
.fe-tab-close:hover { opacity: 1; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-state-error-primary); }
.fe-md {
  flex: 1; overflow: auto; padding: 10px 14px;
  font-size: 13px; line-height: 1.6; word-break: break-word;
}
.fe-md h1 { font-size: 20px; margin: 10px 0 6px; }
.fe-md h2 { font-size: 17px; margin: 10px 0 6px; }
.fe-md h3 { font-size: 15px; margin: 8px 0 4px; }
.fe-md h4, .fe-md h5, .fe-md h6 { font-size: 13px; margin: 8px 0 4px; }
.fe-md p { margin: 6px 0; }
.fe-md ul, .fe-md ol { margin: 6px 0; padding-left: 22px; }
.fe-md li { margin: 2px 0; }
.fe-md strong { font-weight: 700; }
.fe-md em { font-style: italic; }
.fe-md del { text-decoration: line-through; }
.fe-md code {
  background: var(--dsw-alias-bg-layer-2); border-radius: 3px; padding: 1px 4px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px;
}
.fe-md pre {
  background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 6px; padding: 8px 10px; overflow: auto; margin: 8px 0;
}
.fe-md pre code { background: none; padding: 0; }
.fe-md a { color: var(--dsw-alias-brand-primary); }
.fe-md blockquote {
  border-left: 3px solid var(--dsw-alias-border-l2);
  margin: 6px 0; padding: 2px 10px;
  color: var(--dsw-alias-label-secondary);
}
.fe-md hr { border: none; border-top: 1px solid var(--dsw-alias-border-l1); margin: 10px 0; }
.fe-md table { border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 12.5px; }
.fe-md th, .fe-md td { border: 1px solid var(--dsw-alias-border-l1); padding: 4px 8px; text-align: left; }
.fe-md th { background: var(--dsw-alias-bg-layer-2); font-weight: 600; }
.fe-md table code { font-size: 11.5px; }
.fe-md input[type=checkbox] { vertical-align: -2px; margin-right: 6px; }
.fe-md img { max-width: 100%; border-radius: 4px; }
.fe-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; padding: 0;
  border: none; border-radius: 6px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.fe-toggle:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.fe-toggle-on { color: var(--dsw-alias-brand-primary); }
.fe-hl { tab-size: 4; }
.fe-hl .fe-tok-c { color: var(--fe-hl-comment, #7f848e); font-style: italic; }
.fe-hl .fe-tok-s { color: var(--fe-hl-string, #98c379); }
.fe-hl .fe-tok-n { color: var(--fe-hl-number, #d19a66); }
.fe-hl .fe-tok-k { color: var(--fe-hl-keyword, #c678dd); }
.fe-hl .fe-tok-b { color: var(--fe-hl-builtin, #56b6c2); }
.fe-hl .fe-tok-t { color: var(--fe-hl-type, #e5c07b); }
.fe-hl .fe-tok-f { color: var(--fe-hl-func, #61afef); }
.fe-hl .fe-tok-p { color: var(--fe-hl-prop, #e06c75); }
.fe-hl .fe-tok-o { color: var(--fe-hl-operator, #abb2bf); }
.fe-hl .fe-tok-a { color: var(--fe-hl-attr, #d19a66); }
.fe-hl .fe-tok-d { color: var(--fe-hl-directive, #c678dd); }
`;
// ---------- fetch API (same origin as the GUI) ----------
const api = {
    list: (path) => fetch('/plugins/file-explorer/list?path=' + encodeURIComponent(path)).then((r) => r.json()),
    search: (root, q) => fetch('/plugins/file-explorer/search?root=' + encodeURIComponent(root) + '&q=' + encodeURIComponent(q)).then((r) => r.json()),
    read: (path) => fetch('/plugins/file-explorer/read?path=' + encodeURIComponent(path)).then((r) => r.json()),
    write: (path, content) => fetch('/plugins/file-explorer/write', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path, content }),
    }).then((r) => r.json()),
    openVscode: (path) => fetch('/plugins/file-explorer/open-vscode', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path }),
    }).then((r) => r.json()),
    openFolder: (path) => fetch('/plugins/file-explorer/open-folder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path }),
    }).then((r) => r.json()),
};
const inject = ["slots", "locale"];
// Expand-all/collapse-all coordination, stable across renders (the panel
// is a single instance per page). A token bump cancels an in-flight run.
let expandToken = 0;
let expandBusy = false;
const MAX_EXPAND_DIRS = 500;
const SEARCH_TRUNC_LIMIT = 300;
// ---------- shared store (open/width/search/editor/status) ----------
const store = {
    open: false,
    width: 303,
    rootPath: null,
    query: '',
    searching: false,
    searchError: null,
    matches: null,
    truncated: false,
    // Preview tabs and status live in the shared store so outer
    // listeners (the chat double-click handler) can close them.
    // tabs keep their open order; the strip never reorders them.
    tabs: [],
    activePath: null,
    previewOpen: false,
    previewRestoreOnTreeOpen: false,
    status: null,
    listeners: new Set(),
};
const emit = () => { for (const fn of Array.from(store.listeners))
    fn(); };
const subscribe = (fn) => { store.listeners.add(fn); return () => { store.listeners.delete(fn); }; };
const setOpen = (value) => {
    store.open = !!value;
    // Reopening the tree restores a preview pane that the chat
    // double-click close-all gesture only hid (tabs survived).
    if (store.open && store.previewRestoreOnTreeOpen && store.tabs.length > 0) {
        store.previewOpen = true;
        store.previewRestoreOnTreeOpen = false;
    }
    emit();
};
const toggleOpen = () => setOpen(!store.open);
const setStatus = (value) => { store.status = value; emit(); };
let statusSeq = 0;
const showStatus = (msg) => {
    const seq = ++statusSeq;
    setStatus(msg);
    setTimeout(() => { if (seq === statusSeq)
        setStatus(null); }, 4000);
};
// ---------- preview tabs (one tab per file, open-order stable) ----------
// Like browser tabs: tabs keep their open order; activating a
// background tab never reorders the strip. The bar scrolls
// horizontally when tabs overflow, and tabs are never evicted
// behind the user's back (unsaved edits stay safe).
const addTab = (tab) => {
    store.tabs = [...store.tabs, tab];
    emit();
};
const activateTab = (path) => {
    if (!store.tabs.some((t) => t.path === path))
        return;
    store.activePath = path;
    store.previewOpen = true;
    emit();
};
// updateTab accepts an updater function; no-op when the tab is gone.
const updateTab = (path, fn) => {
    if (!store.tabs.some((t) => t.path === path))
        return;
    store.tabs = store.tabs.map((t) => (t.path === path ? fn(t) : t));
    emit();
};
const closeTab = (path) => {
    const i = store.tabs.findIndex((t) => t.path === path);
    if (i < 0)
        return;
    store.tabs = store.tabs.filter((t) => t.path !== path);
    if (store.activePath === path) {
        const next = store.tabs[Math.min(i, store.tabs.length - 1)];
        store.activePath = next ? next.path : null;
    }
    if (store.tabs.length === 0)
        store.previewOpen = false;
    emit();
};
const closePreviewPane = () => { store.previewOpen = false; emit(); };
// (a)/(b) project filter: a preview survives only while its file
// lives inside the current project folder.
const isInsideRoot = (path, root) => {
    if (!path || !root)
        return false;
    const norm = (p) => String(p).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
    const r = norm(root);
    const p = norm(path);
    return p === r || p.startsWith(r + '/');
};
// Kills tabs outside `root`; returns whether any tab survived.
const filterTabs = (root) => {
    store.tabs = store.tabs.filter((t) => isInsideRoot(t.path, root));
    if (store.tabs.length === 0)
        store.activePath = null;
    else if (!store.tabs.some((t) => t.path === store.activePath))
        store.activePath = store.tabs[store.tabs.length - 1].path;
    emit();
    return store.tabs.length > 0;
};
let searchTimer = null;
const doSearch = (q) => {
    store.searching = true;
    store.searchError = null;
    emit();
    api.search(store.rootPath, q).then((res) => {
        if (store.query !== q)
            return;
        store.searching = false;
        if (res && res.error)
            store.searchError = res.error;
        else {
            store.matches = (res && res.matches) || [];
            store.truncated = !!(res && res.truncated);
        }
        emit();
    }).catch((err) => {
        if (store.query !== q)
            return;
        store.searching = false;
        store.searchError = String((err && err.message) || err);
        emit();
    });
};
const runSearch = (raw) => {
    const q = String(raw || '').trim();
    if (store.query !== q)
        return;
    if (!q) {
        store.matches = null;
        store.searching = false;
        store.searchError = null;
        emit();
        return;
    }
    if (searchTimer !== null)
        clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { searchTimer = null; doSearch(q); }, 300);
};
const setQuery = (value) => { store.query = String(value || ''); emit(); runSearch(store.query); };
const useStore = () => {
    const [, setTick] = react.useState(0);
    react.useEffect(() => subscribe(() => setTick((x) => x + 1)), []);
    return store;
};
// ---------- markdown ----------
const isMarkdown = (name) => /\.(md|markdown|mdown|mkd)$/i.test(name);
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mdInline = (s) => {
    let t = escapeHtml(s);
    t = t.replace(/`([^`\n]+)`/g, (m, c) => '<code>' + c + '</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, (m, c) => '<strong>' + c + '</strong>');
    t = t.replace(/~~([^~]+)~~/g, (m, c) => '<del>' + c + '</del>');
    t = t.replace(/\*([^*\s][^*]*)\*/g, (m, c) => '<em>' + c + '</em>');
    t = t.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (m, alt, src) => '<img src="' + src + '" alt="' + alt + '" />');
    t = t.replace(/(?<!!)\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, href) => '<a href="' + href + '" target="_blank" rel="noreferrer">' + txt + '</a>');
    return t;
};
const itemContent = (content) => {
    const task = /^\[([ xX])\]\s+(.*)$/.exec(content);
    if (task)
        return '<input type="checkbox" disabled' + (task[1] !== ' ' ? ' checked' : '') + ' /> ' + mdInline(task[2]);
    return mdInline(content);
};
const splitRow = (line) => {
    let s = String(line).trim();
    if (s.startsWith('|'))
        s = s.slice(1);
    if (s.endsWith('|'))
        s = s.slice(0, -1);
    return s.split('|').map((c) => c.trim());
};
const isTableSep = (line) => /^\s*\|?[\s:|-]+\|?\s*$/.test(String(line)) && String(line).includes('-');
const buildListHtml = (entries, start, minIndent) => {
    let out = '';
    let i = start;
    let currentType = null;
    let open = false;
    while (i < entries.length) {
        const e = entries[i];
        if (e.indent < minIndent)
            break;
        if (e.indent === minIndent) {
            if (currentType !== e.type) {
                if (open)
                    out += '</' + currentType + '>';
                currentType = e.type;
                out += '<' + currentType + '>';
                open = true;
            }
            let itemHtml = '<li>' + itemContent(e.content);
            if (i + 1 < entries.length && entries[i + 1].indent > minIndent) {
                const sub = buildListHtml(entries, i + 1, entries[i + 1].indent);
                itemHtml += sub.out;
                i = sub.next;
            }
            else {
                i++;
            }
            itemHtml += '</li>';
            out += itemHtml;
        }
        else {
            i++;
        }
    }
    if (open)
        out += '</' + currentType + '>';
    return { out, next: i };
};
const renderMarkdown = (text) => {
    const lines = String(text).replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let inCode = false;
    let codeLines = [];
    let codeLang = '';
    const flushCode = () => {
        if (inCode) {
            const lang = hlLangForFence(codeLang);
            const body = lang ? highlight(codeLines.join('\n'), lang) : escapeHtml(codeLines.join('\n'));
            out.push('<pre class="fe-hl' + (lang ? ' lang-' + lang : '') + '"><code>' + body + '</code></pre>');
            codeLines = [];
            inCode = false;
            codeLang = '';
        }
    };
    // Shared GFM table builder: header line + separator line + data rows.
    // Used for plain tables and for tables inside blockquotes.
    const tableFrom = (headerLine, sepLine, rowLines) => {
        const header = splitRow(headerLine);
        const aligns = splitRow(sepLine).map((c) => {
            if (/^:.*:$/.test(c))
                return 'center';
            if (/^:/.test(c))
                return 'left';
            if (/:$/.test(c))
                return 'right';
            return '';
        });
        const cell = (content, tag, idx) => {
            const align = aligns[Math.min(idx, aligns.length - 1)];
            return '<' + tag + (align ? ' style="text-align:' + align + '"' : '') + '>' + mdInline(content) + '</' + tag + '>';
        };
        let html = '<table><thead><tr>';
        header.forEach((c, idx) => { html += cell(c, 'th', idx); });
        html += '</tr></thead><tbody>';
        for (const row of rowLines) {
            html += '<tr>';
            splitRow(row).forEach((c, idx) => { html += cell(c, 'td', idx); });
            html += '</tr>';
        }
        return html + '</tbody></table>';
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^```/.test(line.trim())) {
            if (inCode) {
                flushCode(); // closing fence: exit code mode and push the block
            }
            else {
                inCode = true;
                codeLines = [];
                const fm = /^```\s*([\w+-]*)/.exec(line.trim());
                codeLang = fm && fm[1] ? fm[1] : '';
            }
            continue;
        }
        if (inCode) {
            codeLines.push(line);
            continue;
        }
        // GFM table: header row + separator row
        if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            const rowLines = [];
            let k = i + 2;
            while (k < lines.length && /^\s*\|/.test(lines[k]) && !isTableSep(lines[k])) {
                rowLines.push(lines[k]);
                k++;
            }
            out.push(tableFrom(line, lines[i + 1], rowLines));
            i = k - 1;
            continue;
        }
        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
            out.push('<h' + heading[1].length + '>' + mdInline(heading[2]) + '</h' + heading[1].length + '>');
            continue;
        }
        const bullet = /^(\s*)[-*+]\s+(.*)$/.exec(line);
        const ordered = /^(\s*)\d+\.\s+(.*)$/.exec(line);
        const listMatch = bullet || ordered;
        if (listMatch) {
            const entries = [];
            let j = i;
            while (j < lines.length) {
                const bl = /^(\s*)[-*+]\s+(.*)$/.exec(lines[j]);
                const ol = /^(\s*)\d+\.\s+(.*)$/.exec(lines[j]);
                const m = bl || ol;
                if (!m)
                    break;
                entries.push({ indent: m[1].length, type: bl ? 'ul' : 'ol', content: m[2] });
                j++;
            }
            out.push(buildListHtml(entries, 0, entries[0].indent).out);
            i = j - 1;
            continue;
        }
        const quote = /^\s*>\s?(.*)$/.exec(line);
        if (quote) {
            // Collect consecutive quoted lines into ONE blockquote, and
            // render GFM tables inside it: a quoted table row starts with
            // "> |", invisible to the plain table detector above.
            const q = [];
            let k = i;
            while (k < lines.length && /^\s*>\s?(.*)$/.exec(lines[k])) {
                q.push(/^\s*>\s?(.*)$/.exec(lines[k])[1]);
                k++;
            }
            const inner = [];
            let qi = 0;
            while (qi < q.length) {
                const ql = q[qi];
                if (/^\s*\|/.test(ql) && qi + 1 < q.length && isTableSep(q[qi + 1])) {
                    const rowLines = [];
                    let k2 = qi + 2;
                    while (k2 < q.length && /^\s*\|/.test(q[k2]) && !isTableSep(q[k2])) {
                        rowLines.push(q[k2]);
                        k2++;
                    }
                    inner.push(tableFrom(ql, q[qi + 1], rowLines));
                    qi = k2;
                    continue;
                }
                if (ql.trim() === '') {
                    qi++;
                    continue;
                }
                inner.push('<p>' + mdInline(ql) + '</p>');
                qi++;
            }
            out.push('<blockquote>' + inner.join('') + '</blockquote>');
            i = k - 1;
            continue;
        }
        if (/^\s*-+\s*$/.test(line)) {
            out.push('<hr/>');
            continue;
        }
        if (line.trim() === '')
            continue;
        out.push('<p>' + mdInline(line) + '</p>');
    }
    flushCode();
    return out.join('');
};
// ---------- syntax highlighting (self-contained, no runtime deps) ----------
// Extension -> language id for direct file previews.
const HL_EXT = {
    js: 'js', mjs: 'js', cjs: 'js', jsx: 'js',
    ts: 'ts', mts: 'ts', cts: 'ts', tsx: 'ts',
    json: 'json', jsonc: 'json', map: 'json',
    yaml: 'yaml', yml: 'yaml',
    py: 'python', pyw: 'python',
    c: 'c', h: 'c',
    cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hh: 'cpp', hxx: 'cpp',
    java: 'java',
    go: 'go',
    rs: 'rust',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    sql: 'sql',
    toml: 'toml',
    ini: 'ini', cfg: 'ini', conf: 'ini',
    css: 'css', scss: 'css', less: 'css',
    html: 'html', htm: 'html',
    md: 'markdown', markdown: 'markdown', txt: 'text',
};
// Fence-info aliases used by markdown code blocks (```lang).
const HL_ALIAS = {
    javascript: 'js', jsx: 'js', typescript: 'ts', tsx: 'ts',
    py: 'python', 'c++': 'cpp', sh: 'shell', bash: 'shell',
    yml: 'yaml', jsonc: 'json',
};
const hlLangFor = (name) => {
    const n = String(name || '').toLowerCase();
    const i = n.lastIndexOf('.');
    const ext = i >= 0 ? n.slice(i + 1) : n;
    return HL_EXT[ext] || '';
};
const hlLangForFence = (l) => {
    const s = String(l || '').toLowerCase().trim();
    return HL_ALIAS[s] || HL_EXT[s] || (HL[s] ? s : '');
};
// Language configs. Flags: ln=line comment, bl=block comment, bt=backtick,
// hs=hash comment, hsAny=hash anywhere, pr=preprocessor #, tr=triple quote,
// de=@decorator, dl=$var, ks=quoted-key (json/yaml), ki=bare key: (yaml),
// ke=key= (toml/ini), ct=capitalized=type, tg=html tags.
const HL = {
    js: { ln: '//', bl: true, bt: true, kw: 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await', bn: 'console Math JSON Promise Symbol BigInt Array Object String Number Boolean Function Date RegExp Error TypeError RangeError ReferenceError SyntaxError Map Set WeakMap WeakSet Proxy Reflect Intl URL URLSearchParams AbortController AbortSignal fetch setTimeout setInterval clearTimeout clearInterval queueMicrotask structuredClone atob btoa TextEncoder TextDecoder undefined null NaN Infinity globalThis window document process require module exports Buffer' },
    ts: { ln: '//', bl: true, bt: true, ct: true, kw: 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await abstract as asserts declare enum implements infer interface is keyof namespace readonly satisfies type unknown using', bn: 'console Math JSON Promise Symbol BigInt Array Object String Number Boolean Function Date RegExp Error TypeError RangeError ReferenceError SyntaxError Map Set WeakMap WeakSet Proxy Reflect URL fetch setTimeout setInterval clearTimeout clearInterval undefined null NaN Infinity globalThis window document process require module exports Buffer any unknown never void', ty: 'string number boolean object symbol bigint' },
    json: { ks: true, kw: 'true false null', bn: '' },
    yaml: { hs: true, ks: true, ki: true, kw: 'true false null yes no on off', bn: '' },
    python: { hs: true, hsAny: true, tr: true, de: true, ct: true, kw: 'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case', bn: 'None True False print len range str int float bool list dict set tuple bytes bytearray type object isinstance issubclass super property classmethod staticmethod enumerate zip map filter sorted sum min max abs round pow divmod open input eval exec repr format hash id vars dir getattr setattr hasattr delattr all any next iter reversed slice complex frozenset memoryview Exception ValueError TypeError KeyError IndexError AttributeError RuntimeError StopIteration NotImplementedError ImportError ModuleNotFoundError FileNotFoundError IOError OSError SystemExit KeyboardInterrupt' },
    c: { ln: '//', bl: true, pr: true, ct: true, kw: 'auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while', bn: 'NULL true false size_t ssize_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t ptrdiff_t wchar_t FILE stdin stdout stderr printf fprintf sprintf snprintf scanf fscanf sscanf malloc calloc realloc free memcpy memset memmove strlen strcmp strcpy strcat fopen fclose fread fwrite puts getchar putchar exit abort assert' },
    cpp: { ln: '//', bl: true, pr: true, ct: true, kw: 'alignas alignof and and_eq asm auto bitand bitor bool break case catch char class compl concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not not_eq nullptr operator or or_eq private protected public register reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while xor xor_eq', bn: 'NULL nullptr true false size_t ssize_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t ptrdiff_t wchar_t FILE stdin stdout stderr cout cin cerr endl string vector map set unordered_map unordered_set unique_ptr shared_ptr weak_ptr make_unique make_shared move forward static_cast dynamic_cast const_cast reinterpret_cast printf scanf malloc free memcpy memset strlen printf sprintf fprintf puts getchar putchar exit abort assert std' },
    java: { ln: '//', bl: true, ct: true, kw: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null var record sealed permits yield', bn: 'String System out in err println print printf Math Integer Double Long Short Byte Float Character Boolean Object Class Exception RuntimeException IllegalArgumentException NullPointerException ArrayList HashMap HashSet List Map Set Optional StringBuilder Arrays Collections Thread Runnable' },
    go: { ln: '//', bl: true, bt: true, ct: true, kw: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var', bn: 'true false iota nil error string bool byte rune int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 uintptr float32 float64 complex64 complex128 any comparable len cap append copy make new delete panic recover print println sprintf fmt strings strconv sort time os io errors math' },
    rust: { ln: '//', bl: true, ct: true, kw: 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while', bn: 'Some None Ok Err String Vec Box Rc Arc RefCell HashMap HashSet Option Result print println format vec macro_rules' },
    shell: { hs: true, dl: true, kw: 'if then else elif fi for while until do done case esac function in select time coproc', bn: 'echo printf read cd ls pwd cat grep sed awk find cp mv rm mkdir touch chmod chown export source unset test exit return set shift' },
    sql: { ln: '--', bl: true, kw: 'select from where insert into values update set delete create table alter add drop index view join inner left right outer on as and or not null primary key foreign references unique default check constraint group by order having limit offset union all distinct case when then else end exists between like in is returning with recursive cast begin commit rollback transaction', bn: 'true false null' },
    toml: { hs: true, hsAny: true, ke: true, kw: 'true false', bn: '' },
    ini: { hs: true, hsAny: true, ke: true, kw: 'true false', bn: '' },
    css: { bl: true, kw: '', bn: '' },
    html: { tg: true, kw: '', bn: '' },
};
const HL_SETS = {};
const hlSet = (s) => {
    const set = new Set();
    String(s || '').split(/\s+/).forEach((w) => { if (w)
        set.add(w); });
    return set;
};
Object.keys(HL).forEach((k) => {
    HL_SETS[k] = { kw: hlSet(HL[k].kw), bn: hlSet(HL[k].bn), ty: hlSet(HL[k].ty) };
});
const hlSpan = (cls, html) => '<span class="fe-tok-' + cls + '">' + html + '</span>';
const HL_MAX = 300000;
const HL_OP_RE = /^(===|!==|>>>|<<=|>>=|=>|\*\*|\+\+|--|&&|\|\||\?\?|\?\.|<=|>=|==|!=|<<|>>|\+=|-=|\*=|\/=|%=|\?|:|\.\.\.|\+|-|\*|\/|%|<|>|!|&|\||\^|~|=)/;
const highlight = (text, lang) => {
    const cfg = HL[lang];
    if (!cfg)
        return escapeHtml(text);
    const src = String(text);
    if (src.length > HL_MAX)
        return escapeHtml(text);
    const sets = HL_SETS[lang];
    const n = src.length;
    let html = '';
    let i = 0;
    let prevCh = '';
    let multi = null;
    while (i < n) {
        if (multi) {
            const j = src.indexOf(multi.close, i);
            if (j === -1) {
                html += hlSpan(multi.cls, escapeHtml(src.slice(i - multi.openLen)));
                i = n;
                break;
            }
            html += hlSpan(multi.cls, escapeHtml(src.slice(i - multi.openLen, j + multi.close.length)));
            prevCh = src[j + multi.close.length - 1];
            i = j + multi.close.length;
            multi = null;
            continue;
        }
        const c = src[i];
        const two = src.slice(i, i + 2);
        if (cfg.ln && two === cfg.ln) {
            const j = src.indexOf('\n', i);
            const end = j === -1 ? n : j;
            html += hlSpan('c', escapeHtml(src.slice(i, end)));
            prevCh = '\n';
            i = end;
            continue;
        }
        if (cfg.bl && two === '/*') {
            const j = src.indexOf('*/', i + 2);
            if (j === -1) {
                html += hlSpan('c', escapeHtml(src.slice(i)));
                i = n;
                break;
            }
            html += hlSpan('c', escapeHtml(src.slice(i, j + 2)));
            prevCh = '/';
            i = j + 2;
            continue;
        }
        if (cfg.tg && src.slice(i, i + 4) === '<!--') {
            const j = src.indexOf('-->', i + 4);
            const end = j === -1 ? n : j + 3;
            html += hlSpan('c', escapeHtml(src.slice(i, end)));
            prevCh = '\n';
            i = end;
            continue;
        }
        if (cfg.hs && c === '#' && (cfg.hsAny || i === 0 || /\s/.test(src[i - 1]))) {
            const j = src.indexOf('\n', i);
            const end = j === -1 ? n : j;
            html += hlSpan('c', escapeHtml(src.slice(i, end)));
            prevCh = '\n';
            i = end;
            continue;
        }
        if (cfg.pr && c === '#') {
            let k = i - 1;
            while (k >= 0 && (src[k] === ' ' || src[k] === '\t'))
                k--;
            if (k < 0 || src[k] === '\n') {
                const j = src.indexOf('\n', i);
                const end = j === -1 ? n : j;
                html += hlSpan('d', escapeHtml(src.slice(i, end)));
                prevCh = '\n';
                i = end;
                continue;
            }
        }
        if (cfg.tr && (src.slice(i, i + 3) === '"""' || src.slice(i, i + 3) === "'''")) {
            multi = { cls: 's', close: src.slice(i, i + 3), openLen: 3 };
            i += 3;
            continue;
        }
        if (cfg.de && c === '@') {
            const dm = /^@[A-Za-z_][\w$]*/.exec(src.slice(i));
            if (dm) {
                html += hlSpan('b', escapeHtml(dm[0]));
                prevCh = dm[0][dm[0].length - 1];
                i += dm[0].length;
                continue;
            }
        }
        if (cfg.dl && c === '$') {
            const dm = /^\$[A-Za-z_][\w]*/.exec(src.slice(i));
            if (dm) {
                html += hlSpan('b', escapeHtml(dm[0]));
                prevCh = dm[0][dm[0].length - 1];
                i += dm[0].length;
                continue;
            }
        }
        if (c === '"' || c === "'") {
            let j = i + 1;
            let esc = false;
            while (j < n) {
                if (!esc && src[j] === c)
                    break;
                if (!esc && src[j] === '\\')
                    esc = true;
                else
                    esc = false;
                if (src[j] === '\n')
                    break;
                j++;
            }
            const end = j < n && src[j] === c ? j + 1 : j;
            let cls = 's';
            if (cfg.ks) {
                let k = end;
                while (k < n && (src[k] === ' ' || src[k] === '\t'))
                    k++;
                if (src[k] === ':')
                    cls = 'p';
            }
            html += hlSpan(cls, escapeHtml(src.slice(i, end)));
            prevCh = src[end - 1];
            i = end;
            continue;
        }
        if (cfg.bt && c === '`') {
            multi = { cls: 's', close: '`', openLen: 1 };
            i += 1;
            continue;
        }
        const nm = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+)/.exec(src.slice(i));
        if (nm) {
            html += hlSpan('n', escapeHtml(nm[0]));
            prevCh = nm[0][nm[0].length - 1];
            i += nm[0].length;
            continue;
        }
        const idm = /^[A-Za-z_$][\w$]*/.exec(src.slice(i));
        if (idm) {
            const word = idm[0];
            let k2 = i + word.length;
            while (k2 < n && (src[k2] === ' ' || src[k2] === '\t'))
                k2++;
            const nextCh = src[i + word.length];
            let cls = '';
            if (sets.kw.has(word))
                cls = 'k';
            else if (sets.bn.has(word))
                cls = 'b';
            else if (sets.ty.has(word))
                cls = 't';
            else if (cfg.ct && /^[A-Z]/.test(word))
                cls = 't';
            else if (nextCh === '(')
                cls = 'f';
            else if (prevCh === '.')
                cls = 'p';
            else if (cfg.ki && src[k2] === ':')
                cls = 'p';
            else if (cfg.ke && src[k2] === '=' && src[k2 + 1] !== '=')
                cls = 'p';
            html += cls ? hlSpan(cls, escapeHtml(word)) : escapeHtml(word);
            prevCh = word[word.length - 1];
            i += word.length;
            continue;
        }
        if (cfg.tg && c === '<') {
            const gt = src.indexOf('>', i);
            const end = gt === -1 ? n : gt + 1;
            const seg = src.slice(i, end);
            let segHtml = '';
            let last = 0;
            let m;
            const tagRe = /(<\/?)([A-Za-z][\w-]*)|([A-Za-z-]+)(?=\s*=)|(\/?>)|("[^"]*"|'[^']*')/g;
            tagRe.lastIndex = 0;
            while ((m = tagRe.exec(seg)) !== null) {
                segHtml += escapeHtml(seg.slice(last, m.index));
                if (m[1])
                    segHtml += m[1] + hlSpan('t', escapeHtml(m[2]));
                else if (m[3])
                    segHtml += hlSpan('a', escapeHtml(m[3]));
                else if (m[4])
                    segHtml += escapeHtml(m[4]);
                else if (m[5])
                    segHtml += hlSpan('s', escapeHtml(m[5]));
                last = m.index + m[0].length;
            }
            segHtml += escapeHtml(seg.slice(last));
            html += segHtml;
            prevCh = seg[seg.length - 1] || '';
            i = end;
            continue;
        }
        const om = HL_OP_RE.exec(src.slice(i));
        if (om) {
            html += hlSpan('o', escapeHtml(om[0]));
            prevCh = om[0][om[0].length - 1];
            i += om[0].length;
            continue;
        }
        prevCh = c;
        html += escapeHtml(c);
        i++;
    }
    return html;
};
// ---------- icons ----------
const iconPaths = {
    vscode: 'M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74l3.06 2.26-3.06 2.26a1 1 0 0 0 .001 1.479L1.65 15.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 18.06V5.94a1.5 1.5 0 0 0-.85-1.353zm-5.105 14.698L9.429 12l8.616-5.285z',
    openInNew: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    chevronDown: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
    chevronRight: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    refresh: 'M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    folder: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    file: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z',
    files: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
};
const Icon = (props) => react.createElement('svg', {
    width: props.size || 14,
    height: props.size || 14,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    style: { display: 'block' },
}, react.createElement('path', { d: iconPaths[props.name] }));
const fmtSize = (n) => {
    if (n === null || n === undefined)
        return '';
    if (n < 1024)
        return n + ' B';
    if (n < 1048576)
        return (n / 1024).toFixed(1) + ' KB';
    if (n < 1073741824)
        return (n / 1048576).toFixed(1) + ' MB';
    return (n / 1073741824).toFixed(1) + ' GB';
};
// ---------- header toggle button ----------
const ToggleButton = (props) => {
    const s = useStore();
    const t = props.t;
    return react.createElement('button', {
        className: 'fe-toggle' + (s.open ? ' fe-toggle-on' : ''),
        title: t('panel.title'),
        'aria-label': t('panel.title'),
        onClick: toggleOpen,
    }, react.createElement(Icon, { name: 'files', size: 15 }));
};
// ---------- tree node ----------
const TreeNode = (props) => {
    const entry = props.entry;
    const tree = props.tree;
    const isDir = entry.type === 'directory';
    const expanded = tree.expanded.has(entry.path);
    const loading = tree.loading.has(entry.path);
    const error = tree.errors[entry.path];
    const children = tree.cache.get(entry.path);
    const row = react.createElement('div', {
        className: 'fe-row' + (tree.selected === entry.path ? ' fe-row-selected' : ''),
        style: { paddingLeft: 6 + props.depth * 14 },
        onClick: () => isDir ? props.onToggle(entry.path) : props.onOpen(entry, true),
        onDoubleClick: () => props.onOpen(entry, false),
        title: entry.path,
    }, react.createElement('span', { className: 'fe-chevron' + (isDir ? '' : ' fe-chevron-none') }, isDir
        ? react.createElement(Icon, { name: expanded ? 'chevronDown' : 'chevronRight', size: 12 })
        : null), react.createElement('span', { className: 'fe-node-icon fe-node-' + (isDir ? 'dir' : 'file') }, react.createElement(Icon, { name: isDir ? 'folder' : 'file', size: 14 })), react.createElement('span', { className: 'fe-node-name', title: entry.name }, entry.name), isDir && loading ? react.createElement('span', { className: 'fe-node-loading' }, '…') : null, !isDir && typeof entry.size === 'number' ? react.createElement('span', { className: 'fe-node-size' }, fmtSize(entry.size)) : null);
    const nodes = [row];
    if (isDir && expanded) {
        if (children) {
            for (const child of children) {
                nodes.push(react.createElement(TreeNode, { key: child.path, entry: child, depth: props.depth + 1, tree, onToggle: props.onToggle, onSelect: props.onSelect, onOpen: props.onOpen }));
            }
        }
        else if (!loading && error) {
            nodes.push(react.createElement('div', { key: '__err', className: 'fe-node-error', style: { paddingLeft: 6 + (props.depth + 1) * 14 } }, error));
        }
    }
    return react.createElement('div', { className: 'fe-node' }, ...nodes);
};
// ---------- main panel ----------
const ExplorerPanel = (props) => {
    const s = useStore();
    const t = props.t;
    // Host routes (open-vscode/open-folder) send `code` on every known
    // failure branch; resolve it against 'error.<code>' and fall back to
    // the host's own `error` text (opaque, e.g. a raw exception message)
    // or a generic key when the response carries neither.
    const hostErrorStatus = (res) => {
        if (res && res.code) {
            return { ok: false, key: 'error.' + res.code, params: res.code === 'open-exit-code' ? { code: res.exitCode } : undefined };
        }
        if (res && res.error)
            return { ok: false, raw: res.error };
        return { ok: false, key: 'error.unknown' };
    };
    const activeTab = s.tabs.find((t) => t.path === s.activePath) || null;
    // `editor` = the tab currently VISIBLE in the preview pane; the
    // tabs survive while the pane is hidden, so editor is null then.
    const editor = s.previewOpen ? activeTab : null;
    const status = s.status;
    const currentSessionId = props.useSessions((st) => st.current);
    const wsItems = props.useWorkspaces((st) => st.items);
    const recentWorkspaceId = props.useWorkspaces((st) => st.recentWorkspaceId);
    let rootPath = null;
    let rootName = '';
    if (currentSessionId) {
        for (const w of wsItems) {
            if (w.sessionIds.indexOf(currentSessionId) >= 0) {
                rootPath = w.path;
                rootName = w.title;
                break;
            }
        }
    }
    if (!rootPath && recentWorkspaceId) {
        for (const w of wsItems) {
            if (w.workspaceId === recentWorkspaceId) {
                rootPath = w.path;
                rootName = w.title;
                break;
            }
        }
    }
    if (!rootPath && wsItems.length > 0) {
        rootPath = wsItems[0].path;
        rootName = wsItems[0].title;
    }
    const [tree, setTree] = react.useState(null);
    const [previewWidth, setPreviewWidth] = react.useState(600);
    const [drag, setDrag] = react.useState(null);
    // Re-click on the previewed file schedules a close; a following
    // double-click cancels it, so dblclick never flickers.
    const previewToggleRef = react.useRef(null);
    const clearPreviewToggle = () => {
        if (previewToggleRef.current !== null) {
            clearTimeout(previewToggleRef.current);
            previewToggleRef.current = null;
        }
    };
    react.useEffect(() => () => {
        if (previewToggleRef.current !== null)
            clearTimeout(previewToggleRef.current);
    }, []);
    const without = (set, v) => { const n = new Set(set); n.delete(v); return n; };
    const withVal = (set, v) => { const n = new Set(set); n.add(v); return n; };
    react.useEffect(() => {
        // Project switch: drop everything that belongs to the previous
        // root — preview/editor pane, status, search query and results —
        // so the new tree never surfaces a file previewed in another
        // project folder.
        const resetTransient = () => {
            store.query = '';
            store.matches = null;
            store.searching = false;
            store.searchError = null;
            setStatus(null);
            // (a)/(b): tabs whose file is inside the (new) project
            // folder survive; tabs from other folders are closed.
            filterTabs(rootPath);
        };
        if (!rootPath) {
            setTree(null);
            resetTransient();
            return;
        }
        store.rootPath = rootPath;
        resetTransient();
        let cancelled = false;
        setTree({ rootPath, rootName, expanded: new Set([rootPath]), cache: new Map(), loading: new Set([rootPath]), selected: null, errors: {} });
        api.list(rootPath).then((res) => {
            if (cancelled)
                return;
            setTree((t) => {
                if (!t || t.rootPath !== rootPath)
                    return t;
                const next = { ...t, loading: without(t.loading, rootPath) };
                if (res && res.error)
                    next.errors = { ...t.errors, [rootPath]: res.error };
                else
                    next.cache = new Map(t.cache).set(rootPath, (res && res.entries) || []);
                return next;
            });
        }).catch((err) => {
            if (cancelled)
                return;
            setTree((t) => {
                if (!t || t.rootPath !== rootPath)
                    return t;
                return { ...t, loading: without(t.loading, rootPath), errors: { ...t.errors, [rootPath]: String((err && err.message) || err) } };
            });
        });
        return () => { cancelled = true; };
    }, [rootPath]);
    // Native-style layout yield: while any right pane is visible, the
    // conversation column ([data-phase=active]) gets right padding
    // equal to the visible pane widths, so its content really reflows
    // instead of being covered. Tree and preview toggle independently:
    // closing the tree keeps the preview open (docked to the right edge).
    react.useEffect(() => {
        const root = document.documentElement;
        if (s.open || (s.previewOpen && activeTab))
            root.setAttribute('data-fe-panel-open', '');
        else
            root.removeAttribute('data-fe-panel-open');
        return () => {
            root.removeAttribute('data-fe-panel-open');
        };
    }, [s.open, s.previewOpen, s.activePath]);
    react.useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--fe-panel-width', (s.open ? s.width : 0) + 'px');
        root.style.setProperty('--fe-preview-width', (s.previewOpen && activeTab ? previewWidth : 0) + 'px');
    }, [s.width, previewWidth, s.open, s.previewOpen, s.activePath]);
    const loadChildren = (path) => {
        api.list(path).then((res) => {
            setTree((t) => {
                if (!t)
                    return t;
                const cache = new Map(t.cache);
                const errors = { ...t.errors };
                if (res && !res.error)
                    cache.set(path, (res && res.entries) || []);
                else
                    errors[path] = (res && res.error) || 'list failed';
                return { ...t, cache, errors, loading: without(t.loading, path) };
            });
        }).catch((err) => {
            setTree((t) => t ? { ...t, loading: without(t.loading, path), errors: { ...t.errors, [path]: String((err && err.message) || err) } } : t);
        });
    };
    const toggleDir = (path) => {
        setTree((t) => {
            if (!t)
                return t;
            if (t.expanded.has(path))
                return { ...t, expanded: without(t.expanded, path) };
            if (t.cache.has(path))
                return { ...t, expanded: withVal(t.expanded, path) };
            return { ...t, expanded: withVal(t.expanded, path), loading: withVal(t.loading, path) };
        });
        setTree((t) => {
            if (!t || t.cache.has(path) || !t.expanded.has(path))
                return t;
            loadChildren(path);
            return t;
        });
    };
    const selectFile = (path) => setTree((t) => t ? { ...t, selected: path } : t);
    const openFile = (entry, startEditing, toggle) => {
        const existing = s.tabs.find((t) => t.path === entry.path);
        if (existing) {
            if (existing.path !== s.activePath) {
                // Background tab: just bring it to the front (entering
                // edit mode too when requested by the edit button).
                clearPreviewToggle();
                activateTab(entry.path);
                if (startEditing && existing.state === 'ready' && !existing.editing) {
                    updateTab(entry.path, (t) => ({ ...t, editing: true, preview: false }));
                }
                return;
            }
            if (existing.editing) {
                clearPreviewToggle();
                return;
            }
            if (startEditing) {
                clearPreviewToggle();
                if (existing.state === 'ready' && !existing.editing) {
                    updateTab(entry.path, (t) => ({ ...t, editing: true, preview: false }));
                }
                return;
            }
            if (existing.state === 'ready' || existing.state === 'loading') {
                if (toggle) {
                    // Single click on the active tab's file closes the
                    // tab; a double-click arriving in the window
                    // cancels it.
                    clearPreviewToggle();
                    previewToggleRef.current = setTimeout(() => {
                        previewToggleRef.current = null;
                        closeTab(entry.path);
                        setStatus(null);
                    }, 220);
                }
                else {
                    clearPreviewToggle();
                }
                return;
            }
            // 'error' / 'too-large': fall through and re-open (retry).
        }
        clearPreviewToggle();
        selectFile(entry.path);
        addTab({ path: entry.path, name: entry.name, content: null, size: entry.size || 0, state: 'loading', editing: !!startEditing, preview: isMarkdown(entry.name) && !startEditing });
        activateTab(entry.path);
        setStatus(null);
        api.read(entry.path).then((res) => {
            updateTab(entry.path, (t) => {
                if (res && res.error)
                    return { ...t, state: 'error', message: res.error, editing: false, preview: false };
                if (res && res.tooLarge)
                    return { ...t, state: 'too-large', size: res.size, editing: false, preview: false };
                return { ...t, state: 'ready', content: res.content, size: res.size };
            });
        }).catch((err) => {
            updateTab(entry.path, (t) => ({ ...t, state: 'error', message: String((err && err.message) || err), editing: false, preview: false }));
        });
    };
    const findEntry = (t, path) => {
        const walk = (dir) => {
            const children = t.cache.get(dir);
            if (!children)
                return null;
            for (const e of children) {
                if (e.path === path)
                    return e;
                if (e.type === 'directory') {
                    const hit = walk(e.path);
                    if (hit)
                        return hit;
                }
            }
            return null;
        };
        return t && t.rootPath ? walk(t.rootPath) : null;
    };
    const onEditClick = () => {
        setStatus(null);
        if (editor && editor.state === 'ready') {
            updateTab(editor.path, (t) => t.editing
                ? { ...t, editing: false, preview: isMarkdown(t.name) }
                : { ...t, editing: true, preview: false });
        }
        else if (!editor && tree && tree.selected) {
            const sel = findEntry(tree, tree.selected);
            if (sel && sel.type !== 'directory')
                openFile(sel, true);
        }
    };
    const onSave = () => {
        if (!editor || editor.state !== 'ready')
            return;
        const path = editor.path;
        const content = editor.content;
        api.write(path, content).then((res) => {
            if (res && res.error)
                showStatus({ ok: false, key: 'error.saveFailed', params: { reason: res.error } });
            else {
                updateTab(path, (t) => ({ ...t, editing: false }));
                showStatus({ ok: true, key: 'status.saved' });
            }
        }).catch((err) => showStatus({ ok: false, key: 'error.saveFailed', params: { reason: String((err && err.message) || err) } }));
    };
    const refresh = () => {
        if (!tree || !tree.rootPath)
            return;
        const root = tree.rootPath;
        const name = tree.rootName;
        setTree({ rootPath: root, rootName: name, expanded: new Set([root]), cache: new Map(), loading: new Set([root]), selected: null, errors: {} });
        loadChildren(root);
    };
    const collectDirs = (t) => {
        const dirs = [];
        const walk = (dir) => {
            const children = t.cache.get(dir);
            if (!children)
                return;
            for (const e of children) {
                if (e.type === 'directory') {
                    dirs.push(e.path);
                    walk(e.path);
                }
            }
        };
        if (t.rootPath)
            walk(t.rootPath);
        return dirs;
    };
    const toggleAll = () => {
        if (!tree)
            return;
        // Clicking while an expansion is in flight collapses (and cancels) it.
        if (expandBusy || tree.expanded.size > 1)
            collapseAll();
        else
            expandAll();
    };
    // Real recursive expand: every directory is actually LOADED, not just
    // flagged, so deeper levels appear too. Collapse cancels the run.
    const expandAll = () => {
        if (!tree || !tree.rootPath || expandBusy)
            return;
        expandBusy = true;
        const token = ++expandToken;
        const visited = new Set();
        setTree((t) => {
            if (!t)
                return t;
            const dirs = collectDirs(t);
            const expanded = new Set(dirs);
            expanded.add(t.rootPath);
            const loading = new Set(t.loading);
            for (const d of dirs)
                loading.add(d);
            return { ...t, expanded, loading };
        });
        let loaded = 0;
        const work = async (dir) => {
            if (token !== expandToken || visited.has(dir) || loaded >= MAX_EXPAND_DIRS)
                return;
            visited.add(dir);
            loaded++;
            let entries = null;
            try {
                const res = await api.list(dir);
                entries = res && !res.error ? res.entries : null;
            }
            catch {
                entries = null;
            }
            if (token !== expandToken)
                return;
            setTree((t) => {
                if (!t)
                    return t;
                const cache = new Map(t.cache);
                const errors = { ...t.errors };
                if (entries)
                    cache.set(dir, entries);
                else
                    errors[dir] = 'load failed';
                const expanded = new Set(t.expanded);
                expanded.add(dir);
                const loading = new Set(t.loading);
                loading.delete(dir);
                return { ...t, cache, errors, expanded, loading };
            });
            if (entries) {
                const subs = [];
                for (const e of entries)
                    if (e.type === 'directory')
                        subs.push(e.path);
                await Promise.all(subs.map((p) => work(p)));
            }
        };
        work(tree.rootPath).then(() => {
            expandBusy = false;
            if (loaded >= MAX_EXPAND_DIRS) {
                showStatus({ ok: false, key: 'status.expandLimit', params: { count: MAX_EXPAND_DIRS } });
            }
        }).catch(() => { expandBusy = false; });
    };
    const collapseAll = () => {
        expandToken++;
        expandBusy = false;
        setTree((t) => t ? { ...t, expanded: new Set([t.rootPath]) } : t);
    };
    const onVscode = () => {
        if (!tree || !tree.rootPath)
            return;
        api.openVscode(tree.rootPath).then((res) => {
            if (res && res.ok)
                showStatus({ ok: true, key: 'status.openedVscode' });
            else
                showStatus(hostErrorStatus(res));
        }).catch((err) => showStatus({ ok: false, key: 'error.openFailed', params: { reason: String((err && err.message) || err) } }));
    };
    // Opens the selected item in the OS file manager (host decides:
    // directory opens directly, file is revealed in its folder);
    // falls back to the project root when nothing is selected.
    const onOpenFolder = () => {
        if (!tree || !tree.rootPath)
            return;
        const target = tree.selected || tree.rootPath;
        api.openFolder(target).then((res) => {
            if (res && res.ok)
                showStatus({ ok: true, key: tree.selected ? 'status.revealedInFolder' : 'status.openedFolder' });
            else
                showStatus(hostErrorStatus(res));
        }).catch((err) => showStatus({ ok: false, key: 'error.openFailed', params: { reason: String((err && err.message) || err) } }));
    };
    const onResizeStart = (kind, e) => {
        e.preventDefault();
        setDrag({ kind, startX: e.clientX, startWidth: kind === 'tree' ? s.width : previewWidth });
    };
    const onResizeMove = (e) => {
        if (!drag)
            return;
        if (drag.kind === 'tree') {
            store.width = Math.max(220, Math.min(1000, drag.startWidth + (drag.startX - e.clientX)));
            emit();
        }
        else {
            // preview: drag its LEFT edge; moving left widens the preview
            setPreviewWidth(Math.max(180, Math.min(1000, drag.startWidth + (drag.startX - e.clientX))));
        }
    };
    const endDrag = () => setDrag(null);
    const renderTree = () => {
        if (!tree || !tree.rootPath)
            return react.createElement('div', { className: 'fe-empty' }, t('tree.empty'));
        const rows = [];
        rows.push(react.createElement('div', {
            key: 'root',
            className: 'fe-row fe-row-root',
            style: { paddingLeft: 6 },
            onClick: () => toggleDir(tree.rootPath),
            title: tree.rootPath,
        }, react.createElement('span', { className: 'fe-chevron' }, react.createElement(Icon, { name: tree.expanded.has(tree.rootPath) ? 'chevronDown' : 'chevronRight', size: 12 })), react.createElement('span', { className: 'fe-node-icon fe-node-dir' }, react.createElement(Icon, { name: 'folder', size: 14 })), react.createElement('span', { className: 'fe-node-name', title: tree.rootName }, tree.rootName || tree.rootPath), tree.loading.has(tree.rootPath) ? react.createElement('span', { className: 'fe-node-loading' }, '…') : null));
        if (tree.expanded.has(tree.rootPath)) {
            const children = tree.cache.get(tree.rootPath);
            if (children) {
                for (const child of children) {
                    rows.push(react.createElement(TreeNode, { key: child.path, entry: child, depth: 1, tree, onToggle: toggleDir, onSelect: selectFile, onOpen: (e, toggle) => openFile(e, false, toggle) }));
                }
            }
            else if (!tree.loading.has(tree.rootPath) && tree.errors[tree.rootPath]) {
                rows.push(react.createElement('div', { key: 'err', className: 'fe-node-error', style: { paddingLeft: 20 } }, tree.errors[tree.rootPath]));
            }
        }
        return rows;
    };
    const renderSearch = () => {
        if (s.searching && !s.matches)
            return react.createElement('div', { className: 'fe-empty' }, t('search.searching'));
        if (s.searchError)
            return react.createElement('div', { className: 'fe-node-error' }, s.searchError);
        if (!s.matches || s.matches.length === 0)
            return react.createElement('div', { className: 'fe-empty' }, t('search.noMatches'));
        const rows = [];
        for (const m of s.matches) {
            const rel = m.path.slice(tree && tree.rootPath ? tree.rootPath.length : 0).replace(/^[\\/]+/, '');
            rows.push(react.createElement('div', {
                key: m.path,
                className: 'fe-row' + (tree && tree.selected === m.path ? ' fe-row-selected' : ''),
                style: { paddingLeft: 6 },
                onClick: () => m.type === 'directory' ? selectFile(m.path) : openFile(m, false, true),
                onDoubleClick: () => m.type === 'directory' ? selectFile(m.path) : openFile(m, false, false),
                title: m.path,
            }, react.createElement('span', { className: 'fe-node-icon fe-node-' + (m.type === 'directory' ? 'dir' : 'file') }, react.createElement(Icon, { name: m.type === 'directory' ? 'folder' : 'file', size: 14 })), react.createElement('span', { className: 'fe-node-name', title: m.name }, m.name), react.createElement('span', { className: 'fe-node-rel' }, rel || '.')));
        }
        if (s.truncated)
            rows.push(react.createElement('div', { key: 'trunc', className: 'fe-node-error' }, t('search.truncated', { count: SEARCH_TRUNC_LIMIT })));
        return rows;
    };
    // Browser-style tab strip: one tab per previewed file, the active
    // tab highlighted, each with its own close button. Tabs switch
    // without reloading; closed tabs fall back to a neighbour.
    const renderTabBar = () => {
        if (s.tabs.length === 0)
            return null;
        const items = s.tabs.map((t) => react.createElement('div', {
            key: t.path,
            className: 'fe-tab' + (t.path === s.activePath ? ' fe-tab-active' : ''),
            title: t.path,
            onClick: () => activateTab(t.path),
        }, react.createElement('span', { className: 'fe-tab-name' }, t.name), react.createElement('span', {
            className: 'fe-tab-close',
            title: props.t('tab.close'),
            onClick: (e) => { e.stopPropagation(); closeTab(t.path); setStatus(null); },
        }, react.createElement(Icon, { name: 'close', size: 10 }))));
        return react.createElement('div', { className: 'fe-tabbar' }, items);
    };
    const renderPreview = () => {
        if (!editor)
            return null;
        const isMd = isMarkdown(editor.name);
        const showPreview = isMd && !editor.editing && editor.preview && editor.state === 'ready';
        const head = react.createElement('div', { className: 'fe-editor-head' }, react.createElement('span', { className: 'fe-editor-name', title: editor.name }, editor.name), react.createElement('span', { className: 'fe-editor-path' }, editor.path), isMd && editor.state === 'ready' && !editor.editing
            ? react.createElement('button', { className: 'fe-btn', onClick: () => updateTab(editor.path, (t) => ({ ...t, preview: !t.preview })) }, editor.preview ? t('action.viewSource') : t('action.viewPreview'))
            : null, editor.state === 'ready' && editor.editing
            ? react.createElement('button', { className: 'fe-btn', onClick: onSave }, t('action.save'))
            : null, react.createElement('button', { className: 'fe-btn', onClick: () => { closePreviewPane(); setStatus(null); } }, t('action.collapsePreview')));
        let body = null;
        if (editor.state === 'loading')
            body = react.createElement('div', { className: 'fe-editor-msg' }, t('editor.loading'));
        else if (editor.state === 'error')
            body = react.createElement('div', { className: 'fe-editor-msg fe-err' }, editor.message);
        else if (editor.state === 'too-large')
            body = react.createElement('div', { className: 'fe-editor-msg' }, t('editor.tooLarge', { size: fmtSize(editor.size) }));
        else if (showPreview)
            body = react.createElement('div', { className: 'fe-md', dangerouslySetInnerHTML: { __html: renderMarkdown(editor.content) } });
        else if (!editor.editing) {
            const lang = hlLangFor(editor.name);
            body = lang && lang !== 'markdown' && lang !== 'text'
                ? react.createElement('pre', { className: 'fe-preview-plain fe-hl lang-' + lang, dangerouslySetInnerHTML: { __html: highlight(editor.content, lang) } })
                : react.createElement('pre', { className: 'fe-preview-plain' }, editor.content);
        }
        else
            body = react.createElement('textarea', {
                className: 'fe-editor-textarea',
                spellCheck: false,
                value: editor.content,
                onChange: (e) => updateTab(editor.path, (t) => ({ ...t, content: e.target.value })),
            });
        return react.createElement('div', { className: 'fe-preview-body' }, head, body);
    };
    if (!s.open && !editor)
        return null;
    // Each pane has its own ">" collapse tab on its left edge: the
    // preview tab closes only the preview, the tree tab only the tree.
    // With both panes open the tree's tab sits at the seam between
    // preview and tree; the leftmost pane's tab is on the chat edge.
    const treeTab = react.createElement('button', {
        className: 'fe-collapse-tab',
        title: t('action.collapseTree'),
        'aria-label': t('action.collapseTree'),
        onClick: () => setOpen(false),
    }, react.createElement(Icon, { name: 'chevronRight', size: 14 }));
    const previewTab = react.createElement('button', {
        className: 'fe-collapse-tab',
        title: t('action.collapsePreviewKeepTabs'),
        'aria-label': t('action.collapsePreviewKeepTabs'),
        onClick: () => { closePreviewPane(); setStatus(null); },
    }, react.createElement(Icon, { name: 'chevronRight', size: 14 }));
    const statusText = status ? (status.raw != null ? status.raw : t(status.key, status.params)) : null;
    const treePanel = s.open ? react.createElement('div', { className: 'fe-panel', style: { width: s.width + 'px' } }, react.createElement('div', { className: 'fe-resize', title: t('action.resizeHint'), onPointerDown: (e) => onResizeStart('tree', e) }), treeTab, react.createElement('div', { className: 'fe-header' }, react.createElement('span', { className: 'fe-title' }, t('panel.filesLabel')), react.createElement('button', { className: 'fe-iconbtn fe-icon-vscode', title: t('action.openInVscode'), onClick: onVscode }, react.createElement(Icon, { name: 'vscode', size: 15 })), react.createElement('button', { className: 'fe-iconbtn', title: (tree && tree.selected) ? t('action.revealInFileManager') : t('action.openInFileManager'), onClick: onOpenFolder }, react.createElement(Icon, { name: 'openInNew', size: 15 })), react.createElement('button', { className: 'fe-iconbtn', title: t('action.expandCollapseAll'), onClick: toggleAll }, react.createElement(Icon, { name: 'chevronDown', size: 14 })), react.createElement('button', { className: 'fe-iconbtn', title: t('action.refresh'), onClick: refresh }, react.createElement(Icon, { name: 'refresh', size: 14 })), react.createElement('button', { className: 'fe-iconbtn' + (editor && editor.editing ? ' fe-iconbtn-on' : ''), title: t('action.edit'), onClick: onEditClick }, react.createElement(Icon, { name: 'edit', size: 14 })), react.createElement('button', { className: 'fe-iconbtn', title: t('action.collapseTree'), onClick: () => setOpen(false) }, react.createElement(Icon, { name: 'close', size: 14 }))), react.createElement('div', { className: 'fe-searchbar' }, react.createElement('input', { className: 'fe-search', type: 'text', placeholder: t('search.placeholder'), value: s.query, spellCheck: false, onChange: (e) => setQuery(e.target.value) }), s.searching ? react.createElement('span', { className: 'fe-search-state' }, '…') : null), status ? react.createElement('div', { className: 'fe-status ' + (status.ok ? 'fe-status-ok' : 'fe-status-err') }, statusText) : null, react.createElement('div', { className: 'fe-tree' }, s.query.trim() ? renderSearch() : renderTree())) : null;
    const previewPane = editor
        ? react.createElement('div', {
            className: 'fe-preview',
            // Dock to the right edge when the tree is collapsed.
            style: { right: (s.open ? s.width : 0) + 'px', width: previewWidth + 'px', maxWidth: 'calc(100vw - ' + (s.open ? s.width : 0) + 'px - 12px)' },
        }, react.createElement('div', { className: 'fe-preview-resize', title: t('action.resizeHint'), onPointerDown: (e) => onResizeStart('preview', e) }), previewTab, renderTabBar(), renderPreview())
        : null;
    return react.createElement('div', { className: 'fe-overlay-root' }, drag ? react.createElement('div', { className: 'fe-drag-capture', onPointerMove: onResizeMove, onPointerUp: endDrag, onPointerLeave: endDrag }) : null, treePanel, previewPane);
};
function apply(ctx) {
    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
    ctx.effect(() => () => { styleEl.remove(); }, 'file-explorer: styles');
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'file-explorer: dictionaries');
    const t = ctx.locale.bind(NS);
    // Double-click anywhere on the chat interface collapses BOTH the
    // tree and the preview pane. The (a)/(b) project filter applies:
    // tabs whose file lives inside the current project folder are
    // kept (hidden) and restored when the tree reopens; tabs from
    // other folders are closed. Editable fields and interactive
    // controls are excluded so normal double-click behaviors (word
    // select, edit, follow) keep working. The conversation column
    // carries data-phase (active/hero); the overlay lives outside it.
    const onChatDblClick = (e) => {
        if (!store.open && !store.previewOpen)
            return;
        const target = e.target;
        if (!target || typeof target.closest !== 'function')
            return;
        if (target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"]'))
            return;
        const root = target.closest('[data-phase]');
        if (!root)
            return;
        const phase = root.getAttribute('data-phase');
        if (phase !== 'active' && phase !== 'hero')
            return;
        setOpen(false);
        // Keep in-project tabs (hidden), close out-of-project ones;
        // mark the pane for restore when the tree reopens.
        const kept = filterTabs(store.rootPath);
        store.previewOpen = false;
        store.previewRestoreOnTreeOpen = kept;
        emit();
        setStatus(null);
    };
    document.addEventListener('dblclick', onChatDblClick);
    ctx.effect(() => () => { document.removeEventListener('dblclick', onChatDblClick); }, 'file-explorer: chat dblclick collapse');
    const slots = ctx.get('slots');
    if (slots === undefined)
        return;
    slots.inject('shell.overlay', () => slots.register({ name: 'shell.overlay', id: 'file-explorer', order: 90, locale: NS, label: () => t('panel.title') }, (props) => react.createElement(ExplorerPanel, props)));
    slots.inject('conversation.session.header.actions', () => slots.register({ name: 'conversation.session.header.actions', id: 'file-explorer-toggle', order: 30, locale: NS, label: () => t('panel.title') }, (props) => react.createElement(ToggleButton, props)));
}
export { apply, inject };
//# sourceMappingURL=index.js.map