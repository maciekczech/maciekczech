// Renders the README images in assets/: every block in two layouts (wide for the
// 830px desktop column, narrow for the 278px phone column) and two themes.
// The contact links are small dark buttons: one size and one look for both columns and both themes,
// because a mailto: link cannot carry the #gh-…-mode-only fragment that picks a theme.
// GitHub strips CSS from READMEs, so the designed parts ship as transparent PNGs.
// The board ships as an SVG that wraps its PNG and fades dim glyphs through the last tile of each
// stack section: other tech of that domain, shown as "and more", never as a listed item.
// Run: npm run build:assets   (first time: npx playwright install chromium)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LAYOUTS = { wide: { width: 830, scale: 2 }, narrow: { width: 278, scale: 3 }, link: { scale: 3, themes: ['dark'] } };

const THEMES = {
  light: { surface: '#F6F8FA', tile: '#EAEEF2', hair: '#D1D9E0', text: '#1F2328', strong: '#0B0D10',
           muted: '#59636E', dim: '#6B7480', green: '#1A7F37', amber: '#9A6700' },
  dark:  { surface: '#1E2024', tile: '#2F333B', hair: '#383C45', text: '#E8EAEE', strong: '#FFFFFF',
           muted: '#B4BAC5', dim: '#8A91A0', green: '#4ADE80', amber: '#FBBF24' },
};

// Official logos in tools/icons. Single-colour (simple-icons) SVGs get their brand hex;
// black brands turn light in the dark theme. `badge` logos carry their own square background.
const ICONS = {
  TypeScript: ['typescript.svg', '3178C6'], Go: ['go.svg', '00ADD8'], Python: ['python.svg', '3776AB'],
  Bash: ['gnubash.svg', '4EAA25'], React: ['react.svg', '61DAFB'], 'Node.js': ['nodedotjs.svg', '5FA04E'],
  'Next.js': ['nextdotjs.svg', '000000'], AWS: ['aws.png', 'badge'], Kubernetes: ['kubernetes.svg', '326CE5'],
  Terraform: ['terraform.svg', '844FBA'], Docker: ['docker.svg', '2496ED'],
  'GitHub Actions': ['githubactions.svg', '2088FF'], Convex: ['convex.svg', 'EE342F'],
  Supabase: ['supabase.svg', '3FCF8E'], Clerk: ['clerk.svg', '6C47FF'], 'Claude Code': ['claude.svg', 'D97757'],
  Codex: ['openai.svg', '000000'], Grok: ['grok.svg', 'badge'], Antigravity: ['antigravity.svg', null],
  Cursor: ['cursor.svg', '000000'], CodeRabbit: ['coderabbit.svg', 'FF570A'], Greptile: ['greptile.png', 'badge'],
  Macroscope: ['macroscope.svg', 'badge'], Bugbot: ['bugbot.svg', 'badge'], Vercel: ['vercel.svg', '000000'],
  PostHog: ['posthog.svg', '000000'], 'Trigger.dev': ['trigger.ico', 'badge'], Stagehand: ['stagehand.png', 'badge'],
};
const MIME = { svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon' };

function logo(name, theme) {
  const [file, colour] = ICONS[name];
  let data = readFileSync(`${ROOT}tools/icons/${file}`);
  if (colour && colour !== 'badge') {
    const fill = colour === '000000' && theme === 'dark' ? THEMES.dark.text : `#${colour}`;
    data = Buffer.from(data.toString().replace('<svg ', `<svg fill="${fill}" `));
  }
  const src = `data:${MIME[file.split('.').pop()]};base64,${data.toString('base64')}`;
  return `<img class="logo${colour === 'badge' ? ' badge' : ''}" src="${src}" alt="">`;
}

const STACK = {
  code: ['Code', ['TypeScript', 'Go', 'Python', 'Bash']],
  web: ['Web', ['React', 'Node.js', 'Next.js']],
  data: ['Data &amp; auth', ['Convex', 'Supabase', 'Clerk']],
  cloud: ['Cloud, infrastructure &amp; CI/CD', ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'GitHub Actions']],
  harnesses: ['Harnesses', ['Claude Code', 'Codex', 'Grok', 'Antigravity', 'Cursor']],
  review: ['Agentic code review', ['CodeRabbit', 'Greptile', 'Macroscope', 'Bugbot']],
};

