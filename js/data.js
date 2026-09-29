/* ═══════════════════════════════════════════════════════════
   模拟数据层（全局变量 DATA，e次元程序可直接读取/修改）
   图标字段 icon 均为键名，对应 app.js 中 ICONS 的 SVG 图形
   ═══════════════════════════════════════════════════════════ */

const DATA = {
  user: {
    name: '李**',
    avatarChar: '李',
    level: '财富级',
    city: '上海',
    idou: 8640, // 工银i豆
    star: 5
  },

  account: {
    cardType: '储蓄卡（薪金卡）',
    no: '6222 0202 **** 8888',
    balance: 258463.52,
    available: 253963.52
  },

  /* 首页头部快捷入口 */
  quickActions: [
    { icon: 'scan',   name: '扫一扫', act: 'open:page-scan' },
    { icon: 'receive', name: '收款',  act: 'toast:收款码已生成（演示）' },
    { icon: 'pay',    name: '付款',   act: 'toast:请向商户出示付款码（演示）' },
    { icon: 'train',  name: '出行',   act: 'toast:乘车码（演示）' },
    { icon: 'robot',  name: '工小智', act: 'open:page-xiaozhi' }
  ],

  /* 首页常用功能宫格：page=打开浮层 / toast=提示 / tab=切Tab / xg=e次元 */
  functions: [
    { icon: 'transfer', bg: '#fdecec', name: '转账汇款', act: 'open:page-transfer' },
    { icon: 'bank',     bg: '#eaf3fd', name: '定期存款', act: 'tab:view-wealth' },
    { icon: 'list',     bg: '#eef9ef', name: '余额明细', act: 'open:page-records' },
    { icon: 'bolt',     bg: '#fff6e6', name: '工银e支付', act: 'toast:工银e支付（演示）' },
    { icon: 'credit',   bg: '#f0ecfd', name: '信用卡还款', act: 'tab:view-credit' },
    { icon: 'house',    bg: '#eef4ff', name: '个人贷款', act: 'toast:个人贷款（演示）' },
    { icon: 'chart',    bg: '#fdeff7', name: '投资理财', act: 'tab:view-wealth' },
    { icon: 'fx',       bg: '#e9f7f5', name: '结售汇', act: 'toast:结售汇（演示）' }
  ],

  /* 更多功能（全部功能页） */
  moreFunctions: [
    { icon: 'scan',     bg: '#fdecec', name: '扫码收款', act: 'open:page-scan' },
    { icon: 'transfer', bg: '#fdecec', name: '转账汇款', act: 'open:page-transfer' },
    { icon: 'list',     bg: '#eef9ef', name: '收支明细', act: 'open:page-records' },
    { icon: 'bank',     bg: '#eaf3fd', name: '存款产品', act: 'tab:view-wealth' },
    { icon: 'chart',    bg: '#fdeff7', name: '理财产品', act: 'tab:view-wealth' },
    { icon: 'gold',     bg: '#fff6e6', name: '基金黄金', act: 'tab:view-wealth' },
    { icon: 'credit',   bg: '#f0ecfd', name: '信用卡', act: 'tab:view-credit' },
    { icon: 'house',    bg: '#eef4ff', name: '个人贷款', act: 'toast:个人贷款（演示）' },
    { icon: 'fx',       bg: '#e9f7f5', name: '结售汇', act: 'toast:结售汇（演示）' },
    { icon: 'payroll',  bg: '#eaf3fd', name: '电子工资单', act: 'toast:电子工资单（演示）' },
    { icon: 'health',   bg: '#eef9ef', name: '社保医保', act: 'toast:社保医保（演示）' },
    { icon: 'edu',      bg: '#fff6e6', name: '教育缴费', act: 'toast:教育缴费（演示）' },
    { icon: 'magic',    bg: '#f0ecfd', name: '魔法空间', act: 'open:page-magic' },
    { icon: 'robot',    bg: '#fdeff7', name: '工小智', act: 'open:page-xiaozhi' },
    { icon: 'shield',   bg: '#e9f7f5', name: '安全中心', act: 'toast:安全中心（演示）' },
    { icon: 'headset',  bg: '#eaf3fd', name: '联系客服', act: 'toast:演示环境：客服暂未开通' }
  ],

  /* 首页轮播（背景用渐变色） */
  banners: [
    { t: '领航AI+ · 智享未来', d: '工小智全新升级，500+ 场景智能随行', bg: 'linear-gradient(135deg,#241547,#5b2d92)' },
    { t: '工银i豆 · 天天领好礼', d: '签到、消费、攒谷都能赚i豆', bg: 'linear-gradient(135deg,#b8862f,#e8b86a)' },
    { t: 'e次元 · 推开门就是另一个世界', d: '谷圈广场 · 甄选商城 · 同好论坛 · 私人藏馆',
      bg: 'linear-gradient(135deg,#7a1f3d,#c73a5e)', ec: 'plaza', img: 'img/art/banner-door.jpg',
      go: '进入 e次元 ›' }
  ],

  /* 首页理财推荐 & 投资页产品 */
  homeProducts: [
    { name: '随心盈90天', code: '理财产品', rate: '2.86', tag: '新客专享' },
    { name: '安享180天', code: '理财产品', rate: '3.02', tag: '稳健R2' },
    { name: '日升息', code: '现金管理', rate: '2.15', tag: '随存随取' },
    { name: '金苹果1年', code: '理财产品', rate: '3.36', tag: '封闭持有' }
  ],

  ticker: [
    { name: '黄金克价', v: '766.24', chg: '+0.82%', dir: 'up' },
    { name: '美元/人民币', v: '7.1236', chg: '-0.04%', dir: 'down' },
    { name: '沪深300', v: '4218.6', chg: '+0.36%', dir: 'up' }
  ],

  products: {
    bank: [
      { name: '三年定期存款', tags: ['保本保息'], rate: '2.35', unit: '%', note: '50元起存', btn: '存入' },
      { name: '大额存单20万', tags: ['20万起存', '可转让'], rate: '2.65', unit: '%', note: '三年期', btn: '存入' },
      { name: '特色存款·稳盈', tags: ['灵活支取'], rate: '1.95', unit: '%', note: '1元起存', btn: '存入' }
    ],
    fin: [
      { name: '随心盈90天', tags: ['R2中低', '热销'], rate: '2.86', unit: '%', note: '业绩比较基准', btn: '购买' },
      { name: '安享180天', tags: ['R2中低'], rate: '3.02', unit: '%', note: '业绩比较基准', btn: '购买' },
      { name: '金苹果1年', tags: ['R3中', '新发'], rate: '3.36', unit: '%', note: '业绩比较基准', btn: '购买' },
      { name: '日升息·现金宝', tags: ['R1低', '随时申赎'], rate: '2.15', unit: '%', note: '七日年化', btn: '购买' }
    ],
    fund: [
      { name: '工银科技创新混合C', tags: ['指数基金', '中风险'], rate: '+12.6', unit: '%', note: '近一年', btn: '买入' },
      { name: '工银黄金ETF联接', tags: ['商品', '中高风险'], rate: '+18.2', unit: '%', note: '近一年', btn: '买入' },
      { name: '工银双利债券A', tags: ['债券基金', '中低风险'], rate: '+4.8', unit: '%', note: '近一年', btn: '买入' }
    ],
    ins: [
      { name: '养老年金险（尊享版）', tags: ['养老规划'], rate: '2.5', unit: '%', note: '保证利率', btn: '了解' },
      { name: '百万守护意外险', tags: ['保障型'], rate: '18', unit: '元/年起', note: '意外全面保', btn: '了解' },
      { name: '少儿教育金', tags: ['教育储备'], rate: '2.3', unit: '%', note: '保证利率', btn: '了解' }
    ]
  },

  /* 生活频道 */
  lifeServices: [
    { icon: 'charge',  bg: '#eaf3fd', name: '手机充值', act: 'toast:话费充值（演示）' },
    { icon: 'receipt', bg: '#fff6e6', name: '生活缴费', act: 'toast:水电煤缴费（演示）' },
    { icon: 'noodle',  bg: '#fdecec', name: '外卖到家', act: 'toast:外卖频道（演示）' },
    { icon: 'film',    bg: '#f0ecfd', name: '电影演出', act: 'toast:购票优惠（演示）' },
    { icon: 'car',     bg: '#e9f7f5', name: '打车出行', act: 'toast:打车券包（演示）' },
    { icon: 'bed',     bg: '#eef4ff', name: '酒店民宿', act: 'toast:酒店预订（演示）' },
    { icon: 'health',  bg: '#eef9ef', name: '医疗健康', act: 'toast:医疗挂号（演示）' },
    { icon: 'bear',    bg: '#fdeff7', name: '潮玩谷店', act: 'xg:shigu' }
  ],
  lifeQuick: [
    { icon: 'gift',   name: '签到有礼', act: 'toast:签到成功 +10 工银i豆' },
    { icon: 'noodle', name: '外卖券', act: 'toast:外卖红包已领取（演示）' },
    { icon: 'film',   name: '9.9观影', act: 'toast:观影特惠（演示）' },
    { icon: 'car',    name: '打车5折', act: 'toast:打车券已领取（演示）' },
    { icon: 'bear',   name: '谷店券', act: 'xg:shigu' }
  ],
  coupons: [
    { amt: '20', unit: '元', name: '谷子店铺满199-20券', desc: 'e次元联名 · 全国谷店通用', btn: '领取' },
    { amt: '8.8', unit: '折', name: '周边手办专享折扣', desc: '合作潮玩品牌 · 每周更新', btn: '领取' },
    { amt: '50', unit: 'i豆', name: '展会门票抵扣i豆', desc: '漫展/谷展购票立抵', btn: '领取' }
  ],
  payServices: [
    { icon: 'water',    bg: '#eaf3fd', name: '水费', act: 'toast:水费缴费（演示）' },
    { icon: 'bolt',     bg: '#fff6e6', name: '电费', act: 'toast:电费缴费（演示）' },
    { icon: 'gas',      bg: '#fdecec', name: '燃气费', act: 'toast:燃气缴费（演示）' },
    { icon: 'tv',       bg: '#f0ecfd', name: '有线电视', act: 'toast:电视缴费（演示）' },
    { icon: 'wifi',     bg: '#e9f7f5', name: '宽带', act: 'toast:宽带缴费（演示）' },
    { icon: 'tel',      bg: '#eef4ff', name: '固话', act: 'toast:固话缴费（演示）' },
    { icon: 'building', bg: '#eef9ef', name: '物业费', act: 'toast:物业缴费（演示）' },
    { icon: 'flame',    bg: '#fdeff7', name: '供暖费', act: 'toast:供暖缴费（演示）' }
  ],

  /* 消息（首页铃铛 → 消息中心浮层） */
  msgCats: [
    { icon: 'chart', bg: '#eaf3fd', name: '动账提醒' },
    { icon: 'robot', bg: '#f0ecfd', name: '工小智' },
    { icon: 'gift',  bg: '#fdeff7', name: '活动通知' },
    { icon: 'credit', bg: '#fff6e6', name: '卡服务' }
  ],
  messages: [
    { icon: 'chart', bg: '#eaf3fd', title: '动账提醒', sub: '您尾号8888账户支出￥3,286.40（谷谷屋·吧唧），余额￥258,463.52', time: '10:02', dot: true },
    { icon: 'robot', bg: '#f0ecfd', title: '工小智', sub: '您关注的「初音未来 应援色吧唧」行情上涨12%，点击查看识谷估值 →', time: '09:46', dot: true, ec: 'shigu' },
    { icon: 'gift',  bg: '#fdeff7', title: 'e次元活动', sub: '「攒谷计划」上线：吃谷消费攒谷粒，兑限定谷子！', time: '昨天', dot: true, ec: 'zaangu' },
    { icon: 'credit', bg: '#fff6e6', title: '卡服务', sub: '您的「谷卡」IP联名卡面投票已开启，快来为心动卡面打Call', time: '昨天', dot: false, ec: 'guka' },
    { icon: 'chart', bg: '#eaf3fd', title: '动账提醒', sub: '您尾号8888账户收入￥12,600.00（工资代发）', time: '09-26', dot: false },
    { icon: 'shield', bg: '#eef9ef', title: '融安e信', sub: '提醒：二手交易请使用「出谷通」资金托管，谨防谷子交易诈骗', time: '09-25', dot: false, ec: 'chugu' },
    { icon: 'building', bg: '#eef3ff', title: '藏馆通知', sub: '您的「语棠」樱色絮语手办数字档案已生成，去展厅看看', time: '09-24', dot: false, ec: 'cang' }
  ],

  /* 收支明细 */
  records: [
    { icon: 'salary',  bg: '#eef9ef', title: '工资代发 · 某科技有限公司', time: '09-26 10:02', amt: 12600.0 },
    { icon: 'toy',     bg: '#fdeff7', title: '消费 · 谷谷屋（吧唧x3）', time: '09-26 19:44', amt: -286.0 },
    { icon: 'shield',  bg: '#eaf3fd', title: '出谷通 · 出售潮玩收款（托管放款）', time: '09-25 21:12', amt: 860.0 },
    { icon: 'chart',   bg: '#fff6e6', title: '理财收益 · 随心盈90天', time: '09-25 08:00', amt: 32.6 },
    { icon: 'toy',     bg: '#fdeff7', title: '消费 · 潮玩星球（景品手办）', time: '09-24 16:31', amt: -599.0 },
    { icon: 'gift',    bg: '#f0ecfd', title: '工银i豆兑换 · 谷店满减券', time: '09-23 12:05', amt: 0 },
    { icon: 'transfer', bg: '#fdecec', title: '转账支出 · 王**', time: '09-22 20:18', amt: -520.0 },
    { icon: 'charge',  bg: '#eaf3fd', title: '话费充值 · 138****6677', time: '09-21 09:30', amt: -100.0 },
    { icon: 'toy',     bg: '#fdeff7', title: '消费 · 漫展现场（色纸购买）', time: '09-20 14:22', amt: -180.0 },
    { icon: 'bank',    bg: '#eef4ff', title: '定期存款到期转存', time: '09-19 10:00', amt: 50000.0 }
  ],

  /* 我的-菜单 */
  mineMenu1: [
    { icon: 'credit', bg: '#eaf3fd', name: '我的银行卡（3张）', act: 'toast:银行卡管理（演示）' },
    { icon: 'guka',   bg: '#fff6e6', name: '我的信用卡 · 谷卡', act: 'xg:guka' },
    { icon: 'list',    bg: '#eef9ef', name: '收支明细', act: 'open:page-records' },
    { icon: 'transfer', bg: '#fdecec', name: '转账汇款', act: 'open:page-transfer' }
  ],
  mineMenu2: [
    { icon: 'magic',   bg: '#f0ecfd', name: '魔法空间 · 勋章墙', act: 'open:page-magic' },
    { icon: 'shield',  bg: '#e9f7f5', name: '安全中心', act: 'toast:安全中心（演示）' },
    { icon: 'headset', bg: '#eaf3fd', name: '帮助中心', act: 'toast:演示环境：客服暂未开通' },
    { icon: 'gear',    bg: '#f0f0f2', name: '设置', act: 'toast:设置（演示）' }
  ],

  /* 魔法空间 */
  magicTasks: [
    { icon: '📅', title: '每日签到', sub: '连续签到7天额外+50i豆', btn: '+10i豆', done: false },
    { icon: '💸', title: '完成一笔转账', sub: '转账汇款享i豆翻倍', btn: '去完成', done: false },
    { icon: '🧸', title: '逛逛e次元', sub: '浏览识谷行情30秒', btn: '+30i豆', done: false },
    { icon: '📈', title: '购买任意理财', sub: '单笔≥1000元可得200i豆', btn: '去完成', done: false }
  ],
  medals: [
    { icon: '💰', name: '首笔转账', locked: false },
    { icon: '📈', name: '理财新手', locked: false },
    { icon: '🧸', name: '谷龄达人', locked: false, xg: true },
    { icon: '🛡️', name: '安全卫士', locked: false },
    { icon: '💸', name: '活期高手', locked: false },
    { icon: '🏦', name: '存单达人', locked: true },
    { icon: '🎫', name: '卡神之路', locked: true, xg: true },
    { icon: '👑', name: '尊享会员', locked: true }
  ],

  /* ════════ 信用卡频道 ════════ */
  credit: {
    name: '工银World奋斗信用卡',
    no: '6222 2300 **** 1234',
    holder: '李**',
    limit: 50000,
    used: 23586.40,
    billMonth: '09月账单',
    billAmt: 2386.40,
    due: '10月25日',
    min: 238.64,
    benefits: [
      { icon: 'coffee', bg: '#fff6e6', name: '星巴克买一送一' },
      { icon: 'film',   bg: '#f0ecfd', name: '影票立减15元' },
      { icon: 'car',    bg: '#e9f7f5', name: '加油满200减30' },
      { icon: 'bear',   bg: '#fdeff7', name: '谷店满199减20' },
      { icon: 'gift',   bg: '#fdecec', name: 'i豆翻倍月' },
      { icon: 'plane',  bg: '#eaf3fd', name: '机场贵宾厅' },
      { icon: 'wifi',   bg: '#eef4ff', name: '视频会员9折' },
      { icon: 'gold',   bg: '#eef9ef', name: '全部权益' }
    ],
    menus: [
      { icon: 'list',   bg: '#eef9ef', name: '账单明细', act: 'toast:账单明细（演示）' },
      { icon: 'gold',   bg: '#fff6e6', name: '额度调整', act: 'toast:额度调整（演示）' },
      { icon: 'shield', bg: '#e9f7f5', name: '卡片安全锁', act: 'toast:安全锁已开启（演示）' },
      { icon: 'gear',   bg: '#f0f0f2', name: '卡片管理', act: 'toast:卡片管理（演示）' }
    ]
  },

  /* ════════ ★ e次元 板块（植入位核心数据，可被e次元程序接管） ════════ */
  xingegu: {
    brand: 'e次元',
    slogan: '谷子经济 · 一站式金融服务平台',
    /* home:true → 出现在手机银行首页 e次元 卡片（两行四列） */
    features: [
      { id: 'plaza', icon: 'house', name: '首页', desc: '谷圈社区', tip: '谷友聚集地', home: false },
      { id: 'shigu', icon: 'shigu', name: '识谷', desc: 'AI估值鉴真', tip: '拍照识谷 · 秒出行情价', home: true, group: 1 },
      { id: 'guxiang', icon: 'robot', name: '谷享', desc: 'AI代购比价', tip: '说一句话，全网帮你盯着', home: true, group: 1 },
      { id: 'chugu', icon: 'shield', name: '出谷通', desc: '交易托管', tip: '资金托管到验货放款', home: true, group: 1 },
      { id: 'guka', icon: 'guka', name: '谷卡', desc: '联名卡分期', tip: '卡面投票定制 · 免息分期', home: true, group: 1 },
      { id: 'zhidai', icon: 'gold', name: '质押贷', desc: '藏品变额度', tip: '估值即授信 · 最高五成', home: true, group: 2 },
      { id: 'cang', icon: 'building', name: '藏馆', desc: '数字分身', tip: '建档案 · 虚拟展厅 · AR 预览', home: true, group: 2 },
      { id: 'zangu', icon: 'medal', name: '攒谷', desc: '成长体系', tip: '吃谷行为变谷粒勋章', home: true, group: 2 },
      { id: 'mall', icon: 'gift', name: '商城', desc: '自有周边', tip: '工行自有 IP · 谷粒兑换', home: true, group: 2 },
      { id: 'forum', icon: 'list', name: '论坛', desc: '谷友交流', tip: '资讯 · 情报 · 同好讨论' },
      { id: 'mine', icon: 'user', name: '我的', desc: '成长档案', tip: '成就勋章 · 粉丝关注' }
    ]
  },

  /* ════════ ★ e次元 论坛 / 商城 / 我的（工行自有设定，无第三方 IP） ════════ */
  ezgy: {
    /* 商城专区：按「谷圈品类」划分，形象取自自研谷伴角色 */
    zones: [
      { id: 'badge',   name: '徽章吧',    tag: '周边上新', badge: '上新',   tone: '',      grad: 'linear-gradient(150deg,#fdf3df,#f7e6c4)', char: 'chengxi', hue: '#d9a441' },
      { id: 'standee', name: '立牌堂',    tag: '周边上新', badge: '上新',   tone: 'blue',  grad: 'linear-gradient(150deg,#e8f4fd,#d5ecfb)', char: 'xingyi',  hue: '#3d8ff0' },
      { id: 'figure',  name: '手办阁',    tag: '新品首发', badge: '首发',   tone: '',      grad: 'linear-gradient(150deg,#ece7fd,#dcd2fa)', char: 'moshu',   hue: '#7a5cff' },
      { id: 'soft',    name: '软周边社',  tag: '补货热卖', badge: '补货',   tone: 'pink',  grad: 'linear-gradient(150deg,#fde9f0,#fbd4e2)', char: 'yutang',  hue: '#e0557f' },
      { id: 'paper',   name: '色纸票根铺',tag: '限量发售', badge: '限量',   tone: 'green', grad: 'linear-gradient(150deg,#e5f7ec,#d0f0e0)', char: 'yunjian', hue: '#0aa870' },
      { id: 'pain',    name: '痛包改造',  tag: '工具周边', badge: '工具',   tone: 'blue',  grad: 'linear-gradient(150deg,#e2f7ef,#c9f0e2)', char: 'yufeng',  hue: '#14b8a6' },
      { id: 'icbc',    name: '工行自有IP',tag: '官方自营', badge: '官方',   tone: 'red',   grad: 'linear-gradient(150deg,#ffeaea,#ffd6d6)', char: 'xiaoe',   hue: '#c7000b' }
    ],
    /* 最近上新 · 三张竖版海报卡（内联SVG矢量插画，清晰可放大） */
    newArrivals: [
      { name: '「星熠」白昼流光Ver. 手办',   art: 'figure',  tone: 'linear-gradient(160deg,#e6f6ec,#bfe8cf)' },
      { name: '「语棠」樱色絮语 1/7 手办',   art: 'figure2', tone: 'linear-gradient(160deg,#fde4ef,#f9c6dc)' },
      { name: '「小e」联名限定礼盒',          art: 'giftbox', tone: 'linear-gradient(160deg,#ffeaea,#ffd6d6)' }
    ],
    /* 官方账号（全部为 e次元 自有账号） */
    forumNotices: [
      { char: 'xiaoe',   name: 'e次元小报',   sub: '谷圈广场 2.0 上线：新增藏品档案与虚拟展厅', time: '2小时前', badge: 99, official: true },
      { char: 'xingyi',  name: '行情观测台',  sub: '本周行情：吧唧大盘稳中有升，立牌涨幅明显', time: '2小时前', badge: 99, official: true },
      { char: 'yunjian', name: '托管小助手',  sub: '托管免手续费活动进行中，笔笔 +20 谷粒', time: '5小时前', badge: 39, official: true },
      { char: 'yufeng',  name: '卡面委员会',  sub: '谷卡卡面投票第 3 赛季开启，本命由你定', time: '昨天', badge: 28, official: true },
      { char: 'yutang',  name: '攒谷公告栏',  sub: '每日签到 +20 谷粒，连续 7 天可开限定盲盒', time: '昨天', badge: 12, official: true }
    ],
    forumPosts: [
      { char: 'chengxi', user: '蹲低价的小满',   zone: '交易情报', time: '12分钟前', title: '同一枚吧唧，三家店差价 60 块，附比价截图', txt: '蹲了半个月终于摸清规律：官方店大促前一周二手会先跌。整理了三家渠道的价格曲线，供同好参考～', likes: 1286, cmts: 342, hot: true },
      { char: 'yutang',  user: '吃谷十年的阿棠', zone: '晒谷专区', time: '1小时前', title: '晒谷｜吃谷十年，我的房间堆成了展馆', txt: '从初中开始吃谷，搬了三次家都没舍得丢。今天大扫除整理了一面展示墙，分享给大家～', likes: 3421, cmts: 566, img: 'anniv' },
      { char: 'yufeng',  user: '夜航船',         zone: '综合讨论', time: '2小时前', title: '新系列设定讨论（轻微剧透慎入）', txt: '这章的演出效果拉满了，BGM 一响鸡皮疙瘩都起来了。制作组是真的懂。', likes: 2087, cmts: 893, hot: true },
      { char: 'moshu',   user: '档案管理员',     zone: '手办阁',   time: '4小时前', title: '「语棠」1/7 手办开箱｜实物比官网图还精致', txt: '等了半年终于到了，裙摆的渐变和底座的水晶质感绝了，值回票价！', likes: 1563, cmts: 277, img: 'figure' },
      { char: 'xingyi',  user: '估值星',         zone: '交易情报', time: '6小时前', title: '质押贷实测：估值 8450 的藏品能贷多少？', txt: '拿一整套吧唧去试了识谷估值，再走质押流程，把每个环节的额度和费率都记下来了。', likes: 942, cmts: 186, hot: true },
      { char: 'yunjian', user: '稳如老云',       zone: '交易情报', time: '8小时前', title: '攻略｜出谷通托管全流程避坑', txt: '72 小时验货期怎么用最划算？哪些情况会转争议？一篇讲清楚，新手建议先看。', likes: 1180, cmts: 254 },
      { char: 'chengxi', user: '风与自由',       zone: '综合讨论', time: '昨天', title: '漫展回血攻略：这样挂单最快出', txt: '亲测有效：标题带角色全名 + 状态标注 + 自然光实拍，三天出清 30 个吧唧！', likes: 2876, cmts: 431, hot: true },
      { char: 'xiaoe',   user: '新人引导员',     zone: '新人报道', time: '昨天', title: '新人报道｜第一次吃谷该从什么开始', txt: '从预算规划、防伪核验到理性消费，给刚入坑的朋友整理了一份入门清单。', likes: 1934, cmts: 389 }
    ],
    mallGoods: [
      { id: 'm1', zone: 'icbc',    name: '工行自有IP「小e」限定马口铁吧唧', price: 39,  tag: '官方',   art: 'badge' },
      { id: 'm2', zone: 'icbc',    name: '工行自有IP「小e」编号收藏卡',     price: 69,  tag: '限量',   art: 'ticket' },
      { id: 'm3', zone: 'standee', name: '「星熠」亚克力立牌 · 白昼流光',    price: 88,  tag: '上新',   art: 'standee' },
      { id: 'm4', zone: 'figure',  name: '「语棠」1/7 比例手办 樱色絮语',    price: 1099, tag: '预售',  art: 'figure2' },
      { id: 'm5', zone: 'badge',   name: '「橙汐」双闪徽章套组（3 枚）',     price: 66,  tag: '热卖',   art: 'badge' },
      { id: 'm6', zone: 'paper',   name: '限定镭射色纸收藏套组',            price: 15,  tag: '限量',   art: 'ticket' },
      { id: 'm7', zone: 'soft',    name: '「云间」毛绒挂件 · 痛包款',        price: 99,  tag: '补货',   art: 'keychain' },
      { id: 'm8', zone: 'soft',    name: '特大号角色抱枕（含防尘袋）',       price: 129, tag: '热卖',   art: 'figure' },
      { id: 'm9', zone: 'pain',    name: '双肩痛包 · 可拆透明窗',            price: 149, tag: '工具',   art: 'giftbox' },
      { id: 'm10', zone: 'pain',   name: '吧唧防尘展示盒 · 十二宫格',        price: 59,  tag: '工具',   art: 'keychain' },
      { id: 'm11', zone: 'standee',name: '「墨书」档案馆主题立牌套装',       price: 128, tag: '上新',   art: 'standee2' },
      { id: 'm12', zone: 'badge',  name: '马口铁徽章盲盒（6 款随机）',       price: 20,  tag: '热卖',   art: 'badge' },
      { id: 'm13', zone: 'paper',  name: '收藏档案册 + 编号贴纸套装',        price: 45,  tag: '上新',   art: 'ticket' },
      { id: 'm14', zone: 'figure', name: '「御风」限定机械风亚克力组',       price: 168, tag: '推荐',   art: 'figure2' }
    ],
    annivGoods: [
      { id: 'a1', name: '马口铁徽章',   price: 20, unit: '枚', art: 'badge' },
      { id: 'a2', name: '镭射票',       price: 15, unit: '起', art: 'ticket' },
      { id: 'a3', name: '亚克力挂件',   price: 32, unit: '枚', art: 'keychain' },
      { id: 'a4', name: '亚克力立牌',   price: 48, unit: '枚', art: 'standee' }
    ],
    mine: {
      name: '无谓的正义', uid: 'UID 417817487', ip: 'IP：上海 · 已实名',
      sign: '吃谷十年，账本一笔没落下。', tags: ['吃谷十年', '吧唧收藏家', '理性消费'],
      fans: 1286, follow: 233, likes: 5200,
      /* 藏品档案卡（对应「藏馆」里的收藏册） */
      gameCards: [
        { name: '徽章收藏册', sub: '共 8 册 · 42 枚', char: 'xingyi',
          stats: [['925', '收藏天数'], ['42', '已建档'], ['12', '待补拍'], ['S 级', '最高品相']] },
        { name: '立牌收藏册', sub: '共 3 册 · 16 件', char: 'moshu',
          stats: [['385', '收藏天数'], ['16', '已建档'], ['4', '待补拍']] }
      ],
      works: [
        { title: '吃谷十年，我的房间堆成了展馆', zone: '晒谷专区', likes: 3421, time: '09-26' },
        { title: '漫展回血攻略：这样挂单最快出', zone: '交易情报', likes: 2876, time: '09-24' },
        { title: '吧唧保护套选购避坑指南', zone: '交易情报', likes: 1204, time: '09-20' }
      ],
      follows: [
        { char: 'chengxi', name: '蹲低价的小满', sub: '昨天发布了新帖子' },
        { char: 'yutang',  name: '吃谷十年的阿棠', sub: '3小时前发布了新帖子' },
        { char: 'yufeng',  name: '夜航船', sub: '关注了专题「手办阁」' }
      ]
    }
  },

  /* 工小智对话（关键词自动回复） */
  chatReplies: [
    { k: ['余额', '多少钱', '资产'], r: '您尾号 <b>8888</b> 储蓄卡当前余额 <b>￥258,463.52</b>，其中活期￥253,963.52。需要我帮您看看本月收支吗？' },
    { k: ['转账', '汇款'], r: '好的～请告诉我 <b>收款人、卡号和金额</b>，我来帮您快速转账。您也可以点击下方技能或回到首页使用「转账汇款」。' },
    { k: ['谷', '谷子', '吧唧', '手办', '行情'], r: '发现您对谷子感兴趣！「<b>识谷</b>」AI估值助手已上线：拍照即可识别谷子品类、稀有度并给出参考行情价～点击下方 <b>识谷估值</b> 技能即可体验。' },
    { k: ['理财', '基金', '存款'], r: '为您推荐「<b>随心盈90天</b>」，业绩比较基准2.86%，风险等级R2。投资有风险，购买需谨慎哦。可前往「投资」查看更多产品。' },
    { k: ['i豆', '勋章', '签到'], r: '您当前拥有 <b>8,640</b> 枚工银i豆，今日还未签到～完成「魔法空间」任务可再赚i豆，i豆可在权益星球兑换限定谷和谷店券！' },
    { k: ['你好', '在吗', 'hi', 'hello'], r: '您好，我是工小智 😊 领航AI+已覆盖 500+ 场景，余额查询、转账汇款、理财推荐都能找我～' }
  ],
  chatFallback: '收到～这是模拟演示环境，我会尽力回答。您可以问我：余额、转账、理财、谷子行情，或点击下方技能快捷操作。'
};
