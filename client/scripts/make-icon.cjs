// 生成应用图标：渐变圆角方块 + 白色 AliAli 手写字标
//   electron scripts/make-icon.cjs            → 用默认配色生成 build/icon.png + build/icon.svg
//   electron scripts/make-icon.cjs mint       → 指定配色
//   electron scripts/make-icon.cjs --preview  → 生成三种配色的对比图 build/icon-preview.png
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const THEMES = {
  blue: ['#3ccfff', '#0092e6'],   // AliAli 蓝（默认）
  violet: ['#a08cff', '#5d45f5'],
  mint: ['#4fe3b8', '#0fae84'],
};
const DEFAULT = 'blue';

// AliAli 原创手写字标（与网站 Logo 同一套单线笔画，见 public/js/common.js 的 logo()）
function wordmark() {
  const A = (x) => `<path d="M${x + 3} 41C${x + 8} 30 ${x + 12} 16 ${x + 17.5} 6.5C${x + 19} 4 ${x + 21.6} 4.3 ${x + 21.6} 8L${x + 22} 39.5"/><path d="M${x + 8.5} 28.5Q${x + 17} 25 ${x + 26} 27"/>`;
  const l = (x) => `<path d="M${x + 30} 5.5C${x + 30} 18 ${x + 29.6} 30 ${x + 30.4} 36C${x + 30.8} 40 ${x + 33} 41.5 ${x + 36} 39.5"/>`;
  const i = (x) => `<path d="M${x + 41} 23.5L${x + 41} 36C${x + 41} 40 ${x + 43} 41.5 ${x + 45.6} 39.5"/><circle cx="${x + 41.6}" cy="14.5" r="3.2" fill="#fff" stroke="none"/>`;
  return `<g transform="skewX(-9) translate(5 0)">${A(0)}${l(0)}${i(0)}${A(47)}${l(47)}${i(47)}</g>`;
}

function iconSVG(theme, size = 512) {
  const [c1, c2] = THEMES[theme];
  const s = 4.3; // 字标约 91×38，放大后居中
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="g-${theme}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#g-${theme})"/>
  <g transform="translate(${(256 - 46.5 * s).toFixed(1)} ${(256 - 23 * s).toFixed(1)}) scale(${s})" fill="none" stroke="#fff" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round">${wordmark()}</g>
</svg>`;
}

async function capture(html, w, h) {
  const win = new BrowserWindow({ width: w, height: h, show: false, frame: false, transparent: true, webPreferences: { offscreen: true } });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<html><body style="margin:0;background:transparent">${html}</body></html>`));
  await new Promise((r) => setTimeout(r, 300));
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: w, height: h });
  win.destroy();
  return img.resize({ width: w, height: h });
}

app.whenReady().then(async () => {
  const buildDir = path.join(__dirname, '..', 'build');
  fs.mkdirSync(buildDir, { recursive: true });
  if (process.argv.includes('--preview')) {
    const cells = Object.keys(THEMES).map((t) => `<div style="display:flex;flex-direction:column;align-items:center;gap:14px;font:600 22px 'Microsoft YaHei';color:#61666d">${iconSVG(t, 300)}<span>${t}${t === DEFAULT ? '（默认）' : ''}</span></div>`).join('');
    const img = await capture(`<div style="display:flex;gap:60px;padding:40px 50px;background:#f6f7f8;width:1100px;height:420px;box-sizing:border-box">${cells}</div>`, 1100, 420);
    fs.writeFileSync(path.join(buildDir, 'icon-preview.png'), img.toPNG());
    console.log('preview written');
  } else {
    const theme = THEMES[process.argv[2]] ? process.argv[2] : DEFAULT;
    const img = await capture(iconSVG(theme, 512), 512, 512);
    fs.writeFileSync(path.join(buildDir, 'icon.png'), img.toPNG());
    fs.writeFileSync(path.join(buildDir, 'icon.svg'), iconSVG(theme, 512));
    console.log('icon written:', theme);
  }
  app.exit(0);
});
