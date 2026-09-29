// AliAli —— AI 圈视频站本地服务
// 零依赖：静态文件 + B 站公开接口代理 + 定时同步白名单账号的最新投稿（SSE 实时推送）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { UPS, AI_RE, CHANNELS } from './config.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
// 数据目录：网站部署时在项目内；嵌入桌面客户端时由客户端指定到用户目录（安装目录只读）
const DATA = process.env.ALIALI_DATA || path.join(ROOT, 'data');
// 客户端安装包目录（由 client/scripts/publish.mjs 写入）
const DOWNLOADS = process.env.ALIALI_DOWNLOADS || path.join(ROOT, 'downloads');
const CACHE_FILE = path.join(DATA, 'cache.json');
const PORT = Number(process.env.PORT ?? 8520);
const HOST = process.env.HOST || undefined; // 客户端内置服务传 127.0.0.1，只对本机开放
const REFRESH_MS = 10 * 60 * 1000;
const PER_UP = 24;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const UP_MAP = new Map(UPS.map((u) => [u.mid, u]));

fs.mkdirSync(DATA, { recursive: true });
const log = (...a) => console.log(new Date().toLocaleTimeString('zh-CN', { hour12: false }), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────────────────── B 站请求客户端 ─────────────────────────
let cookie = '';
let cookieAt = 0;
async function ensureCookie() {
  if (cookie && Date.now() - cookieAt < 6 * 3600e3) return;
  try {
    const r = await fetch('https://api.bilibili.com/x/frontend/finger/spi', { headers: { 'User-Agent': UA } });
    const j = await r.json();
    cookie = `buvid3=${j.data.b_3}; buvid4=${encodeURIComponent(j.data.b_4)}; b_nut=${Math.floor(Date.now() / 1000)}`;
    cookieAt = Date.now();
  } catch (e) {
    log('cookie 获取失败', e.message);
  }
}

// 串行队列，保证请求之间有最小间隔，避免触发风控
let chain = Promise.resolve();
let lastReq = 0;
function queued(fn, gap = 700) {
  const run = chain.then(async () => {
    const wait = lastReq + gap - Date.now();
    if (wait > 0) await sleep(wait);
    lastReq = Date.now();
    return fn();
  });
  chain = run.catch(() => {});
  return run;
}

async function biliRaw(url, referer = 'https://www.bilibili.com/') {
  await ensureCookie();
  return fetch(url, { headers: { 'User-Agent': UA, Referer: referer, Cookie: cookie } });
}

async function biliJSON(url, { referer, gap, retries = 1 } = {}) {
  for (let i = 0; i <= retries; i++) {
    const res = await queued(() => biliRaw(url, referer), gap);
    const text = await res.text();
    let j;
    try { j = JSON.parse(text); } catch { j = { code: res.status, message: 'HTTP ' + res.status }; }
    if (j.code === 0) return j;
    if (i < retries && (res.status === 412 || j.code === -352 || j.code === -412)) {
      await sleep(4000 * (i + 1));
      continue;
    }
    const err = new Error(`${j.code} ${j.message || ''}`.trim());
    err.code = j.code;
    throw err;
  }
}

// ───────────────────────── 数据仓库 ─────────────────────────
let store = { updatedAt: 0, ups: {}, videos: {} };
try {
  store = { ...store, ...JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) };
  log(`载入缓存：${Object.keys(store.videos).length} 个视频`);
} catch {}
const saveStore = () => fs.writeFile(CACHE_FILE, JSON.stringify(store), () => {});

