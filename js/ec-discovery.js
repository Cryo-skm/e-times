/* ════════════════════════════════════════════════════════════════════
   e次元 · 画面填充层  (js/ec-discovery.js)
   ─────────────────────────────────────────────────────────────────────
   思路：**先挖窗口，再填图**。
   e次元 里的每个「窗口」都由 CSS 定死形状（.ecx-hero / .ec-win--goods
   / .ecx-cm-ava …），本文件只负责把 img/art 下生成的原创二次元素材
   填进去，于是同一批图能适配横幅、方卡、圆头像等不同窗口。

   覆盖：广场（横幅+推荐）、甄选商城（横幅+热门周边）、藏馆、质押贷、
        我的（谷伴名片）等页面的顶部与内容补充。
   本文件不改变任何既有交互，只在渲染完成后追加/前置装饰块。
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const A = 'img/art/';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* 场景插画：按当前性别取文件名（男生版 banner-x.jpg / 女生版 banner2-x.jpg）
     返回的 <img> 自带 data-gart，性别切换时由 CHARS.repaint() 就地换图 */
  const G = (base, cls, alt) => (window.CHARS && CHARS.artImg)
    ? CHARS.artImg(base, cls, alt)
    : `<img${cls ? ` class="${cls}"` : ''} data-gart="${base}" src="${A}${base}.jpg" alt="${alt || ''}" loading="lazy">`;

  /* ── 周边窗：名称 / 图 / 价 / 标签 ── */
  const GOODS = [
    { img: 'goods-stand.jpg',  n: '亚克力立牌 · 星熠白昼流光', p: '¥269', t: '现货' },
    { img: 'goods-figure.jpg', n: '1/7 手办 · 语棠樱色絮语',   p: '¥1,099', t: '预售' },
    { img: 'goods-badge.jpg',  n: '马口铁吧唧套组 · 三枚装',   p: '¥89',  t: '热卖' },
    { img: 'goods-strap.jpg',  n: '亚克力挂件 · 墨书夜读',     p: '¥129', t: '现货' },
    { img: 'goods-box.jpg',    n: '谷子礼盒 · 四季限定',       p: '¥299', t: '限量' },
    { img: 'goods-blind.jpg',  n: '谷伴盲盒 · 隐藏款随机',     p: '¥69',  t: '上新' }
  ];

  const goodsHTML = () => `
    <div class="ecx-sec">
      <div class="ecx-head"><b>热门周边</b><span class="ecx-more" data-ec-go="mall">全部 ›</span></div>
      <div class="ecx-goods">
        ${GOODS.map(g => `
          <button class="ecx-g" data-ec-goods="${esc(g.n)}">
            <span class="ec-win ec-win--goods"><img src="${A}${g.img}" alt="${esc(g.n)}" loading="lazy"></span>
            <b>${esc(g.n)}</b>
            <span class="ecx-grow2"><em>${esc(g.p)}</em><i>${esc(g.t)}</i></span>
          </button>`).join('')}
      </div>
    </div>`;

  /* ── 各页装饰块 ── */
  const DECO = {
    /* 广场：社区横幅 + 热门周边 */
    plaza: {
      sel: '#plazaBody', pos: 'prepend', html: () => `
        <button class="ecx-hero" data-ec-go="forum">
          ${G('banner-community', null, '谷圈广场')}
          <div class="ecx-hero-t">
            <span class="ecx-k">今日广场</span>
            <b>谷圈广场 · 今天也在吃谷</b>
            <span>3 位同好正在晒谷 · 2 场限时秒杀进行中</span>
          </div>
          <span class="ecx-hero-go">去谷圈 ›</span>
        </button>` + goodsHTML()
    },

    /* 甄选商城：AI 推荐横幅 + 热门周边 */
    mall: {
      sel: '#mallBody', pos: 'prepend', html: () => `
        <button class="ecx-hero" data-ec-go="guxiang">
          ${G('banner-mall', null, 'e次元甄选')}
          <div class="ecx-hero-t">
            <span class="ecx-k">e次元 甄选</span>
            <b>自有 IP 直供 · 说一句话就下单</b>
            <span>工行自有版权商品，来源可溯、验货放款</span>
          </div>
          <span class="ecx-hero-go">让谷享帮我买 ›</span>
        </button>` + goodsHTML()
    },

    /* 识谷：多模态识别横幅 */
    shigu: {
      sel: '#shiguBody', pos: 'prepend', html: () => `
        <div class="ecx-hero ecx-hero--plain">
          ${G('banner-ai', null, '识谷')}
          <div class="ecx-hero-t">
            <span class="ecx-k">多模态识别</span>
            <b>拍一拍，就知道它值多少</b>
            <span>视觉比对 · 官方图库 · 区块链存证，鉴定报告不可篡改</span>
          </div>
        </div>`
    },

    /* 出谷通：托管横幅 */
    chugu: {
      sel: '#chuguBody', pos: 'prepend', html: () => `
        <div class="ecx-hero ecx-hero--plain">
          ${G('banner-trade', null, '出谷通')}
          <div class="ecx-hero-t">
            <span class="ecx-k">出谷通 · 托管</span>
            <b>下单前说清楚，收到后有地方核对</b>
            <span>72 小时验货窗口 · 资金先入托管，确认后才放款</span>
          </div>
        </div>`
    },

    /* 谷卡：分期横幅 */
    guka: {
      sel: '#gukaBody', pos: 'prepend', html: () => `
        <div class="ecx-hero ecx-hero--plain">
          ${G('banner-credit', null, '谷卡')}
          <div class="ecx-hero-t">
            <span class="ecx-k">谷卡 · 分期</span>
            <b>喜欢的东西，可以慢慢付</b>
            <span>IP 联名卡面 · 免息分期 · 谷粒抵扣，最高 5 万额度</span>
          </div>
        </div>`
    },

    /* 谷享：AI 代购比价横幅 */
    guxiang: {
      sel: '#guxiangBody', pos: 'prepend', html: () => `
        <button class="ecx-hero" data-ec-go="mall">
          ${G('banner-guxiang', null, '谷享')}
          <div class="ecx-hero-t">
            <span class="ecx-k">谷享 · AI 代购</span>
            <b>说一句话，全网替你盯梢比价</b>
            <span>自动比价 · 到手价预警 · 授权后代下单</span>
          </div>
          <span class="ecx-hero-go">去甄选商城 ›</span>
        </button>`
    },

    /* 藏馆：展厅横幅 */
    cang: {
      sel: '#cangBody', pos: 'prepend', html: () => `
        <button class="ecx-hero ecx-hero--tall" data-ec-go="cang">
          ${G('banner-gallery', null, '虚拟藏馆')}
          <div class="ecx-hero-t">
            <span class="ecx-k">数字分身</span>
            <b>你的私人展厅已经亮灯</b>
            <span>建档 · 布展 · AR 预览 · 好友共创</span>
          </div>
        </button>`
    },

    /* 质押贷：授信横幅 */
    zhidai: {
      sel: '#zhidaiBody', pos: 'prepend', html: () => `
        <div class="ecx-hero ecx-hero--plain">
          ${G('banner-pledge', null, '质押贷')}
          <div class="ecx-hero-t">
            <span class="ecx-k">价值变现</span>
            <b>把收藏变成可用额度</b>
            <span>AI 品相鉴定 · 市场估值 · 智能授信</span>
          </div>
        </div>`
    },

    /* 论坛：社区横幅 */
    forum: {
      sel: '#forumBody', pos: 'prepend', html: () => `
        <button class="ecx-hero" data-ec-go="create">
          ${G('banner-community', null, '谷圈论坛')}
          <div class="ecx-hero-t">
            <span class="ecx-k">同好在此</span>
            <b>晒谷 · 情报 · 出回血</b>
            <span>发帖能攒谷粒，优质内容还有收益</span>
          </div>
          <span class="ecx-hero-go">去创作中心 ›</span>
        </button>`
    },

    /* 创作中心：创作激励横幅 */
    create: {
      sel: '#createBody', pos: 'prepend', html: () => `
        <div class="ecx-hero ecx-hero--plain">
          ${G('banner-community', null, '创作中心')}
          <div class="ecx-hero-t">
            <span class="ecx-k">创作有收益</span>
            <b>把热爱写下来，也是收入</b>
            <span>晒谷测评 · 布展记录 · 回血攻略，优质内容另有谷粒激励</span>
          </div>
        </div>`
    },

    /* 权益星球：兑换横幅 */
    exchange: {
      sel: '#exchangeBody', pos: 'prepend', html: () => `
        <div class="ecx-hero ecx-hero--plain">
          ${G('banner-gallery', null, '权益星球')}
          <div class="ecx-hero-t">
            <span class="ecx-k">权益星球</span>
            <b>攒下的谷粒，都算数</b>
            <span>限定周边 · 卡面权益 · 手续费减免，直接用谷粒换</span>
          </div>
        </div>`
    },

    /* 我的：谷伴名片（把角色图填进大圆窗） */
    mine: {
      sel: '#mineBody', pos: 'prepend', html: () => {
        const id = window.CHARS ? CHARS.current() : 'xiaoe';
        const c = window.CHARS ? CHARS.get(id) : { name: '小e', role: '首席谷伴', say: '' };
        return `
        <div class="ecx-cm" style="--tone:${c.tone || '#ff7fa8'};--tone2:${c.tone2 || '#ffd6e4'}">
          <span class="ecx-cm-ava">${CHARS.head(id)}</span>
          <div class="ecx-cm-txt">
            <b>${esc(c.name)} <i>${esc(c.role)}</i></b>
            <span>陪你逛 e次元</span>
            <p>「${esc(c.say)}」</p>
          </div>
          <button class="ecx-cm-btn" data-ec-pick="1">换谷伴</button>
        </div>`;
      }
    }
  };

  function decorate(p) {
    const d = DECO[p];
    if (!d) return;
    const body = document.querySelector(d.sel);
    if (!body) return;
    /* 每次渲染后 body 会被重写，所以直接注入；用标记防止重复叠加 */
    if (body.querySelector(':scope > .ecx-sec, :scope > .ecx-hero, :scope > .ecx-cm')) return;
    const html = typeof d.html === 'function' ? d.html() : d.html;
    if (d.pos === 'prepend') body.insertAdjacentHTML('afterbegin', html);
    else body.insertAdjacentHTML('beforeend', html);
  }

  /* ── 把渲染函数包一层，渲染完立刻填图 ── */
  const MAP = {
    plaza: 'renderPlaza', mall: 'renderMall', forum: 'renderForum',
    create: 'renderCreate', exchange: 'renderExchange',
    mine: 'renderMine', cang: 'renderCang', zhidai: 'renderZhidai',
    shigu: 'renderShigu', chugu: 'renderChugu', guka: 'renderGuka',
    guxiang: 'renderGuxiang'
  };

  function install() {
    if (!window.XZG) return;
    Object.keys(MAP).forEach(p => {
      const fn = MAP[p];
      const orig = XZG[fn];
      if (typeof orig !== 'function' || orig.__ecx) return;
      const wrapped = function () {
        const r = orig.apply(this, arguments);
        try { decorate(p); } catch (e) { console.warn('[e次元] 画面填充失败', p, e); }
        return r;
      };
      wrapped.__ecx = true;
      XZG[fn] = wrapped;
    });
  }

  /* ── 新建区块内的点击 ── */
  document.addEventListener('click', e => {
    const pick = e.target.closest('[data-ec-pick]');
    if (pick) { e.preventDefault(); XZG.pickCompanionOpen(); return; }

    const g = e.target.closest('[data-ec-goods]');
    if (g) {
      e.preventDefault();
      const name = g.dataset.ecGoods;
      XZG.sheet(`<h3>🛍️ ${esc(name)}</h3>
        <div class="ssub">e次元甄选 · 工行自有 IP 直供 · 演示商品</div>
        <div class="ecx-detail-img"><img src="${g.querySelector('img').getAttribute('src')}" alt=""></div>
        <div class="xzg-muted" style="margin-top:10px;line-height:1.9">
          同步支持：<b>谷粒兑换</b>（权益星球）/ <b>分期购买</b>（谷卡免息期数）/
          <b>出谷通托管</b>（验货后放款）。本页为演示环境，不产生真实交易。
        </div>
        <button class="xzg-btn big" style="margin-top:14px"
          onclick="XZG.sheetClose();XZG.go('guka')">去看看分期方案</button>`);
      return;
    }

    const go = e.target.closest('[data-ec-go]');
    if (go && window.EC_ENTRY && EC_ENTRY.goto) {
      e.preventDefault();
      EC_ENTRY.goto(go.dataset.ecGo);
    }
  }, true);

  /* ── 公开的刷新入口（外部改完状态可手动调） ── */
  window.EC_DISCOVER = {
    decorate, install,
    refresh() { install(); decorate(window.XZG && XZG._lastPg); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(install, 0));
  } else setTimeout(install, 0);
})();
