/* ════════════════════════════════════════════════════════════════════
   e次元 · 入口系统  (js/ec-entry.js)
   ─────────────────────────────────────────────────────────────────────
   一、转场封面（「桃花源」时刻）
       银行外壳只当入口。点击任意 e次元 入口 → 全屏封面 + 花瓣飘落 +
       逐字浮现 → 淡出，落点各不相同。像从死板的银行大厅推开一扇门，
       进去是完全属于 e次元 的世界。

   二、多入口 → 多落点
       银行端的入口分布在首页卡片 / 轮播 / 我的成长卡 / 信用卡联名卡 /
       生活页商城 / 工小智 / 扫一扫 / 消息推送 / 热兑好物 / 品牌特惠，
       每个入口（起点）到达 e次元 里不同的位置（终点）。

   三、e次元 自己的底部导航
       进入后不再用银行的五栏 Tab，而是 e次元 自己的五栏（广场 / 甄选 /
       创作 / 谷圈 / 我的），进一步强化「已经换了一个世界」。
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 落点文案：同一次进入，字不一样，落点也不一样 ── */
  const DEST = {
    plaza:    { kicker: 'WELCOME HOME', title: '谷圈广场', sub: '同好都在这里，回来啦' },
    mall:     { kicker: 'e次元 甄选',  title: '自有好物', sub: '工行自有 IP · 上新不断' },
    forum:    { kicker: '谷圈论坛',     title: '同好在此', sub: '情报 · 晒谷 · 出回血' },
    create:   { kicker: '创作中心',     title: '让热爱变现', sub: '发帖也有收益' },
    exchange: { kicker: '权益星球',     title: '谷粒变好礼', sub: '攒下的都算数' },
    mine:     { kicker: '我的谷档案',   title: '成长可见', sub: '等级 · 勋章 · 收藏' },
    zaangu:   { kicker: '攒谷成长',     title: '每天一点点', sub: '吃谷即成长' },
    shigu:    { kicker: 'AI 估值',      title: '识谷',     sub: '拍一拍，行情真假都清楚' },
    chugu:    { kicker: '资金托管',     title: '出谷通',   sub: '验货才放款，放心交易' },
    guka:     { kicker: '本命卡面',     title: '谷卡',     sub: '你的卡，你投票' },
    guxiang:  { kicker: 'e谷推',        title: '谷享',     sub: '说一句话，全网帮你盯' },
    zhidai:   { kicker: '藏品授信',     title: '质押贷',   sub: '把收藏变成额度' },
    cang:     { kicker: '私人展厅',     title: '藏馆',     sub: '每件谷子都有一份档案' },
    brand:    { kicker: '品牌专区',     title: '官方直供', sub: '各大 IP 官方旗舰' }
  };
  const dest = k => DEST[k] || DEST.plaza;

  /* ── 花瓣 ── */
  function petals(n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const w = (9 + Math.random() * 11).toFixed(1);
      s += `<span class="ec-enter-petal" style="left:${(Math.random() * 98).toFixed(1)}%;width:${w}px;height:${w}px;` +
           `--dx:${(Math.random() * 160 - 80).toFixed(0)}px;animation-duration:${(5.5 + Math.random() * 4).toFixed(1)}s;` +
           `animation-delay:-${(Math.random() * 6).toFixed(1)}s"></span>`;
    }
    return s;
  }

  /* ══════════ 一、转场封面 ══════════ */
  let overlay = null, busy = false;

  function buildOverlay() {
    const phone = document.getElementById('phone');
    if (!phone || document.getElementById('ecEnter')) return;
    overlay = document.createElement('div');
    overlay.className = 'ec-enter';
    overlay.id = 'ecEnter';
    overlay.innerHTML = `
      <div class="ec-enter-cover" id="ecEnterCover"></div>
      <div class="ec-enter-veil"></div>
      <div class="ec-enter-veil2"></div>
      <div class="ec-enter-petals" id="ecEnterPetals"></div>
      <div class="ec-enter-word">
        <div class="ec-enter-kicker" id="ecEK"></div>
        <div class="ec-enter-title" id="ecET"></div>
        <div class="ec-enter-sub" id="ecES"></div>
        <div class="ec-enter-line"></div>
        <div class="ec-enter-bar"><i></i></div>
      </div>`;
    overlay.addEventListener('click', () => finish(true));
    phone.appendChild(overlay);
  }

  let timerA = null, timerB = null;

  /**
   * 播放转场并进入 e次元 的某个落点
   * @param {string} to   落点（plaza/mall/forum/…）
   * @param {function} arrive  到达回调：真正打开 e次元 页面
   */
  function play(to, arrive) {
    if (busy) { if (arrive) arrive(); return; }
    buildOverlay();
    if (!overlay) { if (arrive) arrive(); return; }
    busy = true;

    const d = dest(to);
    document.getElementById('ecEnterCover').style.backgroundImage = 'url(img/art/cover-enter.jpg)';
    document.getElementById('ecEK').textContent = d.kicker;
    document.getElementById('ecET').innerHTML = d.title;
    document.getElementById('ecES').textContent = d.sub;
    document.getElementById('ecEnterPetals').innerHTML = petals(16);

    overlay.classList.remove('out');
    void overlay.offsetWidth;              /* 强制重排，重启入场动画 */
    overlay.classList.add('on');

    /* 600ms 后地图已经"展开"，此时在封面背后把落点页面准备好 */
    timerA = setTimeout(() => { try { arrive && arrive(); } catch (e) { console.error(e); } }, 620);
    /* 1900ms 开始收起封面 */
    timerB = setTimeout(() => finish(), 1900);
  }

  function finish(instant) {
    if (!overlay) return;
    clearTimeout(timerA); clearTimeout(timerB);
    if (instant) {
      overlay.classList.remove('on', 'out');
      overlay.style.display = 'none';
      busy = false;
      return;
    }
    overlay.classList.add('out');
    setTimeout(() => {
      overlay.classList.remove('on', 'out');
      overlay.style.display = 'none';
      busy = false;
    }, 540);
  }

  window.EC_ENTRY = { play, finish, dest };

  /* ══════════ 二、拦截所有 e次元 入口，统一走转场 ══════════ */
  /* 2.1 入口按钮（data-xingegu）——必须用捕获阶段 + 阻断冒泡，
         否则外壳 app.js 自己的委托会先把页面打开，转场就被跳过了。 */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-xingegu]');
    if (!el) return;
    e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    const fid = el.dataset.xingegu;
    enter((window.XZG && XZG.E2F[fid]) || fid || 'plaza', fid || 'plaza');
  }, true);

  /* 2.2 API 入口（ICBCApp.openXingegu）——供脚本内调用 */
  function hookOpen() {
    if (!window.ICBCApp || ICBCApp.__ecHooked) return;
    const orig = ICBCApp.openXingegu;
    ICBCApp.openXingegu = function (fid) {
      enter((window.XZG && XZG.E2F[fid]) || fid || 'plaza', fid || 'plaza');
    };
    ICBCApp.__ecHooked = true;
    void orig;
  }

  /** 统一进入：已在 e次元 内部时直接跳页，否则播一次转场 */
  function enter(to, fid) {
    const arrive = () => {
      if (window.ICBCApp) ICBCApp.openPage('page-xingegu');
      if (window.XZG) XZG.mount((window.XZG.E2F[to] ? to : fid) || 'plaza');
      syncTabs(to);
    };
    const already = document.querySelector('#page-xingegu.open');
    if (already) { arrive(); return; }
    play(to, arrive);
  }
  window.EC_ENTRY.enter = enter;

  /* ══════════ 三、e次元 自己的底部导航 ══════════ */
  const NAV = [
    { id: 'plaza',    label: '广场',  svg: '<path d="M3 10.6 12 3.5l9 7.1M5.3 9.6V20h13.4V9.6"/>' },
    { id: 'mall',     label: '甄选',  svg: '<path d="M4.5 8h15l-1.2 12.2H5.7L4.5 8z"/><path d="M8.8 10.4V6.6a3.2 3.2 0 0 1 6.4 0v3.8"/>' },
    { id: 'create',   label: '创作',  svg: '<path d="M12 5v14M5 12h14"/>', center: true },
    { id: 'forum',    label: '谷圈',  svg: '<path d="M4 5.5h16v11H9l-5 4v-15z"/><path d="M8 9.5h8M8 12.5h5"/>' },
    { id: 'mine',     label: '我的',  svg: '<circle cx="12" cy="8.4" r="3.7"/><path d="M4.8 20.4c1.2-3.5 3.9-5.2 7.2-5.2s6 1.7 7.2 5.2"/>' }
  ];
  /* 页面 → 底部导航高亮项（子页面归属到最近的主栏） */
  const NAVOF = {
    plaza: 'plaza', forum: 'forum', mall: 'mall', brand: 'mall',
    mine: 'mine', create: 'create', exchange: 'create',
    shigu: 'mall', guxiang: 'mall', chugu: 'mall', guka: 'mall',
    zhidai: 'mine', cang: 'mine', zaangu: 'mine'
  };

  function buildTabbar() {
    const page = document.getElementById('page-xingegu');
    if (!page || document.getElementById('ecTabbar')) return;
    const bar = document.createElement('nav');
    bar.className = 'ec-tabbar';
    bar.id = 'ecTabbar';
    bar.innerHTML = NAV.map(n => `
      <button class="ec-tab${n.center ? ' ec-tab--c' : ''}" data-ec-tab="${n.id}">
        <i class="ec-tab-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${n.svg}</svg></i>
        <span>${n.label}</span>
      </button>`).join('');
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-ec-tab]');
      if (b) goto(b.dataset.ecTab);
    });
    page.appendChild(bar);
  }

  /** 在 e次元 内部跳页：只切页，不再走转场 */
  function goto(p) {
    if (!window.XZG) return;
    XZG.go(p);
    syncTabs(p);
  }
  /** 只同步高亮（切页后调用，或进入时调用） */
  function syncTabs(p) {
    const n = NAVOF[p] || 'plaza';
    document.querySelectorAll('#ecTabbar .ec-tab').forEach(b =>
      b.classList.toggle('on', b.dataset.ecTab === n));
    const fid = window.XZG && XZG.F2E[p];
    document.querySelectorAll('#xingeguChips .xg-chip').forEach(c =>
      c.classList.toggle('active', c.dataset.feature === fid));
  }
  window.EC_ENTRY.goto = goto;
  window.EC_ENTRY.syncTabs = syncTabs;

  /* ══════════ 四、银行端「多个入口」的统一委托 ══════════ */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-ec]');
    if (!el) return;
    e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    const to = el.dataset.ec;
    const feat = el.dataset.ecFeat || (window.XZG && XZG.F2E[to]) || 'plaza';
    enter(to, feat);
  }, true);

  /* ══════════ 启动 ══════════ */
  function boot() {
    hookOpen();
    buildTabbar();
    /* 任何来源的 XZG.go 都同步一次底部导航高亮 */
    if (window.XZG && !XZG.__ecGoWrapped) {
      const _go = XZG.go;
      XZG.go = function (p) {
        const r = _go.apply(this, arguments);
        try { syncTabs(p); } catch (e) {}
        return r;
      };
      XZG.__ecGoWrapped = true;
    }
    /* e次元 内部 chips 被点后，同步一下底部导航的高亮 */
    const chips = document.getElementById('xingeguChips');
    if (chips) chips.addEventListener('click', () => setTimeout(() => {
      const p = window.XZG && XZG._lastPg;
      if (p) syncTabs(p);
    }, 30));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
