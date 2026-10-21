#!/usr/bin/env node
/*
  digiTatti demo server
  =====================
  Serves the presentations in this folder from http://127.0.0.1 and routes every live-demo
  iframe through a local proxy (one port per demo site). The demo page then belongs to the
  same site as the slides, so:
    · logins made inside the iframe stick (the site's session cookie is no longer third-party);
    · sites that forbid being framed (X-Frame-Options, CSP frame-ancestors) can be shown.
  Nothing changes on the demo servers. Opened from a file or from GitHub Pages, the slides
  still work, with plain iframes, and offer to start this server.

    node demo-server.mjs                 # this folder, port 8000
    node demo-server.mjs ../other-deck --port 9000
    node demo-server.mjs --install       # macOS, once: the slides can then start the server
    node demo-server.mjs --uninstall     #   themselves, after you confirm the browser's prompt

  Node 18 or newer, no dependencies. It listens on 127.0.0.1 only and answers only requests
  addressed to it: it is meant for the computer you present from. DEBUG=1 logs every proxied
  request.
*/
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
function flag(name, def){ const j = args.indexOf(name); return j > -1 ? args.splice(j, 2)[1] : def; }
const PORT = +flag('--port', 8000);
const LAUNCH = flag('--url', null);   // set by the launcher app: digitatti-demo://start?file=/path/deck.html
const HOST = '127.0.0.1';
const DEBUG = !!process.env.DEBUG;
const IDLE = LAUNCH ? 3 * 3600e3 : 0; // a server started from the slides stops after 3 idle hours
const SCHEME = 'digitatti-demo';
const APP = path.join(os.homedir(), 'Applications', 'digiTatti Demo Server.app');
const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf'
};

if (args.includes('--install')){ install(); process.exit(0); }
if (args.includes('--uninstall')){ uninstall(); process.exit(0); }
const ROOT = rootFolder();

function rootFolder(){
  if (!LAUNCH) return path.resolve(args[0] || path.dirname(fileURLToPath(import.meta.url)));
  let f = '';
  try { f = new URL(LAUNCH).searchParams.get('file') || ''; } catch {}
  if (!path.isAbsolute(f) || !f.endsWith('.html') || !fs.existsSync(f)){ console.error('Not a presentation file:', f); process.exit(1); }
  return path.dirname(f);
}

let last = Date.now();
if (IDLE) setInterval(() => { if (Date.now() - last > IDLE) process.exit(0); }, 60e3).unref();

// answer only requests addressed to this machine: blocks DNS-rebinding tricks from other sites
function local(req){
  const h = req.headers.host || '', p = req.socket.localPort;
  return h === `${HOST}:${p}` || h === `localhost:${p}`;
}

/* ============ static files: the presentations ============ */
function decks(){ return fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort(); }

function serveStatic(req, res){
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return res.writeHead(400).end(); }
  if (p === '/'){
    const d = decks();
    if (d.length === 1) return res.writeHead(302, { location: '/' + encodeURIComponent(d[0]) }).end();
    res.writeHead(200, { 'content-type': TYPES['.html'] });
    return res.end(d.map(f => `<p><a href="/${encodeURIComponent(f)}">${f}</a></p>`).join('') || 'No .html files here.');
  }
  const file = path.join(ROOT, p), type = TYPES[path.extname(file).toLowerCase()];
  if (!file.startsWith(ROOT + path.sep) || !type) return res.writeHead(404).end();
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
}

// the slides, opened as a file, ask whether this server is running and serves them
function ping(req, res, u){
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-private-network': 'true', 'cache-control': 'no-store' };
  if (req.method === 'OPTIONS') return res.writeHead(204, { ...cors, 'access-control-allow-methods': 'GET' }).end();
  const f = u.searchParams.get('file') || '', rel = path.relative(ROOT, f);
  const serves = path.isAbsolute(f) && !!rel && !rel.startsWith('..') && !path.isAbsolute(rel) && fs.existsSync(f);
  res.writeHead(200, { ...cors, 'content-type': 'application/json' });
  res.end(JSON.stringify({ serves, url: serves ? `http://${HOST}:${req.socket.localPort}/` + rel.split(path.sep).map(encodeURIComponent).join('/') : null }));
}

/* ============ proxies: one local port per demo site ============ */
const proxies = new Map();   // target origin → Promise of the local base URL
let nextPort = PORT + 101;

