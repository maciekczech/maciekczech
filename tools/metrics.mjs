/* Recompute the language bars in README.md from the repos you actually own.
   Counts repos by primary language, not bytes on disk — byte counts are dominated by
   vendored files and backup repos, which says nothing about where the work goes.

   Needs the GitHub CLI, authenticated:  env -u GH_TOKEN gh auth status
   Run:  node tools/metrics.mjs            (prints the block; --write updates README.md) */
import { execSync } from 'child_process';
import fs from 'fs';

const USER = 'maciekczech', BAR = 24, TOP = 4;

const repos = JSON.parse(execSync(
  `gh repo list ${USER} --limit 300 --json primaryLanguage,isPrivate`,
  { encoding:'utf8', env:{ ...process.env, GH_TOKEN:undefined } }));

const counts = {};
for (const r of repos) if (r.primaryLanguage) counts[r.primaryLanguage.name] = (counts[r.primaryLanguage.name]||0)+1;

const ranked = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
const head = ranked.slice(0, TOP);
const tail = ranked.slice(TOP);
const rows = [...head];
if (tail.length) rows.push([tail.map(([l])=>l).slice(0,2).join(', ') + (tail.length>2?', other':''),
                            tail.reduce((s,[,n])=>s+n,0)]);

const total = rows.reduce((s,[,n])=>s+n,0);
const w = Math.max(...rows.map(([l])=>l.length));
const block = rows.map(([label,n])=>{
  const pct = n/total*100, fill = Math.round(pct/100*BAR);
  return `${label.padEnd(w)}  ${String(n).padStart(2)} repos  ${'█'.repeat(fill)}${'·'.repeat(BAR-fill)}  ${pct.toFixed(1).padStart(5)} %`;
}).join('\n');

const pub = repos.filter(r=>!r.isPrivate).length;
const caption = `**Where the work goes** — ${repos.length} repos by primary language, ${pub} of them in the open`;

if (process.argv.includes('--write')) {
  const p = new URL('../README.md', import.meta.url);
  const md = fs.readFileSync(p,'utf8')
    .replace(/\*\*Where the work goes\*\*[^\n]*/, caption)
    .replace(/```text\n[\s\S]*?\n```/, '```text\n'+block+'\n```');
  fs.writeFileSync(p, md);
  console.log('README.md updated');
} else {
  console.log(caption + '\n\n```text\n' + block + '\n```');
}
