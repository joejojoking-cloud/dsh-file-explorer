/**
 * Moved here from lib/index.js (2026-08-31): the host half is now a real
 * source file; the build regenerates lib/index.js. Behavior unchanged.
 */
/**
 * dsh-file-explorer — host half.
 *
 * Registers the /plugins/file-explorer/* HTTP routes for the web
 * file-explorer panel (list / search / read / write / open-vscode /
 * open-folder) and launches external programs (VS Code, the system file
 * manager) through the subprocess service. The routes are served by the
 * same web server as the GUI (webServer / httpServer dual-key compatible),
 * so the browser client fetches them from the page origin.
 *
 * Hardening:
 *  - every path is confined to a registered workspace root (the DSH fs
 *    sandbox fences WRITES only; reads pass through untouched, so the
 *    containment check must live here);
 *  - external programs are launched with an argv array only, never through
 *    a shell string (the upstream shell fallback was removed);
 *  - every route requires the plugin header (a custom header forces a CORS
 *    preflight the server never grants) and rejects a cross-origin Origin;
 *    POST routes additionally require a JSON content type, which blocks
 *    browser CSRF (a simple cross-origin request cannot set either).
 *
 * @module dsh-file-explorer
 */
import { realpath } from 'node:fs/promises';
import { dirname, resolve as resolvePath, sep } from 'node:path';
export const name = 'file-explorer';
export const inject = ['fs'];
const MAX_READ = 1_000_000;
const PLUGIN_HEADER = 'x-dsh-file-explorer';
export function apply(ctx) {
    const fs = ctx.fs;
    const message = (err) => String((err && err.message) || err);
    const readBody = async (req) => {
        const chunks = [];
        for await (const chunk of req)
            chunks.push(chunk);
        return Buffer.concat(chunks).toString('utf8');
    };
    const send = (res, status, obj) => {
        res.writeHead(status, {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        });
        res.end(JSON.stringify(obj));
    };
    const param = (req, key) => {
        try {
            return new URL(req.url ?? '/', 'http://x').searchParams.get(key);
        }
        catch {
            return null;
        }
    };
    const requirePath = (req, res) => {
        const path = param(req, 'path');
        if (!path) {
            send(res, 400, { error: 'missing path' });
            return null;
        }
        return path;
    };
    // ---------- local hardening helpers ----------
    /** Reject control characters everywhere; shell metacharacters on Windows. */
    const unsafePath = (value) => {
        if (/[\u0000-\u001f\u007f]/.test(value))
            return true;
        if (process.platform === 'win32' && /[&|<>^%]/.test(value))
            return true;
        return false;
    };
    const isInside = (root, abs) => {
        if (abs === root)
            return true;
        const prefix = root.endsWith(sep) ? root : root + sep;
        return abs.startsWith(prefix);
    };
    /** Registered workspace roots (plus the host launch directory). */
    const allowedRoots = async () => {
        const roots = new Set();
        const registry = ctx.get('workspaceRegistry');
        if (registry !== undefined && typeof registry.list === 'function') {
            try {
                for (const record of registry.list()) {
                    const value = typeof record?.path === 'function' ? record.path() : record?.path;
                    if (typeof value === 'string' && value.length > 0)
                        roots.add(value);
                }
            }
            catch {
                /* registry unavailable: fall back to the launch directory */
            }
        }
        roots.add(process.cwd());
        const canonical = [];
        for (const root of roots) {
            try {
                canonical.push(await realpath(root));
            }
            catch {
                canonical.push(resolvePath(root));
            }
        }
        return canonical;
    };
    /**
     * Throw a 403 unless the target is inside a workspace root. An existing
     * target is canonicalized first (so a symlink cannot escape a root); a
     * not-yet-existing target is checked lexically, since there is nothing to
     * resolve yet and the fs sandbox still fences the write itself.
     */
    const confine = async (displayPath) => {
        if (unsafePath(displayPath)) {
            throw Object.assign(new Error('path contains unsupported characters'), { status: 400 });
        }
        const roots = await allowedRoots();
        let real = null;
        try {
            real = await realpath(displayPath);
        }
        catch (err) {
            if (err?.code !== 'ENOENT')
                throw err;
        }
        const inside = real !== null
            ? roots.some((root) => isInside(root, real))
            : roots.some((root) => isInside(root, resolvePath(displayPath)));
        if (!inside) {
            throw Object.assign(new Error('path outside workspace'), { status: 403 });
        }
        return displayPath;
    };
    /** Cross-origin requests are rejected; header-less clients (curl, agent) pass. */
    const sameOrigin = (req) => {
        const headers = req.headers ?? {};
        const origin = headers.origin;
        if (origin === undefined)
            return true;
        try {
            return new URL(origin).host === String(headers.host ?? '');
        }
        catch {
            return false;
        }
    };
    /**
     * Every route requires the plugin header. A cross-origin page cannot set a
     * custom header without a preflight the server never grants, so this is a
     * CSRF / defence-in-depth layer, not authentication: a local process can send
     * it too (though it can already read these files directly).
     */
    const guard = (req, res) => {
        if (String((req.headers ?? {})[PLUGIN_HEADER] ?? '') !== '1') {
            send(res, 403, { error: 'missing plugin header' });
            return false;
        }
        if (!sameOrigin(req)) {
            send(res, 403, { error: 'cross-origin request rejected' });
            return false;
        }
        return true;
    };
    /** Gate for state-changing routes: plugin header + same origin + JSON. */
    const guardPost = (req, res) => {
        if (!guard(req, res))
            return false;
        const type = String((req.headers ?? {})['content-type'] ?? '');
        if (!type.toLowerCase().startsWith('application/json')) {
            send(res, 415, { error: 'content-type must be application/json' });
            return false;
        }
        return true;
    };
    let registered = false;
    const registerWeb = () => {
        if (registered)
            return;
        const webServer = ctx.get('webServer') ?? ctx.get('httpServer');
        if (webServer === undefined)
            return;
        registered = true;
        const route = (path, handler) => {
            ctx.effect(() => webServer.register({ kind: 'exact', path, handler }), 'file-explorer: ' + path);
        };
        route('/plugins/file-explorer/list', async (req, res) => {
            const path = requirePath(req, res);
            if (path === null)
                return;
            if (!guard(req, res))
                return;
            try {
                const target = await fs.resolve(path);
                const display = fs.processPath(target);
                await confine(display);
                const info = await fs.stat(target);
                if (info === undefined || info.type !== 'directory') {
                    send(res, 404, { error: 'not-a-directory' });
                    return;
                }
                const entries = await fs.listDir(target);
                send(res, 200, {
                    entries: entries.map((e) => ({
                        name: e.name,
                        type: e.type,
                        size: typeof e.size === 'number' ? e.size : null,
                        path: fs.processPath(e.target),
                    })),
                });
            }
            catch (err) {
                send(res, err?.status ?? 500, { error: message(err) });
            }
        });
        route('/plugins/file-explorer/search', async (req, res) => {
            const root = param(req, 'root');
            const query = String(param(req, 'q') || '').toLowerCase().trim();
            if (!root || !query) {
                send(res, 200, { matches: [], truncated: false });
                return;
            }
            if (!guard(req, res))
                return;
            try {
                const rootTarget = await fs.resolve(root);
                await confine(fs.processPath(rootTarget));
                const maxNodes = 4000;
                const maxMatches = 300;
                let nodes = 0;
                const matches = [];
                const stack = [root];
                let truncated = false;
                while (stack.length > 0 && nodes < maxNodes && matches.length < maxMatches) {
                    const dir = stack.pop();
                    let target;
                    try {
                        target = await fs.resolve(dir);
                    }
                    catch {
                        continue;
                    }
                    let entries;
                    try {
                        entries = await fs.listDir(target);
                    }
                    catch {
                        continue;
                    }
                    nodes += entries.length;
                    for (const e of entries) {
                        const p = fs.processPath(e.target);
                        if (e.type === 'directory') {
                            if (e.name === '.git' || e.name === 'node_modules')
                                continue;
                            stack.push(p);
                            if (e.name.toLowerCase().includes(query))
                                matches.push({ name: e.name, path: p, type: 'directory', size: null });
                        }
                        else if (e.name.toLowerCase().includes(query)) {
                            matches.push({ name: e.name, path: p, type: e.type, size: typeof e.size === 'number' ? e.size : null });
                        }
                    }
                }
                if (nodes >= maxNodes || matches.length >= maxMatches)
                    truncated = true;
                send(res, 200, { matches, truncated });
            }
            catch (err) {
                send(res, err?.status ?? 500, { error: message(err) });
            }
        });
        route('/plugins/file-explorer/read', async (req, res) => {
            const path = requirePath(req, res);
            if (path === null)
                return;
            if (!guard(req, res))
                return;
            try {
                const target = await fs.resolve(path);
                const display = fs.processPath(target);
                await confine(display);
                const info = await fs.stat(target);
                if (info === undefined) {
                    send(res, 404, { error: 'not-found' });
                    return;
                }
                if (info.type !== 'file') {
                    send(res, 400, { error: 'not-a-file' });
                    return;
                }
                const size = typeof info.size === 'number' ? info.size : 0;
                if (size > MAX_READ) {
                    send(res, 200, { tooLarge: true, size });
                    return;
                }
                const content = await fs.readText(target);
                send(res, 200, { content, size });
            }
            catch (err) {
                send(res, err?.status ?? 500, { error: message(err) });
            }
        });
        route('/plugins/file-explorer/write', async (req, res) => {
            if (req.method !== 'POST') {
                send(res, 405, { error: 'use POST' });
                return;
            }
            if (!guardPost(req, res))
                return;
            let body;
            try {
                body = JSON.parse(await readBody(req));
            }
            catch {
                send(res, 400, { error: 'bad-json' });
                return;
            }
            const path = String((body && body.path) || '');
            if (!path) {
                send(res, 400, { error: 'missing path' });
                return;
            }
            try {
                const target = await fs.resolve(path);
                await confine(fs.processPath(target));
                await fs.writeText(target, String((body && body.content) ?? ''));
                send(res, 200, { ok: true });
            }
            catch (err) {
                send(res, err?.status ?? 500, { error: message(err) });
            }
        });
        route('/plugins/file-explorer/open-vscode', async (req, res) => {
            if (req.method !== 'POST') {
                send(res, 405, { error: 'use POST' });
                return;
            }
            if (!guardPost(req, res))
                return;
            let body;
            try {
                body = JSON.parse(await readBody(req));
            }
            catch {
                send(res, 400, { error: 'bad-json' });
                return;
            }
            const path = String((body && body.path) || '');
            if (!path) {
                send(res, 400, { error: 'missing path' });
                return;
            }
            const subprocess = ctx.get('subprocess');
            try {
                const target = await fs.resolve(path);
                const display = fs.processPath(target);
                await confine(display);
                const info = await fs.stat(target);
                if (info === undefined) {
                    send(res, 404, { ok: false, error: '目标不存在' });
                    return;
                }
                if (subprocess === undefined) {
                    send(res, 200, { ok: false, error: 'subprocess service unavailable' });
                    return;
                }
                // Spawn VS Code with an argv array only. On Windows `code` resolves to
                // a .cmd shim; running it through `cmd.exe /c` preserves the CLI-script
                // setup (ELECTRON_RUN_AS_NODE + cli.js) the shim provides, without
                // which the bare Code.exe cannot start a new instance.
                let resolved = null;
                try {
                    resolved = await subprocess.resolveExecutable('code');
                }
                catch { /* not on PATH */ }
                if (resolved === null || resolved === undefined) {
                    send(res, 200, { ok: false, error: '未找到 VS Code（code 命令不在 PATH 中）' });
                    return;
                }
                let program = String(resolved);
                let args = [display];
                if (/\.(cmd|bat)$/i.test(program)) {
                    program = 'cmd';
                    args = ['/c', String(resolved), display];
                }
                const handle = subprocess.spawn({
                    argv: [program, ...args],
                    cwd: display,
                    stdio: { stdin: 'ignore', stdout: { maxBytes: 4096 }, stderr: { maxBytes: 4096 } },
                    graceMs: 8000,
                });
                const outcome = await handle.done;
                send(res, 200, { ok: outcome.exitCode === 0, exitCode: outcome.exitCode });
            }
            catch (err) {
                send(res, err?.status ?? 500, { ok: false, error: message(err) });
            }
        });
        route('/plugins/file-explorer/open-folder', async (req, res) => {
            if (req.method !== 'POST') {
                send(res, 405, { error: 'use POST' });
                return;
            }
            if (!guardPost(req, res))
                return;
            let body;
            try {
                body = JSON.parse(await readBody(req));
            }
            catch {
                send(res, 400, { error: 'bad-json' });
                return;
            }
            const path = String((body && body.path) || '');
            if (!path) {
                send(res, 400, { error: 'missing path' });
                return;
            }
            const subprocess = ctx.get('subprocess');
            try {
                const target = await fs.resolve(path);
                const display = fs.processPath(target);
                await confine(display);
                const info = await fs.stat(target);
                if (info === undefined) {
                    send(res, 404, { ok: false, error: '目标不存在' });
                    return;
                }
                // `resolve` returns a FsTarget OBJECT ({ targetKey, displayPath });
                // processPath converts it to the real path string used below for
                // dirname / spawn argv. Only stat takes the object.
                const isDir = info.type === 'directory';
                const platform = process.platform;
                const parent = isDir ? display : dirname(display);
                if (subprocess === undefined) {
                    send(res, 200, { ok: false, error: 'subprocess service unavailable' });
                    return;
                }
                // Command per platform. A selected FILE is revealed inside its
                // enclosing folder: explorer /select,<file> on Windows (opens the
                // parent and highlights the file), `open -R` on macOS, and the
                // parent directory on Linux (xdg-open has no portable reveal).
                const plan = () => {
                    if (platform === 'win32')
                        return { program: 'explorer', args: isDir ? [display] : ['/select,' + display] };
                    if (platform === 'darwin')
                        return { program: 'open', args: isDir ? [display] : ['-R', display] };
                    return { program: 'xdg-open', args: [parent] };
                };
                const { program, args } = plan();
                let resolved = null;
                try {
                    resolved = await subprocess.resolveExecutable(program);
                }
                catch { /* not on PATH */ }
                if (resolved === null || resolved === undefined) {
                    send(res, 200, {
                        ok: false,
                        error: platform === 'win32' ? '无法启动资源管理器（explorer 不可用）'
                            : platform === 'darwin' ? '无法启动 Finder（未找到 open 命令）'
                                : '无法打开文件管理器（未找到 xdg-open）',
                    });
                    return;
                }
                const handle = subprocess.spawn({
                    argv: [String(resolved), ...args],
                    cwd: parent,
                    stdio: { stdin: 'ignore', stdout: { maxBytes: 4096 }, stderr: { maxBytes: 4096 } },
                    graceMs: 8000,
                });
                const outcome = await handle.done;
                // explorer.exe detaches and commonly exits with code 1 even after
                // opening the window, so on Windows a successful spawn is success.
                if (platform === 'win32' || outcome.exitCode === 0) {
                    send(res, 200, { ok: true });
                }
                else {
                    send(res, 200, { ok: false, error: '打开失败（退出码 ' + outcome.exitCode + '）' });
                }
            }
            catch (err) {
                send(res, err?.status ?? 500, { ok: false, error: message(err) });
            }
        });
    };
    registerWeb();
    ctx.on('internal/service', (name) => {
        if (name === 'webServer' || name === 'httpServer')
            registerWeb();
    });
}
//# sourceMappingURL=index.js.map