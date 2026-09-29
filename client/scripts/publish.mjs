// 把打包好的安装包复制到网站的 downloads/ 目录，并写入 latest.json（版本 / 大小 / SHA-256）
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(here, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(clientDir, 'package.json'), 'utf8'));
const file = `AliAli-Setup-${pkg.version}.exe`;
const src = path.join(clientDir, 'dist', file);
if (!fs.existsSync(src)) { console.error('找不到安装包：' + src + '\n请先运行 npm run dist'); process.exit(1); }

const outDir = path.join(clientDir, '..', 'downloads');
fs.mkdirSync(outDir, { recursive: true });
for (const old of fs.readdirSync(outDir)) if (/^AliAli-Setup-.*\.exe$/.test(old) && old !== file) fs.rmSync(path.join(outDir, old));
fs.copyFileSync(src, path.join(outDir, file));

const buf = fs.readFileSync(src);
const info = {
  version: pkg.version,
  file,
  size: buf.length,
  sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  platform: 'Windows 10 / 11（64 位）',
  date: new Date().toISOString(),
  notes: ['只看 AI 圈：实时同步 AI 博主与 AI 公司官方投稿', '自研播放器：倍速、全屏、弹幕屏蔽、断点续播', '一键三连、收藏夹、历史记录、个人空间'],
};
fs.writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(info, null, 2));
console.log(`已发布 ${file}（${(info.size / 1048576).toFixed(1)} MB）→ ${outDir}`);
