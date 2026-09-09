import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply } from '../lib/index.js'

/**
 * Smoke tests for the POST /plugins/file-explorer/open-folder route.
 * ctx is stubbed: a fake webServer captures exact-route handlers, a fake
 * subprocess records spawn argv instead of launching real programs, and
 * fs.stat answers from a lookup table so no disk access happens.
 *
 * The fs stub mimics the real DSH fs contract: `resolve` returns a FsTarget
 * OBJECT ({ targetKey, displayPath }), and `processPath` converts it back to
 * the path string — the route must use processPath, never the raw object.
 */

const build = ({ subprocess, shell, entries = {}, roots = ['/'] } = {}) => {
  const routes = new Map()
  const ctx = {
    fs: {
      resolve: async (p) => ({ targetKey: p, displayPath: p }),
      stat: async (t) => entries[String((t && t.targetKey) ?? t)],
      processPath: (t) => String((t && t.targetKey) ?? t),
      listDir: async () => [],
      readText: async () => '',
      writeText: async () => {},
    },
    get: (name) => {
      if (name === 'webServer') return { register: (o) => routes.set(o.path, o.handler) }
      if (name === 'subprocess') return subprocess
      if (name === 'shell') return shell
      if (name === 'workspaceRegistry') return { list: () => roots.map((p) => ({ path: () => p })) }
      return undefined
    },
    effect: (fn) => { fn(); return () => {} },
    on: () => {},
  }
  apply(ctx)
  return routes
}

const post = (routes, body, extraHeaders = {}) => new Promise((resolve, reject) => {
  const handler = routes.get('/plugins/file-explorer/open-folder')
  const req = {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dsh-file-explorer': '1', ...extraHeaders },
    url: '/plugins/file-explorer/open-folder',
    [Symbol.asyncIterator]() {
      const chunk = Buffer.from(body === undefined ? 'not-json' : JSON.stringify(body))
      let sent = false
      return {
        next: () => sent
          ? Promise.resolve({ done: true })
          : (sent = true, Promise.resolve({ value: chunk, done: false })),
      }
    },
  }
  let out = null
  const res = {
    writeHead: (status) => { out = { status, body: '' } },
    end: (s) => { out.body = JSON.parse(s); resolve(out) },
  }
  handler(req, res).catch(reject)
})

// A subprocess stub that resolves executables from a lookup table and
// records every spawn spec instead of launching anything.
const recordSubprocess = (resolved, exitCode) => {
  const calls = []
  return {
    calls,
    subprocess: {
      resolveExecutable: async (name) => (resolved ? resolved[name] ?? null : null),
      spawn: (spec) => {
        calls.push(spec)
        return { done: Promise.resolve({ exitCode }) }
      },
    },
  }
}

const withPlatform = (platform, fn) => {
  const original = process.platform
  Object.defineProperty(process, 'platform', { value: platform, configurable: true })
  return fn().finally(() => {
    Object.defineProperty(process, 'platform', { value: original, configurable: true })
  })
}

test('registers the open-folder route', () => {
  const routes = build()
  assert.ok(routes.get('/plugins/file-explorer/open-folder'), 'open-folder route registered')
})

test('rejects a request without a path', async () => {
  const routes = build()
  const res = await post(routes, {})
  assert.equal(res.status, 400)
  assert.equal(res.body.error, 'missing path')
})

test('rejects invalid json', async () => {
  const routes = build()
  const res = await post(routes, undefined)
  assert.equal(res.status, 400)
  assert.equal(res.body.error, 'bad-json')
})

test('returns 404 for a missing target', async () => {
  const routes = build()
  const res = await post(routes, { path: '/nope' })
  assert.equal(res.status, 404)
})

test('win32: opens a directory with explorer', { skip: process.platform !== 'win32' }, async () => {
  const { subprocess, calls } = recordSubprocess({ explorer: 'C:\\Windows\\explorer.exe' }, 1)
  const routes = build({ subprocess, entries: { 'C:\\proj': { type: 'directory' } } })
  const res = await post(routes, { path: 'C:\\proj' })
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.deepEqual(calls[0].argv, ['C:\\Windows\\explorer.exe', 'C:\\proj'])
})

test('win32: reveals a file with /select', { skip: process.platform !== 'win32' }, async () => {
  const { subprocess, calls } = recordSubprocess({ explorer: 'C:\\Windows\\explorer.exe' }, 1)
  const routes = build({ subprocess, entries: { 'C:\\proj\\a.txt': { type: 'file' } } })
  const res = await post(routes, { path: 'C:\\proj\\a.txt' })
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.deepEqual(calls[0].argv, ['C:\\Windows\\explorer.exe', '/select,C:\\proj\\a.txt'])
})

test('win32: falls back to Start-Process explorer when explorer is not resolvable', { skip: process.platform !== 'win32' }, async () => {
  const commands = []
  const shell = {
    resolve: (spec) => ({ ...spec }),
    run: async (spec) => { commands.push(spec.command); return { exitCode: 0 } },
  }
  const { subprocess } = recordSubprocess({}, 0)
  const routes = build({ subprocess, shell, entries: { 'C:\\proj': { type: 'directory' } } })
  const res = await post(routes, { path: 'C:\\proj' })
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.match(commands[0], /Start-Process explorer\.exe/)
})

