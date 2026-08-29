/* Profile pipeline — one animated SVG per theme.
   Main line = the steps every change goes through.
   Branch    = an optional step, drawn the way a git graph draws one: it leaves the
               main line, does its work, and merges back.
   Run: node tools/pipeline-svg.mjs   (no dependencies) */
import fs from 'fs';

const W=830, H=180, INSET=64, MAIN_Y=72, BR_Y=34;
const LOOP=22;                                   // seconds — one full pass of the process

// ── the process ────────────────────────────────────────────────────────────────
const MAIN = [
  { label:'research',    at:0.5,  win:[0,15],
    tools:'hermes-agent  ·  scratchpad',
    tech :'Python  ·  public data sources' },
  { label:'spec & plan', at:15,   win:[15,33],
    tools:'Linear  ·  GitHub Projects',
    tech :'Markdown specs  ·  brainstorm, then grill it' },
  { label:'build',       at:52,   win:[52,67],
    tools:'Claude Code  ·  Codex  ·  Cursor  —  all driven through t3code',
    tech :'TypeScript  ·  Node  ·  Next.js  ·  Astro  ·  React  ·  Convex  ·  Supabase  ·  Clerk' },
  { label:'review',      at:67,   win:[67,82],
    tools:'Greptile  ·  CodeRabbit  ·  Macroscope  ·  Bugbot',
    tech :'GitHub pull requests  ·  every bot comment answered' },
  { label:'ship',        at:82,   win:[82,94],
    tools:'GitHub Actions',
    tech :'Docker  ·  Linux VPS  ·  macOS' },
];
const BRANCH = { label:'design', at:33, win:[33,52],
  tools:'Claude Design',
  tech :'HTML  ·  CSS  ·  screenshots in both themes' };

// ── geometry ───────────────────────────────────────────────────────────────────
const SPAN=W-INSET*2;
const X = i => INSET + (i/(MAIN.length-1))*SPAN;
const FORK=258, MERGE=397, BRX=(FORK+MERGE)/2;
const frac = x => (x-INSET)/SPAN;                       // position along the main line
const BRANCH_PATH=`M ${FORK},${MAIN_Y} C ${FORK+17},${MAIN_Y} ${FORK+19},${BR_Y} ${FORK+34},${BR_Y}
                   L ${MERGE-34},${BR_Y} C ${MERGE-19},${BR_Y} ${MERGE-17},${MAIN_Y} ${MERGE},${MAIN_Y}`;

const HOLD=94, FADE=100;
const esc = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;');

const T={
  dark:  {ink:'#E6EDF3',mut:'#7D8590',dim:'#57606A',amb:'#FFB224',line:'#30363D',bg:'#0D1117'},
  light: {ink:'#1F2328',mut:'#59636E',dim:'#8C959F',amb:'#B45309',line:'#D1D9E0',bg:'#FFFFFF'},
};

