import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Regression tests for the client's inline markdown renderer.
 *
 * The browser bundle is not importable as a module, so the shipped code is
 * extracted verbatim from lib/client.js and evaluated in isolation. That keeps
 * the assertions pinned to what actually runs in the browser.
 */
const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const start = source.indexOf('const escapeHtml =')
const end = source.indexOf('const itemContent =')
assert.ok(start !== -1 && end > start, 'escapeHtml/mdInline region found in lib/client.js')
const { mdInline } = new Function(source.slice(start, end) + '\nreturn { escapeHtml, mdInline };')()

test('inline code keeps markdown syntax literal (no live image)', () => {
  const out = mdInline('`![p](https://attacker.example/x.png)`')
  assert.equal(out, '<code>![p](https://attacker.example/x.png)</code>')
  assert.ok(!out.includes('<img'), 'no live <img> inside inline code')
})

test('inline code keeps link syntax literal', () => {
  const out = mdInline('`[click](javascript:alert(1))`')
  assert.equal(out, '<code>[click](javascript:alert(1))</code>')
  assert.ok(!out.includes('<a '), 'no live <a> inside inline code')
})

test('markdown outside code still renders', () => {
  assert.equal(mdInline('**bold**'), '<strong>bold</strong>')
  assert.match(mdInline('[ok](https://example.com)'), /^<a href="https:\/\/example\.com"/)
})

test('dangerous link schemes are neutralized outside code', () => {
  for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'vbscript:msgbox', 'data:text/html,1']) {
    const out = mdInline('[x](' + bad + ')')
    assert.ok(!out.includes('<a '), `no link rendered for ${bad} (got: ${out})`)
  }
  assert.equal(mdInline('[x](data:text/html,1)'), '<span>x</span>')
})

test('html is escaped', () => {
  assert.equal(mdInline('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;')
})

test('images outside code carry no-referrer and lazy loading', () => {
  const out = mdInline('![a](https://example.com/x.png)')
  assert.match(out, /^<img src="https:\/\/example\.com\/x\.png" alt="a" loading="lazy" referrerpolicy="no-referrer" \/>$/)
})
