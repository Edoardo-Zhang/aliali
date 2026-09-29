/* AliAli 首页：频道栏 / 轮播 / 推荐网格 / 换一换 / 无限滚动 / 实时同步 */
(function () {
  'use strict';
  const { I, U, Store, toast, mascot, renderHeader, renderPalette, connectEvents, footer } = window.Ali;
  const params = new URLSearchParams(location.search);
  const mode = { c: params.get('c') || '', sort: params.get('sort') || '', q: params.get('q') || '', mid: params.get('mid') || '' };
  const isFilter = !!(mode.c || mode.sort || mode.q || mode.mid);

  // ─────────── 顶栏 + 吸顶 ───────────
  const bar = renderHeader(document.getElementById('header-bar-mount'));
  const banner = document.getElementById('banner');
  const onScroll = () => {
    const past = scrollY > banner.offsetHeight + 40;
    if (past && !bar.classList.contains('slide-down')) bar.classList.add('slide-down');
    else if (!past && bar.classList.contains('slide-down') && scrollY < banner.offsetHeight) bar.classList.remove('slide-down');
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ─────────── 频道栏 ───────────
  const CHANNELS = [
    ['llm', '大模型'], ['agent', '智能体'], ['paint', 'AI绘画'], ['video', 'AI视频'], ['robot', '具身智能'], ['paper', '论文精读'],
    ['code', 'AI编程'], ['chip', '算力芯片'], ['news', '行业资讯'], ['tool', 'AI工具'], ['edu', '科普'], ['open', '开源'],
    ['official', '官方频道'],
  ];
  const RIGHT = [
    { text: 'AI日报', href: '/?sort=new', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="3.5" y="3" width="13" height="14" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 7h7M6.5 10h7M6.5 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { text: '发布会', href: '/?c=news', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 8.5l9-4v11l-9-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 8.5H3v3h1M6.5 12l1 4h2l-1-3.2M15.5 8a2.5 2.5 0 0 1 0 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { text: 'UP主榜', href: '/?sort=hot', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M6 3.5h8v4a4 4 0 0 1-8 0zM6 5H3.5c0 2.5 1 3.8 2.8 4M14 5h2.5c0 2.5-1 3.8-2.8 4M10 11.5V14M6.5 16.5h7L13 14H7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' },
    { text: '具身现场', href: '/?c=robot', icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="4.5" y="6" width="11" height="9" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M10 6V3.5M8 10h.01M12 10h.01M2.5 10v2M17.5 10v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' },
    { text: '课堂', href: '/?c=tool', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M2.5 7.5L10 4l7.5 3.5L10 11z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.5 9v4c1.2 1.3 2.7 2 4.5 2s3.3-.7 4.5-2V9M17.5 7.5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { text: '论文榜', href: '/?c=paper', icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 3h7l3.5 3.5V17H5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 3v3.5h3.5M7.5 10.5h5M7.5 13.5h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  ];
  const VISIBLE = 12;
  const chEl = document.getElementById('channel');
  chEl.innerHTML = `
    <div class="channel-icons">
      <a class="channel-icons__item ${mode.sort === 'new' ? 'is-active' : ''}" href="/?sort=new">
        <div class="icon-bg icon-bg__dynamic"><svg viewBox="0 0 26 26" fill="none"><path d="M13 4.5l2.3 5.2 5.2 2.3-5.2 2.3L13 19.5l-2.3-5.2L5.5 12l5.2-2.3z" fill="#fff"/><circle cx="20" cy="19.5" r="2" fill="#fff"/></svg><span class="badge hidden" id="dyn-badge"></span></div><span>动态</span></a>
      <a class="channel-icons__item ${mode.sort === 'hot' ? 'is-active' : ''}" href="/?sort=hot">
        <div class="icon-bg icon-bg__popular"><svg viewBox="0 0 26 26" fill="none"><path d="M13.4 3.8c.6 3.3-1.5 4.6-3 6.6-1.4 1.8-2.4 3.4-2.4 5.6A5.1 5.1 0 0 0 13 21.2a5.1 5.1 0 0 0 5-5.2c0-2-.9-3.1-1.7-4.2-.3 1.2-1 2-1.9 2.3.5-3.8-.1-7.5-1-10.3z" fill="#fff"/></svg></div><span>热门</span></a>
    </div>
    <div class="channel-items__left">
      ${CHANNELS.slice(0, VISIBLE - 1).map(([id, name]) => `<a class="channel-link ${mode.c === id ? 'is-active' : ''}" href="/?c=${id}">${name}</a>`).join('')}
      <span class="channel-link more">更多<svg viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5 9 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="more-panel">${CHANNELS.slice(VISIBLE - 1).concat([['', '全部推荐']]).map(([id, name]) => `<a href="/${id ? '?c=' + id : ''}">${name}</a>`).join('')}</div>
      </span>
    </div>
    <div class="channel-divider"></div>
    <div class="right-channel-container">${RIGHT.map((r) => `<a class="channel-entry-more__link" href="${r.href}">${r.icon}<span>${r.text}</span></a>`).join('')}</div>`;

  // ─────────── 卡片 ───────────
  function cardHTML(v, { isNew = false } = {}) {
    const s = v.stat || {};
    let tag = '';
    if (Store.isFollow(v.mid)) tag = '<span class="card-tag">已关注</span>';
    else if (s.like >= 10000) tag = `<span class="card-tag">${U.num(s.like)}点赞</span>`;
    else if (v.official) tag = '<span class="card-tag blue">官方</span>';
    const later = Store.inLater(v.bvid);
    return `<div class="feed-card ${isNew ? 'card-new' : ''}"><div class="bili-video-card" data-bvid="${v.bvid}">
      <a class="card-cover" href="${U.videoUrl(v.bvid)}" target="_blank">
        <div class="cover-placeholder">${mascot()}</div>
        <img class="cover-img" src="${U.img(v.pic, '672w_378h_1c')}" alt="" loading="lazy">
        <div class="cover-mask"></div>
        <div class="cover-stats">
          <span class="stat">${I.play}${U.num(s.view)}</span>
          <span class="stat">${I.danmaku}${U.num(s.danmaku)}</span>
          <span class="duration">${U.dur(v.duration)}</span>
        </div>
        <div class="watch-later ${later ? 'is-added' : ''}" data-later>${later ? I.check : I.clock}<span class="tip">${later ? '移除稍后再看' : '稍后再看'}</span></div>
      </a>
      <div class="card-info">
        <h3 class="card-title" title="${U.esc(v.title)}"><a href="${U.videoUrl(v.bvid)}" target="_blank">${U.esc(v.title)}</a></h3>
        <div class="card-bottom">
          ${tag}
          <a class="card-owner" href="/?mid=${v.mid}">${I.up.replace('<svg', '<svg class="up-icon"')}<span class="owner-name">${U.esc(v.owner)}</span><span class="date">&nbsp;·&nbsp;${U.feedDate(v.pubdate)}</span></a>
        </div>
        <button class="card-menu" data-menu aria-label="更多">${I.more}</button>
      </div>
    </div></div>`;
  }
  const skeleton = (n) => Array.from({ length: n }, () => '<div class="feed-card"><div class="bili-video-card skeleton"><div class="card-cover"></div><div class="sk-line"></div><div class="sk-line short"></div></div></div>').join('');

  // 图片淡入
  document.addEventListener('load', (e) => {
    if (e.target.classList?.contains('cover-img')) { e.target.classList.add('loaded'); e.target.previousElementSibling?.remove?.(); }
  }, true);

  // 稍后再看 / 更多菜单
  const byBvid = new Map();
  document.addEventListener('click', (e) => {
    const later = e.target.closest('[data-later]');
    if (later) {
      e.preventDefault(); e.stopPropagation();
      const v = byBvid.get(later.closest('[data-bvid]').dataset.bvid);
      const added = Store.toggleLater(v);
      later.classList.toggle('is-added', added);
      later.innerHTML = `${added ? I.check : I.clock}<span class="tip">${added ? '移除稍后再看' : '稍后再看'}</span>`;
      toast(added ? '已添加至稍后再看' : '已从稍后再看移除');
      return;
    }
    const menu = e.target.closest('[data-menu]');
    document.querySelectorAll('.card-dropdown').forEach((d) => d.remove());
    if (menu) {
      const card = menu.closest('.feed-card');
      const dd = U.h(`<div class="card-dropdown pop-card" style="position:absolute;right:0;bottom:28px;z-index:30;width:150px;padding:6px">
        <a href="javascript:;" data-dd="later" style="display:block;padding:8px 12px;border-radius:6px;font-size:13px;color:var(--text2)">添加至稍后再看</a>
        <a href="javascript:;" data-dd="dislike" style="display:block;padding:8px 12px;border-radius:6px;font-size:13px;color:var(--text2)">不感兴趣</a>
        <a href="javascript:;" data-dd="up" style="display:block;padding:8px 12px;border-radius:6px;font-size:13px;color:var(--text2)">看看这个 UP 主</a></div>`);
      menu.closest('.card-info').appendChild(dd);
      dd.querySelectorAll('a').forEach((a) => { a.onmouseenter = () => (a.style.background = 'var(--graph-bg)'); a.onmouseleave = () => (a.style.background = ''); });
      dd.onclick = (ev) => {
        ev.stopPropagation();
        const act = ev.target.dataset.dd;
        const v = byBvid.get(card.querySelector('[data-bvid]').dataset.bvid);
        if (act === 'later') { if (!Store.inLater(v.bvid)) Store.toggleLater(v); toast('已添加至稍后再看'); }
        if (act === 'dislike') { card.style.transition = 'opacity .3s, transform .3s'; card.style.opacity = '0'; card.style.transform = 'scale(.95)'; setTimeout(() => card.remove(), 300); toast('将减少此类内容推荐'); }
        if (act === 'up') location.href = '/?mid=' + v.mid;
        dd.remove();
      };
    }
  });

  // ─────────── 数据 ───────────
  const recGrid = document.getElementById('rec-grid');
  const moreGrid = document.getElementById('more-grid');
  const loadMore = document.getElementById('load-more');
  const rollBtn = document.getElementById('roll-btn');
  let seed = Math.floor(Math.random() * 1e9);
  let offset = 0, total = Infinity, loading = false;
  const shown = new Set();
  const cols = () => getComputedStyle(recGrid).gridTemplateColumns.split(' ').length;
  const recCount = () => cols() * 3 - 4; // 轮播占 2×2

  const feedQuery = (extra) => {
    const q = new URLSearchParams({ ...extra });
    for (const k of ['c', 'sort', 'q', 'mid']) if (mode[k]) q.set(k === 'c' ? 'channel' : k, mode[k]);
    return '/api/feed?' + q.toString();
  };
  const remember = (items) => items.forEach((v) => byBvid.set(v.bvid, v));

  // ─────────── 轮播 ───────────
  let swipeTimer;
  function renderSwipe(items) {
    const el = U.h(`<div class="recommended-swipe">
      <div class="swipe-body"><div class="swipe-track">${items.map((v) => `<a class="swipe-item" href="${U.videoUrl(v.bvid)}" target="_blank"><img src="${U.img(v.pic, '1344w_756h_1c')}" alt="" data-swipe-img><div class="swipe-shade"></div>${v.official ? `<span class="official-tag">${U.esc(v.owner)} · 官方</span>` : ''}</a>`).join('')}</div></div>
      <div class="swipe-footer">
        <a class="swipe-title" href="${U.videoUrl(items[0].bvid)}" target="_blank">${U.esc(items[0].title)}</a>
        <div class="swipe-dots">${items.map((_, i) => `<span class="swipe-dot ${i ? '' : 'is-active'}" data-i="${i}"></span>`).join('')}</div>
        <div class="swipe-arrows"><button class="swipe-arrow" data-dir="-1" aria-label="上一张"><svg viewBox="0 0 14 14" fill="none"><path d="M9 2.5L4.5 7 9 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="swipe-arrow" data-dir="1" aria-label="下一张"><svg viewBox="0 0 14 14" fill="none"><path d="M5 2.5L9.5 7 5 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
      </div></div>`);
    const track = el.querySelector('.swipe-track');
    const title = el.querySelector('.swipe-title');
    const dots = [...el.querySelectorAll('.swipe-dot')];
    const colors = [];
    let cur = 0;
    const go = (i) => {
      cur = (i + items.length) % items.length;
      track.style.transform = `translateX(-${cur * 100}%)`;
      title.textContent = items[cur].title;
      title.href = U.videoUrl(items[cur].bvid);
      dots.forEach((d, k) => d.classList.toggle('is-active', k === cur));
      el.style.setProperty('--swipe-bg', colors[cur] || '#3b3d45');
    };
    // 取封面底部主色做背景，和官方轮播一致
    el.querySelectorAll('[data-swipe-img]').forEach((img, i) => {
      img.addEventListener('load', () => {
        try {
          const c = document.createElement('canvas'); c.width = 24; c.height = 8;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, img.naturalHeight * 0.8, img.naturalWidth, img.naturalHeight * 0.2, 0, 0, 24, 8);
          const d = ctx.getImageData(0, 0, 24, 8).data;
          let r = 0, g = 0, b = 0;
          for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
          const n = d.length / 4, f = 0.72;
          colors[i] = `rgb(${Math.round(r / n * f)},${Math.round(g / n * f)},${Math.round(b / n * f)})`;
          if (i === cur) el.style.setProperty('--swipe-bg', colors[i]);
        } catch {}
      });
    });
    dots.forEach((d) => d.addEventListener('mouseenter', () => go(+d.dataset.i)));
    el.querySelectorAll('.swipe-arrow').forEach((b) => (b.onclick = () => go(cur + Number(b.dataset.dir))));
    const auto = () => { clearInterval(swipeTimer); swipeTimer = setInterval(() => go(cur + 1), 5000); };
    el.addEventListener('mouseenter', () => clearInterval(swipeTimer));
    el.addEventListener('mouseleave', auto);
    auto();
    return el;
  }

  // ─────────── 推荐首屏 ───────────
  async function loadRecommend({ roll = false, fresh = [] } = {}) {
    const n = recCount();
    if (roll) {
      rollBtn.querySelector('.roll-btn').classList.add('is-rolling');
      setTimeout(() => rollBtn.querySelector('.roll-btn').classList.remove('is-rolling'), 600);
      seed = Math.floor(Math.random() * 1e9);
      recGrid.querySelectorAll('.feed-card').forEach((c) => (c.outerHTML = skeleton(1)));
    }
    const j = await U.api(feedQuery({ seed, offset: 0, limit: 60 }));
    total = j.total;
    remember(j.items);
    if (!j.items.length) return showEmpty(j);
    const swipeItems = roll ? null : pickSwipe(j.items);
    const pool = j.items.filter((v) => !swipeItems?.some((s) => s.bvid === v.bvid) && !(roll && moreShown.has(v.bvid)));
    const picked = [...fresh, ...pool.filter((v) => !fresh.some((f) => f.bvid === v.bvid))].slice(0, n);
    const cards = picked.map((v, i) => cardHTML(v, { isNew: i < fresh.length })).join('');
    if (roll) {
      recGrid.querySelectorAll('.feed-card').forEach((c) => c.remove());
      recGrid.insertAdjacentHTML('beforeend', cards);
    } else {
      recGrid.innerHTML = '';
      recGrid.appendChild(renderSwipe(swipeItems));
      recGrid.insertAdjacentHTML('beforeend', cards);
      picked.forEach((v) => shown.add(v.bvid));
      swipeItems.forEach((v) => shown.add(v.bvid));
      offset = 0;
    }
  }
  function pickSwipe(items) {
    const week = Date.now() / 1000 - 7 * 86400;
    const cand = [...items].filter((v) => v.pubdate > week).sort((a, b) => (b.stat?.view || 0) - (a.stat?.view || 0));
    const out = [];
    for (const v of cand) { if (!out.some((o) => o.mid === v.mid)) out.push(v); if (out.length === 5) break; }
    for (const v of items) { if (out.length >= 5) break; if (!out.includes(v)) out.push(v); }
    return out;
  }

  // ─────────── 无限滚动 ───────────
  const moreShown = new Set();
  let moreOffset = 0;
  async function loadNext() {
    if (loading || moreOffset >= total) return;
    loading = true;
    loadMore.innerHTML = '<span class="spinner"></span>正在加载更多 AI 圈好视频…';
    try {
      const limit = cols() * 4;
      const j = await U.api(feedQuery({ seed, offset: moreOffset, limit }));
      total = j.total;
      moreOffset += j.items.length;
      remember(j.items);
      const items = isFilter ? j.items : j.items.filter((v) => !shown.has(v.bvid));
      let html = '';
      items.forEach((v, i) => {
        moreShown.add(v.bvid);
        if (!isFilter && v.official && (moreGrid.children.length + i) % 9 === 4) {
          html += `<div class="floor-card"><div class="floor-head"><span class="floor-title"><span class="floor-badge">官方</span>${U.esc(v.owner)}</span><a class="floor-more" href="/?mid=${v.mid}">更多${I.arrowRight}</a></div>${cardHTML(v).replace('<div class="feed-card ">', '').replace(/<\/div>$/, '')}</div>`;
        } else html += cardHTML(v);
      });
      moreGrid.insertAdjacentHTML('beforeend', html);
      if (!j.items.length && !moreGrid.children.length && isFilter) showEmpty(j);
    } catch (e) {
      toast('加载失败：' + e.message);
    } finally {
      loading = false;
      const hasCards = !!moreGrid.querySelector('.bili-video-card');
      loadMore.innerHTML = moreOffset >= total && hasCards ? '<span>AI 圈的视频都在这里啦，稍后会自动同步新内容～</span>' : '';
      if (moreOffset < total && document.documentElement.scrollHeight - innerHeight - scrollY < 900) loadNext();
    }
  }
  new IntersectionObserver((es) => es[0].isIntersecting && loadNext(), { rootMargin: '800px' }).observe(loadMore);

  function showEmpty(j) {
    const grid = isFilter ? moreGrid : recGrid;
    if (j.syncing && !j.total) {
      grid.innerHTML = skeleton(recCount() + 4) ;
      grid.insertAdjacentHTML('afterbegin', `<div class="feed-empty" id="cold-start">${mascot({ mood: 'wow' })}<div>首次启动，正在从 AI 圈同步最新视频…<span id="cold-progress"></span></div></div>`);
    } else {
      grid.innerHTML = `<div class="feed-empty">${mascot({ mood: 'sad' })}<div>${mode.q ? `没有找到与“${U.esc(mode.q)}”相关的 AI 圈视频` : '这里暂时还没有视频'}</div><a href="/" style="color:var(--brand-blue)">回到首页</a></div>`;
    }
  }

  // ─────────── 筛选模式 ───────────
  async function renderFilterBar() {
    const fb = document.getElementById('filter-bar');
    fb.classList.remove('hidden');
    document.querySelector('.recommended-container').classList.add('hidden');
    let title = '';
    if (mode.q) title = `搜索 <em>${U.esc(mode.q)}</em>`;
    else if (mode.c) title = (CHANNELS.find((c) => c[0] === mode.c) || [0, '频道'])[1];
    else if (mode.mid) {
      const ups = await U.api('/api/ups').catch(() => []);
      const up = ups.find((u) => String(u.mid) === mode.mid);
      title = up ? `<span class="up-strip">${up.face ? `<img src="${U.img(up.face, '96w_96h_1c')}" alt="">` : ''}${U.esc(up.name)}</span>` : 'UP 主';
      if (up) {
        fb.dataset.mid = up.mid;
        title += `<small>${up.official?.title || (up.kind === 'official' ? '官方账号' : 'AI 博主')} · ${U.num(up.fans)} 粉丝</small>`;
      }
    } else title = mode.sort === 'hot' ? '热门' : '动态';
    const base = new URLSearchParams(params); base.delete('sort');
    const link = (s) => { const p = new URLSearchParams(base); if (s) p.set('sort', s); return '/?' + p.toString(); };
    const j = await U.api(feedQuery({ limit: 1 }));
    const followBtn = mode.mid ? `<button class="btn-primary" id="filter-follow" style="height:34px;margin-left:12px">${Store.isFollow(mode.mid) ? '已关注' : '+ 关注'}</button>` : '';
    fb.innerHTML = `<h2>${title}<small>共 ${j.total} 个视频</small>${followBtn}</h2>
      <div class="feed-sort">${mode.c || mode.q || mode.mid ? `<a class="${!mode.sort ? 'is-active' : ''}" href="${link('')}">综合推荐</a>` : ''}<a class="${mode.sort === 'new' ? 'is-active' : ''}" href="${link('new')}">最新发布</a><a class="${mode.sort === 'hot' ? 'is-active' : ''}" href="${link('hot')}">最多播放</a></div>`;
    const fbtn = document.getElementById('filter-follow');
    if (fbtn) fbtn.onclick = () => {
      const on = Store.toggleFollow(mode.mid);
      fbtn.textContent = on ? '已关注' : '+ 关注'; fbtn.style.background = on ? 'var(--line)' : ''; fbtn.style.color = on ? 'var(--text2)' : '';
      toast(on ? '关注成功' : '已取消关注');
      // 卡片上的“已关注”标签即时刷新
      document.querySelectorAll('.bili-video-card[data-bvid]').forEach((card) => {
        const v = byBvid.get(card.dataset.bvid);
        if (!v || String(v.mid) !== String(mode.mid)) return;
        const fresh = U.h(cardHTML(v)).querySelector('.card-bottom');
        card.querySelector('.card-bottom').replaceWith(fresh);
      });
    };
    if (fbtn && Store.isFollow(mode.mid)) { fbtn.style.background = 'var(--line)'; fbtn.style.color = 'var(--text2)'; }
    document.title = mode.q ? `${mode.q}-搜索结果-AliAli` : `${fb.querySelector('h2').childNodes[0].textContent.trim() || 'AliAli'} - AliAli`;
  }

  // ─────────── 实时同步 ───────────
  const palette = renderPalette({ onRefresh: () => (isFilter ? location.reload() : loadRecommend({ roll: true })) });
  palette.sync.querySelector('span').textContent = isFilter ? '刷新' : '换一换';
  let updatedAt = 0, nextSyncAt = 0;
  const tipText = () => {
    if (!updatedAt) return '正在同步 AI 圈最新投稿…';
    const ago = Math.max(0, Math.round((Date.now() - updatedAt) / 60000));
    const next = Math.max(0, Math.round((nextSyncAt - Date.now()) / 60000));
    return `实时同步 · ${ago ? ago + ' 分钟前' : '刚刚'}更新${nextSyncAt ? ` · ${next || '<1'} 分钟后再次同步` : ''}`;
  };
  setInterval(() => (palette.tip.textContent = tipText()), 15000);
  const newTip = U.h(`<div class="new-tip">${I.refresh}<span></span></div>`);
  document.body.appendChild(newTip);
  let pendingNew = [];
  newTip.onclick = () => {
    newTip.classList.remove('show');
    scrollTo({ top: 0, behavior: 'smooth' });
    const fresh = pendingNew; pendingNew = [];
    remember(fresh);
    loadRecommend({ roll: true, fresh });
  };
  connectEvents({
    hello(d) { updatedAt = d.updatedAt; nextSyncAt = d.nextSyncAt; palette.sync.classList.toggle('syncing', d.syncing); palette.tip.textContent = d.syncing ? '正在同步 AI 圈最新投稿…' : tipText(); },
    sync(d) {
      if (d.state === 'start') { palette.sync.classList.add('syncing'); palette.tip.textContent = '正在同步 AI 圈最新投稿…'; }
      if (d.state === 'progress') {
        palette.tip.textContent = `正在同步：${d.name}（${d.done}/${d.total}）`;
        const cp = document.getElementById('cold-progress');
        if (cp) { cp.textContent = `（${d.done}/${d.total}）`; if (d.done === 6 || d.done === 14) boot(); }
      }
      if (d.state === 'done') {
        palette.sync.classList.remove('syncing');
        updatedAt = d.updatedAt; nextSyncAt = Date.now() + 10 * 60e3;
        palette.tip.textContent = tipText();
        if (document.getElementById('cold-start')) return boot();
        if (d.added?.length && !isFilter) {
          pendingNew = [...d.added, ...pendingNew].slice(0, 12);
          newTip.querySelector('span').textContent = `AI 圈有 ${pendingNew.length} 个新视频，点击查看`;
          newTip.classList.add('show');
          const b = document.getElementById('dyn-badge');
          b.textContent = pendingNew.length; b.classList.remove('hidden');
        }
      }
    },
  });

  // ─────────── 启动 ───────────
  rollBtn.querySelector('button').onclick = () => loadRecommend({ roll: true });
  async function boot() {
    try {
      moreGrid.innerHTML = ''; moreShown.clear(); moreOffset = 0; total = Infinity;
      if (isFilter) {
        await renderFilterBar();
        await loadNext();
      } else {
        recGrid.innerHTML = '<div class="recommended-swipe" style="background:var(--graph-bg)"></div>' + skeleton(recCount());
        await loadRecommend();
        if (!document.getElementById('cold-start')) { moreOffset = 0; await loadNext(); }
      }
    } catch (e) {
      toast('加载失败：' + e.message);
    }
  }
  boot();
  document.getElementById('footer').innerHTML = footer();
})();
