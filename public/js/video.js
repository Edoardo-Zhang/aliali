/* AliAli 视频详情页：播放器 / 弹幕 / 一键三连 / 评论 / 推荐 */
(function () {
  'use strict';
  const { I, U, Store, toast, modal, mascot, avatarSVG, renderHeader, renderPalette, footer } = window.Ali;
  const Ali = window.Ali;
  const bvid = location.pathname.match(/BV\w{10}/)[0];
  renderHeader(document.getElementById('header-bar-mount'), { solid: true });
  renderPalette({ onRefresh: () => refreshStats(true) });
  document.getElementById('footer').innerHTML = footer();

  // ─────────── 工具栏图标 ───────────
  const ICO = {
    like: '<svg class="ico" viewBox="0 0 28 28"><path fill="currentColor" d="M9.8 11.6l3.9-7.4c.5-.9 1.5-1.3 2.4-1 1.5.5 2.3 2 2 3.5l-.7 3.5h5.3c1.7 0 3 1.6 2.6 3.3l-2 8.4c-.3 1.2-1.4 2.1-2.6 2.1H9.8zM4.4 11.6h3.4V24H4.4c-.9 0-1.6-.7-1.6-1.6v-9.2c0-.9.7-1.6 1.6-1.6z"/></svg>',
    coin: '<svg class="ico" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11.4" fill="currentColor"/><path d="M10.1 19.2L14 8.6l3.9 10.6M11.5 15.6h5" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    fav: '<svg class="ico" viewBox="0 0 28 28"><path fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M14 3.4l3.2 6.6 7.2 1.1-5.2 5.1 1.2 7.2L14 20l-6.4 3.4 1.2-7.2-5.2-5.1 7.2-1.1z"/></svg>',
    share: '<svg class="ico" viewBox="0 0 28 28"><path fill="currentColor" d="M15.6 4.6l9 8.1c.5.4.5 1.2 0 1.6l-9 8.1c-.6.5-1.6.1-1.6-.8v-3.9c-5.4 0-8.9 1.7-11.5 5.6-.2.3-.7.1-.6-.3 1.1-6.3 4.9-10.6 12.1-11.5V5.4c0-.9 1-1.3 1.6-.8z"/></svg>',
  };
  const ring = '<svg class="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/></svg>';

  let V = null;          // 视频详情
  let online = '1';
  let danmakuList = [];  // 当前分 P 的真实弹幕
  let cid = 0;           // 当前分 P
  let player = null;
  let related = [];
  const act = Store.action(bvid);
  const myDm = () => (Store.get().myDanmaku[bvid] || []).filter((d) => !d.cid || d.cid === cid);

  // ─────────── 加载 ───────────
  (async function boot() {
    try {
      V = await U.api(`/api/video/${bvid}`);
    } catch (e) {
      document.getElementById('app').innerHTML = `<div class="video-error">${mascot({ mood: 'sad' })}<div>${e.status === 403 ? U.esc(e.message) : '视频加载失败：' + U.esc(e.message)}</div><a class="btn-primary" style="display:flex;align-items:center" href="/">回到 AliAli 首页</a></div>`;
      return;
    }
    document.title = `${V.title}_AliAli_aliali`;
    const p = Number(new URLSearchParams(location.search).get('p')) || 1;
    cid = (V.pages.find((x) => x.page === p) || V.pages[0] || { cid: V.cid }).cid;
    Store.pushHistory({ ...V, mid: V.owner.mid, cid });
    renderInfo(); renderPlayer(); renderSendingBar(); renderToolbar(); renderDesc(); renderTags(); renderUp();
    renderPod(); renderDanmakuBox(); loadRecommend(); loadComments(true);
    loadDanmaku();
    refreshOnline();
    setInterval(() => refreshStats(false), 60e3);
    setInterval(refreshOnline, 30e3);
  })();

  async function refreshStats(manual) {
    try {
      const nv = await U.api(`/api/video/${bvid}`);
      V.stat = nv.stat; V.card = nv.card || V.card;
      renderInfo(); updateCounts(); renderUpFollow();
      if (manual) toast('数据已刷新');
    } catch {}
  }
  async function refreshOnline() {
    try { online = (await U.api(`/api/online/${bvid}/${cid}`)).total; renderSendingBar(true); } catch {}
  }
  async function loadDanmaku() {
    const forCid = cid;
    danmakuList = [];
    try { danmakuList = await U.api(`/api/danmaku/${forCid}`); } catch {}
    if (forCid !== cid) return;
    player?.setDanmakuList([...danmakuList, ...myDm()]);
    renderDanmakuBox(); renderSendingBar(true);
  }

  // ─────────── 标题区 ───────────
  function renderInfo() {
    const s = V.stat;
    document.getElementById('video-info').innerHTML = `
      <h1 class="video-title" title="${U.esc(V.title)}">${U.esc(V.title)}</h1>
      <div class="video-info-detail">
        <span class="item" title="播放数 · 实时更新">${I.play}${U.num(s.view)}</span>
        <span class="item" title="弹幕数">${I.danmaku}${U.num(s.danmaku + (Store.get().myDanmaku[bvid]?.length || 0))}</span>
        <span class="item">${U.fullDate(V.pubdate)}</span>
        ${V.copyright === 1
          ? `<span class="copyright"><svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="#fd5c5c" stroke-width="1.4"/><path d="M3.6 3.6l8.8 8.8" stroke="#fd5c5c" stroke-width="1.4"/></svg>未经作者授权，禁止转载</span>`
          : '<span class="copyright">转载</span>'}
        ${(V.honor || []).slice(0, 2).map((h) => `<span class="honor">${U.esc(h)}</span>`).join('')}
        <span class="item" title="数据每分钟自动刷新"><i class="live-dot"></i>&nbsp;实时</span>
      </div>`;
  }

  // ─────────── 播放器 ───────────
  let dmOn = true;
  const autoNextKey = 'aliali:autoplay';
  const autoNext = () => { try { return localStorage.getItem(autoNextKey) === '1'; } catch { return false; } };
  function renderPlayer() {
    const wrap = document.getElementById('player-wrap');
    player = window.AliPlayer.create({
      wrap, area: document.getElementById('player'), bvid, cid, poster: V.pic, duration: V.duration,
      autoNext,
      getNext: () => {
        // 多 P 视频先播下一 P，否则播推荐第一个
        const i = V.pages.findIndex((p) => p.cid === cid);
        if (i >= 0 && i < V.pages.length - 1) return { bvid: `${bvid}?p=${V.pages[i + 1].page}`, title: `P${V.pages[i + 1].page} ${V.pages[i + 1].part}`, pic: V.pic };
        return related[0] ? { bvid: related[0].bvid, title: related[0].title, pic: related[0].pic } : null;
      },
    });
    player.on('danmaku', (on) => { dmOn = on; renderSendingBar(true); });
    player.on('wide', setWide);
    player.on('error', () => fallbackEmbed());
    player.on('time', highlightDmRow);
    if (danmakuList.length) player.setDanmakuList([...danmakuList, ...myDm()]);
  }
  // 宽屏：播放器横跨两栏，右栏整体下移让位
  let wideOn = false;
  const container = document.querySelector('.video-container-v1');
  const right = document.querySelector('.right-container');
  function layoutWide() {
    container.style.setProperty('--right-w', right.offsetWidth + 'px');
    // 左栏是 position:relative，offsetTop 即播放器相对两栏顶部的距离（含标题区）
    const wrap = document.getElementById('player-wrap');
    container.style.setProperty('--wide-offset', wideOn ? wrap.offsetTop + wrap.offsetHeight + 20 + 'px' : '0px');
  }
  function setWide(on) { wideOn = on; container.classList.toggle('wide-mode', on); layoutWide(); requestAnimationFrame(layoutWide); }
  new ResizeObserver(() => wideOn && layoutWide()).observe(document.getElementById('player-wrap'));
  // 取流失败时退回 bilibili 外链播放器
  function fallbackEmbed() {
    const el = document.getElementById('player');
    el.innerHTML = `<iframe src="https://player.bilibili.com/player.html?isOutside=true&bvid=${bvid}&cid=${cid}&autoplay=0&high_quality=1&danmaku=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen="true" scrolling="no" style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`;
    player = null;
    toast('视频流获取失败，已切换为 bilibili 外链播放器');
  }

  // ─────────── 弹幕发送栏 ───────────
  const COLORS = ['#ffffff', '#fe0302', '#ff7204', '#ffaa02', '#ffd302', '#00cd00', '#00a2ff', '#4266be', '#89d5ff', '#cc0273', '#9b9b9b', '#fb7299'];
  let dmColor = '#ffffff';
  function renderSendingBar(onlyLeft) {
    const bar = document.getElementById('sending-bar');
    const total = danmakuList.length + myDm().length;
    const left = `<div class="sending-left"><span>${U.esc(online)} 人正在看，已装填 ${total} 条弹幕</span>
      <span class="dm-switch ${dmOn ? '' : 'off'}" title="${dmOn ? '关闭弹幕' : '开启弹幕'}"><svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4" width="19" height="16" rx="4" stroke="currentColor" stroke-width="1.7"/><path d="M7 10h3.2M12.8 10H17M7 14h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>${dmOn ? '' : '<path d="M4 4l16 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'}</svg><span class="ali-switch ${dmOn ? 'on' : ''}"></span></span></div>`;
    if (onlyLeft && bar.querySelector('.sending-left')) { bar.querySelector('.sending-left').outerHTML = left; bindSwitch(bar); return; }
    bar.innerHTML = `${left}
      <div class="dm-input-wrap">
        <span class="dm-style" title="弹幕样式"><svg viewBox="0 0 20 20" fill="none"><path d="M4 16l4.5-12h3L16 16M6 11.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="dm-colors"><div class="lbl">弹幕颜色</div><div class="row">${COLORS.map((c) => `<span class="c ${c === dmColor ? 'on' : ''}" data-c="${c}" style="background:${c}"></span>`).join('')}</div></div>
        </span>
        <input type="text" maxlength="100" placeholder="发个友善的弹幕见证当下">
        <a class="dm-etiquette" href="javascript:;">弹幕礼仪 ›</a>
        <button class="dm-send-btn">发送</button>
      </div>`;
    bindSwitch(bar);
    const input = bar.querySelector('input');
    const send = () => {
      const text = input.value.trim();
      if (!text) return toast('请输入弹幕内容');
      const s = Store.get();
      if (!player) return toast('当前为外链播放器，无法发送弹幕');
      if (!dmOn) { player.setDanmaku(true); dmOn = true; }
      const d = player.send(text, dmColor);
      (s.myDanmaku[bvid] ||= []).push({ ...d, cid });
      Store.save();
      input.value = '';
      input.blur();
      renderSendingBar(true); renderDanmakuBox(); renderInfo();
    };
    bar.querySelector('.dm-send-btn').onclick = send;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    bar.querySelector('.dm-etiquette').onclick = () => toast('弹幕礼仪：友善发言，理性讨论 AI');
    bar.querySelectorAll('.dm-colors .c').forEach((c) => (c.onclick = () => {
      dmColor = c.dataset.c;
      bar.querySelectorAll('.dm-colors .c').forEach((x) => x.classList.toggle('on', x === c));
    }));
  }
  function bindSwitch(bar) {
    bar.querySelector('.dm-switch').onclick = () => {
      dmOn = !dmOn;
      player?.setDanmaku(dmOn);
      renderSendingBar(true);
    };
  }

  // ─────────── 工具栏：点赞 / 投币 / 收藏 / 分享 ───────────
  const counts = () => ({
    like: V.stat.like + (act.like ? 1 : 0),
    coin: V.stat.coin + act.coins,
    fav: V.stat.favorite + (act.favs.length ? 1 : 0),
    share: V.stat.share + (act.shared ? 1 : 0),
  });
  function renderToolbar() {
    const tb = document.getElementById('toolbar');
    const c = counts();
    tb.innerHTML = `
      <div class="toolbar-left">
        <div class="toolbar-item like triple ${act.like ? 'on' : ''}" data-k="like" title="点赞（Q）&#10;长按可一键三连"><span class="icon-wrap">${ring}${ICO.like}</span><span class="info-text">${U.num(c.like)}</span></div>
        <div class="toolbar-item coin triple ${act.coins ? 'on' : ''}" data-k="coin" title="投币（W）"><span class="icon-wrap">${ring}${ICO.coin}</span><span class="info-text">${U.num(c.coin)}</span></div>
        <div class="toolbar-item fav triple ${act.favs.length ? 'on' : ''}" data-k="fav" title="收藏（E）"><span class="icon-wrap">${ring}${ICO.fav}</span><span class="info-text">${U.num(c.fav)}</span></div>
        <div class="toolbar-item share" data-k="share"><span class="icon-wrap">${ICO.share}</span><span class="info-text">${U.num(c.share)}</span>
          <div class="share-pop pop-card">
            <div class="share-link" data-share="copy"><span class="ic" style="background:#00aeec"><svg viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></span>复制视频链接</div>
            <div class="share-link" data-share="embed"><span class="ic" style="background:#7a5cff"><svg viewBox="0 0 16 16" fill="none"><path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>复制嵌入代码</div>
            <div class="share-link" data-share="bili"><span class="ic" style="background:#fb7299"><svg viewBox="0 0 16 16" fill="none"><rect x="2.5" y="4" width="11" height="8.5" rx="2" stroke="#fff" stroke-width="1.4"/><path d="M5.5 2.5L7 4M10.5 2.5L9 4M6 8h.01M10 8h.01" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg></span>复制 bilibili 原链接</div>
            <div class="share-link" data-share="repost"><span class="ic" style="background:#ff9212"><svg viewBox="0 0 16 16" fill="none"><path d="M9.5 3l4 3.8-4 3.7V8.3C6 8.3 4 9.2 2.5 11.5 3 8 5 5.8 9.5 5.3z" fill="#fff"/></svg></span>转发到动态</div>
            <div class="share-sep"></div>
            <div class="share-platforms">
              <span data-share="weibo" title="分享到微博"><i style="background:#f5503d">微</i>微博</span>
              <span data-share="qzone" title="分享到 QQ 空间"><i style="background:#fdbe3d">Q</i>QQ空间</span>
            </div>
          </div>
        </div>
      </div>
      <div class="toolbar-right">
        <a href="javascript:;" data-t="稿件投诉已提交，感谢反馈"><svg viewBox="0 0 16 16" fill="none"><path d="M3.5 14V2.5M3.5 3h8l-1.5 3 1.5 3h-8" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>稿件投诉</a>
        <a href="javascript:;" data-t="笔记功能开发中"><svg viewBox="0 0 16 16" fill="none"><path d="M10.5 2.5l3 3L6 13H3v-3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>记笔记</a>
        <a href="https://www.bilibili.com/video/${bvid}" target="_blank" rel="noopener" title="在 bilibili 打开原视频"><svg viewBox="0 0 16 16" fill="none"><path d="M9 2.5h4.5V7M13.5 2.5L7.5 8.5M12 10v2.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1H6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>原视频</a>
      </div>`;
    bindToolbar(tb);
  }
  function updateCounts() {
    const c = counts();
    const tb = document.getElementById('toolbar');
    for (const k of ['like', 'coin', 'fav', 'share']) {
      const el = tb.querySelector(`[data-k="${k}"] .info-text`);
      if (el) el.textContent = U.num(c[k]);
    }
    tb.querySelector('[data-k="like"]').classList.toggle('on', act.like);
    tb.querySelector('[data-k="coin"]').classList.toggle('on', act.coins > 0);
    tb.querySelector('[data-k="fav"]').classList.toggle('on', act.favs.length > 0);
  }
  function pop(k, plus) {
    const item = document.querySelector(`#toolbar [data-k="${k}"]`);
    item.classList.remove('pop'); void item.offsetWidth; item.classList.add('pop');
    setTimeout(() => item.classList.remove('pop'), 900);
    const wrap = item.querySelector('.icon-wrap');
    const b = U.h('<span class="burst"></span>');
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10, r = 22 + Math.random() * 8;
      b.insertAdjacentHTML('beforeend', `<i style="--dx:${(Math.cos(a) * r).toFixed(1)}px;--dy:${(Math.sin(a) * r).toFixed(1)}px"></i>`);
    }
    wrap.appendChild(b);
    setTimeout(() => b.remove(), 700);
    if (plus) { const p = U.h(`<span class="plus-one">${plus}</span>`); item.appendChild(p); setTimeout(() => p.remove(), 800); }
  }

  function toggleLike() {
    act.like = !act.like;
    Store.save();
    updateCounts();
    if (act.like) { pop('like', '+1'); } else toast('已取消点赞');
  }

  // 一键三连：长按点赞 → 三个按钮同时出现蓄力环 → 蓄满后全部点亮
  const HOLD_DELAY = 280, CHARGE_MS = 1200;
  let holdTimer = 0, chargeTimer = 0, pressing = false, charging = false, tripled = false;
  function pressStart() {
    if (pressing) return;
    pressing = true; charging = false; tripled = false;
    holdTimer = setTimeout(() => {
      charging = true;
      const tb = document.getElementById('toolbar');
      tb.style.setProperty('--charge-ms', CHARGE_MS + 'ms');
      tb.classList.add('is-charging');
      chargeTimer = setTimeout(() => { tripled = true; endCharge(); triple(); }, CHARGE_MS);
    }, HOLD_DELAY);
  }
  function pressEnd(cancelOnly) {
    if (!pressing) return;
    pressing = false;
    clearTimeout(holdTimer);
    if (tripled) return;                                  // 已完成三连，松手不再触发点赞
    if (charging) { clearTimeout(chargeTimer); endCharge(); return; } // 蓄力中途松手：取消
    if (!cancelOnly) toggleLike();                        // 短按：普通点赞
  }
  function endCharge() {
    charging = false;
    document.getElementById('toolbar').classList.remove('is-charging');
  }
  function triple() {
    const s = Store.get();
    const done = { like: false, coin: 0, fav: false };
    if (!act.like) { act.like = true; done.like = true; }
    const want = 2 - act.coins;
    const can = Math.min(want, Math.floor(s.coins));
    if (can > 0) { act.coins += can; s.coins = Math.round((s.coins - can) * 10) / 10; done.coin = can; }
    if (!act.favs.length) {
      const f = s.folders[0];
      if (!f.items.some((x) => x.bvid === bvid)) f.items.unshift({ ...U.snap({ ...V, mid: V.owner.mid }), t: Date.now() });
      act.favs = [f.id]; done.fav = true;
    }
    Store.save();
    updateCounts();
    if (!done.like && !done.coin && !done.fav) {
      return toast(want > 0 && Math.floor(s.coins) <= 0 ? '硬币不足，已经点赞并收藏啦' : '已经三连过啦～');
    }
    ['like', 'coin', 'fav'].forEach((k, i) => setTimeout(() => pop(k, k === 'coin' && done.coin ? `+${done.coin}` : k === 'like' && done.like ? '+1' : ''), i * 140));
    const left = document.querySelector('#toolbar .toolbar-left');
    left.style.position = 'relative';
    const cel = U.h(`<div class="triple-celebrate">${mascot({ mood: 'wow' })}<span>三连成功！感谢支持 UP 主～</span></div>`);
    left.appendChild(cel);
    setTimeout(() => cel.remove(), 2500);
    if (want > 0 && can < want) setTimeout(() => toast('硬币余额不足，本次只投了 ' + can + ' 枚'), 600);
  }

  function bindToolbar(tb) {
    const like = tb.querySelector('[data-k="like"]');
    like.addEventListener('pointerdown', (e) => { if (e.button === 0) { e.preventDefault(); pressStart(); } });
    like.addEventListener('pointerup', () => pressEnd(false));
    like.addEventListener('pointerleave', () => pressEnd(true));
    like.addEventListener('pointercancel', () => pressEnd(true));
    like.addEventListener('contextmenu', (e) => e.preventDefault());
    tb.querySelector('[data-k="coin"]').onclick = openCoin;
    tb.querySelector('[data-k="fav"]').onclick = openFav;
    tb.querySelectorAll('[data-share]').forEach((el) => (el.onclick = (e) => { e.stopPropagation(); share(el.dataset.share); }));
    tb.querySelectorAll('[data-t]').forEach((el) => (el.onclick = () => toast(el.dataset.t)));
  }

  async function share(kind) {
    const snapV = { ...V, mid: V.owner.mid };
    const markShared = () => { if (!act.shared) { act.shared = true; Store.save(); updateCounts(); pop('share'); } };
    if (kind === 'repost') return Ali.repost(snapV, markShared);
    if (kind === 'weibo' || kind === 'qzone') { Ali.shareOut(kind, snapV); return markShared(); }
    const text = {
      copy: `【${V.title}】 ${location.origin}/video/${bvid}`,
      bili: `【${V.title}】 https://www.bilibili.com/video/${bvid}`,
      embed: `<iframe src="https://player.bilibili.com/player.html?bvid=${bvid}&cid=${cid}" scrolling="no" frameborder="no" allowfullscreen="true"></iframe>`,
    }[kind];
    try {
      await navigator.clipboard.writeText(text);
      toast(kind === 'embed' ? '嵌入代码已复制' : kind === 'bili' ? 'bilibili 原链接已复制，发给朋友吧' : '链接已复制，快去分享吧');
      markShared();
    } catch { toast('复制失败，请手动复制地址栏链接'); }
  }

  // 投币弹窗
  const coinIllus = (n) => `<svg class="illus" viewBox="0 0 110 110" fill="none">
      <ellipse cx="55" cy="100" rx="34" ry="5" fill="#000" opacity=".06"/>
      <g transform="translate(18 34) scale(1.12)">${mascot({ mood: n === 2 ? 'wow' : 'happy' }).replace(/<\/?svg[^>]*>/g, '')}</g>
      ${n >= 1 ? `<g class="coin-b"><circle cx="${n === 2 ? 34 : 55}" cy="22" r="14" fill="#ffb027" stroke="#f59a00" stroke-width="2"/><path d="M${n === 2 ? 29.5 : 50.5} 28.5L${n === 2 ? 34 : 55} 15.5l4.5 13M${n === 2 ? 31 : 52} 24.5h6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>` : ''}
      ${n === 2 ? '<g class="coin-b b2"><circle cx="76" cy="22" r="14" fill="#ffb027" stroke="#f59a00" stroke-width="2"/><path d="M71.5 28.5L76 15.5l4.5 13M73 24.5h6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>' : ''}
    </svg>`;
  function openCoin() {
    const s = Store.get();
    if (act.coins >= 2) return toast('已经投满 2 枚硬币啦，感谢支持');
    if (s.coins < 1) return toast('硬币不足');
    const today = new Date().toDateString();
    if (s.coinExpDay !== today) { s.coinExpDay = today; s.coinExpToday = 0; }
    const max = Math.min(2 - act.coins, Math.floor(s.coins));
    let n = max;
    const m = modal(`<div class="coin-modal">
        <div class="title">给UP主投上<b id="coin-n">${n}</b>枚硬币</div>
        <div class="sub">${act.coins ? '已为本视频投过 1 枚硬币，还可以再投 1 枚' : '每个视频最多可投 2 枚硬币'}</div>
        <div class="coin-options">
          <div class="coin-option ${n === 1 ? 'on' : ''}" data-n="1">${coinIllus(1)}<div class="label">1硬币</div></div>
          <div class="coin-option ${n === 2 ? 'on' : ''} ${max < 2 ? 'disabled' : ''}" data-n="2">${coinIllus(2)}<div class="label">2硬币</div></div>
        </div>
        <label class="ali-checkbox like-check"><input type="checkbox" ${act.like ? 'disabled' : 'checked'} id="coin-like"><span class="box">${I.check}</span>${act.like ? '已点赞' : '同时点赞内容'}</label>
        <div><button class="btn-primary" id="coin-ok">确定</button></div>
        <div class="foot">硬币余额 <b>${s.coins}</b> · 经验值 +${n * 10}（今日 ${Math.min(50, (s.coinExpToday || 0))}/50）</div>
      </div>`, { width: 460 });
    m.el.querySelectorAll('.coin-option').forEach((o) => (o.onclick = () => {
      if (o.classList.contains('disabled')) return toast(max < 2 && act.coins ? '本视频最多再投 1 枚' : '硬币不足');
      n = Number(o.dataset.n);
      m.el.querySelectorAll('.coin-option').forEach((x) => x.classList.toggle('on', x === o));
      m.el.querySelector('#coin-n').textContent = n;
      m.el.querySelector('.foot').innerHTML = `硬币余额 <b>${s.coins}</b> · 经验值 +${n * 10}`;
    }));
    m.el.querySelector('#coin-ok').onclick = () => {
      const alsoLike = m.el.querySelector('#coin-like').checked && !act.like;
      act.coins += n;
      s.coins = Math.round((s.coins - n) * 10) / 10;
      s.coinExpToday = (s.coinExpToday || 0) + n * 10;
      if (alsoLike) act.like = true;
      Store.save();
      m.close();
      updateCounts();
      pop('coin', `+${n}`);
      if (alsoLike) setTimeout(() => pop('like', '+1'), 150);
      toast('投币成功', { icon: I.coinSmall });
    };
  }

  // 收藏弹窗
  function openFav() {
    const s = Store.get();
    const initial = new Set(s.folders.filter((f) => f.items.some((x) => x.bvid === bvid)).map((f) => f.id));
    const sel = new Set(initial);
    const m = modal(`<div class="fav-modal">
        <div class="title">添加到收藏夹</div>
        <div class="fav-list" id="fav-list"></div>
        <div class="fav-new" id="fav-new"><div class="add-link"><svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>新建收藏夹</div></div>
        <div class="footer"><button class="btn-primary" id="fav-ok" disabled>确定</button></div>
      </div>`, { width: 420 });
    const list = m.el.querySelector('#fav-list');
    const okBtn = m.el.querySelector('#fav-ok');
    const same = () => sel.size === initial.size && [...sel].every((x) => initial.has(x));
    const draw = () => {
      list.innerHTML = s.folders.map((f) => `<div class="fav-row"><label class="ali-checkbox"><input type="checkbox" data-id="${f.id}" ${sel.has(f.id) ? 'checked' : ''}><span class="box">${I.check}</span><span class="name">${U.esc(f.name)}</span><span class="count">${f.items.length + (sel.has(f.id) && !initial.has(f.id) ? 1 : 0) - (!sel.has(f.id) && initial.has(f.id) ? 1 : 0)}/1000</span></label>${f.private ? '<span class="priv">私密</span>' : ''}</div>`).join('');
      list.querySelectorAll('input').forEach((inp) => (inp.onchange = () => {
        inp.checked ? sel.add(inp.dataset.id) : sel.delete(inp.dataset.id);
        okBtn.disabled = same();
        draw();
      }));
    };
    draw();
    const nf = m.el.querySelector('#fav-new');
    const addLink = '<div class="add-link"><svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>新建收藏夹</div>';
    nf.querySelector('.add-link').onclick = function openNew() {
      nf.innerHTML = '<div class="add-row"><input type="text" maxlength="20" placeholder="最多可输入20个字"><button>新建</button></div>';
      const inp = nf.querySelector('input'); inp.focus();
      const create = () => {
        const name = inp.value.trim();
        if (!name) return toast('请输入收藏夹名称');
        const id = 'f' + Date.now();
        s.folders.push({ id, name, items: [], private: false });
        Store.save(); sel.add(id); okBtn.disabled = same(); draw();
        nf.innerHTML = addLink;
        nf.querySelector('.add-link').onclick = openNew;
      };
      nf.querySelector('button').onclick = create;
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') create(); });
    };
    okBtn.onclick = () => {
      for (const f of s.folders) {
        const has = f.items.some((x) => x.bvid === bvid);
        if (sel.has(f.id) && !has) f.items.unshift({ ...U.snap({ ...V, mid: V.owner.mid }), t: Date.now() });
        if (!sel.has(f.id) && has) f.items = f.items.filter((x) => x.bvid !== bvid);
      }
      const was = act.favs.length > 0;
      act.favs = [...sel];
      Store.save();
      m.close();
      updateCounts();
      if (act.favs.length && !was) { pop('fav', '+1'); toast('收藏成功'); }
      else if (!act.favs.length) toast('已取消收藏');
      else toast('收藏夹已更新');
    };
  }

  // 快捷键：Q 点赞（长按三连）/ W 投币 / E 收藏
  document.addEventListener('keydown', (e) => {
    if (!V || e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'q' && !e.repeat) pressStart();
    if (k === 'w' && !e.repeat) openCoin();
    if (k === 'e' && !e.repeat) openFav();
  });
  document.addEventListener('keyup', (e) => { if (e.key.toLowerCase() === 'q') pressEnd(false); });

  // ─────────── 简介 / 标签 ───────────
  function renderDesc() {
    const el = document.getElementById('desc');
    const text = (V.desc || '').trim() || '-';
    const linked = U.esc(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--brand-blue)">$1</a>');
    el.innerHTML = `<div class="desc-info">${linked}</div>`;
    const info = el.querySelector('.desc-info');
    if (info.scrollHeight > 100) {
      const t = U.h('<div class="toggle-btn">展开更多</div>');
      t.onclick = () => { el.classList.toggle('open'); t.textContent = el.classList.contains('open') ? '收起' : '展开更多'; };
      el.appendChild(t);
    }
  }
  function renderTags() {
    const el = document.getElementById('tags');
    const tags = [...new Set(V.tags || [])];
    el.innerHTML = (V.tname ? `<a class="tag-link topic" href="/?q=${encodeURIComponent(V.tname)}"><svg viewBox="0 0 14 14" fill="none"><path d="M5.5 2L4 12M10 2L8.5 12M2.5 5h9.5M2 9h9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>${U.esc(V.tname)}</a>` : '')
      + tags.map((t) => `<a class="tag-link" href="/?q=${encodeURIComponent(t)}">${U.esc(t)}</a>`).join('');
  }

  // ─────────── UP 主信息 ───────────
  function renderUp() {
    const c = V.card || {};
    const off = c.official?.type;
    const el = document.getElementById('up-panel');
    el.innerHTML = `
      <a class="up-avatar-wrap" href="/?mid=${V.owner.mid}"><img src="${U.img(V.owner.face, '96w_96h_1c')}" alt="">${off === 1 ? '<span class="verify org" title="机构认证">⚡</span>' : off === 0 ? '<span class="verify person" title="个人认证">⚡</span>' : ''}</a>
      <div class="up-info--right">
        <div class="up-info__detail">
          <a class="up-name ${c.vip ? 'vip' : ''}" href="/?mid=${V.owner.mid}" title="${U.esc(V.owner.name)}">${U.esc(V.owner.name)}</a>
          <a class="send-msg" href="javascript:;" data-t="私信功能暂未开放"><svg viewBox="0 0 16 16" fill="none"><rect x="2" y="3.5" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 6L8 8.3 11.5 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>发消息</a>
        </div>
        <div class="up-description" title="${U.esc(c.official?.title || c.sign || '')}">${U.esc(c.official?.title || c.sign || (V.kind === 'official' ? 'AI 公司官方账号' : 'AI 博主'))}</div>
        <div class="upinfo-btn-panel">
          <button class="charge-btn" data-t="充电功能暂未开放，去 B 站给 UP 主充电吧"><svg viewBox="0 0 16 16" fill="none"><path d="M9 1.8L3.5 9H8l-1 5.2L12.5 7H8z" fill="currentColor"/></svg>充电</button>
          <button class="follow-btn" id="follow-btn"></button>
        </div>
      </div>`;
    el.querySelectorAll('[data-t]').forEach((x) => (x.onclick = () => toast(x.dataset.t)));
    // 未关注：点击直接关注；已关注：弹出“取消关注”确认（与 B 站一致）
    const fb = el.querySelector('#follow-btn');
    fb.onclick = (e) => {
      e.stopPropagation();
      if (!Store.isFollow(V.owner.mid)) { Store.toggleFollow(V.owner.mid); renderUpFollow(); toast('关注成功'); return; }
      if (el.querySelector('.unfollow-menu')) return;
      const menu = U.h('<div class="unfollow-menu"><button>取消关注</button></div>');
      fb.parentElement.style.position = 'relative';
      fb.parentElement.appendChild(menu);
      menu.querySelector('button').onclick = (ev) => { ev.stopPropagation(); Store.toggleFollow(V.owner.mid); menu.remove(); renderUpFollow(); toast('已取消关注'); };
      setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }));
    };
    renderUpFollow();
  }
  function renderUpFollow() {
    const b = document.getElementById('follow-btn');
    if (!b) return;
    const on = Store.isFollow(V.owner.mid);
    const fans = (V.card?.fans || 0) + (on ? 1 : 0);
    b.classList.toggle('following', on);
    b.innerHTML = on ? `已关注 <span class="count">${U.num(fans)}</span>` : `+ 关注 <span class="count">${U.num(fans)}</span>`;
  }

  // ─────────── 弹幕列表 ───────────
  let dmBoxOpen = false;
  function renderDanmakuBox() {
    const el = document.getElementById('danmaku-box');
    const all = [...danmakuList, ...myDm()].sort((a, b) => a.t - b.t);
    dmRowTimes = all.slice(0, 1000).map((d) => d.t);
    const p = (x) => String(x).padStart(2, '0');
    const fmtTs = (ts) => { const d = new Date(ts * 1000); return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
    el.classList.toggle('open', dmBoxOpen);
    el.innerHTML = `
      <div class="danmaku-header"><span>弹幕列表 <span style="font-size:12px;font-weight:400;color:var(--text3)">${all.length ? `(${all.length})` : ''}</span></span>
        <span class="right"><svg viewBox="0 0 16 16" fill="none"><circle cx="3.5" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="12.5" cy="8" r="1.2" fill="currentColor"/></svg><svg class="arrow" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
      <div class="danmaku-body">
        <div class="dm-table-head"><span>时间</span><span>弹幕内容</span><span>发送时间</span></div>
        <div class="dm-rows">${all.length ? all.slice(0, 1000).map((d) => `<div class="dm-row ${d.mine ? 'mine' : ''}" title="${U.esc(d.text)}"><span>${U.dur(d.t)}</span><span class="txt">${U.esc(d.text)}</span><span class="ts">${fmtTs(d.ts)}</span></div>`).join('') : '<div style="padding:40px 0;text-align:center;color:var(--text3);font-size:12px">还没有弹幕，快来发一条吧～</div>'}</div>
        <div class="dm-footer">弹幕实时同步自 bilibili，共 ${danmakuList.length} 条</div>
      </div>`;
    el.querySelector('.danmaku-header').onclick = () => { dmBoxOpen = !dmBoxOpen; el.classList.toggle('open', dmBoxOpen); };
    el.querySelectorAll('.dm-row').forEach((r, i) => (r.onclick = () => {
      if (!player) return toast('当前为外链播放器，无法跳转');
      player.seek(dmRowTimes[i]);
    }));
  }
  // 弹幕列表跟随播放进度高亮当前行
  let dmRowTimes = [];
  let lastHi = -1;
  function highlightDmRow(t) {
    if (!dmBoxOpen || !dmRowTimes.length) return;
    let i = dmRowTimes.findIndex((x) => x > t) - 1;
    if (i < 0) i = t >= dmRowTimes[dmRowTimes.length - 1] ? dmRowTimes.length - 1 : -1;
    if (i === lastHi) return;
    const rows = document.querySelectorAll('#danmaku-box .dm-row');
    rows[lastHi]?.classList.remove('now');
    lastHi = i;
    const row = rows[i];
    if (!row) return;
    row.classList.add('now');
    const box = row.parentElement;
    if (!box.matches(':hover')) box.scrollTop = row.offsetTop - box.offsetTop - box.clientHeight / 2;
  }

  // ─────────── 视频选集（多 P）───────────
  function renderPod() {
    const el = document.getElementById('video-pod');
    if (!V.pages || V.pages.length < 2) { el.innerHTML = ''; el.className = ''; return; }
    const idx = V.pages.findIndex((p) => p.cid === cid);
    el.className = 'video-pod';
    el.innerHTML = `<div class="video-pod-header">视频选集<small>(${idx + 1}/${V.pages.length})</small></div>
      <div class="video-pod-list">${V.pages.map((p) => `<div class="pod-item ${p.cid === cid ? 'on' : ''}" data-cid="${p.cid}" data-page="${p.page}"><span class="part">P${p.page} ${U.esc(p.part)}</span><span class="d">${U.dur(p.duration)}</span></div>`).join('')}</div>`;
    el.querySelectorAll('.pod-item').forEach((it) => (it.onclick = () => {
      const newCid = Number(it.dataset.cid);
      if (newCid === cid) return;
      cid = newCid;
      history.replaceState(null, '', `/video/${bvid}${it.dataset.page === '1' ? '' : '?p=' + it.dataset.page}`);
      renderPod();
      if (player) { player.setDanmakuList([]); player.switchCid(cid); }
      else fallbackEmbed();
      loadDanmaku(); refreshOnline();
    }));
  }

  // ─────────── 推荐列表 ───────────
  async function loadRecommend() {
    const el = document.getElementById('recommend');
    let list = [];
    try { list = await U.api(`/api/related/${bvid}`); } catch {}
    related = list;
    const card = (v) => `<div class="video-page-card-small">
        <a class="pic-box" href="${U.videoUrl(v.bvid)}"><img src="${U.img(v.pic, '282w_160h_1c')}" loading="lazy" alt=""><span class="duration">${U.dur(v.duration)}</span></a>
        <div class="info">
          <a class="title" href="${U.videoUrl(v.bvid)}" title="${U.esc(v.title)}">${U.esc(v.title)}</a>
          <a class="upname" href="/?mid=${v.mid}">${I.up}<span>${U.esc(v.owner)}</span></a>
          <div class="playinfo"><span>${I.play}${U.num(v.stat?.view)}</span><span>${I.danmaku}${U.num(v.stat?.danmaku)}</span></div>
        </div></div>`;
    if (!list.length) { el.innerHTML = ''; return; }
    const autoKey = autoNextKey;
    let auto = autoNext();
    el.innerHTML = `
      <div class="rec-title">接下来播放<span class="autoplay">自动连播<span class="ali-switch ${auto ? 'on' : ''}" id="auto-sw"></span></span></div>
      <div class="rec-first">${card(list[0])}</div>
      <div id="rec-rest">${list.slice(1, 11).map(card).join('')}</div>
      ${list.length > 11 ? '<button class="rec-more" id="rec-more">展开</button>' : ''}`;
    el.querySelector('#auto-sw').onclick = (e) => {
      auto = !auto; e.currentTarget.classList.toggle('on', auto);
      try { localStorage.setItem(autoKey, auto ? '1' : '0'); } catch {}
      toast(auto ? '已开启自动连播' : '已关闭自动连播');
    };
    const more = el.querySelector('#rec-more');
    if (more) more.onclick = () => { el.querySelector('#rec-rest').insertAdjacentHTML('beforeend', list.slice(11).map(card).join('')); more.remove(); };
  }

  // ─────────── 评论 ───────────
  let replySort = 1, replyPage = 1, replyDone = false, replyLoading = false, replyTarget = null;
  function emoteText(msg, emote) {
    return U.esc(msg).replace(/\[[^\]]{1,20}\]/g, (m) => {
      const raw = m.replace(/&amp;/g, '&');
      return emote?.[raw] ? `<img class="emote" src="${U.img(emote[raw])}" alt="${m}">` : m;
    });
  }
  const liked = Store.get().liked;
  function replyHTML(r, { top = false, mine = false } = {}) {
    const lv = r.member.level;
    const isUp = String(r.member.mid) === String(V.owner.mid);
    const on = liked[r.rpid];
    return `<div class="reply-item" data-rpid="${r.rpid}">
      <div class="root-avatar">${mine ? avatarSVG() : `<img src="${U.img(r.member.avatar, '96w_96h_1c')}" loading="lazy" alt="">`}</div>
      <div class="content-warp">
        <div class="user-info"><a class="user-name ${r.member.vip ? 'vip' : ''}" href="javascript:;">${U.esc(r.member.uname)}</a><span class="level-badge lv${lv}">LV${lv}</span>${isUp ? '<span class="up-badge">UP</span>' : ''}</div>
        <div class="reply-content">${top ? '<span class="top-tag">置顶</span>' : ''}${emoteText(r.message, r.emote)}</div>
        ${r.pictures?.length ? `<div class="reply-pics">${r.pictures.map((p) => `<img src="${U.img(p, '216w_216h_1c')}" loading="lazy" alt="">`).join('')}</div>` : ''}
        <div class="reply-info">
          <span>${U.fullDate(r.ctime).slice(0, 16)}</span>${r.location ? `<span>${U.esc(r.location.replace('IP属地：', ''))}</span>` : ''}
          <span class="like ${on ? 'on' : ''}" data-like="${r.rpid}" data-n="${r.like}"><svg viewBox="0 0 16 16"><path fill="currentColor" d="M5.6 6.6l2.2-4.2c.3-.5.9-.7 1.4-.6.9.3 1.3 1.1 1.1 2l-.4 2h3c1 0 1.7.9 1.5 1.9l-1.1 4.8c-.2.7-.8 1.2-1.5 1.2H5.6zM2.5 6.6h2V13.7h-2c-.5 0-.9-.4-.9-.9V7.5c0-.5.4-.9.9-.9z"/></svg><span class="n">${r.like + (on ? 1 : 0) || ''}</span></span>
          <span class="reply-btn" data-reply="${U.esc(r.member.uname)}">回复</span>
          ${r.upLike ? '<span class="up-liked">UP主觉得很赞</span>' : ''}
        </div>
        ${r.replies?.length ? `<div class="sub-reply-list">${r.replies.map((s) => `<div class="sub-reply-item"><span class="sub-avatar"><img src="${U.img(s.member.avatar, '48w_48h_1c')}" loading="lazy" alt=""></span><div><a class="user-name ${s.member.vip ? 'vip' : ''}" href="javascript:;">${U.esc(s.member.uname)}</a>${String(s.member.mid) === String(V.owner.mid) ? ' <span class="up-badge">UP</span>' : ''}&nbsp;<span class="reply-content">${emoteText(s.message, s.emote)}</span><div class="reply-info" style="margin-top:0"><span>${U.shortDate(s.ctime)}</span><span class="like ${liked[s.rpid] ? 'on' : ''}" data-like="${s.rpid}" data-n="${s.like}"><svg viewBox="0 0 16 16"><path fill="currentColor" d="M5.6 6.6l2.2-4.2c.3-.5.9-.7 1.4-.6.9.3 1.3 1.1 1.1 2l-.4 2h3c1 0 1.7.9 1.5 1.9l-1.1 4.8c-.2.7-.8 1.2-1.5 1.2H5.6zM2.5 6.6h2V13.7h-2c-.5 0-.9-.4-.9-.9V7.5c0-.5.4-.9.9-.9z"/></svg><span class="n">${s.like + (liked[s.rpid] ? 1 : 0) || ''}</span></span></div></div></div>`).join('')}
          ${r.rcount > r.replies.length ? `<div class="sub-reply-more">共${r.rcount}条回复，<b data-t="完整楼中楼请前往 bilibili 查看">点击查看</b></div>` : ''}</div>` : ''}
      </div></div>`;
  }
  function myReplyObj(msg) {
    const s = Store.get();
    return { rpid: 'me' + Date.now(), ctime: Math.floor(Date.now() / 1000), like: 0, rcount: 0, message: msg, emote: {}, pictures: [], member: { mid: 0, uname: s.name, level: s.level, vip: false }, replies: [] };
  }
  async function loadComments(reset) {
    const el = document.getElementById('comments');
    if (reset) {
      replyPage = 1; replyDone = false;
      el.innerHTML = `
        <div class="reply-header"><span class="reply-title">评论<span class="total" id="reply-total">${U.num(V.stat.reply)}</span></span>
          <div class="reply-sort"><span data-sort="1" class="${replySort === 1 ? 'on' : ''}">最热</span><i></i><span data-sort="0" class="${replySort === 0 ? 'on' : ''}">最新</span></div></div>
        <div class="reply-box"><div class="avatar">${avatarSVG()}</div><div class="reply-box-warp"><textarea placeholder="AI 圈友善发言，理性讨论每一个模型" maxlength="1000"></textarea>
          <div class="reply-box-actions"><span class="emoji-btn" title="表情"><svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.3"/><circle cx="5.8" cy="6.6" r=".9" fill="currentColor"/><circle cx="10.2" cy="6.6" r=".9" fill="currentColor"/><path d="M5.3 9.6a3 3 0 0 0 5.4 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></span><button class="send-btn">发布</button></div></div></div>
        <div id="my-replies">${(Store.get().myReplies[bvid] || []).map((r) => replyHTML(r, { mine: true })).join('')}</div>
        <div id="reply-list"></div><div class="reply-loading" id="reply-more"></div>`;
      bindComments(el);
    }
    if (replyDone || replyLoading) return;
    replyLoading = true;
    const more = document.getElementById('reply-more');
    more.textContent = '正在加载评论…';
    try {
      const d = await U.api(`/api/replies/${V.aid}?sort=${replySort}&pn=${replyPage}`);
      const list = document.getElementById('reply-list');
      if (replyPage === 1 && d.top) list.insertAdjacentHTML('beforeend', replyHTML(d.top, { top: true }));
      list.insertAdjacentHTML('beforeend', d.list.map((r) => replyHTML(r)).join(''));
      document.getElementById('reply-total').textContent = U.num(Math.max(d.count, V.stat.reply) + (Store.get().myReplies[bvid]?.length || 0));
      replyPage++;
      if (d.isEnd || replyPage > 10) {
        replyDone = true;
        more.className = 'reply-end';
        const shown = document.querySelectorAll('#reply-list .reply-item').length;
        const total = Math.max(d.count, V.stat.reply);
        more.innerHTML = !total
          ? '还没有评论，快来抢沙发吧～'
          : shown < total
            ? `未登录状态下 bilibili 仅开放部分评论 · <a href="https://www.bilibili.com/video/${bvid}#reply" target="_blank" rel="noopener" style="color:var(--brand-blue)">去 bilibili 查看全部 ${U.num(total)} 条评论 ›</a>`
            : '没有更多评论';
      } else more.textContent = '';
    } catch (e) {
      more.textContent = '评论加载失败，稍后再试';
      replyDone = true;
    } finally { replyLoading = false; }
  }
  function bindComments(el) {
    el.querySelectorAll('[data-sort]').forEach((s) => (s.onclick = () => { replySort = Number(s.dataset.sort); loadComments(true); }));
    const ta = el.querySelector('textarea');
    const btn = el.querySelector('.send-btn');
    ta.addEventListener('input', () => btn.classList.toggle('active', !!ta.value.trim()));
    btn.onclick = () => {
      const msg = ta.value.trim();
      if (!msg) return;
      const s = Store.get();
      const r = myReplyObj(replyTarget ? `回复 @${replyTarget} :${msg}` : msg);
      (s.myReplies[bvid] ||= []).unshift(r);
      Store.save();
      document.getElementById('my-replies').insertAdjacentHTML('afterbegin', replyHTML(r, { mine: true }));
      ta.value = ''; ta.placeholder = 'AI 圈友善发言，理性讨论每一个模型'; replyTarget = null; btn.classList.remove('active');
      toast('发送成功');
    };
    el.querySelector('.emoji-btn').onclick = () => { ta.value += ['(๑•̀ㅂ•́)و✧', '[doge]', '(ゝ∀･)', '🤖', '🚀'][Math.floor(Math.random() * 5)]; ta.dispatchEvent(new Event('input')); ta.focus(); };
    el.addEventListener('click', (e) => {
      const lk = e.target.closest('[data-like]');
      if (lk) {
        const id = lk.dataset.like;
        liked[id] = !liked[id]; if (!liked[id]) delete liked[id];
        Store.save();
        lk.classList.toggle('on', !!liked[id]);
        const n = Number(lk.dataset.n) + (liked[id] ? 1 : 0);
        lk.querySelector('.n').textContent = n || '';
      }
      const rp = e.target.closest('[data-reply]');
      if (rp) { replyTarget = rp.dataset.reply; ta.placeholder = `回复 @${replyTarget} :`; ta.focus(); ta.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      const t = e.target.closest('[data-t]');
      if (t) toast(t.dataset.t);
    });
    new IntersectionObserver((es) => es[0].isIntersecting && loadComments(false), { rootMargin: '400px' }).observe(document.getElementById('reply-more'));
  }
})();
