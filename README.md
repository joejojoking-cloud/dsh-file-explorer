# dsh-file-explorer

> **File Explorer for DeepSeek Harness** — right-side resizable file tree with Markdown rendering, syntax highlighting, in-panel editing, and one-click VS Code / system file manager open. Install: `dsh plugin --profile web add dsh-file-explorer`.

DeepSeek Harness 的全局文件资源管理器插件：在任何会话的标题栏右侧提供文件夹切换按钮，点击后在页面**右侧**打开可调宽度的文件树面板。

## 功能

- 右侧面板（`shell.overlay`，可开关）：文件树与文件预览**独立收起**——各自左边缘有「>」按钮，收起文件树时预览保留并自动靠到页面右边缘；预览面板收起时标签全部保留，点树中文件即恢复；左边缘拖拽调宽（260–900px）
- 预览标签化：浏览器式多标签——每个文件一个标签，按打开顺序排列、点击后台标签不改变顺序，标签条溢出时横向滚动，点击切换不重新加载，标签带 × 可单独关闭，全部关完面板消失
- 双击聊天区：同时收起两个窗口，并按**项目过滤**——属于当前项目文件夹的预览标签保留，重新打开文件浏览器时自动恢复；不属于的关闭
- 标题栏：「文件」+ 六个图标 —— VS Code（在 VS Code 中打开整个工作区）、系统文件浏览器（在系统文件管理器中打开当前选中项：选中目录直接打开、选中文件在所在文件夹中定位高亮，未选中时打开项目根目录）、全部展开/折叠、刷新、编辑、收起文件树（预览保留）
- 搜索框「搜索文件」：递归扫描工作区（跳过 `.git` / `node_modules`，最多 300 条）
- 文件树：根目录默认展开，目录点击展开/折叠（懒加载），文件单击/双击打开预览
- 预览：`.md` 渲染 Markdown（标题/列表/代码块/引用/链接），Markdown 代码块按围栏语言高亮；其他文本文件按扩展名自动语法高亮（JSON / YAML / JS / TS / Python / C / C++ / Java / Go / Rust / Shell / SQL / TOML / INI / CSS / HTML 等）；「编辑」图标进入可编辑模式，保存写回磁盘；再次单击预览中的文件关闭该标签
- 超过 1 MB 的文件提示不支持预览
- 界面文案跟随 DSH 设置中的语言自动切换（中文 / English），插件本身不提供额外的切换器 — UI text follows whichever language is active in DSH's own settings (Chinese / English); the plugin has no switcher of its own

## 安装

```sh
dsh plugin --profile web add <本包路径或 npm 包名>
```

重启 harness 后生效：所有会话都会加载该插件（host 路由 `/plugins/file-explorer/*` + web client 面板）。

## 结构

- `src/index.ts` — host 半部（构建到 `lib/index.js`）：`fs`/`shell` 服务 + `webServer` HTTP 路由（list / search / read / write / open-vscode / open-folder）
- `src/client/index.ts` — web client 半部（`tsc` → `lib/client/index.js` → `tsdown` → `lib/client.js`）：注册 `shell.overlay` 面板与 `conversation.session.header.actions` 切换按钮
- `src/client/locales.ts` — 面板与切换按钮文案的中/英文词典（`file-explorer` 语言命名空间），经 `ctx.locale.register`/`bind` 接入 DSH 的 `dsh-client-locale` 服务
- `cordis.patch.yml` — bundle 补丁，把 `file-explorer` 行插入 profile 的 host 组合

## 开发（重要）

```sh
pnpm run build        # clean && tsc && tsc -p tsconfig.client.json && tsdown
node --check lib/client.js
pnpm test             # host 半部单元测试（node --test）
```

**永远不要直接改 `lib/` 下的产物**：它们由 `src/` 构建生成。历史上直接手改 `lib/client.js` 曾把反引号写进 CSS 模板字符串，导致模板提前终止、整个 bundle `SyntaxError`、启动报 "loaded without registering"；而且下次构建会覆盖掉落手改内容。样式/逻辑改动一律落 `src/`，构建后由 host 的 rev 内容哈希自动换新。