const svg = c => {
  const all=[...MAIN, BRANCH];
  // node + label + the two swapping lines, one keyframe set per stage
  const kf = all.map((s,i)=>{
    const on=s.at+0.6, [a,b]=s.win;
    return `@keyframes n${i}{0%,${s.at}%{opacity:0}${on}%,${HOLD}%{opacity:1}${(HOLD+2)}%,100%{opacity:0}}
@keyframes h${i}{0%,${s.at}%{opacity:0}${on}%,${HOLD}%{opacity:.15}${(HOLD+2)}%,100%{opacity:0}}
@keyframes g${i}{0%,${s.at}%{fill:${c.dim}}${on}%,${b}%{fill:${c.amb}}${(b+0.8).toFixed(1)}%,${HOLD}%{fill:${c.mut}}${(HOLD+2)}%,100%{fill:${c.dim}}}
@keyframes s${i}{0%,${a}%{opacity:0}${(a+0.7).toFixed(1)}%,${(b-1.2).toFixed(1)}%{opacity:1}${(b-0.5).toFixed(1)}%,100%{opacity:0}}`;
  }).join('\n');

  const node=(x,y,i)=>`<circle cx="${x}" cy="${y}" r="11" fill="${c.amb}" opacity="0" style="animation:h${i} ${LOOP}s linear infinite"/>
  <circle cx="${x}" cy="${y}" r="5" fill="${c.bg}" stroke="${c.line}" stroke-width="1.5"/>
  <circle cx="${x}" cy="${y}" r="5" fill="${c.amb}" opacity="0" style="animation:n${i} ${LOOP}s linear infinite"/>`;

  const mainNodes = MAIN.map((s,i)=>`<g>${node(X(i),MAIN_Y,i)}
    <text x="${X(i)}" y="${MAIN_Y+26}" class="lbl" style="animation:g${i} ${LOOP}s linear infinite">${esc(s.label)}</text></g>`).join('\n');

  const bi=MAIN.length;
  const branchNode=`<g>${node(BRX,BR_Y,bi)}
    <text x="${BRX}" y="${BR_Y-14}" class="lbl" style="animation:g${bi} ${LOOP}s linear infinite">${esc(BRANCH.label)}<tspan class="optTag" dx="6">optional</tspan></text></g>`;

  const lines = all.map((s,i)=>
`<text x="${W/2}" y="143" class="tool" opacity="0" style="animation:s${i} ${LOOP}s linear infinite">${esc(s.tools)}</text>
<text x="${W/2}" y="163" class="tech" opacity="0" style="animation:s${i} ${LOOP}s linear infinite">${esc(s.tech)}</text>`).join('\n');

  // main fill pauses at the fork while the branch runs, then carries on
  const flowMain=`@keyframes fm{0%{stroke-dashoffset:1}15%{stroke-dashoffset:${(1-frac(X(1))).toFixed(3)}}
    26%,38%{stroke-dashoffset:${(1-frac(FORK)).toFixed(3)}}
    45%{stroke-dashoffset:${(1-frac(MERGE)).toFixed(3)}}52%{stroke-dashoffset:${(1-frac(X(2))).toFixed(3)}}
    67%{stroke-dashoffset:${(1-frac(X(3))).toFixed(3)}}82%,${HOLD}%{stroke-dashoffset:0;opacity:1}
    ${HOLD+2}%,100%{stroke-dashoffset:0;opacity:0}}`;
  const flowBranch=`@keyframes fb{0%,26%{stroke-dashoffset:1;opacity:1}38%,${HOLD}%{stroke-dashoffset:0;opacity:1}
    ${HOLD+2}%,100%{stroke-dashoffset:0;opacity:0}}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"
  aria-label="How a change moves: research with hermes-agent and scratchpad; spec and plan in Linear and GitHub Projects; an optional design branch through Claude Design; build with Claude Code, Codex and Cursor driven through t3code, in TypeScript, Node, Next.js, Astro, React, Convex, Supabase and Clerk; review by Greptile, CodeRabbit, Macroscope and Bugbot; ship through GitHub Actions onto Docker, a Linux VPS and macOS.">
<style>
text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
.lbl{font-size:12.5px;font-weight:600;fill:${c.dim};text-anchor:middle}
.optTag{font-size:8.5px;letter-spacing:1.1px;fill:${c.dim};font-weight:500}
.tool{font-size:13px;font-weight:500;fill:${c.ink};text-anchor:middle}
.tech{font-size:11.5px;font-weight:400;fill:${c.mut};text-anchor:middle}
.track{stroke:${c.line};fill:none}
.flow{stroke:${c.amb};stroke-width:1.5;fill:none;stroke-linecap:round;stroke-dasharray:1 2}
${flowMain}
${flowBranch}
${kf}
@media (prefers-reduced-motion:reduce){
  *{animation:none!important}
  .flow{stroke-dashoffset:0}
  .lbl{fill:${c.mut}}
  circle[opacity="0"]{opacity:1}
  .tool,.tech,.hair{opacity:0}
}
</style>
<line class="track" x1="${INSET}" y1="${MAIN_Y}" x2="${W-INSET}" y2="${MAIN_Y}" stroke-width="1"/>
<path class="track" d="${BRANCH_PATH}" stroke-width="1" stroke-dasharray="3 3"/>
<line class="flow" x1="${INSET}" y1="${MAIN_Y}" x2="${W-INSET}" y2="${MAIN_Y}" pathLength="1"
      style="animation:fm ${LOOP}s linear infinite"/>
<path class="flow" d="${BRANCH_PATH}" pathLength="1" style="animation:fb ${LOOP}s linear infinite"/>
${mainNodes}
${branchNode}
<line class="hair" x1="${INSET}" y1="121" x2="${W-INSET}" y2="121" stroke="${c.line}" stroke-width="1" opacity=".55"/>
${lines}
</svg>`;
};

for (const [k,c] of Object.entries(T)) {
  fs.writeFileSync(new URL(`../assets/pipeline-${k}.svg`, import.meta.url), svg(c));
  console.log(k, svg(c).length, 'bytes');
}