function listen(server, port){
  return new Promise((resolve, reject) => {
    function onError(e){ if (e.code === 'EADDRINUSE') resolve(listen(server, port + 1)); else reject(e); }
    server.once('error', onError);
    server.listen(port, HOST, () => { server.off('error', onError); resolve(port); });
  });
}

function proxyFor(target){
  if (!proxies.has(target)){
    const server = http.createServer(), p = listen(server, nextPort++).then(port => {
      const base = `http://${HOST}:${port}`;
      server.on('request', (req, res) => { last = Date.now(); if (local(req)) forward(target, base, req, res); else res.writeHead(421).end(); });
      server.on('upgrade', (req, socket, head) => { if (local(req)) tunnel(target, base, req, socket, head); else socket.destroy(); });
      console.log(`  demo  ${target}  →  ${base}`);
      return base;
    });
    proxies.set(target, p);
  }
  return proxies.get(target);
}

// every demo site shares the cookie jar of 127.0.0.1, so its cookies get a prefix of their own
function prefixOf(target){ return 'd' + crypto.createHash('sha1').update(target).digest('hex').slice(0, 6) + '_'; }

function requestHeaders(target, base, h){
  const t = new URL(target), out = { ...h, host: t.host };
  for (const k of ['origin', 'referer']){
    if (!out[k]) continue;
    if (out[k].startsWith(base)) out[k] = target + out[k].slice(base.length); else delete out[k];
  }
  const pre = prefixOf(target);
  const jar = (h.cookie || '').split(/;\s*/).filter(c => c.startsWith(pre)).map(c => c.slice(pre.length));
  if (jar.length) out.cookie = jar.join('; '); else delete out.cookie;
  return out;
}

function rewriteCookie(c, pre){
  const [pair, ...attrs] = c.split(';');
  const keep = attrs.map(a => a.trim()).filter(a => a && !/^(domain|secure|samesite|partitioned)\b/i.test(a));
  return [pre + pair.trim(), ...keep, 'SameSite=Lax'].join('; ');
}

function responseHeaders(target, base, h){
  const t = new URL(target), out = { ...h };
  delete out['x-frame-options'];
  delete out['strict-transport-security'];   // must never reach 127.0.0.1
  for (const k of ['content-security-policy', 'content-security-policy-report-only']){
    if (!out[k]) continue;
    const v = String(out[k]).split(';').map(d => d.trim())
      .filter(d => d && !/^(frame-ancestors|upgrade-insecure-requests|block-all-mixed-content)\b/i.test(d)).join('; ');
    if (v) out[k] = v; else delete out[k];
  }
  if (out.location){
    const l = out.location;
    if (l.startsWith(target)) out.location = base + l.slice(target.length);
    else if (l.startsWith('//' + t.host)) out.location = base + l.slice(2 + t.host.length);
  }
  if (out['access-control-allow-origin'] === target) out['access-control-allow-origin'] = base;
  if (out['set-cookie']) out['set-cookie'] = out['set-cookie'].map(c => rewriteCookie(c, prefixOf(target)));
  delete out.connection; delete out['keep-alive'];
  return out;
}

function upstream(target, base, req){
  const t = new URL(target), mod = t.protocol === 'https:' ? https : http;
  return mod.request({ hostname: t.hostname, port: t.port || (t.protocol === 'https:' ? 443 : 80),
    method: req.method, path: req.url, headers: requestHeaders(target, base, req.headers) });
}

