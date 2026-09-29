/* 首页头图：原创分层插画，按日期自动切换主题（中秋国庆 / 秋 / 冬 / 春节 / 春 / 夏），鼠标移动时有视差效果
   预览指定主题：/?banner=autumn|winter|newyear|spring|summer|midautumn */
(function () {
  'use strict';
  const { mascot, logo } = window.Ali;
  const W = 1920, H = 180;

  // ─────────── 节日日期（农历节日按公历列出）───────────
  const CNY = { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11' };
  const MID_AUTUMN = { 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12', 2031: '10-01', 2032: '09-19' };
  const DAY = 86400e3;
  const dateOf = (y, md) => new Date(`${y}-${md}T00:00:00`);

  function pickTheme(now = new Date()) {
    const forced = new URLSearchParams(location.search).get('banner');
    if (forced && THEMES[forced]) return forced;
    const y = now.getFullYear();
    // 春节：除夕前 12 天 ~ 正月十五
    for (const yy of [y, y + 1]) {
      if (!CNY[yy]) continue;
      const d = dateOf(yy, CNY[yy]);
      if (now >= d - 12 * DAY && now < +d + 16 * DAY) return 'newyear';
    }
    // 中秋国庆：中秋前 10 天 ~ 国庆假期结束（中秋较晚的年份延长到中秋后 3 天）
    if (MID_AUTUMN[y]) {
      const ma = dateOf(y, MID_AUTUMN[y]);
      const end = Math.max(+dateOf(y, '10-09'), +ma + 4 * DAY);
      if (now >= ma - 10 * DAY && now < end) return 'midautumn';
    }
    const m = now.getMonth() + 1;
    if (m === 12 || m <= 2) return 'winter';
    if (m <= 5) return 'spring';
    if (m <= 8) return 'summer';
    return 'autumn';
  }

  // ─────────── 通用绘制工具 ───────────
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const layer = (depth, inner, extra = '') =>
    `<div class="banner-layer" data-depth="${depth}" ${extra}><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">${inner}</svg></div>`;

  const skyGrad = (id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const stars = (n, maxY = 90, color = '#fff') => Array.from({ length: n }, () => `<circle class="twinkle" cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * maxY).toFixed(0)}" r="${(rnd() * 1.6 + 0.6).toFixed(1)}" fill="${color}" style="animation-delay:${(rnd() * 3).toFixed(2)}s"/>`).join('');

  function skyline(color, windows, extra = '') {
    let s = '';
    for (let x = -20; x < W + 40;) {
      const w = 40 + rnd() * 70, h = 40 + rnd() * 70;
      s += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" rx="4" fill="${color}"/>`;
      for (let wy = H - h + 10; wy < H - 10; wy += 12) {
        for (let wx = x + 8; wx < x + w - 10; wx += 14) {
          if (rnd() > 0.55) s += `<rect class="${rnd() > 0.8 ? 'blink' : ''}" x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="4" rx="1" fill="${pick(windows)}" opacity=".85" style="animation-delay:${(rnd() * 4).toFixed(1)}s"/>`;
        }
      }
      x += w + 6 + rnd() * 30;
    }
    return s + `<rect x="1180" y="40" width="26" height="140" rx="4" fill="${color}"/><path d="M1193 40V14" stroke="${color}" stroke-width="3"/><circle class="blink" cx="1193" cy="12" r="4" fill="#ff6699"/>` + extra;
  }

  // 神经网络星座
  function network(color = '#fff') {
    const nodes = [[120, 40], [230, 70], [330, 30], [420, 80], [560, 45], [690, 72], [780, 28], [900, 60], [1020, 36], [1640, 40], [1740, 78], [1850, 34]];
    let s = '';
    nodes.forEach(([x, y], i) => {
      const n = nodes[i + 1];
      if (n && Math.abs(n[0] - x) < 200) s += `<line x1="${x}" y1="${y}" x2="${n[0]}" y2="${n[1]}" stroke="${color}" stroke-width="1.4" opacity=".7" stroke-dasharray="4 5" class="flow"/>`;
      const m = nodes[i + 2];
      if (m && Math.abs(m[0] - x) < 260) s += `<line x1="${x}" y1="${y}" x2="${m[0]}" y2="${m[1]}" stroke="${color}" stroke-width="1" opacity=".35"/>`;
    });
    nodes.forEach(([x, y], i) => { s += `<circle class="twinkle" cx="${x}" cy="${y}" r="${i % 3 ? 3.2 : 4.6}" fill="${color}" style="animation-delay:${i * 0.3}s"/><circle cx="${x}" cy="${y}" r="9" fill="${color}" opacity=".18"/>`; });
    return s;
  }

  const hills = ([back, front]) => `
    <path d="M0 150 C220 110 420 140 640 128 C860 116 1000 150 1200 138 C1420 124 1640 104 1920 132 V180 H0Z" fill="${back}"/>
    <path d="M0 166 C260 140 520 170 760 160 C1000 150 1240 172 1480 160 C1680 150 1800 146 1920 156 V180 H0Z" fill="${front}"/>`;

  const textW = (t) => [...t].reduce((n, ch) => n + (/[一-鿿]/.test(ch) ? 16 : 9.6), 0);
  const bubble = (x, y, text, c, d) => `<g class="float" style="animation-delay:${d}s">
      <rect x="${x}" y="${y}" width="${(textW(text) + 22).toFixed(0)}" height="28" rx="14" fill="#fff" opacity=".95"/>
      <path d="M${x + 14} ${y + 26}l-4 9 11-8z" fill="#fff" opacity=".95"/>
      <text x="${x + 11}" y="${y + 19}" font-size="15" font-weight="700" fill="${c}" font-family="Consolas, Menlo, 'Microsoft YaHei', monospace">${text}</text>
    </g>`;

  // 飘落粒子（枫叶 / 雪花 / 花瓣 / 金箔）
  function falling(n, draw, { minDur = 7, maxDur = 13 } = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, dur = minDur + rnd() * (maxDur - minDur);
      s += `<g class="fall" style="animation-duration:${dur.toFixed(1)}s;animation-delay:-${(rnd() * dur).toFixed(1)}s"><g transform="translate(${x.toFixed(0)} -24)">${draw(i)}</g></g>`;
    }
    return s;
  }
  const leafPath = (c, s = 0.9) => `<path transform="scale(${s})" d="M0-10L3-3 10-5 6 1 9 7 2 5 0 12-2 5-9 7-6 1-10-5-3-3z" fill="${c}"/>`;

  // 小A + 主题道具（均为原创）
  const PROPS = {
    mooncake: '',
    leaf: '<g transform="translate(58 40) rotate(-20)"><path d="M0 14V2" stroke="#b5651d" stroke-width="2"/>' + leafPath('#ff7a2e', 1.1) + '</g>',
    scarf: '<path d="M8 47c14 5 34 5 48 0v6c-14 5-34 5-48 0z" fill="#ff4d5e"/><path d="M44 51l4 12 7-2-4-11z" fill="#ff4d5e"/><path d="M12 49v5M20 50.5v5M28 51v5M36 51v5" stroke="#fff" stroke-width="1.6" opacity=".7"/><ellipse cx="32" cy="12.5" rx="18" ry="4" fill="#fff"/>',
    envelope: '<g transform="translate(51 34) rotate(12)"><rect width="16" height="22" rx="3" fill="#e8302e"/><path d="M0 7q8 6 16 0" stroke="#b01e1c" stroke-width="1.4" fill="none"/><circle cx="8" cy="10" r="3.4" fill="#ffd36b"/></g>',
    flower: '<g transform="translate(32 5)">' + [0, 72, 144, 216, 288].map((a) => `<ellipse rx="3.4" ry="5.2" transform="rotate(${a}) translate(0 -4.5)" fill="#ff9ec0"/>`).join('') + '<circle r="3" fill="#ffd166"/></g>',
    sunglasses: '<rect x="15" y="27" width="14" height="9" rx="4" fill="#18191c"/><rect x="35" y="27" width="14" height="9" rx="4" fill="#18191c"/><path d="M29 30h6" stroke="#18191c" stroke-width="2"/><path d="M18 29l4-.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/><path d="M38 29l4-.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>',
  };
  const heroMascot = (prop, mood = 'happy', x = 1222, y = 88, s = 1.25) =>
    `<g transform="translate(${x} ${y}) scale(${s})">${mascot({ mood }).replace(/<\/?svg[^>]*>/g, '')}${PROPS[prop] || ''}</g>`;

  const lantern = (x, y, c, d, text = '') => `<g class="swing" style="transform-origin:${x}px ${y - 22}px;animation-delay:${d}s">
      <path d="M${x} ${y - 22}V${y - 10}" stroke="#a0522d" stroke-width="1.5"/>
      <rect x="${x - 7}" y="${y - 12}" width="14" height="3" rx="1" fill="#e2a33b"/>
      <ellipse cx="${x}" cy="${y + 4}" rx="15" ry="14" fill="${c}"/>
      <path d="M${x - 6} ${y - 8}Q${x - 11} ${y + 4} ${x - 6} ${y + 16}M${x + 6} ${y - 8}Q${x + 11} ${y + 4} ${x + 6} ${y + 16}" stroke="#fff" stroke-opacity=".35" stroke-width="1.3" fill="none"/>
      ${text ? `<text x="${x}" y="${y + 9}" text-anchor="middle" font-size="13" font-weight="700" fill="#ffd36b" font-family="'Microsoft YaHei', sans-serif">${text}</text>` : ''}
      <rect x="${x - 7}" y="${y + 17}" width="14" height="3" rx="1" fill="#e2a33b"/>
      <path d="M${x - 3} ${y + 20}v10M${x} ${y + 20}v12M${x + 3} ${y + 20}v10" stroke="#e2a33b" stroke-width="1.3"/>
    </g>`;
  const lanternString = (arr, textFn) => `<path d="M760 40 C900 70 1040 72 1180 40" stroke="#c77b4a" stroke-width="1.6" fill="none"/>` +
    [[820, 80], [900, 92], [980, 95], [1060, 88], [1130, 72]].map(([x, y], i) => lantern(x, y, arr[i % arr.length], (i * 0.37) % 1.4, textFn ? textFn(i) : '')).join('');

  const tree = (x, y, trunk, crowns, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0v-26" stroke="${trunk}" stroke-width="5" stroke-linecap="round"/><path d="M0-14l-9-8M0-18l8-7" stroke="${trunk}" stroke-width="2.4" stroke-linecap="round"/>${crowns.map(([cx, cy, r, c]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`).join('')}</g>`;
  const pine = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="-8" width="6" height="10" fill="#6b4a33"/><path d="M0-58L-16-30h8L-22-8h44L8-30h8z" fill="#3f7f6c"/><path d="M0-58L-8-44l4 2 4-4 4 4 4-2zM-14-26l6 2 8-4 8 4 6-2-4-6h-16z" fill="#fff"/></g>`;
  const cloud = (x, y, s, o = 1) => `<g class="drift" transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><path d="M0 20a14 14 0 0 1 12-19 20 20 0 0 1 37-2 14 14 0 0 1 19 13 11 11 0 0 1-3 21H6A10 10 0 0 1 0 20z" fill="#fff"/></g>`;
  const firework = (x, y, c, d, r = 34) => `<g class="firework" style="animation-delay:${d}s"><g transform="translate(${x} ${y})">${Array.from({ length: 14 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 14, x1 = Math.cos(a) * r * 0.35, y1 = Math.sin(a) * r * 0.35, x2 = Math.cos(a) * r, y2 = Math.sin(a) * r;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${(x2 * 1.12).toFixed(1)}" cy="${(y2 * 1.12).toFixed(1)}" r="1.8" fill="${c}"/>`;
  }).join('')}</g></g>`;

  // ─────────── 主题 ───────────
  const THEMES = {
    // 中秋国庆：月亮 + 灯笼 + 小A 抱月饼
    midautumn: {
      slogan: '中秋国庆 · 只看 AI 圈',
      glow: 'rgba(251, 114, 153, .55)',
      sky: () => `<defs>${skyGrad('bn-sky', ['#9fd4ff', '#d9ecff', '#ffe3ec'])}
          <radialGradient id="bn-glow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
          <linearGradient id="bn-moon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe9"/><stop offset="1" stop-color="#ffe7a8"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#bn-sky)"/>
        <circle cx="1500" cy="62" r="110" fill="url(#bn-glow)"/><circle cx="1500" cy="62" r="40" fill="url(#bn-moon)"/>
        <circle cx="1488" cy="52" r="6" fill="#ffe29a" opacity=".55"/><circle cx="1512" cy="74" r="4" fill="#ffe29a" opacity=".5"/><circle cx="1514" cy="48" r="3" fill="#ffe29a" opacity=".45"/>
        ${stars(40)}`,
      far: () => skyline('#c4d8fb', ['#ffffff', '#ffe7a3']),
      mid: () => network('#fff'),
      hills: () => hills(['#ffd3e1', '#ffc0d3']) + lanternString(['#ff5f6d', '#ff8a3d']) +
        bubble(300, 90, 'AI', '#00aeec', 0) + bubble(560, 60, '&lt;/&gt;', '#fb7299', 1.2) + bubble(1700, 88, 'Agent', '#7a5cff', 0.6) + bubble(1360, 110, 'LLM', '#00b578', 1.8),
      near: () => `<ellipse cx="1262" cy="171" rx="70" ry="10" fill="#ffadc5" opacity=".7"/>${heroMascot('mooncake')}
        <g transform="translate(1262 160)"><circle r="16" fill="#e9a54c"/><circle r="11.5" fill="none" stroke="#c9832e" stroke-width="2" stroke-dasharray="3 3"/><text y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#8a4f16">AI</text></g>
        ${falling(6, () => leafPath(pick(['#ff8a3d', '#ff5f6d', '#ffb027'])), { minDur: 10, maxDur: 16 })}`,
    },

    // 秋：夕阳 + 枫树 + 漫天落叶
    autumn: {
      slogan: '秋日限定 · 只看 AI 圈',
      glow: 'rgba(238, 120, 50, .55)',
      sky: () => `<defs>${skyGrad('bn-sky', ['#ffc58f', '#ffe0bd', '#fff3e4'])}
          <radialGradient id="bn-glow"><stop offset="0" stop-color="#ffd28a" stop-opacity=".95"/><stop offset="1" stop-color="#ffd28a" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#bn-sky)"/>
        <circle cx="1480" cy="96" r="130" fill="url(#bn-glow)"/><circle cx="1480" cy="96" r="42" fill="#ffab4d"/>
        ${cloud(260, 24, 1.1, 0.7)}${cloud(1020, 12, 0.8, 0.6)}${cloud(1720, 30, 1, 0.65)}`,
      far: () => skyline('#f0c29a', ['#ffffff', '#ffe0b0']),
      mid: () => network('#fff'),
      hills: () => hills(['#f7b784', '#ef9b62']) +
        tree(180, 150, '#8a4b2a', [[0, -38, 20, '#ff7a2e'], [-14, -28, 14, '#ff9a3c'], [15, -30, 15, '#e8532b']]) +
        tree(520, 142, '#8a4b2a', [[0, -40, 22, '#ffb027'], [-16, -28, 14, '#ff8a3d'], [16, -30, 16, '#ff7a2e']], 0.9) +
        tree(880, 150, '#8a4b2a', [[0, -38, 20, '#e8532b'], [-14, -28, 14, '#ff7a2e'], [15, -30, 15, '#ffb027']]) +
        tree(1640, 138, '#8a4b2a', [[0, -40, 22, '#ff9a3c'], [-15, -28, 15, '#e8532b'], [16, -30, 15, '#ffb027']], 1.05) +
        bubble(330, 72, 'AI', '#ee7a32', 0) + bubble(1020, 70, 'Prompt', '#fb7299', 1.2) + bubble(1780, 70, 'RAG', '#00aeec', 0.6),
      near: () => `<ellipse cx="1262" cy="171" rx="74" ry="11" fill="#e88a4f" opacity=".55"/>
        ${[...Array(9)].map((_, i) => `<g transform="translate(${1200 + i * 15} ${168 + (i % 2) * 4}) rotate(${i * 40})">${leafPath(pick(['#ff7a2e', '#e8532b', '#ffb027']), 0.7)}</g>`).join('')}
        ${heroMascot('leaf')}
        ${falling(22, () => leafPath(pick(['#ff7a2e', '#e8532b', '#ffb027', '#ff9a3c']), 0.8 + rnd() * 0.5))}`,
    },

    // 冬：雪夜 + 松树 + 小A 戴围巾
    winter: {
      slogan: '冬日暖心 · 只看 AI 圈',
      glow: 'rgba(120, 160, 255, .6)',
      sky: () => {
        const y = new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear();
        THEMES.winter._year = y;
        return `<defs>${skyGrad('bn-sky', ['#24315a', '#3c4f86', '#8098d0'])}
            <radialGradient id="bn-glow"><stop offset="0" stop-color="#e9f0ff" stop-opacity=".7"/><stop offset="1" stop-color="#e9f0ff" stop-opacity="0"/></radialGradient>
            <mask id="bn-crescent"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="1516" cy="52" r="36" fill="#000"/></mask></defs>
          <rect width="${W}" height="${H}" fill="url(#bn-sky)"/>${stars(70, 110)}
          <circle cx="1500" cy="62" r="100" fill="url(#bn-glow)"/><circle cx="1500" cy="62" r="38" fill="#fdf6d8" mask="url(#bn-crescent)"/>`;
      },
      far: () => skyline('#33457a', ['#ffd98a', '#ffe9b8']),
      mid: () => network('#bcd4ff'),
      hills: () => hills(['#e6eeff', '#d2e0fb']) + pine(160, 150, 1) + pine(210, 158, 0.75) + pine(620, 146, 0.9) + pine(930, 154, 1.1) + pine(980, 160, 0.7) + pine(1660, 140, 1) + pine(1715, 150, 0.8) +
        bubble(330, 70, 'AI', '#00aeec', 0) + bubble(1040, 64, `Hello ${THEMES.winter._year || ''}`, '#fb7299', 1.2) + bubble(1790, 64, 'GPU', '#7a5cff', 0.6),
      near: () => `<ellipse cx="1262" cy="171" rx="72" ry="10" fill="#fff" opacity=".9"/>${heroMascot('scarf')}
        ${falling(46, () => `<circle r="${(1.4 + rnd() * 2.4).toFixed(1)}" fill="#fff" opacity="${(0.6 + rnd() * 0.4).toFixed(2)}"/>`, { minDur: 8, maxDur: 16 })}`,
    },

    // 春节：红色天空 + 烟花 + 福字灯笼 + 小A 拿红包
    newyear: {
      slogan: '新春快乐 · 只看 AI 圈',
      glow: 'rgba(255, 60, 60, .55)',
      sky: () => `<defs>${skyGrad('bn-sky', ['#d9322c', '#ff6a45', '#ffbf7a'])}</defs>
        <rect width="${W}" height="${H}" fill="url(#bn-sky)"/>${stars(30, 80, '#ffe7a8')}`,
      far: () => skyline('#b92f2a', ['#ffd36b', '#fff0b0']),
      mid: () => firework(260, 50, '#ffd36b', 0) + firework(620, 36, '#fff', 1.1, 28) + firework(1480, 56, '#ffe38a', 0.5, 40) + firework(1760, 34, '#ffb3c7', 1.6, 26) + firework(1040, 30, '#ffd36b', 2.1, 24),
      hills: () => hills(['#ffb45e', '#ff963f']) + lanternString(['#e8302e', '#ff4b3a'], () => '福') +
        bubble(320, 90, '新春快乐', '#e8302e', 0) + bubble(1680, 90, 'AI 拜年', '#e8302e', 0.8) + bubble(540, 60, 'Token++', '#ff8a00', 1.4),
      near: () => `<ellipse cx="1262" cy="171" rx="70" ry="10" fill="#e8302e" opacity=".35"/>${heroMascot('envelope', 'wow')}
        ${falling(26, () => `<rect width="${(3 + rnd() * 4).toFixed(1)}" height="${(5 + rnd() * 4).toFixed(1)}" rx="1" fill="${pick(['#ffd36b', '#fff0b0', '#ffe38a', '#ff6b6b'])}"/>`, { minDur: 6, maxDur: 11 })}`,
    },

    // 春：樱花 + 绿坡 + 花瓣
    spring: {
      slogan: '春暖花开 · 只看 AI 圈',
      glow: 'rgba(255, 130, 180, .55)',
      sky: () => `<defs>${skyGrad('bn-sky', ['#a9e0ff', '#dcf2ff', '#fff0f6'])}
          <radialGradient id="bn-glow"><stop offset="0" stop-color="#fff7cf" stop-opacity=".9"/><stop offset="1" stop-color="#fff7cf" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#bn-sky)"/>
        <circle cx="1500" cy="56" r="100" fill="url(#bn-glow)"/><circle cx="1500" cy="56" r="32" fill="#fff4c2"/>
        ${cloud(300, 18, 1, 0.9)}${cloud(1060, 28, 0.8, 0.85)}${cloud(1760, 14, 1.1, 0.9)}`,
      far: () => skyline('#c3e0f3', ['#ffffff', '#fff5d6']),
      mid: () => network('#fff'),
      hills: () => hills(['#c3e9aa', '#a2da8c']) +
        tree(190, 150, '#8a5a3c', [[0, -38, 20, '#ffc2d6'], [-14, -28, 14, '#ffd6e4'], [15, -30, 15, '#ffadc8']]) +
        tree(560, 142, '#8a5a3c', [[0, -40, 22, '#ffd6e4'], [-16, -28, 14, '#ffc2d6'], [16, -30, 16, '#ffadc8']], 0.9) +
        tree(900, 152, '#8a5a3c', [[0, -38, 20, '#ffadc8'], [-14, -28, 14, '#ffd6e4'], [15, -30, 15, '#ffc2d6']]) +
        tree(1660, 140, '#8a5a3c', [[0, -40, 22, '#ffc2d6'], [-15, -28, 15, '#ffadc8'], [16, -30, 15, '#ffd6e4']], 1.05) +
        [...Array(26)].map(() => `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(158 + rnd() * 18).toFixed(0)}" r="2.4" fill="${pick(['#fff', '#ffe066', '#ff9ec0'])}"/>`).join('') +
        bubble(330, 72, 'AI', '#00b578', 0) + bubble(1040, 66, '多模态', '#fb7299', 1.2) + bubble(1790, 66, 'Agent', '#00aeec', 0.6),
      near: () => `<ellipse cx="1262" cy="171" rx="70" ry="10" fill="#8fcf78" opacity=".7"/>${heroMascot('flower')}
        ${falling(24, () => `<ellipse rx="${(3 + rnd() * 2).toFixed(1)}" ry="${(2 + rnd()).toFixed(1)}" fill="${pick(['#ffb3cb', '#ffd1df', '#ff9ec0'])}"/>`, { minDur: 9, maxDur: 15 })}`,
    },

    // 夏：艳阳 + 大海 + 沙滩 + 小A 戴墨镜
    summer: {
      slogan: '盛夏开跑 · 只看 AI 圈',
      glow: 'rgba(0, 150, 230, .55)',
      sky: () => `<defs>${skyGrad('bn-sky', ['#39b3ff', '#8edbff', '#e4f8ff'])}
          <radialGradient id="bn-glow"><stop offset="0" stop-color="#fff6b0" stop-opacity=".95"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#bn-sky)"/>
        <circle cx="1480" cy="50" r="120" fill="url(#bn-glow)"/>
        <g class="rays"><g transform="translate(1480 50)">${Array.from({ length: 12 }, (_, i) => `<rect x="-2.5" y="-66" width="5" height="16" rx="2.5" fill="#ffe066" transform="rotate(${i * 30})"/>`).join('')}</g></g>
        <circle cx="1480" cy="50" r="36" fill="#ffd93d"/>`,
      far: () => skyline('#a3d6f2', ['#ffffff', '#e8f9ff']),
      mid: () => cloud(220, 14, 1.2) + cloud(700, 30, 0.9) + cloud(1100, 10, 1.1) + cloud(1760, 26, 1) + network('#fff'),
      hills: () => `<path d="M0 132 H1920 V180 H0Z" fill="#35b0ea"/>
        <g class="wave"><path d="${Array.from({ length: 18 }, (_, i) => `M${i * 120 - 120} 140 q30 -8 60 0 t60 0`).join(' ')}" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/></g>
        ${[...Array(14)].map(() => `<circle class="twinkle" cx="${(rnd() * W).toFixed(0)}" cy="${(146 + rnd() * 10).toFixed(0)}" r="1.8" fill="#fff" style="animation-delay:${(rnd() * 3).toFixed(1)}s"/>`).join('')}
        <path d="M0 168 C300 150 600 172 960 162 C1300 152 1600 170 1920 160 V180 H0Z" fill="#ffe2a0"/>
        <g transform="translate(260 162)"><path d="M0 0 C4 -30 10 -54 22 -70" stroke="#9a6a3c" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M22-70c-20-6-36 2-42 12M22-70c-8-18-26-22-38-16M22-70c14-14 32-12 40-4M22-70c20 0 32 10 34 22M22-70c2 18-6 30-14 36" stroke="#2fa35a" stroke-width="7" fill="none" stroke-linecap="round"/></g>
        ${bubble(420, 70, 'AI', '#00aeec', 0) + bubble(1000, 64, 'LLM', '#ff8a00', 1.2) + bubble(1780, 66, '&lt;/&gt;', '#fb7299', 0.6)}`,
      near: () => `<ellipse cx="1262" cy="173" rx="70" ry="9" fill="#e9c47a" opacity=".7"/>${heroMascot('sunglasses')}
        <g transform="translate(1348 158)"><circle r="14" fill="#fff"/><path d="M-14 0a14 14 0 0 1 28 0z" fill="#ff5f6d"/><path d="M0-14a14 14 0 0 1 0 28z" fill="#00aeec" opacity=".85"/><circle r="14" fill="none" stroke="#18191c" stroke-opacity=".1"/></g>`,
    },
  };

  // ─────────── 渲染 + 视差 ───────────
  const el = document.getElementById('banner');
  let current = '';
  function render() {
    const key = pickTheme();
    if (key === current) return;
    current = key;
    seed = 7;
    const t = THEMES[key];
    el.dataset.theme = key;
    el.innerHTML = `
      ${layer(0, t.sky())}
      ${layer(0.15, t.far(), 'style="opacity:.9"')}
      ${layer(0.35, t.mid())}
      ${layer(0.6, t.hills())}
      ${layer(1, t.near())}
      <div class="inner-logo" style="--logo-glow:${t.glow}"><a href="/" aria-label="AliAli 首页">${logo('#fff')}</a><div class="logo-slogan">${t.slogan} · 实时更新</div></div>
      <div class="taper-line"></div>`;
  }
  render();
  setInterval(render, 3600e3); // 跨天自动换主题

  let raf = 0;
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => el.querySelectorAll('.banner-layer').forEach((l) => {
      l.style.transition = 'transform .12s linear';
      l.style.transform = `translateX(${(-dx * l.dataset.depth * 48).toFixed(1)}px)`;
    }));
  });
  el.addEventListener('mouseleave', () => el.querySelectorAll('.banner-layer').forEach((l) => { l.style.transition = 'transform .6s ease'; l.style.transform = ''; }));
})();
