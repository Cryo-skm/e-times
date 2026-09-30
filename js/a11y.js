/* ════════════════════════════════════════════════════════════════════
   a11y · 无障碍增强层（移动端 / PC 端共用）
   ─────────────────────────────────────────────────────────────────────
   评审实测：全站只有 1 个 aria-label，弹窗没有 role="dialog"、不支持 Esc 关闭，
   div/span 做成的「按钮」键盘根本走不到，被抹掉 outline 后键盘用户看不到焦点。

   本文件做四件事（全部是「补齐」，不改任何既有交互）：
     1) 键盘可达：把带点击语义的 div/span 补成 role="button" + tabindex="0"，
        并让 Enter / Space 能真正触发它；
     2) Esc 关闭：按层级从内到外关掉 e次元弹层 → PC 弹窗 → 业务页 → 覆盖页；
     3) 焦点可见：本文件不含样式，焦点环定义在 css 里（:focus-visible）；
     4) 兜底 alt：动态插入的 <img> 若没写 alt，自动补空 alt（装饰性图片），
        用 MutationObserver 持续监听。
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

    /* 动态渲染的内容（业务页 / e次元 子页 / 弹层）持续补齐 */
    if (window.MutationObserver) {
      let t = null;
      const mo = new MutationObserver(muts => {
        clearTimeout(t);
        t = setTimeout(() => {
          let dirty = false;
          for (const m of muts) {
            if (m.addedNodes && m.addedNodes.length) { dirty = true; break; }
          }
          if (!dirty) return;
          makeFocusable(document);
          fixAlt(document);
          fixNames(document);
        }, 160);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  /* 供审计脚本/调试查看 */
  window.A11Y = { makeFocusable, fixAlt, fixNames, escClose, syncOverlayAria };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