// simple-icons files in tools/icons/more, the same count per section so the loop closes.
const MORE = {
  code: ['javascript', 'c', 'rust', 'swift'],
  web: ['tailwindcss', 'vite', 'vuedotjs', 'svelte'],
  data: ['postgresql', 'redis', 'mongodb', 'firebase'],
  cloud: ['vercel', 'linux', 'cloudflare', 'googlecloud'],
  review: ['githubcopilot', 'graphite', 'qodo', 'sonarqubeserver'],
};
const STEP = 3, FADE = 0.9; // seconds: one tile changes every STEP, and the change takes FADE
const DIM = { dark: 0.38, light: 0.42 };

const PROJECTS = {
  matchplay: {
    accent: 'green', url: 'matchplay.gg', tech: ['Next.js', 'Supabase', 'Vercel', 'PostHog'],
    title: 'Web app for organising amateur pickup sports games in Poland',
    brand: `<div class="brand"><svg class="pitch"><line x1="50%" y1="0" x2="50%" y2="100%"/><circle cx="50%" cy="50%"/></svg>
      <div class="mpw">Match<span>Play</span></div></div>`,
  },
  'smk-buster': {
    accent: 'amber', url: 'smk-buster.pl', tech: ['Next.js', 'Convex', 'Trigger.dev', 'Stagehand'],
    title: 'Automates procedure entries in SMK for Poland&#39;s resident doctors',
    brand: `<div class="brand"><div class="orb">+</div><div class="smkw">SMK Buster</div></div>`,
  },
};

const group = (key, theme) => `<div class="k">${STACK[key][0]}</div>
  <div class="items">${STACK[key][1].map((n) => `<span class="st"><span class="tile">${logo(n, theme)}</span>${n}</span>`).join('')}${MORE[key] ? `<span class="tile more" data-more="${key}"></span>` : ''}</div>`;

const BLOCKS = {
  board: (theme) => `<div class="board"><div class="cells">
    <div class="cell"><div class="name">Maciej Czech</div>
      <div class="tag">Code was the means, not the job. I've coded enough to understand the implications. Now I build and run products solo by orchestrating and building tooling around harnesses.</div>
      <div class="meta">software engineer<br>Bydgoszcz, Poland · remote / EU</div></div>
    <div class="cell span2 hs">${group('harnesses', theme)}
      <div class="flow"><b>T3 Code</b><span>control plane</span><i>›</i><span>two remote Linux machines</span><i>›</i><span>parallel runs</span></div>
      <div class="foot">I reach it from any device. Changes come with screenshots, test output, and a different model's review; <em>I decide</em> what ships.</div></div>
    <div class="cell">${group('code', theme)}</div><div class="cell">${group('web', theme)}</div>
    <div class="cell">${group('data', theme)}</div><div class="cell span2">${group('cloud', theme)}</div>
    <div class="cell">${group('review', theme)}</div></div></div>`,
  ...Object.fromEntries(Object.entries(PROJECTS).map(([key, p]) => [key, (theme) => `<div class="proj">${p.brand}
    <div class="pbody"><div class="title">${p.title}</div>
    <div class="tech">${p.tech.map((n) => `<span class="pt">${logo(n, theme)}${n}</span>`).join('')}</div></div>
    <div class="url ${p.accent}">${p.url} ↗</div></div>`])),
};

const LINKS = {
  linkedin: () => `<div class="chip"><span class="tile in">in</span>LinkedIn<i>↗</i></div>`,
  email: () => `<div class="chip"><span class="tile"><svg class="mail" viewBox="0 0 16 16"><rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2"/>
    <path d="m2.5 4.5 5.5 4.25 5.5-4.25"/></svg></span>maciej.a.czech@gmail.com</div>`,
};