const httpsPic = (u) => (u || '').replace(/^http:/, 'https:').replace(/^\/\//, 'https://');
function channelsOf(title, desc) {
  const s = `${title} ${desc || ''}`;
  return CHANNELS.filter((c) => c.re.test(s)).map((c) => c.id);
}
function isAI(up, title, desc) {
  return !up.filter || AI_RE.test(title) || AI_RE.test((desc || '').slice(0, 120));
}

async function fetchUploads(up) {
  try {
    const j = await biliJSON(`https://api.bilibili.com/x/series/recArchivesByKeywords?mid=${up.mid}&keywords=&ps=${PER_UP}`, { gap: 1500 });
    return j.data.archives || [];
  } catch (e) {
    // 兜底：合集 / 系列列表（对风控账号依然可用）
    const j = await biliJSON(`https://api.bilibili.com/x/polymer/web-space/seasons_series_list?mid=${up.mid}&page_num=1&page_size=10`, { gap: 1500, referer: 'https://space.bilibili.com/' });
    const lists = [...(j.data.items_lists?.seasons_list || []), ...(j.data.items_lists?.series_list || [])];
    const all = lists.flatMap((l) => l.archives || []);
    if (!all.length) throw e;
    const uniq = new Map(all.map((a) => [a.bvid, a]));
    return [...uniq.values()].sort((a, b) => b.pubdate - a.pubdate).slice(0, PER_UP);
  }
}

async function fetchCard(mid) {
  const j = await biliJSON(`https://api.bilibili.com/x/web-interface/card?mid=${mid}`);
  const c = j.data.card;
  return {
    mid, name: c.name, face: httpsPic(c.face), sign: c.sign, fans: c.fans, attention: c.attention,
    level: c.level_info?.current_level ?? 0,
    official: { type: c.Official?.type ?? -1, title: c.Official?.title || '' },
    vip: c.vip?.status === 1 ? c.vip.type : 0,
    archives: j.data.archive_count, likes: j.data.like_num,
    fetchedAt: Date.now(),
  };
}

// 批量刷新统计（播放 / 弹幕 / 点赞 / 投币 / 收藏）
async function refreshStats(videos) {
  for (let i = 0; i < videos.length; i += 20) {
    const chunk = videos.slice(i, i + 20);
    try {
      const j = await biliJSON(`https://api.bilibili.com/medialist/gateway/base/resource/infos?resources=${chunk.map((v) => v.aid + ':2').join(',')}`);
      for (const it of j.data || []) {
        const v = store.videos[it.bv_id] || videos.find((x) => x.aid === it.id);
        if (!v) continue;
        const c = it.cnt_info;
        v.stat = { view: c.play, danmaku: c.danmaku, like: c.thumb_up, coin: c.coin, favorite: c.collect, reply: c.reply, share: c.share };
      }
    } catch (e) {
      log('统计刷新失败', e.message);
    }
  }
}

// ───────────────────────── SSE ─────────────────────────
const clients = new Set();
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(msg);
}
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 25000);

