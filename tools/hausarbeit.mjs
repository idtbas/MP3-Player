#!/usr/bin/env node
// Builds hausarbeit/index.html: a password gate that carries the real page
// encrypted (PBKDF2-SHA256 + AES-256-GCM). Without the password the page's
// content can't be read, neither on GitHub Pages nor in the repository.
//
//   HB_PASS='…' node tools/hausarbeit.mjs encrypt <source.html>   → hausarbeit/index.html
//   HB_PASS='…' node tools/hausarbeit.mjs decrypt <out.html>      ← hausarbeit/index.html
//
// Changing the password: decrypt with the old one, encrypt with the new one.
import { webcrypto as crypto } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'hausarbeit', 'index.html');
const ITER = 250000;
const [, , cmd, file] = process.argv;
const pass = process.env.HB_PASS;
if (!['encrypt', 'decrypt'].includes(cmd) || !file || !pass) {
  console.error("usage: HB_PASS='…' node tools/hausarbeit.mjs encrypt|decrypt <file>");
  process.exit(1);
}
const b64 = u => Buffer.from(u).toString('base64');
const unb64 = s => new Uint8Array(Buffer.from(s, 'base64'));

async function key(salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

if (cmd === 'encrypt') {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(salt), new TextEncoder().encode(readFileSync(file, 'utf8')));
  const payload = JSON.stringify({ s: b64(salt), i: b64(iv), n: ITER, c: b64(new Uint8Array(ct)) });
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, gate(payload));
  console.log(`wrote ${OUT}`);
} else {
  const m = readFileSync(OUT, 'utf8').match(/<script id="payload" type="application\/json">(.*?)<\/script>/s);
  const p = JSON.parse(m[1]);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(p.i) }, await key(unb64(p.s)), unb64(p.c));
  writeFileSync(file, new TextDecoder().decode(pt));
  console.log(`wrote ${file}`);
}

function gate(payload) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Geschützter Bereich</title>
<style>
:root{--bg:#f4f5f7;--card:#fff;--ink:#1d2430;--muted:#6b7380;--line:#dde1e7;--accent:#1f3a5f}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#14171c;--card:#1d2128;--ink:#e8eaee;--muted:#9aa2ad;--line:#2e343d;--accent:#8fb0dd}}
:root[data-theme="dark"]{--bg:#14171c;--card:#1d2128;--ink:#e8eaee;--muted:#9aa2ad;--line:#2e343d;--accent:#8fb0dd}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
form{width:min(360px,100%);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:28px 24px}
.logo{width:44px;height:44px;border-radius:10px;background:var(--accent);color:var(--card);display:grid;place-items:center;font:600 19px Georgia,serif;margin-bottom:16px}
h1{font-size:19px;margin:0 0 4px}
p{margin:0 0 18px;color:var(--muted);font-size:14px}
input[type=password]{width:100%;padding:11px 12px;font:inherit;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}
label{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--muted);margin:12px 0 16px}
button{width:100%;padding:11px;font-family:inherit;font-weight:600;font-size:15px;border:0;border-radius:8px;background:var(--accent);color:var(--card);cursor:pointer}
.err{color:#d93025;font-size:13px;min-height:18px;margin-top:10px}
</style>
</head>
<body>
<form id="f" autocomplete="on">
  <div class="logo">JL</div>
  <h1>Geschützter Bereich</h1>
  <p>Diese Arbeit ist nur für Seminarteilnehmende freigegeben.</p>
  <input type="password" id="pw" placeholder="Passwort" autocomplete="current-password" autofocus>
  <label><input type="checkbox" id="keep"> Auf diesem Gerät merken</label>
  <button id="go">Öffnen</button>
  <div class="err" id="err"></div>
</form>
<script id="payload" type="application/json">${payload}</script>
<script>
(() => {
  const P = JSON.parse(document.getElementById('payload').textContent);
  const ub = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const store = { get() { try { return localStorage.getItem('hb-pw'); } catch (e) { return null; } }, set(v) { try { v ? localStorage.setItem('hb-pw', v) : localStorage.removeItem('hb-pw'); } catch (e) {} } };
  async function open(pw) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: ub(P.s), iterations: P.n, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const html = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub(P.i) }, k, ub(P.c)));
    document.open(); document.write(html); document.close();
  }
  const f = document.getElementById('f'), err = document.getElementById('err'), go = document.getElementById('go');
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const pw = document.getElementById('pw').value; if (!pw) return;
    go.disabled = true; go.textContent = 'Prüfe …'; err.textContent = '';
    try { if (document.getElementById('keep').checked) store.set(pw); await open(pw); }
    catch (x) { store.set(null); err.textContent = 'Falsches Passwort.'; go.disabled = false; go.textContent = 'Öffnen'; }
  });
  const saved = store.get();
  if (saved) open(saved).catch(() => store.set(null));
  if (!window.isSecureContext || !crypto.subtle) err.textContent = 'Bitte über https:// öffnen.';
})();
</script>
</body>
</html>
`;
}
