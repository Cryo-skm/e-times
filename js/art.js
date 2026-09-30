/* ════════════════════════════════════════════════════════════════════
   ART · 插画资源工具（WebP + srcset 响应式）
   ─────────────────────────────────────────────────────────────────────
   为什么存在：
     img/art 下原有 59 张 JPEG 共 7.2MB，最大单张 344KB，且全站 0 处 srcset。
     本模块统一把「一张 JPEG 路径」渲染成现代 <picture>：
       · <source type="image/webp">  给支持 WebP 的浏览器（绝大多数）
       · <img src="....jpg">         兜底，老浏览器照样能看
       · srcset 多档宽度 + sizes     手机不会去下 1200px 的大图
     分档宽度必须与生成脚本（_gen_webp.py）的 RULES 严格一致。

   用法：
     ART.pic('img/art/banner-door.jpg', { cls, alt, eager, gart, id, style })
     ART.urls('img/art/banner-door.jpg')  → { srcset, sizes, full }
     ART.apply(imgEl, jpg)                → 就地换图（同时改 <source>，性别切换用）
     ART.webpOk                           → 本浏览器是否支持 WebP（CSS 背景兜底用）
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* 类别 → [小档宽度…, 完整档宽度, sizes]
     与 _gen_webp.py 的 RULES 一一对应 */
  const RULES = [
    ['banner', [480, 800], 1200, '(max-width: 900px) 92vw, 880px'],
    ['cover',  [480, 640],  820, '100vw'],
    ['char',   [240],       420, '160px'],
    ['goods',  [280],       520, '(max-width: 520px) 44vw, 240px'],
    ['card',   [400, 800], 1200, '(max-width: 520px) 92vw, 460px']
  ];
  const MIME = 'image/webp';

  function meta(jpg) {
    const name = String(jpg).replace(/^.*\//, '');
    for (let i = 0; i < RULES.length; i++) {
      if (name.indexOf(RULES[i][0]) === 0) {
        return { smalls: RULES[i][1], full: RULES[i][2], sizes: RULES[i][3] };
      }
    }
    return { smalls: [], full: 1200, sizes: '100vw' };
  }

  const strip = jpg => String(jpg).replace(/\.jpe?g$/i, '');

  function urls(jpg) {
    const m = meta(jpg);
    const base = strip(jpg);
    const list = [];
    for (let i = 0; i < m.smalls.length; i++) {
      const w = m.smalls[i];
      if (w < m.full) list.push(base + '-' + w + '.webp ' + w + 'w');
    }
    list.push(base + '.webp ' + m.full + 'w');
    return { srcset: list.join(', '), sizes: m.sizes, full: m.full };
  }

  /* 同步、无网络的 WebP 能力探测 */
  const webpOk = (function () {
    try {
      const c = document.createElement('canvas');
      c.width = 1; c.height = 1;
      return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) { return false; }
  })();

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  /* 生成 <picture>。o 里的属性写进 <img>，保证原有 CSS 钩子仍然命中 */
  function pic(jpg, o) {
    o = o || {};
    const u = urls(jpg);
    const a = [];
    if (o.id) a.push('id="' + esc(o.id) + '"');
    if (o.cls) a.push('class="' + esc(o.cls) + '"');
    if (o.gart) a.push('data-gart="' + esc(o.gart) + '"');
    if (o.cid) a.push('data-cid="' + esc(o.cid) + '"');
    a.push('src="' + esc(jpg) + '"');
    if (o.w) a.push('width="' + o.w + '"');
    if (o.h) a.push('height="' + o.h + '"');
    a.push('alt="' + esc(o.alt) + '"');
    a.push('loading="' + (o.eager ? 'eager' : 'lazy') + '"');
    a.push('decoding="' + (o.eager ? 'sync' : 'async') + '"');
    if (o.eager) a.push('fetchpriority="high"');
    if (o.drag !== false) a.push('draggable="false"');
    if (o.style) a.push('style="' + esc(o.style) + '"');
    if (o.extra) a.push(o.extra);
    const pcls = o.pcls ? ' class="' + esc(o.pcls) + '"' : ' class="art-pic"';
    return '<picture' + pcls + '><source type="' + MIME + '" srcset="' + u.srcset +
      '" sizes="' + u.sizes + '"><img ' + a.join(' ') + '></picture>';
  }

  /* 就地换图：<img> 与同层 <source> 一起改（性别切换走这里，不重建 DOM） */
  function apply(imgEl, jpg) {
    if (!imgEl) return;
    const u = urls(jpg);
    imgEl.src = jpg;
    const p = imgEl.parentNode;
    if (p && p.tagName === 'PICTURE') {
      const s = p.querySelector('source[type="' + MIME + '"]');
      if (s) { s.srcset = u.srcset; s.sizes = u.sizes; }
    }
  }

  window.ART = { pic: pic, urls: urls, apply: apply, webpOk: webpOk, meta: meta };
})();
