// Renders the README images in assets/: every block in two layouts (wide for the
// 830px desktop column, narrow for the 278px phone column) and two themes.
// GitHub strips CSS from READMEs, so the designed parts ship as transparent PNGs.
// Run: npm run build:assets   (first time: npx playwright install chromium)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LAYOUTS = { wide: { width: 830, scale: 2 }, narrow: { width: 278, scale: 3 } };

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

const PROJECTS = {
  matchplay: {
    accent: 'green', url: 'matchplay.gg', tech: ['Next.js', 'Supabase', 'Vercel', 'PostHog'],
    title: 'Web app for organising amateur pickup sports games in Poland',
    brand: `<div class="brand mp"><svg class="pitch"><line x1="50%" y1="0" x2="50%" y2="100%"/><circle cx="50%" cy="50%"/></svg>
      <div class="mpw">Match<span>Play</span></div></div>`,
  },
  'smk-buster': {
    accent: 'amber', url: 'smk-buster.pl', tech: ['Next.js', 'Convex', 'Trigger.dev', 'Stagehand'],
    title: 'Automates procedure entries in SMK for Poland&#39;s resident doctors',
    brand: `<div class="brand smk"><div class="orb">+</div><div class="smkw">SMK Buster</div></div>`,
  },
};

const group = (key, theme) => `<div class="k">${STACK[key][0]}</div>
  <div class="items">${STACK[key][1].map((n) => `<span class="st"><span class="tile">${logo(n, theme)}</span>${n}</span>`).join('')}</div>`;

const BLOCKS = {
  board: (theme) => `<div class="board"><div class="cells">
    <div class="cell"><div class="name">Maciej Czech</div>
      <div class="tag">I build and run products solo by steering coding agents.</div>
      <div class="meta">software engineer<br>Bydgoszcz, Poland · remote / EU</div></div>
    <div class="cell span2 hs">${group('harnesses', theme)}
      <div class="flow"><b>T3 Code</b><i>›</i><span>two remote Linux machines</span><i>›</i><span>PR with screenshots + test output</span></div>
      <div class="foot">Claude Code splits and builds, Codex reviews, Grok researches, Neon (Gemini) edits text. Every PR <em>merges itself</em> when checks leave no doubt, and waits for me otherwise.</div></div>
    <div class="cell">${group('code', theme)}</div><div class="cell">${group('web', theme)}</div>
    <div class="cell">${group('data', theme)}</div><div class="cell span2">${group('cloud', theme)}</div>
    <div class="cell">${group('review', theme)}</div></div></div>`,
  ...Object.fromEntries(Object.entries(PROJECTS).map(([key, p]) => [key, (theme) => `<div class="proj">${p.brand}
    <div class="pbody"><div class="title">${p.title}</div>
    <div class="tech">${p.tech.map((n) => `<span class="pt">${logo(n, theme)}${n}</span>`).join('')}</div></div>
    <div class="url ${p.accent}">${p.url} ↗</div></div>`])),
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{background:transparent;-webkit-font-smoothing:antialiased}
#root{font-family:Inter,sans-serif;color:var(--text)}
.k,.st,.pt,.url,.meta,.flow{font-family:'JetBrains Mono',monospace}

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
<body><div id="root" class="${layout}" style="width:${LAYOUTS[layout].width}px">${body}</div></body></html>`;

const browser = await chromium.launch();
for (const [layout, { width, scale }] of Object.entries(LAYOUTS)) {
  const context = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: scale });
  const tab = await context.newPage();
  for (const theme of Object.keys(THEMES)) {
    await tab.emulateMedia({ colorScheme: theme });
    for (const [name, block] of Object.entries(BLOCKS)) {
      await tab.setContent(page(block(theme), theme, layout), { waitUntil: 'networkidle' });
      const fontsOk = await tab.evaluate(async () => {
        const faces = ['400 1em Inter', '600 1em Inter', '700 1em Inter', '800 1em Inter', '400 1em "JetBrains Mono"',
          '500 1em "JetBrains Mono"', '700 1em "JetBrains Mono"', '800 1em "JetBrains Mono"'];
        const loaded = await Promise.all(faces.map((f) => document.fonts.load(f)));
        await document.fonts.ready;
        return loaded.every((list) => list.length > 0);
      });
      if (!fontsOk) throw new Error('Web fonts did not load; check the network and re-run.');
      const out = `assets/${name}-${layout}-${theme}.png`;
      await tab.locator('#root').screenshot({ path: ROOT + out, omitBackground: true });
      console.log('wrote', out);
    }
  }
  await context.close();
}
await browser.close();
