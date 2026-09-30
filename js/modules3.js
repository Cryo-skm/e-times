/* ════════════════════════════════════════════════════════════════════
   e次元 · 三大引擎补齐模块
   ─────────────────────────────────────────────────────────────────────
   本文件把 v1.2 商业计划书里有、而原网站没有的三个核心引擎做进演示：
     1. 谷享   → 智能消费引擎（e谷推 + e谷推GPT-Fin 的需求解析与全网比价）
     2. 质押贷 → 谷子质押贷（AI 品相鉴定 → 市场估值 → 智能授信）
     3. 藏馆   → 数字社交引擎（数字分身建档 / 虚拟展厅 / AR 预览 / 好友共创）
   依赖：js/chars.js（谷伴角色）、js/xingegu.js（XZG 主体）
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof XZG === 'undefined') { console.error('[e次元] 未找到 XZG，模块加载失败'); return; }

  /* ════════════════════════════════════════════════════════
     一、谷享 · 智能消费引擎
     ════════════════════════════════════════════════════════ */
  Object.assign(XZG, {
    GX: {
      samples: [
        '帮我盯着「星熠」的新品，徽章优先，超过 300 块先问我一下',
        '想收「语棠」的立牌，预算 200 以内，只看现货，不要盲盒',
        '谷伴系列手办有降价的吗，看到 900 以下告诉我'
      ],
      /* 候选渠道报价（演示数据） */
      quotes: [
        { ch: 'e次元甄选（官方）', price: 269, ship: '现货 · 48h 发货', hit: ['角色相符', '预算内', '现货'], tone: 'ok' },
        { ch: '合作谷店 · 谷仓直营', price: 249, ship: '现货 · 同城当日达', hit: ['角色相符', '预算内', '现货', '低于均价'], tone: 'best' },
        { ch: '二手市场（出谷通托管）', price: 218, ship: '9 成新 · 托管交易', hit: ['角色相符', '预算内', '需验货'], tone: 'warn' },
        { ch: '海外代购 · 预售渠道', price: 322, ship: '预售 · 约 21 天', hit: ['角色相符', '超预算', '非现货'], tone: 'bad' }
      ],
      plans: [
        { id: 'p1', name: '盯梢版', price: 0, unit: '免费', desc: '价格变动提醒 · 每日一次', cur: true },
        { id: 'p2', name: '自动采购', price: 12, unit: '元/月', desc: '达标自动下单 · 实时比价' },
        { id: 'p3', name: '专属定制', price: 39, unit: '元/月', desc: '稀缺款代找 · 人工顾问跟单' }
      ],
      /* 监控清单（用户明确授权后才建立，可随时删除） */
      watch: [
        { id: 'w1', name: '「星熠」亚克力立牌', target: 300, now: 322, state: '盯梢中' },
        { id: 'w2', name: '「语棠」樱色絮语 手办', target: 1000, now: 980, state: '已达标' }
      ]
    },
    _gx: { phase: 'idle', cond: null, picked: null },

    renderGuxiang() {
      const b = this.$('#guxiangBody'); if (!b) return;
      const st = this._gx; let h = '';

      if (st.phase === 'idle') {
        h += `<div class="xzg-card gx-ask">
          <div class="ct">💬 说一句话，剩下的交给「谷享」</div>
          <div class="gx-input">
            <textarea id="gxTxt" placeholder="例：帮我盯着「星熠」的新品，徽章优先，超过 300 块先问我一下"></textarea>
            <button class="gx-mic" title="语音输入（演示）" onclick="XZG.toast('已开始收音（演示）','🎙️')">🎙️</button>
          </div>
          <div class="gx-samples">${this.GX.samples.map((s, i) =>
            `<button class="gx-sample" onclick="XZG.gxFill(${i})">${s.slice(0, 16)}…</button>`).join('')}</div>
          <button class="xzg-btn big" style="margin-top:12px" onclick="XZG.gxParse()">解析需求 →</button>
          <div class="xzg-spark-tip">🤖 由「e谷推 GPT-Fin」做语义理解，「e谷推」多任务模型做候选排序</div>
        </div>`;
        h += this.gxWatchCard();
        h += this.gxPlanCard();
      }

      if (st.phase === 'parsing') {
        h += `<div class="xzg-card">
          <div class="ct">🤖 双引擎协同解析中</div>
          <div class="gx-pipeline" id="gxPipe">${[
            ['e谷推 GPT-Fin', '领域语义理解 · 结构化需求提取'],
            ['RAG 资料检索', '商品版本库 + 金融业务库双索引'],
            ['e谷推', '多行为序列编码 · 双路径融合排序'],
            ['决策智能体', '条件校验 · 工具调用 · 结果复核']
          ].map((p, i) => `<div class="gx-pipe" id="gp${i}"><span class="gxp-n">${i + 1}</span><div><b>${p[0]}</b><span>${p[1]}</span></div></div>`).join('')}</div>
        </div>`;
      }

      if (st.phase === 'matched') {
        const c = st.cond;
        h += `<div class="xzg-card">
          <div class="ct">🧩 解析出的结构化条件<span class="more">可点选修改</span></div>
          <div class="gx-json">${Object.keys(c).map(k =>
            `<div class="gxj-row"><span class="gxj-k">"${k}"</span><span class="gxj-c">:</span><span class="gxj-v">${Array.isArray(c[k]) ? '[' + c[k].map(x => `"${x}"`).join(', ') + ']' : (typeof c[k] === 'number' ? c[k] : `"${c[k]}"`)}</span><span class="gxj-m">,</span></div>`).join('')}</div>
          <div class="xzg-spark-tip">✅ 字段类型与金额范围已通过程序校验 · 未指定的角色保留为空，不由模型补填</div>
        </div>`;

        h += `<div class="xzg-card">
          <div class="ct">🔍 全网候选（已按条件过滤 + 模型排序）<span class="more">${this.GX.quotes.length} 个渠道</span></div>
          ${this.GX.quotes.map((q, i) => {
            const over = c['预算上限'] && q.price > c['预算上限'];
            return `<div class="gx-quote ${q.tone}${st.picked === i ? ' sel' : ''}" onclick="XZG.gxPick(${i})">
              <div class="gq-h"><b>${q.ch}</b><span class="gq-p${over ? ' over' : ''}">¥${q.price}</span></div>
              <div class="gq-s">${q.ship}</div>
              <div class="gq-tags">${q.hit.map(t => `<i class="${t === '超预算' || t === '非现货' ? 'no' : 'yes'}">${t === '超预算' || t === '非现货' ? '✕ ' : '✓ '}${t}</i>`).join('')}</div>
              ${over ? `<div class="gq-note">⚠️ 超出你设定的预算，按你的要求「先问一下」——已暂缓自动下单</div>` : ''}
            </div>`;
          }).join('')}
          <div class="xzg-spark-tip">💡 命中理由来自实际命中的条件与商品资料，不把模型权重翻译成未经验证的偏好推断</div>
        </div>`;

        h += `<div class="xzg-card gx-act">
          <div class="ct" style="margin-bottom:8px">下一步</div>
          <div class="gx-btns">
            <button class="xzg-btn" onclick="XZG.gxWatch()">➕ 加入监控清单</button>
            <button class="xzg-btn plain" onclick="XZG.gxOrder()">🛒 立即下单</button>
          </div>
          <button class="xzg-btn ghost big" style="margin-top:10px" onclick="XZG._gx={phase:'idle'};XZG.renderGuxiang()">重新提需求</button>
        </div>`;
      }

      b.innerHTML = h;
      if (st.phase === 'parsing') this.gxRun();
    },

    gxFill(i) { const t = this.$('#gxTxt'); if (t) t.value = this.GX.samples[i]; },
    gxParse() {
      const t = this.$('#gxTxt');
      const txt = (t && t.value.trim()) || this.GX.samples[0];
      const cond = this.gxExtract(txt);
      this._gx = { phase: 'parsing', cond: cond, picked: null, origin: txt };
      this.renderGuxiang();
      this.taskDone('t7');
    },
    /* 极简规则式"语义解析"，模拟 GPT-Fin 的槽位提取结果（演示用） */
    gxExtract(txt) {
      const c = { 作品: 'e次元谷伴', 角色: null, 品类: [], 预算上限: null, 库存要求: null, 排除条件: [], 触发动作: '价格达标的即时提醒' };
      const chars = ['小e', '星熠', '橙汐', '云间', '语棠', '御风', '墨书', '清和'];
      for (const n of chars) if (txt.includes(n)) { c.角色 = n; break }
      const catMap = [['徽章', '徽章/吧唧'], ['徽章', '徽章/吧唧'], ['吧唧', '徽章/吧唧'], ['立牌', '亚克力立牌'], ['手办', '手办/模型'], ['挂件', '毛绒/挂件'], ['色纸', '色纸/票根']];
      for (const [k, v] of catMap) if (txt.includes(k) && !c.品类.includes(v)) c.品类.push(v);
      if (!c.品类.length) c.品类 = ['徽章/吧唧'];
      const m = txt.match(/(\d{2,5})\s*(块|元)?\s*(以内|以下)/);
      if (m) c.预算上限 = parseInt(m[1], 10);
      const m2 = txt.match(/超过\s*(\d{2,5})/);
      if (m2) c.预算上限 = parseInt(m2[1], 10);
      if (txt.includes('现货')) c.库存要求 = '只看现货';
      if (txt.includes('不要')) {
        const ex = txt.split('不要')[1] || '';
        if (ex.includes('盲盒')) c.排除条件.push('盲盒');
        if (ex.includes('预售')) c.排除条件.push('预售');
        if (ex.includes('随机')) c.排除条件.push('随机款');
      }
      if (txt.includes('先问我') || txt.includes('超预算')) c.触发动作 = '超预算先询问，不自动下单';
      return c;
    },
    gxRun() {
      const n = 4, tick = (i) => {
        if (i > 0) { const p = this.$('#gp' + (i - 1)); if (p) { p.className = 'gx-pipe ok'; p.querySelector('.gxp-n').textContent = '✓' } }
        if (i < n) {
          const p = this.$('#gp' + i);
          if (p) { p.className = 'gx-pipe doing'; p.querySelector('.gxp-n').textContent = '◌' }
          setTimeout(() => tick(i + 1), i === n - 1 ? 420 : 620);
        } else {
          setTimeout(() => { this._gx.phase = 'matched'; this.renderGuxiang(); this.toast('解析完成，已排出 4 个渠道候选', '🧩') }, 420);
        }
      };
      tick(0);
    },
    gxPick(i) { this._gx.picked = i; this.renderGuxiang(); },
    gxWatchCard() {
      const W = this.GX.watch;
      return `<div class="xzg-card"><div class="ct">👀 我的监控清单<span class="more">${W.length} 条</span></div>
        ${W.map((w, i) => `<div class="gx-wrow">
          <div class="gw-m"><b>${w.name}</b><span>目标价 ¥${w.target} · 当前 ¥${w.now}</span></div>
          <span class="gw-st ${w.state === '已达标' ? 'ok' : ''}">${w.state}</span>
          <button class="gw-del" onclick="XZG.gxDel(${i})" title="移除">✕</button>
        </div>`).join('')}
        <div class="xzg-muted" style="font-size:12px;margin-top:8px">✦ 监控任务在你明确授权后才建立，可随时删除；不会因一次点击就改变推荐模型</div>
      </div>`;
    },
    gxDel(i) { this.GX.watch.splice(i, 1); this.renderGuxiang(); this.toast('已移除该监控任务', '🗑️'); },
    gxPlanCard() {
      return `<div class="xzg-card"><div class="ct">🎚 服务分级<span class="more">按需订阅</span></div>
        <div class="gx-plans">${this.GX.plans.map(p => `
          <div class="gx-plan${p.cur ? ' cur' : ''}">
            <b>${p.name}</b><span class="gxp-price">${p.price ? '¥' + p.price : '免费'}<i>/${p.unit.replace('免费', '')}</i></span>
            <span class="gxp-desc">${p.desc}</span>
            <button class="gx-pbtn" onclick="XZG.toast('演示环境：订阅流程即将开放','🎚')">${p.cur ? '当前方案' : '订阅'}</button>
          </div>`).join('')}</div>
      </div>`;
    },
    gxWatch() {
      const st = this._gx, c = st.cond;
      const pick = this.GX.quotes[st.picked == null ? 0 : st.picked];
      const name = c.角色 ? `「${c.角色}」${c.品类[0]}` : `${c.品类[0]}（e次元谷伴）`;
      this.GX.watch.unshift({ id: this.uid(), name: name, target: pick.price, now: pick.price, state: '盯梢中' });
      this._gx = { phase: 'idle', cond: null, picked: null };
      this.renderGuxiang();
      this.addGrains(20, '建立监控任务');
      this.toast('已加入监控清单，降价第一时间提醒你', '👀');
    },
    gxOrder() {
      const st = this._gx, pick = this.GX.quotes[st.picked == null ? 0 : st.picked];
      const c = st.cond;
      this.sheet(`<h3>🛒 确认下单</h3><div class="ssub">${pick.ch}</div>
        <div class="xzg-card" style="background:#fafbfd;margin:10px 0;padding:14px">
          <b style="font-size:13.5px;display:block">${c.角色 ? '「' + c.角色 + '」' : ''}${c.品类[0]}</b>
          <span class="xzg-muted" style="font-size:12px">${pick.ship}</span>
          <div class="gx-payrow"><span>商品金额</span><b>¥${pick.price}</b></div>
          <div class="gx-payrow"><span>支付方式</span><b>工行储蓄卡（****8888）</b></div>
          <div class="gx-payrow"><span>资金保障</span><b style="color:#0a9a66">出谷通托管 · 验货后放款</b></div>
        </div>
        <div class="gx-fenqi" onclick="XZG.guka && XZG.go('guka')">
          <b>💳 可享 3 期免息分期</b><span>月供 ¥${(pick.price / 3).toFixed(1)} · 0 手续费 · 去谷卡查看</span>
        </div>
        <button class="xzg-btn big" style="margin-top:12px" onclick="XZG.gxPay(${pick.price},'${(c.角色 || c.品类[0]).replace(/'/g, '')}')">立即支付 ¥${pick.price}</button>
        <div class="xzg-muted" style="font-size:12px;margin-top:8px;text-align:center">* 演示环境 · 不发生真实资金变动</div>`);
    },
    gxPay(price, name) {
      this.sheetClose();
      if (window.ICBCApp && ICBCApp.addRecord) ICBCApp.addRecord({ icon: '🤖', bg: '#eef3ff', title: '谷享代购 · ' + name.slice(0, 12), time: '刚刚', amt: -price });
      this.sheet(`<div style="text-align:center;padding:12px 0 4px"><div style="font-size:46px">✅</div>
        <b style="font-size:15.5px;display:block;margin-top:8px">下单成功</b>
        <div class="xzg-muted" style="margin-top:6px">货款已进入工行托管，验货确认后放款给卖家</div>
        <button class="xzg-btn gold big" style="margin-top:14px" onclick="XZG.sheetClose();XZG.go('chugu')">去出谷通查看订单</button></div>`);
      this.taskDone('t7');
      this.addGrains(Math.round(price / 20) || 5, '谷享代购');
    },

    /* ════════════════════════════════════════════════════════
       二、质押贷 · 藏品变额度
       ════════════════════════════════════════════════════════ */
    ZD: { ltv: 0.5, rate: '3.85%', terms: [6, 12, 24] },
    _zd: { step: 1, sel: null, amount: 0, term: 12 },

    zdValue(id) {
      const g = this.DB.goods.find(x => x.id === id) || this.DB.goods[0];
      return Math.round(g.base * 0.92);
    },
    zdTotal() { return this.DB.goods.reduce((s, g) => s + this.zdValue(g.id), 0) },

    renderZhidai() {
      const b = this.$('#zhidaiBody'); if (!b) return;
      const S = this.S, st = this._zd;
      const total = this.zdTotal(), quota = Math.round(total * this.ZD.ltv);
      const used = S.zdLoan || 0;
      const avail = Math.max(0, quota - used);
      let h = '';

      h += `<div class="zd-hero">
        <div class="zd-hero-t"><b>收藏不止于喜欢</b><span>让谷子为你创造更多价值</span></div>
        <div class="zd-hero-mascot">${CHARS.svg('qinghe')}</div>
        <div class="zd-hero-cards">
          <div class="zd-hc"><span>我的藏品库</span><b>¥${this.money(total)}</b><i>${this.DB.goods.length} 件已建档</i></div>
          <div class="zd-hc zd-hc--q"><span>可贷额度</span><b>¥${this.money(avail)}</b><i>质押率 ${Math.round(this.ZD.ltv * 100)}% · 年化 ${this.ZD.rate} 起</i></div>
        </div>
      </div>`;

      h += `<div class="xzg-card">
        <div class="ct">📦 可选质押藏品<span class="more">点击选中</span></div>
        <div class="zd-grid">${this.DB.goods.map(g => {
          const v = this.zdValue(g.id), can = Math.round(v * this.ZD.ltv);
          return `<button class="zd-item${st.sel === g.id ? ' sel' : ''}" onclick="XZG.zdSelect('${g.id}')">
            <span class="zd-fig">${g.emo}</span>
            <b>${g.name.slice(0, 12)}</b>
            <span class="zd-v">估值 ¥${this.money(v)}</span>
            <span class="zd-c">可贷 ¥${this.money(can)}</span>
          </button>`;
        }).join('')}</div>
      </div>`;

      h += `<div class="xzg-card">
        <div class="ct">🧭 质押流程</div>
        <div class="zd-steps">${[['1', '选择藏品', '从已建档藏品中挑选'], ['2', '智能评估', 'AI 品相鉴定 + 市场估值'], ['3', '申请授信', '工行系统出具额度']].map((s, i) => {
          const done = st.step > i + 1, cur = st.step === i + 1;
          return `<div class="zd-step${done ? ' done' : cur ? ' cur' : ''}"><span class="zs-n">${done ? '✓' : s[0]}</span><div><b>${s[1]}</b><span>${s[2]}</span></div></div>`;
        }).join('')}</div>
      </div>`;

      h += `<div class="xzg-card">
        <div class="ct">📐 双重授信额度评估<span class="more">日更新</span></div>
        <div class="zd-dim">
          ${[['藏品估值', 'market', 92, '近 30 日成交区间 ¥' + this.money(this.DB.goods[0].lo) + '~' + this.money(this.DB.goods[0].hi)],
            ['变现能力', 'flow', 78, '同类目月成交量与挂单去化速度'],
            ['还款能力', 'credit', 88, '账户流水 · 履约记录 · 谷圈信用分 ' + S.credit]].map(d => `
            <div class="zd-drow">
              <span class="zdd-n">${d[0]}</span>
              <div class="zdd-bar"><i style="width:${d[2]}%"></i></div>
              <span class="zdd-v">${d[2]}</span>
              <div class="zdd-d">${d[3]}</div>
            </div>`).join('')}
        </div>
        <div class="xzg-spark-tip">📋 额度由「藏品估值 × 质押率」测算，最终以工行零售信贷系统审批为准；演示环境不产生真实额度</div>
      </div>`;

      if (st.step >= 3 && st.sel) {
        const g = this.DB.goods.find(x => x.id === st.sel);
        const base = this.zdValue(st.sel), can = Math.round(base * this.ZD.ltv);
        h += `<div class="xzg-card zd-result">
          <div class="ct">✅ 授信结果</div>
          <div class="zr-big"><span>可贷额度</span><b>¥${this.money(st.amount || can)}</b></div>
          <div class="zr-rows">
            <div><span>质押物</span><b>${g.name}</b></div>
            <div><span>评估价值</span><b>¥${this.money(base)}</b></div>
            <div><span>质押率</span><b>${Math.round(this.ZD.ltv * 100)}%</b></div>
            <div><span>期限</span><b>${st.term} 期</b></div>
            <div><span>年化利率</span><b>${this.ZD.rate}</b></div>
            <div><span>每期应还</span><b>¥${((st.amount || can) * (1 + 0.0385 * st.term / 12) / st.term).toFixed(2)}</b></div>
          </div>
          <div class="zd-terms">${this.ZD.terms.map(t => `<button class="zt-chip${st.term === t ? ' on' : ''}" onclick="XZG._zd.term=${t};XZG.renderZhidai()">${t} 期</button>`).join('')}</div>
          <button class="xzg-btn big" style="margin-top:12px" onclick="XZG.zdApply()">确认申请 ¥${this.money(st.amount || can)}</button>
          <button class="xzg-btn ghost big" style="margin-top:9px" onclick="XZG._zd={step:1,sel:null,amount:0,term:12};XZG.renderZhidai()">重新选择</button>
        </div>`;
      }
      b.innerHTML = h;
    },
    zdSelect(id) {
      this._zd.sel = id; this._zd.step = 2; this.renderZhidai();
      const base = this.zdValue(id), can = Math.round(base * this.ZD.ltv);
      this.zdAssess(base, can);
    },
    zdAssess(base, quota) {
      this.sheet(`<h3>🔍 智能评估中</h3><div class="ssub">AI 品相鉴定 + 市场估值 + 流动性测算</div>
        <div style="text-align:center;padding:16px 0"><div style="font-size:42px;animation:xzg-pulse 1s infinite">🧮</div>
        <div id="zdTxt" style="margin-top:10px;font-size:12.5px;color:#5b6472">读取藏品档案与历史照片…</div></div>`);
      const msgs = ['读取藏品档案与历史照片…', 'AI 比对官方版权图库与品相特征…', '拉取近 30 日成交区间与挂单深度…', '测算质押率与授信额度…'];
      let i = 0;
      const iv = setInterval(() => {
        i++; const el = this.$('#zdTxt');
        if (i < msgs.length) { if (el) el.textContent = msgs[i]; }
        else {
          clearInterval(iv);
          this._zd.step = 3; this._zd.amount = quota;
          this.sheetClose(); this.renderZhidai();
          this.taskDone('t8');
          this.toast(`评估完成：估值 ¥${this.money(base)}，可贷 ¥${this.money(quota)}`, '🧮');
        }
      }, 680);
    },
    zdApply() {
      const amt = this._zd.amount;
      if (!amt) return;
      this.S.zdLoan = (this.S.zdLoan || 0) + amt;
      this.S.credit = Math.min(950, this.S.credit + 5);
      this.save();
      if (window.ICBCApp) {
        if (ICBCApp.addRecord) ICBCApp.addRecord({ icon: '🏦', bg: '#eefaf6', title: '质押贷放款 · 藏品质押', time: '刚刚', amt: amt });
        if (ICBCApp.setBalance) {
          const nb = (ICBCApp.data.account.balance || 0) + amt;
          ICBCApp.setBalance(nb);
        }
      }
      this.award('b9');
      this._zd = { step: 1, sel: null, amount: 0, term: 12 };
      this.renderZhidai();
      this.sheet(`<h3>🎉 放款成功</h3><div class="ssub">工行零售信贷 · 演示环境</div>
        <div class="zd-done"><b>¥${this.money(amt)}</b><span>已转入尾号 8888 储蓄卡</span></div>
        <div class="xzg-card" style="background:#faf7f2;margin:12px 0 0"><div class="xzg-muted" style="font-size:12px;line-height:2">
        ✓ 质押物已锁定，赎回前不可转让<br>✓ 谷圈信用分 +5<br>✓ 累计质押额度已记入「我的-负债」</div></div>
        <div class="xzg-spark-tip">⚠️ 理性借贷提示：请按约定用途使用资金，逾期将影响征信记录</div>
        <button class="xzg-btn big" style="margin-top:12px" onclick="XZG.sheetClose()">知道了</button>`);
    },

    /* ════════════════════════════════════════════════════════
       三、藏馆 · 数字分身与虚拟展厅
       ════════════════════════════════════════════════════════ */
    CG: {
      styles: [
        { id: 'shelf', name: '展架墙', desc: '木质展架 · 分层陈列' },
        { id: 'room', name: '主题展厅', desc: '冷调展柜 · 射灯打光' },
        { id: 'wall', name: '配色墙', desc: '按色系分组 · 自由排布' }
      ],
      seed: [
        { emo: '🥏', name: '「小e」限定吧唧', cat: '徽章/吧唧', has3d: true, bg: 'linear-gradient(150deg,#ffeaea,#ffd6d6)' },
        { emo: '✨', name: '「星熠」白昼流光立牌', cat: '亚克力立牌', has3d: true, bg: 'linear-gradient(150deg,#eaf1ff,#d6e2ff)' },
        { emo: '🌸', name: '「语棠」樱色絮语手办', cat: '手办/模型', has3d: true, bg: 'linear-gradient(150deg,#fdf0f6,#fbd9e8)' },
        { emo: '🧡', name: '「橙汐」双闪徽章套组', cat: '徽章/吧唧', has3d: false, bg: 'linear-gradient(150deg,#fff4e8,#ffe3c9)' },
        { emo: '☁️', name: '「云间」毛绒挂件', cat: '毛绒/挂件', has3d: false, bg: 'linear-gradient(150deg,#f0f6fb,#dbe8f4)' },
        { emo: '🎫', name: '谷伴系列编号收藏卡', cat: '色纸/票根', has3d: false, bg: 'linear-gradient(150deg,#f3f7ee,#e3efd8)' }
      ],
      friends: [
        { char: 'chengxi', name: '蹲低价的小满', doing: '正在布置「徽章吧」展区' },
        { char: 'yufeng', name: '夜航船', doing: '刚刚上传了 3 件新藏品' },
        { char: 'yutang', name: '吃谷十年的阿棠', doing: '在线 · 可邀请同厅' }
      ]
    },
    _cg: { style: 'shelf', items: null, built: 0 },

    renderCang() {
      const b = this.$('#cangBody'); if (!b) return;
      const st = this._cg;
      if (!st.items) st.items = this.CG.seed.map(x => Object.assign({ built: x.has3d }, x));
      const builtCnt = st.items.filter(x => x.built).length;
      const total = st.items.length;
      const pct = Math.round(builtCnt / total * 100);
      let h = '';

      h += `<div class="cg-hero">
        <div class="cg-hero-l"><b>我的虚拟藏馆</b><span>${builtCnt} / ${total} 件已建数字档案</span>
          <div class="cg-bar"><i style="width:${pct}%"></i></div>
        </div>
        <div class="cg-hero-r"><span class="cg-num">${builtCnt}</span><span class="cg-u">件已建档</span></div>
      </div>`;

      h += `<div class="cg-actions">
        <button class="cg-act" onclick="XZG.cangBuild()"><i>📷</i><b>一键建档</b><span>拍正反面 + 细节照</span></button>
        <button class="cg-act" onclick="XZG.cangAR()"><i>${ico('ar', 22)}</i><b>AR 预览</b><span>放桌上试试怎么摆</span></button>
        <button class="cg-act" onclick="XZG.cangFriends()"><i>👥</i><b>好友共创</b><span>远程同厅一起布展</span></button>
      </div>`;

      h += `<div class="xzg-card">
        <div class="ct">🎨 展厅风格<span class="more">点击切换</span></div>
        <div class="cg-styles">${this.CG.styles.map(s => `
          <button class="cg-style${st.style === s.id ? ' on' : ''}" onclick="XZG.cangStyle('${s.id}')">
            <b>${s.name}</b><span>${s.desc}</span>
          </button>`).join('')}</div>
      </div>`;

      h += `<div class="xzg-card cg-room-card">
        <div class="ct">🖼 展厅预览<span class="more">拖不动？在真机上可自由布展</span></div>
        <div class="cg-room" data-style="${st.style}">
          <div class="cgr-bg"></div>
          <div class="cgr-shelf s1"></div>
          <div class="cgr-shelf s2"></div>
          <div class="cgr-props">${st.items.map((it, i) => `
            <button class="cgr-item" data-i="${i}" ${it.built ? '' : 'data-lock="1"'} onclick="XZG.cangItem(${i})" title="${it.name}">
              <span class="cgi-fig" style="background:${it.bg}">${it.emo}</span>
              <span class="cgi-tag">${it.built ? (it.has3d ? '3D' : '2D') : '待建档'}</span>
            </button>`).join('')}</div>
        </div>
        <div class="xzg-muted" style="font-size:12px;margin-top:9px">✦ 暂不具备建模条件的商品以多视角图片呈现，页面会区分实际拍摄内容与虚拟叠加效果</div>
      </div>`;

      h += `<div class="xzg-card"><div class="ct">📁 我的收藏档案<span class="more">${builtCnt} / ${total}</span></div>
        ${st.items.map((it, i) => `<div class="cg-row">
          <span class="cgr-emo" style="background:${it.bg}">${it.emo}</span>
          <div class="cgr-m"><b>${it.name}</b><span>${it.cat} · ${it.built ? (it.has3d ? '已生成三维展示模型' : '多视角图片档案') : '尚未建档'}</span></div>
          <button class="xzg-btn mini ${it.built ? 'ghost' : ''}" onclick="XZG.cangItem(${i})">${it.built ? '查看' : '去建档'}</button>
        </div>`).join('')}
      </div>`;
      b.innerHTML = h;
    },
    cangStyle(s) { this._cg.style = s; this.renderCang(); },
    /* 副标题条「换展厅风格」：循环切换三种展厅 */
    cangSwitch() {
      const list = this.CG.styles.map(x => x.id);
      const i = (list.indexOf(this._cg.style) + 1) % list.length;
      this.cangStyle(list[i]);
      this.toast(`展厅已切换为「${this.CG.styles[i].name}」`, '🎨');
    },
    cangItem(i) {
      const it = this._cg.items[i]; if (!it) return;
      if (!it.built) return this.cangBuild(i);
      this.sheet(`<h3>${it.emo} ${it.name}</h3><div class="ssub">${it.cat} · ${it.has3d ? '三维展示模型' : '多视角图片档案'}</div>
        <div class="cgr-viewer" style="background:${it.bg}"><span style="font-size:64px">${it.emo}</span>
          ${it.has3d ? '<i class="cgr-spin">↻ 可旋转 / 放大</i>' : '<i class="cgr-spin">多角度图片</i>'}</div>
        <div class="xzg-muted" style="font-size:12px;line-height:1.9;margin-top:10px">
          档案编号：XEG-CG-${String(1000 + i)}<br>收录时间：2026-09-2${(i % 8) + 1}　品相：S 级<br>
          关联项：识谷估值报告 · 编号收藏卡
        </div>
        <div class="cg-vbtns">
          <button class="xzg-btn plain" onclick="XZG.cangAR(${i})">AR 预览</button>
          <button class="xzg-btn ghost" onclick="XZG.sheetClose();XZG.toast('已引用该档案，可直接挂售或交换','📎')">引用去挂售</button>
        </div>`);
    },
    cangBuild(idx) {
      const st = this._cg;
      const target = (typeof idx === 'number') ? idx : st.items.findIndex(x => !x.built);
      if (target < 0) { this.toast('所有藏品都已建档完成 🎉', '📁'); return }
      const it = st.items[target];
      this.sheet(`<h3>📷 一键生成数字分身</h3><div class="ssub">${it.name}</div>
        <div class="xzg-upload" style="margin-top:10px"><div class="uic">${ico('camera', 30)}</div>
          <b>按指引拍摄：正面 / 背面 / 细节</b><p>补充作品、角色、画柄、发售版本与收藏备注</p></div>
        <div id="cgProg" class="cg-prog"><i style="width:0%"></i></div>
        <div class="xzg-muted" id="cgProgTxt" style="font-size:12px;margin-top:8px">准备中…</div>`);
      let p = 0; const steps = ['校验照片清晰度…', '提取商品轮廓与画柄特征…', '匹配商品资料库版本…', '生成三维展示模型…', '写入收藏档案…'];
      const iv = setInterval(() => {
        p += 20;
        const bar = this.$('#cgProg i'), txt = this.$('#cgProgTxt');
        if (bar) bar.style.width = Math.min(100, p) + '%';
        if (txt) txt.textContent = steps[Math.min(steps.length - 1, Math.floor(p / 20) - 1)] || steps[0];
        if (p >= 100) {
          clearInterval(iv);
          st.items[target].built = true;
          st.built = st.items.filter(x => x.built).length;
          if (st.built >= 3) this.award('b10');
          setTimeout(() => {
            this.sheetClose(); this.renderCang(); this.taskDone('t9');
            this.toast(`「${it.name}」数字分身已生成`, '📁');
          }, 420);
        }
      }, 520);
    },
    cangAR(idx) {
      const items = this._cg.items;
      const list = (typeof idx === 'number') ? [items[idx]] : items.filter(x => x.built);
      if (!list.length) return this.toast('先去建一份藏品档案吧', '📷');
      const it = list[0];
      this.sheet(`<h3>📱 AR 现场预览</h3><div class="ssub">把藏品放到现实画面里看看效果</div>
        <div class="cg-ar">
          <div class="cgar-scene"><span class="cgar-cup">☕</span><span class="cgar-book">📖</span></div>
          <div class="cgar-ghost"><span>${it.emo}</span></div>
          <div class="cgar-corner tl"></div><div class="cgar-corner tr"></div>
          <div class="cgar-corner bl"></div><div class="cgar-corner br"></div>
          <span class="cgar-badge">虚拟叠加 · 非实物照片</span>
        </div>
        <div class="cg-ar-tools">
          <button onclick="XZG.toast('已放大展品（演示）','🔍')">放大</button>
          <button onclick="XZG.toast('已调整朝向（演示）','↻')">转向</button>
          <button onclick="XZG.toast('已保存 AR 照片到相册（演示）','💾')">保存照片</button>
          <button onclick="XZG.toast('已生成短视频（演示）','🎬')">录短视频</button>
        </div>
        <div class="xzg-muted" style="font-size:12px;text-align:center">设备或模型暂不支持时，会自动保留普通图片展示入口</div>`);
    },
    cangFriends() {
      this.sheet(`<h3>👥 好友共创 · 云逛展</h3><div class="ssub">远程接入同一展厅，可实时语音、一起布展</div>
        <div class="cg-friends">${this.CG.friends.map(f => `
          <div class="cg-fr"><span class="cgf-ava">${CHARS.head(f.char)}</span>
            <div><b>${f.name}</b><span>${f.doing}</span></div>
            <button class="cgf-btn" onclick="XZG.toast('已邀请 ${f.name} 进入我的展厅','📨')">邀请</button></div>`).join('')}
        </div>
        <div class="xzg-card" style="background:#fafbfd;margin-top:12px">
          <div class="xzg-muted" style="font-size:12px;line-height:2">
          ✓ 多人实时语音 · 边看边聊<br>✓ 协同布展 · 一起调整展架位置<br>✓ 画廊归属感强化 · 作品与藏品挂在同一个厅</div>
        </div>
        <button class="xzg-btn big" style="margin-top:12px" onclick="XZG.sheetClose();XZG.toast('已创建共享展厅链接，可发给同好','🔗')">创建共享展厅</button>`);
    }
  });

  /* 新增任务与勋章（并入原有体系） */
  XZG.DB.tasks.push(
    { id: 't7', emo: '🤖', icb: '#eef3ff', name: '用谷享提一次需求', desc: '说一句话让 AI 帮你比价', rw: 60, done: false, go: 'guxiang' },
    { id: 't8', emo: '🏦', icb: '#eefaf6', name: '试算一次质押额度', desc: '把藏品变成可用额度', rw: 70, done: false, go: 'zhidai' },
    { id: 't9', emo: '📁', icb: '#f4f6fb', name: '建一份藏品档案', desc: '生成你的第一件数字分身', rw: 50, done: false, go: 'cang' }
  );
  XZG.DB.badges.push(
    { id: 'b9', emo: '🏦', name: '授信初体验', desc: '完成一次质押授信测算' },
    { id: 'b10', emo: '📁', name: '建档收藏家', desc: '完成 3 件藏品的数字建档' }
  );

  console.log('[e次元] 三大引擎补齐模块已加载：谷享 / 质押贷 / 藏馆');
})();