// Wraps the board PNG and lays the glyphs over the empty `.tile.more` boxes measured in the page.
// Each glyph is visible for one slot of the loop; negative delays put every tile mid-cycle at load.
// `still` keeps the first glyph of each tile and no motion: the README serves it under
// prefers-reduced-motion, which an SVG shown through <img> does not see for itself.
function overlay(png, { width, height }, tiles, theme, still) {
  const slots = MORE[tiles[0].key].length, hold = tiles.length * STEP, loop = slots * hold;
  const at = (seconds) => `${+(seconds / loop * 100).toFixed(3)}%`;
  const glyphs = tiles.flatMap((tile, i) => MORE[tile.key].slice(0, still ? 1 : slots).map((name, j) => {
    const file = name === 'vercel' ? 'vercel.svg' : `more/${name}.svg`;
    const d = readFileSync(`${ROOT}tools/icons/${file}`, 'utf8').match(/ d="([^"]+)"/)[1];
    const size = tile.size * 0.6, pad = (tile.size - size) / 2;
    return `<path${j ? '' : ' class="first"'}${still ? '' : ` style="animation-delay:${(j * tiles.length + i) * STEP - loop}s"`} transform="translate(${
      +(tile.x + pad).toFixed(2)} ${+(tile.y + pad).toFixed(2)}) scale(${+(size / 24).toFixed(4)})" d="${d}"/>`;
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<style>path{fill:${THEMES[theme].text};opacity:0}.first{opacity:${DIM[theme]}}${still ? '' : `
path{animation:more ${loop}s linear infinite}
@keyframes more{0%{opacity:0}${at(FADE)},${at(hold)}{opacity:${DIM[theme]}}${at(hold + FADE)},100%{opacity:0}}
@media (prefers-reduced-motion:reduce){path{animation:none}}`}</style>
<image width="${width}" height="${height}" href="data:image/png;base64,${png.toString('base64')}"/>
${glyphs.join('\n')}
</svg>
`;
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{background:transparent;-webkit-font-smoothing:antialiased}
#root{font-family:Inter,sans-serif;color:var(--text)}
.k,.st,.pt,.url,.meta,.flow,.chip{font-family:'JetBrains Mono',monospace}

.board,.proj{border:1px solid var(--hair);border-radius:9px;overflow:hidden;background:var(--surface)}
.cells{display:grid;margin:-1px 0 0 -1px;width:calc(100% + 1px)}
.cell{padding:11px 12px 12px;border-top:1px solid var(--hair);border-left:1px solid var(--hair)}
.name{font-weight:800;font-size:26px;letter-spacing:-.04em;line-height:1.05;color:var(--strong)}
.tag{margin-top:7px;font-size:12.5px;line-height:1.4}
.meta{margin-top:9px;font-size:10.5px;line-height:1.6;color:var(--dim)}
.k{font-size:10.5px;color:var(--dim)}
.items{display:flex;flex-wrap:wrap;gap:7px 10px;margin-top:7px}
.st{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:500}
.tile{width:20px;height:20px;border-radius:5px;background:var(--tile);display:flex;align-items:center;justify-content:center;overflow:hidden}
.tile .logo{width:13px;height:13px;display:block}
.tile .logo.badge{width:100%;height:100%}
.tile.more{background:none;border:1px solid var(--hair)}
.flow{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;margin-top:11px;font-size:10.5px;color:var(--muted)}
.flow b{color:var(--strong)}
.flow i{font-style:normal;color:var(--dim)}
.foot{margin-top:6px;font-size:11.5px;line-height:1.45;color:var(--muted)}
.foot em{font-style:normal;color:var(--green)}

.brand{position:relative;height:46px;background:#191B1F;display:flex;align-items:center;justify-content:center;gap:8px}
.brand>div{position:relative}
.pitch{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:#4ADE80;stroke-width:1;opacity:.2}
.pitch circle{r:16px}
.mpw{font-weight:800;font-size:19px;letter-spacing:-.04em;line-height:1;color:#fff}
.mpw span{color:#4ADE80}
.orb{width:22px;height:22px;border-radius:50%;border:1.5px solid #FBBF24;background:rgba(245,158,11,.12);color:#FBBF24;
  font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}
.smkw{font-weight:700;font-size:15px;letter-spacing:-.02em;color:#fff}
.pbody{padding:10px 12px 0}
.title{font-size:12.5px;font-weight:600;line-height:1.3;color:var(--strong);text-wrap:pretty}
.tech{display:flex;flex-wrap:wrap;gap:4px 11px;margin-top:7px}
.pt{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--muted)}
.pt .logo{width:12.5px;height:12.5px}
.pt .logo.badge{border-radius:3px}
.url{width:fit-content;margin:8px 12px 11px;font-size:11.5px;font-weight:700;text-decoration:underline;text-underline-offset:3px}
.url.green{color:var(--green)}.url.amber{color:var(--amber)}

.chip{display:flex;align-items:center;gap:8px;height:34px;padding:0 12px 0 7px;border:1px solid var(--hair);border-radius:9px;
  background:var(--surface);font-size:12px;font-weight:500;color:var(--strong);white-space:nowrap}
.chip i{font-style:normal;color:var(--dim)}
.tile.in{background:#0A66C2;color:#fff;font:800 12px/1 Inter,sans-serif;padding-bottom:1px}
.mail{width:13px;height:13px;fill:none;stroke:var(--muted);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}

/* wide: same system, reflowed for the 830px column */
.wide .board,.wide .proj{border-radius:10px}
.wide .cells{grid-template-columns:repeat(3,1fr)}
.wide .span2{grid-column:span 2}
.wide .cell{padding:14px 18px 16px}
.wide .name{font-size:28px}
.wide .tag{margin-top:8px;font-size:13.5px}
.wide .meta{margin-top:12px;font-size:11.5px}
.wide .k{font-size:12px}
.wide .items{gap:9px 16px;margin-top:10px}
.wide .hs .items{column-gap:14px}
.wide .cell:last-child .items{column-gap:10px}
.wide .st{font-size:13px;gap:8px}
.wide .tile{width:24px;height:24px;border-radius:6px}
.wide .tile .logo{width:16px;height:16px}
.wide .tile .logo.badge{width:100%;height:100%}
.wide .flow{flex-wrap:nowrap;white-space:nowrap;gap:9px;margin-top:14px;font-size:12px}
.wide .foot{margin-top:7px;font-size:13px}
.wide .proj{display:grid;grid-template-columns:168px 1fr auto;height:66px}
.wide .brand{height:auto;gap:9px}
.wide .pitch circle{r:22px}
.wide .mpw{font-size:20px}
.wide .orb{width:24px;height:24px;font-size:14px}
.wide .pbody{padding:0 18px;display:flex;flex-direction:column;justify-content:center}
.wide .title{font-size:13.5px}
.wide .tech{gap:4px 14px}
.wide .pt{font-size:11px}
.wide .pt .logo{width:13px;height:13px}
.wide .url{align-self:center;margin:0 20px 0 0;font-size:12.5px}`;

const page = (body, theme, layout) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
:root{${Object.entries(THEMES[theme]).map(([k, v]) => `--${k}:${v}`).join(';')}}</style></head>
<body><div id="root" class="${layout}" style="width:${LAYOUTS[layout].width ? `${LAYOUTS[layout].width}px` : 'fit-content'}">${body}</div></body></html>`;

const browser = await chromium.launch();
for (const [layout, { width, scale, themes }] of Object.entries(LAYOUTS)) {
  const context = await browser.newContext({ viewport: { width: width ?? 400, height: 1200 }, deviceScaleFactor: scale });
  const tab = await context.newPage();
  for (const theme of themes ?? Object.keys(THEMES)) {
    await tab.emulateMedia({ colorScheme: theme });
    for (const [name, block] of Object.entries(layout === 'link' ? LINKS : BLOCKS)) {
      await tab.setContent(page(block(theme), theme, layout), { waitUntil: 'networkidle' });
      const fontsOk = await tab.evaluate(async () => {
        const faces = ['400 1em Inter', '600 1em Inter', '700 1em Inter', '800 1em Inter', '400 1em "JetBrains Mono"',
          '500 1em "JetBrains Mono"', '700 1em "JetBrains Mono"'];
        const loaded = await Promise.all(faces.map((f) => document.fonts.load(f)));
        await document.fonts.ready;
        return loaded.every((list) => list.length > 0);
      });
      if (!fontsOk) throw new Error('Web fonts did not load; check the network and re-run.');
      const root = tab.locator('#root');
      const tiles = await tab.locator('.tile.more').evaluateAll((list) => list.map((el) => {
        const box = el.getBoundingClientRect(), origin = document.querySelector('#root').getBoundingClientRect();
        return { key: el.dataset.more, x: box.x - origin.x, y: box.y - origin.y, size: box.width };
      }));
      const base = `assets/${layout === 'link' ? `link-${name}` : `${name}-${layout}-${theme}`}`;
      const png = await root.screenshot({ path: tiles.length ? undefined : `${ROOT}${base}.png`, omitBackground: true });
      const box = tiles.length && await root.boundingBox();
      for (const still of tiles.length ? [false, true] : []) {
        writeFileSync(`${ROOT}${base}${still ? '-still' : ''}.svg`, overlay(png, box, tiles, theme, still));
      }
      console.log('wrote', `${base}.${tiles.length ? 'svg' : 'png'}`);
    }
  }
  await context.close();
}
await browser.close();
