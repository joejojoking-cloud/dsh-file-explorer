import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Regression tests for the tree's file-type mapping and sort comparator. The
 * shipped helpers are extracted verbatim from lib/client.js so the assertions
 * track what the browser actually runs.
 */
const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const start = source.indexOf('const FILE_NAMES')
const end = source.indexOf('const fmtSize')
assert.ok(start !== -1 && end > start, 'FILE_NAMES/helpers region found in lib/client.js')
const { fileTypeOf, sortEntries } = new Function(source.slice(start, end) + '\nreturn { fileTypeOf, sortEntries };')()

// ---------- file types ----------

test('markdown family gets its own tone and glyph', () => {
  for (const name of ['CLAUDE.md', 'README.markdown', 'notes.mdx', 'a.mdown', 'b.mkd']) {
    const t = fileTypeOf(name)
    assert.equal(t.tone, 'md', name)
    assert.equal(t.icon, 'md', name)
    assert.equal(t.fillRule, 'evenodd', name)
  }
})

test('common families map to their tone with the generic glyph', () => {
  const expected = {
    'index.ts': 'code',
    'app.jsx': 'code',
    'package.json': 'json',
    'styles.css': 'style',
    'index.html': 'markup',
    'logo.svg': 'markup',
    'voice.yml': 'data',
    'config.toml': 'data',
    '.env': 'data',
    'run.sh': 'shell',
    'main.py': 'script',
    'main.rs': 'script',
  }
  for (const [name, tone] of Object.entries(expected)) {
    const t = fileTypeOf(name)
    assert.equal(t.tone, tone, name)
    assert.equal(t.icon, 'file', name)
  }
})

test('images get their own glyph', () => {
  const t = fileTypeOf('hero.webp')
  assert.equal(t.tone, 'image')
  assert.equal(t.icon, 'image')
  assert.equal(t.fillRule, 'evenodd')
})

test('whole-name families win over the extension', () => {
  assert.equal(fileTypeOf('.gitignore').tone, 'git')
  assert.equal(fileTypeOf('.gitmodules').tone, 'git')
  assert.equal(fileTypeOf('package-lock.json').tone, 'lock')
  assert.equal(fileTypeOf('pnpm-lock.yaml').tone, 'lock')
  assert.equal(fileTypeOf('Dockerfile').tone, 'docker')
  assert.equal(fileTypeOf('LICENSE').tone, 'license')
  assert.equal(fileTypeOf('LICENSE.md').tone, 'license')
  // a lock file is not "just json"
  assert.equal(fileTypeOf('package-lock.json').icon, 'lock')
})

test('unknown and extension-less names fall back to the default tone', () => {
  for (const name of ['Makefile', 'archive.zip', 'noext']) {
    assert.equal(fileTypeOf(name).tone, 'default', name)
    assert.equal(fileTypeOf(name).icon, 'file', name)
  }
})

test('matching is case-insensitive', () => {
  assert.equal(fileTypeOf('CLAUDE.MD').tone, 'md')
  assert.equal(fileTypeOf('App.TSX').tone, 'code')
  assert.equal(fileTypeOf('dockerfile').tone, 'docker')
})

// ---------- sorting ----------

const dir = (name) => ({ name, type: 'directory', size: 0 })
const file = (name, size, mtime) => ({ name, type: 'file', size, mtime })

test('folders always sort before files, in every mode', () => {
  const entries = [file('a.txt', 1, 1), dir('zzz'), file('b.txt', 2, 2), dir('aaa')]
  for (const mode of ['name', 'name-desc', 'size', 'date']) {
    const out = sortEntries(entries, mode)
    assert.deepEqual(out.map((e) => e.type), ['directory', 'directory', 'file', 'file'], mode)
  }
})

test('name sorts ascending and descending, naturally', () => {
  const entries = [file('file10.md', 1, 1), file('file2.md', 1, 1), file('file1.md', 1, 1)]
  assert.deepEqual(sortEntries(entries, 'name').map((e) => e.name), ['file1.md', 'file2.md', 'file10.md'])
  assert.deepEqual(sortEntries(entries, 'name-desc').map((e) => e.name), ['file10.md', 'file2.md', 'file1.md'])
})

test('size sorts largest first', () => {
  const entries = [file('small', 10, 1), file('big', 500, 2), file('mid', 100, 3)]
  assert.deepEqual(sortEntries(entries, 'size').map((e) => e.name), ['big', 'mid', 'small'])
})

test('date sorts newest first and tolerates missing mtime', () => {
  const entries = [file('old', 1, 100), file('new', 1, 900), { name: 'nometa', type: 'file' }]
  assert.deepEqual(sortEntries(entries, 'date').map((e) => e.name), ['new', 'old', 'nometa'])
})

test('sorting does not mutate the input array', () => {
  const entries = [file('b', 1, 1), file('a', 1, 1)]
  const copy = entries.slice()
  sortEntries(entries, 'name')
  assert.deepEqual(entries, copy)
})
