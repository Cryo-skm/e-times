/* e次元 · 离线缓存 Service Worker
   ────────────────────────────────────────────────────────────────
   v3 起放弃「cache-first + 从不清缓存」的老策略。

   教训（v1/v2）：老 sw.js 用 cache-first 且缓存名恒为 icbc-xingegu-v1、
   永不回源更新 —— 结果 sw.js 写完之后站点又改了十几次提交，
   凡打开过一次的人（包括评委）拿到的永远是旧版 CSS/JS/HTML，怎么刷都没用。

   现在：
     · HTML 导航 → network-first（永远优先拿最新；断网才回缓存）
     · 静态资源（css/js/img/字体） → stale-while-revalidate（秒开 + 后台静默更新）
     · install 即 skipWaiting，activate 即 clients.claim，切版本立即接管
     · 只管理同源 GET，跨域与 Range 请求原样放行
   ──────────────────────────────────────────────────────────────── */

const VERSION = 'v4';
const PREFIX = 'icbc-xingegu-';
const CACHE = PREFIX + VERSION;

/* 外壳预缓存：断网也能打开应用（图片按需缓存，避免首次安装拖 7MB） */
const PRECACHE = [
  './', './index.html', './manifest.json',
  './css/style.css', './css/xingegu.css', './css/ec-modules.css', './css/ec-theme.css',
  './css/ec-auth.css',
  './js/data.js', './js/art.js', './js/chars.js', './js/app.js', './js/bank-biz.js',
  './js/xingegu.js', './js/modules3.js', './js/ec-discovery.js', './js/ec-entry.js',
  './js/pwa.js', './js/a11y.js', './js/router.js',
  './js/auth.js',
  './img/icon-192.png', './img/icon-512.png'
];

/* ── install：预缓存 + 立即跳出 waiting ── */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 逐个 add：个别文件 404 不该让整批预缓存全废
    await Promise.all(PRECACHE.map(u => cache.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

/* ── activate：清掉所有旧版本缓存 + 立即接管已打开的页面 ── */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ── 工具 ── */
const sameOrigin = url => url.origin === self.location.origin;

async function putSafe(req, res) {
  if (!res || res.status !== 200 || res.type === 'opaque') return;
  try {
    const c = await caches.open(CACHE);
    await c.put(req, res.clone());
  } catch (e) { /* 配额满 / 不可缓存 —— 忽略 */ }
}

/* stale-while-revalidate：先给缓存（秒开），同时后台拉新版写回 */
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const network = fetch(req).then(res => { putSafe(req, res); return res; }).catch(() => null);
  if (hit) return hit;                 // 后台更新，不阻塞这一次响应
  const res = await network;
  if (res) return res;
  throw new Error('offline and not cached');
}

/* network-first：HTML 永远优先最新，断网退缓存，再退外壳 */
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    putSafe(req, res);
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    if (hit) return hit;
    const shell = (await cache.match('./index.html')) || (await cache.match('./'));
    if (shell) return shell;
    throw e;
  }
}

/* ── fetch 路由 ── */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (!sameOrigin(url)) return;              // 跨域（第三方）一律放行
  if (req.headers.has('range')) return;      // Range 请求不拦（音视频等）

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(staleWhileRevalidate(req));
  }
});

/* ── 页面可主动喊它提速接管 ── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
