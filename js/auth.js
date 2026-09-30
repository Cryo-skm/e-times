/* ════════════════════════════════════════════════════════════════════
   e次元 · 统一登录系统  (js/auth.js)
   ─────────────────────────────────────────────────────────────────────
   · 移动端 index.html 与 PC 端 pc/index.html 共用同一套账号体系 ——
     同源 localStorage，任一端注册、另一端直接登录。
   · 完整闭环：注册 / 密码登录 / 验证码登录 / 找回密码(三步) /
     会话保持 / 个人资料(头像·昵称·手机·密码) / 退出登录 / 游客浏览。
   · 纯前端零依赖：账号只存在本机浏览器，不联网、不产生任何真实数据。
     密码不落明文 —— 随机盐 + SHA-256 摘要后才写库。

   对外 API（window.ECAUTH）：
     ECAUTH.register({username,phone,password,avatar}) → {ok,reason,user}
     ECAUTH.login(username, password)                  → {ok,reason,user}
     ECAUTH.sendCode(phone, purpose)                   → {ok,reason,code}
     ECAUTH.verifyCode(phone, code, purpose)           → {ok,reason}
     ECAUTH.resetPassword(username, newPassword)       → {ok,reason}
     ECAUTH.findUser(username)                         → user|null
     ECAUTH.current()                                  → user|null
     ECAUTH.isLoggedIn() / isGuest()
     ECAUTH.updateProfile(patch)                       → {ok,reason}
     ECAUTH.changePassword(oldPwd, newPwd)             → {ok,reason}
     ECAUTH.logout()
     ECAUTH.show() / ECAUTH.hide() / ECAUTH.openAccount()
     ECAUTH.maskPhone(p) / ECAUTH.avatarOf(user) / ECAUTH.initialOf(user)

   事件（document）：
     'ecauth:change'  detail={user, loggedIn}   登录状态变化
     'ecauth:login'   detail={user}
     'ecauth:logout'  detail={}
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════
     0. 基础工具
     ══════════════════════════════════════════════════════════════════ */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s)
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const RE_PHONE = /^1[3-9]\d{9}$/;
  const MIN_PWD = 6;

  /* ── SHA-256（纯 JS 实现）──────────────────────────────────────────
     为什么不用 crypto.subtle：它是 Secure Context API，directly 双击
     打开 file:// 的 index.html 时 window.crypto.subtle 是 undefined，
     那样本地演示就完全登不上了。自带实现能保证 file:// / http /
     https 三种打开方式行为完全一致。                                */
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  function sha256(str) {
    /* 1) 文本 → UTF-8 字节 */
    const b = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) b.push(c);
      else if (c < 0x800) b.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else if (c >= 0xd800 && c <= 0xdbff) {
        const c2 = str.charCodeAt(++i);
        c = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
        b.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      } else b.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    /* 2) 补位：0x80 后补 0 直到 ≡56 (mod 64)，再写 64 位大端长度 */
    const bitLen = b.length * 8;
    b.push(0x80);
    while (b.length % 64 !== 56) b.push(0);
    const hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
    b.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255,
      (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);

    /* 3) 逐块压缩 */
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Array(64);
    for (let off = 0; off < b.length; off += 64) {
      for (let t = 0; t < 16; t++) {
        const p = off + t * 4;
        w[t] = (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3];
      }
      for (let t = 16; t < 64; t++) {
        const x = w[t - 15], y = w[t - 2];
        const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      let a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const T1 = (h + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & bb) ^ (a & c) ^ (bb & c);
        const T2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + T1) | 0;
        d = c; c = bb; bb = a; a = (T1 + T2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  /* 盐值：优先 crypto.getRandomValues（file:// 下也可用），否则时间戳兜底 */
  function makeSalt() {
    let s = '';
    try {
      const arr = new Uint8Array(12);
      crypto.getRandomValues(arr);
      s = Array.from(arr, n => n.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      s = (Date.now().toString(16) + Math.random().toString(16).slice(2)).slice(0, 24);
    }
    return s;
  }
  /* 存库格式：sha256(salt + '::' + password)，演示项目够用且不落明文 */
  const hashPwd = (salt, pwd) => sha256(salt + '::' + pwd);

  /* ══════════════════════════════════════════════════════════════════
     1. 存储层
     ══════════════════════════════════════════════════════════════════ */
  const KEY_USERS = 'ec_users_v1';     /* { [username]: {username,phone,salt,hash,avatar,createdAt,lastLogin} } */
  const KEY_SESSION = 'ec_session_v1';   /* { username, at } —— 两端同源共享，实现"一处登录处处登录" */
  const KEY_GUEST = 'ec_guest_v1';     /* sessionStorage：本次会话选择了"游客浏览" */

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(KEY_USERS) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function writeUsers(users) {
    try { localStorage.setItem(KEY_USERS, JSON.stringify(users)); return true; }
    catch (e) {
      toast('本地存储空间不足，请换一张小一点的头像');
      return false;
    }
  }

  /* 会话内只留非敏感字段，密码摘要不出现在 session 里 */
  const publicUser = u => u ? {
    username: u.username, phone: u.phone || '', avatar: u.avatar || '',
    createdAt: u.createdAt || 0, lastLogin: u.lastLogin || 0
  } : null;

  /* ══════════════════════════════════════════════════════════════════
     2. 认证核心
     ══════════════════════════════════════════════════════════════════ */

  /* ── 短信验证码（演示环境：本地生成，不真发短信）──
     purpose: 'reg' 注册 / 'login' 验证码登录 / 'forgot' 找回密码        */
  const codeStore = {};
  const CODE_TTL = 5 * 60 * 1000;
  const CODE_MAX_TRY = 5;

  function sendCode(phone, purpose) {
    return new Promise(resolve => {
      if (!RE_PHONE.test(phone || '')) { resolve({ ok: false, reason: '请输入正确的手机号码' }); return; }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      codeStore[purpose + '_' + phone] = { code, exp: Date.now() + CODE_TTL, tries: 0 };
      /* 演示环境把验证码直接摆出来，评委不用等短信 */
      showDemoCode(code);
      resolve({ ok: true, code });
    });
  }

  function verifyCode(phone, code, purpose) {
    return new Promise(resolve => {
      const key = purpose + '_' + phone;
      const rec = codeStore[key];
      if (!rec) { resolve({ ok: false, reason: '请先获取验证码' }); return; }
      if (Date.now() > rec.exp) { resolve({ ok: false, reason: '验证码已过期，请重新获取' }); return; }
      if (rec.tries >= CODE_MAX_TRY) { resolve({ ok: false, reason: '尝试次数过多，请重新获取验证码' }); return; }
      rec.tries++;
      if (String(code || '').trim() !== rec.code) {
        resolve({ ok: false, reason: `验证码错误（还可尝试 ${CODE_MAX_TRY - rec.tries} 次）` });
        return;
      }
      delete codeStore[key];
      resolve({ ok: true });
    });
  }

  /* ── 注册 ── */
  function register(info) {
    const username = String((info && info.username) || '').trim();
    const phone = String((info && info.phone) || '').trim();
    const password = String((info && info.password) || '');

    if (!username) return { ok: false, reason: '请输入用户名' };
    if (username.length < 2) return { ok: false, reason: '用户名至少 2 个字符' };
    if (username.length > 16) return { ok: false, reason: '用户名最多 16 个字符' };
    if (!RE_PHONE.test(phone)) return { ok: false, reason: '请输入正确的手机号码' };
    if (password.length < MIN_PWD) return { ok: false, reason: `密码至少 ${MIN_PWD} 位` };

    const users = readUsers();
    if (users[username]) return { ok: false, reason: '该用户名已被占用，请换一个' };
    if (Object.values(users).some(u => u.phone === phone)) {
      return { ok: false, reason: '该手机号已被注册' };
    }

    const salt = makeSalt();
    const user = {
      username, phone, salt, hash: hashPwd(salt, password),
      avatar: info.avatar || '', createdAt: Date.now(), lastLogin: Date.now()
    };
    users[username] = user;
    if (!writeUsers(users)) return { ok: false, reason: '本地存储写入失败' };
    return { ok: true, user: publicUser(user) };
  }

  /* ── 密码登录 ── */
  function login(username, password) {
    const name = String(username || '').trim();
    if (!name || !password) return { ok: false, reason: '请填写完整的用户名和密码' };
    const users = readUsers();
    const u = users[name];
    if (!u) return { ok: false, reason: '用户不存在，请先注册' };
    if (hashPwd(u.salt, String(password)) !== u.hash) return { ok: false, reason: '密码错误，请重新输入' };
    u.lastLogin = Date.now();
    writeUsers(users);
    return { ok: true, user: setSession(u) };
  }

  /* ── 验证码登录（校验由调用方先完成，这里只落会话）── */
  function loginByUser(user) {
    if (!user) return { ok: false, reason: '用户不存在' };
    const users = readUsers();
    if (users[user.username]) { users[user.username].lastLogin = Date.now(); writeUsers(users); }
    return { ok: true, user: setSession(users[user.username] || user) };
  }

  function setSession(user) {
    try { localStorage.setItem(KEY_SESSION, JSON.stringify({ username: user.username, at: Date.now() })); } catch (e) { }
    try { sessionStorage.removeItem(KEY_GUEST); } catch (e) { }
    const pub = publicUser(user);
    emit('ecauth:login', { user: pub });
    emit('ecauth:change', { user: pub, loggedIn: true });
    return pub;
  }

  function findUser(username) {
    const u = readUsers()[String(username || '').trim()];
    return u ? Object.assign({}, u) : null;   /* 只给副本，改副本不影响库 */
  }

  function current() {
    let sess;
    try { sess = JSON.parse(localStorage.getItem(KEY_SESSION) || 'null'); } catch (e) { sess = null; }
    if (!sess || !sess.username) return null;
    const u = readUsers()[sess.username];
    if (!u) { try { localStorage.removeItem(KEY_SESSION); } catch (e) { } return null; }
    return publicUser(u);
  }
  const isLoggedIn = () => !!current();

  function isGuest() {
    try { return sessionStorage.getItem(KEY_GUEST) === '1'; } catch (e) { return false; }
  }

  function logout(silent) {
    try { localStorage.removeItem(KEY_SESSION); } catch (e) { }
    emit('ecauth:logout', {});
    emit('ecauth:change', { user: null, loggedIn: false });
    if (!silent) toast('已安全退出登录');
  }

  /* ── 找回密码：用新密码覆盖（在此之前必须已通过身份验证）── */
  function resetPassword(username, newPassword) {
    if (!newPassword || newPassword.length < MIN_PWD) return { ok: false, reason: `密码至少 ${MIN_PWD} 位` };
    const users = readUsers();
    const u = users[String(username || '').trim()];
    if (!u) return { ok: false, reason: '用户不存在' };
    u.salt = makeSalt();
    u.hash = hashPwd(u.salt, String(newPassword));
    writeUsers(users);
    return { ok: true };
  }

  /* ── 修改资料（昵称 / 头像 / 手机号）—— 仅作用于当前登录用户 ── */
  function updateProfile(patch) {
    const me = current();
    if (!me) return { ok: false, reason: '请先登录' };
    const users = readUsers();
    const u = users[me.username];
    if (!u) return { ok: false, reason: '账号不存在' };
    patch = patch || {};

    /* 改昵称：要把 key 一起迁移，不能简单覆盖 */
    if (patch.username && patch.username !== me.username) {
      const nn = String(patch.username).trim();
      if (nn.length < 2) return { ok: false, reason: '昵称至少 2 个字符' };
      if (nn.length > 16) return { ok: false, reason: '昵称最多 16 个字符' };
      if (users[nn]) return { ok: false, reason: '该昵称已被占用' };
      delete users[me.username];
      u.username = nn;
      users[nn] = u;
      try { localStorage.setItem(KEY_SESSION, JSON.stringify({ username: nn, at: Date.now() })); } catch (e) { }
    }
    if (typeof patch.phone === 'string' && patch.phone !== u.phone) {
      if (!RE_PHONE.test(patch.phone)) return { ok: false, reason: '请输入正确的手机号码' };
      const dup = Object.values(users).find(x => x.phone === patch.phone && x.username !== u.username);
      if (dup) return { ok: false, reason: '该手机号已被其他账号绑定' };
      u.phone = patch.phone;
    }
    if (typeof patch.avatar === 'string') u.avatar = patch.avatar;

    if (!writeUsers(users)) return { ok: false, reason: '本地存储写入失败' };
    const pub = publicUser(u);
    emit('ecauth:change', { user: pub, loggedIn: true });
    return { ok: true, user: pub };
  }

  /* ── 修改密码 ── */
  function changePassword(oldPwd, newPwd) {
    const me = current();
    if (!me) return { ok: false, reason: '请先登录' };
    const users = readUsers();
    const u = users[me.username];
    if (!u) return { ok: false, reason: '账号不存在' };
    if (hashPwd(u.salt, String(oldPwd || '')) !== u.hash) return { ok: false, reason: '原密码错误' };
    if (!newPwd || String(newPwd).length < MIN_PWD) return { ok: false, reason: `新密码至少 ${MIN_PWD} 位` };
    if (String(newPwd) === String(oldPwd)) return { ok: false, reason: '新密码不能与原密码相同' };
    u.salt = makeSalt();
    u.hash = hashPwd(u.salt, String(newPwd));
    writeUsers(users);
    return { ok: true };
  }

  /* ══════════════════════════════════════════════════════════════════
     3. 小工具
     ══════════════════════════════════════════════════════════════════ */
  const maskPhone = p => (p && p.length === 11) ? p.slice(0, 3) + '****' + p.slice(7) : (p || '未绑定手机');
  const initialOf = user => {
    const n = (user && user.username) ? user.username.trim() : '';
    return n ? n.charAt(0).toUpperCase() : '?';
  };
  const avatarOf = user => (user && user.avatar) ? user.avatar : '';

  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail })); } catch (e) { }
  }

  /* Toast：两端各有自己的提示条，这里做统一适配 */
  function toast(msg) {
    if (window.ICBCApp && typeof ICBCApp.toast === 'function') { ICBCApp.toast(msg); return; }
    const el = $('#pcToast');
    if (el) {
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => el.classList.remove('show'), 2200);
      return;
    }
    /* 兜底：自己造一个 */
    let t = $('#eaToastFallback');
    if (!t) {
      t = document.createElement('div');
      t.id = 'eaToastFallback';
      t.className = 'ea-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast._f);
    toast._f = setTimeout(() => t.classList.remove('on'), 2200);
  }

  /* ══════════════════════════════════════════════════════════════════
     4. 登录屏 DOM
     ══════════════════════════════════════════════════════════════════ */
  const isDesktop = () => !document.querySelector('.phone');

  const SCREEN_HTML = `
  <div class="ea-wrap">
    <!-- 品牌侧（手机上为顶部红头，PC 上为左侧大图栏） -->
    <aside class="ea-hero">
      <div class="ea-hero-deco" aria-hidden="true">
        <i class="d1"></i><i class="d2"></i><i class="d3"></i>
      </div>
      <div class="ea-hero-main">
        <div class="ea-quicklogo">工</div>
        <div class="ea-brandline">
          <b>中国工商银行</b>
          <span>个人手机银行 · 模拟演示版</span>
        </div>
        <div class="ea-xg">
          <b>e<em>次</em>元</b>
          <span>谷子经济 · 一站式金融服务</span>
        </div>
        <ul class="ea-feats">
          <li><i>🔍</i>识谷鉴真</li>
          <li><i>📈</i>智能估值</li>
          <li><i>🛡️</i>交易托管</li>
          <li><i>💳</i>谷卡分期</li>
        </ul>
      </div>
      <div class="ea-hero-foot">演示环境 · 不产生真实资金变动 · 账号仅存本机</div>
    </aside>

    <!-- 表单侧 -->
    <section class="ea-panel">
      <div class="ea-panel-in">
        <div class="ea-head">
          <h2 id="eaTitle">欢迎回来</h2>
          <p id="eaSubTitle">登录后体验完整 e次元 服务</p>
        </div>

        <div class="ea-steps" id="eaSteps" hidden>
          <i class="on"><em>1</em>输入用户名</i>
          <i><em>2</em>验证身份</i>
          <i><em>3</em>重设密码</i>
        </div>

        <div class="ea-tabs" id="eaTabs" role="tablist">
          <button type="button" class="ea-tab on" data-eatab="login" role="tab">登录</button>
          <button type="button" class="ea-tab" data-eatab="reg" role="tab">注册</button>
          <button type="button" class="ea-tab" data-eatab="forgot" role="tab">找回密码</button>
        </div>

        <!-- ───── 登录 ───── -->
        <div class="ea-pane on" data-eapane="login">
          <div class="ea-modes">
            <button type="button" class="ea-mode on" data-eamode="pwd">密码登录</button>
            <button type="button" class="ea-mode" data-eamode="code">验证码登录</button>
          </div>
          <form class="ea-form on" data-eaform="login-pwd" novalidate>
            <div class="ea-field">
              <i>👤</i>
              <input type="text" id="eaLoginUser" placeholder="用户名（昵称）" autocomplete="username" aria-label="用户名">
            </div>
            <div class="ea-field">
              <i>🔒</i>
              <input type="password" id="eaLoginPwd" placeholder="登录密码" autocomplete="current-password" aria-label="登录密码">
              <button type="button" class="ea-eye" data-eaeye aria-label="显示或隐藏密码">👁</button>
            </div>
            <button type="submit" class="ea-submit">登 录</button>
          </form>
          <form class="ea-form" data-eaform="login-code" novalidate>
            <div class="ea-field">
              <i>👤</i>
              <input type="text" id="eaCodeUser" placeholder="用户名（昵称）" aria-label="用户名">
            </div>
            <div class="ea-field ea-field--btn">
              <i>📱</i>
              <input type="text" id="eaCodeVal" placeholder="短信验证码" inputmode="numeric" maxlength="6" aria-label="短信验证码">
              <button type="button" class="ea-code-btn" id="eaLoginCodeBtn">获取验证码</button>
            </div>
            <button type="submit" class="ea-submit">登 录</button>
          </form>
        </div>

        <!-- ───── 注册 ───── -->
        <div class="ea-pane" data-eapane="reg">
          <form class="ea-form on" data-eaform="reg" novalidate>
            <div class="ea-field">
              <i>👤</i>
              <input type="text" id="eaRegUser" placeholder="用户名（昵称，2-16 字）" maxlength="16" aria-label="用户名">
            </div>
            <div class="ea-field">
              <i>📱</i>
              <input type="tel" id="eaRegPhone" placeholder="手机号码" inputmode="numeric" maxlength="11" aria-label="手机号码">
            </div>
            <div class="ea-field ea-field--btn">
              <i>✉️</i>
              <input type="text" id="eaRegCode" placeholder="短信验证码" inputmode="numeric" maxlength="6" aria-label="短信验证码">
              <button type="button" class="ea-code-btn" id="eaRegCodeBtn">获取验证码</button>
            </div>
            <div class="ea-field">
              <i>🔒</i>
              <input type="password" id="eaRegPwd" placeholder="设置密码（至少 6 位）" autocomplete="new-password" aria-label="设置密码">
              <button type="button" class="ea-eye" data-eaeye aria-label="显示或隐藏密码">👁</button>
            </div>
            <div class="ea-field">
              <i>🔑</i>
              <input type="password" id="eaRegPwd2" placeholder="确认密码" autocomplete="new-password" aria-label="确认密码">
            </div>
            <label class="ea-avatar">
              <span class="ea-avatar-box"><img id="eaRegAvatar" alt="头像预览"><em>＋</em></span>
              <span class="ea-avatar-txt">上传头像<em>选填 · 2MB 以内</em></span>
              <input type="file" id="eaRegAvatarInput" accept="image/*" hidden>
            </label>
            <button type="submit" class="ea-submit">注 册</button>
          </form>
        </div>

        <!-- ───── 找回密码（三步）───── -->
        <div class="ea-pane" data-eapane="forgot">
          <form class="ea-form on" data-eaform="fg-1" novalidate>
            <div class="ea-field">
              <i>👤</i>
              <input type="text" id="eaFgUser" placeholder="请输入你要找回的用户名" aria-label="用户名">
            </div>
            <button type="submit" class="ea-submit">下一步</button>
          </form>
          <form class="ea-form" data-eaform="fg-2" novalidate>
            <div class="ea-tip" id="eaFgHint">验证码将发送到你绑定的手机号</div>
            <div class="ea-modes">
              <button type="button" class="ea-mode on" data-eafmode="sms">短信验证</button>
              <button type="button" class="ea-mode" data-eafmode="pwd">旧密码验证</button>
            </div>
            <div class="ea-field ea-field--btn" data-eaf-sms>
              <i>📱</i>
              <input type="text" id="eaFgCode" placeholder="短信验证码" inputmode="numeric" maxlength="6" aria-label="短信验证码">
              <button type="button" class="ea-code-btn" id="eaFgCodeBtn">获取验证码</button>
            </div>
            <div class="ea-field" data-eaf-pwd hidden>
              <i>🔒</i>
              <input type="password" id="eaFgOldPwd" placeholder="原登录密码" aria-label="原登录密码">
            </div>
            <div class="ea-row2">
              <button type="button" class="ea-submit ghost" data-eaback="fg-1">上一步</button>
              <button type="submit" class="ea-submit">验 证</button>
            </div>
          </form>
          <form class="ea-form" data-eaform="fg-3" novalidate>
            <div class="ea-field">
              <i>🔒</i>
              <input type="password" id="eaFgNew" placeholder="新密码（至少 6 位）" autocomplete="new-password" aria-label="新密码">
              <button type="button" class="ea-eye" data-eaeye aria-label="显示或隐藏密码">👁</button>
            </div>
            <div class="ea-field">
              <i>🔑</i>
              <input type="password" id="eaFgNew2" placeholder="确认新密码" autocomplete="new-password" aria-label="确认新密码">
            </div>
            <div class="ea-row2">
              <button type="button" class="ea-submit ghost" data-eaback="fg-2">上一步</button>
              <button type="submit" class="ea-submit">重设密码</button>
            </div>
          </form>
        </div>

        <div class="ea-democode" id="eaDemoCode" hidden></div>

        <div class="ea-foot">
          <button type="button" class="ea-demo-login" id="eaDemoLogin">⚡ 一键体验演示账号</button>
          <button type="button" class="ea-guest" id="eaGuest">先随便逛逛（游客浏览）›</button>
        </div>

        <div class="ea-note">演示作品 · 账号数据仅保存在本机浏览器，不上传任何服务器</div>
      </div>
    </section>
  </div>`;

  let screen = null;          /* #eaScreen */
  let forgotUser = '';        /* 找回密码流程中的用户名 */
  let regAvatar = '';         /* 注册页已选头像（dataURL） */

  function buildScreen() {
    const el = document.createElement('div');
    el.className = 'ea-screen' + (isDesktop() ? ' ea-screen--desktop' : '');
    el.id = 'eaScreen';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = SCREEN_HTML;
    /* 手机上塞进手机壳内（被圆角裁切，像真机全屏页）；PC 上铺满窗口 */
    const host = isDesktop() ? document.body : document.querySelector('.phone');
    host.appendChild(el);
    return el;
  }

  /* ── 演示验证码：本地模式下直接把码摆出来，点一下自动填 ── */
  function showDemoCode(code) {
    const box = $('#eaDemoCode');
    if (!box) return;
    box.hidden = false;
    box.innerHTML = `演示环境 · 短信验证码 <b>${esc(code)}</b> <span>点此自动填入</span>`;
    box.onclick = () => {
      /* 当前可见面板里第一个空的验证码输入框 */
      const inputs = ['#eaCodeVal', '#eaRegCode', '#eaFgCode']
        .map(s => $(s)).filter(i => i && i.offsetParent !== null);
      if (inputs[0]) { inputs[0].value = code; inputs[0].focus(); toast('验证码已自动填入'); }
      else { toast('验证码：' + code); }
    };
    toast('验证码已生成：' + code);
  }
  function hideDemoCode() {
    const box = $('#eaDemoCode');
    if (box) { box.hidden = true; box.innerHTML = ''; }
  }

  /* 60 秒重发倒计时 */
  function countdown(btn, sec) {
    if (!btn) return;
    const raw = btn.textContent;
    let left = sec || 60;
    btn.disabled = true;
    btn.classList.add('wait');
    btn.textContent = left + 's 后重发';
    const t = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(t);
        btn.disabled = false;
        btn.classList.remove('wait');
        btn.textContent = raw;
      } else btn.textContent = left + 's 后重发';
    }, 1000);
  }

  /* ── 面板 / 步骤 切换 ── */
  const TITLES = {
    login: ['欢迎回来', '登录后体验完整 e次元 服务'],
    reg: ['开通账户', '一个账号，手机银行与 e次元 通用'],
    forgot: ['找回密码', '三步验证身份，重设你的登录密码']
  };

  function goTab(name) {
    $$('#eaTabs .ea-tab').forEach(b => b.classList.toggle('on', b.dataset.eatab === name));
    $$('#eaScreen .ea-pane').forEach(p => p.classList.toggle('on', p.dataset.eapane === name));
    const t = TITLES[name] || TITLES.login;
    $('#eaTitle').textContent = t[0];
    $('#eaSubTitle').textContent = t[1];
    $('#eaSteps').hidden = name !== 'forgot';
    if (name === 'forgot') goForgotStep(1);
    hideDemoCode();
  }

  function goForgotStep(n) {
    $$('#eaScreen [data-eaform^="fg-"]').forEach(f => {
      f.classList.toggle('on', f.dataset.eaform === 'fg-' + n);
    });
    $$('#eaSteps i').forEach((el, i) => el.classList.toggle('on', i < n));
  }

  function goLoginMode(mode) {
    $$('#eaScreen [data-eamode]').forEach(b => b.classList.toggle('on', b.dataset.eamode === mode));
    $$('#eaScreen [data-eaform^="login-"]').forEach(f => {
      f.classList.toggle('on', f.dataset.eaform === 'login-' + mode);
    });
    hideDemoCode();
  }

  /* ══════════════════════════════════════════════════════════════════
     5. 交互绑定
     ══════════════════════════════════════════════════════════════════ */
  function bindScreen() {
    /* Tab 切换 */
    $('#eaTabs').addEventListener('click', e => {
      const b = e.target.closest('.ea-tab');
      if (b) goTab(b.dataset.eatab);
    });

    /* 登录方式切换 */
    $$('#eaScreen [data-eamode]').forEach(b => b.addEventListener('click', () => goLoginMode(b.dataset.eamode)));

    /* 找回密码：方式切换 */
    $$('#eaScreen [data-eafmode]').forEach(b => b.addEventListener('click', () => {
      const sms = b.dataset.eafmode === 'sms';
      $$('#eaScreen [data-eafmode]').forEach(x => x.classList.toggle('on', x === b));
      $('[data-eaf-sms]').hidden = !sms;
      $('[data-eaf-pwd]').hidden = sms;
      hideDemoCode();
    }));

    /* 上一步 */
    $$('#eaScreen [data-eaback]').forEach(b => b.addEventListener('click', () => {
      goForgotStep(Number(b.dataset.eaback.split('-')[1]));
      hideDemoCode();
    }));

    /* 密码显隐统一交给 bindEyes()，这里不再重复绑定 */

    /* ── 密码登录 ── */
    $('#eaScreen [data-eaform="login-pwd"]').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#eaLoginUser').value.trim();
      const pwd = $('#eaLoginPwd').value;
      if (!name) { toast('请输入用户名'); $('#eaLoginUser').focus(); return; }
      if (!pwd) { toast('请输入登录密码'); $('#eaLoginPwd').focus(); return; }
      const r = login(name, pwd);
      if (!r.ok) { toast(r.reason); return; }
      onLoginSuccess(r.user);
    });

    /* ── 验证码登录 ── */
    $('#eaLoginCodeBtn').addEventListener('click', () => {
      const name = $('#eaCodeUser').value.trim();
      if (!name) { toast('请先输入用户名'); $('#eaCodeUser').focus(); return; }
      const u = findUser(name);
      if (!u) { toast('该用户名尚未注册'); return; }
      if (!u.phone) { toast('该账号未绑定手机号，请用密码登录'); return; }
      sendCode(u.phone, 'login').then(r => {
        if (r.ok) countdown($('#eaLoginCodeBtn'));
        else toast(r.reason);
      });
    });
    $('#eaScreen [data-eaform="login-code"]').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#eaCodeUser').value.trim();
      const code = $('#eaCodeVal').value.trim();
      if (!name) { toast('请输入用户名'); return; }
      if (!code) { toast('请输入短信验证码'); $('#eaCodeVal').focus(); return; }
      const u = findUser(name);
      if (!u) { toast('用户不存在'); return; }
      if (!u.phone) { toast('该账号未绑定手机号，请用密码登录'); return; }
      verifyCode(u.phone, code, 'login').then(v => {
        if (!v.ok) { toast(v.reason); return; }
        const r = loginByUser(u);
        if (!r.ok) { toast(r.reason); return; }
        onLoginSuccess(r.user);
      });
    });

    /* ── 注册 ── */
    $('#eaRegCodeBtn').addEventListener('click', () => {
      const name = $('#eaRegUser').value.trim();
      const phone = $('#eaRegPhone').value.trim();
      if (!name) { toast('请先输入用户名'); $('#eaRegUser').focus(); return; }
      if (!RE_PHONE.test(phone)) { toast('请输入正确的手机号码'); $('#eaRegPhone').focus(); return; }
      if (findUser(name)) { toast('该用户名已被占用，请换一个'); return; }
      sendCode(phone, 'reg').then(r => {
        if (r.ok) countdown($('#eaRegCodeBtn'));
        else toast(r.reason);
      });
    });

    $('#eaRegAvatarInput').addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) { toast('请选择图片文件'); return; }
      if (file.size > 2 * 1024 * 1024) { toast('头像不能超过 2MB'); return; }
      const fr = new FileReader();
      fr.onload = ev => {
        regAvatar = ev.target.result;
        const img = $('#eaRegAvatar');
        img.src = regAvatar;
        img.parentElement.classList.add('has');
      };
      fr.readAsDataURL(file);
      e.target.value = '';
    });

    $('#eaScreen [data-eaform="reg"]').addEventListener('submit', e => {
      e.preventDefault();
      const username = $('#eaRegUser').value.trim();
      const phone = $('#eaRegPhone').value.trim();
      const code = $('#eaRegCode').value.trim();
      const pwd = $('#eaRegPwd').value;
      const pwd2 = $('#eaRegPwd2').value;

      if (!username) { toast('请输入用户名'); $('#eaRegUser').focus(); return; }
      if (username.length < 2) { toast('用户名至少 2 个字符'); return; }
      if (!RE_PHONE.test(phone)) { toast('请输入正确的手机号码'); $('#eaRegPhone').focus(); return; }
      if (!code) { toast('请输入短信验证码'); $('#eaRegCode').focus(); return; }
      if (pwd.length < MIN_PWD) { toast(`密码至少 ${MIN_PWD} 位`); $('#eaRegPwd').focus(); return; }
      if (pwd !== pwd2) { toast('两次输入的密码不一致'); $('#eaRegPwd2').focus(); return; }
      if (findUser(username)) { toast('该用户名已被占用，请换一个'); return; }

      verifyCode(phone, code, 'reg').then(v => {
        if (!v.ok) { toast(v.reason); return; }
        const r = register({ username, phone, password: pwd, avatar: regAvatar });
        if (!r.ok) { toast(r.reason); return; }
        toast('注册成功，欢迎加入 e次元！');
        const lr = loginByUser(findUser(username));
        if (lr.ok) onLoginSuccess(lr.user);
      });
    });

    /* ── 找回密码 ── */
    $('#eaScreen [data-eaform="fg-1"]').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#eaFgUser').value.trim();
      if (!name) { toast('请输入用户名'); return; }
      const u = findUser(name);
      if (!u) { toast('该用户名不存在'); return; }
      forgotUser = name;
      $('#eaFgHint').innerHTML = `验证码将发送到绑定手机 <b>${esc(maskPhone(u.phone))}</b>`;
      goForgotStep(2);
      hideDemoCode();
    });

    $('#eaFgCodeBtn').addEventListener('click', () => {
      const u = findUser(forgotUser);
      if (!u) { toast('请先输入用户名'); goForgotStep(1); return; }
      if (!u.phone) { toast('该账号未绑定手机号，请改用「旧密码验证」'); return; }
      sendCode(u.phone, 'forgot').then(r => {
        if (r.ok) countdown($('#eaFgCodeBtn'));
        else toast(r.reason);
      });
    });

    $('#eaScreen [data-eaform="fg-2"]').addEventListener('submit', e => {
      e.preventDefault();
      const u = findUser(forgotUser);
      if (!u) { toast('会话已过期，请重新开始'); goForgotStep(1); return; }
      const useSms = $('[data-eafmode].on').dataset.eafmode === 'sms';
      if (useSms) {
        if (!u.phone) { toast('该账号未绑定手机号，请改用「旧密码验证」'); return; }
        const code = $('#eaFgCode').value.trim();
        if (!code) { toast('请输入短信验证码'); return; }
        verifyCode(u.phone, code, 'forgot').then(v => {
          if (!v.ok) { toast(v.reason); return; }
          goForgotStep(3);
          hideDemoCode();
        });
      } else {
        const old = $('#eaFgOldPwd').value;
        if (!old) { toast('请输入原登录密码'); return; }
        if (hashPwd(u.salt, String(old)) !== u.hash) { toast('原密码错误'); return; }
        goForgotStep(3);
        hideDemoCode();
      }
    });

    $('#eaScreen [data-eaform="fg-3"]').addEventListener('submit', e => {
      e.preventDefault();
      const p1 = $('#eaFgNew').value, p2 = $('#eaFgNew2').value;
      if (p1.length < MIN_PWD) { toast(`新密码至少 ${MIN_PWD} 位`); return; }
      if (p1 !== p2) { toast('两次输入的新密码不一致'); return; }
      const r = resetPassword(forgotUser, p1);
      if (!r.ok) { toast(r.reason); return; }
      toast('密码已重设，请用新密码登录');
      $('#eaLoginUser').value = forgotUser;
      $('#eaLoginPwd').value = '';
      goTab('login');
      goLoginMode('pwd');
    });

    /* ── 一键体验 / 游客 ── */
    $('#eaDemoLogin').addEventListener('click', () => {
      const DEMO = { username: '谷子星人', phone: '13800138000', password: 'e-times2026' };
      if (!findUser(DEMO.username)) {
        const r = register(DEMO);
        if (!r.ok && !findUser(DEMO.username)) { toast(r.reason); return; }
      }
      const lr = login(DEMO.username, DEMO.password);
      if (!lr.ok) { toast(lr.reason); return; }
      toast('已用演示账号登录，欢迎体验');
      onLoginSuccess(lr.user);
    });
    $('#eaGuest').addEventListener('click', () => {
      try { sessionStorage.setItem(KEY_GUEST, '1'); } catch (e) { }
      hide();
      toast('游客模式：可自由浏览，涉及资金的操作为你保留登录入口');
    });

    /* 回车不刷新（表单里已是 submit，这里兜住裸 input 的 Enter） */
    $$('#eaScreen input').forEach(i => i.addEventListener('keydown', e => {
      if (e.key === 'Enter' && i.closest('form')) { /* 交给 form submit */ }
    }));
  }

  /* ══════════════════════════════════════════════════════════════════
     6. 登录屏显隐
     ══════════════════════════════════════════════════════════════════ */
  function show(tab) {
    if (!screen) return;
    screen.classList.add('on');
    screen.removeAttribute('aria-hidden');
    document.body.classList.add('ea-locked');
    if (tab) goTab(tab);
    /* 打开时聚焦第一个能填的框，键盘体验更像原生 App */
    setTimeout(() => {
      const first = $('#eaScreen .ea-pane.on .ea-form.on input:not([type=file]):not([disabled])');
      if (first && !isDesktop()) { /* 手机端不自动弹键盘，避免遮挡 */ }
      else if (first) first.focus();
    }, 320);
  }
  function hide() {
    if (!screen) return;
    screen.classList.remove('on');
    screen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ea-locked');
    hideDemoCode();
  }

  function onLoginSuccess(user) {
    hide();
    regAvatar = '';
    toast('欢迎回来，' + user.username);
    /* 手机端：把用户送回「我的」页；PC 端不做跳转 */
    if (!isDesktop()) {
      const tab = $('.tab-item[data-tab="view-mine"]');
      if (tab) tab.click();
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     7. 账户设置面板（改头像 / 昵称 / 手机 / 密码 / 安全 / 关于）
     ══════════════════════════════════════════════════════════════════ */
  const SHEET_HTML = `
  <div class="ea-sheet" id="eaSheet" aria-hidden="true">
    <div class="ea-sheet-card">
      <header class="ea-sheet-top">
        <button type="button" class="ea-sheet-back" id="eaSheetBack" aria-label="返回">‹</button>
        <span id="eaSheetTitle">账户与安全</span>
        <button type="button" class="ea-sheet-x" id="eaSheetClose" aria-label="关闭">✕</button>
      </header>

      <div class="ea-sheet-body" id="eaSheetBody"></div>

      <footer class="ea-sheet-foot">
        <button type="button" class="ea-logout" id="eaSheetLogout">退出登录</button>
      </footer>
    </div>
  </div>`;

  let sheet = null;

  function buildSheet() {
    const el = document.createElement('div');
    el.innerHTML = SHEET_HTML;
    const node = el.firstElementChild;
    /* 手机上从底部滑入、相对手机壳定位；PC 上居中弹出、相对窗口定位 */
    if (isDesktop()) node.classList.add('ea-sheet--desktop');
    const host = isDesktop() ? document.body : document.querySelector('.phone');
    host.appendChild(node);
    return node;
  }

  const viewHome = user => `
    <div class="ea-id">
      <span class="ea-id-ava">
        ${user.avatar ? `<img src="${esc(user.avatar)}" alt="">` : esc(initialOf(user))}
      </span>
      <span class="ea-id-txt">
        <b>${esc(user.username)}</b>
        <em>${esc(maskPhone(user.phone))} · 财富级</em>
      </span>
    </div>
    <div class="ea-menu">
      <button type="button" data-eaact="avatar"><i>🖼</i>修改头像<em>›</em></button>
      <button type="button" data-eaact="name"><i>✏️</i>修改昵称<em>${esc(user.username)}</em></button>
      <button type="button" data-eaact="phone"><i>📱</i>修改手机号<em>${esc(maskPhone(user.phone))}</em></button>
      <button type="button" data-eaact="pwd"><i>🔑</i>修改密码<em>›</em></button>
      <button type="button" data-eaact="safe"><i>🛡️</i>账户安全<em>›</em></button>
      <button type="button" data-eaact="about"><i>ℹ️</i>关于本站<em>›</em></button>
    </div>
    <p class="ea-sheet-note">账号数据仅保存在本机浏览器（localStorage），换设备或清理浏览器数据后需重新注册。</p>`;

  const viewEdit = (title, inner) => `
    <section class="ea-edit">
      <h3>${title}</h3>
      ${inner}
    </section>`;

  function openSheet(view, arg) {
    const me = current();
    if (!me) { toast('请先登录'); show(); return; }
    /* 面板是懒创建的：第一次打开时才建 DOM，紧接着绑事件 */
    if (!sheet) { sheet = buildSheet(); bindSheet(); }
    sheet.classList.add('on');
    sheet.removeAttribute('aria-hidden');
    document.body.classList.add('ea-locked');
    renderSheet(view || 'home', arg);
  }
  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('on');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ea-locked');
  }

  function renderSheet(view, arg) {
    const me = current();
    if (!me) { closeSheet(); return; }
    const body = $('#eaSheetBody');
    const back = $('#eaSheetBack');
    back.style.visibility = view === 'home' ? 'hidden' : 'visible';
    $('#eaSheetTitle').textContent = {
      home: '账户与安全', avatar: '修改头像', name: '修改昵称',
      phone: '修改手机号', pwd: '修改密码', safe: '账户安全', about: '关于本站'
    }[view] || '账户与安全';

    if (view === 'home') { body.innerHTML = viewHome(me); return; }

    if (view === 'avatar') {
      body.innerHTML = viewEdit('修改头像', `
        <div class="ea-id" style="margin-bottom:14px">
          <span class="ea-id-ava" id="eaAvatarPreview">
            ${me.avatar ? `<img src="${esc(me.avatar)}" alt="">` : esc(initialOf(me))}
          </span>
          <span class="ea-id-txt"><b>${esc(me.username)}</b><em>建议使用正方形图片，2MB 以内</em></span>
        </div>
        <label class="ea-upload"><input type="file" id="eaAvatarPick" accept="image/*" hidden>选择本地图片</label>
        <button type="button" class="ea-submit" id="eaAvatarSave">保存头像</button>
        ${me.avatar ? '<button type="button" class="ea-submit ghost" id="eaAvatarClear">恢复默认头像</button>' : ''}`);
      let picked = null;
      $('#eaAvatarPick').addEventListener('change', e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        if (!/^image\//.test(f.type)) { toast('请选择图片文件'); return; }
        if (f.size > 2 * 1024 * 1024) { toast('头像不能超过 2MB'); return; }
        const fr = new FileReader();
        fr.onload = ev => {
          picked = ev.target.result;
          $('#eaAvatarPreview').innerHTML = `<img src="${picked}" alt="">`;
        };
        fr.readAsDataURL(f);
      });
      $('#eaAvatarSave').addEventListener('click', () => {
        if (!picked) { toast('请先选择一张图片'); return; }
        const r = updateProfile({ avatar: picked });
        toast(r.ok ? '头像已更新' : r.reason);
        if (r.ok) renderSheet('home');
      });
      const clr = $('#eaAvatarClear');
      if (clr) clr.addEventListener('click', () => {
        const r = updateProfile({ avatar: '' });
        toast(r.ok ? '已恢复默认头像' : r.reason);
        if (r.ok) renderSheet('home');
      });
      return;
    }

    if (view === 'name') {
      body.innerHTML = viewEdit('修改昵称', `
        <div class="ea-field"><i>👤</i><input type="text" id="eaNewName" maxlength="16" value="${esc(me.username)}" placeholder="新的昵称" aria-label="新的昵称"></div>
        <p class="ea-sheet-note">昵称即登录用户名，修改后请用新昵称登录。</p>
        <button type="button" class="ea-submit" id="eaNameSave">保存昵称</button>`);
      $('#eaNameSave').addEventListener('click', () => {
        const v = $('#eaNewName').value.trim();
        if (v === me.username) { toast('昵称没有变化'); return; }
        const r = updateProfile({ username: v });
        toast(r.ok ? '昵称已更新为「' + v + '」' : r.reason);
        if (r.ok) renderSheet('home');
      });
      return;
    }

    if (view === 'phone') {
      body.innerHTML = viewEdit('修改手机号', `
        <div class="ea-field"><i>📱</i><input type="tel" id="eaNewPhone" maxlength="11" inputmode="numeric" value="${esc(me.phone)}" placeholder="11 位手机号" aria-label="新的手机号"></div>
        <p class="ea-sheet-note">手机号用于验证码登录与找回密码，请填写真实可用的号码。</p>
        <button type="button" class="ea-submit" id="eaPhoneSave">保存手机号</button>`);
      $('#eaPhoneSave').addEventListener('click', () => {
        const v = $('#eaNewPhone').value.trim();
        const r = updateProfile({ phone: v });
        toast(r.ok ? '手机号已更新为 ' + maskPhone(v) : r.reason);
        if (r.ok) renderSheet('home');
      });
      return;
    }

    if (view === 'pwd') {
      body.innerHTML = viewEdit('修改密码', `
        <div class="ea-field"><i>🔒</i><input type="password" id="eaPwdOld" placeholder="当前密码" aria-label="当前密码"><button type="button" class="ea-eye" data-eaeye>👁</button></div>
        <div class="ea-field"><i>🔑</i><input type="password" id="eaPwdNew" placeholder="新密码（至少 6 位）" aria-label="新密码"></div>
        <div class="ea-field"><i>🔑</i><input type="password" id="eaPwdNew2" placeholder="确认新密码" aria-label="确认新密码"></div>
        <button type="button" class="ea-submit" id="eaPwdSave">确认修改</button>`);
      bindEyes(body);
      $('#eaPwdSave').addEventListener('click', () => {
        const o = $('#eaPwdOld').value, n = $('#eaPwdNew').value, n2 = $('#eaPwdNew2').value;
        if (n !== n2) { toast('两次输入的新密码不一致'); return; }
        const r = changePassword(o, n);
        toast(r.ok ? '密码修改成功，下次请使用新密码登录' : r.reason);
        if (r.ok) renderSheet('home');
      });
      return;
    }

    if (view === 'safe') {
      const pwdLevel = (me.username && me.phone) ? '良好' : '一般';
      body.innerHTML = `
        <div class="ea-safe">
          <div class="ea-safe-row"><span>账号昵称</span><b>${esc(me.username)}</b></div>
          <div class="ea-safe-row"><span>绑定手机</span><b>${esc(maskPhone(me.phone))}</b></div>
          <div class="ea-safe-row"><span>登录状态</span><b class="ok">已登录</b></div>
          <div class="ea-safe-row"><span>密码存储</span><b class="ok">加盐摘要</b></div>
          <div class="ea-safe-row"><span>数据位置</span><b>本机浏览器</b></div>
          <div class="ea-safe-row"><span>安全等级</span><b class="ok">${pwdLevel}</b></div>
        </div>
        <div class="ea-tips">
          <b>安全建议</b>
          <p>· 使用 8 位以上、含字母与数字的密码<br>
             · 绑定手机号，便于验证码登录与找回密码<br>
             · 不要在公共电脑上保持登录状态</p>
        </div>`;
      return;
    }

    /* about */
    body.innerHTML = `
      <div class="ea-about">
        <div class="ea-about-logo">工</div>
        <h3>中国工商银行 · 手机银行（模拟演示版）</h3>
        <p class="ea-about-sub">e次元 e-times · 第 17 届「工行杯」全国大学生金融科技创新大赛参赛作品</p>
        <div class="ea-safe">
          <div class="ea-safe-row"><span>系统版本</span><b>v9.0.0 · 登录系统 v1.0</b></div>
          <div class="ea-safe-row"><span>技术栈</span><b>HTML + CSS + 原生 JS</b></div>
          <div class="ea-safe-row"><span>账号体系</span><b>本地 localStorage</b></div>
          <div class="ea-safe-row"><span>后端依赖</span><b>无（纯静态）</b></div>
          <div class="ea-safe-row"><span>作者</span><b>何镕辉</b></div>
        </div>
        <div class="ea-tips">
          <b>免责声明</b>
          <p>本应用为大学生学科竞赛的教学演示作品，界面中的银行名称与视觉元素仅用于演示场景，
             与任何金融机构无隶属、合作或代理关系，不构成任何金融产品或服务。
             所有账号数据仅保存在本机浏览器，不会上传到任何服务器。</p>
        </div>
      </div>`;
  }

  function bindEyes(root) {
    $$('[data-eaeye]', root || document).forEach(b => {
      if (b._eaBound) return;
      b._eaBound = true;
      b.addEventListener('click', () => {
        const input = b.parentElement.querySelector('input');
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        b.textContent = show ? '🙈' : '👁';
      });
    });
  }

  function bindSheet() {
    $('#eaSheetClose').addEventListener('click', closeSheet);
    $('#eaSheetBack').addEventListener('click', () => renderSheet('home'));
    $('#eaSheetBody').addEventListener('click', e => {
      const b = e.target.closest('[data-eaact]');
      if (b) renderSheet(b.dataset.eaact);
    });
    $('#eaSheetLogout').addEventListener('click', () => {
      closeSheet();
      logout();
      show();
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     8. 页面集成：把登录状态画进两端界面
     ══════════════════════════════════════════════════════════════════ */
  const DEFAULT_AVA = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6453c"/><stop offset="1" stop-color="#9d0008"/></linearGradient></defs><rect width="80" height="80" rx="40" fill="url(#g)"/><circle cx="40" cy="32" r="13" fill="rgba(255,255,255,.92)"/><ellipse cx="40" cy="66" rx="20" ry="15" fill="rgba(255,255,255,.92)"/></svg>');

  function paintMobile(user) {
    if (isDesktop()) return;

    /* 「我的」页头部 */
    const ava = $('#mineAvatar');
    const name = $('#mineName');
    if (ava) {
      if (user && user.avatar) {
        ava.innerHTML = `<img src="${esc(user.avatar)}" alt="">`;
        ava.classList.add('ea-has-img');
      } else {
        ava.textContent = user ? initialOf(user) : '?';
        ava.classList.remove('ea-has-img');
      }
    }
    if (name) {
      if (user) {
        name.innerHTML = esc(user.username) + ' <span class="mine-level">财富级</span>';
      } else {
        name.innerHTML = '未登录 <span class="mine-level">点击登录 / 注册</span>';
      }
    }

    /* 「我的」页顶部的登录引导条（未登录时才出现） */
    const mineBody = $('#view-mine .home-body');
    let bar = $('#eaMineBar');
    if (mineBody && !user) {
      if (!bar) {
        bar = document.createElement('button');
        bar.type = 'button';
        bar.id = 'eaMineBar';
        bar.className = 'ea-mine-bar';
        bar.innerHTML = '<span><b>你还在游客浏览</b><em>登录后可用完整 e次元 服务</em></span><i>去登录 ›</i>';
        bar.addEventListener('click', () => show());
        mineBody.insertBefore(bar, mineBody.firstChild);
      }
      bar.hidden = false;
    } else if (bar) {
      bar.hidden = true;
    }

    /* 「我的」页里的退出登录按钮 —— 有身份时真的可用 */
    const out = $('#view-mine .logout-btn');
    if (out) {
      if (user) {
        out.removeAttribute('data-toast');
        out.textContent = '退出登录';
        out.disabled = false;
      } else {
        out.removeAttribute('data-toast');
        out.textContent = '登录 / 注册';
      }
    }
  }

  function paintDesktop(user) {
    /* 网银壳右上角 */
    const bkName = $('.bk-user span:not(.bk-ava)');
    if (bkName) bkName.textContent = user ? user.username + ' · 财富级' : '未登录 · 请登录';
    const bkAva = $('.bk-ava img');
    if (bkAva) bkAva.src = (user && user.avatar) ? user.avatar : DEFAULT_AVA;
    const bkOut = $('#eaPcLogout') || $('.bk-right a[href="javascript:;"]');
    if (bkOut) {
      /* 去掉"演示环境不做真实登出"的假提示，改成真实登出 */
      bkOut.removeAttribute('data-pctoast');
      bkOut.textContent = user ? '退出' : '登录';
    }
    /* e次元工作台右上角 */
    const nm = $('.ec-me .nm');
    if (nm) {
      const tail = nm.querySelector('i');
      const tailHTML = tail ? ' ' + tail.outerHTML : '';
      nm.innerHTML = (user ? esc(user.username) : '未登录') + tailHTML;
    }
    const ecAva = $('.ec-me .av img');
    if (ecAva) ecAva.src = (user && user.avatar) ? user.avatar : DEFAULT_AVA;
  }

  function paint() {
    const u = current();
    paintMobile(u);
    paintDesktop(u);
  }

  /* ── 需要登录才能做的事：用捕获阶段拦截，不动 app.js / pc.js 的原绑定 ── */
  function guard(selector, tip) {
    document.addEventListener('click', e => {
      const hit = e.target.closest(selector);
      if (!hit) return;
      if (isLoggedIn()) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toast(tip || '该操作需要登录后使用');
      show();
    }, true);   /* ← capture：先于目标元素上的监听器执行 */
  }

  /* ══════════════════════════════════════════════════════════════════
     9. 启动
     ══════════════════════════════════════════════════════════════════ */
  function boot() {
    screen = buildScreen();
    bindScreen();
    bindEyes(document);

    /* 拦截：转账涉及资金，需要身份。其余浏览与 e次元 体验保持自由 ——
       作品演示不能被登录墙挡住，所以只在真正涉及资金的动作上设卡。 */
    guard('#transferBtn', '转账汇款需要先登录账户');

    /* 「我的」页头部：未登录 → 弹登录屏；已登录 → 打开账户与安全 */
    const mineUser = $('.mine-user');
    if (mineUser) {
      mineUser.style.cursor = 'pointer';
      mineUser.addEventListener('click', () => {
        if (isLoggedIn()) openSheet('home');
        else show();
      });
    }
    /* 「我的」页退出登录按钮 */
    const outBtn = $('#view-mine .logout-btn');
    if (outBtn) {
      outBtn.addEventListener('click', () => {
        if (isLoggedIn()) { logout(); show(); }
        else show();
      });
    }
    /* PC 端：网银壳的「退出 / 登录」 */
    const bkOut = $('#eaPcLogout') || $('.bk-right a[href="javascript:;"]');
    if (bkOut) {
      bkOut.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (isLoggedIn()) { logout(); show(); }
        else show();
      }, true);
    }

    /* 状态变化时重绘两端界面 */
    document.addEventListener('ecauth:change', () => paint());

    /* 首次进入：已登录直接放行；未登录 / 游客 → 弹登录屏 */
    paint();
    if (!isLoggedIn() && !isGuest()) {
      /* 等闪屏走完再露脸，避免闪一下（手机端 splash 1.25s，PC 端立即） */
      if (isDesktop()) show();
      else setTimeout(() => { if (!isLoggedIn() && !isGuest()) show(); }, 1300);
    }

    /* 手机端：闪屏结束后如果还没登录，兜一次（防止首帧计时被节流） */
    window.addEventListener('pageshow', () => { paint(); });
  }

  /* ══════════════════════════════════════════════════════════════════
     10. 对外 API
     ══════════════════════════════════════════════════════════════════ */
  window.ECAUTH = {
    /* 核心 */
    register, login, loginByUser, sendCode, verifyCode, resetPassword,
    findUser, current, isLoggedIn, isGuest, logout,
    updateProfile, changePassword,
    /* 工具 */
    maskPhone, initialOf, avatarOf, sha256,
    /* UI */
    show, hide, openAccount: () => openSheet('home'), closeAccount: closeSheet,
    paint
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
