// AliAli 桌面客户端（Electron 主进程）
// - 默认启动内置的 AliAli 服务（只监听 127.0.0.1），安装即用
// - client.json 里配置了线上地址时优先连接线上站点，连不上自动退回内置服务
const { app, BrowserWindow, Menu, Tray, shell, nativeImage, dialog, ipcMain, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const SMOKE = process.argv.includes('--smoke-test');
const VERSION = app.getVersion();
const APP_DIR = __dirname;
const SITE_DIR = app.isPackaged ? path.join(process.resourcesPath, 'site') : path.join(APP_DIR, '..');
const ICON = path.join(APP_DIR, 'build', 'icon.png');
const cfg = (() => { try { return JSON.parse(fs.readFileSync(path.join(APP_DIR, 'client.json'), 'utf8')); } catch { return {}; } })();

app.setAppUserModelId('com.aliali.desktop');
// 自检 / 便携模式：用 ALIALI_USER_DATA 指定独立的数据目录
if (process.env.ALIALI_USER_DATA) app.setPath('userData', process.env.ALIALI_USER_DATA);
if (!SMOKE && !app.requestSingleInstanceLock()) { app.quit(); return; }

let win = null;
let tray = null;
let origin = '';        // 当前加载的站点，例如 http://127.0.0.1:53211 或 https://your-domain.com
let mode = 'local';

// ─────────── 站点：线上优先，内置兜底 ───────────
async function reachable(url) {
  try {
    const r = await fetch(url.replace(/\/$/, '') + '/api/status', { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch { return false; }
}
let localServer = null;
async function startLocal() {
  if (localServer) return localServer;
  const dataDir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  // 首次启动：用安装包里自带的数据快照，打开就有视频；随后后台自动同步最新投稿
  const cache = path.join(dataDir, 'cache.json');
  const seed = [path.join(SITE_DIR, 'seed-cache.json'), path.join(SITE_DIR, 'data', 'cache.json')].find((f) => fs.existsSync(f));
  if (!fs.existsSync(cache) && seed) {
    try {
      const snap = JSON.parse(fs.readFileSync(seed, 'utf8'));
      snap.updatedAt = 1; // 标记为“需要尽快同步”，启动后立即拉取最新数据
      fs.writeFileSync(cache, JSON.stringify(snap));
    } catch {}
  }
  Object.assign(process.env, { PORT: '0', HOST: '127.0.0.1', ALIALI_DATA: dataDir });
  const mod = await import(pathToFileURL(path.join(SITE_DIR, 'server.js')).href);
  const { port } = await mod.ready;
  localServer = `http://127.0.0.1:${port}`;
  return localServer;
}
async function resolveOrigin() {
  const remote = (process.env.ALIALI_REMOTE || cfg.remote || '').trim();
  if (remote && (await reachable(remote))) { mode = 'remote'; return remote.replace(/\/$/, ''); }
  mode = 'local';
  return startLocal();
}

// ─────────── 窗口 ───────────
const boundsFile = () => path.join(app.getPath('userData'), 'window.json');
function loadBounds() {
  try {
    const b = JSON.parse(fs.readFileSync(boundsFile(), 'utf8'));
    const area = screen.getDisplayMatching(b).workArea;
    if (b.x >= area.x - 50 && b.y >= area.y - 50 && b.width <= area.width + 100) return b;
  } catch {}
  return { width: 1360, height: 860 };
}
function saveBounds() {
  if (!win || win.isDestroyed() || win.isMinimized() || win.isFullScreen()) return;
  try { fs.writeFileSync(boundsFile(), JSON.stringify({ ...win.getBounds(), maximized: win.isMaximized() })); } catch {}
}

const LOADING_HTML = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><meta charset="utf-8"><title>AliAli</title>
<style>html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#fff;font-family:"Microsoft YaHei",sans-serif;color:#9499a0}
svg{width:120px;height:120px;animation:b 1.2s ease-in-out infinite}@keyframes b{50%{transform:translateY(-8px)}}p{margin-top:14px;font-size:14px}</style>
<svg viewBox="0 0 64 64" fill="none"><path d="M32 13V7.5M29.4 5.2L24.5 3M34.6 5.2L39.5 3" stroke="#1f2a44" stroke-width="1.8" stroke-linecap="round"/><circle cx="32" cy="5.6" r="3.1" fill="#35e0ff" stroke="#1f2a44" stroke-width="1.6"/><circle cx="23.5" cy="2.6" r="1.7" fill="#fb7299"/><circle cx="40.5" cy="2.6" r="1.7" fill="#fb7299"/><path d="M2.5 26h3.5M2.5 31h3.5M2.5 36h3.5M58 26h3.5M58 31h3.5M58 36h3.5" stroke="#1f2a44" stroke-width="2" stroke-linecap="round"/><rect x="6" y="13" width="52" height="40" rx="10" fill="#eef2f8" stroke="#1f2a44" stroke-width="3"/><rect x="11" y="18" width="42" height="30" rx="6.5" fill="#18233c"/><rect x="16.5" y="28.5" width="11" height="5" rx="2.5" fill="#35e0ff"/><rect x="36.5" y="28.5" width="11" height="5" rx="2.5" fill="#35e0ff"/><path d="M25.5 41h3l1.5-2.5 2 5 2-5 1.5 2.5h3" stroke="#35e0ff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="51.5" cy="50.6" r="1.3" fill="#fb7299"/><rect x="28" y="53" width="8" height="4.5" fill="#1f2a44"/><rect x="19" y="57" width="26" height="4" rx="2" fill="#1f2a44"/></svg>
<p>AliAli 正在启动…</p>`)}`;

function isInternal(url) {
  try { return new URL(url).origin === origin; } catch { return false; }
}

function createWindow() {
  const b = loadBounds();
  win = new BrowserWindow({
    ...b,
    minWidth: 1100,
    minHeight: 680,
    title: 'AliAli',
    icon: ICON,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    show: !SMOKE,
    webPreferences: {
      preload: path.join(APP_DIR, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });
  if (b.maximized) win.maximize();
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} AliAliClient/${VERSION}`);
  win.loadURL(LOADING_HTML);

  // 链接：站内在当前窗口打开（与 B 站客户端一致），站外交给系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternal(url)) win.loadURL(url);
    else if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!isInternal(url) && !url.startsWith('data:')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); }
  });

  // 快捷键：Alt+←/→ 后退前进，F5 刷新，F11 全屏，Ctrl+Shift+I 开发者工具
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const nav = win.webContents.navigationHistory;
    if (input.alt && input.key === 'ArrowLeft' && nav.canGoBack()) { nav.goBack(); e.preventDefault(); }
    else if (input.alt && input.key === 'ArrowRight' && nav.canGoForward()) { nav.goForward(); e.preventDefault(); }
    else if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) { win.webContents.reload(); e.preventDefault(); }
    else if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (input.control && input.shift && input.key.toLowerCase() === 'i') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  // 鼠标侧键后退 / 前进
  win.on('app-command', (e, cmd) => {
    const nav = win.webContents.navigationHistory;
    if (cmd === 'browser-backward' && nav.canGoBack()) nav.goBack();
    if (cmd === 'browser-forward' && nav.canGoForward()) nav.goForward();
  });

  // 右键菜单
  win.webContents.on('context-menu', (e, p) => {
    const items = [];
    if (p.linkURL) {
      // 内置服务模式下，站内视频链接在浏览器里打开 bilibili 原视频（本地地址离开客户端就失效）
      const bv = isInternal(p.linkURL) && mode === 'local' && p.linkURL.match(/\/video\/(BV\w{10})/);
      items.push({ label: bv ? '在浏览器中打开 bilibili 原视频' : '在浏览器中打开链接', click: () => shell.openExternal(bv ? `https://www.bilibili.com/video/${bv[1]}` : p.linkURL) });
      items.push({ label: '复制链接地址', click: () => require('electron').clipboard.writeText(p.linkURL) });
      items.push({ type: 'separator' });
    }
    if (p.isEditable) items.push({ role: 'cut', label: '剪切' }, { role: 'copy', label: '复制' }, { role: 'paste', label: '粘贴' }, { role: 'selectAll', label: '全选' });
    else if (p.selectionText) items.push({ role: 'copy', label: '复制' });
    if (items.length && items[items.length - 1].type !== 'separator') items.push({ type: 'separator' });
    const nav = win.webContents.navigationHistory;
    items.push({ label: '后退', enabled: nav.canGoBack(), click: () => nav.goBack() }, { label: '前进', enabled: nav.canGoForward(), click: () => nav.goForward() }, { label: '刷新', click: () => win.webContents.reload() });
    Menu.buildFromTemplate(items).popup({ window: win });
  });

  // 网页里的全屏（播放器全屏按钮）→ 窗口全屏
  win.on('resize', saveBounds);
  win.on('move', saveBounds);
  win.on('close', saveBounds);
  win.on('closed', () => { win = null; });
}

// ─────────── 托盘 ───────────
function createTray() {
  const img = nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip('AliAli · 只看 AI 圈');
  const go = (p) => { showWindow(); win.loadURL(origin + p); };
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开 AliAli', click: showWindow },
    { type: 'separator' },
    { label: '首页', click: () => go('/') },
    { label: '个人空间', click: () => go('/space') },
    { label: '历史记录', click: () => go('/space#history') },
    { type: 'separator' },
    { label: `关于 AliAli v${VERSION}`, click: about },
    { label: '退出', click: () => app.quit() },
  ]));
  tray.on('click', showWindow);
}
function showWindow() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
function about() {
  dialog.showMessageBox(win, {
    type: 'info', title: '关于 AliAli', icon: ICON,
    message: `AliAli 桌面客户端 v${VERSION}`,
    detail: `只看 AI 圈 —— 实时同步 AI 博主与 AI 公司官方的最新视频\n\n当前站点：${origin}（${mode === 'remote' ? '线上服务' : '内置服务'}）\n数据目录：${app.getPath('userData')}`,
  });
}

