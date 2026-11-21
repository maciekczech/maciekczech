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

const STACK = [
  ['Code', ['TypeScript', 'Go', 'Python', 'Bash']],
  ['Web', ['React', 'Node.js', 'Next.js']],
  ['Cloud, infrastructure &amp; CI/CD', ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'GitHub Actions']],
  ['Data &amp; auth', ['Convex', 'Supabase', 'Clerk']],
  ['Harnesses', ['Claude Code', 'Codex', 'Grok', 'Antigravity', 'Cursor']],
  ['Agentic code review', ['CodeRabbit', 'Greptile', 'Macroscope', 'Bugbot']],
];

const PROJECTS = {
  matchplay: {
    accent: 'green', url: 'matchplay.gg', tech: ['Next.js', 'Supabase', 'Vercel', 'PostHog'],
    title: 'Web app for organising amateur pickup sports games in Poland',
    sub: 'Built and run solo end-to-end: match scheduling, player RSVPs, rosters &amp; analytics',
    brand: () => `<div class="brand mp">
      <svg class="pitch"><line x1="50%" y1="0" x2="50%" y2="100%"/><circle cx="50%" cy="50%"/>
        <rect class="goal" x="0" y="20%" height="60%"/><rect class="goal right" x="100%" y="20%" height="60%"/></svg>
      <div class="mpw">Match<span>Play</span></div><div class="state">soft-launched</div></div>`,
  },
  'smk-buster': {
    accent: 'amber', url: 'smk-buster.pl', tech: ['Next.js', 'Convex', 'Trigger.dev', 'Stagehand'],
    title: 'Automates procedure entries in SMK for Poland&#39;s resident doctors',
    sub: 'One form in, many entries out: hybrid AI + deterministic browser automation',
    brand: () => `<div class="brand smk"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>
      <div class="orb">+</div><div class="smkw">SMK Buster</div></div>`,
  },
};

