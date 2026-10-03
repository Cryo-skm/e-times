/* ════════════════════════════════════════════════════════════════════
   a11y · 无障碍增强层（移动端 / PC 端共用）
   ─────────────────────────────────────────────────────────────────────
   评审实测：全站只有 1 个 aria-label，弹窗没有 role="dialog"、不支持 Esc 关闭，
   div/span 做成的「按钮」键盘根本走不到，被抹掉 outline 后键盘用户看不到焦点。

   本文件做四件事（全部是「补齐」，不改任何既有交互）：
     1) 键盘可达：把带点击语义的 div/span 补成 role="button" + tabindex="0"，
        并让 Enter / Space 能真正触发它；
     2) Esc 关闭：按层级从内到外关掉 登录屏的账户抽屉 → e次元弹层 → PC 弹窗
        → 业务页 → 覆盖页；
     3) 焦点可见：本文件不含样式，焦点环定义在 css 里（:focus-visible）；
     4) 兜底 alt：动态插入的 <img> 若没写 alt，自动补空 alt（装饰性图片），
        用 MutationObserver 持续监听。

   与登录系统（js/auth.js）的衔接：
     登录屏 .ea-screen 与账户抽屉 .ea-sheet 是后加进来的全屏模态，本层负责
     把它们的 dialog 语义、背景 aria-hidden、焦点进入与焦点陷阱补齐 ——
     登录屏内的按钮原本就是原生 <button>，键盘可达性已经没问题。
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* 带交互语义、但自身不是原生控件的选择器 */
  const CLICKABLE = [
    '[data-open]', '[data-close]', '[data-ec]', '[data-ec-go]', '[data-tab-jump]',
    '[data-pcpage]', '[data-ecd]', '[data-toast]', '[data-pctoast]', '[data-pcgood]',
    '[data-pcpref]', '[data-pcroom]', '[data-pccat]', '[data-pcval]', '[data-ec-goods]',
    '[data-tab-card]', '[data-bz-go]'
  ].join(',');
  const NATIVE = 'a,button,input,select,textarea,summary';

  /* ── 1. 键盘可达 ── */
  function makeFocusable(root) {
    root = root || document;
    let n = 0;
    root.querySelectorAll(CLICKABLE).forEach(el => {
      if (el.matches(NATIVE)) return;
      if (el.hasAttribute('tabindex')) return;
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      n++;
    });
    return n;
  }

  /* Enter / Space 触发 role=button 的伪按钮（原生控件自己会处理，跳过） */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const el = document.activeElement;
    if (!el || el.matches(NATIVE)) return;
    if (el.getAttribute('role') !== 'button') return;
    e.preventDefault();
    el.click();
  }, true);

  /* ── 2. Esc 逐层关闭 ── */
  function escClose() {
    /* ⓪ 登录屏的账户抽屉（.ea-sheet）—— 最内层，优先关它。
         登录屏本身是「闸门」，不响应 Esc：随手一按就溜进游客态会让人莫名其妙，
         想跳过请走屏上的「先随便逛逛（游客浏览）」。 */
    const sh = document.querySelector('.ea-sheet.on');
    if (sh) {
      if (window.ECAUTH && ECAUTH.closeAccount) { try { ECAUTH.closeAccount(); return true; } catch (e) {} }
      sh.classList.remove('on'); sh.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('ea-locked');
      return true;
    }
    /* ① e次元 弹层 */
    if (window.XZG && XZG.sheetClose &&
        document.querySelector('#xzgMask.on, .xzg-mask.on')) {
      try { XZG.sheetClose(); return true; } catch (e) {}
    }
    /* ② PC 弹窗 */
    const pm = document.getElementById('pcMask');
    if (pm && pm.classList.contains('on')) {
      if (window.PCAPP && PCAPP.closeModal) PCAPP.closeModal();
      else pm.classList.remove('on');
      return true;
    }
    /* ③ 业务页栈（工行壳子里的 126 个业务页） */
    if (window.BANK && BANK.stack && BANK.stack().length) {
      try { BANK.back(); return true; } catch (e) {}
    }
    /* ④ 覆盖页浮层 */
    const ov = document.querySelector('.overlay-page.open');
    if (ov && ov.id && window.ICBCApp) {
      try { ICBCApp.closePage(ov.id); return true; } catch (e) {}
    }
    return false;
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (escClose()) e.preventDefault();
  });

  /* ── 4. 兜底 alt（装饰性图片给空 alt，而不是完全没有 alt） ── */
  function fixAlt(root) {
    (root || document).querySelectorAll('img:not([alt])').forEach(img => {
      img.setAttribute('alt', '');
      img.setAttribute('aria-hidden', 'true');
    });
  }

  /* 弹层打开时补 aria-hidden：让读屏器只读当前这一层 */
  function syncOverlayAria() {
    const tops = document.querySelectorAll('.overlay-page');
    tops.forEach(el => {
      const open = el.classList.contains('open');
      /* 打开的那层可读，其余层对读屏器隐藏 */
      if (open) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', 'true');
    });
  }

  /* ── 登录屏 / 账户抽屉：补 dialog 语义 + 背景隐藏 + 焦点进入与陷阱 ── */
  const isOn = el => !!(el && el.classList && el.classList.contains('on'));

  function markDialog(el, labelledBy, fallback) {
    if (!el) return;
    if (el.getAttribute('role') !== 'dialog') el.setAttribute('role', 'dialog');
    if (el.getAttribute('aria-modal') !== 'true') el.setAttribute('aria-modal', 'true');
    const t = labelledBy && document.getElementById(labelledBy);
    if (t) {
      if (el.getAttribute('aria-labelledby') !== labelledBy) el.setAttribute('aria-labelledby', labelledBy);
      el.removeAttribute('aria-label');
    } else if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      el.setAttribute('aria-label', fallback);
    }
  }

  /* 模态打开时，把同一个父容器里的其它兄弟对读屏器隐藏（可逆） */
  function hideSiblings(el, on) {
    if (!el || !el.parentNode) return;
    Array.prototype.forEach.call(el.parentNode.children, n => {
      if (n === el) return;
      if (on) {
        if (!n.hasAttribute('data-a11y-prev')) n.setAttribute('data-a11y-prev', n.getAttribute('aria-hidden') || '');
        n.setAttribute('aria-hidden', 'true');
      } else if (n.hasAttribute('data-a11y-prev')) {
        const prev = n.getAttribute('data-a11y-prev');
        if (prev === '') n.removeAttribute('aria-hidden'); else n.setAttribute('aria-hidden', prev);
        n.removeAttribute('data-a11y-prev');
      }
    });
  }

  /* 当前处于最上层的模态（账户抽屉 > 登录屏 > 无） */
  function activeModal() {
    const sh = document.querySelector('.ea-sheet.on');
    if (sh) return sh;
    const scr = document.getElementById('eaScreen');
    return isOn(scr) ? scr : null;
  }

  function syncAuthAria() {
    const scr = document.getElementById('eaScreen');
    const sheet = document.querySelector('.ea-sheet');
    if (!scr && !sheet) return false;
    markDialog(scr, 'eaTitle', '登录');
    markDialog(sheet, 'eaSheetTitle', '账户与安全');

    const scrOn = isOn(scr), shOn = isOn(sheet);
    /* 先抽屉后登录屏：让登录屏那一层的结论最后落地 */
    hideSiblings(sheet, shOn);
    hideSiblings(scr, scrOn);
    /* 抽屉在登录屏之上：抽屉开着时登录屏本身也不该被读 */
    if (scr) {
      if (shOn) scr.setAttribute('aria-hidden', 'true');
      else if (scrOn) scr.removeAttribute('aria-hidden');
    }
    return scrOn || shOn;
  }

  /* 可聚焦元素（排除不可见与 tabindex=-1） */
  function focusables(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])'),
      el => el.offsetParent !== null
    );
  }

  /* 模态刚打开时把焦点请进去；聚焦容器本身（不聚焦输入框），手机上不会弹键盘 */
  function focusInto(m) {
    if (!m || m.contains(document.activeElement)) return;
    if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1');
    try { m.focus({ preventScroll: true }); } catch (e) { try { m.focus(); } catch (e2) { } }
  }

  /* 焦点陷阱：模态开着时 Tab 只在模态内循环 */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const m = activeModal();
    if (!m) return;
    const list = focusables(m);
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1];
    const inside = m.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
  }, true);

  /* ── 5. 可访问名兜底：图标按钮若有 title / data-aria，就补成 aria-label ── */
  function fixNames(root) {
    let n = 0;
    (root || document).querySelectorAll('button,a').forEach(el => {
      if (el.getAttribute('aria-label')) return;
      /* 已经有可见文字的不动 —— 读屏器读得到 */
      if ((el.textContent || '').replace(/\s+/g, '')) return;
      const name = el.getAttribute('title') || el.dataset.aria;
      if (!name) return;
      el.setAttribute('aria-label', name);
      n++;
    });
    return n;
  }

  function boot() {
    makeFocusable(document);
    fixAlt(document);
    fixNames(document);
    syncOverlayAria();
    syncAuthAria();

    /* 动态渲染的内容（业务页 / e次元 子页 / 弹层 / 登录屏）持续补齐 */
    if (window.MutationObserver) {
      let t = null;
      const mo = new MutationObserver(muts => {
        clearTimeout(t);
        t = setTimeout(() => {
          let dirty = false, modalToggled = false;
          for (const m of muts) {
            if (m.addedNodes && m.addedNodes.length) { dirty = true; }
            if (m.type === 'attributes' && m.target) {
              const tid = m.target.id;
              if (tid === 'eaScreen' || (m.target.classList && m.target.classList.contains('ea-sheet'))) modalToggled = true;
            }
          }
          if (dirty) { makeFocusable(document); fixAlt(document); fixNames(document); }
          if (dirty || modalToggled) {
            if (modalToggled) syncOverlayAria();
            if (syncAuthAria()) focusInto(activeModal());
          }
        }, 160);
      });
      mo.observe(document.body, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ['class']
      });
    }
  }

  /* 供审计脚本/调试查看 */
  window.A11Y = { makeFocusable, fixAlt, fixNames, escClose, syncOverlayAria, syncAuthAria, activeModal, focusables };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