ipcMain.handle('aliali:info', () => ({ version: VERSION, mode, origin }));
ipcMain.on('aliali:about', about);

// ─────────── 启动 ───────────
app.on('second-instance', showWindow);
app.on('window-all-closed', () => app.quit());

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  createWindow();
  if (!SMOKE) createTray();
  try {
    origin = await resolveOrigin();
  } catch (e) {
    dialog.showErrorBox('AliAli 启动失败', '内置服务启动失败：' + e.message);
    app.exit(1);
    return;
  }
  await win.loadURL(origin + '/');

  if (SMOKE) {
    // 自检：页面能打开、头部存在、接口正常
    const result = await win.webContents.executeJavaScript(`(async () => {
      const s = await fetch('/api/status').then(r => r.json());
      await new Promise(r => setTimeout(r, 1500));
      return { title: document.title, header: !!document.querySelector('.bili-header__bar'), channel: !!document.querySelector('.channel-icons'), ua: navigator.userAgent.includes('AliAliClient'), bridge: !!window.aliClient, status: s };
    })()`);
    const ok = result.header && result.channel && result.ua && result.bridge && typeof result.status.videos === 'number';
    console.log('SMOKE_RESULT ' + JSON.stringify({ ok, origin, mode, version: VERSION, ...result }));
    app.exit(ok ? 0 : 1);
  }
});
