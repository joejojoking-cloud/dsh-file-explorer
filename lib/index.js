/**
 * dsh-file-explorer — host half.
 *
 * Registers the /plugins/file-explorer/* HTTP routes for the web
 * file-explorer panel (list / search / read / write / open-vscode) and
 * launches VS Code through the shell service. The routes are served by the
 * same web server as the GUI (webServer / httpServer dual-key compatible),
 * so the browser client fetches them from the page origin.
 *
 * @module dsh-file-explorer
 */
export const name = 'file-explorer'
export const inject = ['fs']

const MAX_READ = 1_000_000

export function apply(ctx) {
  const fs = ctx.fs
  const message = (err) => String((err && err.message) || err)

  const readBody = async (req) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    return Buffer.concat(chunks).toString('utf8')
  }
  const send = (res, status, obj) => {
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    })
    res.end(JSON.stringify(obj))
  }
  const param = (req, key) => {
    try {
      return new URL(req.url ?? '/', 'http://x').searchParams.get(key)
    } catch {
      return null
    }
  }
  const requirePath = (req, res) => {
    const path = param(req, 'path')
    if (!path) {
      send(res, 400, { error: 'missing path' })
      return null
    }
    return path
  }

  let registered = false
  const registerWeb = () => {
    if (registered) return
    const webServer = ctx.get('webServer') ?? ctx.get('httpServer')
    if (webServer === undefined) return
    registered = true

    const route = (path, handler) => {
      ctx.effect(() => webServer.register({ kind: 'exact', path, handler }), 'file-explorer: ' + path)
    }

    route('/plugins/file-explorer/list', async (req, res) => {
      const path = requirePath(req, res)
      if (path === null) return
      try {
        const target = await fs.resolve(path)
        const info = await fs.stat(target)
        if (info === undefined || info.type !== 'directory') {
          send(res, 404, { error: 'not-a-directory' })
          return
        }
        const entries = await fs.listDir(target)
        send(res, 200, {
          entries: entries.map((e) => ({
            name: e.name,
            type: e.type,
            size: typeof e.size === 'number' ? e.size : null,
            path: fs.processPath(e.target),
          })),
        })
      } catch (err) {
        send(res, 500, { error: message(err) })
      }
    })

    route('/plugins/file-explorer/search', async (req, res) => {
      const root = param(req, 'root')
      const query = String(param(req, 'q') || '').toLowerCase().trim()
      if (!root || !query) {
        send(res, 200, { matches: [], truncated: false })
        return
      }
      try {
        const maxNodes = 4000
        const maxMatches = 300
        let nodes = 0
        const matches = []
        const stack = [root]
        let truncated = false
        while (stack.length > 0 && nodes < maxNodes && matches.length < maxMatches) {
          const dir = stack.pop()
          let target
          try { target = await fs.resolve(dir) } catch { continue }
          let entries
          try { entries = await fs.listDir(target) } catch { continue }
          nodes += entries.length
          for (const e of entries) {
            const p = fs.processPath(e.target)
            if (e.type === 'directory') {
              if (e.name === '.git' || e.name === 'node_modules') continue
              stack.push(p)
              if (e.name.toLowerCase().includes(query)) matches.push({ name: e.name, path: p, type: 'directory', size: null })
            } else if (e.name.toLowerCase().includes(query)) {
              matches.push({ name: e.name, path: p, type: e.type, size: typeof e.size === 'number' ? e.size : null })
            }
          }
        }
        if (nodes >= maxNodes || matches.length >= maxMatches) truncated = true
        send(res, 200, { matches, truncated })
      } catch (err) {
        send(res, 500, { error: message(err) })
      }
    })

    route('/plugins/file-explorer/read', async (req, res) => {
      const path = requirePath(req, res)
      if (path === null) return
      try {
        const target = await fs.resolve(path)
        const info = await fs.stat(target)
        if (info === undefined) {
          send(res, 404, { error: 'not-found' })
          return
        }
        if (info.type !== 'file') {
          send(res, 400, { error: 'not-a-file' })
          return
        }
        const size = typeof info.size === 'number' ? info.size : 0
        if (size > MAX_READ) {
          send(res, 200, { tooLarge: true, size })
          return
        }
        const content = await fs.readText(target)
        send(res, 200, { content, size })
      } catch (err) {
        send(res, 500, { error: message(err) })
      }
    })

    route('/plugins/file-explorer/write', async (req, res) => {
      if (req.method !== 'POST') {
        send(res, 405, { error: 'use POST' })
        return
      }
      let body
      try {
        body = JSON.parse(await readBody(req))
      } catch {
        send(res, 400, { error: 'bad-json' })
        return
      }
      const path = String((body && body.path) || '')
      if (!path) {
        send(res, 400, { error: 'missing path' })
        return
      }
      try {
        const target = await fs.resolve(path)
        await fs.writeText(target, String((body && body.content) ?? ''))
        send(res, 200, { ok: true })
      } catch (err) {
        send(res, 500, { error: message(err) })
      }
    })

    route('/plugins/file-explorer/open-vscode', async (req, res) => {
      if (req.method !== 'POST') {
        send(res, 405, { error: 'use POST' })
        return
      }
      let body
      try {
        body = JSON.parse(await readBody(req))
      } catch {
        send(res, 400, { error: 'bad-json' })
        return
      }
      const path = String((body && body.path) || '')
      if (!path) {
        send(res, 400, { error: 'missing path' })
        return
      }
      const shell = ctx.get('shell')
      const subprocess = ctx.get('subprocess')
      try {
        // Preferred: spawn the real VS Code executable directly through the
        // subprocess seam (no shell sandbox). On Windows `code` resolves to a
        // .cmd shim that Node cannot spawn, so derive <install>\Code.exe from
        // <install>\bin\code.cmd.
        if (subprocess !== undefined) {
          let resolved = null
          try { resolved = await subprocess.resolveExecutable('code') } catch { /* not on PATH */ }
          let program = null
          if (resolved) {
            if (/\.(cmd|bat)$/i.test(String(resolved))) {
              const derived = String(resolved).replace(/[\\/]bin[\\/][^\\/]*$/i, '') + '\\Code.exe'
              try {
                const t = await fs.resolve(derived)
                const info = await fs.stat(t)
                if (info !== undefined && info.type === 'file') program = derived
              } catch { /* derived exe absent */ }
            } else {
              program = resolved
            }
          }
          if (program !== null) {
            const handle = subprocess.spawn({
              argv: [program, path],
              cwd: path,
              stdio: { stdin: 'ignore', stdout: { maxBytes: 4096 }, stderr: { maxBytes: 4096 } },
              graceMs: 8000,
            })
            const outcome = await handle.done
            send(res, 200, { ok: outcome.exitCode === 0, exitCode: outcome.exitCode })
            return
          }
        }
        // Fallback: sandboxed shell with Start-Process (detaches immediately).
        if (shell !== undefined) {
          const quoted = '"' + path.replace(/"/g, '""') + '"'
          const command = 'Start-Process -FilePath code -ArgumentList ' + quoted
          const spec = shell.resolve({ command, timeoutMs: 10000 })
          const result = await shell.run(spec)
          if (result.exitCode === 0) {
            send(res, 200, { ok: true })
            return
          }
        }
        send(res, 200, { ok: false, error: '未找到 VS Code（code 命令不在 PATH 中）' })
      } catch (err) {
        send(res, 500, { ok: false, error: message(err) })
      }
    })
  }

  registerWeb()
  ctx.on('internal/service', (name) => {
    if (name === 'webServer' || name === 'httpServer' || name === 'shell') registerWeb()
  })
}