const BLOCKS = {
  wordmark: () => `<div class="wm"><div class="name">Maciej Czech</div>
    <div class="role">Software Engineer</div><div class="loc">Bydgoszcz, Poland<i>·</i>Remote / EU</div></div>`,
  stack: (theme) => `<div class="stack">${STACK.map(([label, items]) => `<div class="sg"><div class="k">${label}</div>
    <div class="items">${items.map((n) => `<span class="st"><span class="tile">${logo(n, theme)}</span>${n}</span>`).join('')}</div></div>`).join('')}</div>`,
  ...Object.fromEntries(Object.entries(PROJECTS).map(([key, p]) => [key, (theme) => `<div class="card">${p.brand()}
    <div class="body"><div class="title">${p.title}</div><div class="sub">${p.sub}</div>
    <div class="url ${p.accent}">${p.url} ↗</div>
    <div class="tech">${p.tech.map((n) => `<span class="pt">${logo(n, theme)}${n}</span>`).join('')}</div></div></div>`])),
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{background:transparent;-webkit-font-smoothing:antialiased}
#root{font-family:Inter,sans-serif;color:var(--text)}
.k,.st,.pt,.url,.state,.wm{font-family:'JetBrains Mono',monospace}

.wm .name{font-weight:800;font-size:29px;letter-spacing:-.04em;line-height:1.05;color:var(--strong)}
.wm .role{margin-top:7px;font-size:11.5px;font-weight:700;color:var(--green)}
.wm .loc{margin-top:3px;font-size:11.5px;color:var(--muted)}
.wm .loc i{font-style:normal;color:var(--dim);margin:0 5px}

.card{border:1px solid var(--hair);border-radius:9px;overflow:hidden;background:var(--surface)}
.brand{position:relative;height:64px;background:#191B1F;display:flex;align-items:center;justify-content:center;gap:8px}
.brand>*{position:relative}
.mp{flex-direction:column;gap:4px}
.pitch{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:#4ADE80;stroke-width:1;opacity:.2;--r:20px}
.pitch circle{r:var(--r)}
.goal{width:16px}.goal.right{transform:translateX(-16px)}
.mpw{font-weight:800;font-size:21px;letter-spacing:-.04em;line-height:1;color:#fff}
.mpw span{color:#4ADE80}
.state{font-size:10.5px;letter-spacing:.06em;color:#3FBF6F}
.smk i{position:absolute;width:8px;height:8px;border:0 solid rgba(251,191,36,.3)}
.smk .tl{top:8px;left:10px;border-width:1px 0 0 1px}.smk .tr{top:8px;right:10px;border-width:1px 1px 0 0}
.smk .bl{bottom:8px;left:10px;border-width:0 0 1px 1px}.smk .br{bottom:8px;right:10px;border-width:0 1px 1px 0}
.orb{width:24px;height:24px;border-radius:50%;border:1.5px solid #FBBF24;background:rgba(245,158,11,.12);color:#FBBF24;
  font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center}
.smkw{font-weight:700;font-size:16px;letter-spacing:-.02em;color:#fff}
.body{padding:10px 12px 11px}
.title{font-size:13px;font-weight:600;line-height:1.3;color:var(--strong);text-wrap:pretty}
.sub{font-size:11.5px;line-height:1.4;color:var(--muted);margin-top:3px;text-wrap:pretty}
.url{display:inline-block;margin-top:8px;font-size:11.5px;font-weight:700;text-decoration:underline;text-underline-offset:3px}
.url.green{color:var(--green)}.url.amber{color:var(--amber)}
.tech{display:flex;flex-wrap:wrap;gap:4px 11px;margin-top:8px}
.pt{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--muted)}
.pt .logo{width:12.5px;height:12.5px}
.pt .logo.badge{border-radius:3px}

.sg{padding:8px 0 9px;border-top:1px solid var(--hair)}
.sg:first-child{border-top:0;padding-top:0}
.sg:last-child{padding-bottom:0}
.k{font-size:10.5px;color:var(--dim)}
.items{display:flex;flex-wrap:wrap;gap:7px 10px;margin-top:6px}
.st{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:500;color:var(--text)}
.tile{width:20px;height:20px;border-radius:5px;background:var(--tile);display:flex;align-items:center;justify-content:center;overflow:hidden}
.tile .logo{width:13px;height:13px;display:block}
.tile .logo.badge{width:100%;height:100%}

/* wide: same system, reflowed for the 830px column */
.wide .wm .name{font-size:40px}
.wide .wm .role{margin-top:10px;font-size:14px}
.wide .wm .loc{margin-top:4px;font-size:14px}
.wide .card{display:grid;grid-template-columns:232px 1fr;border-radius:10px}
.wide .brand{height:auto;min-height:150px}
.wide .pitch{--r:28px}
.wide .goal{width:20px}.wide .goal.right{transform:translateX(-20px)}
.wide .mp{gap:7px}
.wide .mpw{font-size:32px}
.wide .state{font-size:12px}
.wide .orb{width:32px;height:32px;font-size:19px;border-width:2px}
.wide .smk{gap:11px}
.wide .smkw{font-size:23px}
.wide .smk i{width:11px;height:11px}
.wide .smk .tl,.wide .smk .tr{top:12px}.wide .smk .bl,.wide .smk .br{bottom:12px}
.wide .smk .tl,.wide .smk .bl{left:14px}.wide .smk .tr,.wide .smk .br{right:14px}
.wide .body{padding:18px 22px 19px;display:flex;flex-direction:column;justify-content:center}
.wide .title{font-size:17px}
.wide .sub{font-size:14px;margin-top:5px}
.wide .url{margin-top:12px;font-size:13px}
.wide .tech{gap:6px 18px;margin-top:12px}
.wide .pt{font-size:12.5px;gap:6px}
.wide .pt .logo{width:15px;height:15px}
.wide .stack{display:grid;grid-template-columns:repeat(3,1fr)}
.wide .sg{border-top:0;padding:14px 20px}
.wide .sg:nth-child(3n+2),.wide .sg:nth-child(3n){border-left:1px solid var(--hair)}
.wide .sg:nth-child(3n+1){padding-left:0}
.wide .sg:nth-child(3n){padding-right:0}
.wide .sg:nth-child(n+4){border-top:1px solid var(--hair)}
.wide .sg:nth-child(-n+3){padding-top:2px}
.wide .sg:nth-child(n+4){padding-bottom:2px}
.wide .k{font-size:12px}
.wide .items{gap:9px 16px;margin-top:10px}
.wide .st{font-size:13px;gap:8px}
.wide .tile{width:24px;height:24px;border-radius:6px}
.wide .tile .logo{width:16px;height:16px}
.wide .tile .logo.badge{width:100%;height:100%}`;

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
