import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NS, zh, en } from '../lib/client/locales.js'

/**
 * Compile-time key checking (LocaleNamespaceMap declaration merging) needs
 * the real dsh-client-locale types, which src/client/index.ts opts out of
 * via @ts-nocheck (see its header comment). This is the runtime substitute:
 * both shipped dictionaries must expose exactly the same key set, or a
 * language silently falls back to the raw key at render time.
 */

test('zh and en dictionaries carry the same keys', () => {
  const zhKeys = Object.keys(zh).sort()
  const enKeys = Object.keys(en).sort()
  assert.deepEqual(zhKeys, enKeys)
})

test('every dictionary value is a non-empty string', () => {
  for (const dict of [zh, en]) {
    for (const [key, value] of Object.entries(dict)) {
      assert.equal(typeof value, 'string', `${key} should be a string`)
      assert.ok(value.length > 0, `${key} should not be empty`)
    }
  }
})

test('namespace is a stable, non-empty identifier', () => {
  assert.equal(NS, 'file-explorer')
})

// Host error codes (src/index.ts open-vscode/open-folder routes) must each
// resolve through 'error.<code>' — a code without a matching key falls back
// to the raw key string on screen instead of translated text.
test('every host error code has a matching error.<code> dictionary key', () => {
  const hostCodes = [
    'vscode-not-found',
    'target-not-found',
    'open-exit-code',
    'explorer-unavailable',
    'finder-unavailable',
    'file-manager-unavailable',
  ]
  for (const code of hostCodes) {
    assert.ok(`error.${code}` in zh, `zh is missing error.${code}`)
    assert.ok(`error.${code}` in en, `en is missing error.${code}`)
  }
})
