/* ═══════════════════════════════════════════════════════════════════
   模拟工商银行 · 通用业务页系统（bank-biz.js）
   ───────────────────────────────────────────────────────────────────
   手机银行除 4 个主 Tab 与几个固定浮层外，其余业务全部由本文件驱动：
   绑卡 / 限额 / 挂失 / 缴费 / 充值 / 理财 / 存款 / 贷款 / 信用卡申请 /
   结售汇 / 网点 / 安全中心 / 设置 / 帮助 / 回单 / 工资单 …

   机制：业务注册表 + 页面栈，支持任意层级的「进入 → 返回」。
     BANK.open('bindcard')          进入某业务
     BANK.open('carddetail', 'c1')  带参数进入
     BANK.back()                    返回上一级
     BANK.def(key, {title, render}) 注册业务

   每个业务页都提供 ≥3 个可继续点击的按钮，形成可深挖的层级。
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const fmt = n => (+n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = n => (+n || 0).toLocaleString('zh-CN');
  const ico = k => (window.ICBCApp && ICBCApp.ico) ? ICBCApp.ico(k) : '';
  const toast = (m) => { if (window.ICBCApp) ICBCApp.toast(m); };
  const nowStr = () => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const rec = (o) => { if (window.ICBCApp && ICBCApp.addRecord) ICBCApp.addRecord(Object.assign({ time: nowStr() }, o)); };

  /* ── 通用小组件 ── */
  const row = o => `<button class="bz-row" onclick="${o.act}">
      <span class="bz-ri" style="background:${o.bg || '#f2f4f8'}">${o.ico ? ico(o.ico) : (o.emo || '')}</span>
      <span class="bz-rt"><b>${o.name}</b>${o.desc ? `<i>${o.desc}</i>` : ''}</span>
      ${o.right ? `<span class="bz-rr">${o.right}</span>` : '<span class="bz-arr">›</span>'}
    </button>`;
  const tiles = list => `<div class="bz-tiles">${list.map(t => `
      <button class="bz-tile" onclick="${t.act}">
        <span class="bz-tii" style="background:${t.bg || '#f2f4f8'}">${t.ico ? ico(t.ico) : (t.emo || '')}</span>
        <span>${t.name}</span></button>`).join('')}</div>`;
  const card = (inner, cls) => `<div class="bz-card${cls ? ' ' + cls : ''}">${inner}</div>`;
  const kv = (k, v, cls) => `<div class="bz-kv"><span>${k}</span><b class="${cls || ''}">${v}</b></div>`;
  const nav = (t, s) => `<div class="bz-head"><b>${t}</b>${s ? `<span>${s}</span>` : ''}</div>`;
  const steps = (n, cur) => `<div class="bz-steps">${Array.from({ length: n }, (_, i) =>
    `<i class="${i < cur ? 'done' : i === cur ? 'on' : ''}">${i + 1}</i>`).join('')}</div>`;

  /* ═══════════ 业务注册表 ═══════════ */
  const BIZ = {};
  let stack = [];

  function render(key, param) {
    const b = BIZ[key];
    const body = $('#bizBody');
    if (!b) { toast('演示环境：该功能即将上线'); BANK.back(); return; }
    $('#bizTitle').textContent = typeof b.title === 'function' ? b.title(param) : b.title;
    body.innerHTML = typeof b.render === 'function' ? b.render(param) : b.render;
    body.scrollTop = 0;
    /* 渲染后钩子：需要量尺寸画图（canvas）的页面在这里补 */
    if (typeof b.after === 'function') setTimeout(() => b.after(param), 30);
  }

  const BANK = {
    def(key, d) { BIZ[key] = d; return this; },
    open(key, param) {
      stack.push({ key: key, param: param });
      if (window.ICBCApp) ICBCApp.openPage('page-biz');
      render(key, param);
      return this;
    },
    back() {
      stack.pop();
      if (!stack.length) { if (window.ICBCApp) ICBCApp.closePage('page-biz'); return this; }
      const t = stack[stack.length - 1];
      render(t.key, t.param);
      return this;
    },
    home() { stack = []; if (window.ICBCApp) ICBCApp.closePage('page-biz'); return this; },
    stack() { return stack; },
    BIZ, row, tiles, card, kv, nav, steps, fmt, money, ico, toast, rec
  };
  window.BANK = BANK;

  /* ── 模拟卡库（绑卡后进这里） ── */
  const CARDS = [
    { id: 'c1', type: '储蓄卡', name: '薪金卡', no: '6222 0202 **** 8888', img: 'img/art/card-debit.jpg',
      bank: '中国工商银行', bal: '258,463.52', main: true, color: '#c7000b' },
    { id: 'c2', type: '信用卡', name: '工银World奋斗卡', no: '6222 2300 **** 1234', img: 'img/art/card-credit.jpg',
      bank: '中国工商银行', bal: '额度 50,000.00', color: '#1c1c22' },
    { id: 'c3', type: '信用卡', name: '谷卡 · IP联名卡', no: '6222 2300 **** 7788', img: 'img/art/card-guka.jpg',
      bank: '中国工商银行', bal: '额度 30,000.00', color: '#7a5cff' }
  ];
  window.BANK_CARDS = CARDS;

  /* ── 首页「我的银行卡」卡面条（脚本在 body 末尾，DOM 已就绪） ── */
  (function renderCardStrip() {
    const box = document.getElementById('cardStrip');
    if (!box) return;
    box.innerHTML = CARDS.map(c => `
      <button class="cs-card" onclick="BANK.open('carddetail','${c.id}')">
        <img src="${c.img}" alt="${c.name}">
        <span class="cs-t"><b>${c.name}</b><i>${c.type} · ${c.no.slice(-4)}</i></span>
      </button>`).join('') + `
      <button class="cs-card cs-add" onclick="BANK.open('bindcard')">
        <span class="cs-plus">＋</span><span class="cs-add-t">添加银行卡</span>
      </button>`;
  })();

  /* ═══════════ 1. 我的银行卡 ═══════════ */
  BANK.def('mycards', {
    title: '我的银行卡',
    render: () => `
      ${CARDS.map(c => `
        <button class="bz-bcard" onclick="BANK.open('carddetail','${c.id}')">
          <img src="${c.img}" alt="">
          <span class="bz-bc-t"><b>${c.name}</b><i>${c.type} · ${c.no.slice(-4)}</i></span>
          ${c.main ? '<i class="bz-bc-tag">默认</i>' : ''}
        </button>`).join('')}
      ${nav('卡片服务', '共 ' + CARDS.length + ' 张')}
      ${card(
        row({ ico: 'credit', bg: '#eaf3fd', name: '添加银行卡', desc: '支持储蓄卡 / 信用卡', act: "BANK.open('bindcard')" }) +
        row({ ico: 'list', bg: '#eef9ef', name: '卡片交易明细', desc: '按卡查看收支流水', act: "BANK.open('cardtxn')" }) +
        row({ ico: 'gold', bg: '#fff6e6', name: '限额管理', desc: '单笔 / 日累计 / 月累计', act: "BANK.open('limits')" }) +
        row({ ico: 'shield', bg: '#e9f7f5', name: '挂失与解挂', desc: '卡片丢失时紧急冻结', act: "BANK.open('cardloss')" }) +
        row({ ico: 'gear', bg: '#f0f0f2', name: '卡片管理', desc: '改密码 / 换卡 / 注销', act: "BANK.open('cardmgr')" })
      )}`
  });

  /* ═══════════ 2. 卡片详情 ═══════════ */
  BANK.def('carddetail', {
    title: p => (CARDS.find(c => c.id === p) || {}).name || '卡片详情',
    render: p => {
      const c = CARDS.find(x => x.id === p) || CARDS[0];
      return `
        <div class="bz-cshow"><img src="${c.img}" alt=""></div>
        ${card(
          kv('卡种', c.type) + kv('卡号', c.no) + kv('开户行', c.bank) +
          kv(c.type === '信用卡' ? '可用额度' : '可用余额', c.bal, 'up') + kv('状态', '正常')
        )}
        ${nav('这张卡能做什么')}
        ${tiles([
          { ico: 'list', bg: '#eef9ef', name: '交易明细', act: "BANK.open('cardtxn','" + c.id + "')" },
          { ico: 'gold', bg: '#fff6e6', name: '限额设置', act: "BANK.open('limits','" + c.id + "')" },
          { ico: 'shield', bg: '#e9f7f5', name: '安全锁', act: "BANK.open('cardlock','" + c.id + "')" },
          { ico: 'transfer', bg: '#fdecec', name: '转账到这张卡', act: "BANK.open('transfer2','" + c.id + "')" },
          { ico: 'credit', bg: '#f0ecfd', name: '一键还款', act: "BANK.open('repay','" + c.id + "')" },
          { ico: 'gear', bg: '#f0f0f2', name: '卡片管理', act: "BANK.open('cardmgr','" + c.id + "')" }
        ])}`;
    }
  });

  /* ═══════════ 3. 添加银行卡（多步） ═══════════ */
  const bindState = { no: '', type: '', phone: '' };
  BANK.def('bindcard', {
    title: '添加银行卡',
    render: s => {
      const step = s || 1;
      if (step === 1) return `
        ${steps(3, 0)}
        ${card(`<div class="bz-form">
          <label>卡号</label>
          <input id="bindNo" type="tel" inputmode="numeric" placeholder="请输入 16-19 位卡号" maxlength="23"
                 oninput="BANK.bindDetect(this.value)">
          <div class="bz-hint" id="bindHint">支持中国工商银行及其他银行的借记卡、信用卡</div>
        </div>`)}
        ${tiles([
          { ico: 'camera', bg: '#eaf3fd', name: '拍照识别', act: "BANK.bindDemo()" },
          { ico: 'list', bg: '#eef9ef', name: '选择已有卡', act: "BANK.open('mycards')" },
          { ico: 'headset', bg: '#f0ecfd', name: '遇到问题', act: "BANK.open('help')" }
        ])}
        <button class="bz-main" onclick="BANK.bindNext(1)">下一步</button>
        <p class="bz-tip">※ 演示环境，请勿输入真实卡号</p>`;
      if (step === 2) return `
        ${steps(3, 1)}
        ${card(
          kv('卡号', bindState.no || '6222 0202 **** 6666') +
          kv('卡种', bindState.type || '储蓄卡') +
          kv('开户行', '中国工商银行') +
          kv('校验方式', '银行预留手机号')
        )}
        ${card(`<div class="bz-form">
          <label>手机号</label>
          <input id="bindPhone" type="tel" inputmode="numeric" placeholder="银行预留手机号" value="138****5678">
          <label style="margin-top:12px">短信验证码</label>
          <div class="bz-code"><input id="bindCode" type="tel" placeholder="6 位验证码"><button onclick="BANK.bindSendCode()">获取验证码</button></div>
        </div>`)}
        <button class="bz-main" onclick="BANK.bindNext(2)">提交绑定</button>
        <button class="bz-plain" onclick="BANK.back()">返回修改</button>`;
      return `
        <div class="bz-done"><span class="bz-done-ico">${ico('credit')}</span>
          <b>绑定成功</b>
          <span>${bindState.type || '储蓄卡'} · ${(bindState.no || '6222 ****6666').slice(-8)} 已添加</span></div>
        ${tiles([
          { ico: 'credit', bg: '#eaf3fd', name: '查看我的卡', act: "BANK.home();BANK.open('mycards')" },
          { ico: 'gold', bg: '#fff6e6', name: '设置限额', act: "BANK.open('limits')" },
          { ico: 'shield', bg: '#e9f7f5', name: '开启安全锁', act: "BANK.open('cardlock','c1')" }
        ])}
        <button class="bz-main" onclick="BANK.home()">完成</button>`;
    }
  });

  /* ═══════════ 4. 限额管理 ═══════════ */
  BANK.def('limits', {
    title: '限额管理',
    render: () => `
      ${card(
        `<div class="bz-lim"><span>单笔限额</span><b>￥50,000.00</b>
          <input type="range" min="1000" max="100000" step="1000" value="50000" oninput="this.previousElementSibling.previousElementSibling.textContent='￥'+Number(this.value).toLocaleString('zh-CN')+'.00'"></div>` +
        `<div class="bz-lim"><span>日累计限额</span><b>￥200,000.00</b>
          <input type="range" min="5000" max="500000" step="5000" value="200000" oninput="this.previousElementSibling.previousElementSibling.textContent='￥'+Number(this.value).toLocaleString('zh-CN')+'.00'"></div>` +
        `<div class="bz-lim"><span>月累计限额</span><b>￥1,000,000.00</b>
          <input type="range" min="10000" max="2000000" step="10000" value="1000000" oninput="this.previousElementSibling.previousElementSibling.textContent='￥'+Number(this.value).toLocaleString('zh-CN')+'.00'"></div>`
      )}
      ${tiles([
        { ico: 'shield', bg: '#e9f7f5', name: '安全锁设置', act: "BANK.open('cardlock','c1')" },
        { ico: 'finger', bg: '#f0ecfd', name: '免密支付', act: "BANK.open('smallpay')" },
        { ico: 'list', bg: '#eef9ef', name: '限额说明', act: "BANK.open('limithelp')" }
      ])}
      <button class="bz-main" onclick="BANK.limitsSave()">保存设置</button>`
  });

  /* ═══════════ 5. 挂失 ═══════════ */
  BANK.def('cardloss', {
    title: '挂失与解挂',
    render: () => `
      ${card(`<div class="bz-warn">挂失后该卡片将立即停止一切支付、转账与取现交易，资金安全受保护。</div>`)}
      ${CARDS.map(c => row({
        ico: 'credit', bg: '#fdecec', name: c.name + ' · ' + c.no.slice(-4),
        desc: '点击办理挂失', act: `BANK.lossDo('${c.id}')`, right: '<i class="bz-bc-tag">正常</i>'
      })).join('')}
      ${tiles([
        { ico: 'headset', bg: '#eaf3fd', name: '联系客服', act: "BANK.open('help')" },
        { ico: 'list', bg: '#eef9ef', name: '挂失须知', act: "BANK.open('losshelp')" },
        { ico: 'shield', bg: '#e9f7f5', name: '安全中心', act: "BANK.open('security')" }
      ])}`
  });

  /* ═══════════ 6. 生活缴费 ═══════════ */
  BANK.def('paybill', {
    title: '生活缴费',
    render: () => `
      ${card(`<div class="bz-form"><label>缴费户号</label>
        <input id="billNo" type="text" placeholder="请输入水/电/燃气户号" value="SH-2026-0918-8888">
        <div class="bz-hint">常用户号：上海黄浦 · 工银大厦 20F</div></div>`)}
      ${nav('选择缴费项目')}
      ${tiles([
        { ico: 'water', bg: '#eaf3fd', name: '水费', act: "BANK.billPay('水费',128.60)" },
        { ico: 'bolt', bg: '#fff6e6', name: '电费', act: "BANK.billPay('电费',236.40)" },
        { ico: 'gas', bg: '#fdecec', name: '燃气费', act: "BANK.billPay('燃气费',88.00)" },
        { ico: 'tv', bg: '#f0ecfd', name: '有线电视', act: "BANK.billPay('有线电视',30.00)" },
        { ico: 'wifi', bg: '#e9f7f5', name: '宽带', act: "BANK.billPay('宽带',129.00)" },
        { ico: 'tel', bg: '#eef4ff', name: '固话', act: "BANK.billPay('固话',45.00)" },
        { ico: 'building', bg: '#eef9ef', name: '物业费', act: "BANK.billPay('物业费',560.00)" },
        { ico: 'flame', bg: '#fdeff7', name: '供暖费', act: "BANK.billPay('供暖费',1200.00)" }
      ])}
      ${card(
        row({ ico: 'list', bg: '#eef9ef', name: '缴费记录', desc: '近 12 个月全部缴费', act: "BANK.open('billhist')" }) +
        row({ ico: 'gift', bg: '#fdeff7', name: '签约代扣', desc: '每月自动缴费，不怕忘', act: "BANK.open('billauto')" })
      )}`
  });

  /* ═══════════ 7. 话费充值 ═══════════ */
  BANK.def('recharge', {
    title: '手机充值',
    render: () => `
      ${card(`<div class="bz-form"><label>手机号</label>
        <input type="tel" placeholder="请输入手机号" value="138****5678"><div class="bz-hint">本机号码 · 中国移动</div></div>`)}
      ${nav('选择充值金额')}
      ${tiles([
        { emo: '￥30', name: '30 元', act: "BANK.rechargeDo(30)" },
        { emo: '￥50', name: '50 元', act: "BANK.rechargeDo(50)" },
        { emo: '￥100', name: '100 元', act: "BANK.rechargeDo(100)" },
        { emo: '￥200', name: '200 元', act: "BANK.rechargeDo(200)" },
        { emo: '￥300', name: '300 元', act: "BANK.rechargeDo(300)" },
        { emo: '其他', name: '自定义', act: "BANK.open('rechargecustom')" }
      ])}
      ${card(
        row({ ico: 'list', bg: '#eef9ef', name: '充值记录', desc: '查看历史充值订单', act: "BANK.open('rechargehist')" }) +
        row({ ico: 'gift', bg: '#fdeff7', name: '充值优惠', desc: '满 100 减 3 元', act: "BANK.open('rechargepromo')" })
      )}`
  });

  /* ═══════════ 8. 理财购买 ═══════════ */
  BANK.def('wealth', {
    title: '投资理财',
    render: () => `
      ${card(kv('可用余额', '￥253,963.52', 'up') + kv('风险等级', '稳健型（R2）'))}
      ${nav('热销产品')}
      ${card(
        row({ ico: 'chart', bg: '#fdeff7', name: '随心盈90天', desc: '业绩基准 2.86% · R2 · 1元起', act: "BANK.open('wealthbuy','随心盈90天')" }) +
        row({ ico: 'chart', bg: '#eaf3fd', name: '安享180天', desc: '业绩基准 3.02% · R2 · 1万起', act: "BANK.open('wealthbuy','安享180天')" }) +
        row({ ico: 'gold', bg: '#fff6e6', name: '金苹果1年', desc: '业绩基准 3.36% · R3 · 5万起', act: "BANK.open('wealthbuy','金苹果1年')" }) +
        row({ ico: 'bolt', bg: '#eef9ef', name: '日升息·现金宝', desc: '七日年化 2.15% · 随存随取', act: "BANK.open('wealthbuy','日升息·现金宝')" })
      )}
      ${tiles([
        { ico: 'list', bg: '#eef9ef', name: '我的持仓', act: "BANK.open('holdings')" },
        { ico: 'shield', bg: '#e9f7f5', name: '风险测评', act: "BANK.open('riskquiz')" },
        { ico: 'chart', bg: '#fdeff7', name: '收益走势', act: "BANK.open('yieldcurve')" },
        { ico: 'edu', bg: '#fff6e6', name: '理财课堂', act: "BANK.open('wealthclass')" }
      ])}`
  });

  /* ═══════════ 9. 定期存款 ═══════════ */
  BANK.def('deposit', {
    title: '定期存款',
    render: () => `
      ${card(`<div class="bz-form"><label>存入金额</label>
        <input id="depAmt" type="number" inputmode="decimal" value="50000"></div>`)}
      ${nav('选择存期')}
      ${tiles([
        { emo: '3月', name: '1.35%', act: "BANK.depDo('3个月',1.35)" },
        { emo: '6月', name: '1.55%', act: "BANK.depDo('6个月',1.55)" },
        { emo: '1年', name: '1.75%', act: "BANK.depDo('1年',1.75)" },
        { emo: '2年', name: '2.05%', act: "BANK.depDo('2年',2.05)" },
        { emo: '3年', name: '2.35%', act: "BANK.depDo('3年',2.35)" },
        { emo: '5年', name: '2.40%', act: "BANK.depDo('5年',2.40)" }
      ])}
      ${card(
        row({ ico: 'bank', bg: '#eaf3fd', name: '大额存单', desc: '20 万起 · 可转让', act: "BANK.open('cd')" }) +
        row({ ico: 'list', bg: '#eef9ef', name: '我的定期', desc: '查看持有中的存单', act: "BANK.open('mydeposits')" }) +
        row({ ico: 'chart', bg: '#fff6e6', name: '利息试算', desc: '按存期比较收益', act: "BANK.open('depcalc')" })
      )}`
  });

  /* ═══════════ 10. 个人贷款 ═══════════ */
  BANK.def('loan', {
    title: '个人贷款',
    render: () => `
      ${card(kv('可贷额度', '￥300,000.00', 'up') + kv('年化利率', '3.45% 起') + kv('最长可贷', '36 期'))}
      ${nav('贷款产品')}
      ${card(
        row({ ico: 'bolt', bg: '#fff6e6', name: '融e借', desc: '纯信用 · 最高 30 万 · 随借随还', act: "BANK.open('loanapply','融e借')" }) +
        row({ ico: 'house', bg: '#eef4ff', name: '个人住房贷款', desc: '首套 / 二套 · 最长 30 年', act: "BANK.open('loanapply','个人住房贷款')" }) +
        row({ ico: 'car', bg: '#e9f7f5', name: '个人汽车贷款', desc: '最高 8 成 · 最长 5 年', act: "BANK.open('loanapply','个人汽车贷款')" }) +
        row({ ico: 'gold', bg: '#fff6e6', name: '质押贷 · 收藏品质押', desc: '估值即授信 · 最高五成', act: "ICBCApp.openXingegu('zhidai')" })
      )}
      ${tiles([
        { ico: 'chart', bg: '#fdeff7', name: '额度试算', act: "BANK.open('loancalc')" },
        { ico: 'list', bg: '#eef9ef', name: '我的贷款', act: "BANK.open('myloans')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '还款计划', act: "BANK.open('repayplan')" }
      ])}`
  });

  /* ═══════════ 11. 信用卡申请 ═══════════ */
  BANK.def('creditapply', {
    title: '信用卡申请',
    render: () => `
      ${card(`<div class="bz-warn">在线申请：最快 5 分钟出额度，核卡后邮寄到家。</div>`)}
      ${nav('选择卡种')}
      ${card(
        row({ ico: 'credit', bg: '#eaf3fd', name: '工银World奋斗信用卡', desc: '境外消费返现 · 机场贵宾厅', act: "BANK.open('creditform','World奋斗卡')" }) +
        row({ ico: 'guka', bg: '#fff6e6', name: '谷卡 · IP联名卡', desc: '本命卡面任选 · 免息分期', act: "BANK.open('creditform','谷卡')" }) +
        row({ ico: 'gold', bg: '#fdeff7', name: '工银无界白金卡', desc: '钻石权益 · 高额度', act: "BANK.open('creditform','无界白金卡')" }) +
        row({ ico: 'plane', bg: '#eef4ff', name: '工银环球旅行卡', desc: '境外免货币转换费', act: "BANK.open('creditform','环球旅行卡')" })
      )}
      ${tiles([
        { ico: 'chart', bg: '#eef9ef', name: '额度测算', act: "BANK.open('creditcalc')" },
        { ico: 'list', bg: '#fdeff7', name: '申请进度', act: "BANK.open('creditprogress')" },
        { ico: 'edu', bg: '#eaf3fd', name: '办卡须知', act: "BANK.open('credithelp')" }
      ])}`
  });

  /* ═══════════ 12. 结售汇 ═══════════ */
  BANK.def('fx', {
    title: '结售汇',
    render: () => `
      ${card(kv('美元现汇卖出价', '7.1236') + kv('欧元现汇卖出价', '7.8420') + kv('日元(100)卖出价', '4.7180'))}
      ${nav('选择币种')}
      ${tiles([
        { emo: 'USD', name: '美元', act: "BANK.fxDo('美元',7.1236)" },
        { emo: 'EUR', name: '欧元', act: "BANK.fxDo('欧元',7.8420)" },
        { emo: 'JPY', name: '日元', act: "BANK.fxDo('日元',0.0472)" },
        { emo: 'HKD', name: '港币', act: "BANK.fxDo('港币',0.9126)" },
        { emo: 'GBP', name: '英镑', act: "BANK.fxDo('英镑',9.0480)" },
        { emo: 'AUD', name: '澳元', act: "BANK.fxDo('澳元',4.6810)" }
      ])}
      ${card(
        row({ ico: 'list', bg: '#eef9ef', name: '我的外币', desc: '查看外币账户余额', act: "BANK.open('myfx')" }) +
        row({ ico: 'receipt', bg: '#eaf3fd', name: '结汇凭证', desc: '打印或下载回单', act: "BANK.open('statement')" })
      )}`
  });

  /* ═══════════ 批量注册：内容型业务页（数据驱动，便于继续扩） ═══════════ */
  const pageHTML = p => `
    ${p.note ? `<div class="bz-warn">${p.note}</div>` : ''}
    ${p.list && p.list.length ? card(p.list.map(row).join('')) : ''}
    ${p.mid || ''}
    ${p.tiles && p.tiles.length ? tiles(p.tiles) : ''}
    ${p.main || ''}
    ${p.foot ? `<p class="bz-tip">${p.foot}</p>` : ''}`;

  const PAGES = {
    /* ─── 卡片与账户 ─── */
    cardtxn: {
      t: '交易明细', note: '尾号 8888 · 近 30 天共 42 笔',
      list: [
        { ico: 'gift', bg: '#fdeff7', name: '消费 · 谷谷屋（吧唧x3）', desc: '09-26 19:44', act: "BANK.open('txndetail')", right: '-286.00' },
        { ico: 'salary', bg: '#eef9ef', name: '工资代发', desc: '09-26 10:02', act: "BANK.open('txndetail')", right: '+12,600.00' },
        { ico: 'shield', bg: '#eaf3fd', name: '出谷通 · 托管放款', desc: '09-25 21:12', act: "BANK.open('txndetail')", right: '+860.00' },
        { ico: 'chart', bg: '#fff6e6', name: '理财收益 · 随心盈', desc: '09-25 08:00', act: "BANK.open('txndetail')", right: '+32.60' }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '筛选', act: "BANK.open('txnfilter')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '导出流水', act: "BANK.open('statement')" },
        { ico: 'shield', bg: '#e9f7f5', name: '交易申诉', act: "BANK.open('help')" },
        { ico: 'gear', bg: '#f0f0f2', name: '卡片管理', act: "BANK.open('cardmgr')" }
      ]
    },
    txndetail: {
      t: '交易详情',
      list: [
        { ico: 'gift', bg: '#fdeff7', name: '交易类型', desc: 'POS 消费', act: "BANK.tip('演示')" },
        { ico: 'list', bg: '#eef9ef', name: '交易金额', desc: '支出 ￥286.00', act: "BANK.tip('演示')" },
        { ico: 'bank', bg: '#eaf3fd', name: '交易商户', desc: '谷谷屋（上海黄浦店）', act: "BANK.tip('演示')" }
      ],
      tiles: [
        { ico: 'receipt', bg: '#eaf3fd', name: '开电子回单', act: "BANK.open('statement')" },
        { ico: 'shield', bg: '#e9f7f5', name: '对账有疑问', act: "BANK.open('help')" },
        { ico: 'gift', bg: '#fdeff7', name: '该商户账单', act: "BANK.open('cardtxn')" },
        { ico: 'chart', bg: '#fff6e6', name: '本月支出分析', act: "BANK.open('spendana')" }
      ]
    },
    txnfilter: {
      t: '筛选条件',
      list: [
        { ico: 'list', bg: '#eef9ef', name: '全部交易', desc: '收入与支出', act: "BANK.filterPick('全部')" },
        { ico: 'transfer', bg: '#fdecec', name: '只看支出', desc: '消费 / 转账 / 缴费', act: "BANK.filterPick('支出')" },
        { ico: 'salary', bg: '#e9f7f5', name: '只看收入', desc: '工资 / 收款 / 收益', act: "BANK.filterPick('收入')" },
        { ico: 'gold', bg: '#fff6e6', name: '只看理财', desc: '申购与收益', act: "BANK.filterPick('理财')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '近 7 天', act: "BANK.filterPick('近7天')" },
        { ico: 'list', bg: '#eef9ef', name: '近 30 天', act: "BANK.filterPick('近30天')" },
        { ico: 'list', bg: '#eef9ef', name: '近 1 年', act: "BANK.filterPick('近1年')" },
        { ico: 'gear', bg: '#f0f0f2', name: '自定义区间', act: "BANK.tip('演示环境：自定义区间')" }
      ]
    },
    spendana: {
      t: '本月支出分析',
      note: '09 月共支出 ￥8,642.30，环比 ↑ 12.4%',
      list: [
        { ico: 'bear', bg: '#fdeff7', name: '谷子周边', desc: '占比 46%', act: "BANK.tip('演示')", right: '￥3,976' },
        { ico: 'noodle', bg: '#fdecec', name: '餐饮外卖', desc: '占比 21%', act: "BANK.tip('演示')", right: '￥1,815' },
        { ico: 'car', bg: '#e9f7f5', name: '交通出行', desc: '占比 14%', act: "BANK.tip('演示')", right: '￥1,210' },
        { ico: 'receipt', bg: '#fff6e6', name: '生活缴费', desc: '占比 11%', act: "BANK.tip('演示')", right: '￥951' }
      ],
      tiles: [
        { ico: 'chart', bg: '#fdeff7', name: '近半年趋势', act: "BANK.tip('演示环境：趋势图')" },
        { ico: 'list', bg: '#eef9ef', name: '看明细', act: "BANK.open('cardtxn')" },
        { ico: 'gift', bg: '#fdeff7', name: '设预算', act: "BANK.open('budget')" }
      ]
    },
    budget: {
      t: '消费预算',
      note: '给「谷子周边」设一个月度预算，超了会有提醒',
      list: [
        { ico: 'bear', bg: '#fdeff7', name: '谷子周边预算', desc: '已用 46%', act: "BANK.tip('演示：可拖动调整')", right: '￥4,000 / 月' },
        { ico: 'noodle', bg: '#fdecec', name: '餐饮预算', desc: '已用 21%', act: "BANK.tip('演示：可拖动调整')", right: '￥2,000 / 月' }
      ],
      tiles: [
        { ico: 'gear', bg: '#f0f0f2', name: '修改预算', act: "BANK.tip('演示环境')" },
        { ico: 'chart', bg: '#fdeff7', name: '预算报表', act: "BANK.open('spendana')" },
        { ico: 'list', bg: '#eef9ef', name: '超支提醒设置', act: "BANK.open('settings')" }
      ]
    },
    cardlock: {
      t: '安全锁', note: '按需开关：关闭后该类交易将被拦截，防盗刷最直接的一招。',
      list: [
        { ico: 'pay', bg: '#eaf3fd', name: '境外交易锁', desc: '当前：已开启', act: "BANK.tip('境外交易锁：已切换')" },
        { ico: 'wifi', bg: '#f0ecfd', name: '线上支付锁', desc: '当前：已关闭', act: "BANK.tip('线上支付锁：已切换')" },
        { ico: 'transfer', bg: '#fdecec', name: '夜间交易锁', desc: '23:00-06:00 拦截', act: "BANK.tip('夜间交易锁：已切换')" }
      ],
      tiles: [
        { ico: 'shield', bg: '#e9f7f5', name: '一键锁卡', act: "BANK.tip('卡片已锁定（演示）')" },
        { ico: 'gold', bg: '#fff6e6', name: '限额管理', act: "BANK.open('limits')" },
        { ico: 'list', bg: '#eef9ef', name: '拦截记录', act: "BANK.open('locklog')" },
        { ico: 'headset', bg: '#eaf3fd', name: '联系客服', act: "BANK.open('help')" }
      ]
    },
    locklog: {
      t: '拦截记录', note: '近 30 天共拦截 3 笔可疑交易',
      list: [
        { ico: 'shield', bg: '#fdecec', name: '境外线上支付 ￥2,860.00', desc: '09-24 03:12 · 已拦截', act: "BANK.open('help')" },
        { ico: 'shield', bg: '#fdecec', name: '境外线上支付 ￥990.00', desc: '09-21 02:48 · 已拦截', act: "BANK.open('help')" },
        { ico: 'shield', bg: '#fdecec', name: '境外线上支付 ￥3,200.00', desc: '09-18 04:05 · 已拦截', act: "BANK.open('help')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '看全部记录', act: "BANK.open('cardtxn')" },
        { ico: 'gear', bg: '#f0f0f2', name: '锁设置', act: "BANK.open('cardlock')" },
        { ico: 'headset', bg: '#eaf3fd', name: '被盗刷怎么办', act: "BANK.open('help')" }
      ]
    },
    smallpay: {
      t: '免密支付', note: '单笔 ￥1,000 以下可免密，超过则需验证密码或指纹。',
      list: [
        { ico: 'finger', bg: '#f0ecfd', name: '指纹支付', desc: '已开启', act: "BANK.tip('指纹支付：已切换')" },
        { ico: 'pay', bg: '#eaf3fd', name: '刷脸支付', desc: '已开启', act: "BANK.tip('刷脸支付：已切换')" },
        { ico: 'bolt', bg: '#fff6e6', name: '小额免密', desc: '￥1,000 以下', act: "BANK.tip('小额免密：额度可调')" }
      ],
      tiles: [
        { ico: 'gold', bg: '#fff6e6', name: '调整免密额度', act: "BANK.open('limits')" },
        { ico: 'shield', bg: '#e9f7f5', name: '安全中心', act: "BANK.open('security')" },
        { ico: 'list', bg: '#eef9ef', name: '免密交易记录', act: "BANK.open('cardtxn')" }
      ]
    },
    cardmgr: {
      t: '卡片管理',
      list: [
        { ico: 'gear', bg: '#f0f0f2', name: '修改交易密码', desc: '每 90 天建议更换一次', act: "BANK.open('chpwd')" },
        { ico: 'credit', bg: '#eaf3fd', name: '卡片挂失', desc: '丢失时紧急冻结', act: "BANK.open('cardloss')" },
        { ico: 'list', bg: '#eef9ef', name: '换卡 / 补卡', desc: '卡片损坏或到期换新', act: "BANK.open('reissue')" },
        { ico: 'shield', bg: '#e9f7f5', name: '注销卡片', desc: '注销后不可恢复', act: "BANK.open('cancelcard')" }
      ],
      tiles: [
        { ico: 'gold', bg: '#fff6e6', name: '限额设置', act: "BANK.open('limits')" },
        { ico: 'list', bg: '#eef9ef', name: '交易明细', act: "BANK.open('cardtxn')" },
        { ico: 'headset', bg: '#eaf3fd', name: '咨询客服', act: "BANK.open('help')" },
        { ico: 'credit', bg: '#eaf3fd', name: '我的银行卡', act: "BANK.open('mycards')" }
      ]
    },
    chpwd: {
      t: '修改交易密码',
      note: '为保障用卡安全，请勿使用生日、连号等易被猜到的组合。',
      main: `<button class="bz-main" onclick="BANK.pwdOk()">下一步 · 输入新密码</button>`,
      tiles: [
        { ico: 'shield', bg: '#e9f7f5', name: '忘记密码', act: "BANK.open('resetpwd')" },
        { ico: 'finger', bg: '#f0ecfd', name: '改用指纹', act: "BANK.open('smallpay')" },
        { ico: 'headset', bg: '#eaf3fd', name: '联系客服', act: "BANK.open('help')" }
      ]
    },
    resetpwd: {
      t: '重置密码',
      note: '将通过银行预留手机号 + 身份证信息完成重置。',
      list: [
        { ico: 'user', bg: '#eaf3fd', name: '验证身份信息', desc: '姓名 + 证件号', act: "BANK.tip('演示环境：身份校验')" },
        { ico: 'tel', bg: '#eef9ef', name: '短信验证', desc: '138****5678', act: "BANK.bindSendCode()" },
        { ico: 'finger', bg: '#f0ecfd', name: '人脸识别', desc: '眨眨眼即可完成', act: "BANK.tip('演示环境：人脸识别')" }
      ],
      tiles: [
        { ico: 'headset', bg: '#eaf3fd', name: '去网点办理', act: "BANK.open('branch')" },
        { ico: 'shield', bg: '#e9f7f5', name: '安全中心', act: "BANK.open('security')" },
        { ico: 'list', bg: '#eef9ef', name: '密码规则', act: "BANK.open('help')" }
      ]
    },
    reissue: {
      t: '换卡 / 补卡',
      list: [
        { ico: 'credit', bg: '#eaf3fd', name: '同号换卡', desc: '保留原卡号 · 7 个工作日', act: "BANK.tip('已提交同号换卡申请（演示）')" },
        { ico: 'list', bg: '#eef9ef', name: '异号换卡', desc: '即时出卡 · 卡号变更', act: "BANK.tip('已提交异号换卡申请（演示）')" },
        { ico: 'building', bg: '#fff6e6', name: '网点领卡', desc: '就近网点自取免邮费', act: "BANK.open('branch')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '申请进度', act: "BANK.open('creditprogress')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '换卡须知', act: "BANK.open('help')" },
        { ico: 'gear', bg: '#f0f0f2', name: '卡片管理', act: "BANK.open('cardmgr')" }
      ]
    },
    cancelcard: {
      t: '注销卡片',
      note: '注销前请确认：卡内已无余额、无未结清分期、无签约代扣。注销不可撤销。',
      main: `<button class="bz-main" onclick="BANK.tip('演示环境：注销申请已提交')">提交注销申请</button>`,
      tiles: [
        { ico: 'receipt', bg: '#eaf3fd', name: '注销须知', act: "BANK.open('help')" },
        { ico: 'list', bg: '#eef9ef', name: '未结清业务', act: "BANK.open('myloans')" },
        { ico: 'headset', bg: '#eaf3fd', name: '联系客服', act: "BANK.open('help')" }
      ]
    },
    repay: {
      t: '一键还款',
      note: '本期账单 ￥2,386.40 · 到期还款日 10 月 25 日',
      list: [
        { ico: 'credit', bg: '#f0ecfd', name: '全额还款', desc: '还清本期账单 ￥2,386.40', act: "BANK.open('repayok','全额')", right: '推荐' },
        { ico: 'gold', bg: '#fff6e6', name: '最低还款', desc: '￥238.64 · 余款计息', act: "BANK.open('repayok','最低')" },
        { ico: 'list', bg: '#eef9ef', name: '分期还款', desc: '3 / 6 / 12 期可选', act: "BANK.open('installment')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '账单明细', act: "BANK.open('cardtxn')" },
        { ico: 'gear', bg: '#f0f0f2', name: '自动还款设置', act: "BANK.open('autorepay')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '历史账单', act: "BANK.open('billhist')" }
      ]
    },
    repayok: {
      t: '还款结果',
      render: null
    },
    installment: {
      t: '账单分期',
      list: [
        { ico: 'list', bg: '#eef9ef', name: '3 期 · 手续费 0.75%/期', desc: '每期 ￥811.2', act: "BANK.tip('已申请 3 期分期（演示）')" },
        { ico: 'list', bg: '#eef9ef', name: '6 期 · 手续费 0.68%/期', desc: '每期 ￥415.3', act: "BANK.tip('已申请 6 期分期（演示）')" },
        { ico: 'list', bg: '#eef9ef', name: '12 期 · 手续费 0.62%/期', desc: '每期 ￥212.7', act: "BANK.tip('已申请 12 期分期（演示）')" }
      ],
      tiles: [
        { ico: 'chart', bg: '#fdeff7', name: '分期试算', act: "BANK.open('loancalc')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '分期协议', act: "BANK.open('help')" },
        { ico: 'credit', bg: '#eaf3fd', name: '我的分期', act: "BANK.open('myloans')" }
      ]
    },
    autorepay: {
      t: '自动还款设置',
      list: [
        { ico: 'transfer', bg: '#fdecec', name: '全额自动还款', desc: '到期日从储蓄卡扣款', act: "BANK.tip('已开启全额自动还款（演示）')" },
        { ico: 'gold', bg: '#fff6e6', name: '最低额自动还款', desc: '避免逾期，余款计息', act: "BANK.tip('已开启最低额自动还款（演示）')" },
        { ico: 'credit', bg: '#eaf3fd', name: '扣款账户', desc: '储蓄卡（****8888）', act: "BANK.open('mycards')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '还款记录', act: "BANK.open('cardtxn')" },
        { ico: 'gear', bg: '#f0f0f2', name: '关闭自动还款', act: "BANK.tip('已关闭（演示）')" },
        { ico: 'headset', bg: '#eaf3fd', name: '咨询客服', act: "BANK.open('help')" }
      ]
    },

    /* ─── 缴费与充值 ─── */
    billhist: {
      t: '缴费记录', note: '近 12 个月共 27 笔',
      list: [
        { ico: 'bolt', bg: '#fff6e6', name: '电费 · 户号 8888', desc: '09-20', act: "BANK.open('txndetail')", right: '￥236.40' },
        { ico: 'water', bg: '#eaf3fd', name: '水费 · 户号 8888', desc: '09-20', act: "BANK.open('txndetail')", right: '￥128.60' },
        { ico: 'gas', bg: '#fdecec', name: '燃气费 · 户号 8888', desc: '08-19', act: "BANK.open('txndetail')", right: '￥88.00' },
        { ico: 'building', bg: '#eef9ef', name: '物业费 · 工银大厦 20F', desc: '08-01', act: "BANK.open('txndetail')", right: '￥560.00' }
      ],
      tiles: [
        { ico: 'receipt', bg: '#eaf3fd', name: '开缴费回单', act: "BANK.open('statement')" },
        { ico: 'gift', bg: '#fdeff7', name: '签约代扣', act: "BANK.open('billauto')" },
        { ico: 'list', bg: '#eef9ef', name: '继续缴费', act: "BANK.open('paybill')" },
        { ico: 'chart', bg: '#fff6e6', name: '支出分析', act: "BANK.open('spendana')" }
      ]
    },
    billauto: {
      t: '签约代扣', note: '签约后每月自动从储蓄卡扣缴，再也不会忘记缴费。',
      list: [
        { ico: 'bolt', bg: '#fff6e6', name: '电费代扣', desc: '每月 25 日自动', act: "BANK.tip('电费代扣已签约（演示）')" },
        { ico: 'water', bg: '#eaf3fd', name: '水费代扣', desc: '每月 25 日自动', act: "BANK.tip('水费代扣已签约（演示）')" },
        { ico: 'wifi', bg: '#e9f7f5', name: '宽带代扣', desc: '每年自动续费', act: "BANK.tip('宽带代扣已签约（演示）')" }
      ],
      tiles: [
        { ico: 'gear', bg: '#f0f0f2', name: '管理签约', act: "BANK.tip('演示环境：签约管理')" },
        { ico: 'list', bg: '#eef9ef', name: '代扣记录', act: "BANK.open('billhist')" },
        { ico: 'credit', bg: '#eaf3fd', name: '更换扣款卡', act: "BANK.open('mycards')" }
      ]
    },
    rechargecustom: {
      t: '自定义充值',
      main: `<div class="bz-card"><div class="bz-form"><label>充值金额（元）</label>
        <input id="rchgAmt" type="number" placeholder="请输入 1-500 元" value="150"></div></div>
        <button class="bz-main" onclick="BANK.rechargeDo(+((document.getElementById('rchgAmt')||{}).value||0))">立即充值</button>`,
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '充值记录', act: "BANK.open('rechargehist')" },
        { ico: 'gift', bg: '#fdeff7', name: '充值优惠', act: "BANK.open('rechargepromo')" },
        { ico: 'headset', bg: '#eaf3fd', name: '充值不到账', act: "BANK.open('help')" }
      ]
    },
    rechargehist: {
      t: '充值记录', note: '近 6 个月共 11 笔',
      list: [
        { ico: 'charge', bg: '#eaf3fd', name: '本机 138****5678', desc: '09-21 09:30', act: "BANK.open('txndetail')", right: '￥100.00' },
        { ico: 'charge', bg: '#eaf3fd', name: '本机 138****5678', desc: '08-18 20:12', act: "BANK.open('txndetail')", right: '￥50.00' },
        { ico: 'charge', bg: '#eaf3fd', name: '亲情号 139****2233', desc: '08-02 11:05', act: "BANK.open('txndetail')", right: '￥100.00' }
      ],
      tiles: [
        { ico: 'charge', bg: '#eaf3fd', name: '再充一笔', act: "BANK.open('recharge')" },
        { ico: 'receipt', bg: '#eef9ef', name: '开发票', act: "BANK.open('statement')" },
        { ico: 'user', bg: '#f0ecfd', name: '管理亲情号', act: "BANK.tip('演示环境：亲情号管理')" }
      ]
    },
    rechargepromo: {
      t: '充值优惠',
      list: [
        { ico: 'gift', bg: '#fdeff7', name: '满 100 减 3', desc: '每月 1 次 · 工行卡专享', act: "BANK.tip('优惠券已领取（演示）')" },
        { ico: 'gift', bg: '#fdeff7', name: '首充立减 5 元', desc: '新用户专享', act: "BANK.tip('优惠券已领取（演示）')" },
        { ico: 'gold', bg: '#fff6e6', name: 'i豆抵话费', desc: '1000 i豆 = 10 元话费', act: "BANK.open('points')" }
      ],
      tiles: [
        { ico: 'charge', bg: '#eaf3fd', name: '去充值', act: "BANK.open('recharge')" },
        { ico: 'list', bg: '#eef9ef', name: '充值记录', act: "BANK.open('rechargehist')" },
        { ico: 'receipt', bg: '#eef9ef', name: '优惠规则', act: "BANK.open('help')" }
      ]
    },

    /* ─── 理财与存款 ─── */
    wealthbuy: {
      t: p => '购买 · ' + (p || '理财产品'),
      render: null
    },
    holdings: {
      t: '我的持仓', note: '总市值 ￥86,420.00 · 昨日收益 +￥32.60',
      list: [
        { ico: 'chart', bg: '#fdeff7', name: '随心盈90天', desc: '持有 ￥50,000 · 收益 +￥412.30', act: "BANK.open('yieldcurve')", right: '+0.82%' },
        { ico: 'bolt', bg: '#eef9ef', name: '日升息·现金宝', desc: '持有 ￥30,000 · 收益 +￥186.40', act: "BANK.open('yieldcurve')", right: '+0.62%' },
        { ico: 'gold', bg: '#fff6e6', name: '工银黄金ETF联接', desc: '持有 ￥6,420 · 收益 +￥1,168', act: "BANK.open('yieldcurve')", right: '+18.2%' }
      ],
      tiles: [
        { ico: 'chart', bg: '#fdeff7', name: '收益走势', act: "BANK.open('yieldcurve')" },
        { ico: 'gold', bg: '#fff6e6', name: '赎回', act: "BANK.tip('演示环境：赎回到账 T+1')" },
        { ico: 'list', bg: '#eef9ef', name: '交易记录', act: "BANK.open('cardtxn')" },
        { ico: 'edu', bg: '#eaf3fd', name: '理财课堂', act: "BANK.open('wealthclass')" }
      ]
    },
    yieldcurve: {
      t: '收益走势',
      mid: `<div class="bz-card" style="padding:14px"><canvas id="bzCurve" style="width:100%;height:170px;display:block"></canvas>
        <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#98a0ad;margin-top:8px"><span>08-31</span><span>09-15</span><span>09-30</span></div></div>`,
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '近 1 月', act: "BANK.tip('已切换：近 1 月')" },
        { ico: 'list', bg: '#eef9ef', name: '近 3 月', act: "BANK.tip('已切换：近 3 月')" },
        { ico: 'list', bg: '#eef9ef', name: '近 1 年', act: "BANK.tip('已切换：近 1 年')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '收益明细', act: "BANK.open('cardtxn')" }
      ]
    },
    riskquiz: {
      t: '风险承受能力测评', note: '共 5 题，约 1 分钟。测评结果决定你能买哪些风险等级的产品。',
      mid: `<div class="bz-card"><div style="padding:14px;font-size:13px;line-height:1.9">
        <b>1. 您的投资经验？</b><br>A. 只买过存款　B. 买过银行理财　C. 买过基金股票</div></div>`,
      tiles: [
        { ico: 'edu', bg: '#eaf3fd', name: '开始测评', act: "BANK.tip('演示环境：测评已提交，结果 = 稳健型 R2')" },
        { ico: 'list', bg: '#eef9ef', name: '上次结果', act: "BANK.tip('稳健型 R2 · 有效期至 2027-09')" },
        { ico: 'shield', bg: '#e9f7f5', name: '测评说明', act: "BANK.open('help')" }
      ]
    },
    wealthclass: {
      t: '理财课堂',
      list: [
        { ico: 'edu', bg: '#eaf3fd', name: '什么是业绩比较基准？', desc: '3 分钟读懂理财说明书', act: "BANK.tip('演示环境：视频播放')" },
        { ico: 'edu', bg: '#eef9ef', name: 'R1-R5 风险等级怎么分', desc: '买之前先认清自己的风险偏好', act: "BANK.tip('演示环境：图文课程')" },
        { ico: 'edu', bg: '#fff6e6', name: '净值型理财怎么看收益', desc: '七日年化 vs 万份收益', act: "BANK.tip('演示环境：图文课程')" }
      ],
      tiles: [
        { ico: 'chart', bg: '#fdeff7', name: '去挑产品', act: "BANK.open('wealth')" },
        { ico: 'shield', bg: '#e9f7f5', name: '做风险测评', act: "BANK.open('riskquiz')" },
        { ico: 'headset', bg: '#eaf3fd', name: '问理财经理', act: "BANK.open('help')" }
      ]
    },
    cd: {
      t: '大额存单',
      list: [
        { ico: 'bank', bg: '#eaf3fd', name: '大额存单 20 万 · 3 年', desc: '年利率 2.65% · 可转让', act: "BANK.depDo('大额存单3年',2.65)" },
        { ico: 'bank', bg: '#eaf3fd', name: '大额存单 30 万 · 2 年', desc: '年利率 2.35% · 可转让', act: "BANK.depDo('大额存单2年',2.35)" },
        { ico: 'bank', bg: '#eaf3fd', name: '大额存单 50 万 · 1 年', desc: '年利率 1.95% · 可转让', act: "BANK.depDo('大额存单1年',1.95)" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '我的存单', act: "BANK.open('mydeposits')" },
        { ico: 'chart', bg: '#fdeff7', name: '利息试算', act: "BANK.open('depcalc')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '转让规则', act: "BANK.open('help')" }
      ]
    },
    mydeposits: {
      t: '我的定期', note: '持有 2 笔 · 合计 ￥100,000.00',
      list: [
        { ico: 'bank', bg: '#eaf3fd', name: '整存整取 3 年 · ￥50,000', desc: '到期日 2028-09-19 · 利率 2.35%', act: "BANK.tip('演示环境：可提前支取')" },
        { ico: 'bank', bg: '#eaf3fd', name: '大额存单 3 年 · ￥50,000', desc: '到期日 2028-06-01 · 利率 2.65%', act: "BANK.tip('演示环境：可转让')" }
      ],
      tiles: [
        { ico: 'bank', bg: '#eaf3fd', name: '再存一笔', act: "BANK.open('deposit')" },
        { ico: 'chart', bg: '#fdeff7', name: '利息试算', act: "BANK.open('depcalc')" },
        { ico: 'receipt', bg: '#eef9ef', name: '存款证明', act: "BANK.open('statement')" },
        { ico: 'list', bg: '#eef9ef', name: '到期提醒', act: "BANK.open('settings')" }
      ]
    },
    depcalc: {
      t: '利息试算',
      mid: `<div class="bz-card"><div class="bz-form"><label>本金（元）</label>
        <input id="calcAmt" type="number" value="50000" oninput="BANK.depCalcLive()"></div>
        <div class="bz-form"><label>存期</label>
        <select id="calcTerm" onchange="BANK.depCalcLive()" style="width:100%;border:none;outline:none;font-size:16px;font-weight:600;padding:9px 0;border-bottom:1.5px solid #eef1f6;background:transparent">
          <option value="1.35">3 个月（1.35%）</option><option value="1.55">6 个月（1.55%）</option>
          <option value="1.75" selected>1 年（1.75%）</option><option value="2.35">3 年（2.35%）</option></select></div>
        <div id="calcOut" style="padding:0 14px 14px;font-size:13px;color:#c7000b;font-weight:700">到期利息约 ￥875.00</div></div>`,
      tiles: [
        { ico: 'bank', bg: '#eaf3fd', name: '立即存入', act: "BANK.open('deposit')" },
        { ico: 'list', bg: '#eef9ef', name: '我的定期', act: "BANK.open('mydeposits')" },
        { ico: 'chart', bg: '#fdeff7', name: '对比理财', act: "BANK.open('wealth')" }
      ]
    },

    /* ─── 贷款与信用卡 ─── */
    loanapply: {
      t: p => '申请 · ' + (p || '贷款'),
      note: '线上申请最快 5 分钟出额度，放款直接进储蓄卡。',
      mid: `<div class="bz-card"><div class="bz-form"><label>申请金额（元）</label>
        <input id="loanAmt" type="number" value="100000"></div>
        <div class="bz-form"><label>分期期数</label>
        <select id="loanTerm" style="width:100%;border:none;outline:none;font-size:16px;font-weight:600;padding:9px 0;border-bottom:1.5px solid #eef1f6;background:transparent">
          <option>12 期</option><option selected>24 期</option><option>36 期</option></select></div></div>`,
      main: `<button class="bz-main" onclick="BANK.loanDo()">提交申请</button>`,
      tiles: [
        { ico: 'chart', bg: '#fdeff7', name: '额度试算', act: "BANK.open('loancalc')" },
        { ico: 'list', bg: '#eef9ef', name: '我的贷款', act: "BANK.open('myloans')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '申请条件', act: "BANK.open('help')" }
      ]
    },
    loancalc: {
      t: '还款试算',
      mid: `<div class="bz-card"><div class="bz-form"><label>贷款金额（元）</label>
        <input id="lcAmt" type="number" value="100000" oninput="BANK.loanCalcLive()"></div>
        <div class="bz-form"><label>期数</label>
        <select id="lcTerm" onchange="BANK.loanCalcLive()" style="width:100%;border:none;outline:none;font-size:16px;font-weight:600;padding:9px 0;border-bottom:1.5px solid #eef1f6;background:transparent">
          <option value="12">12 期</option><option value="24" selected>24 期</option><option value="36">36 期</option></select></div>
        <div id="lcOut" style="padding:0 14px 14px;font-size:13px;color:#c7000b;font-weight:700;line-height:1.9">
          月供约 ￥4,323.00<br><span style="font-weight:400;color:#5f6b7a">按年化 3.45% 等额本息估算</span></div></div>`,
      tiles: [
        { ico: 'bolt', bg: '#fff6e6', name: '去申请', act: "BANK.open('loanapply','融e借')" },
        { ico: 'list', bg: '#eef9ef', name: '我的贷款', act: "BANK.open('myloans')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '还款计划', act: "BANK.open('repayplan')" }
      ]
    },
    myloans: {
      t: '我的贷款', note: '当前 1 笔未结清 · 剩余本金 ￥68,420.00',
      list: [
        { ico: 'bolt', bg: '#fff6e6', name: '融e借 · ￥100,000 / 24 期', desc: '已还 8 期 · 下期还款 10-08', act: "BANK.open('repayplan')" }
      ],
      tiles: [
        { ico: 'receipt', bg: '#eaf3fd', name: '还款计划', act: "BANK.open('repayplan')" },
        { ico: 'transfer', bg: '#fdecec', name: '提前还款', act: "BANK.tip('演示环境：提前还款试算')" },
        { ico: 'chart', bg: '#fdeff7', name: '结清试算', act: "BANK.open('loancalc')" },
        { ico: 'headset', bg: '#eaf3fd', name: '咨询客服', act: "BANK.open('help')" }
      ]
    },
    repayplan: {
      t: '还款计划',
      list: [
        { ico: 'list', bg: '#eef9ef', name: '第 9 期 · 10-08', desc: '本金 ￥3,875.20 + 利息 ￥195.60', act: "BANK.tip('演示')", right: '待还' },
        { ico: 'list', bg: '#f0f0f2', name: '第 8 期 · 09-08', desc: '本金 ￥3,864.10 + 利息 ￥206.70', act: "BANK.open('txndetail')", right: '已还' },
        { ico: 'list', bg: '#f0f0f2', name: '第 7 期 · 08-08', desc: '本金 ￥3,853.00 + 利息 ￥217.80', act: "BANK.open('txndetail')", right: '已还' }
      ],
      tiles: [
        { ico: 'receipt', bg: '#eaf3fd', name: '导出台账', act: "BANK.open('statement')" },
        { ico: 'transfer', bg: '#fdecec', name: '提前还款', act: "BANK.tip('演示环境：提前还款')" },
        { ico: 'list', bg: '#eef9ef', name: '全部期数', act: "BANK.tip('演示环境：共 24 期')" }
      ]
    },
    creditform: {
      t: p => '申请 · ' + (p || '信用卡'),
      note: '资料仅用于额度审批，演示环境不会上传任何真实信息。',
      mid: `<div class="bz-card"><div class="bz-form">
        <label>姓名</label><input type="text" value="李**">
        <label style="margin-top:12px">身份证号</label><input type="text" value="3101**********8888">
        <label style="margin-top:12px">工作单位</label><input type="text" value="某科技有限公司">
        <label style="margin-top:12px">年收入（万元）</label><input type="number" value="24"></div></div>`,
      main: `<button class="bz-main" onclick="BANK.tip('申请已提交（演示）：审核结果将以短信通知')">提交申请</button>`,
      tiles: [
        { ico: 'chart', bg: '#fdeff7', name: '额度测算', act: "BANK.open('creditcalc')" },
        { ico: 'list', bg: '#eef9ef', name: '申请进度', act: "BANK.open('creditprogress')" },
        { ico: 'edu', bg: '#eaf3fd', name: '办卡须知', act: "BANK.open('credithelp')" }
      ]
    },
    creditcalc: {
      t: '额度测算',
      mid: `<div class="bz-card"><div class="bz-form"><label>月收入（元）</label>
        <input id="ccInc" type="number" value="20000" oninput="BANK.ccCalcLive()"></div>
        <div class="bz-form"><label>是否有房 / 车</label>
        <select id="ccAsset" onchange="BANK.ccCalcLive()" style="width:100%;border:none;outline:none;font-size:16px;font-weight:600;padding:9px 0;border-bottom:1.5px solid #eef1f6;background:transparent">
          <option value="0">都没有</option><option value="1">有其一</option><option value="2" selected>房车都有</option></select></div>
        <div id="ccOut" style="padding:0 14px 14px;font-size:13px;color:#c7000b;font-weight:700">预估额度 ￥50,000 - ￥80,000</div></div>`,
      tiles: [
        { ico: 'credit', bg: '#eaf3fd', name: '去申请', act: "BANK.open('creditapply')" },
        { ico: 'list', bg: '#eef9ef', name: '申请进度', act: "BANK.open('creditprogress')" },
        { ico: 'receipt', bg: '#eef9ef', name: '额度规则', act: "BANK.open('credithelp')" }
      ]
    },
    creditprogress: {
      t: '申请进度',
      list: [
        { ico: 'list', bg: '#fff6e6', name: '谷卡 · IP联名卡', desc: '已提交资料 · 审核中', act: "BANK.tip('演示环境：审核中')", right: '审核中' },
        { ico: 'credit', bg: '#eef9ef', name: '工银World奋斗卡', desc: '已核发 · 顺丰已寄出', act: "BANK.open('mail')", right: '已寄出' }
      ],
      tiles: [
        { ico: 'credit', bg: '#eaf3fd', name: '再申一张', act: "BANK.open('creditapply')" },
        { ico: 'chart', bg: '#fdeff7', name: '额度测算', act: "BANK.open('creditcalc')" },
        { ico: 'headset', bg: '#eaf3fd', name: '催办 / 咨询', act: "BANK.open('help')" }
      ]
    },
    credithelp: {
      t: '办卡须知',
      list: [
        { ico: 'user', bg: '#eaf3fd', name: '申请条件', desc: '年满 18 周岁 · 有稳定收入', act: "BANK.tip('演示环境')" },
        { ico: 'list', bg: '#eef9ef', name: '所需资料', desc: '身份证 + 工作证明', act: "BANK.tip('演示环境')" },
        { ico: 'receipt', bg: '#eef9ef', name: '年费政策', desc: '首年免年费，刷 6 次免次年', act: "BANK.tip('演示环境')" },
        { ico: 'shield', bg: '#e9f7f5', name: '用卡安全', desc: '防盗刷的 5 个习惯', act: "BANK.open('security')" }
      ],
      tiles: [
        { ico: 'credit', bg: '#eaf3fd', name: '去申请', act: "BANK.open('creditapply')" },
        { ico: 'headset', bg: '#eaf3fd', name: '问客服', act: "BANK.open('help')" },
        { ico: 'list', bg: '#eef9ef', name: '申请进度', act: "BANK.open('creditprogress')" }
      ]
    },

    /* ─── 结售汇 ─── */
    myfx: {
      t: '我的外币', note: '持有 3 个币种 · 折合人民币 ￥18,640.00',
      list: [
        { ico: 'fx', bg: '#e9f7f5', name: '美元 USD', desc: '现汇账户', act: "BANK.fxDo('美元',7.1236)", right: '$1,860.00' },
        { ico: 'fx', bg: '#e9f7f5', name: '日元 JPY', desc: '现汇账户', act: "BANK.fxDo('日元',0.0472)", right: '¥32,000' },
        { ico: 'fx', bg: '#e9f7f5', name: '港币 HKD', desc: '现汇账户', act: "BANK.fxDo('港币',0.9126)", right: 'HK$920' }
      ],
      tiles: [
        { ico: 'fx', bg: '#e9f7f5', name: '结汇', act: "BANK.open('fx')" },
        { ico: 'list', bg: '#eef9ef', name: '汇率提醒', act: "BANK.tip('已设置汇率到价提醒（演示）')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '交易回单', act: "BANK.open('statement')" }
      ]
    },

    /* ─── 服务与设置 ─── */
    branch: {
      t: '网点查询',
      list: [
        { ico: 'building', bg: '#eaf3fd', name: '工行上海黄浦支行', desc: '中山东一路 24 号 · 距您 0.8km', act: "BANK.tip('已取号：A032 · 前方 5 位')", right: '排队 5 人' },
        { ico: 'building', bg: '#eaf3fd', name: '工行南京东路支行', desc: '南京东路 99 号 · 距您 1.6km', act: "BANK.tip('已取号：B018 · 前方 3 位')", right: '排队 3 人' },
        { ico: 'building', bg: '#eaf3fd', name: '工行人民广场支行', desc: '西藏中路 268 号 · 距您 2.2km', act: "BANK.tip('已取号：C007 · 前方 1 位')", right: '排队 1 人' }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '预约取号', act: "BANK.tip('已预约今天 15:30（演示）')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '大额取现预约', act: "BANK.tip('演示环境：预约成功')" },
        { ico: 'cube', bg: '#fff6e6', name: '外币现钞预约', act: "BANK.tip('演示环境：预约成功')" },
        { ico: 'headset', bg: '#eaf3fd', name: '联系该网点', act: "BANK.tip('演示环境：021-95588')" }
      ]
    },
    statement: {
      t: '电子回单',
      list: [
        { ico: 'receipt', bg: '#eaf3fd', name: '转账电子回单', desc: '最近一笔 · 09-22', act: "BANK.tip('回单已生成（演示）')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '缴费电子回单', desc: '电费 · 09-20', act: "BANK.tip('回单已生成（演示）')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '存款证明', desc: '可用于签证 / 贷款', act: "BANK.tip('存款证明已开具（演示）')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '选择时间范围', act: "BANK.open('txnfilter')" },
        { ico: 'headset', bg: '#eaf3fd', name: '回单真伪验证', act: "BANK.tip('演示环境：可输验证码核验')" },
        { ico: 'cube', bg: '#fff6e6', name: '发送到邮箱', act: "BANK.tip('已发送到 li****@mail.com（演示）')" }
      ]
    },
    security: {
      t: '安全中心', note: '最近一次登录：今天 09:41 · 上海 · 本机',
      list: [
        { ico: 'finger', bg: '#f0ecfd', name: '生物识别', desc: '指纹 / 刷脸已开启', act: "BANK.open('smallpay')" },
        { ico: 'gear', bg: '#f0f0f2', name: '修改登录密码', desc: '每 90 天建议更换', act: "BANK.open('chpwd')" },
        { ico: 'watch', bg: '#eaf3fd', name: '设备管理', desc: '已登录 2 台设备', act: "BANK.open('devices')" },
        { ico: 'shield', bg: '#e9f7f5', name: '安全锁', desc: '境外 / 线上 / 夜间交易', act: "BANK.open('cardlock')" },
        { ico: 'gold', bg: '#fff6e6', name: '限额管理', desc: '单笔 / 日累计 / 月累计', act: "BANK.open('limits')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '登录记录', act: "BANK.open('loginlog')" },
        { ico: 'headset', bg: '#eaf3fd', name: '反诈小课堂', act: "BANK.open('antifraud')" },
        { ico: 'receipt', bg: '#eef9ef', name: '安全体检', act: "BANK.tip('安全体检完成：账户状态良好（演示）')" }
      ]
    },
    devices: {
      t: '设备管理',
      list: [
        { ico: 'tel', bg: '#eef9ef', name: '本机 · iPhone 16 Pro', desc: '当前设备 · 上海', act: "BANK.tip('这是当前设备')", right: '在线' },
        { ico: 'tel', bg: '#f0f0f2', name: 'iPad Air', desc: '上次活跃 09-24 20:11', act: "BANK.tip('已下线该设备（演示）')", right: '未活跃' }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '登录记录', act: "BANK.open('loginlog')" },
        { ico: 'shield', bg: '#e9f7f5', name: '异常设备提醒', act: "BANK.open('settings')" },
        { ico: 'headset', bg: '#eaf3fd', name: '不是我登录的', act: "BANK.open('help')" }
      ]
    },
    loginlog: {
      t: '登录记录',
      list: [
        { ico: 'tel', bg: '#eef9ef', name: '本机 · iPhone 16 Pro', desc: '今天 09:41 · 上海', act: "BANK.tip('本次登录正常')" },
        { ico: 'tel', bg: '#eef9ef', name: '本机 · iPhone 16 Pro', desc: '昨天 21:08 · 上海', act: "BANK.tip('登录正常')" },
        { ico: 'watch', bg: '#f0f0f2', name: 'iPad Air', desc: '09-24 20:11 · 上海', act: "BANK.open('devices')" }
      ],
      tiles: [
        { ico: 'shield', bg: '#e9f7f5', name: '设备管理', act: "BANK.open('devices')" },
        { ico: 'gear', bg: '#f0f0f2', name: '异常的怎么办', act: "BANK.open('help')" },
        { ico: 'headset', bg: '#eaf3fd', name: '联系客服', act: "BANK.open('help')" }
      ]
    },
    antifraud: {
      t: '反诈小课堂',
      list: [
        { ico: 'shield', bg: '#e9f7f5', name: '谷子交易骗局', desc: '“低价收卡后不发货”怎么防', act: "BANK.tip('演示环境：图文课程')" },
        { ico: 'shield', bg: '#e9f7f5', name: '冒充客服退款', desc: '凡是让你转账的都是骗子', act: "BANK.tip('演示环境：图文课程')" },
        { ico: 'shield', bg: '#e9f7f5', name: '虚假投资平台', desc: '高收益保本 = 高风险诈骗', act: "BANK.tip('演示环境：图文课程')" }
      ],
      tiles: [
        { ico: 'credit', bg: '#eaf3fd', name: '我要举报', act: "BANK.tip('已受理举报（演示）')" },
        { ico: 'headset', bg: '#eaf3fd', name: '咨询客服', act: "BANK.open('help')" },
        { ico: 'shield', bg: '#e9f7f5', name: '安全中心', act: "BANK.open('security')" }
      ]
    },
    settings: {
      t: '设置',
      list: [
        { ico: 'gift', bg: '#fdeff7', name: '消息通知', desc: '动账提醒 · 活动推送', act: "BANK.tip('消息通知设置（演示）')" },
        { ico: 'finger', bg: '#f0ecfd', name: '支付设置', desc: '免密 / 指纹 / 刷脸', act: "BANK.open('smallpay')" },
        { ico: 'shield', bg: '#e9f7f5', name: '隐私与安全', desc: '权限、数据、安全中心', act: "BANK.open('security')" },
        { ico: 'gear', bg: '#f0f0f2', name: '通用', desc: '字体大小 · 语言 · 缓存', act: "BANK.tip('通用设置（演示）')" },
        { ico: 'headset', bg: '#eaf3fd', name: '帮助与反馈', desc: '常见问题 · 意见反馈', act: "BANK.open('help')" }
      ],
      tiles: [
        { ico: 'receipt', bg: '#eef9ef', name: '用户协议', act: "BANK.tip('演示环境：用户协议')" },
        { ico: 'shield', bg: '#e9f7f5', name: '隐私政策', act: "BANK.tip('演示环境：隐私政策')" },
        { ico: 'list', bg: '#eef9ef', name: '关于手机银行', act: "BANK.open('aboutbank')" }
      ]
    },
    aboutbank: {
      t: '关于手机银行',
      note: '模拟演示版 · 用于「工行杯」参赛作品《e次元》的功能演示，非中国工商银行官方应用。',
      list: [
        { ico: 'list', bg: '#eef9ef', name: '版本号', desc: 'ICBC Demo v6.2.0（模拟）', act: "BANK.tip('已是最新版本')" },
        { ico: 'shield', bg: '#e9f7f5', name: '安全说明', desc: '不采集、不上传任何真实信息', act: "BANK.open('security')" },
        { ico: 'receipt', bg: '#eef9ef', name: '开源与致谢', desc: '零第三方依赖 · 全静态', act: "BANK.tip('全部插画为原创绘制（演示）')" }
      ],
      tiles: [
        { ico: 'headset', bg: '#eaf3fd', name: '反馈问题', act: "BANK.tip('已收到反馈（演示）')" },
        { ico: 'list', bg: '#eef9ef', name: '检查更新', act: "BANK.tip('已是最新版本')" },
        { ico: 'credit', bg: '#eaf3fd', name: '给个好评', act: "BANK.tip('谢谢主人（演示）')" }
      ]
    },
    help: {
      t: '帮助中心',
      list: [
        { ico: 'headset', bg: '#eaf3fd', name: '在线客服 · 工小智', desc: '7×24 小时智能应答', act: "BANK.home();ICBCApp.openPage('page-xiaozhi')" },
        { ico: 'tel', bg: '#eef9ef', name: '电话客服 95588', desc: '人工服务 9:00-18:00', act: "BANK.tip('演示环境：拨号未开通')" },
        { ico: 'list', bg: '#eef9ef', name: '常见问题', desc: '转账 / 限额 / 绑卡 / 安全', act: "BANK.open('faq')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '意见反馈', desc: '帮我们做得更好', act: "BANK.tip('已提交反馈，感谢主人（演示）')" }
      ],
      tiles: [
        { ico: 'building', bg: '#eaf3fd', name: '网点查询', act: "BANK.open('branch')" },
        { ico: 'shield', bg: '#e9f7f5', name: '反诈课堂', act: "BANK.open('antifraud')" },
        { ico: 'list', bg: '#eef9ef', name: '服务价目表', act: "BANK.tip('演示环境：价目表')" }
      ]
    },
    faq: {
      t: '常见问题',
      list: [
        { ico: 'transfer', bg: '#fdecec', name: '转账多久到账？', desc: '实时 / 普通 / 次日三种', act: "BANK.tip('实时到账：秒级；普通：2 小时内')" },
        { ico: 'credit', bg: '#eaf3fd', name: '怎么添加银行卡？', desc: '我的 → 我的银行卡 → 添加', act: "BANK.open('bindcard')" },
        { ico: 'gold', bg: '#fff6e6', name: '限额怎么改？', desc: '可在限额管理里自助调整', act: "BANK.open('limits')" },
        { ico: 'shield', bg: '#e9f7f5', name: '卡丢了怎么办？', desc: '立即挂失冻结资金', act: "BANK.open('cardloss')" }
      ],
      tiles: [
        { ico: 'headset', bg: '#eaf3fd', name: '还有别的问题', act: "BANK.open('help')" },
        { ico: 'robot', bg: '#f0ecfd', name: '问工小智', act: "BANK.home();ICBCApp.openPage('page-xiaozhi')" },
        { ico: 'list', bg: '#eef9ef', name: '全部问题', act: "BANK.tip('演示环境：共 128 条')" }
      ]
    },
    points: {
      t: '工银i豆',
      note: '当前 8,640 i豆 · 约等于 86.4 元权益',
      list: [
        { ico: 'gift', bg: '#fdeff7', name: '兑换谷店券', desc: '1000 i豆 = 10 元谷店券', act: "BANK.tip('兑换成功（演示）')" },
        { ico: 'charge', bg: '#eaf3fd', name: '抵扣话费', desc: '1000 i豆 = 10 元话费', act: "BANK.open('recharge')" },
        { ico: 'gold', bg: '#fff6e6', name: '换实物好物', desc: '小e 限定周边可兑', act: "ICBCApp.openXingegu('mall')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: 'i豆明细', act: "BANK.open('cardtxn')" },
        { ico: 'magic', bg: '#f0ecfd', name: '赚 i豆任务', act: "BANK.home();ICBCApp.openPage('page-magic')" },
        { ico: 'receipt', bg: '#eef9ef', name: 'i豆规则', act: "BANK.open('help')" }
      ]
    },

    /* ─── 生活场景 ─── */
    food: {
      t: '外卖到家',
      list: [
        { ico: 'noodle', bg: '#fdecec', name: '满 30 减 12', desc: '合作商户通用', act: "BANK.tip('券已领取（演示）')" },
        { ico: 'noodle', bg: '#fdecec', name: '周五五折', desc: '每周五限定', act: "BANK.tip('券已领取（演示）')" },
        { ico: 'noodle', bg: '#fdecec', name: '新客立减 15', desc: '首次下单可用', act: "BANK.tip('券已领取（演示）')" }
      ],
      tiles: [
        { ico: 'receipt', bg: '#eef9ef', name: '我的券包', act: "BANK.tip('券包共 3 张（演示）')" },
        { ico: 'chart', bg: '#fdeff7', name: '本月外卖支出', act: "BANK.open('spendana')" },
        { ico: 'headset', bg: '#eaf3fd', name: '商户合作', act: "BANK.open('help')" }
      ]
    },
    movie: {
      t: '电影演出',
      list: [
        { ico: 'film', bg: '#f0ecfd', name: '9.9 元观影', desc: '每周三 10:00 开抢', act: "BANK.tip('已抢到观影券（演示）')" },
        { ico: 'film', bg: '#f0ecfd', name: '漫展门票', desc: 'CP/GJ 类展会通用', act: "BANK.tip('演示环境：购票')" },
        { ico: 'film', bg: '#f0ecfd', name: '演唱会预售', desc: '二次元歌回前排应援区', act: "BANK.tip('演示环境：购票')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '我的票夹', act: "BANK.tip('票夹共 2 张（演示）')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '选座购票', act: "BANK.tip('演示环境：选座')" },
        { ico: 'headset', bg: '#eaf3fd', name: '退改规则', act: "BANK.open('help')" }
      ]
    },
    taxi: {
      t: '打车出行',
      list: [
        { ico: 'car', bg: '#e9f7f5', name: '5 折打车券', desc: '单笔最高抵 15 元', act: "BANK.tip('券已领取（演示）')" },
        { ico: 'train', bg: '#eaf3fd', name: '乘车码', desc: '公交地铁一码通行', act: "BANK.tip('乘车码已展示（演示）')" },
        { ico: 'plane', bg: '#eef4ff', name: '机票立减', desc: '满 500 减 50', act: "BANK.tip('券已领取（演示）')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '行程记录', act: "BANK.tip('演示环境：行程记录')" },
        { ico: 'chart', bg: '#fdeff7', name: '出行支出分析', act: "BANK.open('spendana')" },
        { ico: 'headset', bg: '#eaf3fd', name: '开发票', act: "BANK.open('statement')" }
      ]
    },
    hotel: {
      t: '酒店民宿',
      list: [
        { ico: 'bed', bg: '#eef4ff', name: '会员价预订', desc: '工行客户专享 8 折', act: "BANK.tip('演示环境：预订')" },
        { ico: 'bed', bg: '#eef4ff', name: '漫展周边酒店', desc: '展会期间优先房源', act: "BANK.tip('演示环境：预订')" },
        { ico: 'bed', bg: '#eef4ff', name: '免费取消房型', desc: '行程有变不心疼', act: "BANK.tip('演示环境：预订')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '我的订单', act: "BANK.tip('演示环境：订单管理')" },
        { ico: 'gift', bg: '#fdeff7', name: '领优惠券', act: "BANK.tip('券已领取（演示）')" },
        { ico: 'headset', bg: '#eaf3fd', name: '客服', act: "BANK.open('help')" }
      ]
    },
    medical: {
      t: '医疗健康',
      list: [
        { ico: 'health', bg: '#eef9ef', name: '预约挂号', desc: '三甲医院在线取号', act: "BANK.tip('演示环境：可预约')" },
        { ico: 'health', bg: '#eef9ef', name: '体检套餐', desc: '工行客户专享折扣', act: "BANK.tip('演示环境：体检预约')" },
        { ico: 'health', bg: '#eef9ef', name: '医保电子凭证', desc: '看病买药一码搞定', act: "BANK.open('social')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '就诊记录', act: "BANK.tip('演示环境：就诊记录')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '缴费记录', act: "BANK.open('billhist')" },
        { ico: 'headset', bg: '#eaf3fd', name: '健康咨询', act: "BANK.open('help')" }
      ]
    },
    travel: {
      t: '出行',
      list: [
        { ico: 'train', bg: '#eaf3fd', name: '铁路购票', desc: '12306 一键支付', act: "BANK.tip('演示环境：购票')" },
        { ico: 'plane', bg: '#eef4ff', name: '机票预订', desc: '工行卡立减 50', act: "BANK.tip('演示环境：订票')" },
        { ico: 'car', bg: '#e9f7f5', name: '租车服务', desc: '随取随还 · 免押金', act: "BANK.tip('演示环境：租车')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '我的行程', act: "BANK.tip('演示环境：行程管理')" },
        { ico: 'charge', bg: '#eaf3fd', name: 'ETC 服务', desc: '高速通行 95 折', act: "BANK.tip('ETC 服务（演示）')" },
        { ico: 'headset', bg: '#eaf3fd', name: '出行客服', act: "BANK.open('help')" }
      ]
    },
    estore: {
      t: '工银e支付',
      note: '一键跳转商户 App 完成支付，无需重复绑卡。',
      list: [
        { ico: 'pay', bg: '#eaf3fd', name: '开通工银e支付', desc: '30 秒完成 · 免密可调', act: "BANK.tip('工银e支付已开通（演示）')" },
        { ico: 'bolt', bg: '#fff6e6', name: '免密额度', desc: '当前 ￥1,000', act: "BANK.open('limits')" },
        { ico: 'shield', bg: '#e9f7f5', name: '支付安全', desc: '每次支付需生物识别', act: "BANK.open('smallpay')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '支付记录', act: "BANK.open('cardtxn')" },
        { ico: 'gear', bg: '#f0f0f2', name: '管理协议', act: "BANK.tip('演示环境：协议管理')" },
        { ico: 'headset', bg: '#eaf3fd', name: '常见问题', act: "BANK.open('faq')" }
      ]
    },
    receive: {
      t: '收款',
      note: '向对方出示下方收款码，或复制账号让对方转账。',
      mid: `<div class="bz-card" style="padding:18px;text-align:center">
        <div style="width:170px;height:170px;margin:0 auto 12px;background:#fff;border-radius:14px;box-shadow:0 4px 16px rgba(31,41,61,.12);display:flex;align-items:center;justify-content:center">
          <div style="font-size:11px;color:#98a0ad;line-height:1.6">收款码<br>Demo QR</div></div>
        <b style="font-size:14px">李** · 尾号 8888</b>
        <div style="font-size:11px;color:#98a0ad;margin-top:5px">中国工商银行 · 模拟演示</div></div>`,
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '设置金额', act: "BANK.tip('演示环境：设置收款金额')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '保存到相册', act: "BANK.tip('收款码已保存（演示）')" },
        { ico: 'chart', bg: '#fdeff7', name: '收款记录', act: "BANK.open('cardtxn')" },
        { ico: 'headset', bg: '#eaf3fd', name: '收款有疑问', act: "BANK.open('help')" }
      ]
    },
    paycode: {
      t: '付款',
      note: '向商户出示下方付款码；演示环境不会产生任何真实扣款。',
      mid: `<div class="bz-card" style="padding:20px;text-align:center">
        <div style="font-size:12px;color:#98a0ad">当前付款账户</div>
        <b style="font-size:14px;display:block;margin:6px 0 14px">储蓄卡（****8888）</b>
        <div style="height:14px;border-radius:3px;margin:0 auto 8px;width:190px;
          background:repeating-linear-gradient(90deg,#1c1c22 0 2px,transparent 2px 4px, #1c1c22 4px 7px,transparent 7px 9px)">
        </div>
        <div style="font-family:monospace;font-size:19px;font-weight:800;letter-spacing:2px">6284 9173 5520</div>
        <div style="font-size:11px;color:#98a0ad;margin-top:8px">60 秒后自动刷新</div></div>`,
      tiles: [
        { ico: 'credit', bg: '#eaf3fd', name: '切换付款卡', act: "BANK.open('mycards')" },
        { ico: 'gear', bg: '#f0f0f2', name: '设置免密', act: "BANK.open('smallpay')" },
        { ico: 'list', bg: '#eef9ef', name: '付款记录', act: "BANK.open('cardtxn')" },
        { ico: 'headset', bg: '#eaf3fd', name: '付款失败怎么办', act: "BANK.open('faq')" }
      ]
    },

    /* ─── 其他 ─── */
    payroll: {
      t: '电子工资单',
      note: '数据来源：某科技有限公司 · 演示代发',
      list: [
        { ico: 'salary', bg: '#e9f7f5', name: '09 月工资单', desc: '实发 ￥12,600.00 · 09-26 到账', act: "BANK.tip('工资单已下载（演示）')" },
        { ico: 'salary', bg: '#e9f7f5', name: '08 月工资单', desc: '实发 ￥12,600.00 · 08-26 到账', act: "BANK.tip('工资单已下载（演示）')" },
        { ico: 'salary', bg: '#e9f7f5', name: '07 月工资单', desc: '实发 ￥11,980.00 · 07-26 到账', act: "BANK.tip('工资单已下载（演示）')" }
      ],
      tiles: [
        { ico: 'chart', bg: '#fdeff7', name: '收入趋势', act: "BANK.open('spendana')" },
        { ico: 'receipt', bg: '#eaf3fd', name: '收入证明', desc: '可用于贷款 / 签证', act: "BANK.tip('收入证明已开具（演示）')" },
        { ico: 'list', bg: '#eef9ef', name: '个税明细', act: "BANK.tip('演示环境：个税明细')" }
      ]
    },
    social: {
      t: '社保医保',
      note: '数据来源：上海市人力资源和社会保障局（演示）',
      list: [
        { ico: 'health', bg: '#eef9ef', name: '医保账户', desc: '余额 ￥3,860.40', act: "BANK.tip('医保账户查询（演示）')" },
        { ico: 'user', bg: '#eaf3fd', name: '养老保险', desc: '累计缴费 68 个月', act: "BANK.tip('养老保险查询（演示）')" },
        { ico: 'building', bg: '#fff6e6', name: '公积金', desc: '账户余额 ￥62,410.00', act: "BANK.tip('公积金查询（演示）')" }
      ],
      tiles: [
        { ico: 'receipt', bg: '#eaf3fd', name: '缴费记录', act: "BANK.open('billhist')" },
        { ico: 'list', bg: '#eef9ef', name: '参保证明', act: "BANK.tip('参保证明已开具（演示）')" },
        { ico: 'headset', bg: '#eaf3fd', name: '社保咨询', act: "BANK.open('help')" }
      ]
    },
    edu: {
      t: '教育缴费',
      list: [
        { ico: 'edu', bg: '#fff6e6', name: '学杂费', desc: '按学校账单缴纳', act: "BANK.tip('演示环境：缴费成功')" },
        { ico: 'edu', bg: '#fff6e6', name: '校园一卡通', desc: '在线充值秒到账', act: "BANK.tip('充值成功（演示）')" },
        { ico: 'edu', bg: '#fff6e6', name: '培训费', desc: '合作机构通用', act: "BANK.tip('演示环境：缴费成功')" }
      ],
      tiles: [
        { ico: 'building', bg: '#eaf3fd', name: '选择学校', act: "BANK.tip('演示环境：学校列表')" },
        { ico: 'list', bg: '#eef9ef', name: '缴费记录', act: "BANK.open('billhist')" },
        { ico: 'headset', bg: '#eaf3fd', name: '账单有疑问', act: "BANK.open('help')" }
      ]
    },
    mail: {
      t: '邮寄进度',
      list: [
        { ico: 'cube', bg: '#fff6e6', name: '已揽收 · 上海分拨中心', desc: '09-28 14:20', act: "BANK.tip('演示环境：物流详情')" },
        { ico: 'cube', bg: '#f0f0f2', name: '运输中 · 发往黄浦区', desc: '09-28 19:40', act: "BANK.tip('演示环境：物流详情')" },
        { ico: 'cube', bg: '#f0f0f2', name: '派送中 · 快递员派件', desc: '预计今天 18:00 前送达', act: "BANK.tip('演示环境：联系快递员')" }
      ],
      tiles: [
        { ico: 'list', bg: '#eef9ef', name: '查看卡函详情', act: "BANK.tip('演示环境：卡函信息')" },
        { ico: 'headset', bg: '#eaf3fd', name: '联系客服', act: "BANK.open('help')" },
        { ico: 'credit', bg: '#eaf3fd', name: '我的信用卡', act: "BANK.open('mycards')" }
      ]
    }
  };

  /* ═══════════ 12.5 全部功能（总入口 · 每个按钮再带 ≥3 个下一级） ═══════════ */
  BANK.def('allfunc', {
    title: '全部功能',
    render: () => `
      <div class="bz-warn">演示环境：以下均为模拟业务，不会产生真实交易。</div>
      ${nav('账户与卡片', '4 项')}
      ${tiles([
        { ico: 'credit', bg: '#eaf3fd', name: '我的银行卡', act: "BANK.open('mycards')" },
        { ico: 'list', bg: '#eef9ef', name: '交易明细', act: "BANK.open('cardtxn')" },
        { ico: 'gold', bg: '#fff6e6', name: '限额管理', act: "BANK.open('limits')" },
        { ico: 'shield', bg: '#e9f7f5', name: '挂失与解挂', act: "BANK.open('cardloss')" }
      ])}
      ${nav('转账与支付', '4 项')}
      ${tiles([
        { ico: 'transfer', bg: '#fdecec', name: '转账汇款', act: "BANK.open('transfer')" },
        { ico: 'scan', bg: '#eaf3fd', name: '扫码收付', act: "BANK.open('scanpay')" },
        { ico: 'receive', bg: '#eef9ef', name: '收款码', act: "BANK.open('receive')" },
        { ico: 'pay', bg: '#fff6e6', name: '付款码', act: "BANK.open('paycode')" }
      ])}
      ${nav('财富与信贷', '6 项')}
      ${tiles([
        { ico: 'chart', bg: '#fdeff7', name: '投资理财', act: "BANK.open('wealth')" },
        { ico: 'bank', bg: '#eaf3fd', name: '存款产品', act: "BANK.open('deposit')" },
        { ico: 'house', bg: '#eef4ff', name: '个人贷款', act: "BANK.open('loan')" },
        { ico: 'credit', bg: '#f0ecfd', name: '信用卡申请', act: "BANK.open('creditapply')" },
        { ico: 'gold', bg: '#fff6e6', name: '结售汇', act: "BANK.open('fx')" },
        { ico: 'list', bg: '#eef9ef', name: '我的持仓', act: "BANK.open('holdings')" }
      ])}
      ${nav('生活缴费', '8 项')}
      ${tiles([
        { ico: 'charge', bg: '#eaf3fd', name: '手机充值', act: "BANK.open('recharge')" },
        { ico: 'receipt', bg: '#fff6e6', name: '生活缴费', act: "BANK.open('paybill')" },
        { ico: 'edu', bg: '#fdeff7', name: '教育缴费', act: "BANK.open('edu')" },
        { ico: 'health', bg: '#eef9ef', name: '社保医保', act: "BANK.open('social')" },
        { ico: 'noodle', bg: '#fdecec', name: '外卖到家', act: "BANK.open('food')" },
        { ico: 'film', bg: '#f0ecfd', name: '电影演出', act: "BANK.open('movie')" },
        { ico: 'car', bg: '#e9f7f5', name: '打车出行', act: "BANK.open('taxi')" },
        { ico: 'bed', bg: '#eef4ff', name: '酒店民宿', act: "BANK.open('hotel')" }
      ])}
      ${nav('更多服务', '6 项')}
      ${tiles([
        { ico: 'payroll', bg: '#eaf3fd', name: '电子工资单', act: "BANK.open('payroll')" },
        { ico: 'building', bg: '#eef4ff', name: '网点与排队', act: "BANK.open('branch')" },
        { ico: 'receipt', bg: '#eef9ef', name: '电子回单', act: "BANK.open('statement')" },
        { ico: 'heart', bg: '#fdeff7', name: '积分i豆', act: "BANK.open('points')" },
        { ico: 'bolt', bg: '#fff6e6', name: '工银e支付', act: "BANK.open('estore')" },
        { ico: 'mail', bg: '#f0ecfd', name: '邮寄进度', act: "BANK.open('mail')" }
      ])}
      ${nav('安全与设置', '5 项')}
      ${tiles([
        { ico: 'shield', bg: '#e9f7f5', name: '安全中心', act: "BANK.open('security')" },
        { ico: 'gear', bg: '#f0f0f2', name: '设置', act: "BANK.open('settings')" },
        { ico: 'headset', bg: '#eaf3fd', name: '帮助中心', act: "BANK.open('help')" },
        { ico: 'list', bg: '#eef9ef', name: '常见问题', act: "BANK.open('faq')" },
        { ico: 'building', bg: '#eef4ff', name: '关于工行', act: "BANK.open('aboutbank')" }
      ])}
      <button class="bz-plain" onclick="BANK.home()">返回首页</button>`
  });

  /* ═══════════ 12.6 转账汇款（多步流程） ═══════════ */
  const trState = { to: '', name: '王**', bank: '中国工商银行', amt: 520, card: 'c1', note: '' };
  const PAYEES = [
    { name: '王**', bank: '中国工商银行', no: '6222 0202 **** 1234', tag: '常用' },
    { name: '张**', bank: '中国建设银行', no: '6217 0000 **** 5678', tag: '常用' },
    { name: '陈**', bank: '招商银行', no: '6225 8800 **** 9012', tag: '' }
  ];
  BANK.def('transfer', {
    title: '转账汇款',
    render: p => {
      const step = p || 1;
      if (step === 1) return `
        ${steps(4, 0)}
        ${nav('选择收款人', '近 30 天转账过的账户')}
        ${card(PAYEES.map((e, i) => row({
          emo: e.name.slice(0, 1), bg: '#eaf3fd', name: e.name + ' · ' + e.bank,
          desc: e.no, act: "BANK.trPick(" + i + ")"
        })).join(''))}
        ${tiles([
          { ico: 'transfer', bg: '#fdecec', name: '新收款人', act: "BANK.trNew()" },
          { ico: 'list', bg: '#eef9ef', name: '收款人管理', act: "BANK.open('payees')" },
          { ico: 'receipt', bg: '#eaf3fd', name: '转账记录', act: "BANK.open('cardtxn')" }
        ])}
        <p class="bz-tip">※ 请核对收款人信息，转账一经提交不可撤回（演示环境不会真实扣款）</p>`;
      if (step === 2) return `
        ${steps(4, 1)}
        ${card(
          kv('收款人', trState.name) + kv('收款账户', trState.to || '6222 0202 **** 1234') + kv('收款银行', trState.bank)
        )}
        ${card(`<div class="bz-form">
          <label>转账金额</label>
          <div class="amount-input"><span>￥</span><input type="number" id="trAmt" placeholder="0.00" value="${trState.amt}"></div>
          <label style="margin-top:12px">转账附言</label>
          <input id="trNote" type="text" placeholder="选填，如：谷子尾款" value="${trState.note}">
        </div>`)}
        ${tiles([
          { emo: '100', name: '￥100', act: "BANK.trQuick(100)" },
          { emo: '520', name: '￥520', act: "BANK.trQuick(520)" },
          { emo: '1k', name: '￥1,000', act: "BANK.trQuick(1000)" },
          { emo: '2k', name: '￥2,000', act: "BANK.trQuick(2000)" }
        ])}
        <button class="bz-main" onclick="BANK.trGo(3)">下一步</button>
        <button class="bz-plain" onclick="BANK.back()">返回上一步</button>`;
      if (step === 3) return `
        ${steps(4, 2)}
        ${nav('选择付款账户')}
        ${card(CARDS.filter(c => c.type === '储蓄卡' || c.main).map(c => row({
          ico: 'credit', bg: '#eaf3fd', name: c.name + '（' + c.no.slice(-4) + '）',
          desc: '可用 ' + c.bal, act: "BANK.trCard('" + c.id + "')"
        })).join(''))}
        ${card(kv('付款金额', '￥' + fmt(trState.amt), 'up') + kv('手续费', '￥0.00（演示免收）'))}
        <button class="bz-main" onclick="BANK.trGo(4)">确认转账</button>
        <button class="bz-plain" onclick="BANK.back()">返回修改</button>`;
      if (step === 4) return `
        ${steps(4, 3)}
        ${card(kv('收款人', trState.name) + kv('金额', '￥' + fmt(trState.amt), 'up') + kv('付款账户', '储蓄卡 ****8888'))}
        ${card(`<div class="bz-form" style="text-align:center">
          <label style="text-align:center">请输入 6 位支付密码</label>
          <div class="bz-pass"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <input id="trPwd" type="password" inputmode="numeric" maxlength="6" placeholder="演示密码：123456"
                 style="text-align:center;letter-spacing:8px">
        </div>`)}
        <button class="bz-main" onclick="BANK.trDo()">确认转账</button>
        <button class="bz-plain" onclick="BANK.back()">返回修改</button>
        <p class="bz-tip">※ 演示环境，密码任意输入即可</p>`;
      return `
        <div class="bz-done"><span class="bz-done-ico">${ico('transfer')}</span>
          <b>转账提交成功</b>
          <span>已向 ${trState.name} 转账 ￥${fmt(trState.amt)}（演示）</span></div>
        ${card(kv('交易时间', nowStr()) + kv('交易流水号', 'ICBC' + Date.now().toString().slice(-10)) + kv('状态', '处理成功'))}
        ${tiles([
          { ico: 'list', bg: '#eef9ef', name: '查看明细', act: "BANK.open('cardtxn')" },
          { ico: 'transfer', bg: '#fdecec', name: '再转一笔', act: "BANK.open('transfer')" },
          { ico: 'gold', bg: '#fff6e6', name: '我的银行卡', act: "BANK.home();BANK.open('mycards')" },
          { ico: 'receive', bg: '#eaf3fd', name: '生成收款码', act: "BANK.open('receive')" }
        ])}`;
    }
  });

  /* 转账到指定卡（从卡片详情进入） */
  BANK.def('transfer2', {
    title: '转账到这张卡',
    render: p => {
      const c = CARDS.find(x => x.id === p) || CARDS[0];
      return `
        ${card(kv('转入卡', c.name) + kv('卡号', c.no) + kv('开户行', c.bank))}
        ${card(`<div class="bz-form">
          <label>转入金额</label>
          <div class="amount-input"><span>￥</span><input type="number" id="trAmt" placeholder="0.00" value="1000.00"></div>
        </div>`)}
        ${tiles([
          { ico: 'transfer', bg: '#fdecec', name: '用常用户转账', act: "BANK.open('transfer')" },
          { ico: 'credit', bg: '#eaf3fd', name: '查看这张卡', act: "BANK.open('carddetail','" + c.id + "')" },
          { ico: 'headset', bg: '#f0ecfd', name: '到账时间说明', act: "BANK.open('faq')" }
        ])}
        <button class="bz-main" onclick="BANK.trDo()">立即转入</button>`;
    }
  });

  /* 收款人管理 */
  BANK.def('payees', {
    title: '收款人管理',
    render: () => `
      ${card(PAYEES.map((e, i) => row({
        emo: e.name.slice(0, 1), bg: '#eaf3fd', name: e.name, desc: e.bank + ' · ' + e.no,
        act: "BANK.trPick(" + i + ")"
      })).join(''))}
      ${tiles([
        { ico: 'transfer', bg: '#fdecec', name: '添加收款人', act: "BANK.trNew()" },
        { ico: 'list', bg: '#eef9ef', name: '分组管理', act: "BANK.tip('演示环境：分组管理')" },
        { ico: 'shield', bg: '#e9f7f5', name: '转账限额', act: "BANK.open('limits')" }
      ])}`
  });

  /* ═══════════ 12.7 扫码收付 ═══════════ */
  BANK.def('scanpay', {
    title: '扫码收付',
    render: () => `
      <div class="bz-warn">演示环境：扫一扫不会调用摄像头，点击下方场景即可模拟识别结果。</div>
      ${nav('扫一扫场景', '选择一种试试')}
      ${card(
        row({ ico: 'scan', bg: '#eaf3fd', name: '扫码付款', desc: '扫商户收款码 → 输入金额 → 付款', act: "BANK.scanHit('pay')" }) +
        row({ ico: 'receive', bg: '#eef9ef', name: '扫码收款', desc: '扫顾客付款码 → 确认收款', act: "BANK.scanHit('recv')" }) +
        row({ ico: 'shigu', bg: '#fdeff7', name: '识谷鉴真', desc: '扫谷子防伪码 → AI 估值', act: "BANK.scanHit('gu')" }) +
        row({ ico: 'shield', bg: '#e9f7f5', name: '扫健康码/场所码', desc: '演示环境已停用', act: "BANK.tip('演示环境：场所码已停用')" })
      )}
      ${tiles([
        { ico: 'receive', bg: '#eef9ef', name: '我的收款码', act: "BANK.open('receive')" },
        { ico: 'pay', bg: '#fff6e6', name: '我的付款码', act: "BANK.open('paycode')" },
        { ico: 'list', bg: '#eaf3fd', name: '扫码记录', act: "BANK.open('cardtxn')" }
      ])}`
  });
  BANK.def('scanresult', {
    title: '扫码结果',
    render: p => {
      const kind = p || 'pay';
      if (kind === 'recv') return `
        ${card(kv('识别结果', '个人付款码') + kv('付款方', '谷友 138****6677') + kv('付款金额', '￥68.00', 'up'))}
        ${tiles([
          { ico: 'receive', bg: '#eef9ef', name: '确认收款', act: "BANK.scanPay('收款',68)" },
          { ico: 'list', bg: '#eaf3fd', name: '修改金额', act: "BANK.tip('演示环境：已改金额')" },
          { ico: 'headset', bg: '#f0ecfd', name: '收款遇到问题', act: "BANK.open('faq')" }
        ])}`;
      if (kind === 'gu') return `
        ${card(kv('识别对象', '「星熠」亚克力立牌 · 白昼流光') + kv('品相', 'S 级 · 原盒未拆') + kv('AI 参考估值', '￥268.00', 'up') + kv('鉴真结论', '正品（置信 98.6%）', 'up'))}
        ${tiles([
          { ico: 'shigu', bg: '#fdeff7', name: '进入识谷', act: "BANK.tip('已跳转 e次元 · 识谷（演示）')" },
          { ico: 'gold', bg: '#fff6e6', name: '凭估值申请质押贷', act: "BANK.open('loan')" },
          { ico: 'building', bg: '#eef4ff', name: '存入藏馆档案', act: "BANK.tip('已生成数字档案（演示）')" }
        ])}`;
      return `
        ${card(kv('识别结果', '谷谷屋（上海黄浦店）收款码') + kv('应付金额', '￥286.00', 'up') + kv('优惠', '-￥20.00（谷店满减券）'))}
        ${nav('选择付款方式')}
        ${card(CARDS.filter(c => c.main).map(c => row({
          ico: 'credit', bg: '#eaf3fd', name: c.name + '（' + c.no.slice(-4) + '）', desc: '可用 ' + c.bal,
          act: "BANK.scanPay('付款',266)"
        })).join(''))}
        ${tiles([
          { ico: 'pay', bg: '#fff6e6', name: '出示我的付款码', act: "BANK.open('paycode')" },
          { ico: 'gift', bg: '#fdeff7', name: '选优惠券', act: "BANK.open('points')" },
          { ico: 'list', bg: '#eaf3fd', name: '扫码记录', act: "BANK.open('cardtxn')" }
        ])}`;
    }
  });

  /* ═══════════ 12.8 帮助说明页 ═══════════ */
  BANK.def('limithelp', {
    title: '限额说明',
    render: () => `
      ${card(kv('手机银行单笔', '￥50,000.00') + kv('手机银行日累计', '￥200,000.00') + kv('月累计', '￥1,000,000.00'))}
      ${nav('如何调整')}
      ${card(
        row({ ico: 'gear', bg: '#f0f0f2', name: '自助调整限额', desc: '刷脸 / 短信验证后生效', act: "BANK.open('limits')" }) +
        row({ ico: 'building', bg: '#eef4ff', name: '柜台提升限额', desc: '携带有效证件到网点办理', act: "BANK.open('branch')" }) +
        row({ ico: 'headset', bg: '#eaf3fd', name: '限额咨询', desc: '在线客服 7×24', act: "BANK.open('help')" })
      )}
      ${tiles([
        { ico: 'shield', bg: '#e9f7f5', name: '安全中心', act: "BANK.open('security')" },
        { ico: 'list', bg: '#eef9ef', name: '常见问题', act: "BANK.open('faq')" },
        { ico: 'list', bg: '#eef9ef', name: '返回限额管理', act: "BANK.back()" }
      ])}`
  });
  BANK.def('losshelp', {
    title: '挂失说明',
    render: () => `
      <div class="bz-warn">临时挂失有效期 5 天，期间账户资金只进不出；正式挂失需到网点补办新卡。</div>
      ${nav('你可以选择')}
      ${card(
        row({ ico: 'shield', bg: '#fdecec', name: '临时挂失（紧急冻结）', desc: '即时生效 · 可自助解挂', act: "BANK.open('cardloss')" }) +
        row({ ico: 'credit', bg: '#eaf3fd', name: '正式挂失补卡', desc: '新卡邮寄到家', act: "BANK.open('reissue')" }) +
        row({ ico: 'headset', bg: '#eaf3fd', name: '人工客服', desc: '95588 转人工', act: "BANK.open('help')" })
      )}
      ${tiles([
        { ico: 'list', bg: '#eef9ef', name: '挂失记录', act: "BANK.open('locklog')" },
        { ico: 'list', bg: '#eef9ef', name: '常见问题', act: "BANK.open('faq')" },
        { ico: 'building', bg: '#eef4ff', name: '就近网点', act: "BANK.open('branch')" }
      ])}`
  });

  Object.keys(PAGES).forEach(k => {
    const p = PAGES[k];
    if (p.render === null) return;           // 需要单独实现的页，稍后注册
    BANK.def(k, {
      title: typeof p.t === 'function' ? p.t : (p.t || k),
      render: typeof p.render === 'function' ? p.render : (() => pageHTML(p))
    });
  });

  /* 业务动作实现（挂在 BANK 上，供 onclick 调用） */
  Object.assign(BANK, {
    /* 绑卡 */
    bindDetect(v) {
      bindState.no = v;
      const d = String(v).replace(/\s/g, '');
      const h = $('#bindHint');
      if (!h) return;
      if (d.length >= 6) {
        bindState.type = d.startsWith('6222 23') || d.startsWith('622223') ? '信用卡' : '储蓄卡';
        h.textContent = '识别为「中国工商银行 · ' + bindState.type + '」';
        h.classList.add('ok');
      } else {
        h.textContent = '支持中国工商银行及其他银行的借记卡、信用卡';
        h.classList.remove('ok');
      }
    },
    bindDemo() {
      const i = $('#bindNo');
      if (i) { i.value = '6222 0202 6688 6666'; BANK.bindDetect(i.value); }
      toast('已识别卡号（演示）');
    },
    bindSendCode() { toast('验证码已发送（演示）：888888'); BANK._code = [1, 1, 1, 1, 1, 1]; },
    bindNext(step) {
      if (step === 1) {
        const v = ($('#bindNo') || {}).value || '';
        if (String(v).replace(/\s/g, '').length < 8) { toast('请输入有效的卡号（演示）'); return; }
        BANK.open('bindcard', 2);
      } else {
        const c = ($('#bindCode') || {}).value || '';
        if (!/^\d{4,6}$/.test(c)) { toast('请输入 6 位短信验证码（演示可填 888888）'); return; }
        CARDS.push({
          id: 'c' + Date.now(), type: bindState.type || '储蓄卡', name: '新绑定卡',
          no: (bindState.no || '6222 0202 **** 6666'), img: 'img/art/' + (bindState.type === '信用卡' ? 'card-credit.jpg' : 'card-debit.jpg'),
          bank: '中国工商银行', bal: '0.00', color: '#c7000b'
        });
        BANK.open('bindcard', 3);
      }
    },
    /* 限额 */
    limitsSave() { toast('限额设置已保存（演示）'); },
    /* 挂失 */
    lossDo(id) {
      const c = CARDS.find(x => x.id === id) || {};
      toast('已挂失：' + (c.name || '银行卡') + '（演示）');
      rec({ icon: 'shield', bg: '#fdecec', title: '卡片挂失 · ' + (c.name || ''), amt: 0 });
    },
    /* 缴费 */
    billPay(name, amt) {
      const D = window.ICBCApp && ICBCApp.data;
      if (D) { D.account.balance -= amt; D.account.available -= amt; if (ICBCApp.setBalance) ICBCApp.setBalance(D.account.balance); }
      rec({ icon: 'receipt', bg: '#fff6e6', title: name + '缴费 · 户号 8888', amt: -amt });
      toast(name + ' 缴费成功：￥' + fmt(amt) + '（演示）');
    },
    rechargeDo(amt) {
      const D = window.ICBCApp && ICBCApp.data;
      if (D) { D.account.balance -= amt; ICBCApp.setBalance(D.account.balance); }
      rec({ icon: 'charge', bg: '#eaf3fd', title: '话费充值 · 138****5678', amt: -amt });
      toast('充值成功：' + amt + ' 元已到账（演示）');
    },
    depDo(term, rate) {
      const amt = +(($('#depAmt') || {}).value || 50000);
      const D = window.ICBCApp && ICBCApp.data;
      if (D && amt > D.account.available) { toast('可用余额不足（演示）'); return; }
      if (D) { D.account.balance -= amt; D.account.available -= amt; ICBCApp.setBalance(D.account.balance); }
      rec({ icon: 'bank', bg: '#eef4ff', title: '定期存入 · ' + term + '（' + rate + '%）', amt: -amt });
      toast('已存入 ' + fmt(amt) + ' 元 / ' + term + '，年利率 ' + rate + '%（演示）');
    },
    fxDo(name, rate) {
      toast(name + ' 结售汇：参考价 ' + rate + '（演示）');
    },
    /* 转账流程 */
    trPick(i) {
      const e = PAYEES[i] || PAYEES[0];
      trState.name = e.name; trState.bank = e.bank; trState.to = e.no;
      BANK.open('transfer', 2);
    },
    trNew() {
      trState.name = '新收款人'; trState.bank = '中国工商银行'; trState.to = '6222 0202 **** 0000';
      toast('演示环境：已填入示例收款人');
      BANK.open('transfer', 2);
    },
    trQuick(v) {
      const i = $('#trAmt'); if (i) i.value = v; trState.amt = v;
      toast('金额已填入 ￥' + money(v));
    },
    trCard(id) {
      trState.card = id;
      const c = CARDS.find(x => x.id === id) || {};
      toast('付款账户：' + (c.name || '储蓄卡'));
    },
    trGo(step) {
      if (step === 3) {
        const a = parseFloat(($('#trAmt') || {}).value || 0);
        if (!(a > 0)) { toast('请输入大于 0 的转账金额（演示）'); return; }
        const D = window.ICBCApp && ICBCApp.data;
        if (D && a > D.account.available) { toast('可用余额不足（演示）'); return; }
        trState.amt = a;
        trState.note = ($('#trNote') || {}).value || '';
        BANK.open('transfer', 3); return;
      }
      if (step === 4) { BANK.open('transfer', 4); return; }
      BANK.open('transfer', step);
    },
    trDo() {
      const a = trState.amt || 0;
      const D = window.ICBCApp && ICBCApp.data;
      if (D) {
        D.account.balance -= a; D.account.available -= a;
        if (ICBCApp.setBalance) ICBCApp.setBalance(D.account.balance);
      }
      rec({ icon: 'transfer', bg: '#fdecec', title: '转账支出 · ' + trState.name + (trState.note ? '（' + trState.note + '）' : ''), amt: -a });
      toast('转账成功：￥' + fmt(a) + '（演示）');
      BANK.open('transfer', 5);
    },
    /* 扫码流程 */
    scanHit(kind) { BANK.open('scanresult', kind); },
    scanPay(name, amt) {
      const D = window.ICBCApp && ICBCApp.data;
      if (D) { D.account.balance -= amt; D.account.available -= amt; if (ICBCApp.setBalance) ICBCApp.setBalance(D.account.balance); }
      rec({ icon: 'pay', bg: '#fff6e6', title: name + ' · ' + (name === '收款' ? '扫码收款' : '谷谷屋（吧唧x3）'), amt: name === '收款' ? amt : -amt });
      toast(name + '成功：￥' + fmt(amt) + '（演示）');
      BANK.open('cardtxn');
    }
  });
})();