let syncing = false;
let nextSyncAt = Date.now();
async function sync() {
  if (syncing) return;
  syncing = true;
  const t0 = Date.now();
  const added = [];
  let okUps = 0;
  log('开始同步 AI 圈最新投稿…');
  broadcast('sync', { state: 'start' });
  for (const up of UPS) {
    try {
      const arcs = await fetchUploads(up);
      okUps++;
      for (const a of arcs) {
        if (!isAI(up, a.title, a.desc)) continue;
        const old = store.videos[a.bvid];
        const v = old || { firstSeen: Date.now() };
        Object.assign(v, {
          bvid: a.bvid, aid: a.aid, title: a.title, pic: httpsPic(a.pic), duration: a.duration,
          pubdate: a.pubdate, desc: (a.desc || '').slice(0, 200), mid: up.mid,
          owner: store.ups[up.mid]?.name || up.name, kind: up.kind,
          channels: channelsOf(a.title, a.desc),
        });
        v.stat = v.stat || { view: a.stat?.view || 0, danmaku: 0, like: 0, coin: 0, favorite: 0, reply: 0, share: 0 };
        if (a.stat?.view > v.stat.view) v.stat.view = a.stat.view;
        if (!old) {
          store.videos[a.bvid] = v;
          if (store.updatedAt) added.push(a.bvid);
        }
      }
      broadcast('sync', { state: 'progress', done: okUps, total: UPS.length, name: up.name });
    } catch (e) {
      log(`  ✗ ${up.name} 投稿获取失败：${e.message}`);
    }
  }

  // 每个 UP 只保留最近 PER_UP 条，避免无限增长
  const byUp = {};
  for (const v of Object.values(store.videos)) (byUp[v.mid] ||= []).push(v);
  for (const list of Object.values(byUp)) {
    list.sort((a, b) => b.pubdate - a.pubdate).slice(PER_UP).forEach((v) => delete store.videos[v.bvid]);
  }
  for (const bv of Object.keys(store.videos)) if (!UP_MAP.has(store.videos[bv].mid)) delete store.videos[bv];

  await refreshStats(Object.values(store.videos));

  for (const up of UPS) {
    const c = store.ups[up.mid];
    if (c && Date.now() - c.fetchedAt < 12 * 3600e3) continue;
    try {
      store.ups[up.mid] = await fetchCard(up.mid);
      for (const v of Object.values(store.videos)) if (v.mid === up.mid) v.owner = store.ups[up.mid].name;
    } catch (e) {
      log(`  ✗ ${up.name} 名片获取失败：${e.message}`);
    }
  }

  store.updatedAt = Date.now();
  saveStore();
  syncing = false;
  nextSyncAt = Date.now() + REFRESH_MS;
  log(`同步完成：${okUps}/${UPS.length} 个账号，${Object.keys(store.videos).length} 个视频，收录 ${added.length}，用时 ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  const fresh = added.map((bv) => store.videos[bv]).filter((v) => v && Date.now() / 1000 - v.pubdate < 48 * 3600);
  broadcast('sync', { state: 'done', updatedAt: store.updatedAt, added: fresh.map(pub), total: Object.keys(store.videos).length });
}

function scheduleSync() {
  sync().catch((e) => { syncing = false; log('同步异常', e); }).finally(() => setTimeout(scheduleSync, REFRESH_MS));
}

// ───────────────────────── 推荐排序 ─────────────────────────
function pub(v) {
  const up = store.ups[v.mid];
  return { ...v, face: up?.face || '', official: up?.official?.type === 1 || v.kind === 'official' };
}
function heat(v, now = Date.now() / 1000) {
  const ageH = Math.max(1, (now - v.pubdate) / 3600);
  const s = v.stat || {};
  const engage = (s.view || 0) + (s.like || 0) * 8 + (s.coin || 0) * 12 + (s.favorite || 0) * 10 + (s.danmaku || 0) * 5;
  return Math.log10(engage + 10) * 10 - Math.log2(ageH) * 3.2;
}
// 带种子的伪随机，用于“换一换”
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function feed({ channel, sort, q, mid, seed, offset, limit }) {
  let list = Object.values(store.videos);
  if (channel === 'official') list = list.filter((v) => v.kind === 'official');
  else if (channel) list = list.filter((v) => v.channels?.includes(channel));
  if (mid) list = list.filter((v) => String(v.mid) === String(mid));
  if (q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((v) => words.every((w) => `${v.title} ${v.owner} ${v.desc}`.toLowerCase().includes(w)));
  }
  if (sort === 'new') list.sort((a, b) => b.pubdate - a.pubdate);
  else if (sort === 'hot') list.sort((a, b) => (b.stat?.view || 0) - (a.stat?.view || 0));
  else {
    const rnd = seeded(Number(seed) || 1);
    list = list.map((v) => ({ v, k: heat(v) + rnd() * 9 })).sort((a, b) => b.k - a.k).map((x) => x.v);
    // 同一 UP 不扎堆：每 6 条里同一个 UP 最多出现 2 次
    const out = [];
    const pending = [...list];
    while (pending.length) {
      const window = out.slice(-6);
      const idx = pending.findIndex((v) => window.filter((w) => w.mid === v.mid).length < 2);
      out.push(...pending.splice(idx === -1 ? 0 : idx, 1));
    }
    list = out;
  }
  return { total: list.length, items: list.slice(offset, offset + limit).map(pub) };
}

// ───────────────────────── 详情页接口 ─────────────────────────
const memo = new Map();
async function cached(key, ttl, fn) {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  const v = await fn();
  memo.set(key, { t: Date.now(), v });
  if (memo.size > 500) memo.delete(memo.keys().next().value);
  return v;
}

async function videoDetail(bvid) {
  const view = (await biliJSON(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, { gap: 300 })).data;
  // 联合投稿：主投稿人或任一 staff 在白名单内即可
  const member = [view.owner.mid, ...(view.staff || []).map((s) => s.mid)].find((mid) => UP_MAP.has(mid));
  if (!member) {
    const e = new Error('AliAli 只收录 AI 圈博主与 AI 公司官方账号的视频');
    e.status = 403;
    throw e;
  }
  const [tags, card] = await Promise.all([
    biliJSON(`https://api.bilibili.com/x/tag/archive/tags?bvid=${bvid}`, { gap: 300 }).then((j) => j.data.map((t) => t.tag_name)).catch(() => []),
    cached('card' + view.owner.mid, 30 * 60e3, () => fetchCard(view.owner.mid)).catch(() => store.ups[view.owner.mid] || null),
  ]);
  // 顺便更新仓库里的统计
  const v = store.videos[bvid];
  if (v) Object.assign(v.stat, { view: view.stat.view, danmaku: view.stat.danmaku, like: view.stat.like, coin: view.stat.coin, favorite: view.stat.favorite, reply: view.stat.reply, share: view.stat.share });
  return {
    bvid, aid: view.aid, cid: view.cid, title: view.title, desc: view.desc, pic: httpsPic(view.pic),
    pubdate: view.pubdate, duration: view.duration, copyright: view.copyright, tname: view.tname_v2 || view.tname,
    pages: (view.pages || []).map((p) => ({ cid: p.cid, page: p.page, part: p.part, duration: p.duration })),
    stat: view.stat, owner: { ...view.owner, face: httpsPic(view.owner.face) }, card, tags,
    kind: UP_MAP.get(member).kind,
    staff: (view.staff || []).map((s) => ({ mid: s.mid, name: s.name, face: httpsPic(s.face), title: s.title })),
    honor: (view.honor_reply?.honor || []).map((h) => h.desc),
  };
}

