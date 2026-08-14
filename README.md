# dsh-file-explorer

> **File Explorer for DeepSeek Harness** — right-side resizable file tree with Markdown rendering, syntax highlighting, in-panel editing, and one-click VS Code open. Install: `dsh plugin --profile web add dsh-file-explorer`.

DeepSeek Harness 的全局文件资源管理器插件：在任何会话的标题栏右侧提供文件夹切换按钮，点击后在页面**右侧**打开可调宽度的文件树面板。

## 功能

- 右侧面板（`shell.overlay`，可开关）：左边缘拖拽调宽（260–900px）
- 标题栏：「文件」+ 五个图标 —— VS Code（在 VS Code 中打开整个工作区）、全部展开/折叠、刷新、编辑、关闭
- 搜索框「搜索文件」：递归扫描工作区（跳过 `.git` / `node_modules`，最多 300 条）
- 文件树：根目录默认展开，目录点击展开/折叠（懒加载），文件单击/双击打开预览
- 预览：`.md` 渲染 Markdown（标题/列表/代码块/引用/链接），Markdown 代码块按围栏语言高亮；其他文本文件按扩展名自动语法高亮（JSON / YAML / JS / TS / Python / C / C++ / Java / Go / Rust / Shell / SQL / TOML / INI / CSS / HTML 等）；「编辑」图标进入可编辑模式，保存写回磁盘
- 超过 1 MB 的文件提示不支持预览

## 安装

```sh
dsh plugin --profile web add <本包路径或 npm 包名>
```

重启 harness 后生效：所有会话都会加载该插件（host 路由 `/plugins/file-explorer/*` + web client 面板）。

## 结构

- `lib/index.js` — host 半部：`fs`/`shell` 服务 + `webServer` HTTP 路由（list / search / read / write / open-vscode）
- `lib/client.js` — web client 半部：`window.__ModuleLoader__` bundle，注册 `shell.overlay` 面板与 `conversation.session.header.actions` 切换按钮
- `cordis.patch.yml` — bundle 补丁，把 `file-explorer` 行插入 profile 的 host 组合
