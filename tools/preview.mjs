/* Render README.md the way GitHub actually renders it, then screenshot both themes.
   Eyeballing markdown proves nothing — this pushes the file through GitHub's own
   /markdown endpoint (gfm mode), dresses it in github-markdown-css, and constrains
   the column to 830px, which is the real width of a README on github.com.

   Needs: env -u GH_TOKEN gh auth status, and playwright.
   Run:   node tools/preview.mjs   ->  .preview/readme-{dark,light}.png */
import { execFileSync } from 'child_process';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT  = path.join(ROOT, '.preview');
const PORT = 8942, COL = 830;
const PW   = process.env.PLAYWRIGHT_PATH || 'playwright';

const body = execFileSync('gh', ['api','-X','POST','/markdown','--input','-'], {
  input: JSON.stringify({ text: fs.readFileSync(path.join(ROOT,'README.md'),'utf8'),
                          mode:'gfm', context:'maciekczech/maciekczech' }),
  encoding:'utf8', env:{ ...process.env, GH_TOKEN:undefined },
})
  // The API rewrites relative image paths to raw.githubusercontent.com URLs that only
  // exist once pushed. Point them back at the working tree so we preview *this* commit.
  .replace(/https:\/\/raw\.githubusercontent\.com\/maciekczech\/maciekczech\/[^/]+\//g, '/');

const CSS = 'https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown';
const page = t => `<!doctype html><meta charset="utf-8">
<base href="/">   <!-- README image paths are repo-relative; resolve them from the repo root, not from .preview/ -->
<link rel="stylesheet" href="${CSS}-${t}.css">
<style>body{margin:0;background:${t==='dark'?'#0d1117':'#fff'}}
.markdown-body{box-sizing:border-box;width:${COL}px;padding:16px 0}
.markdown-body pre,.markdown-body pre code{font-family:'DejaVu Sans Mono',monospace}</style>
<article class="markdown-body">${body}</article>`;

for (const t of ['dark','light']) fs.mkdirSync(OUT,{recursive:true}),
  fs.writeFileSync(path.join(OUT,`${t}.html`), page(t));

// Serve over http: a CSS-animated SVG inside <img> renders frozen from a file:// URL.
const srv = http.createServer((req,res)=>{
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]) === '/' ? '' : decodeURIComponent(req.url.split('?')[0]));
  const rel = path.relative(ROOT, f);
  if (rel.startsWith('..') || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': { '.png':'image/png', '.svg':'image/svg+xml', '.html':'text/html' }[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const pw = await import(PW);
const { chromium } = pw.default ?? pw;   // playwright's entry is CJS; ESM import wraps it in .default
const br = await chromium.launch();

// --frames: the pipeline is a 22s CSS loop, so a single screenshot only ever proves one
// stage. Sample the middle of each stage's window instead. Times are scheduled against a
// single t0 — chaining waitForTimeout() accumulates drift and lands on the wrong stage.
if (process.argv.includes('--frames')) {
  const LOOP = 22, AT = [7,24,42,59,74,88];
  for (const t of ['dark','light']) {
    const pg = await br.newPage({ viewport:{width:COL,height:900}, deviceScaleFactor:2, colorScheme:t });
    await pg.goto(`http://127.0.0.1:${PORT}/.preview/${t}.html`, { waitUntil:'networkidle' });
    const img = pg.locator('img[src$="pipeline-light.svg"]');
    const t0 = Date.now();
    for (const pct of AT) {
      const due = t0 + pct/100*LOOP*1000;
      await pg.waitForTimeout(Math.max(0, due - Date.now()));
      await img.screenshot({ path: path.join(OUT,`pipeline-${t}-${String(pct).padStart(2,'0')}.png`) });
      console.log(`${t} @ ${pct}%`);
    }
  }
  await br.close(); srv.close(); process.exit(0);
}

for (const t of ['dark','light']) {
  const pg = await br.newPage({ viewport:{width:COL,height:900}, deviceScaleFactor:2,
                                colorScheme:t });
  await pg.goto(`http://127.0.0.1:${PORT}/.preview/${t}.html`, { waitUntil:'networkidle' });
  await pg.waitForTimeout(1500);              // let the pipeline animation reach a live frame
  await pg.locator('article').screenshot({ path: path.join(OUT,`readme-${t}.png`) });
  console.log(`${t}: ${(await pg.locator('article').boundingBox()).height|0}px tall`);
}
await br.close(); srv.close();