test('darwin: opens a directory with open', async () => {
  await withPlatform('darwin', async () => {
    const { subprocess, calls } = recordSubprocess({ open: '/usr/bin/open' }, 0)
    const routes = build({ subprocess, entries: { '/Users/x/proj': { type: 'directory' } } })
    const res = await post(routes, { path: '/Users/x/proj' })
    assert.equal(res.body.ok, true)
    assert.deepEqual(calls[0].argv, ['/usr/bin/open', '/Users/x/proj'])
  })
})

test('darwin: reveals a file with open -R', async () => {
  await withPlatform('darwin', async () => {
    const { subprocess, calls } = recordSubprocess({ open: '/usr/bin/open' }, 0)
    const routes = build({ subprocess, entries: { '/Users/x/proj/a.txt': { type: 'file' } } })
    const res = await post(routes, { path: '/Users/x/proj/a.txt' })
    assert.equal(res.body.ok, true)
    assert.deepEqual(calls[0].argv, ['/usr/bin/open', '-R', '/Users/x/proj/a.txt'])
  })
})

test('darwin: nonzero exit is reported as failure', async () => {
  await withPlatform('darwin', async () => {
    const { subprocess } = recordSubprocess({ open: '/usr/bin/open' }, 1)
    const routes = build({ subprocess, entries: { '/Users/x/proj': { type: 'directory' } } })
    const res = await post(routes, { path: '/Users/x/proj' })
    assert.equal(res.body.ok, false)
  })
})

test('linux: opens the parent directory of a file with xdg-open', async () => {
  await withPlatform('linux', async () => {
    const { subprocess, calls } = recordSubprocess({ 'xdg-open': '/usr/bin/xdg-open' }, 0)
    const routes = build({ subprocess, entries: { '/srv/proj/a.txt': { type: 'file' } } })
    const res = await post(routes, { path: '/srv/proj/a.txt' })
    assert.equal(res.body.ok, true)
    assert.deepEqual(calls[0].argv, ['/usr/bin/xdg-open', '/srv/proj'])
  })
})

test('reports 500 when launching throws', async () => {
  await withPlatform('win32', async () => {
    const { subprocess } = recordSubprocess({ explorer: 'C:\\Windows\\explorer.exe' }, 0)
    subprocess.spawn = () => { throw new Error('boom') }
    const routes = build({ subprocess, entries: { 'C:\\proj': { type: 'directory' } } })
    const res = await post(routes, { path: 'C:\\proj' })
    assert.equal(res.status, 500)
    assert.equal(res.body.ok, false)
  })
})

// ---------- local hardening (vendored fork) ----------

test('confinement: rejects a target outside the registered workspace roots', async () => {
  const { subprocess } = recordSubprocess({ 'xdg-open': '/usr/bin/xdg-open' }, 0)
  const routes = build({ subprocess, roots: ['/srv/proj'], entries: { '/etc/hostname': { type: 'file' } } })
  const res = await post(routes, { path: '/etc/hostname' })
  assert.equal(res.status, 403)
  assert.equal(res.body.error, 'path outside workspace')
})

test('confinement: allows a target inside a registered workspace root', async () => {
  const { subprocess } = recordSubprocess({ 'xdg-open': '/usr/bin/xdg-open' }, 0)
  const routes = build({ subprocess, roots: ['/srv/proj'], entries: { '/srv/proj': { type: 'directory' } } })
  const res = await post(routes, { path: '/srv/proj' })
  assert.equal(res.status, 200)
})

test('csrf: rejects a cross-origin POST', async () => {
  const { subprocess } = recordSubprocess({ 'xdg-open': '/usr/bin/xdg-open' }, 0)
  const routes = build({ subprocess, entries: { '/srv/proj': { type: 'directory' } } })
  const res = await post(routes, { path: '/srv/proj' }, { origin: 'https://evil.example' })
  assert.equal(res.status, 403)
})

test('csrf: rejects a non-json content type', async () => {
  const { subprocess } = recordSubprocess({ 'xdg-open': '/usr/bin/xdg-open' }, 0)
  const routes = build({ subprocess, entries: { '/srv/proj': { type: 'directory' } } })
  const res = await post(routes, { path: '/srv/proj' }, { 'content-type': 'text/plain' })
  assert.equal(res.status, 415)
})

test('csrf: allows a same-origin JSON POST', async () => {
  const { subprocess } = recordSubprocess({ 'xdg-open': '/usr/bin/xdg-open' }, 0)
  const routes = build({ subprocess, entries: { '/srv/proj': { type: 'directory' } } })
  const res = await post(routes, { path: '/srv/proj' }, { origin: 'http://127.0.0.1:3080', host: '127.0.0.1:3080' })
  assert.equal(res.status, 200)
})

test('plugin header: a request without it is rejected', async () => {
  const { subprocess } = recordSubprocess({ 'xdg-open': '/usr/bin/xdg-open' }, 0)
  const routes = build({ subprocess, entries: { '/srv/proj': { type: 'directory' } } })
  const res = await post(routes, { path: '/srv/proj' }, { 'x-dsh-file-explorer': '0' })
  assert.equal(res.status, 403)
  assert.equal(res.body.error, 'missing plugin header')
})
