/* PWA 注册（移动端 / PC 端共用）
   ────────────────────────────────────────────────────────────────
   sw.js 的策略是「HTML 导航 network-first + 静态资源 stale-while-revalidate」。
   这里负责：
     1) 注册 SW（updateViaCache:none，保证 sw.js 本身不被缓存卡住）
     2) 发现新版本 → 立刻让它接管（SKIP_WAITING）
     3) 新版本接管后，若页面此前已被旧 SW 控制 → 自动刷新一次，拿最新资源
        （这一步是修「站点被永久冻结在旧版本」的关键）
     4) 页面重新可见时顺手查一次更新，长挂的标签页也能及时更新
   ──────────────────────────────────────────────────────────────── */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;

  var hadController = !!navigator.serviceWorker.controller;
  var reloaded = false;
  // PC 端在 /pc/ 下，SW 位于根目录
  var swUrl = /\/pc\//.test(location.pathname) ? '../sw.js' : 'sw.js';

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' }).then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', function () {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage('SKIP_WAITING');
          }
        });
      });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
          try { reg.update(); } catch (e) {}
        }
      });
      // 暴露给调试用
      window.__swReg = reg;
    }).catch(function () {});
  });

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController || reloaded) return;   // 首次安装不刷，避免多余的一次刷新
    reloaded = true;
    location.reload();
  });
})();
