/* AliAli 个人空间：动态 / 关注 / 收藏 / 历史记录 / 稍后再看（数据均保存在本地浏览器） */
(function () {
  'use strict';
  const { I, U, Store, toast, modal, mascot, avatarSVG, renderHeader, renderPalette, footer, repost } = window.Ali;
  renderHeader(document.getElementById('header-bar-mount'), { solid: true });
  renderPalette();
  document.getElementById('footer').innerHTML = footer();
  const S = () => Store.get();

  const TABS = [
    { id: 'dynamic', name: '动态', icon: I.dynamic },
    { id: 'follow', name: '关注', icon: '<svg viewBox="0 0 20 20" fill="none"><circle cx="8" cy="7" r="3.2" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 16.5c.7-2.8 3-4.4 5.5-4.4s4.8 1.6 5.5 4.4M14.5 6v5M12 8.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', count: () => S().follows.length },
    { id: 'fav', name: '收藏', icon: I.fav, count: () => S().folders.reduce((n, f) => n + f.items.length, 0) },
    { id: 'history', name: '历史记录', icon: I.history, count: () => S().history.length },
    { id: 'later', name: '稍后再看', icon: I.clock.replace('<svg', '<svg class="right-entry-icon"'), count: () => S().later.length },
  ];
  const tabFromHash = () => (TABS.some((t) => t.id === location.hash.slice(1)) ? location.hash.slice(1) : 'dynamic');
  let tab = tabFromHash();
  let ups = [];
  let feed = [];

  // ─────────── 头部 ───────────
  function renderHead() {
    const s = S();
    const pattern = Array.from({ length: 14 }, (_, i) => `<g transform="translate(${(i % 7) * 190 + (i > 6 ? 95 : 0) + 20} ${i > 6 ? 96 : 12}) rotate(${i % 2 ? 12 : -10}) scale(1.1)">${mascot().replace(/<\/?svg[^>]*>/g, '')}</g>`).join('');
    document.getElementById('space-head').innerHTML = `
      <div class="pattern"><svg viewBox="0 0 1280 180" preserveAspectRatio="xMidYMid slice">${pattern}</svg></div>
      <div class="h-inner">
        <div class="h-avatar">${avatarSVG()}</div>
        <div>
          <div class="h-name">${U.esc(s.name)}<span class="level-badge lv${s.level}">LV${s.level}</span></div>
          <div class="h-sign" contenteditable="true" spellcheck="false" title="点击编辑个性签名">${U.esc(s.sign || '这个人很懒，只看 AI 圈～（点击编辑签名）')}</div>
        </div>
        <div class="h-stats">
          <a href="#follow"><b>${s.follows.length}</b><span>关注</span></a>
          <a href="#fav"><b>${s.folders.reduce((n, f) => n + f.items.length, 0)}</b><span>收藏</span></a>
          <a href="#history"><b>${s.history.length}</b><span>观看</span></a>
          <a href="javascript:;" title="每天首次访问 +1"><b>${s.coins}</b><span>硬币</span></a>
        </div>
      </div>`;
    const sign = document.querySelector('.h-sign');
    sign.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sign.blur(); } });
    sign.addEventListener('blur', () => {
      const v = sign.textContent.trim().slice(0, 60);
      if (v && v !== s.sign && !v.startsWith('这个人很懒')) { s.sign = v; Store.save(); toast('签名已更新'); }
    });
  }
  function renderNav() {
    document.getElementById('space-nav').innerHTML = TABS.map((t) => `<a href="#${t.id}" class="${t.id === tab ? 'on' : ''}">${t.icon.replace(/class="right-entry-icon"/, '')}${t.name}${t.count ? `<span class="n">${t.count()}</span>` : ''}</a>`).join('');
  }
  window.addEventListener('hashchange', () => { tab = tabFromHash(); render(); scrollTo({ top: 0 }); });

  // ─────────── 公共片段 ───────────
  const empty = (text, extra = '') => `<div class="space-empty">${mascot({ mood: 'sad' })}<div>${text}</div>${extra}</div>`;
  const progressOf = (h) => {
    const all = (() => { try { return JSON.parse(localStorage.getItem('aliali:progress')) || {}; } catch { return {}; } })();
    const t = all[`${h.bvid}:${h.cid}`];
    if (t === -1) return { pct: 100, text: '已看完', done: true };
    if (t > 0 && h.duration) return { pct: Math.min(100, (t / h.duration) * 100), text: `看到 ${U.dur(t)}` };
    return { pct: 0, text: '刚刚打开' };
  };
  const vCard = (v, { remove, badge } = {}) => `<div class="v-card" data-bvid="${v.bvid}">
      <a class="cover" href="${U.videoUrl(v.bvid)}"><img src="${U.img(v.pic, '412w_232h_1c')}" loading="lazy" alt=""><span class="dur">${U.dur(v.duration)}</span>${badge ? `<span class="badge-watched">${badge}</span>` : ''}</a>
      ${remove ? `<button class="remove" data-remove="${v.bvid}">${remove}</button>` : ''}
      <a class="title" href="${U.videoUrl(v.bvid)}" title="${U.esc(v.title)}">${U.esc(v.title)}</a>
      <div class="meta">${I.up}<a href="/?mid=${v.mid}">${U.esc(v.owner)}</a>${v.t ? ` · ${U.shortDate(v.t / 1000)}` : ''}</div>
    </div>`;
  const fbtn = (mid) => `<div class="fbtn-wrap"><button class="fbtn ${Store.isFollow(mid) ? 'following' : ''}" data-follow="${mid}">${Store.isFollow(mid) ? '已关注' : '+ 关注'}</button></div>`;

  // 关注按钮：未关注 → 直接关注；已关注 → 弹出“取消关注”确认
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.fbtn-menu').forEach((m) => { if (!m.contains(e.target)) m.remove(); });
    const b = e.target.closest('[data-follow]');
    if (!b) return;
    const mid = Number(b.dataset.follow);
    if (!Store.isFollow(mid)) {
      Store.toggleFollow(mid);
      toast('关注成功');
      render();
      return;
    }
    if (b.parentElement.querySelector('.fbtn-menu')) return;
    const menu = U.h('<div class="fbtn-menu"><button>取消关注</button></div>');
    b.parentElement.appendChild(menu);
    menu.querySelector('button').onclick = (ev) => { ev.stopPropagation(); Store.toggleFollow(mid); toast('已取消关注'); render(); };
  });

  // ─────────── 动态 ───────────
  let dynFilter = 'all';
  function renderDynamic(main) {
    const s = S();
    const upMap = new Map(ups.map((u) => [u.mid, u]));
    const videoItems = feed.filter((v) => s.follows.includes(v.mid)).map((v) => ({ kind: 'video', t: v.pubdate * 1000, v }));
    const repostItems = s.reposts.map((r) => ({ kind: 'repost', t: r.t, r }));
    let items = dynFilter === 'video' ? videoItems : dynFilter === 'repost' ? repostItems : [...videoItems, ...repostItems];
    items = items.sort((a, b) => b.t - a.t).slice(0, 60);
    const statLine = (v) => `<div class="vs"><span>${I.play}${U.num(v.stat?.view ?? v.view)}</span><span>${I.danmaku}${U.num(v.stat?.danmaku ?? v.danmaku)}</span></div>`;
    const card = (v, cls = '') => `<a class="dyn-video ${cls}" href="${U.videoUrl(v.bvid)}"><div class="cover"><img src="${U.img(v.pic, '408w_230h_1c')}" loading="lazy" alt=""><span class="dur">${U.dur(v.duration)}</span></div>
        <div class="vi">${cls ? `<div style="font-size:13px;color:var(--brand-blue);margin-bottom:2px">@${U.esc(v.owner)}</div>` : ''}<div class="vt">${U.esc(v.title)}</div>${v.desc ? `<div class="vd">${U.esc(v.desc)}</div>` : ''}${statLine(v)}</div></a>`;
    const html = items.map((it) => {
      if (it.kind === 'video') {
        const up = upMap.get(it.v.mid) || {};
        return `<div class="dyn-item"><a class="av" href="/?mid=${it.v.mid}">${up.face ? `<img src="${U.img(up.face, '96w_96h_1c')}" alt="">` : ''}</a><div class="body">
          <a class="who ${up.vip ? 'pink' : ''}" href="/?mid=${it.v.mid}">${U.esc(it.v.owner)}</a><div class="when">${U.feedDate(it.v.pubdate)} · 投稿了视频</div>
          ${card(it.v)}
          <div class="dyn-ops"><a data-repost="${it.v.bvid}"><svg viewBox="0 0 16 16" fill="none"><path d="M9.5 3l4 3.8-4 3.7V8.3C6 8.3 4 9.2 2.5 11.5 3 8 5 5.8 9.5 5.3z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>转发</a><a href="${U.videoUrl(it.v.bvid)}#reply">${I.danmaku}评论</a></div>
        </div></div>`;
      }
      const r = it.r;
      return `<div class="dyn-item"><div class="av">${avatarSVG()}</div><div class="body">
          <div class="who pink">${U.esc(s.name)}</div><div class="when">${U.shortDate(r.t / 1000)} · 转发了视频</div>
          <div class="text">${r.text ? U.esc(r.text) : '<span style="color:var(--text3)">转发动态</span>'}</div>
          ${card(r.video, 'repost')}
          <div class="dyn-ops"><a data-del-repost="${r.id}"><svg viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>删除</a></div>
        </div></div>`;
    }).join('');
    const recs = ups.filter((u) => !s.follows.includes(u.mid)).sort((a, b) => (b.fans || 0) - (a.fans || 0)).slice(0, 8);
    main.innerHTML = `<div class="dyn-layout">
      <div class="dyn-main panel">
        <div class="dyn-tabs">${[['all', '全部'], ['video', '视频投稿'], ['repost', '我的转发']].map(([k, n]) => `<a data-dyn="${k}" class="${dynFilter === k ? 'on' : ''}">${n}</a>`).join('')}</div>
        ${html || (dynFilter !== 'repost' && !s.follows.length
          ? empty('还没有关注任何 UP 主', '<div style="margin-top:6px;font-size:13px">关注右侧推荐的 AI 博主 / 官方账号后，他们的新投稿会实时出现在这里</div>')
          : empty(dynFilter === 'repost' ? '还没有转发过视频，在视频页点“分享 → 转发到动态”试试' : '关注的 UP 主最近没有新投稿'))}
      </div>
      <div class="dyn-side">
        <div class="panel rec-ups"><div class="panel-title" style="font-size:16px">推荐关注<small>AI 圈</small></div>
          ${recs.map((u) => `<div class="rec-up"><a href="/?mid=${u.mid}"><img src="${U.img(u.face, '80w_80h_1c')}" alt=""></a><div class="nm"><a href="/?mid=${u.mid}">${U.esc(u.name)}</a><small>${U.esc(u.official?.title || u.sign || '')}</small></div>${fbtn(u.mid)}</div>`).join('') || '<div style="font-size:13px;color:var(--text3)">名单里的 UP 主都已关注啦</div>'}
        </div>
      </div></div>`;
    main.querySelectorAll('[data-dyn]').forEach((a) => (a.onclick = () => { dynFilter = a.dataset.dyn; render(); }));
    main.querySelectorAll('[data-repost]').forEach((a) => (a.onclick = () => repost(feed.find((v) => v.bvid === a.dataset.repost), render)));
    main.querySelectorAll('[data-del-repost]').forEach((a) => (a.onclick = () => {
      if (!confirm('确定删除这条转发动态吗？')) return;
      s.reposts = s.reposts.filter((r) => r.id !== a.dataset.delRepost); Store.save(); toast('已删除'); render();
    }));
  }

  // ─────────── 关注 ───────────
  function renderFollow(main) {
    const s = S();
    const upMap = new Map(ups.map((u) => [u.mid, u]));
    const followed = s.follows.map((mid) => upMap.get(mid) || { mid, name: 'UP 主 ' + mid });
    const recs = ups.filter((u) => !s.follows.includes(u.mid));
    const item = (u) => `<div class="follow-item">
        <a class="av" href="/?mid=${u.mid}"><img src="${U.img(u.face, '112w_112h_1c')}" alt="">${u.official?.type === 1 ? '<span class="verify org">⚡</span>' : u.official?.type === 0 ? '<span class="verify person">⚡</span>' : ''}</a>
        <div class="body"><a class="name ${u.vip ? 'vip' : ''}" href="/?mid=${u.mid}">${U.esc(u.name)}</a>${u.kind ? `<span class="kind ${u.kind}">${u.kind === 'official' ? '官方' : 'AI 博主'}</span>` : ''}
          <div class="desc">${U.esc(u.official?.title || u.sign || '')}</div>
          <div class="desc">${U.num(u.fans)} 粉丝 · AliAli 收录 ${u.videos || 0} 个视频</div></div>
        ${fbtn(u.mid)}</div>`;
    main.innerHTML = `
      <div class="panel"><div class="panel-title"><span>我的关注<small>${followed.length} 个 UP 主</small></span></div>
        ${followed.length ? `<div class="follow-list">${followed.map(item).join('')}</div>` : empty('还没有关注 UP 主，从下面的 AI 圈推荐开始吧')}</div>
      ${recs.length ? `<div class="panel"><div class="panel-title"><span>AI 圈推荐关注<small>AliAli 收录的博主与官方账号</small></span></div><div class="follow-list">${recs.map(item).join('')}</div></div>` : ''}`;
  }

  // ─────────── 收藏 ───────────
  let folderId = 'default';
  function renderFav(main) {
    const s = S();
    if (!s.folders.some((f) => f.id === folderId)) folderId = s.folders[0].id;
    const f = s.folders.find((x) => x.id === folderId);
    main.innerHTML = `<div class="fav-layout">
      <div class="fav-side">
        <div class="side-title"><span>我创建的收藏夹</span><a data-new-folder>+ 新建</a></div>
        ${s.folders.map((x) => `<div class="fav-folder ${x.id === folderId ? 'on' : ''}" data-folder="${x.id}"><span class="name">${U.esc(x.name)}${x.private ? ' 🔒' : ''}</span><span class="cnt">${x.items.length}</span></div>`).join('')}
      </div>
      <div class="fav-content panel">
        <div class="folder-head">
          <div class="folder-cover">${f.items[0] ? `<img src="${U.img(f.items[0].pic, '320w_200h_1c')}" alt="">` : mascot()}</div>
          <div><h3>${U.esc(f.name)}</h3><div class="desc">${f.items.length} 个内容 · ${f.private ? '私密' : '公开'}${f.id === 'default' ? ' · 默认收藏夹' : ''}</div>
            <div class="ops">
              ${f.items.length ? `<a class="btn-blue" style="display:inline-flex;align-items:center" href="${U.videoUrl(f.items[0].bvid)}">播放全部</a>` : ''}
              <button class="btn-ghost" data-rename>重命名</button>
              <button class="btn-ghost" data-private>${f.private ? '设为公开' : '设为私密'}</button>
              ${f.id !== 'default' ? '<button class="btn-ghost danger" data-del-folder>删除收藏夹</button>' : ''}
            </div></div>
        </div>
        ${f.items.length ? `<div class="v-grid">${f.items.map((v) => vCard(v, { remove: '取消收藏' })).join('')}</div>` : empty('这个收藏夹还是空的，在视频页点“收藏”或长按点赞一键三连试试')}
      </div></div>`;
    main.querySelectorAll('[data-folder]').forEach((el) => (el.onclick = () => { folderId = el.dataset.folder; render(); }));
    main.querySelector('[data-new-folder]').onclick = () => {
      const name = prompt('新建收藏夹名称（最多 20 字）', '');
      if (!name || !name.trim()) return;
      const id = 'f' + Date.now();
      s.folders.push({ id, name: name.trim().slice(0, 20), items: [], private: false });
      Store.save(); folderId = id; toast('新建成功'); render();
    };
    main.querySelector('[data-rename]').onclick = () => {
      const name = prompt('重命名收藏夹', f.name);
      if (!name || !name.trim()) return;
      f.name = name.trim().slice(0, 20); Store.save(); toast('已重命名'); render();
    };
    main.querySelector('[data-private]').onclick = () => { f.private = !f.private; Store.save(); toast(f.private ? '已设为私密' : '已设为公开'); render(); };
    const del = main.querySelector('[data-del-folder]');
    if (del) del.onclick = () => {
      if (!confirm(`确定删除收藏夹“${f.name}”吗？其中的 ${f.items.length} 个视频会被取消收藏`)) return;
      s.folders = s.folders.filter((x) => x.id !== f.id);
      syncFavActions();
      Store.save(); toast('已删除'); render();
    };
    main.querySelectorAll('[data-remove]').forEach((b) => (b.onclick = (e) => {
      e.preventDefault();
      f.items = f.items.filter((x) => x.bvid !== b.dataset.remove);
      syncFavActions(b.dataset.remove);
      Store.save(); toast('已取消收藏'); render();
    }));
  }
  // 收藏夹变动后，同步视频页的“已收藏”状态
  function syncFavActions(onlyBvid) {
    const s = S();
    for (const [bv, a] of Object.entries(s.actions)) {
      if (onlyBvid && bv !== onlyBvid) continue;
      a.favs = s.folders.filter((f) => f.items.some((x) => x.bvid === bv)).map((f) => f.id);
    }
  }

  // ─────────── 历史记录 ───────────
  let histQuery = '';
  function renderHistory(main) {
    const s = S();
    const q = histQuery.toLowerCase();
    const list = s.history.filter((h) => !q || `${h.title} ${h.owner}`.toLowerCase().includes(q));
    const now = new Date(); const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const groups = [['今天', (t) => t >= d0], ['昨天', (t) => t >= d0 - 864e5], ['近一周', (t) => t >= d0 - 7 * 864e5], ['更早', () => true]];
    const buckets = groups.map(() => []);
    list.forEach((h) => buckets[groups.findIndex(([, fn]) => fn(h.t))].push(h));
    const p2 = (x) => String(x).padStart(2, '0');
    const timeText = (t, gi) => { const d = new Date(t); return gi <= 1 ? `${p2(d.getHours())}:${p2(d.getMinutes())}` : `${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
    const body = buckets.map((items, gi) => items.length ? `<div class="hist-group"><div class="hist-group-label">${groups[gi][0]}</div>
        ${items.map((h) => { const pr = progressOf(h); return `<div class="hist-item"><span class="time">${timeText(h.t, gi)}</span>
          <a class="cover" href="${U.videoUrl(h.bvid)}"><img src="${U.img(h.pic, '320w_180h_1c')}" loading="lazy" alt=""><span class="dur">${U.dur(h.duration)}</span><span class="bar"><i style="width:${pr.pct}%"></i></span></a>
          <div class="info"><a class="title" href="${U.videoUrl(h.bvid)}">${U.esc(h.title)}</a>
            <div class="sub"><a href="/?mid=${h.mid}">${I.up.replace('<svg', '<svg style="width:15px;height:15px;vertical-align:-3px"')} ${U.esc(h.owner)}</a><span class="progress-text ${pr.done ? 'done' : ''}">${pr.text}</span></div></div>
          <button class="del" data-del-hist="${h.bvid}" title="删除这条记录">${I.close}</button></div>`; }).join('')}</div>` : '').join('');
    main.innerHTML = `<div class="panel">
      <div class="panel-title"><span>历史记录<small>${s.history.length} 条</small></span>
        <div class="panel-actions hist-toolbar">
          <label class="hist-search">${I.search}<input type="text" placeholder="搜索历史记录" value="${U.esc(histQuery)}"></label>
          <span class="hist-pause" data-pause><span class="ali-switch ${s.historyPaused ? 'on' : ''}"></span>暂停记录历史</span>
          <button class="btn-ghost danger" data-clear-hist>清空历史</button>
        </div></div>
      ${s.historyPaused ? '<div class="hist-paused-tip">已暂停记录观看历史，之后看的视频不会出现在这里</div>' : ''}
      ${body || empty(q ? '没有找到相关的观看记录' : '还没有观看记录，去首页看看 AI 圈的新视频吧', '<div style="margin-top:8px"><a href="/">去首页 ›</a></div>')}
    </div>`;
    const input = main.querySelector('.hist-search input');
    input.addEventListener('input', () => { histQuery = input.value; clearTimeout(input._t); input._t = setTimeout(() => { render(); const i = document.querySelector('.hist-search input'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); });
    main.querySelector('[data-pause]').onclick = () => { s.historyPaused = !s.historyPaused; Store.save(); toast(s.historyPaused ? '已暂停记录历史' : '已恢复记录历史'); render(); };
    main.querySelector('[data-clear-hist]').onclick = () => { if (!s.history.length || !confirm('确定清空全部观看历史吗？')) return; s.history = []; Store.save(); toast('已清空'); render(); };
    main.querySelectorAll('[data-del-hist]').forEach((b) => (b.onclick = () => { s.history = s.history.filter((h) => h.bvid !== b.dataset.delHist); Store.save(); render(); }));
  }

  // ─────────── 稍后再看 ───────────
  function renderLater(main) {
    const s = S();
    const watched = new Set(s.history.map((h) => h.bvid));
    main.innerHTML = `<div class="panel">
      <div class="panel-title"><span>稍后再看<small>${s.later.length} 个视频</small></span>
        <div class="panel-actions">${s.later.length ? `<a class="btn-blue" style="display:inline-flex;align-items:center" href="${U.videoUrl(s.later[0].bvid)}">全部播放</a><button class="btn-ghost" data-clear-watched>移除已观看</button><button class="btn-ghost danger" data-clear-later>一键清空</button>` : ''}</div></div>
      ${s.later.length ? `<div class="v-grid">${s.later.map((v) => vCard(v, { remove: '移除', badge: watched.has(v.bvid) ? '已观看' : '' })).join('')}</div>` : empty('稍后再看列表空空如也', '<div style="margin-top:6px;font-size:13px">在首页把鼠标移到视频封面上，点右上角的时钟即可添加</div>')}
    </div>`;
    main.querySelectorAll('[data-remove]').forEach((b) => (b.onclick = (e) => { e.preventDefault(); s.later = s.later.filter((x) => x.bvid !== b.dataset.remove); Store.save(); render(); }));
    main.querySelector('[data-clear-later]')?.addEventListener('click', () => { if (!confirm('确定清空稍后再看吗？')) return; s.later = []; Store.save(); render(); });
    main.querySelector('[data-clear-watched]')?.addEventListener('click', () => {
      const n = s.later.length;
      s.later = s.later.filter((v) => !watched.has(v.bvid)); Store.save();
      toast(n === s.later.length ? '没有已观看的视频' : `已移除 ${n - s.later.length} 个已观看视频`); render();
    });
  }

  // ─────────── 渲染 ───────────
  function render() {
    renderHead(); renderNav();
    const main = document.getElementById('space-main');
    ({ dynamic: renderDynamic, follow: renderFollow, fav: renderFav, history: renderHistory, later: renderLater })[tab](main);
    document.title = `${S().name}的${TABS.find((t) => t.id === tab).name}-AliAli`;
  }
  render();
  Promise.all([U.api('/api/ups').catch(() => []), U.api('/api/feed?sort=new&limit=60').catch(() => ({ items: [] }))]).then(([u, f]) => {
    ups = u; feed = f.items || [];
    if (tab === 'dynamic' || tab === 'follow') render();
  });
})();
