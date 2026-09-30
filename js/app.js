/* ═══════════════════════════════════════════════════════════════════
   模拟工商银行手机银行 · 交互逻辑
   ─────────────────────────────────────────────────────────────────
   「e次元」程序植入接口（全局对象 window.ICBCApp）：
     ICBCApp.toast(msg)                  弹提示
     ICBCApp.openPage(id)                打开子页面浮层（'page-xingegu' 等）
     ICBCApp.closePage(id)               关闭子页面
     ICBCApp.openXingegu(featureId)      打开e次元并选中功能
                                         featureId: 'shigu'|'zangu'|'chugu'|'guka'
     ICBCApp.setBalance(number)          更新余额并刷新显示
     ICBCApp.addRecord({icon,bg,title,time,amt})
                                         向收支明细插入一笔交易
     ICBCApp.data                        模拟数据 DATA（可直接改）

   e次元功能切换事件：每次切换功能会在 document 上派发
     'xingegu:open' 事件，detail = { feature, slot }
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const fmt = n => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const now = () => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  /* ═════════ SVG 图标库（线性风格，模拟真机图标） ═════════ */
  const P = {
    transfer: '<path d="M4 8h13l-3.2-3.2M20 16H7l3.2 3.2"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5M5 10.5v7.5M9.5 10.5V18M14.5 10.5V18M19 10.5V18M3.5 20.5h17"/>',
    list: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>',
    bolt: '<path d="M13 3 5.5 13.5H11L10 21l7.5-10.5H12L13 3z"/>',
    credit: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M6.5 15h4"/>',
    house: '<path d="M4 11.5 12 4.5l8 7M6.5 10v9.5h11V10M10.5 19.5v-5h3v5"/>',
    chart: '<path d="M4 20h16M6.5 16V9M11 16V5.5M15.5 16v-8M20 16V8"/>',
    fx: '<circle cx="9" cy="9" r="5.5"/><circle cx="15" cy="15" r="5.5"/><path d="M6.8 6.8 9 9.5l2.2-2.7M9 9.5v4.2M7.6 10.8h2.8"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16"/>',
    receive: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><path d="M16.75 13v6M14.25 16.5l2.5 2.5 2.5-2.5"/>',
    pay: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M12 14h6.5"/>',
    train: '<rect x="5.5" y="3.5" width="13" height="14" rx="3"/><path d="M5.5 10.5h13M9 21l1.4-3.5M15 21l-1.4-3.5M8 17.5h8"/><circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/>',
    robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="12.8" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12.8" r="1.1" fill="currentColor" stroke="none"/><path d="M9.5 16.2h5"/>',
    charge: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M12.8 7.5 10.5 12h3L11.2 16.5"/>',
    receipt: '<path d="M6 3.5h12V20l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 20V3.5z"/><path d="M9 8.5h6M9 12h6"/>',
    noodle: '<path d="M4 11.5h16c0 4.2-2.8 7-8 7s-8-2.8-8-7z"/><path d="M8.5 11V6.5M12 11V5.5M15.5 11V6.5"/>',
    film: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M8 5v14M16 5v14M3.5 9.5H8M3.5 14.5H8M16 9.5h4.5M16 14.5h4.5"/>',
    car: '<path d="M5 14 6.5 9a2 2 0 0 1 1.9-1.4h7.2A2 2 0 0 1 17.5 9L19 14M5 14h14M5 14v4h3v-2h8v2h3v-4"/><circle cx="8.5" cy="15.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="15.5" r=".5" fill="currentColor"/>',
    bed: '<path d="M4 18.5V7M4 14h16v4.5M4 16h16M7 11h5.5l2.5 3"/>',
    health: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    bear: '<circle cx="7.8" cy="7.2" r="2.1"/><circle cx="16.2" cy="7.2" r="2.1"/><circle cx="12" cy="13.2" r="6"/><circle cx="9.8" cy="12.2" r=".9" fill="currentColor" stroke="none"/><circle cx="14.2" cy="12.2" r=".9" fill="currentColor" stroke="none"/><path d="M10.4 15.2c1 .7 2.2.7 3.2 0"/>',
    water: '<path d="M12 3.5c3.5 4.2 6 7.3 6 10.3a6 6 0 0 1-12 0c0-3 2.5-6.1 6-10.3z"/>',
    gas: '<rect x="8" y="7" width="8" height="13" rx="2"/><path d="M10 7V4.5h4V7M9.5 4.5h5"/>',
    tv: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M8.5 3.5 12 6l3.5-2.5M9.5 21h5"/>',
    wifi: '<path d="M4 9.5a12 12 0 0 1 16 0M7 13a8 8 0 0 1 10 0M10 16.2a4 4 0 0 1 4 0"/><circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none"/>',
    tel: '<path d="M5.5 4h3L10 8l-2 1.5a12 12 0 0 0 6.5 6.5L16 14l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3.5 6a2 2 0 0 1 2-2z"/>',
    building: '<rect x="5.5" y="4" width="13" height="16.5" rx="1.5"/><path d="M9 8h2M13 8h2M9 11.5h2M13 11.5h2M9 15h2M13 15h2M10.5 20.5v-3h3v3"/>',
    flame: '<path d="M12 3.5c.6 3-1.3 4.6-2.6 6.3C8.1 11.5 7.5 13 7.5 14.7a5.5 5.5 0 0 0 11 .3c0-1.6-.6-3-1.6-4.3-.3 1-.9 1.7-1.9 2.2.5-3.6-1.3-7-3-9.4z"/>',
    payroll: '<path d="M6 3.5h9l3 3v14H6V3.5z"/><path d="M9.5 8l2.5 3 2.5-3M12 11v4.5M10.6 12.6h2.8"/>',
    edu: '<path d="M2.8 9 12 4.5 21.2 9 12 13.5 2.8 9z"/><path d="M6.5 11v4.5c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6V11M20.2 10v5"/>',
    magic: '<path d="M5 19 15.5 8.5M13.5 6.5 14.5 4l1 2.5L18 7.5l-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1zM19.5 12.5l.6-1.5.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.6-3 7.6-7 9-4-1.4-7-4.4-7-9V6l7-2.5z"/><path d="M9.3 11.8l1.9 1.9 3.5-3.5"/>',
    headset: '<path d="M12 3a8 8 0 0 0-8 8v4a3 3 0 0 0 3 3h1v-7H6.5A5.5 5.5 0 0 1 17.5 11H16v7h1a3 3 0 0 0 3-3v-4a8 8 0 0 0-8-8z" fill="none"/><rect x="16" y="11" width="2.6" height="7" rx="1.3" fill="currentColor" stroke="none"/><rect x="5.4" y="11" width="2.6" height="7" rx="1.3" fill="currentColor" stroke="none"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"/>',
    salary: '<circle cx="12" cy="12" r="8"/><path d="M9 8.5 12 12l3-3.5M12 12v5M10.2 13.6h3.6"/>',
    gift: '<rect x="4" y="10.5" width="16" height="9.5" rx="1.5"/><path d="M12 10.5V20M4 14.5h16M12 10.5C10 10.5 7.5 9.8 7.5 8a2 2 0 0 1 4-.5c.3 1 .5 3 .5 3zM12 10.5c2 0 4.5-.7 4.5-2.5a2 2 0 0 0-4-.5c-.3 1-.5 3-.5 3z"/>',
    gold: '<circle cx="12" cy="13" r="6.5"/><path d="M9.5 13h5M12 10.5v5M10.6 11.6h2.8"/>',
    guka: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M12 12.4l.9 1.7 1.9.3-1.4 1.35.35 1.9-1.75-.9-1.75.9.35-1.9-1.4-1.35 1.9-.3.9-1.7z"/>',
    user: '<circle cx="12" cy="8.2" r="3.8"/><path d="M4.5 20.5c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/>',
    finger: '<path d="M9 11V5.6a1.8 1.8 0 0 1 3.6 0V11M12.6 11V4.6a1.8 1.8 0 0 1 3.6 0V11"/><path d="M16.2 11V7.6a1.8 1.8 0 0 1 3.6 0V15a6 6 0 0 1-6 6h-1.6a6 6 0 0 1-5.3-3.2L4.6 13a1.9 1.9 0 0 1 3.2-2L9 12.6"/><path d="M9 11v3.6"/>',
    cube: '<path d="M12 3.2 20 7.6v8.8L12 20.8 4 16.4V7.6l8-4.4z"/><path d="M4 7.6 12 12l8-4.4M12 12v8.8"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2.6"/><circle cx="12" cy="13.4" r="3.6"/><path d="M8.6 7 10 4.2h4L15.4 7"/>',
    watch: '<circle cx="12" cy="12" r="7.4"/><path d="M12 8.4V12l2.6 2M9 3.4h6M9 20.6h6"/>',
    vault: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1.6M12 14.4V16M8 12h1.6M14.4 12H16"/>',
    ar: '<path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5"/><path d="M12 8.6 16 11v4.4L12 17.8 8 15.4V11z"/><path d="M8 11l4 2.2 4-2.2M12 13.2v4.6"/>',
    sparkle: '<path d="M12 3.4l1.9 5.1 5.1 1.9-5.1 1.9L12 17.4l-1.9-5.1L5 10.4l5.1-1.9z"/><path d="M18.4 15.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    medal: '<circle cx="12" cy="9.5" r="5"/><path d="M9 13.8 7.5 21l4.5-2.3L16.5 21 15 13.8"/>',
    shigu: '<circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8 21 21M11 8.1l.85 1.7 1.9.28-1.37 1.33.32 1.87L11 12.4l-1.7.88.32-1.87-1.37-1.33 1.9-.28.85-1.7z"/>',
    coffee: '<path d="M5 8.5h11v6a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 14.5v-6z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4.5c0 1-1 1.5 0 3M11.5 4.5c0 1-1 1.5 0 3"/>',
    plane: '<path d="M10.5 5 12 3.5 13.5 5v5l7 4v2l-7-2v4l2.5 2v1.5L12 19.5 8 21v-1.5l2.5-2v-4l-7 2v-2l7-4V5z"/>',
    more: '<circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/>'
  };
  const ico = (k, w) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"${w ? ` style="width:${w}px;height:${w}px"` : ''}>${P[k] || P.more}</svg>`;

  /* ─────────── Toast ─────────── */
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ─────────── 启动闪屏（模拟真机打开APP） ─────────── */
  window.addEventListener('load', () => {
    setTimeout(() => {
      const sp = $('#splash');
      if (!sp) return;
      sp.classList.add('hide');
      setTimeout(() => sp.remove(), 550);
    }, 1250);
  });

  /* ─────────── 子页面浮层 ─────────── */
  function syncStatusbar() {
    const open = $$('.overlay-page.open').pop();
    const src = open || $('.tab-view.active');
    $('#statusbar').classList.toggle('dark', (src && src.dataset.status) === 'dark');
  }
  function openPage(id) {
    const p = document.getElementById(id);
    if (!p) return;
    p.classList.add('open');
    syncStatusbar();
  }
  function closePage(id) {
    const p = document.getElementById(id);
    if (!p) return;
    p.classList.remove('open');
    syncStatusbar();
  }

  /* ─────────── Tab 切换 ─────────── */
  $$('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      $$('.tab-item').forEach(b => b.classList.toggle('active', b === btn));
      $$('.tab-view').forEach(v => v.classList.toggle('active', v.id === id));
      syncStatusbar();
    });
  });

  /* ─────────── 余额显示/隐藏 ─────────── */
  let balanceHidden = false;
  function renderBalance() {
    if (balanceHidden) {
      $('#balanceText').textContent = '******';
      $('#acAvail').textContent = '******';
    } else {
      $('#balanceText').textContent = fmt(DATA.account.balance);
      $('#acAvail').textContent = fmt(DATA.account.available);
    }
  }
  $('#eyeBtn').addEventListener('click', () => {
    balanceHidden = !balanceHidden;
    $('#eyeOpen').style.display = balanceHidden ? 'none' : '';
    $('#eyeClosed').style.display = balanceHidden ? '' : 'none';
    renderBalance();
  });

  /* ─────────── 通用 act 调度 ─────────── */
  function runAct(act) {
    if (!act) return;
    const [type, val] = act.split(':');
    if (type === 'open') openPage(val);
    else if (type === 'toast') toast(val);
    else if (type === 'tab') {
      const btn = $(`.tab-item[data-tab="${val}"]`);
      if (btn) btn.click();
    }
    else if (type === 'xg') openXingegu(val);
    /* 业务办理页（bank-biz.js 提供）：act: 'biz:loan' / 带参数 'biz:paybill|水费' */
    else if (type === 'biz' && window.BANK) {
      const i = val.indexOf('|');
      const k = i < 0 ? val : val.slice(0, i);
      const p = i < 0 ? undefined : val.slice(i + 1);
      openPage('page-biz'); window.BANK.open(k, p);
    }
  }

  /* 事件委托：data-xingegu > data-close > data-open > data-toast > data-tab-jump */
  document.addEventListener('click', e => {
    const xg = e.target.closest('[data-xingegu]');
    if (xg) { openXingegu(xg.dataset.xingegu); return; }
    const closer = e.target.closest('[data-close]');
    if (closer) { closePage(closer.dataset.close); return; }
    const opener = e.target.closest('[data-open]');
    if (opener) { openPage(opener.dataset.open); return; }
    const toaster = e.target.closest('[data-toast]');
    if (toaster) { toast(toaster.dataset.toast); return; }
    const jump = e.target.closest('[data-tab-jump]');
    if (jump) {
      const btn = $(`.tab-item[data-tab="${jump.dataset.tabJump}"]`);
      if (btn) btn.click();
    }
  });

  /* ─────────── 渲染工具 ─────────── */
  const bindActs = sel => $$(sel).forEach(b => b.addEventListener('click', () => runAct(b.dataset.act)));
  const gridHTML = list => list.map(f => `
    <button class="g8-item" data-act="${f.act}">
      <span class="g8-ico" style="background:${f.bg}">${ico(f.icon)}</span><span class="g8-txt">${f.name}</span>
    </button>`).join('');

  /* ─────────── 首页渲染 ─────────── */
  $('#quickGrid').innerHTML = DATA.quickActions.map(q => `
    <button class="qk-item" data-act="${q.act}">
      <span class="qk-ico">${ico(q.icon)}</span><span>${q.name}</span>
    </button>`).join('');
  bindActs('#quickGrid .qk-item');

  $('#acNo').textContent = DATA.account.no;

  $('#funcGrid').innerHTML = gridHTML(DATA.functions);
  bindActs('#funcGrid .g8-item');

  /* ★ e次元首页入口（两行四列 · 按 金融服务 / 成长与社区 分组） */
  const xgHome = DATA.xingegu.features.filter(f => f.home);
  const xgRow = (gid, label, hint) => {
    const items = xgHome.filter(f => f.group === gid);
    if (!items.length) return '';
    return `<div class="xg-rowhead"><b>${label}</b><span>${hint}</span></div><div class="xg-entries">${items.map(f => `
      <button class="xg-entry" data-xingegu="${f.id}" title="${f.tip}">
        <span class="xg-e-ico">${ico(f.icon)}</span>
        <span class="xg-e-txt"><b>${f.name}</b><span>${f.desc}</span></span>
      </button>`).join('')}</div>`;
  };
  $('#xgEntries').innerHTML = xgRow(1, '金融服务', '识谷 · 谷享 · 出谷通 · 谷卡') + xgRow(2, '成长与社区', '质押 · 藏馆 · 攒谷 · 商城');

  /* 轮播 */
  $('#bannerTrack').innerHTML = DATA.banners.map(b => `
    <div class="banner-slide${b.img ? ' banner-slide--img' : ''}" style="background:${b.bg}"
      ${b.ec ? `data-ec="${b.ec}"` : ''}>${b.img ? (b.gart && window.CHARS ? CHARS.artImg(b.img, 'bs-img', b.t) : `<img class="bs-img" src="${b.img}" alt="">`) : ''}
      <div class="bs-txt"><h4>${b.t}</h4><p>${b.d}</p>${b.go ? `<span class="bs-go">${b.go}</span>` : ''}</div>
    </div>`).join('');
  $('#bannerDots').innerHTML = DATA.banners.map((_, i) =>
    `<i class="b-dot${i === 0 ? ' on' : ''}"></i>`).join('');
  let bannerIdx = 0;
  setInterval(() => {
    bannerIdx = (bannerIdx + 1) % DATA.banners.length;
    $('#bannerTrack').style.transform = `translateX(-${bannerIdx * 100}%)`;
    $$('.b-dot').forEach((d, i) => d.classList.toggle('on', i === bannerIdx));
  }, 3600);

  $('#homeProducts').innerHTML = DATA.homeProducts.map(p => `
    <div class="hp-card" data-tab-jump="view-wealth">
      <div class="hp-name">${p.name}</div>
      <span class="hp-code">${p.code}</span>
      <div class="hp-rate">${p.rate}<i>% 业绩基准</i></div>
      <span class="hp-tag">${p.tag}</span>
    </div>`).join('');

  $('#lifeGridHome').innerHTML = gridHTML(DATA.lifeServices.slice(0, 8));
  bindActs('#lifeGridHome .g8-item');

  /* ─────────── 生活页渲染 ─────────── */
  $('#lifeQuick').innerHTML = DATA.lifeQuick.map(q => `
    <button class="qk-item" data-act="${q.act}">
      <span class="qk-ico">${ico(q.icon)}</span><span>${q.name}</span>
    </button>`).join('');
  bindActs('#lifeQuick .qk-item');

  $('#lifeGrid').innerHTML = gridHTML(DATA.lifeServices);
  bindActs('#lifeGrid .g8-item');

  $('#couponList').innerHTML = DATA.coupons.map(c => `
    <div class="coupon">
      <div class="cp-left"><b>${c.amt}</b><em>${c.unit}</em></div>
      <div class="cp-main"><b>${c.name}</b><p>${c.desc}</p></div>
      <button class="cp-btn" data-toast="领取成功（演示）">${c.btn}</button>
    </div>`).join('');

  $('#payGrid').innerHTML = gridHTML(DATA.payServices);
  bindActs('#payGrid .g8-item');

  /* ─────────── 投资页渲染 ─────────── */
  $('#tickerRow').innerHTML = DATA.ticker.map(t => `
    <div class="tk-item"><em>${t.name}</em><b>${t.v}</b><i class="${t.dir}">${t.chg}</i></div>`).join('');

  function renderProducts(cat) {
    $('#prodList').innerHTML = DATA.products[cat].map(p => `
      <div class="prod-item">
        <div class="pi-left">
          <div class="pi-name">${p.name}</div>
          <div class="pi-tags">${p.tags.map((t, i) =>
            `<span class="pi-tag${i === 0 ? ' pi-tag--r' : ''}">${t}</span>`).join('')}</div>
          <button class="pi-btn" data-toast="演示环境：请前往柜台体验">${p.btn}</button>
        </div>
        <div class="pi-right">
          <div class="pi-rate">${p.rate}<i>${p.unit}</i></div>
          <em>${p.note}</em>
        </div>
      </div>`).join('');
  }
  renderProducts('bank');
  $('#prodTabs').addEventListener('click', e => {
    const b = e.target.closest('.pt-item');
    if (!b) return;
    $$('.pt-item').forEach(x => x.classList.toggle('active', x === b));
    renderProducts(b.dataset.cat);
  });

  /* ─────────── 信用卡频道渲染 ─────────── */
  const CR = DATA.credit;
  const ccLimitPct = Math.round(CR.used / CR.limit * 100);
  const ccHero = $('#ccHero');
  if (ccHero) {
    $('#ccLimitBar').style.width = ccLimitPct + '%';
    $('#ccLimitUsed').textContent = fmt(CR.used);
    $('#ccLimitPct').textContent = ccLimitPct + '%';
    $('#ccNo').textContent = CR.no;
    $('#ccName').textContent = CR.name;
    $('#ccHolder').textContent = CR.holder;
    $('#ccBillAmt').textContent = fmt(CR.billAmt);
    $('#ccBillMonth').textContent = CR.billMonth;
    $('#ccDue').textContent = CR.due;
    $('#ccMin').textContent = fmt(CR.min);
    $('#creditBenefits').innerHTML = gridHTML(CR.benefits);
    bindActs('#creditBenefits .g8-item');
    $('#creditMenu').innerHTML = CR.menus.map(m => `
      <button class="menu-item" data-act="${m.act}">
        <span class="mi-ico" style="background:${m.bg}">${ico(m.icon)}</span>${m.name}<span class="mi-arrow">›</span>
      </button>`).join('');
    bindActs('#creditMenu .menu-item');
    /* 一键还款：联动余额与明细，更像真机（document 委托，防节点替换失效） */
    document.addEventListener('click', e => {
      if (!e.target.closest('#ccRepayBtn')) return;
      DATA.account.balance -= CR.billAmt;
      DATA.account.available -= CR.billAmt;
      renderBalance();
      addRecord({ icon: 'credit', bg: '#f0ecfd', title: '信用卡还款 · 工银World奋斗卡', amt: -CR.billAmt });
      toast(`还款成功（演示）：￥${fmt(CR.billAmt)} 已还清本期账单`);
    });
  }

  /* ─────────── 消息中心（首页铃铛进入的浮层） ─────────── */
  const msgHTML = list => list.map(m => `
    <div class="msg-item${m.ec ? ' msg-item--ec' : ''}"${m.ec ? ` data-ec="${m.ec}"` : ''}>
      <div class="msg-ico" style="background:${m.bg}">${ico(m.icon)}</div>
      <div class="msg-main">
        <div class="msg-row1"><b>${m.title}</b><span class="msg-time">${m.time}</span></div>
        <div class="msg-sub">${m.sub}</div>
      </div>
      ${m.ec ? '<span class="msg-go">去 e次元 ›</span>' : (m.dot ? '<i class="msg-dot"></i>' : '')}
    </div>`).join('');
  $('#msgListFull').innerHTML = msgHTML(DATA.messages);
  $('#msgBadge').textContent = DATA.messages.filter(m => m.dot).length;

  /* ─────────── 收支明细 ─────────── */
  function renderRecords() {
    $('#recordList').innerHTML = DATA.records.map(r => `
      <div class="record-item">
        <div class="ri-ico" style="background:${r.bg}">${ico(r.icon)}</div>
        <div class="ri-main"><b>${r.title}</b><span>${r.time}</span></div>
        <div class="ri-amt${r.amt > 0 ? ' plus' : ''}">${r.amt > 0 ? '+' : ''}${r.amt === 0 ? '—' : fmt(r.amt)}</div>
      </div>`).join('');
    const sumIn = DATA.records.reduce((s, r) => s + Math.max(r.amt, 0), 0);
    const sumOut = DATA.records.reduce((s, r) => s + Math.min(r.amt, 0), 0);
    $('#sumIn').textContent = fmt(sumIn);
    $('#sumOut').textContent = fmt(Math.abs(sumOut));
  }
  renderRecords();

  function addRecord(rec) {
    DATA.records.unshift(Object.assign({ time: now() }, rec));
    renderRecords();
  }

  /* ─────────── 转账演示 ─────────── */
  $('#transferBtn').addEventListener('click', () => {
    const amt = parseFloat($('#transferAmount').value);
    if (!amt || amt <= 0) { toast('请输入正确的转账金额'); return; }
    if (amt > DATA.account.available) { toast('可用余额不足（演示）'); return; }
    DATA.account.balance -= amt;
    DATA.account.available -= amt;
    renderBalance();
    addRecord({ icon: 'transfer', bg: '#fdecec', title: '转账支出 · 王**', amt: -amt });
    toast(`转账成功（演示）：￥${fmt(amt)} 已实时转出`);
    setTimeout(() => closePage('page-transfer'), 1000);
  });

  /* ─────────── 我的-菜单 & 魔法空间 ─────────── */
  const menuHTML = list => list.map(m => `
    <button class="menu-item" data-act="${m.act}">
      <span class="mi-ico" style="background:${m.bg}">${ico(m.icon)}</span>${m.name}<span class="mi-arrow">›</span>
    </button>`).join('');
  $('#mineMenu1').innerHTML = menuHTML(DATA.mineMenu1);
  $('#mineMenu2').innerHTML = menuHTML(DATA.mineMenu2);
  bindActs('#mineMenu1 .menu-item');
  bindActs('#mineMenu2 .menu-item');

  $('#magicTasks').innerHTML = DATA.magicTasks.map(t => `
    <div class="mg-task">
      <span class="mt-ico">${t.icon}</span>
      <div class="mt-main"><b>${t.title}</b><span>${t.sub}</span></div>
      <button class="mt-btn${t.done ? ' done' : ''}" data-toast="${t.done ? '已完成' : '任务完成 +i豆（演示）'}">${t.done ? '已完成' : t.btn}</button>
    </div>`).join('');

  $('#medalGrid').innerHTML = DATA.medals.map(m => `
    <div class="medal${m.locked ? ' locked' : ''}">
      <span class="md-ico">${m.icon}</span><span>${m.name}${m.xg ? ' ★' : ''}</span>
    </div>`).join('');

  /* ─────────── 更多功能页 ─────────── */
  $('#moreGrid').innerHTML = gridHTML(DATA.moreFunctions);
  bindActs('#moreGrid .g8-item');

  /* ─────────── 工小智对话 ─────────── */
  const chatList = $('#chatList');
  function pushMsg(role, html) {
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = `<span class="c-ava">${role === 'ai' ? 'AI' : '我'}</span><div class="bubble">${html}</div>`;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
  }
  pushMsg('ai', '您好，我是工行智能助手 <b>工小智</b> 😊<br>领航AI+ 已覆盖 500+ 场景：查余额、转账、理财推荐都可以问我。最近我还学会了新技能——<b>「识谷」谷子估值</b>，试试点击下方技能卡～');

  function botReply(text) {
    const t = text.toLowerCase();
    for (const c of DATA.chatReplies) {
      if (c.k.some(k => t.includes(k.toLowerCase()))) return c.r;
    }
    return DATA.chatFallback;
  }
  function sendChat(text) {
    const v = (text || $('#chatInput').value).trim();
    if (!v) return;
    $('#chatInput').value = '';
    pushMsg('me', v);
    setTimeout(() => pushMsg('ai', botReply(v)), 620);
  }
  $('#chatSend').addEventListener('click', () => sendChat());
  $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  $$('#xiaozhi-skill-chips [data-skill]').forEach(b =>
    b.addEventListener('click', () => sendChat(b.dataset.skill)));

  /* ─────────── ★ e次元功能切换（植入位3） ─────────── */
  $('#xingeguChips').innerHTML = DATA.xingegu.features.map(f => `
    <button class="xg-chip" data-feature="${f.id}">${ico(f.icon, 15)} ${f.name}</button>`).join('');

  function selectXingegu(featureId) {
    const f = DATA.xingegu.features.find(x => x.id === featureId) || DATA.xingegu.features[0];
    $$('#xingeguChips .xg-chip').forEach(c =>
      c.classList.toggle('active', c.dataset.feature === f.id));
    const phTitle = $('#xgPhTitle');
    if (phTitle) phTitle.textContent = `${f.name} · ${f.desc}`;
    document.dispatchEvent(new CustomEvent('xingegu:open', {
      detail: { feature: f, slot: $('#xingegu-slot') }
    }));
  }
  $('#xingeguChips').addEventListener('click', e => {
    const c = e.target.closest('.xg-chip');
    if (c) selectXingegu(c.dataset.feature);
  });

  function openXingegu(featureId) {
    openPage('page-xingegu');
    selectXingegu(featureId || 'shigu');
  }

  /* ─────────── 状态栏时间 ─────────── */
  function tick() {
    const d = new Date();
    $('#sbTime').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  tick();
  setInterval(tick, 20000);

  /* ─────────── 外壳点击涟漪（Q弹反馈） ─────────── */
  const shell = document.querySelector('.phone');
  if (shell) shell.addEventListener('pointerdown', e => {
    const b = e.target.closest('button, .qk-item, .g8-item, .mi-item');
    if (!b || b.classList.contains('dis')) return;
    const r = b.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const s = document.createElement('span');
    s.className = 'rp';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    if (getComputedStyle(b).overflow !== 'hidden') b.style.overflow = 'hidden';
    b.appendChild(s);
    setTimeout(() => s.remove(), 560);
  });

  /* ─────────── 对外 API ─────────── */
  window.ICBCApp = {
    toast, openPage, closePage, openXingegu, ico,
    setBalance(v) {
      DATA.account.balance = v;
      DATA.account.available = v;
      renderBalance();
    },
    addRecord(rec) { addRecord(rec); },
    data: DATA
  };
})();