已有约定：`[data-phase=active]` 的右侧让位 padding **即时生效**（无 `transition`/`will-change`）——动画化的聊天列宽在流式期间会让 transcript 重排竞争 scroll anchoring，造成消息上跳/内容空白。

## English

The sections above are the canonical (Chinese) docs; this is a full translation for reference.

### Features

- Right-side panel (`shell.overlay`, toggleable): the file tree and the file preview collapse **independently** — each has its own "›" tab on its left edge; collapsing the tree keeps the preview open and docks it to the page's right edge, while collapsing the preview keeps every tab (they're restored the moment you click a file in the tree again); drag the left edge to resize (260–900px)
- Tabbed previews: browser-style multi-tab — one tab per file, kept in the order they were opened; clicking a background tab never reorders the strip; the tab bar scrolls horizontally when it overflows; switching tabs never reloads; each tab has its own × to close individually; the pane disappears once every tab is closed
- Double-click the chat area: collapses both panes at once, filtered by project — preview tabs belonging to the current project folder are kept (hidden) and restored automatically when the file tree reopens; tabs from other folders are closed
- Header: "Files" plus six icons — VS Code (open the whole workspace in VS Code), system file manager (open the current selection in the system file manager: a selected directory opens directly, a selected file is revealed/highlighted inside its folder, and with nothing selected it opens the project root), expand all / collapse all, refresh, edit, and hide the file tree (the preview stays open)
- Search box ("Search files"): recursively scans the workspace, skipping `.git` and `node_modules`, capped at 300 results
- File tree: the root is expanded by default; directories expand/collapse on click (lazy-loaded); files open a preview on single- or double-click
- Preview: `.md` renders as Markdown (headings, lists, code blocks, quotes, links), with fenced code blocks syntax-highlighted by their declared language; other text files are auto-highlighted by extension (JSON / YAML / JS / TS / Python / C / C++ / Java / Go / Rust / Shell / SQL / TOML / INI / CSS / HTML, and more); the "Edit" icon switches to an editable mode, and Save writes the change back to disk; clicking the already-previewed file again closes its tab
- Files over 1 MB show a "preview not supported" notice instead
- UI text follows whichever language is active in DSH's own settings (Chinese / English) — the plugin has no switcher of its own

### Install

```sh
dsh plugin --profile web add <path to this package, or its npm package name>
```

Takes effect after restarting the harness: every session loads the plugin (the host's `/plugins/file-explorer/*` routes plus the web client panel).

### Structure

- `src/index.ts` — the host half (builds to `lib/index.js`): the `fs`/`shell` services plus `webServer` HTTP routes (list / search / read / write / open-vscode / open-folder)
- `src/client/index.ts` — the web client half (`tsc` → `lib/client/index.js` → `tsdown` → `lib/client.js`): registers the `shell.overlay` panel and the `conversation.session.header.actions` toggle button
- `src/client/locales.ts` — the Chinese/English dictionaries for the panel and toggle button copy (the `file-explorer` locale namespace), wired into DSH's `dsh-client-locale` service via `ctx.locale.register`/`bind`
- `cordis.patch.yml` — the bundle patch that inserts the `file-explorer` line into the profile's host composition

### Development (important)

```sh
pnpm run build        # clean && tsc && tsc -p tsconfig.client.json && tsdown
node --check lib/client.js
pnpm test              # host-half unit tests (node --test)
```

**Never hand-edit the build output under `lib/`** — it's generated from `src/`. Hand-patching `lib/client.js` once put a stray backtick inside the CSS template literal, which terminated the template early, threw a `SyntaxError` across the whole bundle, and made the host report "loaded without registering"; the next build also silently overwrites any hand edit anyway. Style and logic changes always go into `src/` — the host's rev content hash picks up the rebuilt output automatically.

Existing convention: the right-side yield padding on `[data-phase=active]` applies **instantly** (no `transition`/`will-change`) — animating the chat column's width while streaming makes the transcript's reflow race the browser's scroll anchoring, which shows up as messages jumping or the content going blank.

