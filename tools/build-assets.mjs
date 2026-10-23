/* Wordmark, tech strip and links row — one PNG per theme, composed in Chromium.
   Type is baked into the pixels because GitHub strips CSS from READMEs and web fonts
   never load inside an <img>. Everything here is a knob you can turn.

   Setup:  npm i -D playwright && npx playwright install chromium
   Run:    node tools/build-assets.mjs                                            */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT   = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const ICONS  = `${ROOT}/tools/icons`;
const OUT    = `${ROOT}/assets`;
const W      = 830;                    // GitHub renders a README in an 830px column

// ── knobs ─────────────────────────────────────────────────────────────────────
const WORDMARK = 'martian';            // martian | plex | space
const ICON_STYLE = 'brand';            // brand | amber | mono
const TAGLINE  = 'Builds at the seam of <em>product</em> and <em>systems</em> — Node first, agents on the grunt work';

const STACK = [
  ['typescript','TypeScript','#3178C6'], ['nodedotjs','Node','#5FA04E'],
  ['nextdotjs','Next.js','#888888'],     ['astro','Astro','#BC52EE'],
  ['react','React','#61DAFB'],           ['convex','Convex','#EE342F'],
  ['supabase','Supabase','#3FCF8E'],     ['clerk','Clerk','#6C47FF'],
  ['docker','Docker','#2496ED'],         ['githubactions','Actions','#2088FF'],
  ['python','Python','#3776AB'],         ['linear','Linear','#5E6AD2'],
];
const LINKS = [['github','github.com/maciekczech'],['linkedin','linkedin'],
               ['anthropic','claude code'],['openai','codex']];

const FACES = {
  martian: { f:"'Martian Mono'", size:31, w:800, ls:'-0.03em', name:'MACIEK CZECH' },
  plex:    { f:"'IBM Plex Mono'", size:40, w:700, ls:'-0.02em', name:'maciek czech' },
  space:   { f:"'Space Mono'",    size:42, w:700, ls:'-0.03em', name:'Maciek Czech' },
};

// Amber is retuned per theme on purpose: a single bright yellow is unreadable on white.
const THEMES = {
  dark:  { bg:'#0D1117', ink:'#E6EDF3', mut:'#7D8590', amb:'#FFB224', line:'#30363D', tile:'#161B22' },
  light: { bg:'#FFFFFF', ink:'#1F2328', mut:'#59636E', amb:'#B45309', line:'#D1D9E0', tile:'#F6F8FA' },
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Martian+Mono:wght@400;700;800&family=IBM+Plex+Mono:wght@500;700&family=Space+Mono:wght@700&family=Inter+Tight:wght@400;500;600;700&display=swap');`;
const icon = n => fs.readFileSync(`${ICONS}/${n}.svg`,'utf8').replace(/<title>.*?<\/title>/,'');

const wordmark = c => { const h = FACES[WORDMARK]; return `<style>${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
#root{width:${W}px;background:${c.bg};padding:4px 0 2px}
.n{font-family:${h.f},monospace;font-size:${h.size}px;font-weight:${h.w};letter-spacing:${h.ls};
   color:${c.ink};line-height:1.12;white-space:nowrap}
.n b{color:${c.amb};font-weight:inherit}
.r{display:flex;align-items:center;gap:14px;margin-top:13px}
.r:before{content:'';flex:0 0 46px;height:3px;background:${c.amb}}
.t{font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:500;letter-spacing:.03em;color:${c.mut}}
.t em{color:${c.ink};font-style:normal;font-weight:600}
</style><div id="root">
<div class="n">${h.name.replace(/(Czech|CZECH|czech)/,'<b>$1</b>')}</div>
<div class="r"><div class="t">${TAGLINE}</div></div></div>`; };

const stack = c => `<style>${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
#root{width:${W}px;background:${c.bg};font-family:'Inter Tight',sans-serif;padding:6px 0}
.row{display:flex;justify-content:space-between;align-items:flex-start}
.i{display:flex;flex-direction:column;align-items:center;gap:8px;width:${W/STACK.length}px}
.g{width:${ICON_STYLE==='brand'?40:30}px;height:${ICON_STYLE==='brand'?40:30}px;display:grid;place-items:center;
   ${ICON_STYLE==='brand'?`background:${c.tile};border:1px solid ${c.line};border-radius:9px;`:''}}
.g svg{width:${ICON_STYLE==='brand'?22:27}px;height:${ICON_STYLE==='brand'?22:27}px;display:block}
.l{font-size:9.5px;font-weight:500;letter-spacing:.06em;color:${c.mut};text-transform:uppercase}
</style><div id="root"><div class="row">
${STACK.map(([n,label,brand])=>{
  const fill = ICON_STYLE==='amber' ? c.amb : ICON_STYLE==='mono' ? c.mut : brand;
  return `<div class="i"><div class="g">${icon(n).replace('<svg ',`<svg style="fill:${fill}" `)}</div><div class="l">${label}</div></div>`;
}).join('')}</div></div>`;

const links = c => `<style>${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
#root{width:${W}px;background:${c.bg};padding:4px 0;font-family:'Inter Tight',sans-serif}
.row{display:flex;align-items:center;gap:9px}
.i{display:flex;align-items:center;gap:7px;padding:5px 11px 5px 9px;border:1px solid ${c.line};border-radius:999px}
.i svg{width:14px;height:14px;fill:${c.mut};display:block}
.i span{font-size:11.5px;font-weight:500;color:${c.mut}}
</style><div id="root"><div class="row">
${LINKS.map(([n,l])=>`<div class="i">${icon(n)}<span>${l}</span></div>`).join('')}</div></div>`;

const b = await chromium.launch();
for (const [name, fn] of [['wordmark',wordmark],['stack',stack],['links',links]]) {
  for (const [theme, c] of Object.entries(THEMES)) {
    const p = await b.newPage({ viewport:{width:W,height:400}, deviceScaleFactor:2 });
    await p.setContent(fn(c), { waitUntil:'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
    await p.locator('#root').screenshot({ path:`${OUT}/${name}-${theme}.png` });
    await p.close();
  }
  console.log('built', name);
}
await b.close();
