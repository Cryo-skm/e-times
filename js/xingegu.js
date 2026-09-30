/* ════════════════════════════════════════════════════════════════════
   e次元「谷伴计划」四件套 —— 工行手机银行外壳植入脚本
   ─────────────────────────────────────────────────────────────────────
   模块：识谷 AI估值 / 攒谷成长体系 / 出谷通资金托管 / 谷卡 IP联名卡
   挂载方式：监听外壳 app.js 派发的 document 事件「xingegu:open」，
             首次触发时把四个功能页骨架注入 #xingegu-slot，弹窗注入
             #page-xingegu 浮层；之后由外壳 chips 驱动切换。
   桥接外壳能力：ICBCApp.toast / openPage / addRecord
   数据：localStorage 键 xzg_state_v1（与独立版同键不同源，互不影响）
   ════════════════════════════════════════════════════════════════════ */

/* 复用手机银行外壳的线性图标库（app.js 通过 ICBCApp.ico 暴露） */
const ico = (k, w) => (window.ICBCApp && ICBCApp.ico) ? ICBCApp.ico(k, w) : '';

const XZG = {
  KEY:'xzg_state_v1',
  /* 外壳 feature id → 内部页面 id（攒谷外壳拼写为 zangu；plaza=谷圈广场） */
  E2F:{shigu:'shigu',zangu:'zaangu',chugu:'chugu',guka:'guka',plaza:'plaza',forum:'forum',mall:'mall',mine:'mine',brand:'brand',create:'create',exchange:'exchange',guxiang:'guxiang',zhidai:'zhidai',cang:'cang'},
  F2E:{shigu:'shigu',zaangu:'zangu',chugu:'chugu',guka:'guka',plaza:'plaza',forum:'forum',mall:'mall',mallorder:'mall',mine:'mine',brand:'mall',create:'mine',exchange:'mine',guxiang:'guxiang',zhidai:'zhidai',cang:'cang'},
  /* ---- 演示数据库 ---- */
  DB:{
    goods:[
      {id:'g1',name:'工行自有IP「小e」限定马口铁吧唧',ip:'工银e次元',cat:'徽章/吧唧',rar:'SSR',emo:'🥏',base:158,lo:130,hi:280,auth:98.5,vol:'1.4万',heat:98,trend:[210,206,215,220,214,225,232,228,238,245,240,252,260,255,268,262,275,282,278,290,296,289,302,308,300,315,322,318,328,335]},
      {id:'g2',name:'「星熠」白昼流光 亚克力立牌',ip:'e次元谷伴',cat:'亚克力立牌',rar:'S',emo:'✨',base:269,lo:240,hi:460,auth:98.1,vol:'2.1万',heat:96,trend:[252,258,249,261,270,266,274,288,280,292,301,296,310,318,312,325,340,332,348,356,349,362,375,368,382,391,385,398,405,412]},
      {id:'g3',name:'「语棠」樱色絮语 1/7 手办',ip:'e次元谷伴',cat:'手办/模型',rar:'SSR',emo:'🌸',base:1099,lo:980,hi:1580,auth:98.8,vol:'3,600',heat:94,trend:[1020,1035,1018,1050,1068,1055,1080,1096,1082,1110,1128,1115,1140,1158,1146,1172,1190,1178,1206,1224,1212,1240,1258,1246,1274,1292,1280,1308,1326,1340]},
      {id:'g4',name:'「橙汐」双闪徽章套组（3枚）',ip:'e次元谷伴',cat:'徽章/吧唧',rar:'A',emo:'🧡',base:89,lo:75,hi:130,auth:97.6,vol:'8,600',heat:88,trend:[92,90,95,93,98,102,99,105,101,108,112,109,115,111,118,122,119,125,121,128,132,129,135,131,138,142,139,145,148,151]},
      {id:'g5',name:'「云间」毛绒挂件 · 痛包款',ip:'e次元谷伴',cat:'毛绒/挂件',rar:'A',emo:'☁️',base:129,lo:110,hi:190,auth:97.5,vol:'6,400',heat:85,trend:[132,136,133,140,145,142,149,146,153,158,155,162,159,166,171,168,175,172,179,184,181,188,185,192,197,194,201,206,203,209]},
      {id:'g6',name:'谷伴系列 · 编号收藏卡（限量）',ip:'工银e次元',cat:'色纸/票根',rar:'B',emo:'🎫',base:45,lo:38,hi:72,auth:99.0,vol:'3.4万',heat:90,trend:[46,48,47,50,52,51,54,56,55,58,57,61,63,62,65,64,68,70,69,72,71,75,77,76,80,82,81,85,87,89]}
    ],
    badges:[
      {id:'b1',emo:'🥚',name:'首谷纪念',desc:'完成第一次识谷估值'},
      {id:'b2',emo:'🔍',name:'鉴谷达人',desc:'累计识谷满 3 次'},
      {id:'b3',emo:'🛡️',name:'托管先锋',desc:'完成 1 单出谷通托管'},
      {id:'b4',emo:'⭐',name:'信用之星',desc:'谷圈信用分达到 700'},
      {id:'b5',emo:'🌱',name:'攒谷新手',desc:'完成首次签到'},
      {id:'b6',emo:'📅',name:'恒心谷民',desc:'累计签到满 3 天'},
      {id:'b7',emo:'🗳️',name:'投票先锋',desc:'参与谷卡卡面投票'},
      {id:'b8',emo:'💳',name:'分期规划师',desc:'使用分期计算器规划藏品'}
    ],
    tasks:[
      {id:'t1',emo:'🔍',icb:'#e8efff',name:'完成一次识谷',desc:'拍照识别任意谷子',rw:50,done:false,go:'shigu'},
      {id:'t2',emo:'📒',icb:'#e3f7ef',name:'记一笔收支',desc:'把谷子记进收支账本',rw:30,done:false,go:'shigu'},
      {id:'t3',emo:'🛡️',icb:'#e8efff',name:'发起托管订单',desc:'体验出谷通资金托管',rw:80,done:false,go:'chugu'},
      {id:'t4',emo:'🗳️',icb:'#f0ebff',name:'为卡面投票',desc:'谷卡频道 pick 你的本命',rw:40,done:false,go:'guka'},
      {id:'t5',emo:'💳',icb:'#fdf0e3',name:'分期规划一次',desc:'用计算器算大额藏品',rw:40,done:false,go:'guka'},
      {id:'t6',emo:'🪐',icb:'#fdeaea',name:'逛权益星球',desc:'看看本周限定好礼',rw:20,done:false,go:'zaangu'}
    ],
    shop:[ /* cat: ticket票务 / gift礼物 / goods周边好物 */
      {id:'s1',emo:'🥏',icb:'linear-gradient(135deg,#8e4bd6,#5a2fb8)',name:'限定谷子「小e · 星河限定」吧唧',desc:'工行自有IP · 编号限量发行',cost:800,unit:'谷粒',cat:'goods'},
      {id:'s2',emo:'🎟️',icb:'linear-gradient(135deg,#ff8a3d,#ff5c8a)',name:'谷店通用券 50元',desc:'全国合作谷店可用 · 有效期30天',cost:300,unit:'谷粒',cat:'gift'},
      {id:'s3',emo:'🎫',icb:'linear-gradient(135deg,#39c5bb,#1f8f88)',name:'漫展早鸟票 ×1',desc:'本周上新 · CP/GJ类展会通用',cost:1200,unit:'谷粒',cat:'ticket'},
      {id:'s4',emo:'💳',icb:'linear-gradient(135deg,#2b3a55,#6a5cff)',name:'IP联名卡面「葱色律动」',desc:'办谷卡时可直接选用',cost:500,unit:'谷粒',cat:'gift'},
      {id:'s5',emo:'🫘',icb:'linear-gradient(135deg,#f2c56b,#d99b2b)',name:'工银i豆 ×10',desc:'手机银行魔法空间通用权益',cost:200,unit:'谷粒',cat:'goods'},
      {id:'s6',emo:'📦',icb:'linear-gradient(135deg,#3d7eff,#2b5fd0)',name:'谷子防尘展示盒',desc:'PP材质 · 含支架',cost:260,unit:'谷粒',cat:'goods'},
      {id:'s7',emo:'🎤',icb:'linear-gradient(135deg,#ff6b9d,#c73a8e)',name:'谷友专场演唱会票',desc:'二次元歌回 · 前排应援区',cost:2000,unit:'谷粒',cat:'ticket'},
      {id:'s8',emo:'🎪',icb:'linear-gradient(135deg,#7c5cff,#4a2fd8)',name:'主题快闪店优先入场券',desc:'免排队 · 含限定购物袋',cost:1500,unit:'谷粒',cat:'ticket'},
      {id:'s9',emo:'🧸',icb:'linear-gradient(135deg,#ffb46e,#ff8a5c)',name:'限定毛绒挂件 · 痛包款',desc:'官方周边 · 附防伪吊牌',cost:990,unit:'谷粒',cat:'gift'},
      {id:'s10',emo:'🎀',icb:'linear-gradient(135deg,#ff9dc6,#ff6fa5)',name:'生日限定色纸套装',desc:'手绘签名复刻 · 含亚克力框',cost:780,unit:'谷粒',cat:'gift'}
    ],
    seckill:[
      {id:'k1',emo:'🪙',name:'吧唧盲袋×3',price:29.9,old:59,rush:76},
      {id:'k2',emo:'📦',name:'双肩痛包·黑',price:79,old:149,rush:52},
      {id:'k3',emo:'🎀',name:'缎带色纸套装',price:19.9,old:39,rush:88},
      {id:'k4',emo:'🧸',name:'迷你毛绒挂件',price:39,old:69,rush:41},
      {id:'k5',emo:'🖼️',name:'亚克力立牌·小e',price:45,old:89,rush:63}
    ],
    cards:[
      {id:'c1',name:'鎏金牡丹',ip:'工银牡丹',emo:'🌺',grad:'linear-gradient(130deg,#ffb46e 0%,#c7000b 100%)',votes:3241},
      {id:'c2',name:'星轨律动',ip:'e次元谷伴',emo:'✨',grad:'linear-gradient(130deg,#4a6fd8 0%,#7a5cff 100%)',votes:2873},
      {id:'c3',name:'烈焰莲华',ip:'国潮系列',emo:'🔥',grad:'linear-gradient(130deg,#ff8a3d 0%,#c7000b 100%)',votes:4120},
      {id:'c4',name:'墨韵山水',ip:'国潮系列',emo:'🏔️',grad:'linear-gradient(130deg,#243b6b 0%,#4fa88f 100%)',votes:1985}
    ],
    creditF:[['履约记录',92],['托管交易活跃',85],['账户安全',98],['社群行为',78]],
    aiSteps:['提取图像特征向量','比对官方版权图库','品类 / 稀有度评级','30日行情指数比对','真伪与仿冒风险检测']
  },
  /* ---- 状态 ---- */
  DEF(){return{
    grains:1280,beans:8640,se:628,credit:712,exp:340,lv:2,signed:false,signDays:1,
    ledger:[{id:'l1',d:'09-25',type:'out',title:'「星熠」白昼流光立牌',amt:269,tag:'购谷'},
            {id:'l2',d:'09-24',type:'in',title:'出谷 · 旧版吧唧',amt:88,tag:'回血'},
            {id:'l3',d:'09-22',type:'out',title:'漫展门票定金',amt:60,tag:'逛展'}],
    recog:[],recogCnt:0,
    orders:[
      {id:'o1',role:'buy',emo:'🧸',item:'「星熠」白昼流光立牌',price:320,peer:'谷友_3721',step:2,t:'09-26 10:24'},
      {id:'o2',role:'sell',emo:'🥏',item:'「小e」限定马口铁吧唧',price:178,peer:'谷友_9017',step:3,t:'09-25 20:11'}
    ],
    escrow:320,doneCnt:0,
    medals:{},votes:{},myVote:null,
    cardApplied:false,myCard:null,calcUsed:false,shopVisit:false,
    /* ── 商城购物链路：购物车 / 收货地址 / 商城订单 / 物流 ── */
    cart:[],
    addr:{name:'李**',phone:'138****5678',city:'上海市黄浦区',detail:'工银大厦 20F',tag:'家'},
    addrList:[
      {id:'ad1',name:'李**',phone:'138****5678',city:'上海市黄浦区',detail:'工银大厦 20F',tag:'家',def:true},
      {id:'ad2',name:'李**',phone:'138****5678',city:'上海市徐汇区',detail:'漕溪北路 331 号 8 号楼',tag:'公司',def:false}
    ],
    mallOrders:[],
    gender:null   /* 用户性别：boy→美少女风格UI / girl→美少年风格UI */
  }},
  load(){try{const r=localStorage.getItem(this.KEY);return r?Object.assign(this.DEF(),JSON.parse(r)):this.DEF()}catch(e){return this.DEF()}},
  save(){localStorage.setItem(this.KEY,JSON.stringify(this.S))},
  reset(){localStorage.removeItem(this.KEY);location.reload()},
  init(){this.S=this.load()},
  /* ---- 工具 ---- */
  $(s){return document.querySelector(s)},
  uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)},
  money(n){return n.toLocaleString('zh-CN')},
  /* toast 桥接外壳 ICBCApp */
  toast(msg,emo){emo=emo||'✅';if(window.ICBCApp&&ICBCApp.toast)ICBCApp.toast(`${emo} ${msg}`)},
  sheet(html){this.$('#xzgSheet').innerHTML='<div class="grab"></div>'+html;this.$('#xzgMask').classList.add('on')},
  sheetClose(){this.$('#xzgMask').classList.remove('on')},
  addGrains(n,why){this.S.grains+=n;this.S.exp+=Math.round(n/2);this.save();this.syncMine();this.renderZaangu();this.toast(`${why} +${n} 谷粒`,'🌾')},
  checkLevel(){const lv=this.S.exp>=3000?4:this.S.exp>=1500?3:this.S.exp>=600?2:1;const names={1:'谷新',2:'谷民',3:'谷咖',4:'谷神'};if(lv>this.S.lv){this.S.lv=lv;this.toast(`等级提升！恭喜成为「${names[lv]} Lv.${lv}」`,'🎉')}this.S.lvName=names[lv]},
  award(bid){if(this.S.medals[bid])return;this.S.medals[bid]=true;const b=this.DB.badges.find(x=>x.id===bid);this.save();
    /* 同步外壳「我的-魔法空间」勋章墙 */
    const grid=document.querySelector('#medalGrid');
    if(grid&&!grid.querySelector('[data-bid="'+bid+'"]')){const d=document.createElement('div');d.className='medal';d.dataset.bid=bid;d.innerHTML=`<span class="md-ico">${b.emo}</span>${b.name} ★`;grid.prepend(d)}
    this.toast(`解锁勋章「${b.name}」${b.emo}`,'🏅')},
  spark(cv,vals,up){const c=cv.getContext('2d'),w=cv.width=cv.clientWidth*2,h=cv.height=cv.clientHeight*2;const mx=Math.max(...vals),mn=Math.min(...vals);c.beginPath();vals.forEach((v,i)=>{const x=i/(vals.length-1)*w,y=h-6-((v-mn)/(mx-mn||1))*(h-12);i?c.lineTo(x,y):c.moveTo(x,y)});c.strokeStyle=up?'#0aa870':'#c92c3a';c.lineWidth=2.5;c.stroke();c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fillStyle=up?'rgba(10,168,112,.10)':'rgba(201,44,58,.10)';c.fill()},
  bigChart(cv,vals){const c=cv.getContext('2d'),w=cv.width=cv.clientWidth*2,h=cv.height=cv.clientHeight*2;const mx=Math.max(...vals),mn=Math.min(...vals);const X=i=>8+i/(vals.length-1)*(w-16),Y=v=>10+((mx-v)/(mx-mn||1))*(h-24);c.beginPath();vals.forEach((v,i)=>{i?c.lineTo(X(i),Y(v)):c.moveTo(X(i),Y(v))});c.strokeStyle='#c7000b';c.lineWidth=3;c.stroke();for(let i=0;i<vals.length;i+=6){c.beginPath();c.arc(X(i),Y(vals[i]),3.5,0,7);c.fillStyle='#c7000b';c.fill()}c.lineTo(w,h);c.lineTo(0,h);c.closePath();const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(199,0,11,.16)');g.addColorStop(1,'rgba(199,0,11,0)');c.fillStyle=g;c.fill()},

  /* ---- 挂载到外壳 #xingegu-slot ---- */
  _mounted:false,
  mount(fid){
    const p=this.E2F[fid]||'plaza';
    if(!this._mounted){
      this.buildSkeleton();this._mounted=true;
      this.bindRipple(document.querySelector('#xingegu-slot'));
      /* 右上角「⚙ 设置」按钮 → e次元设置 */
      const more=document.querySelector('#page-xingegu .xg-setbtn');
      if(more&&!more.__bound){
        more.__bound=true;
        more.addEventListener('click',()=>this.openSettings());
      }
    }
    this.applyGender();
    this.go(p);
    /* 首次进入：先问性别 —— 谷伴用主人喜欢的画风陪着逛 */
    if(!this.S.gender)setTimeout(()=>this.askGender(),360);
  },
  /* ════ 形象风格：性别决定全站插画（男→美少女 / 女→美少年） ════ */
  applyGender(){
    const pg=document.querySelector('#page-xingegu');
    if(pg)pg.dataset.gender=CHARS.gender();
    this.fillAvatars();
  },
  _headG(id,g){return `<img class="ec-head" src="${CHARS.art(id,g)}" alt="">`},
  askGender(){
    this.sheet(`<h3>欢迎来到 e次元</h3>
      <div class="ssub">先告诉小e你的性别 —— 谷伴们会用你喜欢的样子陪你逛</div>
      <div class="gpick gpick--gender">
        <button class="gp-card${CHARS.isBoy()?' on':''}" onclick="XZG.setGender('boy')">
          <div class="gp-avas"><span>${this._headG('xiaoe','boy')}</span><span>${this._headG('yutang','boy')}</span></div>
          <b>我是男生</b><span class="gp-sub">谷伴以美少女形象出现</span>
          <i class="gp-tag">小e · 星熠 · 语棠…</i>
        </button>
        <button class="gp-card${CHARS.isGirl()?' on':''}" onclick="XZG.setGender('girl')">
          <div class="gp-avas"><span>${this._headG('xiaoe','girl')}</span><span>${this._headG('yutang','girl')}</span></div>
          <b>我是女生</b><span class="gp-sub">谷伴以美少年形象出现</span>
          <i class="gp-tag">小e · 星熠 · 语棠…</i>
        </button>
      </div>
      <div class="xzg-muted" style="font-size:10.5px;margin-top:11px;text-align:center">之后可随时在「我的」页或右上角「⚙ 设置」里切换</div>`);
  },
  /* 首次进入 e次元 的性别选择：选完关掉面板并回到内容页 */
  setGender(g){
    CHARS.setGender(g);
    this.S.gender=g;this.save();
    this.sheetClose();
    this.applyGender();
    this.go(this._lastPg||'plaza');
    this.toast(g==='girl'?'已切换为美少年风格':'已切换为美少女风格','🎨');
  },
  /* 常驻开关（「我的」页 / 设置面板内）：就地切换，不关面板、不跳页 */
  switchGender(g){
    const next=(g==='girl')?'girl':'boy';
    if(CHARS.gender()===next){this.refreshGenderUI();return next;}
    CHARS.setGender(next);                 /* 全站 repaint：角色窗口 + 场景插画就地换 src */
    this.S.gender=next;this.save();
    this.applyGender();
    this.refreshGenderUI();
    this.toast(next==='girl'?'已切换为美少年风格':'已切换为美少女风格','🎨');
    return next;
  },
  /* 把所有性别控件的选中态同步到当前性别（页面内 + 弹层内通吃） */
  refreshGenderUI(){
    const g=CHARS.gender();
    document.querySelectorAll('[data-gsw]').forEach(b=>b.classList.toggle('on',b.dataset.gsw===g));
    const lab=document.getElementById('xzgSetGenderLab');
    if(lab)lab.textContent=(g==='girl'?'美少年':'美少女');
  },
  /* 性别切换控件（可复用片段）：俩按钮 + 选中态 */
  genderSeg(cls){
    const g=CHARS.gender();
    return `<div class="xsb-seg${cls?' '+cls:''}">
        <button data-gsw="boy" class="${g==='boy'?'on':''}" onclick="XZG.switchGender('boy')"><b>美少女</b><span>我是男生</span></button>
        <button data-gsw="girl" class="${g==='girl'?'on':''}" onclick="XZG.switchGender('girl')"><b>美少年</b><span>我是女生</span></button>
      </div>`;
  },
  openSettings(){
    const g=CHARS.gender();
    this.sheet(`<h3>⚙️ e次元设置</h3><div class="ssub">形象风格 · 谷伴 · 演示数据</div>
      <div class="xsb xsb--panel">
        <div class="xsb-t"><b>🎨 插画风格</b><span>谷伴与场景插画按你的性别绘制 · 当前 <i id="xzgSetGenderLab">${g==='girl'?'美少年':'美少女'}</i></span></div>
        ${this.genderSeg()}
      </div>
      <div class="xzg-form">
        <button class="xzg-btn" onclick="XZG.pickCompanionOpen()">🐾 更换谷伴（当前：${CHARS.get(CHARS.current()).name}）</button>
        <button class="xzg-btn" onclick="XZG.openAbout()">ℹ️ 关于 e次元</button>
        <button class="xzg-btn gold" onclick="XZG.resetData()">♻️ 重置演示数据</button>
      </div>`);
  },
  openAbout(){
    this.sheet(`<h3>ℹ️ 关于 e次元</h3>
      <div class="ssub">谷子经济 · 一站式金融服务平台</div>
      <div class="xzg-muted" style="line-height:2;font-size:12px;margin:12px 0 14px">
        本作品为第 17 届「工行杯」全国大学生金融科技创新大赛参赛作品。<br>
        全部角色形象均为原创绘制，不含任何第三方 IP 素材。<br>
        页面中的金融业务、额度与行情数据皆为演示模拟，不构成真实金融服务；<br>
        银行卡卡面为示意设计，不对应任何真实卡种。
      </div>
      <button class="xzg-btn" onclick="XZG.sheetClose()">知道了</button>`);
  },
  resetData(){
    this.sheet(`<h3>♻️ 重置演示数据</h3><div class="ssub">谷粒、订单、投票、成长值都会恢复初始状态</div>
      <div class="xzg-form">
        <button class="xzg-btn gold" onclick="XZG.reset()">确认重置</button>
        <button class="xzg-btn" onclick="XZG.sheetClose()">取消</button>
      </div>`);
  },
  /* ════════ 谷伴角色团（自研原创矢量形象，定义见 js/chars.js） ════════
     不再有首屏强制选择：默认「小e」，用户可在广场公告条随时更换。 */
  SLOT:{shigu:'xingyi',guxiang:'chengxi',chugu:'yunjian',guka:'yufeng',zaangu:'yutang',cang:'moshu',zhidai:'qinghe'},
  slotId(k){return k==='board'?CHARS.current():(this.SLOT[k]||'xiaoe')},
  slotName(k){return CHARS.get(this.slotId(k)).name},
  avatarOf(id){return CHARS.head(id)},
  avatar(kind){return CHARS.head(this.slotId(kind))},
  fillAvatars(){document.querySelectorAll('.sb-ava').forEach(el=>{el.innerHTML=this.avatar(el.dataset.ava)})},
  /* ═══ 更换谷伴（不阻塞首屏，从广场公告条进入） ═══ */
  pickCompanionOpen(){
    const ids=CHARS.list();
    this.sheet(`<h3>🐾 换一位谷伴</h3><div class="ssub">e次元全部角色均为原创形象，随时可换</div>
      <div class="gpick gpick--all">
        ${ids.map(id=>{const c=CHARS.get(id);return`
          <button class="gp-card${CHARS.current()===id?' on':''}" onclick="XZG.pickCompanion('${id}')">
            <div class="gp-avas"><span>${CHARS.head(id)}</span></div>
            <b>${c.name}</b><span class="gp-sub">${c.role}</span>
            <i class="gp-tag">${c.say.slice(0,10)}…</i>
          </button>`}).join('')}
      </div>`);
  },
  pickCompanion(id){
    CHARS.setCurrent(id);this.sheetClose();this.fillAvatars();
    this.renderPlaza();
    /* 当前若停留在「我的」页，同步刷新，否则头像与谷伴卡会残留旧形象 */
    if(this._lastPg==='mine')this.renderMine();
    this.toast(`谷伴已换成「${CHARS.get(id).name}」`,'✨');
  },
  switchStyle(){this.pickCompanionOpen()},
  /* ═══ 谷圈广场（e次元首页 · 金融四件套 + 成长四件套 分组呈现） ═══ */
  renderPlaza(){
    const S=this.S,b=this.$('#plazaBody');if(!b)return;
    const me=CHARS.current(),ME=CHARS.get(me);
    const notices=[['📢','「谷享」上线：全网自动比价'],['🔒','出谷通托管 · 笔笔 +20 谷粒'],['🗳️','谷卡卡面投票赛季进行中']];
    const topics=[['你入坑的第一个谷子是什么？','12.6万 谷友正在聊','🔥 热议'],['吃谷十年，我的房间堆成了展馆','8.2万 谷友正在聊','📈 晒谷'],['漫展回血攻略：这样挂单最快出','5.7万 谷友正在聊','💡 攻略']];
    const CORE=[['shigu','识谷','AI估值·秒出行情价'],['guxiang','谷享','AI代购·全网比价'],['chugu','出谷通','资金托管·验货放款'],['guka','谷卡','联名卡·免息分期']];
    const MORE=[['zhidai','质押','gold'],['cang','藏馆','building'],['zaangu','攒谷','medal'],['mall','商城','gift']];
    b.innerHTML=`
      <div class="plz-welcome">
        <div class="pw-ava ec-ava-wrap">${CHARS.svg(me)}</div>
        <div class="pw-txt"><b>欢迎回来，谷友！</b><span>谷粒 ${this.money(S.grains)} · ${S.lvName||'谷民'} Lv.${S.lv} · 信用分 ${S.credit}</span></div>
        <button class="pw-sign${S.signed?' done':''}" onclick="XZG.signin();XZG.renderPlaza()">${S.signed?'已签到':'签到'}</button>
      </div>
      <div class="plz-notice"><span class="pn-tag">公告</span><div class="pn-roll">${notices.map(n=>`<p>${n[0]} ${n[1]}</p>`).join('')}</div><button class="pn-style" onclick="XZG.switchStyle()">换谷伴</button></div>
      <div class="plz-sechead"><b>⏰ 限时秒杀</b><span>左滑查看更多 · 今晚 20:00 结束</span></div>
      <div class="plz-seckill">${this.DB.seckill.map(k=>{const got=(S.bought||[]).includes(k.id);return`<button class="sk-card${got?' got':''}" onclick="XZG.seckill('${k.id}')"><span class="sk-emo">${k.emo}</span><b>${k.name}</b><span class="sk-price">¥${k.price}<i>¥${k.old}</i></span><span class="sk-bar"><i style="width:${k.rush}%"></i></span><span class="sk-rush">${got?'✓ 已抢到':'已抢 '+k.rush+'%'}</span></button>`}).join('')}</div>
      <div class="plz-sechead"><b>金融服务</b><span>四大核心 · 谷伴值守</span></div>
      <div class="plz-grid">${CORE.map(([k,n,d])=>`
        <button class="plz-card" onclick="XZG.go('${k}')">
          <div class="pc-ava ec-ava-wrap">${CHARS.svg(this.slotId(k))}</div>
          <div class="pc-t"><b>${n}</b><span>${d}</span><i class="pc-name">${this.slotName(k)}</i></div>
        </button>`).join('')}</div>
      <div class="plz-sechead"><b>成长与社区</b><span>边玩边攒</span></div>
      <div class="plz-grid4">${MORE.map(([k,n,ic])=>`
        <button class="plz-mini" onclick="XZG.go('${k}')">
          <span class="pm-ico">${ico(ic,20)}</span><b>${n}</b>
        </button>`).join('')}</div>
      <div class="plz-sechead"><b>话题热榜</b><span>谷友都在聊</span></div>
      <div class="plz-topics">${topics.map(t=>`<button class="pt-row" onclick="XZG.topicOpen('${t[0]}|${t[1]}|${t[2]}')"><div class="pt-main"><b>${t[0]}</b><span>${t[1]}</span></div><i>${t[2]}</i></button>`).join('')}</div>
      <div class="plz-board">
        <div class="pb-ava ec-ava-wrap">${CHARS.svg(me)}</div>
        <div class="pb-bubble"><b>${ME.name} · ${ME.role}</b>${ME.say}</div>
      </div>`;
  },
  buildSkeleton(){
    const slot=document.querySelector('#xingegu-slot');
    const bar=(k,t1,t2,badge)=>`<div class="xzg-subbar"><span class="sb-ava" data-ava="${k}"></span><div class="sb-txt"><b>${t1}</b><span>${t2}</span></div>${badge}</div>`;
    slot.innerHTML=`
      <div class="xzg-fpage on" id="pg-plaza">
        <div class="xzg-body" id="plazaBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-forum">
        <div class="xzg-body" id="forumBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-mall">
        <div class="xzg-body" id="mallBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-mallorder">
        ${bar('chengxi','商城订单 · 我的谷子','下单 → 发货 → 物流 → 收货 全流程可查','<span class="xzg-sbadge" onclick="XZG.go(\'mall\')">🛍 回商城</span>')}
        <div class="xzg-body" id="mallOrderBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-mine">
        <div class="xzg-body" id="mineBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-create">
        <div class="xzg-body" id="createBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-exchange">
        <div class="xzg-body" id="exchangeBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-brand">
        <div class="xzg-body" id="brandBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-shigu">
        ${bar('shigu','识谷 · AI估值助手','拍一拍 → 知行情 · 辨真伪 · 记个账','<span class="xzg-sbadge" onclick="ICBCApp.openPage(\'page-xiaozhi\')">🤖 工小智技能</span>')}
        <div class="xzg-body" id="shiguBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-zaangu">
        ${bar('zaangu','攒谷 · 成长体系','吃谷即成长 · 谷粒兑好礼 · 权益星球','<span class="xzg-sbadge" onclick="ICBCApp.openPage(\'page-magic\')">🏅 魔法空间</span>')}
        <div class="xzg-body" id="zaanguBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-chugu">
        ${bar('chugu','出谷通 · 安全托管','货款进工行托管 · 验货后放款 · 沉淀信用分','<span class="xzg-sbadge" onclick="XZG.riskOpen()">🛡 融安e信</span>')}
        <div class="xzg-body" id="chuguBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-guka">
        ${bar('guka','谷卡 · 联名卡','卡面由你投票定 · 大额藏品可分期 · 开卡送限定谷','<span class="xzg-sbadge" onclick="XZG.gotoCredit()">💳 信用卡频道</span>')}
        <div class="xzg-body" id="gukaBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-guxiang">
        ${bar('guxiang','谷享 · AI 代购比价','说一句话 → 全网盯梢 · 比价 · 自动下单','<span class="xzg-sbadge" onclick="ICBCApp.toast(\'已接入「e谷推」多任务模型与 GPT-Fin 语义解析（演示）\')">🤖 e谷推</span>')}
        <div class="xzg-body" id="guxiangBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-zhidai">
        ${bar('zhidai','质押贷 · 藏品变额度','AI 鉴定 → 市场估值 → 智能授信，最高五成','<span class="xzg-sbadge" onclick="ICBCApp.toast(\'授信由工行零售信贷系统出具，演示环境不产生真实额度\')">🏦 工行授信</span>')}
        <div class="xzg-body" id="zhidaiBody"></div>
      </div>
      <div class="xzg-fpage" id="pg-cang">
        ${bar('cang','藏馆 · 数字分身','每件谷子一份档案 · 虚拟展厅 · AR 预览','<span class="xzg-sbadge" onclick="XZG.cangSwitch()">🎨 换展厅风格</span>')}
        <div class="xzg-body" id="cangBody"></div>
      </div>`;
    /* 弹窗挂在浮层内（脱离 slot 滚动容器，避免跟随滚动） */
    const pg=document.querySelector('#page-xingegu');
    const mask=document.createElement('div');
    mask.className='xzg-mask';mask.id='xzgMask';
    mask.innerHTML='<div class="xzg-sheet" id="xzgSheet"></div>';
    mask.addEventListener('click',e=>{if(e.target===mask)this.sheetClose()});
    pg.appendChild(mask);
    /* 二次元 Q弹动态特效层（蓝色海水 + 粉色樱花）· 挂在浮层最底层 */
    if(!pg.querySelector('.fx-layer')){
      const fx=document.createElement('div');
      fx.className='fx-layer';fx.id='xgFx';fx.dataset.tone='sea';
      fx.innerHTML=this.fxHTML();
      pg.insertBefore(fx,pg.firstChild);
    }
  },
  /* 动态特效：三层波浪 + 上浮气泡 + 飘落樱花（纯几何图形） */
  fxHTML(){
    const wave=`<svg viewBox="0 0 1440 210" preserveAspectRatio="none"><path d="M0,100 C60,40 120,40 180,100 C240,160 300,160 360,100 C420,40 480,40 540,100 C600,160 660,160 720,100 C780,40 840,40 900,100 C960,160 1020,160 1080,100 C1140,40 1200,40 1260,100 C1320,160 1380,160 1440,100 L1440,210 L0,210 Z" fill="rgba(126,206,255,.55)"/></svg>`;
    const waves=[1,2,3].map(i=>`<div class="fx-wave w${i}">${wave}</div>`).join('');
    let bubs='';for(let i=0;i<7;i++){const s=(6+Math.random()*10).toFixed(1);bubs+=`<span class="fx-bub" style="left:${(5+Math.random()*90).toFixed(1)}%;width:${s}px;height:${s}px;animation-duration:${(9+Math.random()*7).toFixed(1)}s;animation-delay:-${(Math.random()*9).toFixed(1)}s"></span>`}
    let pets='';for(let i=0;i<12;i++){const s=(9+Math.random()*7).toFixed(1);pets+=`<span class="fx-petal" style="left:${(Math.random()*96).toFixed(1)}%;width:${s}px;height:${s}px;--dx:${(Math.random()*90-45).toFixed(0)}px;animation-duration:${(8+Math.random()*8).toFixed(1)}s;animation-delay:-${(Math.random()*12).toFixed(1)}s"></span>`}
    return `<div class="fx-glow"></div><div class="fx-sea">${waves}</div>${bubs}${pets}`;
  },
  /* 功能页切换（同步外壳 chips 高亮，不重复派发事件） */
  go(p){
    this._lastPg=p;
    document.querySelectorAll('.xzg-fpage').forEach(x=>x.classList.toggle('on',x.id==='pg-'+p));
    document.querySelectorAll('#xingeguChips .xg-chip').forEach(c=>c.classList.toggle('active',c.dataset.feature===this.F2E[p]));
    this.fillAvatars();
    ({plaza:()=>this.renderPlaza(),shigu:()=>this.renderShigu(),zaangu:()=>this.renderZaangu(),chugu:()=>this.renderChugu(),guka:()=>this.renderGuka(),forum:()=>this.renderForum(),mall:()=>this.renderMall(),mallorder:()=>this.renderMallOrders(),mine:()=>this.renderMine(),brand:()=>this.renderBrand(),create:()=>this.renderCreate(),exchange:()=>this.renderExchange(),guxiang:()=>this.renderGuxiang(),zhidai:()=>this.renderZhidai(),cang:()=>this.renderCang()})[p]();
    const slot=document.querySelector('#xingegu-slot');if(slot)slot.scrollTop=0;
    /* 动态特效色调：商城/广场→海水蓝；我的/论坛→樱花粉 */
    const fx=document.querySelector('#xgFx');
    if(fx)fx.dataset.tone=(p==='mine'||p==='forum')?'sakura':'sea';
  },
  /* 同步外壳「我的」页谷龄成长卡 */
  syncMine(){const S=this.S;this.checkLevel();const th={1:600,2:1500,3:3000,4:5000};
    const nxt=th[S.lv+1]||th[S.lv]+2000,base=S.lv===1?0:th[S.lv];
    const pct=Math.max(4,Math.min(100,Math.round((S.exp-base)/(nxt-base)*100)));
    const sub=document.querySelector('.xg-mine-sub');
    if(sub)sub.textContent=`谷粒 ${this.money(S.grains)} · ${S.lvName} Lv.${S.lv} · 成长值 ${this.money(S.exp)}`;
    const bar=document.querySelector('#xingegu-mine-slot .xg-bar i');
    if(bar)bar.style.width=pct+'%';
    const tag=document.querySelector('.mine-tag--xg');
    if(tag)tag.textContent=`e次元 · ${S.lvName} Lv.${S.lv}`;
  },
  /* 兜底：任何残留的工小智入口都跳到外壳 AI 对话页 */
  chatOpen(){if(window.ICBCApp)ICBCApp.openPage('page-xiaozhi')},
  quoteDetail(id){const g=this.DB.goods.find(x=>x.id===id);const up=g.trend[29]>=g.trend[0];this.sheet(`<h3>${g.emo} ${g.name}</h3><div class="ssub">${g.ip} · ${g.cat} · 稀有度 ${g.rar}</div><div class="xzg-pricebar"><div class="pv"><span>近30日行情指数</span><b>¥${g.trend[29]}</b></div><div class="pv" style="margin-bottom:4px"><span style="color:${up?'#0aa870':'#c92c3a'};font-weight:700;font-size:13px">${up?'↑':'↓'} ${Math.abs((g.trend[29]-g.trend[0])/g.trend[0]*100).toFixed(1)}%</span></div></div><canvas class="xzg-canvas" id="bigCv"></canvas><div class="xzg-hr"></div><div class="xzg-flex" style="justify-content:space-around;text-align:center"><div><b style="font-size:15px">¥${this.money(g.lo)}~${this.money(g.hi)}</b><div class="xzg-muted">参考成交区间</div></div><div><b style="font-size:15px">${g.vol}</b><div class="xzg-muted">月成交量</div></div><div><b style="font-size:15px;color:#0a9a66">${g.auth}%</b><div class="xzg-muted">正版置信度</div></div></div><div style="margin-top:14px"><button class="xzg-btn big" onclick="XZG.go('shigu');XZG.sheetClose()">去识谷估值</button></div>`);setTimeout(()=>{const cv=document.getElementById('bigCv');cv&&this.bigChart(cv,g.trend)},60)},
  /* ---- 账本 ---- */
  ledgerOpen(){const L=this.S.ledger;const out=L.filter(x=>x.type==='out').reduce((s,x)=>s+x.amt,0),inn=L.filter(x=>x.type==='in').reduce((s,x)=>s+x.amt,0);
    this.sheet(`<h3>📒 收支谷账本</h3><div class="ssub">识谷一键记账 · 谷子消费一目了然</div><div class="xzg-calc"><div class="cres"><div class="c"><b style="color:#c92c3a">¥${this.money(out)}</b><span>总支出</span></div><div class="c"><b style="color:#0aa870">¥${this.money(inn)}</b><span>总回血</span></div><div class="c"><b>${L.length}</b><span>笔记录</span></div></div></div><div style="margin-top:10px">${L.map(x=>`<div class="xzg-hist"><div class="hic">${x.type==='in'?'💰':'🛍️'}</div><div class="hm"><b>${x.title}</b><span>${x.d} · ${x.tag}</span></div><div class="hp" style="color:${x.type==='in'?'#0aa870':'#c7000b'}">${x.type==='in'?'+':'-'}¥${x.amt}</div></div>`).join('')}</div>`)}
};
window.XZG=XZG;