// ───────────────────────── 视频流 ─────────────────────────
// 只允许白名单视频取流：先查仓库，再查（或拉取）详情做校验
async function assertAllowed(bvid) {
  if (store.videos[bvid]) return;
  await cached('v' + bvid, 45e3, () => videoDetail(bvid));
}

// 取 MP4 直链（html5 平台 + 带音轨的单文件，免登录最高 720P），链接约 2 小时过期，缓存 20 分钟
const QN_DESC = { 16: '360P 流畅', 32: '480P 清晰', 64: '720P 高清', 80: '1080P 高清' };
async function playInfo(bvid, cid, qn = 64, fresh = false) {
  const key = `p${bvid}-${cid}-${qn}`;
  if (fresh) memo.delete(key);
  return cached(key, 20 * 60e3, async () => {
    const j = await biliJSON(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=${qn}&fnval=1&fnver=0&platform=html5&high_quality=1`, { gap: 300 });
    const d = j.data;
    const seg = d.durl?.[0];
    if (!seg) throw new Error('没有可用的视频流');
    return {
      quality: d.quality,
      qualities: (d.accept_quality || []).filter((q) => q <= 64).map((q) => ({ qn: q, desc: QN_DESC[q] || d.accept_description?.[d.accept_quality.indexOf(q)] || q + 'P' })),
      urls: [seg.url, ...(seg.backup_url || [])],
      size: seg.size,
      length: seg.length,
    };
  });
}

async function proxyStream(req, res, bvid, cid, qn) {
  await assertAllowed(bvid);
  const abort = new AbortController();
  res.on('close', () => abort.abort());
  for (let attempt = 0; attempt < 2; attempt++) {
    const info = await playInfo(bvid, cid, qn, attempt > 0);
    for (const u of info.urls) {
      const headers = { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' };
      if (req.headers.range) headers.Range = req.headers.range;
      let r;
      try { r = await fetch(u, { headers, signal: abort.signal }); } catch { if (abort.signal.aborted) return; continue; }
      if (r.status === 200 || r.status === 206) {
        const out = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
        for (const k of ['content-length', 'content-range']) { const v = r.headers.get(k); if (v) out[k] = v; }
        res.writeHead(r.status, out);
        Readable.fromWeb(r.body).on('error', () => res.destroy()).pipe(res);
        return;
      }
      r.body?.cancel().catch(() => {});
    }
  }
  send(res, 502, { error: '视频流获取失败' });
}

function related(bvid) {
  const self = store.videos[bvid];
  const all = Object.values(store.videos).filter((v) => v.bvid !== bvid);
  if (!self) return all.sort((a, b) => heat(b) - heat(a)).slice(0, 20).map(pub);
  const sameUp = all.filter((v) => v.mid === self.mid).sort((a, b) => b.pubdate - a.pubdate).slice(0, 4);
  const overlap = (v) => (v.channels || []).filter((c) => self.channels?.includes(c)).length;
  const rest = all.filter((v) => v.mid !== self.mid).sort((a, b) => overlap(b) * 6 + heat(b) - (overlap(a) * 6 + heat(a)));
  return [...sameUp, ...rest].slice(0, 20).map(pub);
}

// 评论：新版 main 接口，mode=3 最热 / mode=2 最新（旧接口按时间排序在未登录时返回空）
// 注意：未登录状态下 bilibili 只开放每个视频的前几条评论，cursor.is_end 会直接为 true
async function replies(aid, sort, pn) {
  const mode = sort === 0 ? 2 : 3;
  const j = await biliJSON(`https://api.bilibili.com/x/v2/reply/main?type=1&oid=${aid}&mode=${mode}&next=${pn > 1 ? pn : 0}&ps=20`, { gap: 300 });
  const map = (r) => ({
    rpid: r.rpid_str, ctime: r.ctime, like: r.like, rcount: r.rcount,
    message: r.content?.message || '',
    emote: Object.fromEntries(Object.entries(r.content?.emote || {}).map(([k, e]) => [k, httpsPic(e.url)])),
    pictures: (r.content?.pictures || []).map((p) => httpsPic(p.img_src)).slice(0, 3),
    member: { mid: r.member.mid, uname: r.member.uname, avatar: httpsPic(r.member.avatar), level: r.member.level_info?.current_level ?? 0, vip: r.member.vip?.vipStatus === 1, sign: r.member.sign },
    upLike: !!r.up_action?.like, location: r.reply_control?.location || '',
    replies: (r.replies || []).slice(0, 3).map(map),
  });
  const c = j.data.cursor || {};
  const top = (j.data.top_replies || [])[0] || j.data.upper?.top;
  const list = (j.data.replies || []).filter((r) => !top || r.rpid !== top.rpid).map(map);
  return { count: c.all_count || 0, top: top && pn === 1 ? map(top) : null, list, isEnd: !!c.is_end || !list.length };
}

async function danmaku(cid) {
  const res = await queued(() => biliRaw(`https://comment.bilibili.com/${cid}.xml`), 300);
  const buf = Buffer.from(await res.arrayBuffer());
  let xml;
  try { xml = zlib.inflateRawSync(buf).toString('utf8'); } catch { xml = buf.toString('utf8'); }
  const out = [];
  const re = /<d p="([^"]+)">([^<]*)<\/d>/g;
  let m;
  const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  while ((m = re.exec(xml))) {
    const p = m[1].split(',');
    out.push({ t: +p[0], mode: +p[1], size: +p[2], color: +p[3], ts: +p[4], text: unesc(m[2]) });
  }
  return out.sort((a, b) => a.t - b.t);
}

// ───────────────────────── HTTP ─────────────────────────
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function serveFile(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, { error: 'not found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

const IMG_HOST = /^i\d\.hdslb\.com$|^[a-z0-9-]+\.hdslb\.com$/;
async function proxyImage(res, u) {
  let url;
  try { url = new URL(u); } catch { return send(res, 400, { error: 'bad url' }); }
  if (!IMG_HOST.test(url.hostname)) return send(res, 403, { error: 'host not allowed' });
  url.protocol = 'https:';
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } });
    if (!r.ok) return send(res, r.status, { error: 'upstream ' + r.status });
    const buf = Buffer.from(await r.arrayBuffer());
    res.writeHead(200, { 'Content-Type': r.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  } catch (e) {
    send(res, 502, { error: e.message });
  }
}

const BV_RE = /^BV[0-9A-Za-z]{10}$/;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = decodeURIComponent(url.pathname);
  const qs = Object.fromEntries(url.searchParams);
  try {
    if (p === '/' || p === '/index.html') return serveFile(res, path.join(PUBLIC, 'index.html'));
    if (/^\/video\/BV[0-9A-Za-z]{10}\/?$/.test(p)) return serveFile(res, path.join(PUBLIC, 'video.html'));
    if (p === '/space' || p === '/space/') return serveFile(res, path.join(PUBLIC, 'space.html'));

    // 桌面客户端：版本信息 + 安装包下载
    if (p === '/api/client') {
      try {
        const info = JSON.parse(fs.readFileSync(path.join(DOWNLOADS, 'latest.json'), 'utf8'));
        return send(res, 200, { ...info, url: `/download/${encodeURIComponent(info.file)}` });
      } catch {
        return send(res, 404, { error: '客户端安装包尚未发布' });
      }
    }
    if (p.startsWith('/download/')) {
      const name = path.basename(p.slice('/download/'.length));
      const file = path.join(DOWNLOADS, name);
      if (!/\.(exe|zip|dmg|AppImage)$/i.test(name) || !fs.existsSync(file)) return send(res, 404, { error: '安装包不存在' });
      const size = fs.statSync(file).size;
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': size,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Cache-Control': 'no-cache',
      });
      return fs.createReadStream(file).pipe(res);
    }

    if (p === '/api/feed') {
      const limit = Math.min(60, Number(qs.limit) || 30);
      return send(res, 200, { ...feed({ ...qs, offset: Number(qs.offset) || 0, limit }), updatedAt: store.updatedAt, syncing });
    }
    if (p === '/api/status') {
      return send(res, 200, { updatedAt: store.updatedAt, nextSyncAt, syncing, videos: Object.keys(store.videos).length, ups: UPS.length });
    }
    if (p === '/api/ups') {
      const counts = {};
      for (const v of Object.values(store.videos)) counts[v.mid] = (counts[v.mid] || 0) + 1;
      return send(res, 200, UPS.map((u) => ({ ...u, ...(store.ups[u.mid] || {}), videos: counts[u.mid] || 0 })));
    }
    if (p === '/api/channels') return send(res, 200, CHANNELS.map(({ id, name }) => ({ id, name })));
    if (p === '/api/hotwords') {
      const top = Object.values(store.videos).sort((a, b) => heat(b) - heat(a)).slice(0, 10);
      return send(res, 200, top.map((v) => ({ word: v.title.replace(/[【\[].*?[】\]]/g, '').replace(/[！!？?，,。|｜].*$/, '').trim().slice(0, 18) || v.title.slice(0, 18), bvid: v.bvid, view: v.stat?.view || 0 })));
    }
    if (p === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(`event: hello\ndata: ${JSON.stringify({ updatedAt: store.updatedAt, syncing, nextSyncAt })}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    let m;
    if ((m = p.match(/^\/api\/video\/(BV\w{10})$/)) && BV_RE.test(m[1])) {
      return send(res, 200, await cached('v' + m[1], 45e3, () => videoDetail(m[1])));
    }
    if ((m = p.match(/^\/api\/related\/(BV\w{10})$/))) return send(res, 200, related(m[1]));
    if ((m = p.match(/^\/api\/replies\/(\d+)$/))) {
      const sort = qs.sort === '0' ? 0 : 1;
      const pn = Math.max(1, Number(qs.pn) || 1);
      return send(res, 200, await cached(`r${m[1]}-${sort}-${pn}`, 60e3, () => replies(m[1], sort, pn)));
    }
    if ((m = p.match(/^\/api\/playurl\/(BV\w{10})\/(\d+)$/))) {
      await assertAllowed(m[1]);
      const info = await playInfo(m[1], m[2], Number(qs.qn) || 64);
      return send(res, 200, { quality: info.quality, qualities: info.qualities, size: info.size, length: info.length });
    }
    if ((m = p.match(/^\/stream\/(BV\w{10})\/(\d+)\/(\d+)$/))) return await proxyStream(req, res, m[1], m[2], Number(m[3]));
    if ((m = p.match(/^\/api\/online\/(BV\w{10})\/(\d+)$/))) {
      return send(res, 200, await cached(`o${m[1]}`, 30e3, () => biliJSON(`https://api.bilibili.com/x/player/online/total?bvid=${m[1]}&cid=${m[2]}`, { gap: 300 }).then((j) => ({ total: j.data.total, count: j.data.count })).catch(() => ({ total: '1', count: '1' }))));
    }
    if ((m = p.match(/^\/api\/danmaku\/(\d+)$/))) return send(res, 200, await cached('d' + m[1], 120e3, () => danmaku(m[1])));
    if (p === '/img') return proxyImage(res, qs.u || '');

    // 静态资源
    const file = path.normalize(path.join(PUBLIC, p));
    if (!file.startsWith(PUBLIC)) return send(res, 403, { error: 'forbidden' });
    return serveFile(res, file);
  } catch (e) {
    send(res, e.status || 502, { error: e.message, code: e.code });
  }
});

// 供桌面客户端 import 后拿到实际端口（PORT=0 时由系统分配空闲端口）
export const ready = new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(PORT, HOST, () => {
    const port = server.address().port;
    log(`AliAli 已启动 → http://localhost:${port}`);
    const fresh = store.updatedAt && Date.now() - store.updatedAt < REFRESH_MS;
    if (fresh) { nextSyncAt = store.updatedAt + REFRESH_MS; setTimeout(scheduleSync, nextSyncAt - Date.now()); }
    else scheduleSync();
    resolve({ port, server });
  });
});
