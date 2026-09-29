/* AliAli 公共模块：图标 / 工具函数 / 本地用户状态 / 顶栏 / Toast / Modal / 实时事件 */
(function () {
  'use strict';

  // ─────────── 图标 ───────────
  const I = {
    play: '<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4" width="19" height="16" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M10 9.3v5.4c0 .5.5.8.9.5l4.2-2.7c.4-.2.4-.8 0-1l-4.2-2.7c-.4-.3-.9 0-.9.5z" fill="currentColor"/></svg>',
    danmaku: '<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4" width="19" height="16" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M7 10h3.2M12.8 10H17M7 14h6M15.5 14H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M7.2 9.3v3.4a1.9 1.9 0 0 0 3.8 0V9.3M13.6 14.7V9.3h1.9a1.6 1.6 0 0 1 0 3.2h-1.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    search: '<svg viewBox="0 0 17 17" fill="none"><circle cx="7.6" cy="7.6" r="5.9" stroke="currentColor" stroke-width="1.7"/><path d="M12 12l3.3 3.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    clear: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>',
    download: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 2.5v7.2M5 7l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.8 10.5v1.4c0 .9.7 1.6 1.6 1.6h7.2c.9 0 1.6-.7 1.6-1.6v-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    vip: '<svg class="right-entry-icon" viewBox="0 0 20 20" fill="none"><path d="M3.2 7.2l3.2 2.4L10 4l3.6 5.6 3.2-2.4-1.5 8.2H4.7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 12.3h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    message: '<svg class="right-entry-icon" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4" width="15" height="12" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 7.5L10 10.6l4.5-3.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dynamic: '<svg class="right-entry-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.3" stroke="currentColor" stroke-width="1.6"/><path d="M12.9 7.1l-1.6 4.2-4.2 1.6 1.6-4.2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    fav: '<svg class="right-entry-icon" viewBox="0 0 20 20" fill="none"><path d="M10 2.8l2.2 4.5 4.9.7-3.5 3.5.8 4.9L10 14.1l-4.4 2.3.8-4.9L2.9 8l4.9-.7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    history: '<svg class="right-entry-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.3" stroke="currentColor" stroke-width="1.6"/><path d="M10 6v4.3l2.8 1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    creator: '<svg class="right-entry-icon" viewBox="0 0 20 20" fill="none"><path d="M10 2.6a5.4 5.4 0 0 0-3.1 9.8c.5.4.8.9.8 1.5v.6h4.6v-.6c0-.6.3-1.1.8-1.5A5.4 5.4 0 0 0 10 2.6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.9 17.2h4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    upload: '<svg viewBox="0 0 18 18" fill="none"><path d="M9 12V3.5M5.5 7L9 3.5 12.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 11.5v1.8c0 .9.7 1.7 1.7 1.7h8.6c.9 0 1.7-.8 1.7-1.7v-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    more: '<svg viewBox="0 0 16 16"><circle cx="8" cy="3.5" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="12.5" r="1.3" fill="currentColor"/></svg>',
    refresh: '<svg viewBox="0 0 20 20" fill="none"><path d="M16 10a6 6 0 1 1-1.8-4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M14.8 2.8v3.4h-3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    top: '<svg viewBox="0 0 20 20" fill="none"><path d="M4.5 4h11M10 16.5V8M6.5 11.5L10 8l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    service: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 11V9a6 6 0 0 1 12 0v2" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="10.5" width="3" height="5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="10.5" width="3" height="5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><path d="M15.5 15.5c0 1.4-1.6 2-4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    feedback: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 4.5h12v9H9.5L6 16.5v-3H4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 8.5h5M7.5 11h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    user: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 17c.8-3 3.4-4.8 6.5-4.8s5.7 1.8 6.5 4.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    upManage: '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 8v4l3.5-2z" fill="currentColor"/></svg>',
    exit: '<svg viewBox="0 0 20 20" fill="none"><path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M12.5 6.5L16 10l-3.5 3.5M16 10H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowRight: '<svg viewBox="0 0 16 16" fill="none"><path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    coinSmall: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="#ffb027"/><path d="M5.9 11L8 5.2 10.1 11M6.7 9h2.6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  };

  // 原创吉祥物「小A」：AI 显示器形象
  // 神经网络节点天线 · 深色屏幕 + 青色 LED 眼 · 语音波形嘴 · 芯片引脚 · 显示器底座 · 粉色电源灯
  const M = { line: '#1f2a44', screen: '#18233c', led: '#35e0ff', pink: '#fb7299', body: '#eef2f8' };
  function mascot(opts = {}) {
    const { mood = 'happy', size = '', cls = '' } = opts;
    const led = (d) => `<path d="${d}" stroke="${M.led}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
    const face = mood === 'wow'
      ? `<circle cx="22" cy="31" r="3.4" stroke="${M.led}" stroke-width="2.2"/><circle cx="42" cy="31" r="3.4" stroke="${M.led}" stroke-width="2.2"/>
         <circle cx="22" cy="31" r="1.1" fill="${M.led}"/><circle cx="42" cy="31" r="1.1" fill="${M.led}"/>${led('M26 41.5h2.5l1.5-4 2 8 2-8 1.5 4H38')}`
      : mood === 'sad'
        ? `<path d="M17.5 32.5L26 29.5M46.5 32.5L38 29.5" stroke="${M.led}" stroke-width="3" stroke-linecap="round"/>${led('M26.5 42.5q5.5-3.2 11 0')}`
        : `<rect x="16.5" y="28.5" width="11" height="5" rx="2.5" fill="${M.led}"/><rect x="36.5" y="28.5" width="11" height="5" rx="2.5" fill="${M.led}"/>
           ${led('M25.5 41h3l1.5-2.5 2 5 2-5 1.5 2.5h3')}`;
    return `<svg class="mascot ${cls}" ${size ? `width="${size}" height="${size}"` : ''} viewBox="0 0 64 64" fill="none">
      <path d="M32 13V7.5M29.4 5.2L24.5 3M34.6 5.2L39.5 3" stroke="${M.line}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="32" cy="5.6" r="3.1" fill="${M.led}" stroke="${M.line}" stroke-width="1.6"/>
      <circle cx="23.5" cy="2.6" r="1.7" fill="${M.pink}"/><circle cx="40.5" cy="2.6" r="1.7" fill="${M.pink}"/>
      <path d="M2.5 26h3.5M2.5 31h3.5M2.5 36h3.5M58 26h3.5M58 31h3.5M58 36h3.5" stroke="${M.line}" stroke-width="2" stroke-linecap="round"/>
      <rect x="6" y="13" width="52" height="40" rx="10" fill="${M.body}" stroke="${M.line}" stroke-width="3"/>
      <rect x="11" y="18" width="42" height="30" rx="6.5" fill="${M.screen}"/>
      <path d="M14.5 21.5h9" stroke="#fff" stroke-opacity=".18" stroke-width="2" stroke-linecap="round"/>
      <rect x="15" y="27" width="14" height="8" rx="4" fill="${M.led}" opacity=".12"/><rect x="35" y="27" width="14" height="8" rx="4" fill="${M.led}" opacity=".12"/>
      ${face}
      <circle cx="51.5" cy="50.6" r="1.3" fill="${M.pink}"/>
      <rect x="28" y="53" width="8" height="4.5" fill="${M.line}"/>
      <rect x="19" y="57" width="26" height="4" rx="2" fill="${M.line}"/>
    </svg>`;
  }

  // 原创 AliAli 字标（单线手写体，圆头描边）
  function logo(color = 'currentColor') {
    const A = (x) => `<path d="M${x + 3} 41C${x + 8} 30 ${x + 12} 16 ${x + 17.5} 6.5C${x + 19} 4 ${x + 21.6} 4.3 ${x + 21.6} 8L${x + 22} 39.5"/><path d="M${x + 8.5} 28.5Q${x + 17} 25 ${x + 26} 27"/>`;
    const l = (x) => `<path d="M${x + 30} 5.5C${x + 30} 18 ${x + 29.6} 30 ${x + 30.4} 36C${x + 30.8} 40 ${x + 33} 41.5 ${x + 36} 39.5"/>`;
    const i = (x) => `<path d="M${x + 41} 23.5L${x + 41} 36C${x + 41} 40 ${x + 43} 41.5 ${x + 45.6} 39.5"/><circle cx="${x + 41.6}" cy="14.5" r="3" fill="${color}" stroke="none"/>`;
    return `<svg class="aliali-logo" viewBox="-2 0 98 46" fill="none" stroke="${color}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" aria-label="AliAli">
      <g transform="skewX(-9) translate(5 0)">${A(0)}${l(0)}${i(0)}${A(47)}${l(47)}${i(47)}</g></svg>`;
  }

  // 默认头像（本地用户）
  function avatarSVG() {
    return `<svg viewBox="0 0 80 80"><defs><linearGradient id="avg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd1df"/><stop offset="1" stop-color="#bfe9fb"/></linearGradient></defs><rect width="80" height="80" fill="url(#avg)"/><g transform="translate(12 14) scale(.875)">${mascot().replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
  }

  // ─────────── 工具函数 ───────────
  const U = {};
  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.num = (n) => {
    n = Number(n) || 0;
    if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿';
    if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万';
    return String(n);
  };
  U.dur = (s) => {
    s = Math.max(0, Math.round(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const p = (x) => String(x).padStart(2, '0');
    return h ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
  };
  // 首页卡片日期：x小时前 / 昨天 / MM-DD / YYYY-MM-DD
  U.feedDate = (ts) => {
    const d = new Date(ts * 1000), now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400 && d.getDate() === now.getDate()) return `${Math.floor(diff / 3600)}小时前`;
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return '昨天';
    const p = (x) => String(x).padStart(2, '0');
    if (d.getFullYear() === now.getFullYear()) return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  U.fullDate = (ts) => {
    const d = new Date(ts * 1000), p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  U.shortDate = (ts) => {
    const d = new Date(ts * 1000), now = new Date(), p = (x) => String(x).padStart(2, '0');
    const diff = (now - d) / 1000;
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 86400 * 2) return '昨天';
    if (d.getFullYear() === now.getFullYear()) return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  U.img = (url, size) => {
    if (!url) return '';
    const u = url.replace(/^http:/, 'https:') + (size ? `@${size}.webp` : '');
    return '/img?u=' + encodeURIComponent(u);
  };
  U.api = async (path) => {
    const r = await fetch(path);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || 'HTTP ' + r.status), { status: r.status });
    return j;
  };
  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  U.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  U.videoUrl = (bvid) => `/video/${bvid}`;
  U.snap = (v) => ({ bvid: v.bvid, title: v.title, pic: v.pic, owner: v.owner?.name || v.owner, mid: v.mid || v.owner?.mid, duration: v.duration, view: v.stat?.view || 0, danmaku: v.stat?.danmaku || 0 });

  // ─────────── 本地用户状态（localStorage）───────────
  const KEY = 'aliali:user:v1';
  const defaults = () => ({
    name: 'AliAli用户', level: 5, exp: 17820, nextExp: 28800, coins: 233.5, bcoin: 0,
    follows: [], history: [], later: [], searches: [], reposts: [], historyPaused: false,
    folders: [{ id: 'default', name: '默认收藏夹', items: [], private: false }],
    actions: {}, liked: {}, myDanmaku: {}, myReplies: {}, lastVisit: 0, dynamicSeen: 0,
  });
  let state;
  try { state = { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { state = defaults(); }
  const listeners = new Set();
  const Store = {
    get: () => state,
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
      listeners.forEach((fn) => fn(state));
    },
    on: (fn) => listeners.add(fn),
    action(bvid) { return (state.actions[bvid] ||= { like: false, coins: 0, favs: [] }); },
    isFollow: (mid) => state.follows.includes(Number(mid)),
    toggleFollow(mid) {
      mid = Number(mid);
      const i = state.follows.indexOf(mid);
      if (i >= 0) state.follows.splice(i, 1); else state.follows.push(mid);
      Store.save();
      return i < 0;
    },
    pushHistory(v) {
      if (state.historyPaused) return;
      state.history = [{ ...U.snap(v), cid: v.cid, t: Date.now() }, ...state.history.filter((h) => h.bvid !== v.bvid)].slice(0, 100);
      Store.save();
    },
    toggleLater(v) {
      const i = state.later.findIndex((x) => x.bvid === v.bvid);
      if (i >= 0) state.later.splice(i, 1); else state.later.unshift({ ...U.snap(v), t: Date.now() });
      Store.save();
      return i < 0;
    },
    inLater: (bvid) => state.later.some((x) => x.bvid === bvid),
    pushSearch(q) {
      state.searches = [q, ...state.searches.filter((s) => s !== q)].slice(0, 10);
      Store.save();
    },
  };
  // 每天首次访问送 1 枚硬币（登录奖励）
  const today = new Date().toDateString();
  if (state.lastLoginDay !== today) { state.lastLoginDay = today; state.coins = Math.round((state.coins + 1) * 10) / 10; Store.save(); }

  // ─────────── Toast / Modal ───────────
  function toast(msg, { icon = '', duration = 2000 } = {}) {
    let wrap = U.$('.ali-toast-wrap');
    if (!wrap) { wrap = U.h('<div class="ali-toast-wrap"></div>'); document.body.appendChild(wrap); }
    const el = U.h(`<div class="ali-toast">${icon}<span>${U.esc(msg)}</span></div>`);
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, duration);
  }
  function modal(html, { width = 460, onClose } = {}) {
    const mask = U.h(`<div class="ali-modal-mask"><div class="ali-modal" style="width:${width}px"><button class="modal-close" aria-label="关闭">${I.close}</button>${html}</div></div>`);
    const close = () => {
      if (mask.classList.contains('out')) return;
      mask.classList.add('out');
      setTimeout(() => mask.remove(), 200);
      document.removeEventListener('keydown', onKey);
      onClose && onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    mask.addEventListener('mousedown', (e) => { if (e.target === mask) close(); });
    mask.querySelector('.modal-close').onclick = close;
    document.addEventListener('keydown', onKey);
    document.body.appendChild(mask);
    return { el: mask.querySelector('.ali-modal'), close };
  }

  // ─────────── 顶栏 ───────────
  const LEFT_ENTRIES = [
    { text: '模型广场', href: '/?c=llm' },
    { text: '智能体', href: '/?c=agent' },
    { text: '具身智能', href: '/?c=robot' },
    { text: 'AI绘画', href: '/?c=paint' },
    { text: '论文精读', href: '/?c=paper' },
    { text: '官方频道', href: '/?c=official', dot: true },
  ];

  function renderHeader(mount, { solid = false } = {}) {
    const s = state;
    mount.innerHTML = `
      <div class="bili-header__bar ${solid ? 'is-solid' : ''}">
        <ul class="left-entry">
          <li><a class="left-entry__title" href="/">${mascot({ cls: 'home-icon' })}<span class="entry-text">首页</span></a></li>
          ${LEFT_ENTRIES.map((e) => `<li><a class="left-entry__title" href="${e.href}"><span class="entry-text">${e.text}</span>${e.dot ? '<i class="red-dot"></i>' : ''}</a></li>`).join('')}
          <li class="has-popover download-li"><a class="left-entry__title download-entry" href="javascript:;">${I.download.replace('<svg', '<svg class="download-icon"')}<span class="entry-text">${IS_CLIENT ? 'AliAli 客户端' : '下载客户端'}</span></a>
            <div class="v-popover" style="left:0;transform:none"><div class="pop-card download-card" data-download-card>${downloadCard(null)}</div></div>
          </li>
        </ul>
        <div class="center-search-container">
          <div class="center-search__bar">
            <form class="nav-search-form" autocomplete="off">
              <div class="nav-search-content">
                <input class="nav-search-input" type="text" maxlength="100" placeholder="" aria-label="搜索">
                <span class="nav-search-clean">${I.clear}</span>
              </div>
              <button class="nav-search-btn" type="submit" aria-label="搜索">${I.search}</button>
            </form>
            <div class="search-panel"></div>
          </div>
        </div>
        <ul class="right-entry">
          <li class="header-avatar-wrap has-popover">
            <a class="avatar" href="javascript:;">${avatarSVG()}</a>
            <div class="v-popover" style="left:-20px;transform:translateX(-50%);padding-top:14px">${avatarPanel()}</div>
          </li>
          <li class="has-popover"><a class="right-entry-item vip" href="javascript:;">${I.vip}<span class="right-entry-text">大会员</span></a>
            <div class="v-popover"><div class="pop-card" style="width:290px;padding:18px 18px 16px">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">${mascot({ size: 44, mood: 'wow' })}<div><div style="font-size:15px;font-weight:500;color:var(--pink)">AliAli 大会员</div><div style="font-size:12px;color:var(--text3);margin-top:2px">解锁 4K 论文精读、专属装扮</div></div></div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;text-align:center;font-size:12px;color:var(--text2)">
                <div style="padding:10px 0;border-radius:8px;background:#fff4f7">高清画质</div><div style="padding:10px 0;border-radius:8px;background:#fff4f7">抢先看</div><div style="padding:10px 0;border-radius:8px;background:#fff4f7">专属表情</div>
              </div>
              <button class="btn-primary" style="width:100%;background:var(--pink)" data-toast="AliAli 大会员暂未开放，敬请期待～">成为大会员</button>
            </div></div>
          </li>
          <li class="has-popover"><a class="right-entry-item" href="javascript:;">${I.message}<span class="right-entry-text">消息</span><span class="badge" data-badge="msg">1</span></a>
            <div class="v-popover"><div class="pop-card" style="width:142px;padding:8px 0">
              ${['回复我的', '@ 我的', '收到的赞', '系统消息', '我的消息'].map((t, i) => `<a href="javascript:;" class="msg-link" style="display:flex;justify-content:space-between;align-items:center;height:36px;padding:0 20px;font-size:14px;color:var(--text2)" data-toast="${i === 3 ? '系统通知：AliAli 每 10 分钟自动同步一次 AI 圈最新投稿' : '暂时没有新' + t.replace('我的', '') + '哦'}">${t}${i === 3 ? '<span style="min-width:15px;height:15px;border-radius:8px;background:#fa5a57;color:#fff;font-size:10px;line-height:15px;text-align:center;padding:0 4px">1</span>' : ''}</a>`).join('')}
            </div></div>
          </li>
          <li class="has-popover" data-pop="dynamic"><a class="right-entry-item" href="/space#dynamic">${I.dynamic}<span class="right-entry-text">动态</span><span class="badge hidden" data-badge="dynamic"></span></a>
            <div class="v-popover" style="left:auto;right:-120px;transform:none"><div class="pop-card" style="width:370px"><div class="pop-title">最新动态<a href="/space#dynamic">查看全部 ›</a></div><div class="pop-list" data-list="dynamic"></div></div></div>
          </li>
          <li class="has-popover" data-pop="fav"><a class="right-entry-item" href="/space#fav">${I.fav}<span class="right-entry-text">收藏</span></a>
            <div class="v-popover" style="left:auto;right:-100px;transform:none"><div class="pop-card" style="width:370px"><div class="pop-title">我的收藏<a href="/space#fav">查看全部 ›</a></div><div class="pop-list" data-list="fav"></div></div></div>
          </li>
          <li class="has-popover" data-pop="history"><a class="right-entry-item" href="/space#history">${I.history}<span class="right-entry-text">历史</span></a>
            <div class="v-popover" style="left:auto;right:-60px;transform:none"><div class="pop-card" style="width:370px"><div class="pop-title"><span style="display:flex;gap:18px"><span class="hist-tab is-active" data-tab="history" style="cursor:pointer">历史</span><span class="hist-tab" data-tab="later" style="cursor:pointer;color:var(--text3)">稍后再看</span></span><span style="display:flex;gap:14px"><a href="javascript:;" data-act="clear-history">清空</a><a href="/space#history" data-hist-all>查看全部 ›</a></span></div><div class="pop-list" data-list="history"></div></div></div>
          </li>
          <li><a class="right-entry-item" href="javascript:;" data-toast="创作中心：AliAli 目前只收录 AI 博主与 AI 公司官方的投稿">${I.creator}<span class="right-entry-text">创作中心</span></a></li>
          <li><a class="header-upload-entry" href="javascript:;" data-toast="投稿通道暂未开放：AliAli 仅收录 AI 圈认证账号">${I.upload}<span>投稿</span></a></li>
        </ul>
      </div>`;
    bindHeader(mount);
    return mount.querySelector('.bili-header__bar');
  }

  // ─────────── 下载客户端 ───────────
  const IS_CLIENT = !!window.aliClient || /AliAliClient\//.test(navigator.userAgent);
  let clientInfo;
  function downloadCard(info) {
    const icon = '<img class="dl-icon" src="/favicon.svg" alt="AliAli">';
    if (IS_CLIENT) {
      const ver = (navigator.userAgent.match(/AliAliClient\/([\d.]+)/) || [])[1] || '';
      return `<div class="dl-head">${icon}<div><div class="dl-name">AliAli 桌面客户端</div><div class="dl-meta">你正在使用客户端${ver ? ` · v${ver}` : ''}</div></div></div>
        <ul class="dl-notes"><li>Alt + ← / → 后退前进，鼠标侧键同样可用</li><li>F11 全屏，F5 刷新</li><li>关闭窗口即退出，托盘图标可快速打开个人空间</li></ul>
        <button class="dl-btn ghost" data-client-about>关于客户端</button>`;
    }
    if (info === null) return `<div class="dl-head">${icon}<div><div class="dl-name">AliAli 桌面客户端</div><div class="dl-meta">正在获取版本信息…</div></div></div>`;
    if (!info) return `<div class="dl-head">${icon}<div><div class="dl-name">AliAli 桌面客户端</div><div class="dl-meta">Windows 版</div></div></div>
        <button class="dl-btn" disabled>安装包准备中，敬请期待</button>`;
    const d = new Date(info.date);
    return `<div class="dl-head">${icon}<div><div class="dl-name">AliAli 桌面客户端</div><div class="dl-meta">v${U.esc(info.version)} · ${(info.size / 1048576).toFixed(1)} MB · ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 更新</div></div></div>
      <ul class="dl-notes">${(info.notes || []).map((n) => `<li>${U.esc(n)}</li>`).join('')}</ul>
      <a class="dl-btn" href="${info.url}" download>${I.download.replace('<svg', '<svg width="16" height="16"')}下载 Windows 版</a>
      <div class="dl-foot">${U.esc(info.platform || 'Windows 10 / 11')} · 安装后即可使用，无需登录</div>`;
  }
  async function fillDownload(root) {
    const card = root.querySelector('[data-download-card]');
    if (!card || IS_CLIENT) { if (card) card.innerHTML = downloadCard(null); return; }
    if (clientInfo === undefined) clientInfo = await fetch('/api/client').then((r) => (r.ok ? r.json() : false)).catch(() => false);
    card.innerHTML = downloadCard(clientInfo);
    card.querySelector('.dl-btn[href]')?.addEventListener('click', () => toast('开始下载 AliAli 安装包…'));
  }

  function avatarPanel() {
    const s = state;
    const pct = Math.min(100, (s.exp / s.nextExp) * 100);
    const favCount = s.folders.reduce((n, f) => n + f.items.length, 0);
    return `<div class="pop-card avatar-panel">
      <div class="nickname">${U.esc(s.name)}</div>
      <div class="level-row"><span class="level-badge lv${s.level}">LV${s.level}</span><div class="level-bar"><i style="width:${pct}%"></i></div><span>${s.exp}/${s.nextExp}</span></div>
      <div class="coins"><span>硬币: <b data-bind="coins">${s.coins}</b></span><span>B币: <b>${s.bcoin}</b></span></div>
      <div class="counts">
        <a href="/space#follow"><div class="num" data-bind="follows">${s.follows.length}</div><div class="lbl">关注</div></a>
        <a href="/space#fav"><div class="num" data-bind="favs">${favCount}</div><div class="lbl">收藏</div></a>
        <a href="/space#history"><div class="num" data-bind="hist">${s.history.length}</div><div class="lbl">历史</div></a>
      </div>
      <div class="vip-card"><div><b>成为大会员</b><span>AI 论文 4K 精读随心看</span></div><button data-toast="AliAli 大会员暂未开放，敬请期待～">立即开通</button></div>
      <div class="menu">
        <a href="/space"><span>${I.user}个人中心</span>${I.arrowRight.replace('<svg', '<svg style="width:14px;height:14px"')}</a>
        <a href="javascript:;" data-toast="投稿管理：投稿通道暂未开放"><span>${I.upManage}投稿管理</span>${I.arrowRight.replace('<svg', '<svg style="width:14px;height:14px"')}</a>
        <a href="javascript:;" data-act="reset-user"><span>${I.refresh}重置本地数据</span>${I.arrowRight.replace('<svg', '<svg style="width:14px;height:14px"')}</a>
      </div>
      <div class="menu logout"><a href="javascript:;" data-toast="本地体验账号无需退出"><span>${I.exit}退出登录</span></a></div>
    </div>`;
  }

  function popVideo(v, meta) {
    return `<a class="pop-video" href="${U.videoUrl(v.bvid)}">
      <div class="cover"><img src="${U.img(v.pic, '224w_126h_1c')}" loading="lazy" alt=""><span class="dur">${U.dur(v.duration)}</span></div>
      <div class="pop-video-body"><div class="pop-video-title">${U.esc(v.title)}</div><div class="pop-video-meta">${meta}</div></div></a>`;
  }
  const emptyPop = (text) => `<div class="pop-empty">${mascot({ mood: 'sad' })}<div>${text}</div></div>`;

  let latestFeed = [];
  function fillPopovers(root) {
    const s = state;
    const hist = root.querySelector('[data-list="history"]');
    const tab = root.querySelector('.hist-tab.is-active')?.dataset.tab || 'history';
    if (hist) {
      const list = tab === 'later' ? s.later : s.history;
      hist.innerHTML = list.length
        ? list.slice(0, 30).map((v) => popVideo(v, `${I.up.replace('<svg', '<svg')}${U.esc(v.owner)} · ${tab === 'later' ? '稍后再看' : U.shortDate(v.t / 1000)}`)).join('')
        : emptyPop(tab === 'later' ? '稍后再看列表空空如也' : '还没有观看记录哦');
    }
    const fav = root.querySelector('[data-list="fav"]');
    if (fav) {
      const items = s.folders.flatMap((f) => f.items.map((it) => ({ ...it, folder: f.name })));
      fav.innerHTML = items.length ? items.slice(0, 30).map((v) => popVideo(v, `${U.esc(v.folder)} · ${U.esc(v.owner)}`)).join('') : emptyPop('收藏夹里还没有视频');
    }
    const dyn = root.querySelector('[data-list="dynamic"]');
    if (dyn) {
      const followed = latestFeed.filter((v) => s.follows.includes(v.mid));
      const list = (followed.length ? followed : latestFeed).slice(0, 12);
      dyn.innerHTML = list.length ? list.map((v) => popVideo(v, `${U.esc(v.owner)} · ${U.feedDate(v.pubdate)}`)).join('') : emptyPop('正在同步 AI 圈最新动态…');
    }
    root.querySelector('[data-bind="coins"]') && (root.querySelector('[data-bind="coins"]').textContent = s.coins);
    root.querySelector('[data-bind="follows"]') && (root.querySelector('[data-bind="follows"]').textContent = s.follows.length);
    root.querySelector('[data-bind="favs"]') && (root.querySelector('[data-bind="favs"]').textContent = s.folders.reduce((n, f) => n + f.items.length, 0));
    root.querySelector('[data-bind="hist"]') && (root.querySelector('[data-bind="hist"]').textContent = s.history.length);
  }

  async function updateDynamicBadge(root) {
    try {
      const j = await U.api('/api/feed?sort=new&limit=30');
      latestFeed = j.items;
      const seen = state.dynamicSeen || 0;
      const fresh = j.items.filter((v) => v.pubdate * 1000 > seen && (state.follows.length ? state.follows.includes(v.mid) : true)).length;
      const b = root.querySelector('[data-badge="dynamic"]');
      if (b) { b.textContent = fresh > 99 ? '99+' : fresh; b.classList.toggle('hidden', !fresh || !seen); }
      if (!seen) { state.dynamicSeen = Date.now(); Store.save(); }
    } catch {}
  }

  function bindHeader(root) {
    // 头像悬停放大
    const av = root.querySelector('.header-avatar-wrap');
    av.addEventListener('mouseenter', () => { fillPopovers(root); av.classList.add('is-hover'); });
    av.addEventListener('mouseleave', () => av.classList.remove('is-hover'));
    root.querySelectorAll('.has-popover').forEach((li) => li.addEventListener('mouseenter', () => {
      fillPopovers(root);
      if (li.dataset.pop === 'dynamic') {
        state.dynamicSeen = Date.now(); Store.save();
        root.querySelector('[data-badge="dynamic"]')?.classList.add('hidden');
      }
    }));
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-toast]');
      if (t) { e.preventDefault(); toast(t.dataset.toast); }
      const tab = e.target.closest('.hist-tab');
      if (tab) {
        root.querySelectorAll('.hist-tab').forEach((x) => { x.classList.toggle('is-active', x === tab); x.style.color = x === tab ? '' : 'var(--text3)'; });
        fillPopovers(root);
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'clear-history') {
        const t2 = root.querySelector('.hist-tab.is-active')?.dataset.tab;
        state[t2 === 'later' ? 'later' : 'history'] = []; Store.save(); fillPopovers(root); toast('已清空');
      }
      if (act === 'reset-user') {
        if (confirm('确定清空本地的点赞、投币、收藏、关注和历史记录吗？')) { localStorage.removeItem(KEY); location.reload(); }
      }
      if (e.target.closest('.download-entry')) e.preventDefault();
      if (e.target.closest('[data-client-about]')) window.aliClient?.about();
    });
    root.querySelectorAll('.msg-link').forEach((a) => a.addEventListener('mouseenter', () => (a.style.color = 'var(--brand-blue)')));
    root.querySelectorAll('.msg-link').forEach((a) => a.addEventListener('mouseleave', () => (a.style.color = 'var(--text2)')));
    bindSearch(root);
    root.querySelector('.download-li')?.addEventListener('mouseenter', () => fillDownload(root), { once: true });
    updateDynamicBadge(root);
    setInterval(() => updateDynamicBadge(root), 120e3);
    Store.on(() => fillPopovers(root));
  }

  // 搜索框：历史 + 热搜
  let hotwords = [];
  function bindSearch(root) {
    const bar = root.querySelector('.center-search__bar');
    const form = bar.querySelector('form');
    const input = bar.querySelector('input');
    const panel = bar.querySelector('.search-panel');
    const params = new URLSearchParams(location.search);
    if (params.get('q')) { input.value = params.get('q'); bar.classList.add('has-value'); }
    const renderPanel = () => {
      const hs = state.searches;
      panel.innerHTML = `
        ${hs.length ? `<div class="header"><div class="title">搜索历史</div><div class="clear" data-clear>清空</div></div>
        <div class="histories">${hs.map((h) => `<div class="history-item" data-q="${U.esc(h)}">${U.esc(h)}<span class="close" data-del="${U.esc(h)}">×</span></div>`).join('')}</div>` : ''}
        <div class="header"><div class="title">AliAli 热搜</div></div>
        <div class="trendings">${hotwords.map((w, i) => `<div class="trending-item" data-q="${U.esc(w.word)}"><span class="rank">${i + 1}</span><span class="text">${U.esc(w.word)}</span>${i < 2 ? '<span class="hot-tag">热</span>' : i === 3 ? '<span class="hot-tag new-tag">新</span>' : ''}</div>`).join('') || '<div style="padding:8px 11px;color:var(--text3);font-size:13px">正在加载热搜…</div>'}</div>`;
    };
    U.api('/api/hotwords').then((w) => {
      hotwords = w;
      if (w[0] && !input.value) input.placeholder = w[Math.floor(Math.random() * Math.min(5, w.length))].word;
      renderPanel();
    }).catch(() => {});
    input.addEventListener('focus', () => { renderPanel(); bar.classList.add('is-focus'); });
    document.addEventListener('mousedown', (e) => { if (!bar.contains(e.target)) bar.classList.remove('is-focus'); });
    input.addEventListener('input', () => bar.classList.toggle('has-value', !!input.value));
    bar.querySelector('.nav-search-clean').addEventListener('mousedown', (e) => { e.preventDefault(); input.value = ''; bar.classList.remove('has-value'); input.focus(); });
    const go = (q) => { q = q.trim(); if (!q) return; Store.pushSearch(q); location.href = '/?q=' + encodeURIComponent(q); };
    form.addEventListener('submit', (e) => { e.preventDefault(); go(input.value || input.placeholder); });
    panel.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const del = e.target.closest('[data-del]');
      if (del) { state.searches = state.searches.filter((s) => s !== del.dataset.del); Store.save(); renderPanel(); return; }
      if (e.target.closest('[data-clear]')) { state.searches = []; Store.save(); renderPanel(); return; }
      const it = e.target.closest('[data-q]');
      if (it) go(it.dataset.q);
    });
  }

  // ─────────── 右下角工具按钮 + 实时同步事件 ───────────
  function renderPalette({ onRefresh } = {}) {
    const wrap = U.h(`<div class="palette-button-wrap">
      <button class="palette-btn sync-btn" aria-label="同步状态">${I.refresh}<span>刷新</span><i></i><div class="palette-tip">实时同步中</div></button>
      <button class="palette-btn" data-toast="AliAli 客服：有问题欢迎反馈～">${I.service}<span>客服</span></button>
      <button class="palette-btn top-btn" aria-label="回到顶部">${I.top}<span>顶部</span></button>
    </div>`);
    document.body.appendChild(wrap);
    const top = wrap.querySelector('.top-btn');
    window.addEventListener('scroll', () => top.classList.toggle('show', scrollY > 600), { passive: true });
    top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
    wrap.querySelector('[data-toast]').onclick = (e) => toast(e.currentTarget.dataset.toast);
    const sync = wrap.querySelector('.sync-btn');
    sync.onclick = () => (onRefresh ? onRefresh() : location.reload());
    return { sync, tip: sync.querySelector('.palette-tip') };
  }

  function connectEvents(handlers) {
    let es;
    const open = () => {
      es = new EventSource('/api/events');
      es.addEventListener('hello', (e) => handlers.hello?.(JSON.parse(e.data)));
      es.addEventListener('sync', (e) => handlers.sync?.(JSON.parse(e.data)));
      es.onerror = () => { es.close(); setTimeout(open, 5000); };
    };
    open();
  }

  // ─────────── 转发到动态 / 分享到站外 ───────────
  function repost(v, onDone) {
    const snap = U.snap(v);
    const m = modal(`<div style="padding:22px 24px 20px">
        <div style="font-size:18px;font-weight:500;margin-bottom:14px">转发到动态</div>
        <textarea maxlength="233" placeholder="说点什么吧（可以不写）" style="display:block;width:100%;height:92px;padding:10px 12px;border:1px solid var(--line);border-radius:6px;resize:none;outline:none;font-size:14px;line-height:22px"></textarea>
        <div style="display:flex;gap:10px;margin-top:12px;padding:8px;border-radius:6px;background:var(--bg2)">
          <img src="${U.img(snap.pic, '240w_135h_1c')}" style="width:120px;height:68px;border-radius:4px;object-fit:cover" alt="">
          <div style="min-width:0"><div style="font-size:14px;line-height:20px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${U.esc(snap.title)}</div><div style="margin-top:4px;font-size:12px;color:var(--text3)">UP主：${U.esc(snap.owner)}</div></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
          <span class="rp-count" style="font-size:12px;color:var(--text3)">0/233</span>
          <span style="display:flex;gap:10px"><button class="rp-cancel" style="height:34px;padding:0 18px;border-radius:6px;border:1px solid var(--line);color:var(--text2)">取消</button><button class="btn-primary rp-ok" style="height:34px">转发</button></span>
        </div></div>`, { width: 480 });
    const ta = m.el.querySelector('textarea');
    ta.focus();
    ta.addEventListener('input', () => (m.el.querySelector('.rp-count').textContent = `${ta.value.length}/233`));
    const ok = () => {
      state.reposts.unshift({ id: 'rp' + Date.now(), t: Date.now(), text: ta.value.trim(), video: snap });
      Store.save();
      m.close();
      toast('转发成功，可以在个人空间的动态里查看');
      onDone && onDone();
    };
    m.el.querySelector('.rp-ok').onclick = ok;
    m.el.querySelector('.rp-cancel').onclick = m.close;
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ok(); });
  }
  // 站外分享使用 bilibili 原视频链接（本地 AliAli 地址别人打不开）
  function shareOut(platform, v) {
    const url = `https://www.bilibili.com/video/${v.bvid}`;
    const title = `【${v.title}】- AliAli 推荐的 AI 圈好视频`;
    const pic = (v.pic || '').replace(/^http:/, 'https:');
    const target = {
      weibo: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&pic=${encodeURIComponent(pic)}`,
      qzone: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&pics=${encodeURIComponent(pic)}&summary=${encodeURIComponent(v.desc || '')}`,
    }[platform];
    if (target) window.open(target, '_blank', 'noopener,width=720,height=620');
  }

  function footer() {
    return `<footer class="ali-footer">
      <div>${logo('#fb7299').replace('class="aliali-logo"', 'class="aliali-logo" style="height:26px;width:auto;margin:0 auto 10px;display:block"')}</div>
      <div>AliAli · 只看 AI 圈 —— 内容实时同步自 bilibili 上的 AI 博主与 AI 公司官方账号，版权归原作者所有</div>
      <div>本站为界面复刻练习项目，点赞 / 投币 / 收藏等互动仅保存在本地浏览器</div>
    </footer>`;
  }

  window.Ali = { I, U, Store, toast, modal, mascot, logo, avatarSVG, renderHeader, renderPalette, connectEvents, footer, repost, shareOut };
})();