/* ================= 识谷 & 攒谷 ================= */
Object.assign(XZG,{
  _sg:{phase:'idle'},_ldType:'out',
  taskDone(id){const t=this.DB.tasks.find(x=>x.id===id);if(!t||t.done)return;t.done=true;this.save();this.addGrains(t.rw,`任务「${t.name}」`)},
  /* ---------- 识谷 ---------- */
  renderShigu(){const S=this.S,sg=this._sg,b=this.$('#shiguBody');
    let h='';
    if(sg.phase==='idle'){
      h+=`<div class="xzg-card"><div class="ct">📷 拍照识谷</div><div class="xzg-upload" onclick="XZG.shiguPick()"><div class="uic">📸</div><b>拍摄 / 从相册选择谷子</b><p>AI 自动识别 IP · 品类 · 稀有度 · 行情价</p></div>
      <div style="display:flex;gap:9px;margin-top:11px"><button class="xzg-btn ghost" style="flex:1;justify-content:center" onclick="XZG.shiguDemo()">🎁 试试示例</button><button class="xzg-btn plain" style="flex:1;justify-content:center" onclick="XZG.shiguRank()">📈 行情库</button></div>
      <div class="ec-ai-note"><span class="ec-ai-ava">${CHARS.head('xiaozhi')}</span><div class="ec-ai-txt"><b>工小智 · 多模态识别</b><span>识别与估值由工行「领航AI+」引擎提供，结果仅供参考</span></div></div></div>`;
      h+=`<div class="xzg-card"><div class="ct">🕘 识别记录<span class="more">共 ${S.recog.length} 条</span></div>`;
      h+=S.recog.length?S.recog.map(r=>`<div class="xzg-hist" onclick="XZG.shiguReopen('${r.id}')"><div class="hic">${r.emo}</div><div class="hm"><b>${r.name}</b><span>${r.time} · ${r.cat} · ${r.rar}</span></div><div class="hp">¥${r.price}</div></div>`).join(''):`<div class="xzg-null"><span class="nic">📭</span>还没有识别记录，拍一张试试吧</div>`;
      h+=`</div>`;
    }
    if(sg.phase==='scan'){
      h+=`<div class="xzg-card"><div class="ct">🤖 AI 识别中</div>
      <div class="xzg-upload preview">${sg.img?`<img src="${sg.img}">`:`<div style="height:190px;display:flex;align-items:center;justify-content:center;font-size:64px;background:linear-gradient(160deg,#fff2f2,#ffeef5)">${sg.item.emo}</div>`}<div class="xzg-scanline"></div></div>
      <div class="xzg-aisteps" id="aiSteps">${XZG.DB.aiSteps.map((s,i)=>`<div class="xzg-aistep" id="as${i}"><div class="st">${i+1}</div><div>${s}</div></div>`).join('')}</div></div>`;
    }
    if(sg.phase==='result'){const g=sg.item,r=sg.res;
      h+=`<div class="xzg-card">
        <div class="xzg-flex" style="gap:13px"><div style="width:86px;height:86px;border-radius:14px;overflow:hidden;flex-shrink:0;background:linear-gradient(160deg,#fff2f2,#ffeef5);display:flex;align-items:center;justify-content:center;font-size:40px">${sg.img?`<img src="${sg.img}" style="width:100%;height:100%;object-fit:cover">`:g.emo}</div>
        <div style="flex:1;min-width:0"><b style="font-size:15px;display:block;line-height:1.35">${g.name}</b><div class="xzg-muted" style="margin-top:3px">${g.ip}</div>
        <div class="xzg-attrs" style="margin:8px 0 0"><span class="xzg-attr">品类 <b>${g.cat}</b></span><span class="xzg-attr">稀有度 <b style="color:#c7000b">${g.rar}</b></span><span class="xzg-attr">品相 <b>${r.cond}分</b></span></div></div></div>
        <div class="xzg-hr"></div>
        <div class="xzg-pricebar"><div class="pv"><span>参考行情价（近30日）</span><b>¥${r.price}</b></div><div class="pv"><span style="color:${g.trend[29]>=g.trend[0]?'#0aa870':'#c92c3a'};font-weight:700">近30日 ${g.trend[29]>=g.trend[0]?'↑':'↓'}${Math.abs((g.trend[29]-g.trend[0])/g.trend[0]*100).toFixed(1)}%</span></div></div>
        <canvas class="xzg-canvas" id="sgChart" style="height:104px"></canvas>
        <div class="xzg-flex" style="justify-content:space-around;text-align:center;margin-top:8px"><div><b style="font-size:14px">¥${this.money(g.lo)}~${this.money(g.hi)}</b><div class="xzg-muted">成交区间</div></div><div><b style="font-size:14px">${g.vol}</b><div class="xzg-muted">月成交量</div></div><div><b style="font-size:14px">${r.cond>=90?'95新':r.cond>=80?'85新':'80新'}</b><div class="xzg-muted">品相评级</div></div></div>
        <div class="xzg-verdict"><div class="vring" style="background:conic-gradient(#0aa870 ${g.auth*3.6}deg,#e6f7ef 0)"><span style="width:48px;height:48px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center">${g.auth}%</span></div>
        <div><b style="font-size:13.5px;color:#0a9a66">${g.auth>=98?'高度疑似正版':'疑似正版 · 建议复核'}</b><div class="xzg-muted" style="margin-top:3px;line-height:1.6">${g.auth>=98?'已比对官方版权图库，微观做工特征符合正版':'检测到 1 处细节存疑：印刷网点间距偏差，建议官方渠道复核'}<br>🛡 鉴定结果已生成区块链存证<br><span style="color:#98a0ad;font-size:10px">HASH 0x${r.hash}</span></div></div></div>
        ${g.auth<98?`<div class="xzg-spark-tip" style="background:#fff4f4;border-color:#ffd9d9;color:#c92c3a">⚠️ 仿冒风险提示：该款在二手平台仿冒率约 ${Math.round(100-g.auth)}%，出谷时建议走「出谷通」托管并附鉴定报告</div>`:''}
        <div class="xzg-acts">
          <div class="xzg-act" onclick="XZG.ledgerAdd()"><div class="aic">📒</div><div class="an">记进账本</div></div>
          <div class="xzg-act" onclick="XZG.shiguSell()"><div class="aic">🏷️</div><div class="an">挂出售卖</div></div>
          <div class="xzg-act" onclick="XZG.shiguReport()"><div class="aic">📄</div><div class="an">估值报告</div></div>
        </div>
        <button class="xzg-btn ghost big" style="margin-top:11px" onclick="XZG._sg={phase:'idle'};XZG.renderShigu()">再识一只</button>
      </div>`;
      setTimeout(()=>{const cv=document.getElementById('sgChart');cv&&this.bigChart(cv,g.trend)},80);
    }
    b.innerHTML=h;},
  shiguPick(){const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=()=>{const f=inp.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>this.shiguStart(rd.result);rd.readAsDataURL(f)};inp.click()},
  shiguDemo(){this.shiguStart(null)},
  shiguStart(img){const g=this.DB.goods[Math.floor(Math.random()*this.DB.goods.length)];this._sg={phase:'scan',item:g,img:img&&img.length<400000?img:null};this.renderShigu();
    const steps=XZG.DB.aiSteps;let i=0;const next=()=>{if(i>0){const p=document.getElementById('as'+(i-1));p.className='xzg-aistep ok';p.querySelector('.st').textContent='✓'}
      if(i<steps.length){const p=document.getElementById('as'+i);if(p){p.className='xzg-aistep doing';p.querySelector('.st').textContent='◌'}i++;setTimeout(next,i===steps.length?400:620)}
      else setTimeout(()=>this.shiguDone(g,img),450)};next()},
  shiguDone(g,img){const cond=78+Math.floor(Math.random()*18);const price=Math.round(g.lo+Math.random()*(g.hi-g.lo));const hash=Math.random().toString(16).slice(2,10)+Math.random().toString(16).slice(2,10);
    const rec={id:this.uid(),time:'09-27 '+new Date().toTimeString().slice(0,5),gid:g.id,name:g.name,emo:g.emo,cat:g.cat,rar:g.rar,price,auth:g.auth,cond,hash,img:img&&img.length<60000?img:null};
    this.S.recog.unshift(rec);this.S.recogCnt++;this.save();this._sg={phase:'result',item:g,img:rec.img,res:{price,cond,hash}};
    this.taskDone('t1');this.award('b1');if(this.S.recogCnt>=3)this.award('b2');this.renderShigu();this.toast('识别完成！看看估值结果','🔍')},
  shiguReopen(id){const r=this.S.recog.find(x=>x.id===id);if(!r)return;const g=this.DB.goods.find(x=>x.id===r.gid)||this.DB.goods[0];this._sg={phase:'result',item:g,img:r.img,res:{price:r.price,cond:r.cond,hash:r.hash}};this.renderShigu()},
  shiguRank(){this.sheet(`<h3>📈 谷子行情库</h3><div class="ssub">谷子指数 · 数据每 5 分钟刷新（演示）</div>${this.DB.goods.map(g=>{const up=g.trend[29]>=g.trend[0];return`<div class="xzg-hist" onclick="XZG.quoteDetail('${g.id}')"><div class="hic">${g.emo}</div><div class="hm"><b>${g.name}</b><span>${g.ip} · ${g.rar} · 热度 ${g.heat}</span></div><div class="hp" style="color:${up?'#0aa870':'#c7000b'}">¥${g.trend[29]} ${up?'↑':'↓'}</div></div>`}).join('')}`)},
  ledgerAdd(){const g=this._sg.item,r=this._sg.res;if(!g)return;
    this.sheet(`<h3>📒 记进收支账本</h3><div class="ssub">${g.name}</div>
    <div class="xzg-seg" id="ldSeg"><div class="sg on" onclick="XZG._ldType='out';this.parentNode.querySelectorAll('.sg').forEach(x=>x.classList.remove('on'));this.classList.add('on')">支出（购入）</div><div class="sg" onclick="XZG._ldType='in';this.parentNode.querySelectorAll('.sg').forEach(x=>x.classList.remove('on'));this.classList.add('on')">收入（回血）</div></div>
    <div class="xzg-form"><div class="fi"><label>金额 ¥</label><input id="ldAmt" type="text" value="${r.price}"></div><div class="fi"><label>分类</label><select id="ldTag"><option>购谷</option><option>回血</option><option>逛展</option><option>吃谷周边</option></select></div></div>
    <button class="xzg-btn big" onclick="XZG.ledgerSave()">确认记一笔</button>`)},
  ledgerSave(){const amt=parseInt(this.$('#ldAmt').value)||this._sg.res.price;const tag=this.$('#ldTag').value;const type=this._ldType||'out';const g=this._sg.item;
    this.S.ledger.unshift({id:this.uid(),d:'09-27',type,title:g.name,amt,tag});this.save();
    /* 桥接外壳：同步写入手机银行「收支明细」 */
    if(window.ICBCApp&&ICBCApp.addRecord)ICBCApp.addRecord({icon:type==='in'?'💰':'🛍️',bg:type==='in'?'#e3f7ef':'#fdecec',title:'e次元 · '+g.name.slice(0,12),amt:type==='in'?amt:-amt});
    this.sheetClose();this.taskDone('t2');this.toast(type==='in'?'已记入收入，回血快乐💰':'已记入支出，理性吃谷📒')},
  shiguSell(){const g=this._sg.item,r=this._sg.res;if(!g)return;
    this.sheet(`<h3>🏷️ 挂出售卖 · 出谷通</h3><div class="ssub">将通过工行托管交易，买家验货后放款</div>
    <div class="xzg-form"><div class="fi"><label>挂售价 ¥</label><input id="slPrice" type="text" value="${r.price}"></div><div class="fi"><label>商品</label><input type="text" value="${g.name}" disabled style="color:#98a0ad"></div></div>
    <div class="xzg-spark-tip">🛡️ 挂售附赠：AI 鉴定报告（${g.auth}%）+ 区块链存证，买家更放心</div>
    <button class="xzg-btn big" style="margin-top:12px" onclick="XZG.shiguSellOk()">确认挂售</button>`)},
  shiguSellOk(){const price=parseInt(this.$('#slPrice').value)||this._sg.res.price;const g=this._sg.item;
    this.S.orders.unshift({id:this.uid(),role:'sell',emo:g.emo,item:g.name,price,peer:'等待买家拍下',step:0,t:'09-27 '+new Date().toTimeString().slice(0,5)});this.save();this.sheetClose();this.taskDone('t3');this.toast('已挂售！进入出谷通托管流转','🏷️');setTimeout(()=>this.go('chugu'),600)},
  shiguReport(){const g=this._sg.item,r=this._sg.res;
    this.sheet(`<h3>📄 AI 估值报告</h3><div class="ssub">e次元 × 工商银行 · 领航AI+ 引擎</div>
    <div style="background:#faf7f2;border-radius:14px;padding:14px;font-size:12.5px;line-height:2">
    <b style="font-size:14px">${g.emo} ${g.name}</b><br>IP 版权方：${g.ip}<br>品类：${g.cat} ｜ 稀有度：${g.rar}<br>品相评分：${r.cond} / 100<br>参考行情价：<b style="color:#c7000b">¥${r.price}</b>（区间 ¥${this.money(g.lo)}~${this.money(g.hi)}）<br>正版置信度：<b style="color:#0a9a66">${g.auth}%</b><br>存证哈希：0x${r.hash}<br>报告编号：XEG-2026${r.hash.slice(0,6).toUpperCase()}</div>
    <div class="xzg-spark-tip">💡 本报告可用于「出谷通」挂售背书、谷子质押授信参考</div>
    <button class="xzg-btn plain big" style="margin-top:12px" onclick="XZG.sheetClose();XZG.toast('报告已保存到「我的-卡包」（演示）','📄')">保存报告</button>`)},
  /* ---------- 攒谷 ---------- */
  renderZaangu(){const S=this.S;this.checkLevel();const th={1:600,2:1500,3:3000,4:5000};const cur=th[S.lv],nxt=th[S.lv+1]||cur;const pct=Math.min(100,Math.round((S.exp-(S.lv===1?0:th[S.lv]))/(nxt-(S.lv===1?0:th[S.lv]))*100));
    const b=this.$('#zaanguBody');let h='';
    h+=`<div class="xzg-card"><div class="xzg-level"><div class="ring" style="background:conic-gradient(#e0503c ${pct*3.6}deg,#f0f1f5 0)"><div class="in"><b>${S.lvName}</b><span>Lv.${S.lv}</span></div></div>
      <div class="lm"><div class="xzg-flex" style="justify-content:space-between"><b style="font-size:15px">成长值 ${this.money(S.exp)}</b><span class="xzg-muted">下一级 ${this.money(nxt)}</span></div><div class="bar"><i style="width:${pct}%"></i></div>
      <div class="xzg-flex" style="margin-top:9px;gap:16px"><div><span class="xzg-tag gold">🌾 谷粒 ${this.money(S.grains)}</span></div><div><span class="xzg-tag">🫘 i豆 ${this.money(S.beans)}</span></div></div></div></div>
      <div class="xzg-muted" style="margin-top:11px;font-size:11px">✦ 吃谷消费、攒钱、二手成交、逛展都会自动转化为成长值</div></div>`;
    h+=`<div class="xzg-card"><div class="ct">📅 每日签到<span class="more">已连签 ${S.signDays} 天</span></div><div class="xzg-checkin">${Array.from({length:7},(_,i)=>{const hit=i<Math.min(S.signDays,7);return`<div class="xzg-cday${hit?' hit':''}${i===Math.min(S.signDays,7)&&!S.signed?' today':''}" ${!S.signed&&i===Math.min(S.signDays,7)?`onclick="XZG.signin()"`:''}><span class="cd">${hit?'🌱':i+1}</span>${i===6?'第7天':'D'+(i+1)}</div>`}).join('')}</div>
      <div class="xzg-muted" style="margin-top:9px;font-size:11px">${S.signed?'今日已签到 ✓ 明天再来～':'点击今日格子签到 +20 谷粒'}</div></div>`;
    h+=`<div class="xzg-card"><div class="ct">⚡ 攒谷任务<span class="more">做任务得谷粒</span></div>${this.DB.tasks.map(t=>`<div class="xzg-task"><div class="tic" style="background:${t.icb}">${t.emo}</div><div class="tm"><b>${t.name}</b><span>${t.desc}</span></div><span class="trw">+${t.rw}</span>${t.done?`<button class="xzg-btn ghost mini dis">已完成</button>`:`<button class="xzg-btn mini" onclick="XZG.go('${t.go}')">去完成</button>`}</div>`).join('')}</div>`;
    h+=`<div class="xzg-card"><div class="ct">🏅 勋章墙<span class="more">${Object.keys(S.medals).length}/${this.DB.badges.length}</span></div><div class="xzg-medal-grid">${this.DB.badges.map(bd=>`<div class="xzg-medal${S.medals[bd.id]?'':' lock'}" title="${bd.desc}"><div class="mic">${bd.emo}</div><div class="mn">${bd.name}</div></div>`).join('')}</div></div>`;
    h+=`<div class="xzg-card" style="background:linear-gradient(135deg,#fff0f6,#ffe0ec)"><div class="ct">🎁 谷子盲盒<span class="more">100谷粒/抽 · 必中</span></div><div class="xzg-flex" style="gap:10px;margin-top:10px">${['🥏','🧸','🎀','🎟️','💫'].map(e=>`<div style="flex:1;aspect-ratio:1;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 3px 12px rgba(255,111,161,.18)">${e}</div>`).join('')}</div><div class="xzg-flex" style="justify-content:space-between;align-items:center;margin-top:12px"><span class="xzg-muted" style="font-size:11px">有机会开出谷粒翻倍 / i豆 / 限定谷</span><button class="xzg-btn gold mini" onclick="XZG.blindBox()">抽一次 🌾100</button></div></div>`;
    const cats={all:'全部',ticket:'🎫 票务',gift:'🎁 礼物',goods:'🛍 好物'};const shopCat=S.shopCat||'all';
    h+=`<div class="xzg-card"><div class="ct">🪐 权益星球<span class="more">谷粒兑换</span></div><div class="zk-tabs">${Object.keys(cats).map(k=>`<button class="zk-tab${shopCat===k?' on':''}" onclick="XZG.setShopCat('${k}')">${cats[k]}</button>`).join('')}</div>${this.DB.shop.filter(s=>shopCat==='all'||s.cat===shopCat).map(s=>{const owned=(S.owned||[]).includes(s.id);return`<div class="xzg-shop-item"><div class="sic" style="background:${s.icb}">${s.emo}</div><div class="sm"><b>${s.name}</b><span>${s.desc}</span><span class="cost">🌾 ${s.cost} ${s.unit}</span></div>${owned?`<button class="xzg-btn ghost mini dis">✓ 已兑换</button>`:`<button class="xzg-btn gold mini ${S.grains<s.cost?'dis':''}" onclick="XZG.redeem('${s.id}')">兑换</button>`}</div>`}).join('')}`;
    if(S.redeemed&&S.redeemed.length)h+=`<div class="xzg-hr"></div><div class="xzg-muted" style="margin-bottom:6px">兑换记录</div>${S.redeemed.slice(0,3).map(r=>`<div class="xzg-muted" style="padding:3px 0;font-size:11px">✓ ${r.name} <span style="color:#98a0ad">（-${r.cost} 谷粒）</span></div>`).join('')}`;
    b.innerHTML=h;
    if(!S.shopVisit){S.shopVisit=true;this.save();setTimeout(()=>this.taskDone('t6'),800)}
  },
  signin(){if(this.S.signed)return this.toast('今天已经签到过啦','📅');this.S.signed=true;this.S.signDays++;this.save();this.award('b5');if(this.S.signDays>=3)this.award('b6');this.addGrains(20,'每日签到')},
  redeem(id){const s=this.DB.shop.find(x=>x.id===id);if(this.S.grains<s.cost)return this.toast('谷粒不足，先去做任务攒一攒','🥺');
    this.sheet(`<h3>🪐 确认兑换</h3><div class="ssub">兑换后谷粒不可退回</div><div class="xzg-shop-item" style="border:none;padding:4px 0"><div class="sic" style="background:${s.icb}">${s.emo}</div><div class="sm"><b>${s.name}</b><span>${s.desc}</span></div></div><div class="xzg-hr"></div><div class="xzg-flex" style="justify-content:space-between"><span class="xzg-muted">消耗谷粒</span><b style="color:#c08a1e">🌾 ${s.cost}</b></div><div class="xzg-flex" style="justify-content:space-between;margin-top:6px"><span class="xzg-muted">兑换后余额</span><b>🌾 ${this.money(this.S.grains-s.cost)}</b></div><button class="xzg-btn gold big" style="margin-top:14px" onclick="XZG.redeemOk('${s.id}')">确认兑换</button>`)},
  redeemOk(id){const s=this.DB.shop.find(x=>x.id===id);if(this.S.grains<s.cost)return;this.S.grains-=s.cost;this.S.exp+=20;this.S.owned=this.S.owned||[];this.S.owned.push(s.id);this.S.redeemed=this.S.redeemed||[];this.S.redeemed.unshift({name:s.name,cost:s.cost});this.save();this.sheetClose();this.renderZaangu();this.syncMine();this.bumpGrains();this.toast(`兑换成功「${s.name}」已放入权益背包，成长值 +20`,'🎉')},
  bumpGrains(){const el=document.querySelector('#zaanguBody .xzg-tag.gold');if(el){el.classList.add('bump');setTimeout(()=>el.classList.remove('bump'),650)}},
  setShopCat(k){this.S.shopCat=k;this.save();this.renderZaangu()},
  blindBox(){if(this.S.grains<100)return this.toast('谷粒不足100，先做任务攒一攒','🥺');this.S.grains-=100;this.save();this.renderZaangu();this.syncMine();
    this.sheet(`<h3>🎁 谷子盲盒</h3><div class="ssub">已消耗 100 谷粒 · 点击礼物盒拆开</div><button class="bb-box" onclick="XZG.pickBox()">🎁</button>`)},
  pickBox(){const pool=[
      {emo:'🌾',t:'谷粒 +150',fn(){this.S.grains+=150}},
      {emo:'🌾',t:'谷粒 +80',fn(){this.S.grains+=80}},
      {emo:'🫘',t:'工银i豆 +30',fn(){this.S.beans+=30}},
      {emo:'🥏',t:'限定吧唧「盲盒款·小e」',fn(){this.S.owned=this.S.owned||[];this.S.owned.push('bb-pin')}},
      {emo:'🎫',t:'谷店券 20元',fn(){this.S.owned=this.S.owned||[];this.S.owned.push('bb-cp')}},
      {emo:'💫',t:'谢谢参与 · 返还 50 谷粒',fn(){this.S.grains+=50}}
    ];const r=pool[Math.floor(Math.random()*pool.length)];r.fn.call(this);this.save();this.renderZaangu();this.syncMine();this.bumpGrains();
    this.sheet(`<div class="bb-res"><span class="bb-emo">${r.emo}</span><b>开出「${r.t}」</b><span class="ssub">已放入权益背包 / 账户</span></div><button class="xzg-btn gold big" onclick="XZG.sheetClose()">开心收下</button>`)},
  seckill(id){const k=this.DB.seckill.find(x=>x.id===id);this.S.bought=this.S.bought||[];if(this.S.bought.includes(id))return this.toast('这个已经抢到啦','🎉');this.S.bought.push(id);this.save();this.renderPlaza();this.toast(`秒杀成功「${k.name}」¥${k.price} 已锁定`,'⚡')},
  /* 点击涟漪（Q弹反馈） */
  bindRipple(root){root.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.classList.contains('dis'))return;const r=b.getBoundingClientRect();const d=Math.max(r.width,r.height);const s=document.createElement('span');s.className='rp';s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;if(getComputedStyle(b).position==='static')b.style.position='relative';if(getComputedStyle(b).overflow!=='hidden')b.style.overflow='hidden';b.appendChild(s);setTimeout(()=>s.remove(),560)})}
});