function forward(target, base, req, res){
  const up = upstream(target, base, req);
  up.on('response', r => {
    if (DEBUG) console.log(`  ${r.statusCode} ${req.method} ${target}${req.url}${req.headers.cookie ? '' : '  (no cookie)'}`);
    res.writeHead(r.statusCode, r.statusMessage, responseHeaders(target, base, r.headers));
    r.pipe(res);
  });
  up.on('error', e => { if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' }); res.end(`demo server: ${target} unreachable (${e.message})`); });
  req.pipe(up);
}

// websockets, for demo sites that use them
function tunnel(target, base, req, socket, head){
  const up = upstream(target, base, req);
  up.on('upgrade', (r, s, upHead) => {
    const lines = [`HTTP/1.1 101 ${r.statusMessage}`];
    for (let j = 0; j < r.rawHeaders.length; j += 2) lines.push(r.rawHeaders[j] + ': ' + r.rawHeaders[j + 1]);
    socket.write(lines.join('\r\n') + '\r\n\r\n');
    if (upHead.length) socket.write(upHead);
    if (head.length) s.write(head);
    s.pipe(socket).pipe(s);
    s.on('error', () => socket.destroy()); socket.on('error', () => s.destroy());
  });
  up.on('response', r => socket.end(`HTTP/1.1 ${r.statusCode} ${r.statusMessage}\r\n\r\n`));
  up.on('error', () => socket.destroy());
  up.end();
}

/* ============ launcher (macOS): a link the slides can open, after the browser asks ============ */
function as(s){ return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }   // AppleScript string

function install(){
  if (process.platform !== 'darwin'){ console.error('The launcher is macOS only: run  node demo-server.mjs  before presenting.'); process.exit(1); }
  const server = path.join(APP, 'Contents', 'Resources', 'demo-server.mjs'), log = path.join(os.tmpdir(), 'digitatti-demo-server.log');
  const script = [
    'on open location theURL',
    `  do shell script "pkill -f '[d]emo-server.mjs --url' ; " & quoted form of ${as(process.execPath)} & " " & quoted form of ${as(server)} & " --url " & quoted form of theURL & " > " & quoted form of ${as(log)} & " 2>&1 &"`,
    'end open location',
    'on run',
    '  activate',
    '  display dialog "digiTatti Demo Server is installed. Start it from the live-demo slide of a presentation opened as a file." buttons {"OK"} default button 1 with title "digiTatti"',
    'end run'
  ].join('\n');
  const src = path.join(os.tmpdir(), 'digitatti-demo-launcher.applescript'), plist = path.join(APP, 'Contents', 'Info.plist');
  fs.rmSync(APP, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(APP), { recursive: true });
  fs.writeFileSync(src, script);
  execFileSync('osacompile', ['-o', APP, src]);
  fs.copyFileSync(fileURLToPath(import.meta.url), server);
  execFileSync('/usr/libexec/PlistBuddy', [
    '-c', 'Add :CFBundleURLTypes array', '-c', 'Add :CFBundleURLTypes:0 dict',
    '-c', 'Add :CFBundleURLTypes:0:CFBundleURLName string digiTatti demo server',
    '-c', 'Add :CFBundleURLTypes:0:CFBundleURLSchemes array', '-c', `Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string ${SCHEME}`,
    '-c', 'Add :LSUIElement bool true', plist]);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', APP]);
  execFileSync(LSREGISTER, ['-f', APP]);
  console.log(`Installed ${APP}\nThe live-demo slides can now start the demo server: confirm the browser's prompt to open it.\nUsing node at ${process.execPath}; after updating node or this script, run --install again.`);
}

function uninstall(){
  if (fs.existsSync(APP)){ try { execFileSync(LSREGISTER, ['-u', APP]); } catch {} fs.rmSync(APP, { recursive: true, force: true }); }
  console.log('Launcher removed.');
}

/* ============ main server ============ */
const main = http.createServer((req, res) => {
  last = Date.now();
  if (!local(req)) return res.writeHead(421).end();
  const u = new URL(req.url, `http://${HOST}`);
  if (u.pathname === '/__demo/ping') return ping(req, res, u);
  if (u.pathname !== '/__demo/proxy') return serveStatic(req, res);
  // the slides ask for the local address of a demo page: /__demo/proxy?url=https://…
  let t;
  try { t = new URL(u.searchParams.get('url')); } catch {}
  if (!t || !/^https?:$/.test(t.protocol)) return res.writeHead(400).end();
  proxyFor(t.origin).then(base => {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ url: base + t.pathname + t.search + t.hash }));
  }, e => res.writeHead(500, { 'content-type': 'text/plain' }).end(String(e)));
});

listen(main, PORT).then(port => {
  nextPort = Math.max(nextPort, port + 101);
  console.log(`\ndigiTatti demo server · ${ROOT}\n`);
  decks().forEach(d => console.log(`  open  http://${HOST}:${port}/${encodeURI(d)}`));
  console.log('\nLive demos are proxied through 127.0.0.1, so logins inside the frame work. Ctrl+C to stop.\n');
}, e => { console.error(e.message); process.exit(1); });
