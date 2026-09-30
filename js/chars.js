/* ════════════════════════════════════════════════════════════════════
   e次元 · 谷伴角色系统（原创二次元形象 · 图片填充式头像 · 双性别）
   ─────────────────────────────────────────────────────────────────────
   设计要点：**先挖窗口，再填图**。
   所有角色位在版式上是固定的「窗口」（圆形 / 圆角矩形 / 立绘框），
   由 CSS 决定尺寸与裁切；本文件只负责把对应角色的图片填进窗口里，
   效果等同于「给用户设置头像」，因此不同窗口大小都能得到正确的
   构图（人脸居中偏上），不需要为每个尺寸单独出图。

   ★ 双性别制（进入 e次元 时可选，之后随时可换）
     用户性别 = 男(boy)  → 美少女立绘  img/art/char-<id>.jpg   （初见版本）
     用户性别 = 女(girl) → 美少年立绘  img/art/char2-<id>.jpg  （本版新增）
   同一套角色 ID，两套图源；切换后全站角色窗口、头像、立绘整体换装。

   使用：
     CHARS.gender()             → 'boy' | 'girl'
     CHARS.setGender('girl')    → 切换性别，自动重绘全站角色窗口
     CHARS.svg('xingyi')        → 立绘窗口内容（填满父容器）
     CHARS.head('xingyi')       → 头像窗口内容（填满父容器的圆形/方形槽）
     CHARS.ava('xingyi', 44)    → 自带圆形窗口的头像（可指定像素）
     CHARS.artFile('banner-door')→ 场景插画按性别取文件名（→banner2-door.jpg）
     CHARS.artImg('banner-door','bs','谷圈') → 场景插画 <img>（自动带 data-gart）
     CHARS.get('xingyi').name   → 角色名
     CHARS.list()               → 全部角色 id
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 角色设定：全部为工行 e次元 原创形象，命名不含任何第三方 IP ── */
  const C = {
    /* 工小智：AI 助手形象，不属于「谷伴」，不出现在换伴面板里 */
    xiaozhi: { name: '工小智', role: 'AI 助手', hidden: true, tone: '#6cbcf2', tone2: '#d6ecff',
               say: '识别与估值交给我，结果仅供参考～' },
    xiaoe:   { name: '小e',   role: '首席谷伴', tone: '#ff7fa8', tone2: '#ffd6e4',
               say: '欢迎来到 e次元，一起把热爱管明白吧！' },
    xingyi:  { name: '星熠',   role: '识谷官',   tone: '#8a7cf0', tone2: '#ded8ff',
               say: '估值鉴定这种事，交给星熠就好。' },
    chengxi: { name: '橙汐',   role: '比价官',   tone: '#ffa03d', tone2: '#ffe3c2',
               say: '全网渠道我都盯着，降价第一时间喊你。' },
    yunjian: { name: '云间',   role: '托管官',   tone: '#6ab7f5', tone2: '#d3ecff',
               say: '货款进托管，验货再放款，稳。' },
    yutang:  { name: '语棠',   role: '攒谷官',   tone: '#ff9ec4', tone2: '#ffe0ee',
               say: '今天签到领谷粒了吗？别忘了哦。' },
    yufeng:  { name: '御风',   role: '谷卡官',   tone: '#e8546b', tone2: '#ffd9de',
               say: '卡面随你挑，反正都不差。' },
    moshu:   { name: '墨书',   role: '藏馆官',   tone: '#9a7ae0', tone2: '#e6dcff',
               say: '每一件藏品，都值得有一份档案。' },
    qinghe:  { name: '清和',   role: '授信官',   tone: '#4fc0a6', tone2: '#cdf3ea',
               say: '藏品估值多少，额度就给到多少。' }
  };

  const KEY = 'ec_char_style';    // 当前用户形象（谷伴 id）
  const GKEY = 'ec_char_gender';  // 用户性别 boy | girl
  let current = 'xiaoe';
  let gender = 'boy';
  try { gender = localStorage.getItem(GKEY) || 'boy'; } catch (e) {}

  /* 图片路径（唯一真源，改名只改这里；两套图源按性别二选一） */
  const artOf = (id, g) => ((g || gender) === 'girl')
    ? `img/art/char2-${id}.jpg`
    : `img/art/char-${id}.jpg`;

  /* ── 需要随性别切换的「场景插画」（横幅 / 转场封面） ──
     key = 男生版文件名（不含扩展名），value = 女生版文件名
     其余插画（周边商品图、抽象底图）与性别无关，不在此表内 */
  const GART = {
    'banner-door': 'banner2-door.jpg',
    'banner-community': 'banner2-community.jpg',
    'banner-ai': 'banner2-ai.jpg',
    'banner-credit': 'banner2-credit.jpg',
    'banner-trade': 'banner2-trade.jpg',
    'banner-ar': 'banner2-ar.jpg',
    'banner-guxiang': 'banner2-guxiang.jpg',
    'cover-enter': 'cover2-enter.jpg',
    /* 周边商品图（立牌/手办/吧唧/挂件/礼盒/盲盒）也换美少年版 */
    'goods-stand': 'goods2-stand.jpg',
    'goods-figure': 'goods2-figure.jpg',
    'goods-badge': 'goods2-badge.jpg',
    'goods-strap': 'goods2-strap.jpg',
    'goods-box': 'goods2-box.jpg',
    'goods-blind': 'goods2-blind.jpg'
  };
  /* 场景插画路径：传入不带扩展名的基名 */
  const artFile = (base, g) => ((g || gender) === 'girl' && GART[base]) ? GART[base] : base + '.jpg';
  /* 场景插画标签：自带 data-gart，性别切换时由 repaint() 就地换图，无需重渲染 */
  const artImg = (base, cls, alt) =>
    `<img${cls ? ` class="${cls}"` : ''} data-gart="${base}" src="img/art/${artFile(base)}" alt="${alt || ''}" loading="lazy" draggable="false">`;

  const API = {
    get: id => C[id] || C.xiaoe,
    /* 谷伴名单（不含隐藏的 AI 助手形象） */
    list: () => Object.keys(C).filter(k => !C[k].hidden),
    all: () => Object.keys(C),
    has: id => !!C[id],
    art: (id, g) => artOf(id in C ? id : 'xiaoe', g),

    /* ── 性别 ── */
    gender: () => gender,
    isGirl: () => gender === 'girl',
    isBoy: () => gender !== 'girl',
    /* 场景插画（横幅 / 转场封面）：按性别取文件名与 <img> 标签 */
    artFile: (base, g) => artFile(base, g),
    artImg: (base, cls, alt) => artImg(base, cls, alt),
    setGender(g) {
      const next = (g === 'girl') ? 'girl' : 'boy';
      if (next === gender) { this.repaint(); return gender; }
      gender = next;
      try { localStorage.setItem(GKEY, gender); } catch (e) {}
      this.repaint();
      document.dispatchEvent(new CustomEvent('chars:gender', { detail: { gender: gender } }));
      return gender;
    },
    /* 全站换装：角色窗口改 src、场景插画改 src，都不重建 DOM，滚动位置与状态不丢 */
    repaint() {
      document.querySelectorAll('img[data-cid]').forEach(img => {
        const k = img.dataset.cid;
        if (k in C) img.src = artOf(k);
      });
      document.querySelectorAll('img[data-gart]').forEach(img => {
        img.src = 'img/art/' + artFile(img.dataset.gart);
      });
    },

    /* 立绘窗口：填满父容器（父容器决定尺寸与裁切形状） */
    svg(id) {
      const k = id in C ? id : 'xiaoe';
      return `<img class="ec-char" data-cid="${k}" src="${artOf(k)}" alt="${C[k].name}" loading="lazy" draggable="false">`;
    },

    /* 头像窗口：同样填满父容器，但构图对准面部 */
    head(id) {
      const k = id in C ? id : 'xiaoe';
      return `<img class="ec-head" data-cid="${k}" src="${artOf(k)}" alt="${C[k].name}" loading="lazy" draggable="false">`;
    },

    /* 自带圆形窗口的头像：可直接指定直径 */
    ava(id, size) {
      const k = id in C ? id : 'xiaoe';
      const st = size ? ` style="width:${size}px;height:${size}px"` : '';
      return `<span class="ec-ava" data-c="${k}"${st}>${this.head(k)}</span>`;
    },

    /* 稳定哈希：把任意字符串（昵称/分区名）映射到一个角色，保证每次一致 */
    pick(seed) {
      const ids = Object.keys(C).filter(k => !C[k].hidden);
      let n = 0; const s = String(seed || '');
      for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
      return ids[n % ids.length];
    },

    /* 当前用户形象（可在广场公告条切换，持久化） */
    current() { try { return localStorage.getItem(KEY) || current; } catch (e) { return current; } },
    setCurrent(id) {
      if (!C[id]) return;
      current = id;
      try { localStorage.setItem(KEY, id); } catch (e) {}
      /* 同步页面上所有「当前用户形象」窗口 */
      document.querySelectorAll('[data-me="1"]').forEach(el => { el.innerHTML = this.head(id); });
    }
  };

  window.CHARS = API;
})();
