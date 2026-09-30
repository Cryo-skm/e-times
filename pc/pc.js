/* ════════════════════════════════════════════════════════════════════
   e次元 PC 工作台  (pc/pc.js)
   ─────────────────────────────────────────────────────────────────────
   工行个人网上银行（模拟）只是外壳与入口；点击任意 e次元 入口 → 转场
   「桃花源」→ 进入 e次元 PC 工作台。

   页面：e谷推首页 / 商品推荐 / AI鉴真 / 智能估值 / 交易保障 / 谷子信贷 /
        我的收藏 / 个人虚拟藏馆 / 社区广场 / 好友共创 / AR体验 / 消息 / 个人中心
   全部素材取自 img/art（本项目原创生成），窗口由 CSS 定形、图片填入。
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const A = '../img/art/';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = n => Number(n).toLocaleString('zh-CN');

  /* 场景插画：与手机端共用 ec_char_gender（同一 origin 的 localStorage）
     男生版 banner-x.jpg / 女生版 banner2-x.jpg；抽象底图不在表内 */
  const GART = {
    'banner-door':'banner2-door.jpg','banner-community':'banner2-community.jpg',
    'banner-ai':'banner2-ai.jpg','banner-credit':'banner2-credit.jpg',
    'banner-trade':'banner2-trade.jpg','banner-ar':'banner2-ar.jpg',
    'banner-guxiang':'banner2-guxiang.jpg','cover-enter':'cover2-enter.jpg'
  };
  const gArt = base => {
    let g = 'boy';
    try { g = localStorage.getItem('ec_char_gender') || 'boy'; } catch (e) {}
    return A + ((g === 'girl' && GART[base]) ? GART[base] : base + '.jpg');
  };

  /* ══════════ 素材表 ══════════ */
  const CHARS = [
    { id: 'xiaoe', n: '小e', r: '首席谷伴', f: ['综合陪伴', '新手引导'] },
    { id: 'xingyi', n: '星熠', r: '识谷官', f: ['估值鉴定', '行情研判'] },
    { id: 'chengxi', n: '橙汐', r: '比价官', f: ['全网比价', '渠道盯梢'] },
    { id: 'yunjian', n: '云间', r: '托管官', f: ['交易托管', '风控履约'] },
    { id: 'yutang', n: '语棠', r: '攒谷官', f: ['成长记账', '权益兑换'] },
    { id: 'yufeng', n: '御风', r: '谷卡官', f: ['卡面定制', '分期规划'] },
    { id: 'moshu', n: '墨书', r: '藏馆官', f: ['数字建档', '虚拟展厅'] },
    { id: 'qinghe', n: '清和', r: '授信官', f: ['藏品授信', '额度测算'] }
  ];
  const GOODS = [
    { img: 'goods-stand.jpg', n: '「星熠」白昼流光 亚克力立牌', p: 269, t: '现货', tag: 'S' },
    { img: 'goods-figure.jpg', n: '「语棠」樱色絮语 1/7 手办', p: 1099, t: '预售', tag: 'SSR' },
    { img: 'goods-badge.jpg', n: '「橙汐」双闪吧唧套组（3枚）', p: 89, t: '热卖', tag: 'A' },
    { img: 'goods-strap.jpg', n: '「墨书」夜读 亚克力挂件', p: 129, t: '现货', tag: 'A' },
    { img: 'goods-box.jpg', n: '谷伴四季 限定礼盒', p: 299, t: '限量', tag: 'SSR' },
    { img: 'goods-blind.jpg', n: '谷伴盲盒 · 隐藏款随机', p: 69, t: '上新', tag: 'B' }
  ];
  const TREND = [252, 258, 249, 261, 270, 266, 274, 288, 280, 292, 301, 296, 310, 318, 312, 325, 340, 332, 348, 356, 349, 362, 375, 368, 382, 391, 385, 398, 405, 412];

  /* ══════════ 图标 ══════════ */
  const I = {
    home: '<path d="M3 10.6 12 3.5l9 7.1M5.3 9.6V20h13.4V9.6"/>',
    bag: '<path d="M4.5 8h15l-1.2 12.2H5.7L4.5 8z"/><path d="M8.8 10.4V6.6a3.2 3.2 0 0 1 6.4 0v3.8"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16"/>',
    chart: '<path d="M4 20h16M6.5 16V9M11 16V5.5M15.5 16v-8M20 16V8"/>',
    shield: '<path d="M12 3.5 5 6v6c0 4.2 3 7.3 7 8.5 4-1.2 7-4.3 7-8.5V6l-7-2.5z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    gold: '<circle cx="12" cy="12" r="7.5"/><path d="M12 8v8M10 10h4M10 14h4"/>',
    heart: '<path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20z"/>',
    build: '<rect x="5.5" y="4" width="13" height="16.5" rx="1.5"/><path d="M9 8h2M13 8h2M9 11.5h2M13 11.5h2M9 15h6M10.5 20.5v-3h3v3"/>',
    talk: '<path d="M4 5.5h16v11H9l-5 4v-15z"/><path d="M8 9.5h8M8 12.5h5"/>',
    users: '<circle cx="9" cy="8.5" r="3.3"/><circle cx="17" cy="9.5" r="2.6"/><path d="M3 19.5c.9-3.1 3.2-4.6 6-4.6s5.1 1.5 6 4.6"/><path d="M15.5 15.2c2.3.2 4 1.5 4.8 4.3"/>',
    cube: '<path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5z"/><path d="M4 8l8 4.5M20 8l-8 4.5M12 12.5V20"/>',
    bell: '<path d="M12 3.5a6.5 6.5 0 0 0-6.5 6.5v3.4L4 16.5h16l-1.5-3.1V10A6.5 6.5 0 0 0 12 3.5z"/><path d="M9.6 19a2.4 2.4 0 0 0 4.8 0"/>',
    user: '<circle cx="12" cy="8.4" r="3.7"/><path d="M4.8 20.4c1.2-3.5 3.9-5.2 7.2-5.2s6 1.7 7.2 5.2"/>',
    spark: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5z"/>',
    doc: '<path d="M6 3.5h8l4 4V20.5H6V3.5z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
    ico: c => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">${I[c] || I.spark}</svg>`
  };
  I.spark = I.spark;

  /* ══════════ 菜单 ══════════ */
  const MENU = [
    { g: '主线' },
    { id: 'home', n: 'e谷推首页', ic: 'home' },
    { id: 'goods', n: '商品推荐', ic: 'bag' },
    { g: '金融服务' },
    { id: 'shigu', n: 'AI 鉴真系统', ic: 'scan' },
    { id: 'value', n: '智能估值系统', ic: 'chart' },
    { id: 'trade', n: '交易保障系统', ic: 'shield' },
    { id: 'credit', n: '谷子信贷', ic: 'gold' },
    { g: '我的' },
    { id: 'fav', n: '我的收藏', ic: 'heart' },
    { id: 'cang', n: '个人虚拟藏馆', ic: 'build' },
    { g: '社区' },
    { id: 'plaza', n: '社区广场', ic: 'talk', badge: 3 },
    { id: 'coop', n: '好友共创', ic: 'users' },
    { id: 'ar', n: 'AR 体验', ic: 'cube' },
    { id: 'msg', n: '消息中心', ic: 'bell', badge: 5 },
    { id: 'me', n: '个人中心', ic: 'user' }
  ];

  const TITLE = {
    home: ['e谷推 · 首页', '说一句想要什么，e谷推替你盯全网渠道、比价、判断真伪，必要时替你下单。'],
    goods: ['e次元甄选 · 商品推荐', '工行自有 IP 衍生品为主，来源可溯、正版可查；也支持谷粒兑换与免息分期。'],
    shigu: ['AI 鉴真系统', '上传商品图片，系统结合图像识别与官方数据库比对，生成鉴真结果报告。'],
    value: ['智能估值系统', '基于大数据与机器学习算法，为您提供专业的价格趋势分析和科学估值。'],
    trade: ['交易保障系统', '基于智能合约的第三方资金托管与验货期管理，保障交易全过程安全透明。'],
    credit: ['谷子信贷 · 专属金融服务', '面向谷子爱好者的消费信贷服务，灵活分期方案，让热爱不被预算限制。'],
    fav: ['我的收藏', '关注的商品、监控的需求与收藏的档案，都在这里。'],
    cang: ['个人虚拟藏馆', '打造属于你的专属 3D 收藏空间，展示你的珍爱藏品，策划主题展览。'],
    plaza: ['社区广场', '晒谷 · 情报 · 出回血。同好在这里交换行情与心情。'],
    coop: ['好友共创，跨域同玩', '与好友实时互动，共享收藏乐趣，建立同好圈层。'],
    ar: ['打破次元壁的 AR 体验', '把数字藏品投影到现实场景中，拍照、创作、分享。'],
    msg: ['消息中心', '行情提醒、任务提醒、交易动态与系统通知。'],
    me: ['个人中心', '成长体系、谷伴管理与账户设置。']
  };

  /* ══════════ 状态 ══════════ */
  const S = {
    page: 'home',
    pref: ['xingyi', 'chengxi', 'yunjian'],
    query: '',
    goodsCat: 'all',
    cangRoom: 'gallery',
    shigu: { step: 0, done: false },
    trade: { step: 0 },
    valQuery: '亚克力立牌'
  };

  /* ══════════ 页面渲染 ══════════ */
  const P = {};

  /* —— 首页（e谷推） —— */
  P.home = () => {
    const prefs = CHARS.filter(c => S.pref.includes(c.id));
    return `
    <div class="pg-head"><div class="row"><div>
      <h1>${TITLE.home[0]}</h1><p>${TITLE.home[1]}</p>
    </div><div class="sp"><span class="tag pk">e谷推 多任务模型</span> <span class="tag bl">GPT-Fin 语义</span></div></div></div>

    <div class="grid-32">
      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#fff0f6">🐾</span>我的偏好设置
          <span class="sp" data-pcpage="me">编辑 ›</span></div>
        <div class="tiny" style="margin-bottom:10px">选几位你最常打交道的谷伴，e谷推会按他们的专长优先处理你的需求。</div>
        <div class="grid4" style="gap:10px">
          ${CHARS.slice(0, 4).map(c => `
            <button class="pref-card${S.pref.includes(c.id) ? ' on' : ''}" data-pcpref="${c.id}">
              <span class="pc-win"><img src="${A}char-${c.id}.jpg" alt="" loading="lazy"></span>
              <b>${c.n}</b><span>${c.r}</span>
            </button>`).join('')}
        </div>
        <div class="chiprow" style="margin-top:12px">
          ${prefs.map(c => `<span class="chip on">${c.n} · ${c.f[0]}</span>`).join('')}
        </div>
      </div>

      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#eef4ff">🔔</span>智能提醒
          <span class="sp">设置</span></div>
        ${[
          ['《葬送的芙莉莲》新款周边已上架', '殿堂级 IP · 授权商品，已为你加入比价队列', '#eef4ff', '🆕'],
          ['「限量吧唧」价格下调 12%', '近 7 日均价 ¥428 → ¥377，低于你的目标价', '#fff0f6', '📉'],
          ['「亚克力立牌」补货到仓', '官方渠道现货 12 件，建议尽快决定', '#e9f8f2', '📦']
        ].map(([t, s, bg, e]) => `
          <div class="lrow"><span class="li" style="background:${bg}">${e}</span>
            <div class="lm"><b>${t}</b><span>${s}</span></div></div>`).join('')}
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#f1ecff">✨</span>AI 发现结果
        <span class="sp" data-pcpage="goods">查看全部 ›</span></div>
      <div class="grid3">
        ${['stand', 'badge', 'strap'].map(k => {
          const g = GOODS.find(x => x.img.indexOf(k) === 0);
          return g ? goodCard(g, ['命中角色', '预算内', '现货']) : '';
        }).join('')}
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#fff6e7">👀</span>监控任务
        <span class="sp" data-pctoast="演示环境：任务管理为示意">全部 ›</span></div>
      <div class="grid-32" style="gap:12px">
        <div class="mon">
          <div class="lrow"><span class="li" style="background:#fff0f6">🔍</span>
            <div class="lm"><b>「星熠」亚克力立牌 · 预算 ¥300 以内</b><span>盯梢中 · 已比对 6 个渠道，2 个命中</span></div>
            <span class="tag tl">盯梢中</span></div>
          <div class="lrow"><span class="li" style="background:#eef4ff">🔔</span>
            <div class="lm"><b>「语棠」手办 · 低于均价 15% 时提醒</b><span>已达标 · 当前低于均价 18%</span></div>
            <span class="tag am">已达标</span></div>
        </div>
        <div>
          <div class="metric pk"><em>今日比价次数</em><b>128</b></div>
          <div class="grid2" style="gap:10px;margin-top:10px">
            <div class="metric bl"><em>覆盖渠道</em><b>6</b></div>
            <div class="metric tl"><em>累计省下</em><b>¥1,860</b></div>
          </div>
        </div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#e9f8f2">🧭</span>e谷推 智能推荐流程示意</div>
      <div class="steps">
        <div class="step done"><div class="si">💬</div><b>① 你说需求</b><span>自然语言即可</span></div>
        <div class="step done"><div class="si">🧠</div><b>② e谷推 语义解析</b><span>结构化字段 + 授权确认</span></div>
        <div class="step done"><div class="si">🔎</div><b>③ 全网渠道比对</b><span>官方 / 二手 / 社交平台</span></div>
        <div class="step done"><div class="si">🛡️</div><b>④ 出谷通 保障成交</b><span>托管放款 · 信用沉淀</span></div>
      </div>
    </div>`;
  };

  /* —— 商品推荐 —— */
  P.goods = () => {
    const cats = [['all', '全部'], ['goods-stand', '亚克力立牌'], ['goods-figure', '手办'],
      ['goods-badge', '徽章/吧唧'], ['goods-strap', '挂件'], ['goods-box', '礼盒'], ['goods-blind', '盲盒']];
    const list = S.goodsCat === 'all' ? GOODS : GOODS.filter(g => g.img.indexOf(S.goodsCat) === 0);
    return `
    <div class="pg-head"><h1>${TITLE.goods[0]}</h1><p>${TITLE.goods[1]}</p></div>
    <div class="win win-bn" style="margin-bottom:16px">
      <img src="${gArt('banner-ai')}" alt="">
      <div class="wt"><b>自有 IP 直供 · 说一句话就下单</b><span>正版可溯 · 支持谷粒兑换 / 免息分期 / 出谷通托管</span></div>
    </div>
    <div class="chiprow" style="margin-bottom:14px">
      ${cats.map(([k, n]) => `<button class="chip${S.goodsCat === k ? ' on' : ''}" data-pccat="${k}">${n}</button>`).join('')}
    </div>
    <div class="grid3">${list.map(g => goodCard(g, ['官方直供', '正版可查'])).join('')}</div>`;
  };

  /* —— AI 鉴真 —— */
  P.shigu = () => {
    const st = S.shigu;
    return `
    <div class="pg-head"><div class="row"><div>
      <h1>${TITLE.shigu[0]}</h1><p>${TITLE.shigu[1]}</p>
    </div><div class="sp"><button class="btn gray sm" data-pctoast="演示环境：历史记录为示意">🕘 查看历史记录</button></div></div></div>

    <div class="win win-bn" style="margin-bottom:16px">
      <img src="${gArt('banner-ai')}" alt="">
      <div class="wt"><b>多模态识别 · 一眼辨真伪</b><span>视觉比对 + 官方图库 + 区块链存证，鉴定报告不可篡改</span></div>
    </div>

    <div class="grid2">
      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#eef4ff">⬆️</span>上传商品图片
          <span class="sp">支持多角度上传，提升鉴定准确率</span></div>
        ${st.done
        ? `<div class="win" style="border-radius:12px"><img src="${A}goods-badge.jpg" alt="" style="height:200px"></div>
             <div style="margin-top:12px"><button class="btn gray sm" data-pcshigureset>重新上传</button></div>`
        : `<div class="drop" data-pcshiguup>
               <div class="di">⬆️</div><b>点击选择图片，或拖拽到此处</b>
               <p>支持 JPG / PNG，建议上传商品多角度照片<br>AI 将比对官方数据库，生成鉴真报告</p>
             </div>`}
      </div>
      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#f1ecff">🔍</span>等待鉴定结果
          <span class="sp">智能识别 · 官方数据 · 权威可靠</span></div>
        ${st.done ? `
          <div class="metric tl" style="padding:18px"><em>鉴定结论</em><b>正版概率 98.5%</b></div>
          <div class="lrow" style="margin-top:10px"><span class="li" style="background:#e9f8f2">✅</span><div class="lm"><b>特征比对通过</b><span>版式、印刷网点、边线弧度与官方图库一致</span></div></div>
          <div class="lrow"><span class="li" style="background:#eef4ff">🔐</span><div class="lm"><b>已上链存证</b><span>报告编号 EC-2026-9F31A8 · 不可篡改</span></div></div>
          <button class="btn sm" style="margin-top:12px" data-pctoast="报告已保存到「我的收藏」">保存报告</button>`
        : `<div class="empty"><span class="e">🔎</span>上传图片后，AI 将为您分析商品真伪</div>`}
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#fff0f6">🧩</span>AI 鉴真流程说明</div>
      <div class="steps">
        <div class="step done"><div class="si">🖼️</div><b>① 上传图片</b><span>拍摄商品清晰图片，多角度更佳</span></div>
        <div class="step done"><div class="si">🤖</div><b>② AI 分析</b><span>计算机视觉比对官方数据库</span></div>
        <div class="step done"><div class="si">📑</div><b>③ 提取特征</b><span>量化版式与涂装细节等</span></div>
        <div class="step done"><div class="si">🛡️</div><b>④ 生成报告</b><span>区块链存证确保不可篡改</span></div>
      </div>
    </div>`;
  };

  /* —— 智能估值 —— */
  P.value = () => `
    <div class="pg-head"><div class="row"><div>
      <h1>${TITLE.value[0]}</h1><p>${TITLE.value[1]}</p>
    </div><div class="sp"><span class="tag tl">数据来源：平台成交 + 公开行情（演示）</span></div></div></div>

    <div class="grid-32">
      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#e9f8f2">🔍</span>商品搜索</div>
        <div class="fld"><div class="inp">
          <input id="valQ" placeholder="输入商品名称或 ID" value="${esc(S.valQuery)}">
          <button class="btn sm" id="valGo">搜索</button>
        </div></div>
        <div class="tiny" style="margin-top:2px">最近搜索：</div>
        <div class="chiprow" style="margin-top:6px">
          <button class="chip" data-pcval="亚克力立牌">亚克力立牌</button>
          <button class="chip" data-pcval="限量吧唧">限量吧唧</button>
          <button class="chip" data-pcval="1/7 手办">1/7 手办</button>
        </div>
        <div class="win win-sq" style="margin-top:12px;border-radius:12px">
          <img src="${A}goods-stand.jpg" alt="">
        </div>
        <div style="text-align:center;margin-top:10px">
          <div class="tiny">当前参考价</div>
          <div style="font-size:24px;font-weight:800;color:var(--pk-d)">¥${GOODS[0].p}</div>
          <div class="tiny" style="margin-top:4px">合理区间 ¥${Math.round(GOODS[0].p * .86)} ~ ¥${Math.round(GOODS[0].p * 1.22)}</div>
        </div>
      </div>

      <div>
        <div class="pnl">
          <div class="pnl-t"><span class="ic" style="background:#eef4ff">📈</span>价格趋势分析
            <span class="sp"><span class="tag on">7天</span> <span class="tag">30天</span> <span class="tag">90天</span></span></div>
          <div class="chartbox"><canvas id="valChart"></canvas></div>
        </div>
        <div class="grid2" style="margin-top:14px">
          <div class="pnl">
            <div class="pnl-t"><span class="ic" style="background:#fff6e7">📊</span>谷子指数</div>
            <div style="display:flex;align-items:center;gap:10px">
              <b style="font-size:26px;color:#0a8f60">+6.4%</b>
              <span class="tag tl">近 7 日</span>
            </div>
            <div style="height:8px;border-radius:5px;background:linear-gradient(90deg,#8fd3ff,#8ee6c4,#ffd98c,#ffa6c4);margin-top:10px"></div>
            <div style="display:flex;justify-content:space-between;margin-top:6px" class="tiny">
              <span>偏冷</span><span>关注区</span><span>活跃区</span><span>高热区</span></div>
          </div>
          <div class="pnl">
            <div class="pnl-t"><span class="ic" style="background:#f1ecff">🎯</span>估值区间</div>
            <div class="grid3" style="gap:8px">
              <div class="metric bl"><em>低区</em><b>¥231</b></div>
              <div class="metric tl"><em>合理区</em><b>¥269</b></div>
              <div class="metric am"><em>溢价区</em><b>¥328</b></div>
            </div>
            <div class="tiny" style="margin-top:8px">低于低区建议入手，高于溢价区建议观望。</div>
          </div>
        </div>
        <div class="pnl" style="margin-top:14px">
          <div class="pnl-t"><span class="ic" style="background:#eef4ff">💡</span>交易建议</div>
          <div class="muted">当前价格处于<b>合理区</b>：近 7 日成交价稳定上行，成交量温和放大；同款二手挂单 14 条，议价空间约 6%。
            若为自用可入手，若为投资建议等待低区。<br><span class="tiny">※ 本页为演示环境，估值与建议不构成真实投资意见。</span></div>
        </div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#fff0f6">🔥</span>热门商品估值
        <span class="sp" data-pcpage="goods">查看更多 ›</span></div>
      <div class="grid4">
        ${GOODS.slice(0, 4).map(g => `
          <div class="lrow" style="border:none;padding:6px 2px">
            <span class="win win-sq" style="width:44px;height:44px;border-radius:10px;flex:none"><img src="${A}${g.img}" alt=""></span>
            <div class="lm"><b style="font-size:12px">${g.n}</b><span>¥${money(g.p)}</span></div>
            <span class="tag ${g.p > 300 ? 'tl' : 'bl'}">${g.p > 300 ? '低位中' : '稳定中'}</span>
          </div>`).join('')}
      </div>
    </div>`;

  /* —— 交易保障 —— */
  P.trade = () => `
    <div class="pg-head"><div class="row"><div>
      <h1>${TITLE.trade[0]}</h1><p>${TITLE.trade[1]}</p>
    </div><div class="sp"><button class="btn am sm" data-pctoast="演示环境：协议文本为示意">📄 查看协议</button></div></div></div>

    <div class="win win-bn" style="margin-bottom:16px">
      <img src="${gArt('banner-trade')}" alt="">
      <div class="wt"><b>下单前说清楚，收到后有地方核对</b><span>版本 / 品相 / 附件 / 售后约定全部写进订单确认页 · 72 小时验货窗口</span></div>
    </div>

    <div class="grid-32">
      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#fff6e7">🛡️</span>创建安全交易</div>
        <div class="fld"><label>卖家 ID</label><div class="inp"><input placeholder="输入卖家用户ID或昵称" value="谷屋小铺**"></div></div>
        <div class="fld"><label>商品 ID</label><div class="inp"><input placeholder="输入商品ID或名称" value="「星熠」亚克力立牌"></div></div>
        <div class="fld"><label>交易金额（￥）</label><div class="inp"><input id="tradeAmt" value="269.00"><span class="fx">元</span></div></div>
        <div class="fld"><label>验货期限</label><div class="inp">
          <input value="72 小时（推荐）" readonly><span class="fx">▾</span></div></div>
        <button class="btn" style="width:100%;margin-top:4px" data-pctrade>🔒 创建安全交易</button>
        <div class="tiny" style="margin-top:9px">创建后资金进入工行托管账户，验货确认前卖家无法提现。</div>
      </div>

      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#eef4ff">🧾</span>交易流程
          <span class="sp"><span class="tag pk">当前交易</span> <span class="tag">历史记录</span></span></div>
        <div class="tflow">
          ${[['创建交易', '买卖双方确认交易信息'],
            ['资金托管', '买家付款，资金由平台智能合约托管'],
            ['卖家发货', '卖家按约定时间发货'],
            ['验货确认', '买家在验货期内确认收货'],
            ['自动放款', '验货成功后，资金自动释放给卖家']]
        .map(([t, s], i) => `
            <div class="tf${i <= S.trade.step ? ' done' : ''}">
              <span class="tfi">${i + 1}</span>
              <div><b>${t}</b><span>${s}</span></div>
            </div>`).join('')}
        </div>
        <div class="tiny" style="margin-top:10px;text-align:center">创建交易后，将显示订单状态和预计时间</div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#f1ecff">🧱</span>交易保障机制</div>
      <div class="grid3">
        <div class="pnl" style="box-shadow:none;border:1px solid #f0f2f7;margin:0">
          <div style="font-size:20px">💰</div><b style="display:block;margin-top:6px">资金托管</b>
          <div class="muted" style="margin-top:4px">交易资金由智能合约托管，验货确认后释放给卖家</div>
        </div>
        <div class="pnl" style="box-shadow:none;border:1px solid #f0f2f7;margin:0">
          <div style="font-size:20px">⏱️</div><b style="display:block;margin-top:6px">验货期保障</b>
          <div class="muted" style="margin-top:4px">72 小时验货期，不满意可申请退款</div>
        </div>
        <div class="pnl" style="box-shadow:none;border:1px solid #f0f2f7;margin:0">
          <div style="font-size:20px">⭐</div><b style="display:block;margin-top:6px">信誉评级</b>
          <div class="muted" style="margin-top:4px">买卖双方互评，构建诚实交易环境</div>
        </div>
      </div>
    </div>`;

  /* —— 谷子信贷 —— */
  P.credit = () => `
    <div class="pg-head"><div class="row"><div>
      <h1>${TITLE.credit[0]}</h1><p>${TITLE.credit[1]}</p>
    </div><div class="sp"><span class="tag pk">年化低至 3.45% 起</span> <span class="tag bl">最高 5 万额度</span></div></div></div>

    <div class="win win-bn" style="margin-bottom:16px">
      <img src="${gArt('banner-credit')}" alt="">
      <div class="wt"><b>让热爱不被预算限制</b><span>谷卡分期 · 免息券 · 藏品质押授信，一站式解决「想买又差点钱」</span></div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#fff0f6">💳</span>谷子信贷 · 收藏爱好者的专属金融服务</div>
      <div class="muted" style="margin-bottom:14px">现在申请谷子信贷，享受更灵活、更贴心的金融服务。</div>
      <div class="grid4">
        ${[['分期咨询', '根据您的收藏价值，量身定制分期方案'],
          ['额度评估', '根据您的收藏需求和还款能力进行评估'],
          ['申请确认', '在线申请流程简单，审核快速'],
          ['信息保障', '全程加密，保护您的隐私和数据安全']]
        .map(([t, s], i) => `
          <div class="metric ${['bl', 'tl', 'am', 'pk'][i]}">
            <span style="font-size:17px">${['📊', '🎯', '✅', '🛡️'][i]}</span>
            <b style="font-size:14px;margin-top:6px">${t}</b>
            <em style="margin-top:5px;line-height:1.5">${s}</em>
          </div>`).join('')}
      </div>
      <div style="text-align:center;margin-top:16px">
        <button class="btn" data-pctoast="演示环境：授信申请为示意，不产生真实额度">立即了解 ›</button>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#eef4ff">🛒</span>为什么选择 e谷推 智能购物助手</div>
      <div class="grid3">
        ${[['🔍', '全网监控', '24 小时监控全网平台，覆盖官方商城、二手市场和社交平台，帮你发现心仪好物。', '#eef4ff'],
          ['🧠', '智能决策', '基于深度学习的 AI 算法，自动比价、判断稀缺性和真伪，为你提供理性购买建议。', '#e9f8f2'],
          ['🛡️', '交易保障', '智能合约托管交易资金，7×24 小时风险监控，双向信誉评级，确保交易安全无虞。', '#fff6e7'],
          ['💳', '谷子信贷', '专为谷子爱好者设计的消费信贷服务，灵活分期方案，让你从容购入心爱之物。', '#fff0f6'],
          ['🎁', '专属优惠', '与各大品牌合作，为谷子爱好者提供专属折扣码、限时优惠和独家预售资格。', '#f1ecff'],
          ['👥', '社群交流', '加入谷子爱好者专属社群，分享收藏心得，交流市场行情，结识同好伙伴。', '#eef4ff']]
        .map(([e, t, s, bg]) => `
        <div class="pnl" style="margin:0;box-shadow:none;border:1px solid #f0f2f7">
          <span class="ic" style="width:36px;height:36px;font-size:18px;background:${bg}">${e}</span>
          <b style="display:block;margin-top:9px;font-size:14px">${t}</b>
          <div class="muted" style="margin-top:5px">${s}</div>
        </div>`).join('')}
      </div>
    </div>`;

  /* —— 我的收藏 —— */
  P.fav = () => `
    <div class="pg-head"><h1>${TITLE.fav[0]}</h1><p>${TITLE.fav[1]}</p></div>
    <div class="chiprow" style="margin-bottom:14px">
      <span class="chip on">我关注的商品 8</span><span class="chip">监控中的需求 2</span>
      <span class="chip">收藏的档案 6</span><span class="chip">我的谷伴 3</span>
    </div>
    <div class="grid4">${GOODS.map(g => goodCard(g, ['已关注'])).join('')}</div>`;

  /* —— 个人虚拟藏馆 —— */
  P.cang = () => {
    const rooms = [['gallery', '藏品专属展'], ['friend', '同好交流会'], ['king', '王者收藏展'], ['private', '私人珍藏室']];
    const items = [
      ['goods-figure.jpg', '1/7 手办 · 语棠', '手办/模型', 'pk'],
      ['goods-stand.jpg', '亚克力立牌 · 星熠', '亚克力', 'bl'],
      ['goods-badge.jpg', '吧唧套组 · 橙汐', '徽章/吧唧', 'am'],
      ['goods-strap.jpg', '挂件 · 墨书', '毛绒/挂件', 'pp'],
      ['goods-box.jpg', '四季限定礼盒', '礼盒', 'tl'],
      ['goods-blind.jpg', '谷伴盲盒', '盲盒', 'bl']
    ];
    return `
    <div class="pg-head"><div class="row"><div>
      <h1>${TITLE.cang[0]}</h1><p>${TITLE.cang[1]}</p>
    </div><div class="sp"><span class="tag pk">收藏</span> <span class="tag">展示</span> <span class="tag">创作</span> <span class="tag">分享</span> <span class="tag">遇见同好</span></div></div></div>

    <div class="room">
      <img src="${gArt('banner-gallery')}" alt="">
      <div class="rt"><b>${rooms.find(r => r[0] === S.cangRoom)[1]}</b>
        <span>已建档 6 件 · 展厅浏览量 1,284 · 同好留言 42</span></div>
    </div>

    <div class="chiprow" style="margin:14px 0">
      ${rooms.map(([k, n]) => `<button class="chip${S.cangRoom === k ? ' on' : ''}" data-pcroom="${k}">${n}</button>`).join('')}
      <span class="sp" style="margin-left:auto"><button class="btn gray sm" data-pctoast="演示环境：布展编辑器为示意">🧱 进入布展编辑</button></span>
    </div>

    <div class="gal">
      ${items.map(([img, n, c, t]) => `
        <div class="gi">
          <div class="win win-sq"><img src="${A}${img}" alt=""></div>
          <div class="gb"><b>${n}</b><span class="tag ${t}">${c}</span></div>
        </div>`).join('')}
    </div>

    <div class="grid3" style="margin-top:16px">
      ${[['🎨', '主题定制', '多种展厅风格选择：现代美术馆、古典博物馆、科幻空间等', ['现代', '古典', '自然', '科幻']],
        ['💡', '灯光氛围', '自定义光效效果：色温、亮度、方向光、聚光灯、环境光', ['柔和', '明亮', '戏剧', '沉浸']],
        ['🧱', '展区规划', '自由布局展示空间：墙面挂展、展台陈列、悬浮展示等', ['墙面展示', '独立展台', '悬浮展示', '自由布局']]]
        .map(([e, t, s, tags]) => `
        <div class="pnl" style="margin:0">
          <span class="ic" style="width:32px;height:32px;font-size:16px;background:#f1ecff">${e}</span>
          <b style="display:block;margin-top:8px">${t}</b>
          <div class="muted" style="margin-top:5px">${s}</div>
          <div class="chiprow" style="margin-top:9px">${tags.map(x => `<span class="chip">${x}</span>`).join('')}</div>
        </div>`).join('')}
    </div>
    <div class="tiny" style="text-align:center;margin-top:14px">用创意，构建你的数字化藏世界</div>`;
  };

  /* —— 社区广场 —— */
  P.plaza = () => `
    <div class="pg-head"><h1>${TITLE.plaza[0]}</h1><p>${TITLE.plaza[1]}</p></div>
    <div class="win win-bn" style="margin-bottom:16px">
      <img src="${gArt('banner-community')}" alt="">
      <div class="wt"><b>今日广场 · 3 位同好正在晒谷</b><span>发帖、晒谷、出回血，都能攒谷粒</span></div>
    </div>
    <div class="grid-32">
      <div>
        ${[['星熠', 'xingyi', '《白昼流光》立牌到货了，实物比图好看！', '晒谷', 128, 36, 'goods-stand.jpg'],
        ['橙汐', 'chengxi', '比了 6 个渠道，官方旗舰今天最便宜，附比价截图。', '情报', 96, 21, 'goods-badge.jpg'],
        ['语棠', 'yutang', '手办补款期到了，记得查一下自己的订单～', '攻略', 74, 18, 'goods-figure.jpg']]
        .map(([n, id, txt, tg, like, cmt, gi]) => `
        <div class="pnl" style="margin-bottom:12px">
          <div class="lrow" style="border:none;padding:0 0 10px">
            <span class="av" style="width:38px;height:38px">${img(id)}</span>
            <div class="lm"><b>${n} <span class="tag pk">${tg}</span></b><span>刚刚 · 谷圈论坛</span></div>
          </div>
          <div style="font-size:13px">${txt}</div>
          <div class="win" style="margin-top:10px;border-radius:12px">
            <img src="${A}${gi}" alt="" style="height:190px">
          </div>
          <div class="chiprow" style="margin-top:10px">
            <span class="chip">👍 ${like}</span><span class="chip">💬 ${cmt}</span><span class="chip">收藏</span>
          </div>
        </div>`).join('')}
      </div>
      <div>
        <div class="pnl">
          <div class="pnl-t"><span class="ic" style="background:#fff0f6">🔥</span>热门话题</div>
          ${[['#亚克力立牌补货', '1.2 万人在看'], ['#限量吧唧出回血', '8,640 人在看'],
          ['#手办补款提醒', '5,120 人在看'], ['#同好交换避坑', '3,980 人在看']]
        .map(([t, s]) => `<div class="lrow"><div class="lm"><b>${t}</b><span>${s}</span></div></div>`).join('')}
        </div>
        <div class="pnl">
          <div class="pnl-t"><span class="ic" style="background:#e9f8f2">📣</span>官方公告</div>
          <div class="muted">「出谷通托管免手续费」活动进行中，笔笔 +20 谷粒。</div>
          <button class="btn tl sm" style="margin-top:10px" data-pcpage="trade">去用出谷通</button>
        </div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#fff6e7">🛍️</span>今日好物 · 广场同好都在看
        <span class="sp" data-pcpage="goods">去逛逛 ›</span></div>
      <div class="grid4">${GOODS.slice(0, 4).map(g => goodCard(g, [g.t, '广场热卖'])).join('')}</div>
    </div>`;

  /* —— 好友共创 —— */
  P.coop = () => `
    <div class="pg-head"><h1>${TITLE.coop[0]}</h1><p>${TITLE.coop[1]}</p></div>
    <div class="win win-bn" style="margin-bottom:16px">
      <img src="${gArt('banner-community')}" alt="">
      <div class="wt"><b>和同好一起，把喜欢的东西摆在一起</b><span>实时语音 · 协同布展 · 云逛展，收藏不再是孤单的事</span></div>
    </div>
    <div class="grid3">
      ${[['🎙️', '实时语音', '远程交流无障碍，如同面对面逛展'],
        ['🧩', '协同布展', '一起设计亮丽展厅，共同策划主题展览'],
        ['☁️', '云逛展', '随时随地访问好友展馆，不受时空限制']]
        .map(([e, t, s]) => `
        <div class="pnl" style="margin:0;text-align:center">
          <span class="ic" style="width:44px;height:44px;font-size:22px;background:#eef4ff;margin:0 auto">${e}</span>
          <b style="display:block;margin-top:10px">${t}</b>
          <div class="muted" style="margin-top:5px">${s}</div>
        </div>`).join('')}
    </div>
    <div class="pnl" style="margin-top:16px">
      <div class="pnl-t"><span class="ic" style="background:#fff0f6">🤝</span>圈层归属感强化</div>
      <div class="muted" style="margin-bottom:12px">通过共享收藏、交流心得，建立深厚的同好关系，让每个收藏爱好者找到属于自己的圈子。</div>
      <div class="chiprow">
        <span class="tag bl">打造同好圈</span><span class="tag tl">找到兴趣圈层</span>
        <span class="tag am">商业圈层</span><span class="tag pp">线下活动</span><span class="tag pk">线上互动</span>
      </div>
      <div style="text-align:center;margin-top:16px">
        <button class="btn bl" data-pctoast="已创建共享展厅链接，可发给同好（演示）">👥 加入社群</button>
      </div>
    </div>`;

  /* —— AR 体验 —— */
  P.ar = () => `
    <div class="pg-head"><h1>${TITLE.ar[0]}</h1><p>${TITLE.ar[1]}</p></div>
    <div class="grid-32">
      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#eef4ff">📷</span>AR 炫出圈，社交新玩法</div>
        <div class="grid3" style="gap:10px">
          ${[['🧍', '咖馆展示', '在桌面上展示立牌'], ['🧑‍🚀', '虚拟徽章', '许愿我收藏在线上'],
            ['🎬', '短视频分享', '创作 AR 内容创作']]
        .map(([e, t, s]) => `
          <div class="metric bl"><span style="font-size:18px">${e}</span>
            <b style="font-size:13px;margin-top:6px">${t}</b><em style="margin-top:4px">${s}</em></div>`).join('')}
        </div>
        <div style="text-align:center;margin-top:14px">
          <button class="btn" data-pctoast="演示环境：AR 相机为示意">🌐 AR 拍照</button>
          <button class="btn gray" style="margin-left:8px" data-pctoast="演示环境：社交分享为示意">📤 社交分享</button>
        </div>
      </div>
      <div>
        ${[['AR 实景融合', '将数字藏品投到现实场景中，拍照留存美好瞬间'],
          ['创意内容制作', '提供丰富的 AR 滤镜和特效，轻松创作短视频'],
          ['无损展示', '不用担心实体藏品损坏或遗失，随时随地点开展示'],
          ['社交传播', '一键分享到各大社交平台，参与热门话题挑战']]
        .map(([t, s]) => `
          <div class="lrow"><span class="li" style="background:#eef4ff">✨</span>
            <div class="lm"><b>${t}</b><span>${s}</span></div></div>`).join('')}
      </div>
    </div>
    <div class="win win-bn" style="margin-top:16px">
      <img src="${gArt('banner-ar')}" alt="">
      <div class="wt"><b>打破次元壁</b><span>把收藏带到现实，把现实分享给同好</span></div>
    </div>`;

  /* —— 消息中心 —— */
  P.msg = () => `
    <div class="pg-head"><h1>${TITLE.msg[0]}</h1><p>${TITLE.msg[1]}</p></div>
    <div class="chiprow" style="margin-bottom:14px">
      <span class="chip on">全部 6</span><span class="chip">行情提醒 1</span><span class="chip">交易动态 1</span>
      <span class="chip">任务提醒 1</span><span class="chip">账户服务 2</span>
    </div>
    <div class="pnl" style="display:flex;gap:12px;align-items:center;background:linear-gradient(100deg,#fff4f8,#f3f7ff)">
      <span class="av" style="width:44px;height:44px">${img('xiaozhi')}</span>
      <div style="flex:1">
        <b style="font-size:13.5px">工小智 · 帮你把消息读薄了</b>
        <div class="muted" style="margin-top:3px">今天有 <b>1 条行情波动</b> 和 <b>1 条到货提醒</b> 值得你现在看，其余 4 条已归档，稍后自动清理。</div>
      </div>
      <button class="btn gray sm" data-pctoast="演示环境：智能摘要为示意">一键已读</button>
    </div>
    <div class="pnl">
      ${[['📈', '行情提醒', '「初音未来 应援色吧唧」行情上涨 12%，当前处于活跃区', '09:46', true],
        ['🌾', '任务提醒', '今日还有 2 个任务未完成，完成可得 100 谷粒', '09:12', true],
        ['🛡️', '交易动态', '订单 EC-9F31 买家已确认验货，资金已释放到你的账户', '08:40', true],
        ['💳', '卡服务', '您的「谷卡」IP 联名卡面投票已开启', '昨天', false],
        ['📦', '到货提醒', '「语棠」樱色絮语手办已发货，预计 3 日内送达', '昨天', false],
        ['🏦', '系统通知', 'e次元·质押贷 授信额度已更新，可贷额度 ¥4,225', '09-25', false]]
        .map(([e, t, s, tm, dot]) => `
        <div class="lrow"><span class="li" style="background:#f4f6fa">${e}</span>
          <div class="lm"><b>${t} ${dot ? '<span class="tag pk">新</span>' : ''}</b><span>${s}</span></div>
          <span class="tiny">${tm}</span></div>`).join('')}
    </div>
    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#fff0f6">📌</span>你可能还想看</div>
      <div class="grid3">
        ${GOODS.slice(0, 3).map(g => goodCard(g, ['为你推荐'])).join('')}
      </div>
    </div>`;

  /* —— 个人中心 —— */
  P.me = () => `
    <div class="pg-head"><h1>${TITLE.me[0]}</h1><p>${TITLE.me[1]}</p></div>
    <div class="pnl" style="display:flex;align-items:center;gap:18px">
      <span class="av" style="width:76px;height:76px">${img('xiaoe')}</span>
      <div style="flex:1">
        <div style="font-size:19px;font-weight:800">李** <span class="tag pk">谷神 Lv.4</span></div>
        <div class="muted" style="margin-top:6px">UID 417817457 · IP 上海 · 已实名认证</div>
        <div class="chiprow" style="margin-top:9px">
          <span class="chip">吃谷十年</span><span class="chip">把「谷」变成热爱</span><span class="chip">理性消费</span>
        </div>
      </div>
      <div class="grid4" style="flex:1.1;gap:10px">
        <div class="metric pk"><em>谷粒</em><b>12,480</b></div>
        <div class="metric bl"><em>成长值</em><b>3,240</b></div>
        <div class="metric tl"><em>信用分</em><b>842</b></div>
        <div class="metric am"><em>勋章</em><b>10</b></div>
      </div>
    </div>

    <div class="pnl">
      <div class="pnl-t"><span class="ic" style="background:#fff0f6">🐾</span>我的谷伴
        <span class="sp">点击切换</span></div>
      <div class="grid4">
        ${CHARS.slice(0, 4).map(c => `
          <button class="pref-card${S.pref.includes(c.id) ? ' on' : ''}" data-pcpref="${c.id}">
            <span class="av" style="width:48px;height:48px;margin:0 auto 8px">${img(c.id)}</span>
            <b>${c.n}</b><span>${c.r}</span>
            <div class="chiprow" style="justify-content:center;margin-top:6px">
              ${c.f.map(f => `<span class="chip" style="font-size:10px;padding:2px 7px">${f}</span>`).join('')}</div>
          </button>`).join('')}
      </div>
    </div>

    <div class="grid2">
      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#e9f8f2">🌾</span>成长体系</div>
        <div class="muted">当前 <b>谷神 Lv.4</b>，成长值 3,240 / 5,000，距离 Lv.5 还差 1,760。</div>
        <div style="height:9px;border-radius:6px;background:#f0f2f7;overflow:hidden;margin-top:12px">
          <i style="display:block;height:100%;width:65%;border-radius:6px;background:linear-gradient(90deg,#ffa6c4,#a78bfa)"></i>
        </div>
        <div class="grid3" style="margin-top:14px;gap:10px">
          <div class="metric bl"><em>签到天数</em><b>86</b></div>
          <div class="metric tl"><em>已解锁勋章</em><b>10</b></div>
          <div class="metric am"><em>累计回血</em><b>¥8,320</b></div>
        </div>
      </div>
      <div class="pnl">
        <div class="pnl-t"><span class="ic" style="background:#eef4ff">⚙️</span>账户设置</div>
        ${[['实名与安全', '已实名 · 手机 ****8888'],
          ['交易托管设置', '默认使用出谷通托管 · 验货期 72 小时'],
          ['理性消费提醒', '单笔超 ¥5,000 需二次确认（已开启）'],
          ['演示环境说明', '本应用为比赛演示作品，不产生真实资金变动']]
        .map(([t, s]) => `<div class="lrow"><div class="lm"><b>${t}</b><span>${s}</span></div>
            <span class="tiny">›</span></div>`).join('')}
      </div>
    </div>`;

  /* ══════════ 片段 ══════════ */
  function img(id) { return `<img src="${A}char-${id}.jpg" alt="" loading="lazy">`; }
  function goodCard(g, tags) {
    return `
    <button class="g-card" data-pcgood="${esc(g.n)}">
      <div class="win win-sq"><img src="${A}${g.img}" alt="${esc(g.n)}" loading="lazy"></div>
      <div class="gb">
        <b>${esc(g.n)}</b>
        <div class="chiprow" style="margin-top:6px">${tags.map(t => `<span class="tag bl" style="font-size:10px;padding:2px 7px">${t}</span>`).join('')}</div>
        <div class="gp"><em>¥${money(g.p)}</em>
          <i><span class="tag ${g.t === '限量' || g.t === '上新' ? 'pk' : 'tl'}">${g.t}</span></i></div>
      </div>
    </button>`;
  }

  /* ══════════ 渲染与路由 ══════════ */
  function buildMenu() {
    $('#ecMenu').innerHTML = MENU.map(m => m.g
      ? `<div class="grp">${m.g}</div>`
      : `<button class="ec-mi" data-pcpage="${m.id}">${I.ico(m.ic)}<span>${m.n}</span>${m.badge ? `<i class="dot">${m.badge}</i>` : ''}</button>`
    ).join('');
  }

  function go(p) {
    if (!P[p]) p = 'home';
    S.page = p;
    $$('#ecMenu .ec-mi').forEach(b => b.classList.toggle('on', b.dataset.pcpage === p));
    $('#ecPages').innerHTML = (P[p] || P.home)();
    $('#ecPages').scrollTop = 0;
    if (p === 'value') setTimeout(drawChart, 40);
  }

  function drawChart() {
    const cv = $('#valChart');
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const vals = TREND.slice(-14);
    const mx = Math.max(...vals), mn = Math.min(...vals);
    const PL = 44, PR = 16, PT = 16, PB = 26;          /* 左/右/上/下留白 */
    const X = i => PL + i / (vals.length - 1) * (w - PL - PR);
    const Y = v => PT + (mx - v) / (mx - mn || 1) * (h - PT - PB);
    /* 网格 + 纵轴刻度 */
    c.strokeStyle = '#eef1f6'; c.lineWidth = 1;
    c.font = '10px system-ui,sans-serif'; c.fillStyle = '#aab2bf';
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = PT + i / 4 * (h - PT - PB);
      c.beginPath(); c.moveTo(PL, y); c.lineTo(w - PR, y); c.stroke();
      c.fillText('¥' + Math.round(mx - i / 4 * (mx - mn)), PL - 7, y);
    }
    /* 面积 */
    c.beginPath();
    vals.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)));
    c.lineTo(X(vals.length - 1), h - PB); c.lineTo(X(0), h - PB); c.closePath();
    const g = c.createLinearGradient(0, PT, 0, h - PB);
    g.addColorStop(0, 'rgba(255,92,147,.22)'); g.addColorStop(1, 'rgba(255,92,147,0)');
    c.fillStyle = g; c.fill();
    /* 线 */
    c.beginPath();
    vals.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)));
    c.strokeStyle = '#ff5c93'; c.lineWidth = 2.4; c.lineJoin = 'round'; c.stroke();
    /* 点 */
    vals.forEach((v, i) => {
      c.beginPath(); c.arc(X(i), Y(v), 3.2, 0, 7);
      c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#ff5c93'; c.lineWidth = 2; c.stroke();
    });
    /* 横轴日期 */
    const DAYS = ['09-27', '10-03', '10-08', '10-13', '10-18', '10-23', '10-29'];
    c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = '#aab2bf';
    DAYS.forEach((d, i) => {
      const idx = Math.round(i / (DAYS.length - 1) * (vals.length - 1));
      c.fillText(d, X(idx), h - PB + 8);
    });
    /* 标注最高点 */
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const hi = vals.indexOf(mx), lbl = '¥' + mx;
    c.fillStyle = '#e0407a'; c.font = '700 11px system-ui,sans-serif';
    const tw = c.measureText(lbl).width;
    let lx = X(hi) + 8;
    if (lx + tw > w - PR) lx = X(hi) - tw - 8;
    if (lx < PL) lx = PL;
    c.fillText(lbl, lx, Math.max(Y(mx) - 9, PT + 9));
  }

  /* ══════════ 转场 ══════════ */
  let petalTimer = null, outTimer = null;
  function petals(n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const w = (9 + Math.random() * 12).toFixed(1);
      s += `<span class="pce-petal" style="left:${(Math.random() * 98).toFixed(1)}%;width:${w}px;height:${w}px;` +
        `--dx:${(Math.random() * 180 - 90).toFixed(0)}px;animation-duration:${(5.5 + Math.random() * 4).toFixed(1)}s;` +
        `animation-delay:-${(Math.random() * 6).toFixed(1)}s"></span>`;
    }
    return s;
  }
  function enterEC() {
    const o = $('#pce');
    $('#pceCover').style.backgroundImage = `url(${gArt('cover-enter')})`;
    $('#pceK').textContent = 'ICBC × e次元';
    $('#pceT').innerHTML = 'e<em>次元</em>';
    $('#pceS').textContent = '推开门，就是另一个世界';
    $('#pcePetals').innerHTML = petals(22);
    o.classList.remove('out'); void o.offsetWidth; o.classList.add('on');
    clearTimeout(petalTimer); clearTimeout(outTimer);
    petalTimer = setTimeout(() => {
      $('#bank').style.visibility = 'hidden';
      $('#ecapp').classList.add('on');
      go('home');
    }, 640);
    outTimer = setTimeout(() => {
      o.classList.add('out');
      setTimeout(() => { o.classList.remove('on', 'out'); $('#pcePetals').innerHTML = ''; }, 520);
    }, 1950);
  }
  function exitEC() {
    const o = $('#pce');
    $('#pceK').textContent = '返回个人网上银行';
    $('#pceT').innerHTML = '再会';
    $('#pceS').textContent = 'e次元 随时为你开着';
    $('#pcePetals').innerHTML = petals(16);
    $('#ecapp').classList.remove('on');
    $('#bank').style.visibility = '';
    o.classList.remove('out'); void o.offsetWidth; o.classList.add('on');
    setTimeout(() => {
      o.classList.add('out');
      setTimeout(() => { o.classList.remove('on', 'out'); $('#pcePetals').innerHTML = ''; }, 500);
    }, 1100);
  }

  /* ══════════ 交互 ══════════ */
  const toastEl = $('#pcToast');
  let tT = null;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(tT); tT = setTimeout(() => toastEl.classList.remove('on'), 2300);
  }
  function modal(html) { $('#pcModal').innerHTML = html + '<div style="text-align:right;margin-top:16px"><button class="btn gray sm" data-pcmaskclose>关闭</button></div>'; $('#pcMask').classList.add('on'); }
  function closeModal() { $('#pcMask').classList.remove('on'); }

  document.addEventListener('click', e => {
    /* 入口 */
    const d = e.target.closest('[data-ecd]');
    if (d) { e.preventDefault(); enterEC(); return; }

    if (e.target.closest('[data-pcmaskclose]') || e.target.id === 'pcMask') { closeModal(); return; }

    const pg = e.target.closest('[data-pcpage]');
    if (pg) { go(pg.dataset.pcpage); return; }

    const tt = e.target.closest('[data-pctoast]');
    if (tt) { toast(tt.dataset.pctoast); return; }

    const pr = e.target.closest('[data-pcpref]');
    if (pr) {
      const id = pr.dataset.pcpref;
      const i = S.pref.indexOf(id);
      if (i >= 0) S.pref.splice(i, 1); else S.pref.push(id);
      go(S.page); toast(`偏好已更新 · 当前 ${S.pref.length} 位谷伴`);
      return;
    }

    const cat = e.target.closest('[data-pccat]');
    if (cat) { S.goodsCat = cat.dataset.pccat; go('goods'); return; }

    const room = e.target.closest('[data-pcroom]');
    if (room) { S.cangRoom = room.dataset.pcroom; go('cang'); toast('展厅已切换（演示）'); return; }

    const vq = e.target.closest('[data-pcval]');
    if (vq) { S.valQuery = vq.dataset.pcval; go('value'); return; }

    const gd = e.target.closest('[data-pcgood]');
    if (gd) {
      const g = GOODS.find(x => x.n === gd.dataset.pcgood);
      if (g) modal(`<h3>${esc(g.n)}</h3><div class="sub">e次元甄选 · 工行自有 IP 直供 · 演示商品</div>
        <div class="win win-sq" style="border-radius:14px"><img src="${A}${g.img}" alt=""></div>
        <div style="margin-top:12px;display:flex;gap:10px;align-items:center">
          <b style="font-size:22px;color:var(--pk-d)">¥${money(g.p)}</b>
          <span class="tag ${g.t === '限量' || g.t === '上新' ? 'pk' : 'tl'}">${g.t}</span>
          <span class="tag bl">正版可查</span>
          <span class="tag pp">支持谷粒兑换</span>
        </div>
        <div class="muted" style="margin-top:12px;line-height:1.9">
          支持三种成交方式：<b>谷粒兑换</b>（权益星球）／<b>免息分期</b>（谷卡 6/12/24 期）／
          <b>出谷通托管</b>（资金托管，验货后放款）。演示环境不产生真实交易。</div>`);
      return;
    }

    /* 鉴真 */
    if (e.target.closest('[data-pcshiguup]')) {
      S.shigu.done = true; go('shigu'); toast('识别完成：正版概率 98.5%，已生成报告');
      return;
    }
    if (e.target.closest('[data-pcshigureset]')) { S.shigu.done = false; go('shigu'); return; }

    /* 交易 */
    if (e.target.closest('[data-pctrade]')) {
      S.trade.step = (S.trade.step + 1) % 6; go('trade');
      toast(S.trade.step === 0 ? '已重置交易流程' : `已推进到第 ${S.trade.step} 步`);
      return;
    }
  });

  /* 搜索 / 估值 / 退出 */
  document.addEventListener('click', e => {
    if (e.target.id === 'ecGo') {
      const q = ($('#ecQuery') || {}).value || '';
      toast(q ? `e谷推 已收到需求，正在解析：${q.slice(0, 24)}…` : '先告诉 e谷推 你想要什么吧');
      return;
    }
    if (e.target.id === 'valGo') {
      const q = ($('#valQ') || {}).value || '亚克力立牌';
      S.valQuery = q; go('value'); toast(`已按「${q}」更新估值（演示）`);
      return;
    }
    if (e.target.id === 'ecExit') { exitEC(); return; }
  });

  /* ══════════ 启动 ══════════ */
  buildMenu();
  go('home');
  $$('.bk-nav button').forEach(b => b.addEventListener('click', () => {
    $$('.bk-nav button').forEach(x => x.classList.toggle('on', x === b));
  }));
  /* 银行首页「推门」横幅：跟随手机端选的性别（同一 origin 的 localStorage） */
  const bkDoor = $('#bkDoorImg');
  if (bkDoor) bkDoor.src = gArt('banner-door');
  /* 手机端改了性别后，PC 端切回来自动同步 */
  window.addEventListener('storage', e => {
    if (e.key === 'ec_char_gender') {
      if (bkDoor) bkDoor.src = gArt('banner-door');
      go(S.page || 'home');
    }
  });
  window.PCAPP = { go, toast, modal, S };
})();
