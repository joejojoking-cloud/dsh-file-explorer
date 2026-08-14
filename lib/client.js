window.__ModuleLoader__.load({
	id: "dsh-file-explorer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var react = require("react");

		// ---------- styles ----------
		const CSS = `
html {
  --fe-panel-width: 340px;
  --fe-preview-width: 0px;
  --fe-panel-shift: calc(var(--fe-panel-width) + var(--fe-preview-width) + 12px);
}
html[data-fe-panel-open] [data-phase=active] {
  box-sizing: border-box;
  padding-right: var(--fe-panel-shift);
}
[data-phase=active] {
  will-change: padding-right;
  transition: padding-right .36s cubic-bezier(.22,1,.36,1);
}
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
		};

		const inject = ["slots"];

		// Expand-all/collapse-all coordination, stable across renders (the panel
		// is a single instance per page). A token bump cancels an in-flight run.
		let expandToken = 0;
		let expandBusy = false;
		const MAX_EXPAND_DIRS = 500;

		// ---------- shared store (open/width/search) ----------
		const store = {
			open: false,
			width: 340,
			rootPath: null,
			query: '',
			searching: false,
			searchError: null,
			matches: null,
			truncated: false,
			listeners: new Set(),
		};
		const emit = () => { for (const fn of Array.from(store.listeners)) fn() };
		const subscribe = (fn) => { store.listeners.add(fn); return () => { store.listeners.delete(fn) } };
		const setOpen = (value) => { store.open = !!value; emit() };
		const toggleOpen = () => setOpen(!store.open);

		let searchTimer = null;
		const doSearch = (q) => {
			store.searching = true;
			store.searchError = null;
			emit();
			api.search(store.rootPath, q).then((res) => {
				if (store.query !== q) return;
				store.searching = false;
				if (res && res.error) store.searchError = res.error;
				else { store.matches = (res && res.matches) || []; store.truncated = !!(res && res.truncated); }
				emit();
			}).catch((err) => {
				if (store.query !== q) return;
				store.searching = false;
				store.searchError = String((err && err.message) || err);
				emit();
			});
		};
		const runSearch = (raw) => {
			const q = String(raw || '').trim();
			if (store.query !== q) return;
			if (!q) { store.matches = null; store.searching = false; store.searchError = null; emit(); return }
			if (searchTimer !== null) clearTimeout(searchTimer);
			searchTimer = setTimeout(() => { searchTimer = null; doSearch(q) }, 300);
		};
		const setQuery = (value) => { store.query = String(value || ''); emit(); runSearch(store.query) };

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
			if (task) return '<input type="checkbox" disabled' + (task[1] !== ' ' ? ' checked' : '') + ' /> ' + mdInline(task[2]);
			return mdInline(content);
		};
		const splitRow = (line) => {
			let s = String(line).trim();
			if (s.startsWith('|')) s = s.slice(1);
			if (s.endsWith('|')) s = s.slice(0, -1);
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
				if (e.indent < minIndent) break;
				if (e.indent === minIndent) {
					if (currentType !== e.type) {
						if (open) out += '</' + currentType + '>';
						currentType = e.type;
						out += '<' + currentType + '>';
						open = true;
					}
					let itemHtml = '<li>' + itemContent(e.content);
					if (i + 1 < entries.length && entries[i + 1].indent > minIndent) {
						const sub = buildListHtml(entries, i + 1, entries[i + 1].indent);
						itemHtml += sub.out;
						i = sub.next;
					} else {
						i++;
					}
					itemHtml += '</li>';
					out += itemHtml;
				} else {
					i++;
				}
			}
			if (open) out += '</' + currentType + '>';
			return { out, next: i };
		};
		const renderMarkdown = (text) => {
			const lines = String(text).replace(/\r\n/g, '\n').split('\n');
			const out = [];
			let inCode = false;
			let codeLines = [];
			const flushCode = () => { if (inCode) { out.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>'); codeLines = []; inCode = false } };
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (/^```/.test(line.trim())) {
					if (inCode) {
						flushCode(); // closing fence: exit code mode and push the block
					} else {
						inCode = true;
						codeLines = [];
					}
					continue;
				}
				if (inCode) { codeLines.push(line); continue }
				// GFM table: header row + separator row
				if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
					const header = splitRow(line);
					const aligns = splitRow(lines[i + 1]).map((c) => {
						if (/^:.*:$/.test(c)) return 'center';
						if (/^:/.test(c)) return 'left';
						if (/:$/.test(c)) return 'right';
						return '';
					});
					const rows = [];
					i += 2;
					while (i < lines.length && /^\s*\|/.test(lines[i]) && !isTableSep(lines[i])) {
						rows.push(splitRow(lines[i]));
						i++;
					}
					i--;
					const cell = (content, tag, idx) => {
						const align = aligns[Math.min(idx, aligns.length - 1)];
						return '<' + tag + (align ? ' style="text-align:' + align + '"' : '') + '>' + mdInline(content) + '</' + tag + '>';
					};
					let html = '<table><thead><tr>';
					header.forEach((c, idx) => { html += cell(c, 'th', idx) });
					html += '</tr></thead><tbody>';
					for (const row of rows) {
						html += '<tr>';
						row.forEach((c, idx) => { html += cell(c, 'td', idx) });
						html += '</tr>';
					}
					html += '</tbody></table>';
					out.push(html);
					continue;
				}
				const heading = /^(#{1,6})\s+(.*)$/.exec(line);
				if (heading) { out.push('<h' + heading[1].length + '>' + mdInline(heading[2]) + '</h' + heading[1].length + '>'); continue }
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
						if (!m) break;
						entries.push({ indent: m[1].length, type: bl ? 'ul' : 'ol', content: m[2] });
						j++;
					}
					out.push(buildListHtml(entries, 0, entries[0].indent).out);
					i = j - 1;
					continue;
				}
				const quote = /^\s*>\s?(.*)$/.exec(line);
				if (quote) { out.push('<blockquote>' + mdInline(quote[1]) + '</blockquote>'); continue }
				if (/^\s*-+\s*$/.test(line)) { out.push('<hr/>'); continue }
				if (line.trim() === '') continue;
				out.push('<p>' + mdInline(line) + '</p>');
			}
			flushCode();
			return out.join('');
		};

		// ---------- icons ----------
		const iconPaths = {
			vscode: 'M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74l3.06 2.26-3.06 2.26a1 1 0 0 0 .001 1.479L1.65 15.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 18.06V5.94a1.5 1.5 0 0 0-.85-1.353zm-5.105 14.698L9.429 12l8.616-5.285z',
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
			if (n === null || n === undefined) return '';
			if (n < 1024) return n + ' B';
			if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
			if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
			return (n / 1073741824).toFixed(1) + ' GB';
		};

		// ---------- header toggle button ----------
		const ToggleButton = () => {
			const s = useStore();
			return react.createElement('button', {
				className: 'fe-toggle' + (s.open ? ' fe-toggle-on' : ''),
				title: '文件资源管理器',
				'aria-label': '文件资源管理器',
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
				onClick: () => isDir ? props.onToggle(entry.path) : props.onOpen(entry),
				onDoubleClick: () => props.onOpen(entry),
				title: entry.path,
			},
				react.createElement('span', { className: 'fe-chevron' + (isDir ? '' : ' fe-chevron-none') }, isDir
					? react.createElement(Icon, { name: expanded ? 'chevronDown' : 'chevronRight', size: 12 })
					: null),
				react.createElement('span', { className: 'fe-node-icon fe-node-' + (isDir ? 'dir' : 'file') },
					react.createElement(Icon, { name: isDir ? 'folder' : 'file', size: 14 })),
				react.createElement('span', { className: 'fe-node-name', title: entry.name }, entry.name),
				isDir && loading ? react.createElement('span', { className: 'fe-node-loading' }, '…') : null,
				!isDir && typeof entry.size === 'number' ? react.createElement('span', { className: 'fe-node-size' }, fmtSize(entry.size)) : null,
			);
			const nodes = [row];
			if (isDir && expanded) {
				if (children) {
					for (const child of children) {
						nodes.push(react.createElement(TreeNode, { key: child.path, entry: child, depth: props.depth + 1, tree, onToggle: props.onToggle, onSelect: props.onSelect, onOpen: props.onOpen }));
					}
				} else if (!loading && error) {
					nodes.push(react.createElement('div', { key: '__err', className: 'fe-node-error', style: { paddingLeft: 6 + (props.depth + 1) * 14 } }, error));
				}
			}
			return react.createElement('div', { className: 'fe-node' }, ...nodes);
		};

		// ---------- main panel ----------
		const ExplorerPanel = (props) => {
			const s = useStore();
			const currentSessionId = props.useSessions((st) => st.current);
			const wsItems = props.useWorkspaces((st) => st.items);
			const recentWorkspaceId = props.useWorkspaces((st) => st.recentWorkspaceId);

			let rootPath = null;
			let rootName = '';
			if (currentSessionId) {
				for (const w of wsItems) {
					if (w.sessionIds.indexOf(currentSessionId) >= 0) { rootPath = w.path; rootName = w.title; break }
				}
			}
			if (!rootPath && recentWorkspaceId) {
				for (const w of wsItems) {
					if (w.workspaceId === recentWorkspaceId) { rootPath = w.path; rootName = w.title; break }
				}
			}
			if (!rootPath && wsItems.length > 0) { rootPath = wsItems[0].path; rootName = wsItems[0].title }

			const [tree, setTree] = react.useState(null);
			const [editor, setEditor] = react.useState(null);
			const [status, setStatus] = react.useState(null);
			const [previewWidth, setPreviewWidth] = react.useState(400);
			const [drag, setDrag] = react.useState(null);

			let statusSeq = 0;
			const showStatus = (msg) => {
				const seq = ++statusSeq;
				setStatus(msg);
				setTimeout(() => { if (seq === statusSeq) setStatus(null) }, 4000);
			};

			const without = (set, v) => { const n = new Set(set); n.delete(v); return n };
			const withVal = (set, v) => { const n = new Set(set); n.add(v); return n };

			react.useEffect(() => {
				if (!rootPath) { setTree(null); return }
				store.rootPath = rootPath;
				let cancelled = false;
				setTree({ rootPath, rootName, expanded: new Set([rootPath]), cache: new Map(), loading: new Set([rootPath]), selected: null, errors: {} });
				api.list(rootPath).then((res) => {
					if (cancelled) return;
					setTree((t) => {
						if (!t || t.rootPath !== rootPath) return t;
						const next = { ...t, loading: without(t.loading, rootPath) };
						if (res && res.error) next.errors = { ...t.errors, [rootPath]: res.error };
						else next.cache = new Map(t.cache).set(rootPath, (res && res.entries) || []);
						return next;
					});
				}).catch((err) => {
					if (cancelled) return;
					setTree((t) => {
						if (!t || t.rootPath !== rootPath) return t;
						return { ...t, loading: without(t.loading, rootPath), errors: { ...t.errors, [rootPath]: String((err && err.message) || err) } };
					});
				});
				return () => { cancelled = true };
			}, [rootPath]);

			// Native-style layout yield: while the panel is open, the conversation
			// column ([data-phase=active]) gets right padding equal to the tree +
			// preview widths, so its content really reflows instead of being covered.
			react.useEffect(() => {
				const root = document.documentElement;
				if (s.open) root.setAttribute('data-fe-panel-open', '');
				else root.removeAttribute('data-fe-panel-open');
				return () => {
					root.removeAttribute('data-fe-panel-open');
				};
			}, [s.open]);
			react.useEffect(() => {
				const root = document.documentElement;
				root.style.setProperty('--fe-panel-width', s.width + 'px');
				root.style.setProperty('--fe-preview-width', (editor ? previewWidth : 0) + 'px');
			}, [s.width, previewWidth, editor ? 1 : 0]);

			const loadChildren = (path) => {
				api.list(path).then((res) => {
					setTree((t) => {
						if (!t) return t;
						const cache = new Map(t.cache);
						const errors = { ...t.errors };
						if (res && !res.error) cache.set(path, (res && res.entries) || []);
						else errors[path] = (res && res.error) || 'list failed';
						return { ...t, cache, errors, loading: without(t.loading, path) };
					});
				}).catch((err) => {
					setTree((t) => t ? { ...t, loading: without(t.loading, path), errors: { ...t.errors, [path]: String((err && err.message) || err) } } : t);
				});
			};

			const toggleDir = (path) => {
				setTree((t) => {
					if (!t) return t;
					if (t.expanded.has(path)) return { ...t, expanded: without(t.expanded, path) };
					if (t.cache.has(path)) return { ...t, expanded: withVal(t.expanded, path) };
					return { ...t, expanded: withVal(t.expanded, path), loading: withVal(t.loading, path) };
				});
				setTree((t) => {
					if (!t || t.cache.has(path) || !t.expanded.has(path)) return t;
					loadChildren(path);
					return t;
				});
			};

			const selectFile = (path) => setTree((t) => t ? { ...t, selected: path } : t);

			const openFile = (entry, startEditing) => {
				if (editor && editor.path === entry.path && (editor.state === 'ready' || editor.state === 'loading')) {
					if (startEditing && editor.state === 'ready' && !editor.editing) {
						setEditor((e) => ({ ...e, editing: true, preview: false }));
					}
					return;
				}
				selectFile(entry.path);
				setEditor({ path: entry.path, name: entry.name, content: null, size: entry.size || 0, state: 'loading', editing: !!startEditing, preview: isMarkdown(entry.name) && !startEditing });
				setStatus(null);
				api.read(entry.path).then((res) => {
					setEditor((e) => {
						if (!e || e.path !== entry.path) return e;
						if (res && res.error) return { ...e, state: 'error', message: res.error, editing: false, preview: false };
						if (res && res.tooLarge) return { ...e, state: 'too-large', size: res.size, editing: false, preview: false };
						return { ...e, state: 'ready', content: res.content, size: res.size };
					});
				}).catch((err) => {
					setEditor((e) => e && e.path === entry.path ? { ...e, state: 'error', message: String((err && err.message) || err), editing: false, preview: false } : e);
				});
			};

			const findEntry = (t, path) => {
				const walk = (dir) => {
					const children = t.cache.get(dir);
					if (!children) return null;
					for (const e of children) {
						if (e.path === path) return e;
						if (e.type === 'directory') { const hit = walk(e.path); if (hit) return hit }
					}
					return null;
				};
				return t && t.rootPath ? walk(t.rootPath) : null;
			};

			const onEditClick = () => {
				setStatus(null);
				if (editor && editor.state === 'ready') {
					setEditor((e) => e.editing
						? { ...e, editing: false, preview: isMarkdown(e.name) }
						: { ...e, editing: true, preview: false });
				} else if (!editor && tree && tree.selected) {
					const sel = findEntry(tree, tree.selected);
					if (sel && sel.type !== 'directory') openFile(sel, true);
				}
			};

			const onSave = () => {
				if (!editor || editor.state !== 'ready') return;
				const path = editor.path;
				const content = editor.content;
				api.write(path, content).then((res) => {
					if (res && res.error) showStatus({ ok: false, text: '保存失败：' + res.error });
					else {
						setEditor((e) => e && e.path === path ? { ...e, editing: false } : e);
						showStatus({ ok: true, text: '已保存' });
					}
				}).catch((err) => showStatus({ ok: false, text: '保存失败：' + String((err && err.message) || err) }));
			};

			const refresh = () => {
				if (!tree || !tree.rootPath) return;
				const root = tree.rootPath;
				const name = tree.rootName;
				setTree({ rootPath: root, rootName: name, expanded: new Set([root]), cache: new Map(), loading: new Set([root]), selected: null, errors: {} });
				loadChildren(root);
			};

			const collectDirs = (t) => {
				const dirs = [];
				const walk = (dir) => {
					const children = t.cache.get(dir);
					if (!children) return;
					for (const e of children) {
						if (e.type === 'directory') { dirs.push(e.path); walk(e.path) }
					}
				};
				if (t.rootPath) walk(t.rootPath);
				return dirs;
			};

			const toggleAll = () => {
				if (!tree) return;
				// Clicking while an expansion is in flight collapses (and cancels) it.
				if (expandBusy || tree.expanded.size > 1) collapseAll();
				else expandAll();
			};

			// Real recursive expand: every directory is actually LOADED, not just
			// flagged, so deeper levels appear too. Collapse cancels the run.
			const expandAll = () => {
				if (!tree || !tree.rootPath || expandBusy) return;
				expandBusy = true;
				const token = ++expandToken;
				const visited = new Set();
				setTree((t) => {
					if (!t) return t;
					const dirs = collectDirs(t);
					const expanded = new Set(dirs);
					expanded.add(t.rootPath);
					const loading = new Set(t.loading);
					for (const d of dirs) loading.add(d);
					return { ...t, expanded, loading };
				});
				let loaded = 0;
				const work = async (dir) => {
					if (token !== expandToken || visited.has(dir) || loaded >= MAX_EXPAND_DIRS) return;
					visited.add(dir);
					loaded++;
					let entries = null;
					try {
						const res = await api.list(dir);
						entries = res && !res.error ? res.entries : null;
					} catch { entries = null }
					if (token !== expandToken) return;
					setTree((t) => {
						if (!t) return t;
						const cache = new Map(t.cache);
						const errors = { ...t.errors };
						if (entries) cache.set(dir, entries);
						else errors[dir] = 'load failed';
						const expanded = new Set(t.expanded);
						expanded.add(dir);
						const loading = new Set(t.loading);
						loading.delete(dir);
						return { ...t, cache, errors, expanded, loading };
					});
					if (entries) {
						const subs = [];
						for (const e of entries) if (e.type === 'directory') subs.push(e.path);
						await Promise.all(subs.map((p) => work(p)));
					}
				};
				work(tree.rootPath).then(() => {
					expandBusy = false;
					if (loaded >= MAX_EXPAND_DIRS) {
						showStatus({ ok: false, text: '目录较多，已展开前 ' + MAX_EXPAND_DIRS + ' 个目录' });
					}
				}).catch(() => { expandBusy = false });
			};

			const collapseAll = () => {
				expandToken++;
				expandBusy = false;
				setTree((t) => t ? { ...t, expanded: new Set([t.rootPath]) } : t);
			};

			const onVscode = () => {
				if (!tree || !tree.rootPath) return;
				api.openVscode(tree.rootPath).then((res) => {
					showStatus(res && res.ok
						? { ok: true, text: '已在 VS Code 中打开项目' }
						: { ok: false, text: (res && res.error) || '打开失败（未检测到 code 命令）' });
				}).catch((err) => showStatus({ ok: false, text: '打开失败：' + String((err && err.message) || err) }));
			};

			const onResizeStart = (kind, e) => {
				e.preventDefault();
				setDrag({ kind, startX: e.clientX, startWidth: kind === 'tree' ? s.width : previewWidth });
			};
			const onResizeMove = (e) => {
				if (!drag) return;
				if (drag.kind === 'tree') {
					store.width = Math.max(220, Math.min(1000, drag.startWidth + (drag.startX - e.clientX)));
					emit();
				} else {
					// preview: drag its LEFT edge; moving left widens the preview
					setPreviewWidth(Math.max(180, Math.min(1000, drag.startWidth + (drag.startX - e.clientX))));
				}
			};
			const endDrag = () => setDrag(null);

			const renderTree = () => {
				if (!tree || !tree.rootPath) return react.createElement('div', { className: 'fe-empty' }, '未找到当前工作区');
				const rows = [];
				rows.push(react.createElement('div', {
					key: 'root',
					className: 'fe-row fe-row-root',
					style: { paddingLeft: 6 },
					onClick: () => toggleDir(tree.rootPath),
					title: tree.rootPath,
				},
					react.createElement('span', { className: 'fe-chevron' }, react.createElement(Icon, { name: tree.expanded.has(tree.rootPath) ? 'chevronDown' : 'chevronRight', size: 12 })),
					react.createElement('span', { className: 'fe-node-icon fe-node-dir' }, react.createElement(Icon, { name: 'folder', size: 14 })),
					react.createElement('span', { className: 'fe-node-name', title: tree.rootName }, tree.rootName || tree.rootPath),
					tree.loading.has(tree.rootPath) ? react.createElement('span', { className: 'fe-node-loading' }, '…') : null,
				));
				if (tree.expanded.has(tree.rootPath)) {
					const children = tree.cache.get(tree.rootPath);
					if (children) {
						for (const child of children) {
							rows.push(react.createElement(TreeNode, { key: child.path, entry: child, depth: 1, tree, onToggle: toggleDir, onSelect: selectFile, onOpen: (e) => openFile(e, false) }));
						}
					} else if (!tree.loading.has(tree.rootPath) && tree.errors[tree.rootPath]) {
						rows.push(react.createElement('div', { key: 'err', className: 'fe-node-error', style: { paddingLeft: 20 } }, tree.errors[tree.rootPath]));
					}
				}
				return rows;
			};

			const renderSearch = () => {
				if (s.searching && !s.matches) return react.createElement('div', { className: 'fe-empty' }, '搜索中…');
				if (s.searchError) return react.createElement('div', { className: 'fe-node-error' }, s.searchError);
				if (!s.matches || s.matches.length === 0) return react.createElement('div', { className: 'fe-empty' }, '没有匹配的文件');
				const rows = [];
				for (const m of s.matches) {
					const rel = m.path.slice(tree && tree.rootPath ? tree.rootPath.length : 0).replace(/^[\\/]+/, '');
					rows.push(react.createElement('div', {
						key: m.path,
						className: 'fe-row' + (tree && tree.selected === m.path ? ' fe-row-selected' : ''),
						style: { paddingLeft: 6 },
						onClick: () => m.type === 'directory' ? selectFile(m.path) : openFile(m, false),
						onDoubleClick: () => m.type === 'directory' ? selectFile(m.path) : openFile(m, false),
						title: m.path,
					},
						react.createElement('span', { className: 'fe-node-icon fe-node-' + (m.type === 'directory' ? 'dir' : 'file') }, react.createElement(Icon, { name: m.type === 'directory' ? 'folder' : 'file', size: 14 })),
						react.createElement('span', { className: 'fe-node-name', title: m.name }, m.name),
						react.createElement('span', { className: 'fe-node-rel' }, rel || '.'),
					));
				}
				if (s.truncated) rows.push(react.createElement('div', { key: 'trunc', className: 'fe-node-error' }, '结果过多，已截断（前 300 条）'));
				return rows;
			};

			const renderPreview = () => {
				if (!editor) return null;
				const isMd = isMarkdown(editor.name);
				const showPreview = isMd && !editor.editing && editor.preview && editor.state === 'ready';
				const head = react.createElement('div', { className: 'fe-editor-head' },
					react.createElement('span', { className: 'fe-editor-name', title: editor.name }, editor.name),
					react.createElement('span', { className: 'fe-editor-path' }, editor.path),
					isMd && editor.state === 'ready' && !editor.editing
						? react.createElement('button', { className: 'fe-btn', onClick: () => setEditor((e) => ({ ...e, preview: !e.preview })) }, editor.preview ? '源码' : '预览')
						: null,
					editor.state === 'ready' && editor.editing
						? react.createElement('button', { className: 'fe-btn', onClick: onSave }, '保存')
						: null,
					react.createElement('button', { className: 'fe-btn', onClick: () => { setEditor(null); setStatus(null) } }, '关闭'),
				);
				let body = null;
				if (editor.state === 'loading') body = react.createElement('div', { className: 'fe-editor-msg' }, '加载中…');
				else if (editor.state === 'error') body = react.createElement('div', { className: 'fe-editor-msg fe-err' }, editor.message);
				else if (editor.state === 'too-large') body = react.createElement('div', { className: 'fe-editor-msg' }, '文件过大（' + fmtSize(editor.size) + '），不支持预览');
				else if (showPreview) body = react.createElement('div', { className: 'fe-md', dangerouslySetInnerHTML: { __html: renderMarkdown(editor.content) } });
				else if (!editor.editing) body = react.createElement('pre', { className: 'fe-preview-plain' }, editor.content);
				else body = react.createElement('textarea', {
					className: 'fe-editor-textarea',
					spellCheck: false,
					value: editor.content,
					onChange: (e) => setEditor((prev) => ({ ...prev, content: e.target.value })),
				});
				return react.createElement('div', { className: 'fe-preview-body' }, head, body);
			};

			if (!s.open) return null;
			const treePanel = react.createElement('div', { className: 'fe-panel', style: { width: s.width + 'px' } },
				react.createElement('div', { className: 'fe-resize', title: '拖动调整宽度', onPointerDown: (e) => onResizeStart('tree', e) }),
				react.createElement('div', { className: 'fe-header' },
					react.createElement('span', { className: 'fe-title' }, '文件'),
					react.createElement('button', { className: 'fe-iconbtn fe-icon-vscode', title: '在 Visual Studio Code 中打开项目', onClick: onVscode }, react.createElement(Icon, { name: 'vscode', size: 15 })),
					react.createElement('button', { className: 'fe-iconbtn', title: '全部展开 / 全部折叠', onClick: toggleAll }, react.createElement(Icon, { name: 'chevronDown', size: 14 })),
					react.createElement('button', { className: 'fe-iconbtn', title: '刷新', onClick: refresh }, react.createElement(Icon, { name: 'refresh', size: 14 })),
					react.createElement('button', { className: 'fe-iconbtn' + (editor && editor.editing ? ' fe-iconbtn-on' : ''), title: '编辑', onClick: onEditClick }, react.createElement(Icon, { name: 'edit', size: 14 })),
					react.createElement('button', { className: 'fe-iconbtn', title: '关闭', onClick: () => setOpen(false) }, react.createElement(Icon, { name: 'close', size: 14 })),
				),
				react.createElement('div', { className: 'fe-searchbar' },
					react.createElement('input', { className: 'fe-search', type: 'text', placeholder: '搜索文件', value: s.query, spellCheck: false, onChange: (e) => setQuery(e.target.value) }),
					s.searching ? react.createElement('span', { className: 'fe-search-state' }, '…') : null,
				),
				status ? react.createElement('div', { className: 'fe-status ' + (status.ok ? 'fe-status-ok' : 'fe-status-err') }, status.text) : null,
				react.createElement('div', { className: 'fe-tree' }, s.query.trim() ? renderSearch() : renderTree()),
			);
			const previewPane = editor
				? react.createElement('div', {
					className: 'fe-preview',
					style: { right: s.width + 'px', width: previewWidth + 'px', maxWidth: 'calc(100vw - ' + s.width + 'px - 12px)' },
				},
					react.createElement('div', { className: 'fe-preview-resize', title: '拖动调整宽度', onPointerDown: (e) => onResizeStart('preview', e) }),
					renderPreview(),
				)
				: null;
			return react.createElement('div', { className: 'fe-overlay-root' },
				drag ? react.createElement('div', { className: 'fe-drag-capture', onPointerMove: onResizeMove, onPointerUp: endDrag, onPointerLeave: endDrag }) : null,
				treePanel,
				previewPane,
			);
		};

		function apply(ctx) {
			const styleEl = document.createElement('style');
			styleEl.textContent = CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => { styleEl.remove() }, 'file-explorer: styles');

			const slots = ctx.get('slots');
			if (slots === undefined) return;
			slots.inject('shell.overlay', () => slots.register(
				{ name: 'shell.overlay', id: 'file-explorer', order: 90, label: '文件资源管理器' },
				(props) => react.createElement(ExplorerPanel, props),
			));
			slots.inject('conversation.session.header.actions', () => slots.register(
				{ name: 'conversation.session.header.actions', id: 'file-explorer-toggle', order: 30, label: '文件资源管理器' },
				(props) => react.createElement(ToggleButton, props),
			));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
