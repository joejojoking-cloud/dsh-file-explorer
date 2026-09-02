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
export declare const NS = "file-explorer";
type LocaleDict = Record<string, string>;
export declare const zh: LocaleDict;
export declare const en: LocaleDict;
export {};