/* ================= 出谷通 & 谷卡 ================= */
Object.assign(XZG,{
  _cgSeg:'all',_ocRole:'buy',_cgN:12,
  _steps:['创建订单','付款至托管','卖家发货','买家验货','放款完成'],
  /* ---------- 出谷通 ---------- */
  renderChugu(){const S=this.S,b=this.$('#chuguBody');
    const escrowAmt=S.orders.filter(o=>o.role==='buy'&&o.step>=1&&o.step<4).reduce((s,o)=>s+o.price,0);
    const doneSell=S.orders.filter(o=>o.role==='sell'&&o.step===4);
    let h=`<div class="xzg-escrow-banner"><div class="eic">🏦</div><div style="flex:1"><b style="font-size:14px">工行托管账户 · 资金安全隔离</b><div style="font-size:11px;opacity:.8;margin-top:2px">当前托管中 <b style="font-size:15px">¥${this.money(escrowAmt)}</b>${doneSell.length?` ｜ 已回款 <b>¥${doneSell.reduce((s,o)=>s+o.price,0)}</b>`:''}</div></div><span style="font-size:10px;background:rgba(255,255,255,.14);padding:4px 9px;border-radius:12px">🛡 融安e信</span></div>`;
    const cf=this.DB.creditF;
    h+=`<div class="xzg-credit"><div class="cring" style="background:conic-gradient(#0aa870 ${S.credit/10}deg,#e6f7ef 0)"><div class="cin"><b>${S.credit}</b><span>谷圈信用分</span></div></div>
      <div class="cf">${cf.map(([n,v])=>`<div class="fr"><span style="width:76px;flex-shrink:0">${n}</span><div class="fbar"><i style="width:${v}%"></i></div><span style="width:30px;text-align:right;color:${v>=90?'#0aa870':'#5b6472'}">${v}</span></div>`).join('')}</div></div>
      <div class="xzg-muted" style="font-size:11px;margin:-4px 0 14px 4px">✦ 每完成 1 单托管交易 信用分 +2 ｜ 信用分越高，挂售曝光越多、可申请额度越高</div>`;
    h+=`<div class="xzg-seg">${[['all','全部'],['buy','我买入'],['sell','我卖出']].map(([k,n])=>`<div class="sg${this._cgSeg===k?' on':''}" onclick="XZG._cgSeg='${k}';XZG.renderChugu()">${n}</div>`).join('')}</div>`;
    h+=`<button class="xzg-btn big" style="margin-bottom:14px" onclick="XZG.orderCreate()">➕ 新建托管订单</button>`;
    const list=S.orders.filter(o=>this._cgSeg==='all'||o.role===this._cgSeg);
    h+=list.length?list.map(o=>{const isBuy=o.role==='buy';
      let tip='',btn='';
      if(o.step===0){tip=isBuy?'等待买家付款':'等待买家拍下';btn=isBuy?`<button class="xzg-btn mini" onclick="XZG.orderPay('${o.id}')">去付款</button>`:`<button class="xzg-btn plain mini" onclick="XZG.toast('已生成分享卡片，发给同好试试','🔗')">分享</button>`}
      if(o.step===1){tip=isBuy?'资金已入工行托管 · 等待卖家发货':'买家已付款，尽快发货';btn=isBuy?`<button class="xzg-btn plain mini" onclick="XZG.toast('已提醒卖家发货','📣')">提醒发货</button>`:`<button class="xzg-btn mini" onclick="XZG.orderShip('${o.id}')">去发货</button>`}
      if(o.step===2){tip=isBuy?'卖家已发货 · 请收货验货（72h）':'已发货 · 等待买家验货';btn=isBuy?`<button class="xzg-btn mini" onclick="XZG.orderCheck('${o.id}')">确认验货</button>`:''}
      if(o.step===3){tip=isBuy?'验货通过 · 确认后放款给卖家':'买家验货通过 · 等待放款';btn=isBuy?`<button class="xzg-btn gold mini" onclick="XZG.orderRelease('${o.id}')">确认放款</button>`:`<button class="xzg-btn plain mini" onclick="XZG.orderRelease('${o.id}')">查收货款</button>`}
      if(o.step===4){tip=isBuy?'交易完成 · 已放款':'交易完成 · 货款已到账';btn=''}
      return`<div class="xzg-order"><div class="oh"><div class="oic">${o.emo}</div><div class="ot"><b>${o.item}</b><span>${isBuy?'向':'卖给'} ${o.peer} · ${o.t}</span></div><div class="op">¥${this.money(o.price)}</div></div>
      <div class="xzg-steps">${this._steps.map((s,i)=>`<div class="xzg-step${i<o.step?' done':i===o.step&&o.step<4?' cur':o.step===4?' done':''}"><div class="sd">${i<o.step||o.step===4?'✓':i+1}</div>${s}</div>`).join('')}</div>
      <div class="xzg-ofoot"><span class="otip">${o.step===1&&isBuy?'🔒 资金由工商银行托管，确认验货前卖家无法动用':o.step===4?'🎉 双向好评 +2 信用分':'⏱ '+tip}</span>${btn}</div></div>`}).join(''):`<div class="xzg-card"><div class="xzg-null"><span class="nic">🗂️</span>暂无订单 · 从识谷「挂出售卖」或点击上方新建</div></div>`;
    h+=`<div class="xzg-card" style="background:linear-gradient(135deg,#eefaf4,#f4fbff)"><div class="ct" style="margin-bottom:6px">🛡️ 出谷通三重保障</div><div class="xzg-muted" style="font-size:11.5px;line-height:2">① 资金托管：货款先进工行托管账户，杜绝跑路<br>② 融安e信：下单前自动扫描对方交易风险<br>③ 72h 验货期：确认无误才放款，纠纷可申诉</div></div>`;
    b.innerHTML=h},
  orderPay(id){const o=this.S.orders.find(x=>x.id===id);if(!o)return;o.step=1;this.save();this.renderChugu();this.toast(`¥${o.price} 已存入工行托管账户`,'🔒')},
  orderShip(id){const o=this.S.orders.find(x=>x.id===id);if(!o)return;o.step=2;this.save();this.renderChugu();this.toast('已发货 · 等待买家验货','📦')},
  orderCheck(id){const o=this.S.orders.find(x=>x.id===id);if(!o)return;o.step=3;this.save();this.renderChugu();this.toast('验货通过！确认后放款','✅')},
  orderRelease(id){const o=this.S.orders.find(x=>x.id===id);if(!o)return;o.step=4;o.t=this._now();this.S.doneCnt++;this.S.credit=Math.min(950,this.S.credit+2);this.save();this.award('b3');this.renderChugu();
    o.role==='sell'?this.addGrains(15,'出谷回款到账'):this.toast('放款成功！交易完成，信用分 +2','🎉')},
  orderCreate(){this.sheet(`<h3>➕ 新建托管订单</h3><div class="ssub">融安e信将自动扫描交易风险</div>
    <div class="xzg-seg" id="ocSeg"><div class="sg on" onclick="XZG._ocRole='buy';this.parentNode.querySelectorAll('.sg').forEach(x=>x.classList.remove('on'));this.classList.add('on')">我要买</div><div class="sg" onclick="XZG._ocRole='sell';this.parentNode.querySelectorAll('.sg').forEach(x=>x.classList.remove('on'));this.classList.add('on')">我要卖</div></div>
    <div class="xzg-form">
      <div class="fi"><label>谷子</label><select id="ocItem">${this.DB.goods.map(g=>`<option value="${g.id}">${g.emo} ${g.name}</option>`).join('')}</select></div>
      <div class="fi"><label>价格 ¥</label><input id="ocPrice" type="text" placeholder="输入成交价"></div>
      <div class="fi"><label>交易方</label><input id="ocPeer" type="text" placeholder="对方谷友昵称"></div></div>
    <button class="xzg-btn big" onclick="XZG.orderScan()">发起融安e信风控扫描</button>`)},
  orderScan(){const gid=this.$('#ocItem').value,price=parseInt(this.$('#ocPrice').value),peer=this.$('#ocPeer').value||'谷友_'+Math.floor(1000+Math.random()*9000);
    if(!price||price<=0)return this.toast('请输入正确的价格','⚠️');
    const g=this.DB.goods.find(x=>x.id===gid);const role=this._ocRole||'buy';
    this.sheet(`<h3>🛡️ 融安e信 · 风控扫描中</h3><div class="ssub">工商银行安全实验室</div>
    <div style="text-align:center;padding:18px 0"><div style="font-size:44px;animation:xzg-pulse 1s infinite">🛡️</div><div style="margin-top:10px;font-size:12.5px;color:#5b6472" id="scanTxt">正在核验交易方信用画像…</div></div>`);
    const msgs=['正在核验交易方信用画像…','扫描历史交易纠纷记录…','校验谷子防伪存证…','生成风控评估报告…'];let i=0;
    const iv=setInterval(()=>{i++;if(i<msgs.length){const el=document.getElementById('scanTxt');el&&(el.textContent=msgs[i])}else{clearInterval(iv);
      this.S.orders.unshift({id:this.uid(),role,emo:g.emo,item:g.name,price,peer,t:this._now(),step:0});this.save();this.taskDone('t3');this.sheetClose();this.renderChugu();this.toast('风控通过 ✅ 订单已创建','🛡️')}},650)},
  _now(){const d=new Date();return`09-27 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`},
  /* ---------- 谷卡 ---------- */
  _cardSel:'c1',_cardStep:1,
  renderGuka(){const S=this.S,b=this.$('#gukaBody');const votes=c=>c.votes+(S.votes[c.id]||0);
    let h='';
    if(S.cardApplied&&S.myCard){const c=this.DB.cards.find(x=>x.id===S.myCard);
      h+=`<div class="xzg-bankcard" style="background:${c.grad}"><div class="cdeco"></div><div class="cdeco c2"></div>
        <div class="cbank"><div class="clogo">工</div>中国工商银行 · e次元联名</div>
        <div style="font-size:26px;align-self:flex-start">${c.emo} <span style="font-size:13px;opacity:.9">${c.name}</span></div>
        <div class="cnum">6222 08•• •••• ${S.credit%10000}</div>
        <div class="cfoot"><span>谷友_8437</span><span>有效期 2031/12</span><span style="font-size:16px;font-style:italic;font-weight:700">UnionPay 银联</span></div></div>
      <div class="xzg-card" style="margin-top:14px"><div class="ct">🎁 开卡礼已发放</div><div class="xzg-muted" style="font-size:12px;line-height:2">✓ 限定谷「小e · 星河限定」吧唧 ×1（已入权益背包）<br>✓ 谷店消费 95 折（每月前3笔）<br>✓ 大额藏品分期 12 期免手续费</div></div>`;
    } else {
      h+=`<div class="xzg-banner" style="background:linear-gradient(120deg,#c7000b,#8e0008);padding:17px 16px" onclick="XZG.cardApply()"><div class="bic">💳</div><div style="flex:1"><b style="font-size:15px">e次元 IP 联名卡</b><span>卡面投票定制 · 开卡送限定谷 · 在线申卡</span></div><div class="go" style="font-size:20px">›</div></div>`;
    }
    h+=`<div class="xzg-card"><div class="ct">🗳️ 本季卡面投票<span class="more">${S.myVote?'已投 ✓':'每人1票'}</span></div><div class="xzg-cardvote">${this.DB.cards.map(c=>`<div class="xzg-vcard${S.myVote===c.id?' sel':''}" onclick="XZG.vote('${c.id}')"><div class="xzg-bankcard" style="background:${c.grad}"><div class="cdeco"></div><div class="cbank" style="font-size:10px"><div class="clogo" style="width:17px;height:17px;font-size:9px">工</div>工商银行</div><div style="font-size:19px">${c.emo}</div><div class="cfoot"><span style="font-size:9px">${c.name}</span><span style="font-size:12px;font-style:italic">UnionPay</span></div></div><div class="vn">${c.ip}·${c.name}<span class="vk${S.myVote===c.id?' voted':''}">${this.money(votes(c))}票</span></div></div>`).join('')}</div><div class="xzg-muted" style="font-size:11px">得票第一的卡面将进入下季正式发行，投票可得谷粒奖励</div></div>`;
    h+=`<div class="xzg-card xzg-calc"><div class="ct">🧮 大额藏品分期计算器<span class="xzg-tag r" style="margin-left:4px">e次元专属12期免息</span></div>
      <div class="crow"><label>藏品金额</label><input type="text" id="cgAmt" value="600" oninput="XZG.calc()"></div>
      <div class="crow"><label>分期期数</label><div class="chips" id="cgChips">${[3,6,12,24].map(n=>`<div class="chip${n===12?' on':''}" onclick="XZG._cgN=${n};document.querySelectorAll('#cgChips .chip').forEach(x=>x.classList.remove('on'));this.classList.add('on');XZG.calc()">${n}期</div>`).join('')}</div></div>
      <div class="cres"><div class="c"><b id="cgM">¥50.0</b><span>每期月供</span></div><div class="c"><b id="cgF">¥0</b><span>总手续费</span></div><div class="c"><b id="cgT">¥600</b><span>总应还</span></div></div>
      <div class="xzg-muted" style="font-size:10.5px;margin-top:9px">* 演示数据。e次元联名卡 12 期内免手续费，超12期费率 0.6%/期，具体以审批为准</div>
      <button class="xzg-btn plain big" style="margin-top:11px" onclick="XZG.calcPlan()">生成还款计划</button></div>`;
    h+=`<div class="xzg-card"><div class="ct">✨ 谷卡专属权益</div><div class="xzg-muted" style="font-size:12px;line-height:2.1">🏷️ 谷店/漫展商户消费 95 折<br>🌾 消费得双倍谷粒，加速攒谷升级<br>🥏 限定谷子优先购权 + 开卡礼<br>📈 大额藏品专项分期额度（最高 ¥20000）</div></div>`;
    b.innerHTML=h;this.calc()},
  calc(){const a=parseInt((document.getElementById('cgAmt')||{}).value)||0;const n=this._cgN||12;const fee=a>20000?0:(n<=12?0:Math.round(a*0.006*n));
    const m=document.getElementById('cgM'),f=document.getElementById('cgF'),t=document.getElementById('cgT');if(!m)return;
    m.textContent='¥'+(a?( (a+fee)/n ).toFixed(1):'0');f.textContent='¥'+this.money(fee);t.textContent='¥'+this.money(a+fee)},
  calcPlan(){const a=parseInt((document.getElementById('cgAmt')||{}).value)||0;if(!a)return this.toast('请先输入金额','⚠️');this.S.calcUsed=true;this.save();this.taskDone('t5');this.award('b8');
    const n=this._cgN||12;const fee=a>20000?0:(n<=12?0:Math.round(a*0.006*n));
    this.sheet(`<h3>🧮 还款计划（${n}期）</h3><div class="ssub">e次元联名卡 · 大额藏品分期</div><div class="xzg-hr"></div>${Array.from({length:Math.min(n,6)},(_,i)=>`<div class="xzg-flex" style="justify-content:space-between;padding:6px 0;font-size:12.5px"><span class="xzg-muted">第 ${i+1} 期</span><span>还款日 25 日</span><b>¥${((a+fee)/n).toFixed(1)}</b></div>`).join('')}${n>6?`<div class="xzg-muted" style="text-align:center;padding:4px 0">… 共 ${n} 期</div>`:''}<div class="xzg-hr"></div><div class="xzg-flex" style="justify-content:space-between"><span>手续费合计</span><b style="color:${fee?'#c7000b':'#0aa870'}">${fee?'¥'+this.money(fee):'免息 ✓'}</b></div><button class="xzg-btn big" style="margin-top:13px" onclick="XZG.sheetClose();XZG.toast('计划已保存，可随时在谷卡频道查看','🧮')">保存计划</button>`)},
  vote(id){const S=this.S;if(S.myVote)return this.toast('本季已投过票啦，下季再来','🗳️');S.myVote=id;S.votes[id]=(S.votes[id]||0)+1;this.save();this.award('b7');this.taskDone('t4');this.renderGuka();this.toast('投票成功！感谢为谷圈发电','🗳️')},
  cardApply(){this._cardStep=1;
    this.sheet(`<h3>💳 申领e次元联名卡</h3><div class="ssub">第 1 步 / 共 3 步 · 选择你的本命卡面</div>
    <div class="xzg-cardvote" style="flex-wrap:wrap">${this.DB.cards.map(c=>`<div class="xzg-vcard${this._cardSel===c.id?' sel':''}" onclick="XZG._cardSel='${c.id}';XZG.cardApply()" style="width:calc(50% - 6px)"><div class="xzg-bankcard" style="background:${c.grad};min-height:92px"><div class="cdeco"></div><div class="cbank" style="font-size:10px"><div class="clogo" style="width:16px;height:16px;font-size:9px">工</div>工商银行</div><div style="font-size:18px">${c.emo}</div><div class="cfoot"><span style="font-size:9px">${c.name}</span></div></div></div>`).join('')}</div>
    <button class="xzg-btn big" style="margin-top:12px" onclick="XZG._cardStep=2;XZG.cardForm()">下一步</button>`)},
  cardForm(){this.sheet(`<h3>💳 填写申卡信息</h3><div class="ssub">第 2 步 / 共 3 步 · 演示环境已自动填充</div>
    <div class="xzg-form"><div class="fi"><label>姓名</label><input type="text" value="谷友_8437" disabled style="color:#98a0ad"></div>
    <div class="fi"><label>身份证</label><input type="text" value="2102**********1234" disabled style="color:#98a0ad"></div>
    <div class="fi"><label>手机号</label><input type="text" value="138****5678" disabled style="color:#98a0ad"></div></div>
    <div class="xzg-spark-tip">📋 已同意《e次元联名卡领用协议》与《个人信息处理告知书》（演示）</div>
    <div style="display:flex;gap:9px;margin-top:12px"><button class="xzg-btn ghost" style="flex:1;justify-content:center" onclick="XZG.cardApply()">上一步</button><button class="xzg-btn" style="flex:1.4" onclick="XZG.cardFace()">开始人脸核验</button></div>`)},
  cardFace(){this.sheet(`<h3>🤳 人脸核验</h3><div class="ssub">第 3 步 / 共 3 步 · 请正对屏幕（演示自动通过）</div>
    <div style="text-align:center;padding:14px 0"><div style="width:120px;height:120px;margin:0 auto;border-radius:50%;border:4px solid #e6e9ef;border-top-color:#c7000b;animation:xzg-spin 1s linear infinite;display:flex;align-items:center;justify-content:center;font-size:40px">😊</div><div id="fcTxt" style="margin-top:14px;font-size:12.5px;color:#5b6472">正在启动摄像头…</div></div>`);
    const msgs=['正在启动摄像头…','检测到面部，请眨眨眼…','比对公安实名校验数据…','核验通过，提交审批…'];let i=0;
    const iv=setInterval(()=>{i++;const el=document.getElementById('fcTxt');if(i<msgs.length){el&&(el.textContent=msgs[i])}else{clearInterval(iv);this.cardOk()}},800)},
  cardOk(){const c=this.DB.cards.find(x=>x.id===this._cardSel);this.S.cardApplied=true;this.S.myCard=this._cardSel;this.save();this.renderGuka();
    this.sheet(`<h3>🎉 审批通过！</h3><div class="ssub">工行信用卡中心 · 秒批通道</div>
    <div style="text-align:center;padding:6px 0 2px"><div style="font-size:46px">🎊</div><b style="font-size:15px;display:block;margin-top:8px">「${c.ip}·${c.name}」联名卡申领成功</b><div class="xzg-muted" style="margin-top:5px">实体卡将于 5 个工作日内寄出，电子卡即刻可用</div></div>
    <div class="xzg-card" style="background:#faf7f2;margin:14px 0 0"><div class="ct" style="margin-bottom:4px">🎁 开卡礼</div><div class="xzg-muted" style="font-size:12px;line-height:2">✓ 限定谷「小e · 星河限定」吧唧 ×1<br>✓ +200 谷粒（已到账）<br>✓ 12 期免息分期资格</div></div>
    <button class="xzg-btn gold big" style="margin-top:13px" onclick="XZG.sheetClose()">收下开卡礼</button>`);
    this.addGrains(200,'开卡礼')},

  /* ════════════════════════════════════════════════════════════
     e次元 · 论坛 / 商城 / 品牌专场 / 我的（工行自有 IP 版式）
     ════════════════════════════════════════════════════════════ */
  EZ(){return DATA.ezgy},
  /* ---- 周边商品插画（内联SVG · 线面插画风，零外部依赖） ---- */
  artSVG(kind){
    const A={
      badge:`<svg viewBox="0 0 200 200"><rect width="200" height="200" rx="14" fill="#faf5ec"/><circle cx="62" cy="66" r="34" fill="#f3d9a4"/><circle cx="62" cy="66" r="27" fill="#fff" stroke="#e8c98a" stroke-width="2"/><circle cx="54" cy="62" r="3" fill="#5b6472"/><circle cx="70" cy="62" r="3" fill="#5b6472"/><path d="M54 73q8 6 16 0" stroke="#e0557f" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M45 52q6-9 15-8" stroke="#e8c98a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="138" cy="66" r="34" fill="#c9d9f5"/><circle cx="138" cy="66" r="27" fill="#fff" stroke="#9fbef0" stroke-width="2"/><circle cx="130" cy="62" r="3" fill="#5b6472"/><circle cx="146" cy="62" r="3" fill="#5b6472"/><path d="M130 73q8 6 16 0" stroke="#3d6ce0" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M121 52q6-9 15-8" stroke="#9fbef0" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="100" cy="136" r="34" fill="#f3c9dd"/><circle cx="100" cy="136" r="27" fill="#fff" stroke="#eba9c9" stroke-width="2"/><circle cx="92" cy="132" r="3" fill="#5b6472"/><circle cx="108" cy="132" r="3" fill="#5b6472"/><path d="M92 143q8 6 16 0" stroke="#e0557f" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M83 122q6-9 15-8" stroke="#eba9c9" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="150" cy="140" r="18" fill="#cfe9dd"/><circle cx="150" cy="140" r="13" fill="#fff" stroke="#8fd0b2" stroke-width="2"/><circle cx="146" cy="138" r="2" fill="#5b6472"/><circle cx="154" cy="138" r="2" fill="#5b6472"/><path d="M146 145q4 3 8 0" stroke="#0a9a66" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
      ticket:`<svg viewBox="0 0 200 200"><rect width="200" height="200" rx="14" fill="#f2f4f9"/><defs><linearGradient id="holo1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset=".35" stop-color="#e3b8f5"/><stop offset=".7" stop-color="#a8f0dc"/><stop offset="1" stop-color="#ffd6e8"/></linearGradient><linearGradient id="holo2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd6e8"/><stop offset=".5" stop-color="#c9d9f5"/><stop offset="1" stop-color="#a8f0dc"/></linearGradient></defs><rect x="28" y="46" width="144" height="52" rx="10" fill="url(#holo1)"/><circle cx="172" cy="72" r="4" fill="#f2f4f9"/><circle cx="28" cy="72" r="4" fill="#f2f4f9"/><path d="M120 50v44" stroke="#fff" stroke-width="2" stroke-dasharray="5 5"/><circle cx="60" cy="66" r="10" fill="#fff" opacity=".85"/><path d="M54 66l4 4 8-8" stroke="#7a5cff" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="60" y="64" width="46" height="5" rx="2.5" fill="#fff" opacity=".8"/><rect x="60" y="76" width="30" height="5" rx="2.5" fill="#fff" opacity=".55"/><rect x="40" y="118" width="144" height="52" rx="10" fill="url(#holo2)" transform="rotate(-6 112 144)"/><circle cx="46" cy="140" r="4" fill="#f2f4f9"/><circle cx="182" cy="129" r="4" fill="#f2f4f9"/><path d="M140 112l-4 46" stroke="#fff" stroke-width="2" stroke-dasharray="5 5"/><circle cx="74" cy="140" r="10" fill="#fff" opacity=".85"/><path d="M69 140l3.5 3.5 7-7" stroke="#e0557f" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="90" y="136" width="40" height="5" rx="2.5" fill="#fff" opacity=".8" transform="rotate(-6 110 140)"/></svg>`,
      keychain:`<svg viewBox="0 0 200 200"><rect width="200" height="200" rx="14" fill="#fdf4f7"/><circle cx="100" cy="38" r="9" fill="none" stroke="#d8b56a" stroke-width="5"/><path d="M94 46q6 8 12 0l-3 12h-6z" fill="#d8b56a"/><rect x="62" y="58" width="76" height="96" rx="16" fill="#eaf6ff" opacity=".92" stroke="#bfe0f5" stroke-width="2"/><path d="M62 74q38-18 76 0" stroke="#bfe0f5" stroke-width="2" fill="none" opacity=".6"/><circle cx="100" cy="104" r="26" fill="#ffe9f0"/><path d="M78 96q4-22 22-22t22 22q-8-8-22-8t-22 8z" fill="#f3b9cf"/><circle cx="90" cy="102" r="3.5" fill="#5b6472"/><circle cx="110" cy="102" r="3.5" fill="#5b6472"/><path d="M90 114q10 8 20 0" stroke="#e0557f" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="80" cy="112" r="5" fill="#f7cdd9"/><circle cx="120" cy="112" r="5" fill="#f7cdd9"/><path d="M100 130l4 8h-8z" fill="#f3d9a4"/><rect x="78" y="146" width="44" height="6" rx="3" fill="#fff"/><rect x="86" y="157" width="28" height="5" rx="2.5" fill="#fff" opacity=".7"/></svg>`,
      standee:`<svg viewBox="0 0 200 200"><rect width="200" height="200" rx="14" fill="#f4f2fb"/><rect x="58" y="34" width="84" height="104" rx="10" fill="#f9fffd" opacity=".95" stroke="#c9e8dd" stroke-width="2"/><path d="M100 52q20 0 20 22 0 14-8 20 16 6 20 24l4 20H64l4-20q4-18 20-24-8-6-8-20 0-22 20-22z" fill="#cdeede"/><circle cx="100" cy="74" r="20" fill="#ffe9d9"/><path d="M82 70q3-18 18-18t18 18q-7-7-18-7t-18 7z" fill="#8a6f5c"/><circle cx="93" cy="74" r="3" fill="#5b6472"/><circle cx="107" cy="74" r="3" fill="#5b6472"/><path d="M93 84q7 5 14 0" stroke="#d98a5c" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M88 96l-8 34M112 96l8 34" stroke="#cdeede" stroke-width="10" stroke-linecap="round"/><circle cx="76" cy="60" r="6" fill="#ffd76e"/><path d="M76 52v-6M76 74v-6M68 60h-6M84 60h-6" stroke="#ffd76e" stroke-width="2.5" stroke-linecap="round"/><rect x="70" y="140" width="60" height="14" rx="7" fill="#cdeede"/><rect x="70" y="140" width="60" height="6" rx="3" fill="#fff" opacity=".6"/></svg>`,
      standee2:`<svg viewBox="0 0 200 200"><rect width="200" height="200" rx="14" fill="#f0f3f7"/><rect x="58" y="34" width="84" height="104" rx="10" fill="#1d2330" opacity=".96" stroke="#3a4358" stroke-width="2"/><path d="M100 50q22 0 22 24 0 16-9 22 18 7 22 26l3 16H62l3-16q4-19 22-26-9-6-9-22 0-24 22-24z" fill="#2e3950"/><path d="M78 96l44 0" stroke="#ff7a3d" stroke-width="6" stroke-linecap="round" opacity=".9"/><path d="M84 110h32" stroke="#ffd76e" stroke-width="4" stroke-linecap="round" opacity=".8"/><circle cx="100" cy="72" r="19" fill="#f5e3d7"/><path d="M83 68q3-17 17-17t17 17q-7-6-17-6t-17 6z" fill="#233"/><circle cx="93" cy="72" r="3" fill="#1d2330"/><circle cx="107" cy="72" r="3" fill="#1d2330"/><path d="M94 81q6 4 12 0" stroke="#c96a3d" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="70" y="140" width="60" height="14" rx="7" fill="#2e3950"/><rect x="70" y="140" width="60" height="5" rx="2.5" fill="#ff7a3d" opacity=".7"/></svg>`,
      figure:`<svg viewBox="0 0 200 200"><rect width="200" height="200" rx="14" fill="#f7fbf6"/><ellipse cx="100" cy="168" rx="52" ry="12" fill="#dcefe2"/><path d="M100 60q26 4 28 34l6 52q-34 12-68 0l6-52q2-30 28-34z" fill="#8fd8a8"/><path d="M100 60q-14 26 0 84M100 60q14 26 0 84" stroke="#5cb87e" stroke-width="3" fill="none" opacity=".7"/><circle cx="100" cy="48" r="18" fill="#ffeeda"/><path d="M82 44q2-16 18-16t18 16q-4-2-8-8-4 8-18 10-6 0-10-2z" fill="#e8c98a"/><path d="M82 44q-6 20 4 30l-2-22zM118 44q6 20-4 30l2-22z" fill="#e8c98a"/><circle cx="93" cy="48" r="2.8" fill="#4a7a5c"/><circle cx="107" cy="48" r="2.8" fill="#4a7a5c"/><path d="M94 57q6 4 12 0" stroke="#d98a5c" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M84 96l-10 34M116 96l10 34" stroke="#ffeeda" stroke-width="9" stroke-linecap="round"/><path d="M84 96q-12 10-10 30" stroke="#8fd8a8" stroke-width="12" stroke-linecap="round" fill="none"/><ellipse cx="100" cy="150" rx="26" ry="8" fill="#5cb87e"/><circle cx="146" cy="52" r="7" fill="#ffd76e"/><circle cx="52" cy="70" r="5" fill="#f3b9cf"/><circle cx="160" cy="104" r="4" fill="#a8d8f0"/></svg>`,
      figure2:`<svg viewBox="0 0 200 200"><rect width="200" height="200" rx="14" fill="#fdf5f8"/><ellipse cx="100" cy="168" rx="52" ry="12" fill="#f5dce8"/><path d="M100 60q26 4 28 34l6 52q-34 12-68 0l6-52q2-30 28-34z" fill="#f0a8c8"/><path d="M100 60q-14 26 0 84M100 60q14 26 0 84" stroke="#d97ba8" stroke-width="3" fill="none" opacity=".7"/><circle cx="100" cy="48" r="18" fill="#ffeeda"/><path d="M80 46q0-18 20-18t20 18l-6 26q-14 8-28 0z" fill="#5c4a68"/><circle cx="93" cy="48" r="2.8" fill="#5c4a68"/><circle cx="107" cy="48" r="2.8" fill="#5c4a68"/><path d="M94 57q6 4 12 0" stroke="#d98a5c" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M84 96l-10 34M116 96l10 34" stroke="#ffeeda" stroke-width="9" stroke-linecap="round"/><ellipse cx="100" cy="150" rx="26" ry="8" fill="#d97ba8"/><circle cx="52" cy="58" r="5" fill="#ffd76e"/><circle cx="152" cy="76" r="5" fill="#a8d8f0"/><circle cx="44" cy="110" r="4" fill="#f0a8c8"/></svg>`,
      giftbox:`<svg viewBox="0 0 200 200"><rect width="200" height="200" rx="14" fill="#fff8ef"/><rect x="46" y="86" width="108" height="76" rx="10" fill="#f0a8c8"/><rect x="46" y="86" width="108" height="20" rx="10" fill="#e0557f" opacity=".35"/><rect x="92" y="86" width="16" height="76" fill="#ffd76e"/><path d="M100 86q-26-6-24-24 2-12 14-10 14 2 10 34zM100 86q26-6 24-24-2-12-14-10-14 2-10 34z" fill="#ffd76e"/><path d="M56 70l-8-10M70 62l-4-12M144 70l8-10M130 62l4-12" stroke="#f3b9cf" stroke-width="4" stroke-linecap="round"/><circle cx="42" cy="120" r="5" fill="#a8d8f0"/><circle cx="160" cy="130" r="5" fill="#cdeede"/><circle cx="150" cy="60" r="4" fill="#ffd76e"/><circle cx="52" cy="52" r="4" fill="#f3b9cf"/><rect x="60" y="128" width="26" height="8" rx="4" fill="#fff" opacity=".65"/><rect x="128" y="140" width="18" height="6" rx="3" fill="#fff" opacity=".5"/></svg>`
    };
    return A[kind]||A.badge;
  },
  /* ---- 周年主视觉海报（e次元周年庆 · 甜点棕金风） ---- */
  annivPoster(){
    return `<svg viewBox="0 0 300 380" style="width:100%;display:block">
      <defs><linearGradient id="agbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a50"/><stop offset=".55" stop-color="#6e5240"/><stop offset="1" stop-color="#4e3a2e"/></linearGradient>
      <linearGradient id="agold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b8"/><stop offset="1" stop-color="#d9a853"/></linearGradient></defs>
      <rect width="300" height="380" fill="url(#agbg)"/>
      <path d="M0 0h300v56q-150 26-300 0z" fill="#3d2c22"/>
      <path d="M20 18l8 16 16-8-8 16 16 8-16 8 8 16-16-8-8 16-8-16-16 8 8-16-16-8 16-8-8-16z" fill="#e8c98a" opacity=".8" transform="scale(.5) translate(30 20)"/>
      <path d="M0 380h300v-44q-150-24-300 0z" fill="#3d2c22"/>
      <path d="M20 90l8-6 20 22-8 6zM262 90l-8-6-20 22 8 6z" fill="#a88a6a"/>
      <rect x="34" y="96" width="232" height="196" rx="14" fill="#f5ead6" stroke="#d9b98a" stroke-width="3"/>
      <rect x="44" y="106" width="212" height="176" rx="9" fill="#fdf6ea"/>
      <circle cx="150" cy="196" r="52" fill="#fff" opacity=".0"/>
      <ellipse cx="150" cy="238" rx="66" ry="12" fill="#e8d5b8"/>
      <rect x="106" y="196" width="88" height="42" rx="8" fill="#f3d9c4"/>
      <rect x="100" y="182" width="100" height="20" rx="8" fill="#fbe8d8"/>
      <path d="M112 182q-8-20 10-24 6-14 20-8 10-12 24-2 14-8 20 6 14 6 6 28z" fill="#fdf0f4" stroke="#f3b9cf" stroke-width="3"/>
      <circle cx="122" cy="164" r="5" fill="#e0557f"/><circle cx="150" cy="152" r="5" fill="#e0557f"/><circle cx="178" cy="164" r="5" fill="#e0557f"/>
      <rect x="144" y="128" width="4" height="26" fill="#a88a6a"/><rect x="162" y="132" width="4" height="22" fill="#a88a6a"/>
      <circle cx="146" cy="124" r="4" fill="#ffd76e"/><circle cx="164" cy="128" r="4" fill="#ff9db0"/>
      <path d="M118 216q10-6 16 0M166 216q10-6 16 0" stroke="#d9b98a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="62" cy="130" r="10" fill="#f3b9cf"/><circle cx="238" cy="130" r="10" fill="#cdeede"/>
      <path d="M56 268l12 18 12-18zM204 268l12 18 12-18z" fill="#e8c98a" opacity=".7"/>
      <path d="M74 306q10-8 20 0t20 0 20 0 20 0 20 0 20 0 20 0" stroke="#a88a6a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M96 258q-16-2-14-16 14-4 18 12zM204 258q16-2 14-16-14-4-18 12z" fill="#f3b9cf" opacity=".8"/>
      <circle cx="88" cy="60" r="3" fill="#ffd76e"/><circle cx="126" cy="44" r="3" fill="#ff9db0"/><circle cx="180" cy="50" r="3" fill="#a8d8f0"/><circle cx="220" cy="66" r="3" fill="#ffd76e"/>
      <rect x="66" y="304" width="168" height="42" rx="21" fill="url(#agold)"/>
      <text x="150" y="332" text-anchor="middle" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="24" font-weight="800" fill="#5a3d1e">周年庆典 12th</text>
      <path d="M40 325l14-9v18zM260 325l-14-9v18z" fill="#d9a853"/>
      <path d="M60 74l6 12 12-6-6 12 12 6-12 6 6 12-12-6-6 12-6-12-12 6 6-12-12-6 12-6-6-12z" fill="#ffe9b8" opacity=".55"/>
    </svg>`;
  },
  /* ---- 商城「周边上新」横幅（街头风） ---- */
  mallBanner(){
    return `<svg viewBox="0 0 400 130" style="width:100%;display:block">
      <defs><linearGradient id="mbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#20242e"/><stop offset=".6" stop-color="#2e3340"/><stop offset="1" stop-color="#171a22"/></linearGradient></defs>
      <rect width="400" height="130" rx="16" fill="url(#mbg)"/>
      <path d="M240 0q30 40 10 130h150V0z" fill="#2a2f3c"/>
      <circle cx="330" cy="66" r="44" fill="#333a4a"/>
      <path d="M300 130q4-56 30-56t30 56z" fill="#1d2330"/>
      <path d="M312 92l36 0" stroke="#ff7a3d" stroke-width="8" stroke-linecap="round"/>
      <path d="M318 106h24" stroke="#ffd76e" stroke-width="5" stroke-linecap="round" opacity=".85"/>
      <circle cx="330" cy="52" r="13" fill="#f5e3d7"/>
      <path d="M318 48q2-12 12-12t12 12q-5-5-12-5t-12 5z" fill="#2a2f3c"/>
      <text x="34" y="52" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="26" font-weight="900" fill="#fff" letter-spacing="4">周边上新</text>
      <text x="34" y="76" font-family="sans-serif" font-size="11" fill="#8a93a8" letter-spacing="1">WELCOME TO NEW ERRL 2026</text>
      <text x="34" y="100" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="12" font-weight="700" fill="#ff9d6e">9/03 20:00 - 9/23 23:59 · 限时上架</text>
      <path d="M196 26l4 8 8-4-4 8 8 4-8 4 4 8-8-4-4 8-4-8-8 4 4-8-8-4 8-4-4-8z" fill="#ffd76e" opacity=".7"/>
    </svg>`;
  },
  /* ═══ 论坛（官方账号 + 品类分区 + 帖子流） ═══ */
  _posts:null,
  renderForum(){
    const E=this.EZ();if(!this._posts)this._posts=[...E.forumPosts];
    const b=this.$('#forumBody');if(!b)return;
    b.innerHTML=`
      <div class="fm-head">
        <div class="fm-head-txt"><b>谷圈论坛</b><span>资讯 · 情报 · 同好交流</span></div>
        <div class="fm-head-q">${CHARS.head('xiaoe')}</div>
        <button class="fm-new" onclick="XZG.newPost()">✏️ 发帖</button>
      </div>
      <div class="xzg-card" style="padding:4px 14px">
        ${E.forumNotices.map(n=>`
          <button class="fm-msg" onclick="XZG.notifOpen()">
            <span class="fm-msg-ava">${CHARS.head(n.char)}</span>
            <span class="fm-msg-m"><b>${n.name}<i class="fm-woff"></i></b><span>${n.sub}</span></span>
            <span class="fm-msg-r"><i>${n.time}</i><em class="${n.badge>=99?'max':''}">${n.badge>=99?'99+':n.badge}</em></span>
          </button>`).join('')}
      </div>
      <div class="fm-tabs">${['推荐','综合讨论','徽章吧','立牌堂','手办阁','软周边社','交易情报','新人报道'].map((z,i)=>`<button class="fm-tab${i===0?' on':''}" onclick="XZG.fmTab(this,'${z}')">${z}</button>`).join('')}</div>
      <div id="fmList">${this.fmCards('全部')}</div>
      <div class="fm-qchar">${CHARS.head('yutang')}<span>语棠：发帖可以攒谷粒哦，每天首帖 +30～</span></div>`;
  },
  fmCards(zone){
    const list=this._posts.filter(p=>zone==='全部'||zone==='推荐'||p.zone===zone);
    const src=(zone==='推荐')?this._posts.slice().sort((a,b)=>(b.hot?1:0)-(a.hot?1:0)||b.likes-a.likes):list;
    if(!src.length)return '<div class="xzg-null"><span class="nic">🍙</span>这个分区还没有帖子，快来抢沙发</div>';
    return src.map((p,i)=>{const idx=this._posts.indexOf(p);return`
      <div class="xzg-card fm-post" onclick="XZG.postDetail(${idx})">
        <div class="fm-post-h">
          <span class="fm-post-ava">${CHARS.head(p.char)}</span>
          <span class="fm-post-u"><b>${p.user}</b><span><i class="fm-zone">${p.zone}</i>${p.time}</span></span>
          ${p.hot?'<i class="fm-hot">🔥 热议</i>':''}
        </div>
        <b class="fm-post-t">${p.title}</b>
        <p class="fm-post-x">${p.txt}</p>
        ${p.img?`<div class="fm-post-img">${this.artSVG(p.img==='anniv'?'standee':p.img)}</div>`:''}
        <div class="fm-post-f">
          <span>👍 ${(p.likes/1000).toFixed(1)}k</span><span>💬 ${p.cmts}</span><span>🔗 分享</span>
        </div>
      </div>`}).join('');
  },
  fmTab(btn,zone){
    document.querySelectorAll('.fm-tab').forEach(x=>x.classList.toggle('on',x===btn));
    const l=this.$('#fmList');if(l)l.innerHTML=this.fmCards(zone);
  },
  postDetail(i){
    const p=this._posts[i];if(!p)return;
    this.sheet(`<div class="fm-post-h" style="margin-bottom:10px">
        <span class="fm-post-ava">${CHARS.head(p.char)}</span>
        <span class="fm-post-u"><b>${p.user}</b><span><i class="fm-zone">${p.zone}</i>${p.time}</span></span></div>
      <h3 style="font-size:16.5px;line-height:1.5">${p.title}</h3>
      <p style="font-size:13px;color:#5b6472;line-height:1.9;margin-top:8px">${p.txt}</p>
      <div style="display:flex;gap:18px;margin-top:16px;padding-top:12px;border-top:1px solid #edeff3">
        <button class="xzg-btn ghost mini" onclick="XZG.likePost(this,${p.likes})">👍 <em>${(p.likes/1000).toFixed(1)}k</em></button>
        <button class="xzg-btn ghost mini" onclick="XZG.cmtOpen('${String(p.title).replace(/'/g,'')}|${p.cmts}')">💬 ${p.cmts}</button>
        <button class="xzg-btn ghost mini" onclick="ICBCApp.toast('链接已复制（演示）','🔗')">🔗 分享</button>
      </div>`);
    setTimeout(()=>ICBCApp.toast('来自「'+p.user+'」的帖子','📜'),60);
  },
  likePost(btn,base){const em=btn.querySelector('em');if(btn.dataset.done)return;btn.dataset.done=1;btn.classList.add('dis');em.textContent=((base+1)/1000).toFixed(1)+'k';ICBCApp.toast('已点赞','👍')},
  newPost(){
    this.sheet(`<h3>✏️ 发布帖子</h3><div class="ssub">优质内容可获得谷粒奖励 · 请遵守社区公约</div>
      <div class="fm-tabs" id="npZones" style="margin:4px 0 10px">${['综合讨论','徽章吧','立牌堂','手办阁','软周边社','交易情报','新人报道'].map((z,i)=>`<button class="fm-tab${i===0?' on':''}" onclick="XZG.npZone(this,'${z}')">${z}</button>`).join('')}</div>
      <textarea id="npTxt" placeholder="分享你的吃谷日常、攻略或情报…" style="width:100%;height:110px;border:1.5px solid #edeff3;border-radius:12px;padding:12px;font-size:13px;resize:none;font-family:inherit"></textarea>
      <div class="xzg-spark-tip">🎁 每日首帖 +30 谷粒 · 帖子将同步到「我的-创作中心」</div>
      <button class="xzg-btn big" style="margin-top:12px" onclick="XZG.newPostOk()">发布</button>`);
    window._npZone='综合讨论';
  },
  npZone(btn,z){document.querySelectorAll('#npZones .fm-tab').forEach(x=>x.classList.toggle('on',x===btn));window._npZone=z},
  newPostOk(){
    const t=this.$('#npTxt'),txt=t&&t.value.trim();
    if(!txt){ICBCApp.toast('先写点什么吧～','✏️');return}
    this._posts.unshift({char:CHARS.current(),user:CHARS.get(CHARS.current()).name+'（我）',zone:window._npZone||'综合讨论',time:'刚刚',title:txt.slice(0,22)+(txt.length>22?'…':''),txt:txt,likes:1,cmts:0});
    this.sheetClose();this.renderForum();this.addGrains(30,'发布帖子');
  },
  /* ═══ 商城（搜索栏 + 分部瓷片 + 最近上新 + 商品流） ═══ */
  renderMall(){
    const E=this.EZ(),b=this.$('#mallBody');if(!b)return;
    const cn=this.cartCount();
    b.innerHTML=`
      <div class="ml-search">
        <div class="ml-search-bar" onclick="XZG.mallSearch()">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
          <span>群星邀约 · 搜一搜你心动的谷子</span>
        </div>
        <button class="ml-search-ref" onclick="XZG.toast('已为你刷新「周边上新」','🔄')">🔄</button>
      </div>
      <div class="ml-quickrow">
        <button class="ml-qb" onclick="XZG.openCart()">🛒 购物车${cn?`<i class="ml-qb-badge">${cn}</i>`:''}</button>
        <button class="ml-qb" onclick="XZG.go('mallorder')">📦 我的订单<i class="ml-qb-badge gray">${this.S.mallOrders.length}</i></button>
        <button class="ml-qb" onclick="XZG.openAddr()">📍 收货地址</button>
      </div>
      <div class="ml-banner" onclick="XZG.openBrand('juequeling')">${this.mallBanner()}</div>
      <div class="ml-ztiles">${E.zones.map(z=>this.zoneTile(z)).join('')}</div>
      <div class="plz-sechead"><b>✦ 最近上新</b><span>官方周边 · 正品保障</span></div>
      <div class="ml-newrow">${E.newArrivals.map((n,i)=>`
        <button class="ml-newcard" style="background:${n.tone}" onclick="XZG.buyGoods('m'+(i===0?'4':i===1?'4':'1'))">
          <span class="ml-new-fig">${this.artSVG(n.art)}</span><i>NEW</i><b>${n.name}</b>
        </button>`).join('')}</div>
      <div class="plz-sechead"><b>🏦 工行自有 IP 系列</b><span>官方自营 · 限量发行</span></div>
      <div class="ml-grid">${this.annivCards()}</div>
      <div class="plz-sechead"><b>🛍 为你推荐</b><span>谷友都在买</span></div>
      <div class="ml-grid">${this.mallCards(E.mallGoods)}</div>
      <div class="fm-qchar">${CHARS.head('chengxi')}<span>橙汐：下单前记得比一比，商城同款我都能查到价～</span></div>`;
  },
  /* 分区瓷片：名称在上 + 徽标 + 方形角色卡（自研矢量形象） */
  zoneTile(z){
    const badge=z.badge?`<i class="zt-badge ${z.tone||''}">${z.badge}</i>`:'<i class="zt-badge ghost">·</i>';
    return `<button class="ml-ztile" onclick="XZG.openBrand('${z.id}')">
      <b class="zt-name">${z.name}</b>${badge}
      <span class="zt-fig" style="background:${z.grad}">${CHARS.svg(z.char)}</span>
    </button>`;
  },
  /* 周年庆系列：价格/单位 + 加入购物车 / 立即购买 */
  annivCards(){
    return this.EZ().annivGoods.map(g=>`
      <div class="ml-gd" onclick="XZG.buyGoods('${g.id}')">
        <span class="ml-gd-img">${this.artSVG(g.art)}<i class="ml-gd-tag">周年庆</i></span>
        <b>${g.name}</b>
        <span class="ml-gd-p"><em>¥</em>${g.price}<i class="u">/${g.unit}</i>
          <button class="ml-buy" onclick="event.stopPropagation();XZG.buyGoods('${g.id}')">立即购买</button></span>
        <button class="ml-cart" onclick="event.stopPropagation();XZG.addCart('${g.id}')">＋ 加入购物车</button>
      </div>`).join('');
  },
  mallCards(list){
    return list.map(g=>`
      <div class="ml-gd" onclick="XZG.buyGoods('${g.id}')">
        <span class="ml-gd-img">${this.artSVG(g.art)}<i class="ml-gd-tag t-${g.tag.length>2?'long':'short'}">${g.tag}</i></span>
        <b>${g.name}</b>
        <span class="ml-gd-p"><em>¥</em>${g.price}<i class="u">/件</i>
          <button class="ml-buy" onclick="event.stopPropagation();XZG.buyGoods('${g.id}')">立即购买</button></span>
        <button class="ml-cart" onclick="event.stopPropagation();XZG.addCart('${g.id}')">＋ 加入购物车</button>
      </div>`).join('');
  },
  openBrand(zid){this._brand=zid;this.go('brand')},
  renderBrand(){
    const E=this.EZ(),z=E.zones.find(x=>x.id===(this._brand||'icbc'))||E.zones[6],b=this.$('#brandBody');
    if(!b)return;
    const isAnniv=z.id==='icbc';   /* 工行自有 IP 专区走周年庆式主视觉 */
    const goods=E.mallGoods.filter(g=>g.zone===z.id);
    b.innerHTML=`
      <div class="br-top" style="background:linear-gradient(160deg,#241547,${z.hue})">
        <button class="br-back" onclick="XZG.go('mall')">‹ 返回商城</button>
        <div class="br-brand"><span class="br-logo">${CHARS.head(z.char)}</span>
          <div class="br-bn"><b>${z.name}</b><span>官方周边店 · 官方直营</span></div>
          <button class="br-follow" onclick="this.classList.toggle('done');ICBCApp.toast(this.classList.contains('done')?'已关注 ${z.name}':'已取消关注','✨')">+ 关注</button>
        </div>
      </div>
      ${isAnniv?`
        <div class="br-anniv">${this.annivPoster()}</div>
        <div class="plz-sechead"><b>🏦 工行自有 IP 系列</b><span>官方自营 · 限量发行</span></div>
        <div class="br-anniv-grid">${E.annivGoods.map(g=>`
          <button class="br-agd" onclick="XZG.buyGoods('${g.id==='a1'?'m12':g.id==='a2'?'m2':g.id==='a3'?'m7':'m3'}')">
            <span class="br-agd-img">${this.artSVG(g.art)}</span>
            <b>${g.name}</b>
            <span class="br-agd-p"><em>¥${g.price}</em>/${g.unit}<button class="br-buy" onclick="event.stopPropagation();XZG.buyGoods('${g.id==='a1'?'m12':g.id==='a2'?'m2':g.id==='a3'?'m7':'m3'}')">立即购买</button></span>
          </button>`).join('')}</div>
        <div class="br-cake">${CHARS.svg('yutang')}</div>`
      :`
        <div class="br-hero" style="background:${z.grad}">
          <span class="br-hero-ava">${CHARS.svg(z.char)}</span>
          <div class="br-hero-t"><b>${z.name}</b><span>${z.tag} · 主题专区</span></div>
        </div>
        <div class="plz-sechead"><b>🛍 主题周边</b><span>${goods.length} 件在售</span></div>
        <div class="ml-grid">${this.mallCards(goods.length?goods:E.mallGoods.slice(0,4))}</div>
        <div class="fm-qchar">${CHARS.head('yunjian')}<span>云间：「${z.name}」专区已上架，${goods.length||4} 件在售</span></div>`}`;
  },
  buyGoods(id){
    const E=this.EZ();
    let g=E.mallGoods.find(x=>x.id===id);
    if(!g){const a=E.annivGoods.find(x=>x.id===id);if(a)g={id:a.id,zone:'icbc',name:a.name,price:a.price,tag:'周年庆',art:a.art}}
    if(!g)return;
    const z=E.zones.find(x=>x.id===g.zone)||{};
    this.sheet(`<h3>🛍 确认订单</h3><div class="ssub">${z.name||'官方周边'} · 官方直营 · 顺丰包邮</div>
      <div style="display:flex;gap:12px;align-items:center;background:#fafbfd;border-radius:14px;padding:12px;margin:10px 0">
        <span style="width:72px;height:72px;border-radius:12px;overflow:hidden;flex-shrink:0;display:block">${this.artSVG(g.art)}</span>
        <div style="flex:1;min-width:0"><b style="font-size:13px;display:block;line-height:1.5">${g.name}</b>
        <span style="font-size:16px;font-weight:800;color:#e03a5e;margin-top:6px;display:block">¥${g.price}<i style="font-style:normal;font-size:10.5px;color:#98a0ad;font-weight:400;margin-left:6px">谷粒可抵 ¥${Math.min(30,Math.round(g.price*0.1))}</i></span></div>
      </div>
      <div class="xzg-form">
        <div class="fi"><label>收货人</label><input type="text" value="李**" readonly></div>
        <div class="fi"><label>手机号</label><input type="text" value="138****5678" readonly></div>
        <div class="fi"><label>地址</label><input type="text" value="上海市黄浦区 工银大厦 20F" readonly></div>
      </div>
      <button class="xzg-btn big" onclick="XZG.buyOk('${g.id}','${(g.name||'').replace(/'/g,'')}','${g.price}')">立即支付 ¥${g.price}</button>
      <div class="xzg-muted" style="font-size:10.5px;margin-top:9px;text-align:center">* 演示环境 · 支付通过模拟工行储蓄卡完成</div>`);
  },
  buyOk(id,name,price){
    const p=+price||0;
    this.sheetClose();
    if(window.ICBCApp&&ICBCApp.addRecord)ICBCApp.addRecord({icon:'🛍️',bg:'#fdeff7',title:'e次元商城 · '+String(name).slice(0,12),time:'刚刚',amt:-p});
    this.sheet(`<div style="text-align:center;padding:10px 0 4px"><div style="font-size:46px">📦</div>
      <b style="font-size:15.5px;display:block;margin-top:8px">支付成功！</b>
      <div class="xzg-muted" style="margin-top:6px">「${String(name).slice(0,18)}」<br>预计 48 小时内发货 · 托管保障中</div>
      <button class="xzg-btn gold big" style="margin-top:14px" onclick="XZG.sheetClose()">完成</button></div>`);
    this.addGrains(Math.round(p/10)||5,'购物返谷粒');
  },
  /* ═══════════════ 社区 · 话题 / 通知 / 评论 / 风控（把「敬请期待」接成真实层级） ═══════════════ */
  topicOpen(arg){
    const [name,sub,cnt]=String(arg||'').split('|');
    const hot=this.EZ().forumPosts.slice(0,3);
    this.sheet(`<h3># ${name||'谷圈话题'}</h3><div class="ssub">${sub||'谷友正在讨论'} · ${cnt||'128'} 条动态</div>
      ${hot.map(p=>`<div class="xzg-cartrow" onclick="XZG.sheetClose();XZG.cmtOpen('${String(p.title).replace(/'/g,'')}|${p.cmts}')">
        <span class="cc-img">${CHARS.head(p.char)}</span>
        <div class="cc-main"><b>${p.title}</b><span class="cc-p">${p.user} · 赞 ${this.money(p.likes)}</span></div>
        <span class="cc-sum" style="font-size:12px;color:#98a0ad">💬 ${p.cmts}</span></div>`).join('')}
      <div class="xzg-hr"></div>
      <div class="mo-ops" style="justify-content:center">
        <button class="xzg-btn plain mini" onclick="XZG.sheetClose();XZG.go('forum')">去论坛</button>
        <button class="xzg-btn mini" onclick="XZG.cmtOpen('${String(name||'谷圈话题').replace(/'/g,'')}|${cnt||128}')">参与讨论</button>
        <button class="xzg-btn gold mini" onclick="XZG.go('create');XZG.sheetClose()">发新帖</button>
      </div>`);
  },
  notifOpen(){
    const L=[
      {emo:'🎁',t:'「攒谷计划」奖励到账',s:'完成每日签到，+20 谷粒已入账',w:'10 分钟前'},
      {emo:'⚡',t:'秒杀提醒',s:'你关注的「小e 限定吧唧」将在 20 分钟后开抢',w:'1 小时前'},
      {emo:'📦',t:'订单物流更新',s:'你的包裹已到达 上海黄浦集散中心',w:'今天 14:19'},
      {emo:'🛡',t:'融安e信安全提示',s:'检测到一笔异地登录，已为你开启二次验证',w:'昨天'}
    ];
    this.sheet(`<h3>🔔 通知中心</h3><div class="ssub">${L.length} 条未读 · 演示数据</div>
      ${L.map(n=>`<div class="xzg-cartrow">
        <span class="cc-img" style="display:flex;align-items:center;justify-content:center;font-size:24px;background:#f7f8fb">${n.emo}</span>
        <div class="cc-main"><b>${n.t}</b><span class="cc-p">${n.s}<br>${n.w}</span></div></div>`).join('')}
      <div class="mo-ops" style="justify-content:center">
        <button class="xzg-btn plain mini" onclick="XZG.sheetClose();XZG.go('mallorder')">查看订单</button>
        <button class="xzg-btn mini" onclick="XZG.sheetClose();XZG.go('zaangu')">去攒谷</button>
        <button class="xzg-btn gold mini" onclick="XZG.sheetClose();XZG.go('shigu')">去识谷</button>
      </div>`);
  },
  cmtOpen(arg){
    const [name,n]=String(arg||'').split('|');
    const C=[
      {c:'chengxi',u:'蹲低价的小满',x:'同款我上周入的，价格差不多，放心冲～',w:'6 分钟前',l:32},
      {c:'yunjian',u:'稳如老云',x:'建议走托管，验货期能省不少心。',w:'18 分钟前',l:21},
      {c:'yutang',u:'吃谷十年的阿棠',x:'收藏了，谢谢分享！',w:'1 小时前',l:9}
    ];
    this.sheet(`<h3>💬 评论 · ${name||'帖子'}（${n||C.length}）</h3>
      <div class="ssub">理性吃谷 · 友善交流</div>
      ${C.map(c=>`<div class="xzg-cartrow">
        <span class="cc-img">${CHARS.head(c.c)}</span>
        <div class="cc-main"><b>${c.u}</b><span class="cc-p">${c.x}<br>${c.w} · 赞 ${c.l}</span></div></div>`).join('')}
      <div class="xzg-form" style="margin-top:10px"><div class="fi">
        <input type="text" id="cmtText" placeholder="说点什么…"></div></div>
      <button class="xzg-btn big" onclick="XZG.cmtSend()">发送评论</button>
      <div class="mo-ops" style="justify-content:center;margin-top:9px">
        <button class="xzg-btn plain mini" onclick="XZG.sheetClose();XZG.go('forum')">回论坛</button>
        <button class="xzg-btn plain mini" onclick="XZG.toast('已收藏该帖子','⭐')">收藏帖子</button>
        <button class="xzg-btn ghost mini" onclick="XZG.toast('已举报，融安e信将复核','🛡')">举报</button>
      </div>`);
  },
  cmtSend(){
    const v=((this.$('#cmtText')||{}).value||'').trim();
    if(!v) return this.toast('先写点什么吧','✍️');
    this.sheetClose(); this.addGrains(5,'参与社区讨论');
    this.toast('评论已发布：'+v.slice(0,10)+'…','💬');
  },
  riskOpen(){
    this.sheet(`<h3>🛡 融安e信 · 风险扫描报告</h3><div class="ssub">e次元交易安全引擎 · 实时风控</div>
      <div class="xzg-card" style="background:linear-gradient(135deg,#f0fbf6,#e2f7ee);box-shadow:none">
        <div class="ct" style="color:#0aa870">本次扫描通过 ✅</div>
        <div class="xzg-muted" style="font-size:11.5px;line-height:1.9">交易对手信用分 712 · 无黑名单命中<br>资金流向正常 · 无高频异常操作</div></div>
      <div class="xzg-kvrow"><span>对手方信用等级</span><b>优秀（712 分）</b></div>
      <div class="xzg-kvrow"><span>历史纠纷率</span><b>0.8%</b></div>
      <div class="xzg-kvrow"><span>建议托管金额上限</span><b>¥5,000.00</b></div>
      <div class="mo-ops" style="justify-content:center;margin-top:10px">
        <button class="xzg-btn mini" onclick="XZG.sheetClose();XZG.orderCreate()">去建托管订单</button>
        <button class="xzg-btn plain mini" onclick="XZG.sheetClose();XZG.go('chugu')">回出谷通</button>
        <button class="xzg-btn ghost mini" onclick="XZG.toast('已导出报告（演示）','📄')">导出报告</button>
      </div>`);
  },
  /* 谷卡 → 真的跳到外壳「信用卡」Tab（而不是一句提示） */
  gotoCredit(){
    this.sheetClose();
    if(window.ICBCApp) ICBCApp.closePage('page-xingegu');
    setTimeout(()=>{ const b=document.querySelector('.tab-item[data-tab="view-credit"]'); if(b) b.click(); },260);
  },
  /* ═══════════════ 商城 · 商品查找 ═══════════════ */
  _goods(id){
    const E=this.EZ();
    let g=E.mallGoods.find(x=>x.id===id);
    if(!g){const a=E.annivGoods.find(x=>x.id===id);
      if(a)g={id:a.id,zone:'icbc',name:a.name,price:a.price,tag:'周年庆',art:a.art}}
    return g||null;
  },
  _cartList(){
    return (this.S.cart||[]).map(c=>{const g=this._goods(c.id);return g?Object.assign({},g,{price:+g.price,qty:c.qty}):null}).filter(Boolean);
  },
  _cartTotal(){return this._cartList().reduce((s,x)=>s+x.price*x.qty,0)},
  /* ═══════════════ 商城 · 购物车 ═══════════════ */
  cartCount(){return (this.S.cart||[]).reduce((s,c)=>s+c.qty,0)},
  addCart(id){
    const g=this._goods(id); if(!g) return;
    this.S.cart=this.S.cart||[];
    const it=this.S.cart.find(c=>c.id===g.id);
    if(it) it.qty=Math.min(99,it.qty+1); else this.S.cart.push({id:g.id,qty:1});
    this.save();
    if(this._lastPg==='mall') this.renderMall();
    this.toast('已加入购物车「'+String(g.name).slice(0,12)+'」','🛒');
  },
  cartQty(id,d){
    const c=(this.S.cart||[]).find(x=>x.id===id); if(!c)return;
    c.qty=Math.max(1,Math.min(99,c.qty+d)); this.save(); this.openCart();
  },
  cartDel(id){
    this.S.cart=(this.S.cart||[]).filter(x=>x.id!==id); this.save(); this.openCart();
    if(this._lastPg==='mall') this.renderMall();
    this.toast('已移出购物车','🗑');
  },
  openCart(){
    const list=this._cartList();
    const total=this._cartTotal(),cnt=list.reduce((s,x)=>s+x.qty,0);
    this.sheet(`<h3>🛒 购物车</h3><div class="ssub">共 ${list.length} 种 ${cnt} 件 · 合计 ¥${this.money(total)} · 满 99 包邮</div>
      ${list.length?list.map(x=>`
        <div class="xzg-cartrow">
          <span class="cc-img">${this.artSVG(x.art)}</span>
          <div class="cc-main"><b>${x.name}</b><span class="cc-p">¥${this.money(x.price)}</span>
            <div class="cc-ops"><button onclick="XZG.cartQty('${x.id}',-1)">－</button><i>${x.qty}</i><button onclick="XZG.cartQty('${x.id}',1)">＋</button>
              <button class="cc-del" onclick="XZG.cartDel('${x.id}')">删除</button></div></div>
        </div>`).join(''):'<div class="xzg-null"><span class="nic">🛒</span>购物车还是空的 · 去「为你推荐」挑一挑</div>'}
      ${list.length?`<div class="xzg-calc"><div class="cres"><div class="c"><b>¥${this.money(total)}</b><span>商品合计</span></div><div class="c"><b>¥0</b><span>运费</span></div><div class="c"><b>${cnt}</b><span>件数</span></div></div></div>
      <button class="xzg-btn big" onclick="XZG.checkout()">去结算 (${cnt})</button>
      <button class="xzg-btn plain big" style="margin-top:9px" onclick="XZG.sheetClose();XZG.go('mall')">继续逛逛</button>`
      :`<button class="xzg-btn big" style="margin-top:14px" onclick="XZG.sheetClose();XZG.go('mall')">去商城逛逛</button>`}`);
  },
  /* ═══════════════ 商城 · 收货地址 ═══════════════ */
  openAddr(){
    const L=this.S.addrList||[];
    this.sheet(`<h3>📍 收货地址</h3><div class="ssub">共 ${L.length} 个地址 · 默认地址将用于结算</div>
      ${L.map(a=>`<div class="xzg-addrow${a.def?' on':''}" onclick="XZG.pickAddr('${a.id}')">
        <div class="ar-m"><b>${a.name} <i>${a.phone}</i>${a.def?'<em>默认</em>':''}</b><span>${a.city} ${a.detail}</span></div>
        <span class="ar-tag">${a.tag||'家'}</span></div>`).join('')}
      <button class="xzg-btn plain big" style="margin-top:6px" onclick="XZG.addrNew()">＋ 新增收货地址</button>
      <div class="xzg-muted" style="font-size:10.5px;margin-top:9px;text-align:center">* 演示环境，请勿填写真实个人信息</div>`);
  },
  pickAddr(id){
    const a=(this.S.addrList||[]).find(x=>x.id===id); if(!a)return;
    (this.S.addrList||[]).forEach(x=>x.def=(x.id===id));
    this.S.addr={name:a.name,phone:a.phone,city:a.city,detail:a.detail,tag:a.tag};
    this.save(); this.sheetClose(); this.toast('已切换收货地址','📍');
    if(this._cartList().length) setTimeout(()=>this.checkout(),260); else this.openAddr();
  },
  addrNew(){
    this.sheet(`<h3>＋ 新增收货地址</h3><div class="ssub">演示环境，任意填写即可</div>
      <div class="xzg-form">
        <div class="fi"><label>收货人</label><input type="text" id="adName" value="李**"></div>
        <div class="fi"><label>手机号</label><input type="text" id="adPhone" value="138****5678"></div>
        <div class="fi"><label>所在城市</label><input type="text" id="adCity" value="上海市浦东新区"></div>
        <div class="fi"><label>详细地址</label><input type="text" id="adDetail" placeholder="街道 / 门牌 / 楼层"></div>
        <div class="fi"><label>标签</label><input type="text" id="adTag" value="家"></div>
      </div>
      <button class="xzg-btn big" onclick="XZG.addrSave()">保存地址</button>`);
  },
  addrSave(){
    const v=id=>((this.$('#'+id)||{}).value||'').trim();
    if(!v('adDetail')) return this.toast('请填写详细地址','📍');
    this.S.addrList=this.S.addrList||[];
    this.S.addrList.push({id:this.uid(),name:v('adName')||'李**',phone:v('adPhone')||'138****5678',
      city:v('adCity')||'上海市',detail:v('adDetail'),tag:v('adTag')||'家',def:!this.S.addrList.length});
    this.save(); this.sheetClose(); this.toast('地址已保存','✅'); setTimeout(()=>this.openAddr(),200);
  },
  /* ═══════════════ 商城 · 结算与支付 ═══════════════ */
  checkout(){
    const list=this._cartList(); if(!list.length) return this.toast('购物车是空的','🛒');
    const A=this.S.addr||{},total=this._cartTotal();
    this.sheet(`<h3>🧾 确认订单</h3><div class="ssub">工行 e次元商城 · 官方直营 · 正品保障</div>
      <div class="xzg-addrbox" onclick="XZG.openAddr()">
        <span class="ab-ic">📍</span>
        <div class="ab-m"><b>${A.name||'李**'} ${A.phone||''}</b><span>${(A.city||'')+' '+(A.detail||'')}</span></div>
        <span class="ab-arr">›</span>
      </div>
      ${list.map(x=>`<div class="xzg-cartrow"><span class="cc-img">${this.artSVG(x.art)}</span>
        <div class="cc-main"><b>${x.name}</b><span class="cc-p">¥${this.money(x.price)} × ${x.qty}</span></div>
        <span class="cc-sum">¥${this.money(x.price*x.qty)}</span></div>`).join('')}
      <div class="xzg-hr"></div>
      <div class="xzg-addrbox">
        <span class="ab-ic">💳</span>
        <div class="ab-m"><b>工商银行 · 储蓄卡（薪金卡）</b><span>尾号 8888 · 余额充足</span></div>
        <span class="ab-arr">›</span>
      </div>
      <div class="xzg-calc"><div class="cres">
        <div class="c"><b>¥${this.money(total)}</b><span>商品合计</span></div>
        <div class="c"><b>¥0</b><span>运费</span></div>
        <div class="c"><b>🌾${Math.max(5,Math.round(total/10))}</b><span>返谷粒</span></div>
      </div></div>
      <button class="xzg-btn big" onclick="XZG.payNow()">工商银行储蓄卡支付 ¥${this.money(total)}</button>
      <div class="xzg-muted" style="font-size:10.5px;margin-top:9px;text-align:center">* 演示环境 · 不会产生任何真实扣款</div>`);
  },
  payNow(){
    const list=this._cartList(); if(!list.length) return;
    const total=this._cartTotal(),now=this._now();
    const o={id:this.uid(),no:'EC'+Date.now().toString().slice(-10),items:list.map(x=>({id:x.id,name:x.name,price:x.price,qty:x.qty,art:x.art})),
      total:total,step:1,t:now,addr:Object.assign({},this.S.addr),
      express:'顺丰速运 SF'+(100000000+Math.floor(Math.random()*899999999)),
      trace:[{t:now,s:'订单已提交，等待支付'},{t:now,s:'支付成功 · 货款已进入工行托管，等待商家发货'}]};
    this.S.mallOrders.unshift(o);
    this.S.cart=[]; this.save();
    if(window.ICBCApp&&ICBCApp.addRecord)ICBCApp.addRecord({icon:'🛍️',bg:'#fdeff7',
      title:'e次元商城 · '+String(list[0].name).slice(0,12)+(list.length>1?'等'+list.length+'件':''),time:'刚刚',amt:-total});
    this.addGrains(Math.max(5,Math.round(total/10)),'购物返谷粒');
    this.sheet(`<div style="text-align:center;padding:10px 0 4px"><div style="font-size:46px">📦</div>
      <b style="font-size:15.5px;display:block;margin-top:8px">支付成功！</b>
      <div class="xzg-muted" style="margin-top:6px">订单号 ${o.no}<br>预计 48 小时内发货 · 货款由工行托管保障中</div>
      <button class="xzg-btn gold big" style="margin-top:14px" onclick="XZG.sheetClose();XZG.go('mallorder')">查看订单</button>
      <button class="xzg-btn plain big" style="margin-top:9px" onclick="XZG.sheetClose();XZG.go('mall')">继续逛逛</button></div>`);
  },
  /* ═══════════════ 商城 · 订单列表与物流 ═══════════════ */
  _ostatus(o){
    return {1:['待发货','#e08a2e','商家备货中 · 48 小时内发出'],
            2:['运输中','#3d8ff0','包裹在途 · 点击查看物流'],
            3:['派送中','#7a5cff','快递员正在派送 · 今日送达'],
            4:['已完成','#0aa870','已签收 · 感谢你的支持'],
            5:['已取消','#98a0ad','订单已取消 · 货款已退回']}[o.step]||['待处理','#98a0ad',''];
  },
  renderMallOrders(){
    const b=this.$('#mallOrderBody'); if(!b)return;
    const L=this.S.mallOrders||[];
    const seg=this._moSeg||'all';
    const F=L.filter(o=>seg==='all'||(seg==='run'&&o.step>=1&&o.step<=3)||(seg==='done'&&o.step===4));
    b.innerHTML=`
      <div class="mo-seg">
        ${[['all','全部'],['run','进行中'],['done','已完成']].map(([k,t])=>
          `<button class="${seg===k?'on':''}" onclick="XZG.moSeg('${k}')">${t}</button>`).join('')}
      </div>
      ${F.length?F.map(o=>{const st=this._ostatus(o);return `
        <div class="mo-card" onclick="XZG.openOrder('${o.id}')">
          <div class="mo-h"><span class="mo-no">订单号 ${o.no}</span><b style="color:${st[1]}">${st[0]}</b></div>
          ${o.items.map(it=>`<div class="xzg-cartrow"><span class="cc-img">${this.artSVG(it.art)}</span>
            <div class="cc-main"><b>${it.name}</b><span class="cc-p">¥${this.money(it.price)} × ${it.qty}</span></div>
            <span class="cc-sum">¥${this.money(it.price*it.qty)}</span></div>`).join('')}
          <div class="mo-f"><span class="xzg-muted" style="font-size:11px">${st[2]}</span>
            <b style="font-size:14px">合计 ¥${this.money(o.total)}</b></div>
          <div class="mo-ops">
            ${o.step===1?`<button class="xzg-btn plain mini" onclick="event.stopPropagation();XZG.orderCancel('${o.id}')">取消订单</button>
              <button class="xzg-btn mini" onclick="event.stopPropagation();XZG.orderShip('${o.id}')">催发货</button>`:''}
            ${o.step===2||o.step===3?`<button class="xzg-btn plain mini" onclick="event.stopPropagation();XZG.openLogistics('${o.id}')">查看物流</button>
              <button class="xzg-btn mini" onclick="event.stopPropagation();XZG.orderConfirm('${o.id}')">确认收货</button>`:''}
            ${o.step===4?`<button class="xzg-btn plain mini" onclick="event.stopPropagation();XZG.openLogistics('${o.id}')">查看物流</button>
              <button class="xzg-btn mini" onclick="event.stopPropagation();XZG.orderReview('${o.id}')">再买一次</button>`:''}
            ${o.step===5?`<button class="xzg-btn plain mini" onclick="event.stopPropagation();XZG.orderReview('${o.id}')">再买一次</button>`:''}
          </div>
        </div>`}).join(''):`<div class="xzg-card"><div class="xzg-null"><span class="nic">📦</span>还没有订单 · 去商城挑点心动谷子</div></div>`}
      <button class="xzg-btn plain big" style="margin-top:4px" onclick="XZG.go('mall')">🛍 回商城继续逛</button>`;
  },
  moSeg(k){this._moSeg=k;this.renderMallOrders()},
  openOrder(id){
    const o=(this.S.mallOrders||[]).find(x=>x.id===id); if(!o)return;
    const st=this._ostatus(o);
    this.sheet(`<h3>📦 订单详情</h3><div class="ssub">订单号 ${o.no} · 下单时间 ${o.t}</div>
      <div class="xzg-card" style="background:linear-gradient(135deg,#fff4f7,#ffe9f1)">
        <div class="ct" style="color:${st[1]}">${st[0]}<span class="more" onclick="XZG.openLogistics('${o.id}')">查看物流 ›</span></div>
        <div class="xzg-muted" style="font-size:11.5px">${st[2]}</div></div>
      ${o.items.map(it=>`<div class="xzg-cartrow"><span class="cc-img">${this.artSVG(it.art)}</span>
        <div class="cc-main"><b>${it.name}</b><span class="cc-p">¥${this.money(it.price)} × ${it.qty}</span></div>
        <span class="cc-sum">¥${this.money(it.price*it.qty)}</span></div>`).join('')}
      <div class="xzg-hr"></div>
      <div class="xzg-kvrow"><span>收货人</span><b>${o.addr.name} ${o.addr.phone}</b></div>
      <div class="xzg-kvrow"><span>收货地址</span><b style="max-width:62%;text-align:right">${o.addr.city} ${o.addr.detail}</b></div>
      <div class="xzg-kvrow"><span>承运快递</span><b>${o.step>=2?o.express:'待分配'}</b></div>
      <div class="xzg-kvrow"><span>支付方式</span><b>工商银行储蓄卡 · 尾号 8888</b></div>
      <div class="xzg-kvrow"><span>实付金额</span><b style="color:#e03a5e;font-size:16px">¥${this.money(o.total)}</b></div>
      <div class="xzg-hr"></div>
      <div class="mo-ops" style="justify-content:center">
        <button class="xzg-btn plain mini" onclick="XZG.openLogistics('${o.id}')">物流追踪</button>
        ${o.step===1?`<button class="xzg-btn mini" onclick="XZG.orderShip('${o.id}')">催发货</button>`:''}
        ${o.step>=2&&o.step<=3?`<button class="xzg-btn mini" onclick="XZG.orderConfirm('${o.id}')">确认收货</button>`:''}
        <button class="xzg-btn gold mini" onclick="XZG.sheetClose()">完成</button>
      </div>`);
  },
  openLogistics(id){
    const o=(this.S.mallOrders||[]).find(x=>x.id===id); if(!o)return;
    if(o.step<2){ this.sheet(`<h3>🚚 物流追踪</h3><div class="ssub">订单号 ${o.no}</div>
      <div class="xzg-null"><span class="nic">📮</span>商家还未发货，暂无物流信息</div>
      <button class="xzg-btn big" onclick="XZG.orderShip('${o.id}')">模拟发货（演示）</button>`); return; }
    const T=o.trace||[];
    this.sheet(`<h3>🚚 物流追踪</h3><div class="ssub">${o.express} · 运单号 ${o.express.replace(/\D/g,'')}</div>
      <div class="xzg-logi">
        ${T.slice().reverse().map((t,i)=>`<div class="lg-row${i===0?' on':''}"><span class="lg-dot"></span>
          <div class="lg-m"><b>${t.s}</b><span>${t.t}</span></div></div>`).join('')}
      </div>
      <div class="xzg-hr"></div>
      <div class="xzg-kvrow"><span>收货信息</span><b style="max-width:62%;text-align:right">${o.addr.city} ${o.addr.detail}</b></div>
      <div class="mo-ops" style="justify-content:center;margin-top:10px">
        ${o.step<=3?`<button class="xzg-btn mini" onclick="XZG.orderConfirm('${o.id}')">确认收货</button>`:''}
        <button class="xzg-btn plain mini" onclick="XZG.sheetClose()">关闭</button>
      </div>`);
  },
  orderShip(id){
    const o=(this.S.mallOrders||[]).find(x=>x.id===id); if(!o||o.step!==1)return;
    const now=this._now();
    o.step=2;
    o.trace=o.trace.concat([
      {t:now,s:'商家已发货 · 包裹交由 '+o.express},
      {t:now,s:'【上海市】快件已到达 上海黄浦集散中心'}
    ]);
    this.save(); this.sheetClose(); setTimeout(()=>this.openLogistics(o.id),200);
    this.toast('商家已发货 · 快去查看物流','🚚');
    setTimeout(()=>{o.step=3;o.trace.push({t:this._now(),s:'【上海市】快递员正在派送，请保持电话畅通'});this.save();
      if(this._lastPg==='mallorder')this.renderMallOrders();},2600);
  },
  orderConfirm(id){
    const o=(this.S.mallOrders||[]).find(x=>x.id===id); if(!o)return;
    o.step=4; o.trace=(o.trace||[]).concat([{t:this._now(),s:'包裹已签收 · 感谢使用 e次元商城'}]);
    this.S.exp+=30; this.save();
    if(window.ICBCApp&&ICBCApp.addRecord)ICBCApp.addRecord({icon:'🎉',bg:'#eef9ef',title:'e次元商城 · 确认收货回馈谷粒',time:'刚刚',amt:0});
    this.toast('已确认收货 · 成长值 +30','🎉');
    this.sheetClose(); setTimeout(()=>this.openLogistics(o.id),200);
  },
  orderCancel(id){
    const o=(this.S.mallOrders||[]).find(x=>x.id===id); if(!o)return;
    o.step=5; o.trace=(o.trace||[]).concat([{t:this._now(),s:'订单已取消 · 货款原路退回工行储蓄卡'}]);
    this.save(); this.renderMallOrders(); this.toast('订单已取消 · 演示环境不产生真实退款','↩️');
  },
  orderReview(id){
    const o=(this.S.mallOrders||[]).find(x=>x.id===id); if(!o)return;
    this.sheet(`<h3>⭐ 评价晒单</h3><div class="ssub">订单号 ${o.no}</div>
      <div style="text-align:center;font-size:26px;letter-spacing:6px;padding:8px 0">⭐⭐⭐⭐⭐</div>
      <textarea id="moRv" placeholder="说说这次吃谷体验…" style="width:100%;height:88px;border:1.5px solid #edeff3;border-radius:12px;padding:12px;font-size:13px;resize:none;font-family:inherit"></textarea>
      <button class="xzg-btn big" style="margin-top:12px" onclick="XZG.moReviewOk('${o.id}')">提交评价 · 得 30 谷粒</button>`);
  },
  moReviewOk(id){
    const o=(this.S.mallOrders||[]).find(x=>x.id===id); if(o) o.reviewed=true;
    this.save(); this.sheetClose(); this.addGrains(30,'晒单评价');
    if(this._lastPg==='mallorder') this.renderMallOrders();
  },
  /* 商城搜索（演示版：按关键词过滤商品） */
  mallSearch(){
    this.sheet(`<h3>🔍 搜索谷子</h3><div class="ssub">试试：吧唧 / 立牌 / 手办 / 痛包 / 色纸</div>
      <div class="xzg-form"><div class="fi"><label>关键词</label>
        <input type="text" id="mlQ" placeholder="输入品名或品类" oninput="XZG.mallSearchRun(this.value)"></div></div>
      <div id="mlRes"></div>`);
    setTimeout(()=>this.mallSearchRun(''),30);
  },
  mallSearchRun(q){
    const box=this.$('#mlRes'); if(!box)return;
    const kw=String(q||'').trim();
    const all=this.EZ().mallGoods.map(g=>Object.assign({},g,{price:+g.price}));
    const hit=kw?all.filter(g=>(g.name+g.tag).indexOf(kw)>=0):all.slice(0,6);
    box.innerHTML=hit.length?hit.map(g=>`
      <div class="xzg-cartrow" onclick="XZG.sheetClose();XZG.buyGoods('${g.id}')">
        <span class="cc-img">${this.artSVG(g.art)}</span>
        <div class="cc-main"><b>${g.name}</b><span class="cc-p">¥${this.money(g.price)} · ${g.tag}</span></div>
        <span class="cc-sum" style="color:#e03a5e;font-weight:800">¥${this.money(g.price)}</span></div>`).join('')
      :`<div class="xzg-null"><span class="nic">🔍</span>没有找到「${kw}」相关谷子</div>`;
  },
  renderMine(){
    const E=this.EZ(),M=E.mine,S=this.S,b=this.$('#mineBody');if(!b)return;
    const medalCnt=Object.keys(S.medals||{}).length;
    b.innerHTML=`
      <div class="mn-hero">
        <div class="mn-hero-mascot">${CHARS.svg(CHARS.current())}</div>
        <div class="mn-me">
          <span class="mn-ava ec-ava-wrap" data-me="1">${CHARS.head(CHARS.current())}</span>
          <div class="mn-me-t">
            <b>${M.name} <i class="mn-edit">✏️</i></b>
            <span>${M.uid} · ${M.ip}</span>
          </div>
        </div>
        <p class="mn-sign">${M.sign}</p>
        <div class="mn-tags">${M.tags.map(t=>`<i>+ ${t}</i>`).join('')}</div>
        <div class="mn-stats">
          <button onclick="XZG.mineFans()"><b>${(M.fans/1000).toFixed(1).replace('.0','')}k</b><span>粉丝</span></button>
          <button onclick="XZG.mineTab('follow')"><b>${M.follow}</b><span>关注</span></button>
          <button onclick="ICBCApp.toast('获赞 ${M.likes} 次，继续创作吧','👍')"><b>${(M.likes/1000).toFixed(1)}k</b><span>获赞</span></button>
          <button onclick="XZG.go('zaangu')"><b>${this.money(S.grains)}</b><span>谷粒</span></button>
        </div>
      </div>
      <div class="mn-gcards">${M.gameCards.map(c=>`
        <div class="mn-gcard">
          <div class="mn-gc-h"><span class="mn-gc-ava">${CHARS.head(c.char)}</span>
            <div><b>${c.name}</b><span>${c.sub}</span></div></div>
          <div class="mn-gc-s">${c.stats.map(s=>`<div><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
        </div>`).join('')}
      </div>
      <div class="mn-acts">
        <button onclick="XZG.go('mall')"><i>🛒</i><span>e次元甄选</span><em>自有周边店</em></button>
        <button onclick="XZG.go('create')"><i>✏️</i><span>创作中心</span><em>作品收益管理</em></button>
        <button onclick="XZG.go('exchange')"><i>🎁</i><span>兑换中心</span><em>谷粒当钱花</em></button>
        <button onclick="XZG.mineMedal()"><i>🏅</i><span>成就勋章</span><em>${medalCnt}/${this.DB.badges.length} 枚</em></button>
      </div>
      <div class="xsb mn-xsb">
        <span class="xsb-ic">🎨</span>
        <div class="xsb-t"><b>插画风格</b><span>谷伴与场景插画按你的性别绘制</span></div>
        ${this.genderSeg('xsb-seg--sm')}
      </div>
      <button class="mn-companion" onclick="XZG.pickCompanionOpen()">
        <span class="mc-ava">${CHARS.head(CHARS.current())}</span>
        <span class="mc-t"><b>我的谷伴 · ${CHARS.get(CHARS.current()).name}</b><span>${CHARS.get(CHARS.current()).say}</span></span>
        <i class="mc-go">换一位 ›</i>
      </button>
      <div class="mn-tabs">
        <button class="mn-tab on" data-t="work" onclick="XZG.mineTab('work')">发布</button>
        <button class="mn-tab" data-t="follow" onclick="XZG.mineTab('follow')">我的关注</button>
        <button class="mn-tab" data-t="collect" onclick="XZG.mineTab('collect')">收藏</button>
      </div>
      <div id="mnTabBody">${this.mineBody('work')}</div>`;
  },
  mineBody(t){
    const E=this.EZ(),M=E.mine;
    if(t==='work')return M.works.map(w=>`
      <div class="xzg-card" style="padding:14px 16px"><div class="fm-post-h" style="margin-bottom:6px">
        <span class="fm-post-u"><b style="font-size:13.5px">${w.title}</b><span><i class="fm-zone">${w.zone}</i>${w.time}</span></span></div>
        <div class="fm-post-f" style="margin:0"><span>👍 ${w.likes}</span><span>💬 ${Math.round(w.likes/6)}</span><span>💰 收益 ¥${(w.likes*0.02).toFixed(0)}</span></div></div>`).join('')
      +`<button class="xzg-btn ghost big" style="margin-top:2px" onclick="XZG.go('forum');setTimeout(()=>XZG.newPost(),350)">✏️ 发布新帖子</button>`;
    if(t==='follow')return E.mine.follows.map(f=>`
      <div class="xzg-card" style="display:flex;align-items:center;gap:12px;padding:13px 16px">
        <span class="fm-post-ava" style="width:44px;height:44px">${CHARS.head(f.char)}</span>
        <span style="flex:1;min-width:0"><b style="font-size:13.5px;display:block">${f.name}</b><span style="font-size:11px;color:#98a0ad">${f.sub}</span></span>
        <button class="xzg-btn mini plain" onclick="ICBCApp.toast('已取消关注（演示）','😢')">已关注</button>
      </div>`).join('');
    return `<div class="xzg-null"><span class="nic">⭐</span>收藏功能演示中<br><span style="font-size:11px">在帖子详情点「收藏」即可加入</span></div>`;
  },
  mineTab(t){
    document.querySelectorAll('.mn-tab').forEach(x=>x.classList.toggle('on',x.dataset.t===t));
    const el=this.$('#mnTabBody');if(el)el.innerHTML=this.mineBody(t);
  },
  mineFans(){
    this.sheet(`<h3>👥 我的粉丝</h3><div class="ssub">共 1,286 位谷友关注了你</div>
      ${[['chengxi','蹲低价的小满','互相关注 · 2小时前访问'],['xiaoe','风与自由','新粉丝 · 昨天关注'],['yufeng','夜航船','互相关注 · 3天前访问'],['yutang','吃谷十年的阿棠','新粉丝 · 3天前关注']].map(f=>`
      <div class="xzg-card" style="display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:10px">
        <span class="fm-post-ava" style="width:42px;height:42px">${CHARS.head(f[0])}</span>
        <span style="flex:1;min-width:0"><b style="font-size:13px;display:block">${f[1]}</b><span style="font-size:10.5px;color:#98a0ad">${f[2]}</span></span>
        <button class="xzg-btn mini" onclick="ICBCApp.toast('已回关','🤝')">回关</button>
      </div>`).join('')}
      <div class="xzg-muted" style="text-align:center;font-size:11px">仅展示部分粉丝（演示）</div>`);
  },
  mineMedal(){
    const S=this.S;
    this.sheet(`<h3>🏅 成就勋章</h3><div class="ssub">已点亮 ${Object.keys(S.medals||{}).length} / ${this.DB.badges.length} 枚 · 点亮全部可获得限定称号</div>
      <div class="xzg-medal-grid" style="margin:12px 0">
        ${this.DB.badges.map(x=>`<div class="xzg-medal${S.medals[x.id]?'':' lock'}"><span class="mic">${x.emo}</span><span class="mn">${x.name}</span></div>`).join('')}
      </div>
      <div class="xzg-spark-tip">🏆 称号进度：「谷圈百晓生」还需点亮 ${Math.max(0,this.DB.badges.length-Object.keys(S.medals||{}).length)} 枚勋章</div>`);
  },

  /* ═══ 创作中心（独立页：蓝渐变头部 + 数据看板 + 发布/评论/合集/收藏） ═══ */
  cxTab:'publish',
  renderCreate(){
    const M=this.EZ().mine;
    const b=this.$('#createBody');if(!b)return;
    b.innerHTML=`
      <div class="cx-hero">
        <button class="cx-back" onclick="XZG.go('mine')">
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="cx-hero-t">
          <span class="cx-ava ec-ava-wrap" data-me="1">${CHARS.head(CHARS.current())}</span>
          <div><b>创作中心</b><span>${M.name} · ${M.uid}</span></div>
        </div>
        <div class="cx-lv">
          <span class="cx-lv-badge">Lv.${this.S.lv}</span>
          <span>创作等级 · ${this.S.lvName||'谷民'}</span>
        </div>
      </div>
      <div class="cx-board">
        ${[['1.2k','累计获赞','👍'],['¥68','创作收益','💰'],['+86','新增粉丝','👥'],['3','作品数','📝']].map(x=>`
        <div class="cx-bd-item"><i>${x[2]}</i><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}
      </div>
      <div class="cx-tabs">
        ${[['publish','发布'],['comment','评论'],['album','合集'],['collect','收藏']].map(t=>`
        <button class="cx-tab${this.cxTab===t[0]?' on':''}" onclick="XZG.cxSwitch('${t[0]}')">${t[1]}</button>`).join('')}
      </div>
      <div id="cxTabBody">${this.cxBody(this.cxTab)}</div>`;
  },
  cxSwitch(t){this.cxTab=t;this.renderCreate()},
  cxBody(t){
    const M=this.EZ().mine;
    if(t==='publish')return M.works.map(w=>`
      <div class="cx-item">
        <div class="cx-item-m"><b>${w.title}</b><span><i class="fm-zone">${w.zone}</i>${w.time} 发布</span></div>
        <div class="cx-item-s"><span>👍 ${w.likes}</span><span>💬 ${Math.round(w.likes/6)}</span><span class="cx-earn">💰 ¥${(w.likes*0.02).toFixed(0)}</span></div>
      </div>`).join('')
      +`<button class="xzg-btn ghost big" style="margin-top:4px" onclick="XZG.go('forum');setTimeout(()=>XZG.newPost(),350)">✏️ 发布新作品</button>`;
    if(t==='comment')return [['风与自由','这组痛包摆得太好看了，求链接！','2小时前'],['世界树图书管理员','理性吃谷，写得真好，收藏了～','昨天'],['夜叉守夜人','同款吧唧，我这也是S级成色','3天前']].map(c=>`
      <div class="cx-item">
        <div class="cx-comment"><span class="fm-post-ava" style="width:34px;height:34px">${CHARS.head(CHARS.pick(c[0]))}</span>
          <div><b>${c[0]} <em>回复了你</em></b><p>${c[1]}</p><span class="cx-time">${c[2]}</span></div></div>
      </div>`).join('');
    if(t==='album')return [['#吃谷日常 合集','收录 12 篇 · 1.2万 浏览','linear-gradient(135deg,#5b7cff,#7a5cff)'],['#痛包改造 合集','收录 6 篇 · 4,380 浏览','linear-gradient(135deg,#3dc6bb,#1f8f88)'],['#漫展回血 攻略','收录 4 篇 · 2,960 浏览','linear-gradient(135deg,#ff9dc6,#ff6fa5)']].map(a=>`
      <div class="cx-item cx-album">
        <span class="cx-album-cover" style="background:${a[2]}">📚</span>
        <div class="cx-item-m"><b>${a[0]}</b><span>${a[1]}</span></div><i class="cx-arrow">›</i>
      </div>`).join('');
    return `<div class="xzg-null"><span class="nic">⭐</span>还没有收藏内容<br><span style="font-size:11px">在帖子详情点「收藏」即可加入</span></div>`;
  },

  /* ═══ 兑换中心（独立页：谷粒当钱花 · 分类瓷片 + 好物货架） ═══ */
  exCat:'all',
  renderExchange(){
    const S=this.S,b=this.$('#exchangeBody');if(!b)return;
    const cats=[['all','全部'],['goods','周边好物'],['gift','礼券'],['ticket','票务']];
    const list=this.DB.shop.filter(x=>this.exCat==='all'||x.cat===this.exCat);
    b.innerHTML=`
      <div class="ex-hero">
        <button class="cx-back" onclick="XZG.go('mine')">
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="ex-hero-t"><b>兑换中心</b><span>谷粒当钱花 · 好礼天天上新</span></div>
        <div class="ex-wallet">
          <div class="ex-wallet-l"><span>我的谷粒</span><b>${this.money(S.grains)}</b></div>
          <button class="ex-wallet-btn" onclick="XZG.go('zaangu')">赚谷粒 ›</button>
        </div>
      </div>
      <div class="ex-cats">
        ${cats.map(c=>`<button class="ex-cat${this.exCat===c[0]?' on':''}" onclick="XZG.exSwitch('${c[0]}')">${c[1]}</button>`).join('')}
      </div>
      <div class="ex-grid">
        ${list.map(g=>{const can=S.grains>=g.cost;return`
        <div class="ex-card">
          <div class="ex-fig" style="background:${g.icb}">${g.emo}</div>
          <b class="ex-name">${g.name}</b>
          <span class="ex-desc">${g.desc}</span>
          <div class="ex-foot">
            <span class="ex-cost"><em>${this.money(g.cost)}</em>${g.unit}</span>
            <button class="ex-buy${can?'':' dis'}" onclick="XZG.exchange('${g.id}')">${can?'兑换':'谷粒不足'}</button>
          </div>
        </div>`}).join('')}
      </div>
      <div class="xzg-spark-tip">🎁 每日签到、论坛发帖、出谷通托管均可赚谷粒，攒够即可兑换心仪好物</div>`;
  },
  exSwitch(c){this.exCat=c;this.renderExchange()},
  exchange(id){
    const g=this.DB.shop.find(x=>x.id===id);if(!g)return;
    if(this.S.grains<g.cost){this.toast(`还差 ${this.money(g.cost-this.S.grains)} 谷粒，去攒谷领任务吧`,'🌾');return}
    this.S.grains-=g.cost;this.save();this.syncMine();
    this.sheet(`<h3>🎉 兑换成功</h3><div class="ssub">已在「我的-兑换记录」生成订单</div>
      <div class="xzg-card" style="text-align:center;padding:20px 16px;margin:12px 0">
        <div style="font-size:44px">${g.emo}</div>
        <b style="font-size:14.5px;display:block;margin-top:8px">${g.name}</b>
        <div class="xzg-muted" style="margin-top:6px">${g.desc}</div>
        <div class="xzg-muted" style="margin-top:8px">消耗谷粒 <b style="color:#c7000b">${this.money(g.cost)}</b> · 剩余 ${this.money(this.S.grains)}</div>
      </div>
      <button class="xzg-btn big" onclick="XZG.sheetClose()">完成</button>`);
    this.renderExchange();
  }
});

/* ---- 启动：加载状态、同步「我的」成长卡、监听外壳功能切换事件 ---- */
XZG.init();
XZG.syncMine();
document.addEventListener('xingegu:open',function(e){
  try{XZG.mount(e.detail.feature.id)}catch(err){console.error('[e次元] 渲染失败：',err)}
});
