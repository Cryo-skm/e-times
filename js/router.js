/* ═══════════════════════════════════════════════════════════════════
   js/router.js —— 极轻量 hash 路由 + 逐页标题
   ───────────────────────────────────────────────────────────────────
   评估建议 #5：全站 0 个 location.hash、标题永远只有一句、子页面无法直达。
   本文件让每个页面都能被 URL 直接打开，前进/后退可用，标签标题随页更新。

   手机端（/）
     #/t/home   #/t/credit   #/t/wealth   #/t/life   #/t/mine    —— 五个主 Tab
     #/p/transfer  #/p/scan  #/p/xiaozhi  #/p/msgcenter …        —— 浮层页
     #/biz/loan    #/biz/carddetail/c1  #/biz/paybill/水费        —— 业务办理页
     #/xg/plaza    #/xg/mall  #/xg/cang   #/xg/shigu …            —— e次元 子页
   PC 端（/pc/）
     #/bank        #/ec/home  #/ec/goods  #/ec/shigu  #/ec/me …

   登录屏（两端通用）
     #/login      —— 全屏登录/注册/找回密码；它是模态，优先级高于下面所有路由。
                     登录屏打开时 hash 与 title 都归它；登录成功或选择游客浏览后
                     自动回落到登录前的页面。已登录状态下访问 #/login 不会重复弹屏。

   设计原则：不抢原有逻辑，只做「包裹 + 回写」。
   · 保留一个描述符栈，用「还在不在 DOM 上」自愈式校验，避免状态漂移
   · 同一 tick 内多次变化合并成一次写 hash，history 里不留中间态
   · 任何异常都吞掉并打日志，绝不影响原站功能
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__EC_ROUTER__) return;
  window.__EC_ROUTER__ = true;

  var SITE = 'e次元 · 工行杯参赛作品';
  var IS_PC = !!document.getElementById('ecapp');
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var suppress = false;        /* 应用路由时抑制「回写」 */
  var syncT = null;            /* 合并写 hash 的定时器 */
  var stack = [];              /* 手机端导航描述符栈（自愈式） */

  /* ────────── 文案表 ────────── */
  var TAB_LABEL = { 'view-home': '首页', 'view-credit': '信用卡', 'view-wealth': '财富', 'view-life': '生活', 'view-mine': '我的' };
  var TAB_SLUG = { 'view-home': 'home', 'view-credit': 'credit', 'view-wealth': 'wealth', 'view-life': 'life', 'view-mine': 'mine' };
  var SLUG_TAB = { home: 'view-home', credit: 'view-credit', wealth: 'view-wealth', life: 'view-life', mine: 'view-mine' };
  var XG_LABEL = {
    plaza: 'e次元广场', forum: '谷圈论坛', mall: '谷子商城', mallorder: '商城订单',
    mine: '我的谷仓', create: '发布创作', exchange: '谷子交易所', brand: '品牌馆',
    shigu: '识谷 · AI 估值', zaangu: '攒谷 · 成长体系', chugu: '出谷通 · 安全托管',
    guka: '谷卡 · 联名卡', guxiang: '谷享 · AI 代购', zhidai: '质押贷 · 藏品变额度', cang: '藏馆 · 数字分身'
  };
  var PC_LABEL = {};           /* 从 PC 菜单 DOM 里读，避免二次维护 */

  /* ────────── 标题 ────────── */
  function setTitle(t) {
    var v = t ? (t + ' · ' + SITE) : SITE;
    if (document.title !== v) document.title = v;
  }
  /* 登录屏有自己的标题（不套 SITE 后缀，因为此时还没进站） */
  var LOGIN_TITLE = '登录 · 中国工商银行（手机银行 模拟演示版）';
  function setTitleFor(d) {
    if (d && d.k === 'login') { if (document.title !== LOGIN_TITLE) document.title = LOGIN_TITLE; }
    else setTitle(d && d.label);
  }

  /* ────────── 登录屏（模态，优先级最高） ────────── */
  function loginOn() {
    var el = document.getElementById('eaScreen');
    return !!(el && el.classList && el.classList.contains('on'));
  }
  function authReady() { return !!(window.ECAUTH && typeof ECAUTH.isLoggedIn === 'function'); }
  /* 登录屏打开时它就是「当前页」，盖过 Tab / 浮层 / e次元 / 网银 */
  function topDesc() { return loginOn() ? { k: 'login', label: '登录' } : null; }
  function authShow() {
    if (!authReady() || ECAUTH.isLoggedIn()) return false;
    try { ECAUTH.show(); return true; } catch (e) { return false; }
  }

  /* ────────── 手机端：描述符 ────────── */
  function pageLabel(id) {
    var el = document.getElementById('page-' + id);
    var l = el && el.getAttribute('aria-label');
    return l || '手机银行';
  }
  function defaultDesc() {
    var login = topDesc();
    if (login) return login;
    var tv = $('.tab-view.active');
    var id = tv ? tv.id : 'view-home';
    return { k: 't', id: id, label: TAB_LABEL[id] || '手机银行' };
  }
  /* 描述符「还活着吗」—— 由此实现栈的自愈，不需要监听每一次关闭 */
  function live(d) {
    if (!d) return false;
    if (d.k === 'login') return loginOn();
    if (d.k === 't') { var tv = $('.tab-view.active'); return !!tv && tv.id === d.id; }
    if (d.k === 'p') { var el = document.getElementById('page-' + d.id); return !!el && el.classList.contains('open'); }
    if (d.k === 'biz') {
      if (!$('#page-biz.open')) return false;
      var st = (window.BANK && BANK.stack) ? BANK.stack() : [];
      var t = st[st.length - 1];
      return !!t && t.key === d.key && (t.param === d.param || (t.param == null && d.param == null));
    }
    if (d.k === 'xg') {
      if (!$('#page-xingegu.open')) return false;
      var pg = (window.XZG && XZG._lastPg) || 'plaza';
      return pg === d.pg;
    }
    return false;
  }
  function current() {
    var login = topDesc();
    if (login) return login;
    while (stack.length && !live(stack[stack.length - 1])) stack.pop();
    return stack[stack.length - 1] || null;
  }

  /* ────────── PC 端：状态直接读 DOM（只有「在 e次元 / 在网银」两种） ────────── */
  function buildPCLabel() {
    $$('#ecMenu .ec-mi').forEach(function (b) {
      var s = b.querySelector('span');
      if (s && b.dataset.pcpage) PC_LABEL[b.dataset.pcpage] = s.textContent.trim();
    });
  }
  function pcCurrent() {
    var login = topDesc();
    if (login) return login;
    var app = $('#ecapp');
    if (app && app.classList.contains('on')) {
      var on = $('#ecMenu .ec-mi.on');
      var pg = (on && on.dataset.pcpage) || 'home';
      if (!PC_LABEL[pg]) buildPCLabel();
      return { k: 'ecpg', pg: pg, label: PC_LABEL[pg] || 'e次元 PC 工作台' };
    }
    return { k: 'bank', label: '个人网上银行' };
  }

  /* ────────── 描述符 → hash ────────── */
  function hashOf(d) {
    d = d || (IS_PC ? pcCurrent() : defaultDesc());
    if (d.k === 'login') return '#/login';
    if (IS_PC) return d.k === 'ecpg' ? '#/ec/' + d.pg : '#/bank';
    if (d.k === 't') return '#/t/' + (TAB_SLUG[d.id] || 'home');
    if (d.k === 'xg') return '#/xg/' + d.pg;
    if (d.k === 'biz') return '#/biz/' + encodeURIComponent(d.key) +
      (d.param != null && d.param !== '' ? '/' + encodeURIComponent(d.param) : '');
    if (d.k === 'p') return '#/p/' + d.id;
    return '#/t/home';
  }
  /* ────────── hash → 描述符 ────────── */
  function parse(h) {
    var raw = String(h || '').replace(/^#\/?/, '');
    if (!raw) return null;
    var seg = raw.split('/').map(function (s) { try { return decodeURIComponent(s); } catch (e) { return s; } });
    var k = seg[0];
    if (k === 'login') return { k: 'login', label: '登录' };
    if (k === 't') { var id = SLUG_TAB[seg[1]] || 'view-home'; return { k: 't', id: id, label: TAB_LABEL[id] }; }
    if (k === 'p') { return { k: 'p', id: seg[1], label: pageLabel(seg[1]) }; }
    if (k === 'xg') { var pg = seg[1] || 'plaza'; return { k: 'xg', pg: pg, label: XG_LABEL[pg] || 'e次元' }; }
    if (k === 'biz') { return { k: 'biz', key: seg[1], param: seg[2], label: '业务办理' }; }
    if (k === 'ec' && IS_PC) { var p2 = seg[1] || 'home'; if (!PC_LABEL[p2]) buildPCLabel(); return { k: 'ecpg', pg: p2, label: PC_LABEL[p2] || 'e次元 PC 工作台' }; }
    if (k === 'bank' && IS_PC) return { k: 'bank', label: '个人网上银行' };
    return null;
  }

  /* ────────── 写 hash + 改标题（同一 tick 合并） ────────── */
  function sync() {
    if (suppress) return;
    var d = IS_PC ? pcCurrent() : (current() || defaultDesc());
    var h = hashOf(d);
    if (location.hash !== h) {
      try {
        /* 登录屏的进出用 replaceState：不让「自动弹登录屏」这个动作占用一条历史，
           否则用户按返回键会在「已登录的页面」和「登录闸门」之间来回弹。 */
        if (h === '#/login' || location.hash === '#/login') history.replaceState(null, '', h);
        else location.hash = h;
      } catch (e) {}
    }
    setTitleFor(d);
  }
  function scheduleSync() {
    if (suppress || syncT) return;
    syncT = setTimeout(function () { syncT = null; sync(); }, 0);
  }

  /* ────────── 应用路由（前进/后退/深链） ────────── */
  /* 关掉所有浮层，只保留 keep 指定的那一个；业务页要走 BANK.home() 才能清空栈 */
  function closeOtherOverlays(keep) {
    $$('.overlay-page.open').forEach(function (el) {
      if (keep && el.id === keep) return;
      try {
        if (el.id === 'page-biz' && window.BANK && BANK.home) BANK.home();
        else ICBCApp.closePage(el.id);
      } catch (e) {}
    });
    try { if (window.XZG && XZG.sheetClose) XZG.sheetClose(); } catch (e) {}
  }
  function openEC(pg) {
    try { ICBCApp.openPage('page-xingegu'); } catch (e) {}
    if (window.XZG) { try { XZG.mount(pg || 'plaza'); } catch (e) { console.error('[e次元] 深链渲染失败：', e); } }
  }
  function applyMobile(d) {
    if (!d) return;
    if (d.k === 'login') {
      /* 登录屏是模态：清掉底下的浮层，再把它请上来 */
      closeOtherOverlays(null);
      authShow();
    } else if (d.k === 't') {
      closeOtherOverlays(null);
      var btn = $('.tab-item[data-tab="' + d.id + '"]');
      if (btn) btn.click();
    } else if (d.k === 'p') {
      if (d.id === 'xingegu') { closeOtherOverlays('page-xingegu'); openEC('plaza'); }
      else { closeOtherOverlays(null); try { ICBCApp.openPage('page-' + d.id); } catch (e) {} }
    } else if (d.k === 'xg') {
      closeOtherOverlays('page-xingegu');
      openEC(d.pg);
    } else if (d.k === 'biz') {
      closeOtherOverlays(null);
      try { ICBCApp.openPage('page-biz'); if (window.BANK) BANK.open(d.key, d.param); } catch (e) {}
    }
  }
  function showEC(show) {
    var bank = $('#bank'), app = $('#ecapp');
    if (show) {
      if (bank) { bank.style.visibility = 'hidden'; bank.setAttribute('aria-hidden', 'true'); }
      if (app) { app.classList.add('on'); app.removeAttribute('aria-hidden'); }
    } else {
      if (app) { app.classList.remove('on'); app.setAttribute('aria-hidden', 'true'); }
      if (bank) { bank.style.visibility = ''; bank.removeAttribute('aria-hidden'); }
    }
  }
  function applyPC(d) {
    if (!d) return;
    if (d.k === 'login') {
      authShow();
    } else if (d.k === 'ecpg') {
      showEC(true);
      if (window.PCAPP && PCAPP.go) PCAPP.go(d.pg);
      /* 菜单高亮由 go() 负责，标题用菜单真实文案 */
      var on = $('#ecMenu .ec-mi[data-pcpage="' + d.pg + '"] span');
      if (on) d.label = on.textContent.trim();
    } else {
      showEC(false);
    }
  }
  function apply(h) {
    var d = parse(h);
    /* 登录屏是模态闸门：它开着的时候，其余路由不真的改页面状态 ——
       否则会在屏后面偷偷翻页，用户一登录就落到一个没预期的地方。 */
    if (d && d.k !== 'login' && loginOn()) {
      var keep = hashOf(topDesc());
      if (location.hash !== keep) { try { history.replaceState(null, '', keep); } catch (e) {} }
      setTitleFor(topDesc());
      return;
    }
    suppress = true;
    try { (IS_PC ? applyPC : applyMobile)(d); } catch (e) { console.error('[router]', e); }
    suppress = false;
    if (d) { stack.length = 0; stack.push(d); }
    var real = IS_PC ? pcCurrent() : (current() || defaultDesc());
    setTitleFor(real);
    var want = hashOf(real);
    if (location.hash !== want) { try { history.replaceState(null, '', want); } catch (e) {} }
  }

  /* ────────── 包裹原有 API：进入 → 压栈 → 回写 ────────── */
  function hook() {
    var A = window.ICBCApp;
    if (A) {
      if (typeof A.openPage === 'function') {
        var _op = A.openPage;
        A.openPage = function (id) {
          var r = _op.apply(this, arguments);
          if (!suppress && id) {
            var short = String(id).replace(/^page-/, '');
            if (short !== 'biz') { stack.push({ k: 'p', id: short, label: pageLabel(short) }); scheduleSync(); }
          }
          return r;
        };
      }
      if (typeof A.closePage === 'function') {
        var _cl = A.closePage;
        A.closePage = function () { var r = _cl.apply(this, arguments); scheduleSync(); return r; };
      }
    }
    var B = window.BANK;
    if (B) {
      if (typeof B.open === 'function') {
        var _bo = B.open;
        B.open = function (key, param) {
          var r = _bo.apply(this, arguments);
          if (!suppress) {
            var t = $('#bizTitle');
            stack.push({ k: 'biz', key: key, param: param, label: (t && t.textContent.trim()) || '业务办理' });
            scheduleSync();
          }
          return r;
        };
      }
      ['back', 'home'].forEach(function (m) {
        if (typeof B[m] !== 'function') return;
        var o = B[m];
        B[m] = function () { var r = o.apply(this, arguments); scheduleSync(); return r; };
      });
    }
    var X = window.XZG;
    if (X && typeof X.go === 'function') {
      var _go = X.go;
      X.go = function (p) {
        var r = _go.apply(this, arguments);
        if (!suppress && p && document.querySelector('#pg-' + p)) {
          stack.push({ k: 'xg', pg: p, label: XG_LABEL[p] || 'e次元' });
          scheduleSync();
        }
        return r;
      };
    }
  }

  /* ────────── 接入登录系统：显隐 / 登录 / 登出 都要回写 hash 与标题 ────────── */
  function hookAuth() {
    var EA = window.ECAUTH;
    if (!EA) return false;                 /* auth.js 还没就绪 → 交给重试 */
    if (EA.__routed) return true;
    EA.__routed = true;
    ['show', 'hide'].forEach(function (m) {
      if (typeof EA[m] !== 'function') return;
      var o = EA[m];
      EA[m] = function () {
        var r = o.apply(this, arguments);
        scheduleSync();
        setTimeout(scheduleSync, 80);    /* 等 .ea-screen 的 class 落定后再算一次 */
        return r;
      };
    });
    ['ecauth:change', 'ecauth:login', 'ecauth:logout'].forEach(function (ev) {
      document.addEventListener(ev, function () { scheduleSync(); setTimeout(scheduleSync, 80); });
    });
    return true;
  }
  function hookAuthRetry(n) {
    if (hookAuth()) return;
    if (n <= 0) return;
    setTimeout(function () { hookAuthRetry(n - 1); }, 120);
  }

  /* ────────── 登录屏状态守望 ──────────
     auth.js 首屏是「内部 show()」自动弹屏（不经过 window.ECAUTH.show），
     所以只包公开 API 会漏掉这条路径；这里直接盯 #eaScreen / .ea-sheet 的 class，
     外加一个 400ms 的兜底轮询（登录屏是脚本后面才创建的，观测时机不保证）。
     轮询只做 getElementById + classList 判断，开销可忽略。 */
  function watchAuth() {
    var last = null;
    var tick = function () {
      var now = loginOn();
      if (now !== last) { last = now; scheduleSync(); setTimeout(scheduleSync, 80); }
    };
    tick();
    if (window.MutationObserver) {
      try {
        new MutationObserver(function () { tick(); })
          .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      } catch (e) {}
    }
    setInterval(tick, 400);
  }

  /* ────────── 事件 ────────── */
  function bind() {
    /* 主 Tab：app.js 的监听先跑（先切类名），这里后跑（再回写 hash） */
    $$('.tab-item').forEach(function (b) {
      b.addEventListener('click', function () {
        if (suppress || IS_PC) return;
        stack.length = 0;
        stack.push({ k: 't', id: b.dataset.tab, label: TAB_LABEL[b.dataset.tab] || '手机银行' });
        scheduleSync();
      });
      /* 键盘可达性：Tab 键聚焦后回车也能切（原生 button 已支持，这里只补 hash） */
      b.addEventListener('keyup', function (e) { if (e.key === 'Enter') scheduleSync(); });
    });

    /* 浏览器前进/后退 */
    window.addEventListener('hashchange', function () {
      var d = IS_PC ? pcCurrent() : current();
      if (location.hash === hashOf(d)) return;   /* 自己刚写的，忽略 */
      apply(location.hash);
    });

    /* PC：e次元 内部的跳转（菜单 / 卡片 / 进入 / 离开）都由 DOM 变化兜底同步 */
    if (IS_PC) {
      document.addEventListener('click', function (e) {
        if (!e.target.closest('#ecapp, [data-ecd], #ecExit')) return;
        setTimeout(sync, 40);    /* 常规跳转 */
        setTimeout(sync, 900);   /* 推门转场 640ms 后再兜一次 */
      }, false);
    }
  }

  /* ────────── 启动 ────────── */
  function boot() {
    buildPCLabel();
    if (IS_PC) buildPCLabel();
    var parsed = parse(location.hash);
    if (parsed) { apply(location.hash); return; }
    /* 没有 hash：把当前真实状态写进地址栏（replace，不污染历史） */
    var d = IS_PC ? pcCurrent() : defaultDesc();
    if (!IS_PC) { stack.length = 0; stack.push(d); }
    setTitleFor(d);
    try { history.replaceState(null, '', hashOf(d)); } catch (e) {}
  }

  function start() {
    hook();
    hookAuthRetry(25);        /* auth.js 与本文件的加载顺序不保证，最多重试 25 次 */
    bind();
    try { boot(); } catch (e) { console.error('[router] boot 失败：', e); }
    watchAuth();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(start, 60);
  else window.addEventListener('DOMContentLoaded', function () { setTimeout(start, 60); });

  /* 调试出口 */
  window.ROUTER = { go: apply, sync: sync, hash: hashOf, stack: function () { return stack.slice(); }, login: loginOn };
})();
