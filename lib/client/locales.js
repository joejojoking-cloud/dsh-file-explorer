/**
 * dsh-file-explorer — locale dictionaries for the browser half.
 *
 * Registered with ctx.locale.register(NS, { zh, en }) in src/client/index.ts;
 * ctx.locale.bind(NS) resolves keys against whichever language DSH's
 * settings panel has active (zh/en), so the panel follows a language switch
 * live — no reload, no plugin-owned switcher UI. The 'error.*' keys mirror
 * the `code` field the host half (src/index.ts) now sends alongside its
 * `error` string on open-vscode/open-folder failures.
 *
 * Keep both objects in lock step: test/locales.test.mjs fails the build if
 * their key sets diverge.
 */
export const NS = 'file-explorer';
export const zh = {
    'panel.title': '文件资源管理器',
    'panel.filesLabel': '文件',
    'search.placeholder': '搜索文件',
    'search.searching': '搜索中…',
    'search.noMatches': '没有匹配的文件',
    'search.truncated': '结果过多，已截断（前 {count} 条）',
    'tree.empty': '未找到当前工作区',
    'tab.close': '关闭标签',
    'action.viewSource': '源码',
    'action.viewPreview': '预览',
    'action.save': '保存',
    'action.collapsePreview': '收起预览',
    'action.collapseTree': '收起文件树',
    'action.collapsePreviewKeepTabs': '收起文件预览（保留标签）',
    'action.resizeHint': '拖动调整宽度',
    'action.openInVscode': '在 Visual Studio Code 中打开项目',
    'action.revealInFileManager': '在系统文件浏览器中定位选中项',
    'action.openInFileManager': '在系统文件浏览器中打开项目',
    'action.expandCollapseAll': '全部展开 / 全部折叠',
    'action.refresh': '刷新',
    'action.edit': '编辑',
    'editor.loading': '加载中…',
    'editor.tooLarge': '文件过大（{size}），不支持预览',
    'status.saved': '已保存',
    'status.expandLimit': '目录较多，已展开前 {count} 个目录',
    'status.openedVscode': '已在 VS Code 中打开项目',
    'status.revealedInFolder': '已在系统文件浏览器中定位选中项',
    'status.openedFolder': '已在系统文件浏览器中打开项目',
    'error.saveFailed': '保存失败：{reason}',
    'error.openFailed': '打开失败：{reason}',
    'error.unknown': '打开失败',
    'error.vscode-not-found': '未找到 VS Code（code 命令不在 PATH 中）',
    'error.target-not-found': '目标不存在',
    'error.open-exit-code': '打开失败（退出码 {code}）',
    'error.explorer-unavailable': '无法启动资源管理器（explorer 不可用）',
    'error.finder-unavailable': '无法启动 Finder（未找到 open 命令）',
    'error.file-manager-unavailable': '无法打开文件管理器（未找到 xdg-open）',
};
export const en = {
    'panel.title': 'File Explorer',
    'panel.filesLabel': 'Files',
    'search.placeholder': 'Search files',
    'search.searching': 'Searching…',
    'search.noMatches': 'No matching files',
    'search.truncated': 'Too many results — truncated to the first {count}',
    'tree.empty': 'No workspace found',
    'tab.close': 'Close tab',
    'action.viewSource': 'Source',
    'action.viewPreview': 'Preview',
    'action.save': 'Save',
    'action.collapsePreview': 'Hide preview',
    'action.collapseTree': 'Hide file tree',
    'action.collapsePreviewKeepTabs': 'Hide preview (keep tabs)',
    'action.resizeHint': 'Drag to resize',
    'action.openInVscode': 'Open project in Visual Studio Code',
    'action.revealInFileManager': 'Reveal selection in the system file manager',
    'action.openInFileManager': 'Open project in the system file manager',
    'action.expandCollapseAll': 'Expand all / Collapse all',
    'action.refresh': 'Refresh',
    'action.edit': 'Edit',
    'editor.loading': 'Loading…',
    'editor.tooLarge': 'File too large ({size}) — preview not supported',
    'status.saved': 'Saved',
    'status.expandLimit': 'Too many directories — expanded the first {count}',
    'status.openedVscode': 'Opened the project in VS Code',
    'status.revealedInFolder': 'Revealed the selection in the system file manager',
    'status.openedFolder': 'Opened the project in the system file manager',
    'error.saveFailed': 'Save failed: {reason}',
    'error.openFailed': 'Failed to open: {reason}',
    'error.unknown': 'Failed to open',
    'error.vscode-not-found': 'VS Code not found (the "code" command is not on PATH)',
    'error.target-not-found': 'Target not found',
    'error.open-exit-code': 'Failed to open (exit code {code})',
    'error.explorer-unavailable': "Couldn't launch Explorer (explorer is unavailable)",
    'error.finder-unavailable': 'Couldn\'t launch Finder (the "open" command was not found)',
    'error.file-manager-unavailable': "Couldn't open the file manager (xdg-open was not found)",
};
//# sourceMappingURL=locales.js.map