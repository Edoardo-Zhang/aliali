/* AliAli 播放器：原生 <video> + 同步弹幕引擎
   倍速 / 清晰度 / 音量 / 弹幕设置 / 画中画 / 宽屏 / 网页全屏 / 全屏 / 快捷键 / 断点续播 / 自动连播 */
(function () {
  'use strict';
  const { U } = window.Ali;

  const IC = {
    play: '<svg viewBox="0 0 28 28"><path fill="currentColor" d="M8.5 5.6v16.8c0 1 1.1 1.6 1.9 1l13-8.4c.8-.5.8-1.6 0-2.1l-13-8.4c-.8-.5-1.9.1-1.9 1.1z"/></svg>',
    pause: '<svg viewBox="0 0 28 28"><rect x="7" y="5.5" width="4.4" height="17" rx="1.6" fill="currentColor"/><rect x="16.6" y="5.5" width="4.4" height="17" rx="1.6" fill="currentColor"/></svg>',
    vol: '<svg viewBox="0 0 28 28" fill="none"><path d="M5 11h3.5L14 6.5v15L8.5 17H5z" fill="currentColor"/><path d="M18 10.5a5 5 0 0 1 0 7M20.8 7.5a9 9 0 0 1 0 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 28 28" fill="none"><path d="M5 11h3.5L14 6.5v15L8.5 17H5z" fill="currentColor"/><path d="M18 11l6 6M24 11l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    set: '<svg viewBox="0 0 28 28" fill="none"><rect x="4" y="6" width="20" height="16" rx="4" stroke="currentColor" stroke-width="2"/><path d="M8.5 11.5h4M15.5 11.5h4M8.5 16.5h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="21" cy="20" r="4.2" fill="#000" stroke="currentColor" stroke-width="1.8"/><circle cx="21" cy="20" r="1.3" fill="currentColor"/></svg>',
    pip: '<svg viewBox="0 0 28 28" fill="none"><rect x="3.5" y="6" width="21" height="16" rx="3" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="13" width="8" height="6" rx="1.5" fill="currentColor"/></svg>',
    wide: '<svg viewBox="0 0 28 28" fill="none"><rect x="3.5" y="7" width="21" height="14" rx="3" stroke="currentColor" stroke-width="2"/><path d="M8 14h12M10.5 11.5L8 14l2.5 2.5M17.5 11.5L20 14l-2.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    unwide: '<svg viewBox="0 0 28 28" fill="none"><rect x="3.5" y="7" width="21" height="14" rx="3" stroke="currentColor" stroke-width="2"/><path d="M7.5 14h4M16.5 14h4M9.5 11.5L12 14l-2.5 2.5M18.5 11.5L16 14l2.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    webfull: '<svg viewBox="0 0 28 28" fill="none"><rect x="3.5" y="5.5" width="21" height="17" rx="3" stroke="currentColor" stroke-width="2"/><path d="M8 12V10h3M20 12V10h-3M8 16v2h3M20 16v2h-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    unwebfull: '<svg viewBox="0 0 28 28" fill="none"><rect x="3.5" y="5.5" width="21" height="17" rx="3" stroke="currentColor" stroke-width="2"/><path d="M11 10v2H8M17 10v2h3M11 18v-2H8M17 18v-2h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    full: '<svg viewBox="0 0 28 28" fill="none"><path d="M5 11V6.5A1.5 1.5 0 0 1 6.5 5H11M17 5h4.5A1.5 1.5 0 0 1 23 6.5V11M23 17v4.5a1.5 1.5 0 0 1-1.5 1.5H17M11 23H6.5A1.5 1.5 0 0 1 5 21.5V17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    unfull: '<svg viewBox="0 0 28 28" fill="none"><path d="M11 5v4.5A1.5 1.5 0 0 1 9.5 11H5M23 11h-4.5A1.5 1.5 0 0 1 17 9.5V5M17 23v-4.5a1.5 1.5 0 0 1 1.5-1.5H23M5 17h4.5a1.5 1.5 0 0 1 1.5 1.5V23" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    replay: '<svg viewBox="0 0 28 28" fill="none"><path d="M6 14a8 8 0 1 0 2.6-5.9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M8 4v5h5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const SPEEDS = [2, 1.5, 1.25, 1, 0.75, 0.5];
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  function create(opts) {
    const { wrap, area, bvid, poster } = opts;
    let cid = opts.cid;
    const set = Object.assign({ volume: 0.8, muted: false, dmOpacity: 1, dmSize: 1, dmArea: 1, dmSpeed: 1, dmBlock: { scroll: false, top: false, bottom: false, color: false }, dmWords: [] }, load('aliali:player', {}));
    const persist = () => save('aliali:player', set);

    area.innerHTML = `
      <video class="bpx-video" playsinline preload="metadata" poster="${U.img(poster, '1280w_720h_1c')}"></video>
      <div class="bpx-dm-layer"></div>
      <div class="bpx-click-area"></div>
      <div class="bpx-state"><div class="bpx-big-play">${IC.play}</div></div>
      <div class="bpx-loading hidden"><span class="bpx-spin"></span><span>正在缓冲…</span></div>
      <div class="bpx-tips"></div>
      <div class="bpx-ending hidden"></div>
      <div class="bpx-ctrl">
        <div class="bpx-progress">
          <div class="bpx-track"><i class="buf"></i><i class="played"></i></div>
          <span class="bpx-thumb"></span><div class="bpx-hover-time">00:00</div>
        </div>
        <div class="bpx-row">
          <div class="bpx-left">
            <button class="bpx-btn bpx-play" aria-label="播放">${IC.play}</button>
            <span class="bpx-time"><span class="cur">00:00</span><span class="sep">/</span><span class="dur">00:00</span></span>
          </div>
          <div class="bpx-right">
            <div class="bpx-btn bpx-text has-menu bpx-quality"><span class="lbl">自动</span><ul class="bpx-menu"></ul></div>
            <div class="bpx-btn bpx-text has-menu bpx-speed"><span class="lbl">倍速</span><ul class="bpx-menu">${SPEEDS.map((s) => `<li data-speed="${s}">${s === 1 ? '1.0x' : s + 'x'}</li>`).join('')}</ul></div>
            <div class="bpx-btn has-menu bpx-volume"><span class="ico">${IC.vol}</span>
              <div class="bpx-menu bpx-vol-panel"><div class="num">80</div><div class="vbar"><i></i><span></span></div></div></div>
            <div class="bpx-btn has-menu bpx-dmset" aria-label="弹幕设置"><span class="ico">${IC.set}</span>
              <div class="bpx-menu bpx-set-panel">
                <div class="set-row"><span>不透明度</span><input type="range" min="10" max="100" data-set="dmOpacity"><em></em></div>
                <div class="set-row"><span>弹幕字号</span><div class="seg" data-seg="dmSize"><b data-v="0.8">小</b><b data-v="1">标准</b><b data-v="1.25">大</b></div></div>
                <div class="set-row"><span>显示区域</span><div class="seg" data-seg="dmArea"><b data-v="0.25">1/4</b><b data-v="0.5">半屏</b><b data-v="0.75">3/4</b><b data-v="1">全屏</b></div></div>
                <div class="set-row"><span>弹幕速度</span><div class="seg" data-seg="dmSpeed"><b data-v="1.35">慢</b><b data-v="1">适中</b><b data-v="0.72">快</b></div></div>
                <div class="set-row"><span>屏蔽类型</span><div class="seg multi" data-block><b data-k="scroll">滚动</b><b data-k="top">顶部</b><b data-k="bottom">底部</b><b data-k="color">彩色</b></div></div>
                <div class="set-row block-row"><span>屏蔽词</span><div class="block-words">
                  <div class="bw-input"><input type="text" maxlength="20" placeholder="输入关键词，回车添加"><button class="bw-add">添加</button></div>
                  <div class="bw-tags"></div><div class="block-count"></div>
                </div></div>
              </div></div>
            <button class="bpx-btn bpx-pip" data-tip="画中画">${IC.pip}</button>
            <button class="bpx-btn bpx-wide" data-tip="宽屏模式">${IC.wide}</button>
            <button class="bpx-btn bpx-webfull" data-tip="网页全屏">${IC.webfull}</button>
            <button class="bpx-btn bpx-full" data-tip="进入全屏 (F)">${IC.full}</button>
          </div>
        </div>
      </div>`;

    const $ = (s) => area.querySelector(s);
    const video = $('.bpx-video');
    const layer = $('.bpx-dm-layer');
    const ctrl = $('.bpx-ctrl');
    const listeners = {};
    const emit = (ev, ...a) => (listeners[ev] || []).forEach((fn) => fn(...a));

    // ─────────── 提示 ───────────
    function tip(html, ms = 2000) {
      const box = $('.bpx-tips');
      const el = U.h(`<div class="bpx-tip">${html}</div>`);
      box.appendChild(el);
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
      return el;
    }

    // ─────────── 源 & 清晰度 ───────────
    let qn = 64;
    let qualities = [];
    let started = false;
    async function loadSource(keepTime) {
      const t = keepTime ? video.currentTime : 0;
      const wasPlaying = keepTime && !video.paused;
      try {
        const info = await U.api(`/api/playurl/${bvid}/${cid}?qn=${qn}`);
        qualities = info.qualities;
        qn = info.quality;
        renderQuality();
      } catch (e) {
        emit('error', e);
        return;
      }
      video.src = `/stream/${bvid}/${cid}/${qn}`;
      if (keepTime) {
        video.addEventListener('loadedmetadata', () => { video.currentTime = t; if (wasPlaying) video.play().catch(() => {}); }, { once: true });
      }
    }
    function renderQuality() {
      const cur = qualities.find((q) => q.qn === qn);
      $('.bpx-quality .lbl').textContent = cur ? cur.desc.split(' ')[0] : '自动';
      $('.bpx-quality .bpx-menu').innerHTML = qualities.map((q) => `<li data-qn="${q.qn}" class="${q.qn === qn ? 'on' : ''}">${q.desc}</li>`).join('')
        + '<li class="disabled" title="需要登录 bilibili 账号">1080P 高清 <small>登录</small></li>';
    }
    $('.bpx-quality .bpx-menu').addEventListener('click', (e) => {
      const li = e.target.closest('[data-qn]');
      if (!li || Number(li.dataset.qn) === qn) return;
      qn = Number(li.dataset.qn);
      tip(`正在切换至 ${li.textContent}…`);
      loadSource(true).then(() => tip(`已切换至 ${li.textContent}`));
    });

    // ─────────── 播放状态 ───────────
    const playBtn = $('.bpx-play');
    function togglePlay() {
      if (video.paused || video.ended) video.play().catch((e) => tip('播放失败：' + e.message));
      else video.pause();
    }
    video.addEventListener('play', () => {
      started = true;
      wrap.classList.add('is-playing'); wrap.classList.remove('is-paused');
      playBtn.innerHTML = IC.pause;
      $('.bpx-ending').classList.add('hidden');
      dmResume();
      loop();
      idle();
    });
    video.addEventListener('pause', () => {
      wrap.classList.remove('is-playing'); wrap.classList.add('is-paused');
      playBtn.innerHTML = IC.play;
      dmPause();
      showCtrl();
      saveProgress();
    });
    video.addEventListener('waiting', () => $('.bpx-loading').classList.remove('hidden'));
    ['playing', 'canplay', 'pause'].forEach((ev) => video.addEventListener(ev, () => $('.bpx-loading').classList.add('hidden')));
    video.addEventListener('loadedmetadata', () => { $('.dur').textContent = U.dur(video.duration); resume(); });
    video.addEventListener('timeupdate', () => { if (!dragging) paintProgress(video.currentTime); if (Math.floor(video.currentTime) % 5 === 0) saveProgress(); emit('time', video.currentTime); });
    video.addEventListener('progress', paintBuffer);
    video.addEventListener('seeking', dmReset);
    video.addEventListener('ratechange', () => { dmRate(); renderSpeed(); });
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', () => { if (video.src) tip('视频加载出错，正在重试…'); if (video.src && !video.dataset.retried) { video.dataset.retried = 1; loadSource(true); } });
    wrap.classList.add('is-paused');

    playBtn.onclick = togglePlay;
    $('.bpx-state').onclick = togglePlay;
    let clickTimer = 0;
    $('.bpx-click-area').addEventListener('click', () => { clearTimeout(clickTimer); clickTimer = setTimeout(togglePlay, 220); });
    $('.bpx-click-area').addEventListener('dblclick', () => { clearTimeout(clickTimer); toggleFull(); });

    // ─────────── 进度条 ───────────
    const progress = $('.bpx-progress');
    let dragging = false;
    function paintProgress(t) {
      const d = video.duration || opts.duration || 1;
      const p = Math.min(1, Math.max(0, t / d));
      $('.bpx-track .played').style.width = p * 100 + '%';
      $('.bpx-thumb').style.left = p * 100 + '%';
      $('.cur').textContent = U.dur(t);
    }
    function paintBuffer() {
      const b = video.buffered, t = video.currentTime;
      for (let i = 0; i < b.length; i++) {
        if (b.start(i) <= t + 0.5 && b.end(i) >= t) { $('.bpx-track .buf').style.width = (b.end(i) / (video.duration || 1)) * 100 + '%'; return; }
      }
    }
    const posToTime = (e) => {
      const r = progress.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (video.duration || opts.duration || 0);
    };
    progress.addEventListener('pointermove', (e) => {
      const t = posToTime(e), r = progress.getBoundingClientRect();
      const ht = $('.bpx-hover-time');
      ht.textContent = U.dur(t);
      ht.style.left = Math.min(r.width - 24, Math.max(24, e.clientX - r.left)) + 'px';
      if (dragging) paintProgress(t);
    });
    progress.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      progress.setPointerCapture(e.pointerId);
      progress.classList.add('dragging');
      paintProgress(posToTime(e));
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      progress.classList.remove('dragging');
      seek(posToTime(e));
    };
    progress.addEventListener('pointerup', endDrag);
    progress.addEventListener('pointercancel', () => { dragging = false; progress.classList.remove('dragging'); });

    function seek(t) {
      if (!video.src) { pendingSeek = t; return togglePlay(); }
      video.currentTime = Math.max(0, Math.min(t, (video.duration || t) - 0.1));
      paintProgress(video.currentTime);
    }
    let pendingSeek = null;
    video.addEventListener('loadedmetadata', () => { if (pendingSeek != null) { video.currentTime = pendingSeek; pendingSeek = null; } });

    // ─────────── 倍速 ───────────
    function renderSpeed() {
      const r = video.playbackRate;
      $('.bpx-speed .lbl').textContent = r === 1 ? '倍速' : (r % 1 ? r : r.toFixed(1)) + 'x';
      area.querySelectorAll('[data-speed]').forEach((li) => li.classList.toggle('on', Number(li.dataset.speed) === r));
    }
    $('.bpx-speed .bpx-menu').addEventListener('click', (e) => {
      const li = e.target.closest('[data-speed]');
      if (!li) return;
      video.playbackRate = Number(li.dataset.speed);
      tip(`已切换至 ${li.textContent} 倍速播放`);
    });
    renderSpeed();

    // ─────────── 音量 ───────────
    const vbar = $('.vbar');
    function applyVolume() {
      video.volume = set.volume;
      video.muted = set.muted || set.volume === 0;
      const v = video.muted ? 0 : Math.round(set.volume * 100);
      $('.bpx-vol-panel .num').textContent = v;
      vbar.querySelector('i').style.height = v + '%';
      vbar.querySelector('span').style.bottom = v + '%';
      $('.bpx-volume .ico').innerHTML = video.muted ? IC.mute : IC.vol;
      persist();
    }
    const volFromEvent = (e) => { const r = vbar.getBoundingClientRect(); return Math.min(1, Math.max(0, (r.bottom - e.clientY) / r.height)); };
    let vdrag = false;
    vbar.addEventListener('pointerdown', (e) => { vdrag = true; vbar.setPointerCapture(e.pointerId); set.volume = volFromEvent(e); set.muted = false; applyVolume(); });
    vbar.addEventListener('pointermove', (e) => { if (vdrag) { set.volume = volFromEvent(e); set.muted = false; applyVolume(); } });
    vbar.addEventListener('pointerup', () => (vdrag = false));
    $('.bpx-volume .ico').onclick = () => { set.muted = !video.muted; if (!set.muted && set.volume === 0) set.volume = 0.5; applyVolume(); };
    applyVolume();

    // ─────────── 全屏 / 网页全屏 / 宽屏 / 画中画 ───────────
    const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
    const isFull = () => fsEl() === wrap;
    let fakeFull = false; // 浏览器拒绝/不响应全屏时，用网页全屏兜底
    function paintFullBtn() {
      const on = isFull() || fakeFull;
      $('.bpx-full').innerHTML = on ? IC.unfull : IC.full;
      $('.bpx-full').dataset.tip = on ? '退出全屏 (F)' : '进入全屏 (F)';
    }
    function fallbackFull(msg) {
      if (isFull()) return;
      fakeFull = true;
      toggleWebFull(true, true);
      paintFullBtn();
      tip(msg, 3000);
    }
    function toggleFull() {
      if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (fakeFull) { toggleWebFull(false); return; }
      if (wrap.classList.contains('is-webfull')) toggleWebFull(false);
      const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
      if (!req) return fallbackFull('当前浏览器不支持全屏，已切换为网页全屏（Esc 退出）');
      let settled = false;
      const timer = setTimeout(() => { if (!settled) fallbackFull('浏览器未响应全屏请求，已切换为网页全屏（Esc 退出）'); }, 700);
      Promise.resolve(req.call(wrap)).then(
        () => { settled = true; clearTimeout(timer); },
        () => { settled = true; clearTimeout(timer); fallbackFull('浏览器拒绝了全屏请求，已切换为网页全屏（Esc 退出）'); },
      );
    }
    const onFsChange = () => {
      if (isFull() && fakeFull) toggleWebFull(false); // 真全屏姗姗来迟时，撤掉兜底
      wrap.classList.toggle('is-full', isFull());
      paintFullBtn();
      dmReset();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    function toggleWebFull(force, keepFake) {
      const on = force ?? !wrap.classList.contains('is-webfull');
      if (on && isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      if (!keepFake) fakeFull = false;
      wrap.classList.toggle('is-webfull', on);
      document.documentElement.classList.toggle('no-scroll', on);
      $('.bpx-webfull').innerHTML = on && !fakeFull ? IC.unwebfull : IC.webfull;
      $('.bpx-webfull').dataset.tip = on && !fakeFull ? '退出网页全屏' : '网页全屏';
      paintFullBtn();
      dmReset();
    }
    let wide = false;
    function toggleWide() {
      wide = !wide;
      $('.bpx-wide').innerHTML = wide ? IC.unwide : IC.wide;
      $('.bpx-wide').dataset.tip = wide ? '退出宽屏' : '宽屏模式';
      emit('wide', wide);
      setTimeout(dmReset, 50);
    }
    $('.bpx-full').onclick = toggleFull;
    $('.bpx-webfull').onclick = () => toggleWebFull();
    $('.bpx-wide').onclick = toggleWide;
    const pipBtn = $('.bpx-pip');
    if (!document.pictureInPictureEnabled) pipBtn.classList.add('hidden');
    pipBtn.onclick = async () => {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else { if (video.paused) await video.play(); await video.requestPictureInPicture(); }
      } catch (e) { tip('画中画不可用：' + e.message); }
    };

    // ─────────── 控制栏自动隐藏 ───────────
    let idleTimer = 0;
    function showCtrl() { wrap.classList.remove('ctrl-hide'); clearTimeout(idleTimer); }
    function idle() {
      showCtrl();
      idleTimer = setTimeout(() => {
        if (!video.paused && !area.querySelector('.has-menu:hover') && !ctrl.matches(':hover')) wrap.classList.add('ctrl-hide');
      }, 2500);
    }
    area.addEventListener('mousemove', idle);
    area.addEventListener('mouseleave', () => { if (!video.paused) { clearTimeout(idleTimer); wrap.classList.add('ctrl-hide'); } });

    // ─────────── 快捷键 ───────────
    document.addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === ' ' || k === 'k' || k === 'K') { e.preventDefault(); togglePlay(); }
      else if (k === 'ArrowRight' || k === 'ArrowLeft') {
        e.preventDefault();
        if (!video.src) return;
        seek(video.currentTime + (k === 'ArrowRight' ? 5 : -5));
        tip(`${k === 'ArrowRight' ? '快进' : '快退'} 5 秒 · ${U.dur(video.currentTime)}`, 900);
      } else if (k === 'ArrowUp' || k === 'ArrowDown') {
        if (!wrap.matches(':hover') && !isFull() && !wrap.classList.contains('is-webfull')) return;
        e.preventDefault();
        set.volume = Math.min(1, Math.max(0, Math.round((set.volume + (k === 'ArrowUp' ? 0.1 : -0.1)) * 10) / 10));
        set.muted = false;
        applyVolume();
        tip(`音量 ${Math.round(set.volume * 100)}%`, 900);
      } else if (k === 'f' || k === 'F') toggleFull();
      else if (k === 'd' || k === 'D') { setDanmaku(!dm.on); emit('danmaku', dm.on); }
      else if (k === 'm' || k === 'M') { set.muted = !video.muted; applyVolume(); tip(set.muted ? '已静音' : '已取消静音', 900); }
      else if (k === 'Escape' && wrap.classList.contains('is-webfull')) toggleWebFull(false);
      else if (k === '[' || k === ']') {
        const i = SPEEDS.indexOf(video.playbackRate);
        const next = SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, (i === -1 ? 3 : i) + (k === ']' ? -1 : 1)))];
        video.playbackRate = next;
        tip(`已切换至 ${next}x 倍速播放`, 900);
      }
    });

    // ─────────── 断点续播 ───────────
    const progKey = () => `${bvid}:${cid}`;
    function saveProgress() {
      if (!video.duration || !started) return;
      const all = load('aliali:progress', {});
      if (video.currentTime >= video.duration - 5) all[progKey()] = -1;            // -1 = 已看完
      else if (video.currentTime > 5) all[progKey()] = Math.floor(video.currentTime);
      else if (all[progKey()] !== -1) delete all[progKey()];
      const keys = Object.keys(all);
      if (keys.length > 200) delete all[keys[0]];
      save('aliali:progress', all);
    }
    function resume() {
      const t = load('aliali:progress', {})[progKey()];
      if (!t || t < 0 || pendingSeek != null || t > video.duration - 5) return;
      video.currentTime = t;
      const el = tip(`已为您定位至 ${U.dur(t)}，<b class="bpx-link">从头播放</b>`, 5000);
      el.querySelector('.bpx-link').onclick = () => { seek(0); el.remove(); };
    }

    // ─────────── 播放结束 ───────────
    let nextTimer = 0;
    function onEnded() {
      saveProgress();
      const end = $('.bpx-ending');
      const next = opts.getNext?.();
      const auto = next && opts.autoNext?.();
      end.innerHTML = `<div class="end-box">
          <button class="end-btn" data-end="replay">${IC.replay}<span>重新播放</span></button>
          ${next ? `<a class="end-next" href="/video/${next.bvid}"><img src="${U.img(next.pic, '320w_180h_1c')}" alt=""><div><small>${auto ? '<b class="cd">3</b> 秒后自动播放' : '下一个视频'}</small><p>${U.esc(next.title)}</p></div></a>` : ''}
          ${auto ? '<button class="end-cancel" data-end="cancel">取消连播</button>' : ''}
        </div>`;
      end.classList.remove('hidden');
      end.querySelector('[data-end="replay"]').onclick = () => { clearInterval(nextTimer); seek(0); video.play(); };
      end.querySelector('[data-end="cancel"]')?.addEventListener('click', (e) => { clearInterval(nextTimer); e.target.remove(); end.querySelector('small').textContent = '下一个视频'; });
      if (auto) {
        let n = 3;
        nextTimer = setInterval(() => {
          n--;
          const cd = end.querySelector('.cd');
          if (cd) cd.textContent = n;
          if (n <= 0) { clearInterval(nextTimer); location.href = `/video/${next.bvid}`; }
        }, 1000);
      }
    }

    // ─────────── 弹幕引擎 ───────────
    const dm = { list: [], idx: 0, on: true, live: new Set(), rows: { scroll: [], top: [], bottom: [] } };
    const hex = (c) => '#' + (Number(c) || 0xffffff).toString(16).padStart(6, '0');
    function applyDmStyle() {
      layer.style.opacity = set.dmOpacity;
      $('[data-set="dmOpacity"]').value = Math.round(set.dmOpacity * 100);
      $('[data-set="dmOpacity"]').nextElementSibling.textContent = Math.round(set.dmOpacity * 100) + '%';
      area.querySelectorAll('[data-seg]').forEach((seg) => seg.querySelectorAll('b').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === set[seg.dataset.seg])));
    }
    $('[data-set="dmOpacity"]').addEventListener('input', (e) => { set.dmOpacity = e.target.value / 100; applyDmStyle(); persist(); });
    area.querySelectorAll('[data-seg]').forEach((seg) => seg.addEventListener('click', (e) => {
      const b = e.target.closest('b'); if (!b) return;
      set[seg.dataset.seg] = Number(b.dataset.v);
      applyDmStyle(); persist(); dmReset();
    }));
    applyDmStyle();

    // 弹幕屏蔽：按类型 / 彩色 / 关键词（自己发的弹幕不受影响）
    function isBlocked(d) {
      if (d.mine) return false;
      const b = set.dmBlock;
      const type = d.mode === 5 ? 'top' : d.mode === 4 ? 'bottom' : 'scroll';
      if (b[type]) return true;
      if (b.color && (Number(d.color) || 0xffffff) !== 0xffffff) return true;
      const text = String(d.text).toLowerCase();
      return set.dmWords.some((w) => text.includes(w.toLowerCase()));
    }
    function renderBlock() {
      area.querySelectorAll('[data-block] b').forEach((b) => b.classList.toggle('on', !!set.dmBlock[b.dataset.k]));
      $('.bw-tags').innerHTML = set.dmWords.map((w, i) => `<span class="bw-tag">${U.esc(w)}<b data-i="${i}" title="移除">×</b></span>`).join('');
      const n = dm.list.filter(isBlocked).length;
      $('.block-count').textContent = n ? `已屏蔽 ${n} 条弹幕` : set.dmWords.length || Object.values(set.dmBlock).some(Boolean) ? '暂无被屏蔽的弹幕' : '';
    }
    $('[data-block]').addEventListener('click', (e) => {
      const b = e.target.closest('b'); if (!b) return;
      set.dmBlock[b.dataset.k] = !set.dmBlock[b.dataset.k];
      persist(); renderBlock(); dmReset();
      tip(`${set.dmBlock[b.dataset.k] ? '已屏蔽' : '已取消屏蔽'}${b.textContent}弹幕`, 1200);
    });
    const bwInput = $('.bw-input input');
    const addWord = () => {
      const w = bwInput.value.trim();
      if (!w) return;
      if (!set.dmWords.includes(w)) set.dmWords.push(w);
      bwInput.value = '';
      persist(); renderBlock(); dmReset();
    };
    $('.bw-add').onclick = addWord;
    bwInput.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') addWord(); });
    $('.bw-tags').addEventListener('click', (e) => {
      const x = e.target.closest('[data-i]'); if (!x) return;
      set.dmWords.splice(Number(x.dataset.i), 1);
      persist(); renderBlock(); dmReset();
    });
    renderBlock();

    function lowerBound(t) { let lo = 0, hi = dm.list.length; while (lo < hi) { const m = (lo + hi) >> 1; if (dm.list[m].t < t) lo = m + 1; else hi = m; } return lo; }
    function dmReset() {
      dm.live.forEach((a) => a.cancel());
      dm.live.clear();
      layer.innerHTML = '';
      dm.rows = { scroll: [], top: [], bottom: [] };
      dm.idx = lowerBound(video.currentTime);
    }
    const dmPause = () => dm.live.forEach((a) => a.pause());
    const dmResume = () => dm.live.forEach((a) => a.play());
    const dmRate = () => dm.live.forEach((a) => a.updatePlaybackRate ? a.updatePlaybackRate(video.playbackRate) : (a.playbackRate = video.playbackRate));

    function shoot(d, force) {
      if (isBlocked(d)) return;
      const fs = Math.round(25 * set.dmSize * ((d.size || 25) / 25));
      const lineH = Math.round(fs * 1.25);
      const W = layer.clientWidth, H = layer.clientHeight * set.dmArea;
      const rows = Math.max(1, Math.floor(H / lineH));
      const el = document.createElement('div');
      el.className = 'bpx-dm' + (d.mine ? ' mine' : '');
      el.textContent = d.text;
      el.style.fontSize = fs + 'px';
      el.style.color = hex(d.color);
      if (hex(d.color) === '#000000') el.style.textShadow = '0 0 1px #fff, 0 0 1px #fff';
      const now = video.currentTime;
      let anim;
      if (d.mode === 4 || d.mode === 5) {
        const key = d.mode === 5 ? 'top' : 'bottom';
        let row = 0;
        while (row < rows && (dm.rows[key][row] || 0) > now) row++;
        if (row >= rows) { if (!force) return; row = 0; }
        dm.rows[key][row] = now + 4;
        el.classList.add('fixed');
        el.style[key === 'top' ? 'top' : 'bottom'] = (key === 'top' ? row * lineH : row * lineH + (layer.clientHeight - H)) + 'px';
        layer.appendChild(el);
        anim = el.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 4000 });
      } else {
        layer.appendChild(el);
        const w = el.offsetWidth;
        const dur = 8000 * set.dmSpeed;
        const v = (W + w) / dur;                  // px / ms（1 倍速下）
        let row = 0;
        while (row < rows && (dm.rows.scroll[row] || 0) > now) row++;
        if (row >= rows) { if (!force) { el.remove(); return; } row = Math.floor(Math.random() * rows); }
        dm.rows.scroll[row] = now + (w + 24) / v / 1000; // 尾巴完全进场后该行可再发
        el.style.top = row * lineH + 'px';
        anim = el.animate([{ transform: `translateX(${W}px)` }, { transform: `translateX(${-w}px)` }], { duration: dur, easing: 'linear' });
      }
      anim.playbackRate = video.playbackRate;
      if (video.paused) anim.pause();
      dm.live.add(anim);
      anim.onfinish = () => { el.remove(); dm.live.delete(anim); };
    }

    let rafId = 0;
    function loop() {
      cancelAnimationFrame(rafId);
      const step = () => {
        if (video.paused) return;
        if (!dragging) paintProgress(video.currentTime);
        if (dm.on) {
          const t = video.currentTime;
          let n = 0;
          while (dm.idx < dm.list.length && dm.list[dm.idx].t <= t) {
            const d = dm.list[dm.idx++];
            if (t - d.t < 1.2 && n < 14) { shoot(d); n++; }
          }
        }
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }

    function setDanmaku(on) {
      dm.on = on;
      layer.classList.toggle('hidden', !on);
      if (on) dmReset();
      tip(on ? '已开启弹幕 (D)' : '已关闭弹幕 (D)', 900);
    }

    // ─────────── 对外 API ───────────
    const api = {
      video,
      on(ev, fn) { (listeners[ev] ||= []).push(fn); return api; },
      setDanmakuList(list) { dm.list = [...list].sort((a, b) => a.t - b.t); dmReset(); renderBlock(); },
      setDanmaku,
      get danmakuOn() { return dm.on; },
      send(text, color) {
        const d = { t: video.currentTime, text, color: parseInt(color.slice(1), 16), mode: 1, size: 25, mine: true, ts: Math.floor(Date.now() / 1000) };
        dm.list.splice(dm.idx, 0, d);
        dm.idx++;
        if (dm.on) shoot(d, true);
        return d;
      },
      seek(t) { seek(t); if (video.paused) video.play().catch(() => {}); },
      play: () => video.play(),
      async switchCid(newCid) { saveProgress(); cid = newCid; started = false; await loadSource(false); video.play().catch(() => {}); },
      tip,
    };

    loadSource(false);
    return api;
  }

  window.AliPlayer = { create };
})();
