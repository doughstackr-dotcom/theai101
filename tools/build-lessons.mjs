#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   build-lessons.mjs — generate static, crawlable lesson pages for
   TheAI101 Academy from js/curriculum.js (single source of truth).

   Outputs (idempotent — safe to re-run):
     academy/lesson/<lessonId>/index.html  (one per lesson, 26 total)
     academy/lessons/index.html            (directory page)
     sitemap.xml                           (repo root)

   Zero dependencies. Run:  node tools/build-lessons.mjs
   ═══════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const require = createRequire(import.meta.url);

/* load the read-only data files into this process */
globalThis.window = globalThis;
require(path.join(__dirname, '../js/patterns-data.js'));
require(path.join(__dirname, '../js/curriculum.js'));

const AI = globalThis.AI;
const CURRICULUM = AI.CURRICULUM;
if (!CURRICULUM || !CURRICULUM.units) throw new Error('curriculum failed to load');

/* ── helpers ───────────────────────────────────────── */
const SITE = 'https://theai101.shop';
const LASTMOD = '2026-09-07';
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Nunito:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap';
const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'><rect x='2' y='6' width='4' height='7' rx='1' fill='%23e8590c'/><rect x='11' y='3' width='4' height='8' rx='1' fill='%23188a4e'/></svg>">`;

/* escape for text content (keeps nothing raw) */
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* escape for double- or single-quoted attribute values */
const escAttr = s => escHtml(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const stripTags = s => String(s).replace(/<[^>]+>/g, '');

function head({ title, description, canonical, ogType }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)}</title>
<meta name="description" content="${escAttr(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#faf6ee">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#161310">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
${FAVICON}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONT_LINK}" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css?v=2">`;
}

/* flatten: all lessons in order, bosses excluded */
const flat = [];
CURRICULUM.units.forEach((u, ui) => {
  u.lessons.forEach(l => flat.push({ unit: u, unitNo: ui + 1, lesson: l }));
});
const idxOf = id => flat.findIndex(x => x.lesson.id === id);

/* ── step rendering ────────────────────────────────── */
function renderTable(rows) {
  const [headRow, ...rest] = rows;
  return `<table><thead><tr>${headRow.map(h => `<th>${escHtml(h)}</th>`).join('')}</tr></thead><tbody>${rest.map(r => `<tr>${r.map(c => `<td>${escHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function renderStep(s) {
  const chart = s.c
    ? `<div class="lesson-chart"><svg data-chart='${escAttr(JSON.stringify(s.c))}' viewBox="0 0 560 240" role="img" aria-label="Lesson chart"></svg></div>`
    : '';
  const table = s.table ? renderTable(s.table) : '';
  /* s.p may contain trusted inline <b> tags from the curriculum — inserted raw */
  return `<div class="lesson-step"><h2 style="font-size:1.05rem;margin:.2rem 0 .4rem">${escHtml(s.h)}</h2><p>${s.p}</p>${table}${chart}</div>`;
}
function renderChecks(check) {
  return check.map(q => {
    const opts = q.opts.map((o, oi) => oi === q.a ? `<li><b class="up">${escHtml(o)}</b></li>` : `<li>${escHtml(o)}</li>`).join('');
    return `<details class="card" style="margin:.8rem 0"><summary style="font-weight:800;cursor:pointer">${escHtml(q.q)}</summary><div style="margin-top:.6rem"><ul style="margin:.2rem 0 .6rem;padding-left:1.2rem">${opts}</ul><p class="small">${escHtml(q.why)}</p></div></details>`;
  }).join('\n');
}

/* ── lesson page ───────────────────────────────────── */
function lessonPage(entry) {
  const { unit, unitNo, lesson: l } = entry;
  const i = idxOf(l.id);
  const prev = flat[i - 1], next = flat[i + 1];
  const canonical = `${SITE}/academy/lesson/${l.id}/`;
  const blurb = stripTags(l.blurb);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: l.title,
    description: blurb,
    learningResourceType: 'Lesson',
    isAccessibleForFree: true,
    inLanguage: 'en',
    provider: { '@type': 'Organization', name: 'TheAI101', url: SITE }
  };
  const ldJson = JSON.stringify(ld).replace(/</g, '\\u003c');

  const navBtns = [
    prev ? `<a class="btn btn-ghost" href="/academy/lesson/${prev.lesson.id}/">← ${escHtml(prev.lesson.title)}</a>` : `<span></span>`,
    next ? `<a class="btn btn-ghost" href="/academy/lesson/${next.lesson.id}/">${escHtml(next.lesson.title)} →</a>` : `<a class="btn btn-ghost" href="/practice/">Live practice →</a>`
  ].join('\n    ');

  return `${head({
    title: `${l.title} — TheAI101 Academy`,
    description: blurb,
    canonical,
    ogType: 'article'
  })}
<script type="application/ld+json">${ldJson}</script>
</head>
<body>
<main class="wrap">

  <nav class="small" aria-label="Breadcrumb" style="margin:.4rem 0 1.2rem">
    <a href="/academy/">Academy</a> <span class="dim">›</span> <a href="/academy/lessons/">Unit ${unitNo} · ${escHtml(unit.title)}</a> <span class="dim">›</span> ${escHtml(l.title)}
  </nav>

  <span class="kicker">Unit ${unitNo} · ${escHtml(unit.title)}</span>
  <h1>${escHtml(l.title)}</h1>
  <p class="lead">${escHtml(l.blurb)}</p>

  <div class="lesson-steps" style="margin-top:1.4rem">
${l.steps.map(renderStep).join('\n')}
  </div>

  <section style="margin-top:2.2rem" aria-label="Quick check">
    <h2>Quick check</h2>
${renderChecks(l.check)}
  </section>

  <section class="card" style="margin-top:2rem">
    <a class="btn btn-primary" href="/academy/#${l.id}">Play the interactive version →</a>
    <p class="small" style="margin:.9rem 0 0">This lesson is part of the free learning path at <a href="/academy/">/academy/</a> — progress, XP and boss games live there.</p>
  </section>

  <nav class="lesson-footer" aria-label="Previous and next lesson" style="margin-top:1.4rem">
    ${navBtns}
  </nav>

  <p class="small dim" style="margin-top:2.2rem">Educational content only — not financial advice.</p>

</main>
<script src="/js/candles.js?v=2"></script>
<script src="/js/patterns-data.js?v=2"></script>
<script src="/js/lesson-page.js?v=2"></script>
</body>
</html>
`;
}

/* ── lessons directory page ────────────────────────── */
function lessonsIndexPage() {
  const canonical = `${SITE}/academy/lessons/`;
  const sections = CURRICULUM.units.map((u, ui) => {
    const items = u.lessons.map(l =>
      `      <li style="margin:.45rem 0"><a href="/academy/lesson/${l.id}/"><b>${escHtml(l.title)}</b></a><br><span class="small">${escHtml(l.blurb)}</span></li>`
    ).join('\n');
    return `  <section style="margin-top:1.8rem">
    <h2><span class="kicker" style="margin-right:.6rem">Unit ${ui + 1}</span>${escHtml(u.title)}</h2>
    <p class="small dim" style="margin:.1rem 0 .4rem">${escHtml(u.tag)}</p>
    <ul style="list-style:none;padding:0;margin:0">
${items}
    </ul>
  </section>`;
  }).join('\n');

  return `${head({
    title: 'Every Lesson, as a Page — TheAI101 Academy',
    description: 'The readable, printable versions of every lesson in the TheAI101 Academy path: 26 static pages across 7 units — candles, patterns, traps, and risk — free and without an account.',
    canonical,
    ogType: 'website'
  })}
</head>
<body>
<main class="wrap">

  <span class="kicker">Lesson directory</span>
  <h1>Every lesson, as a page</h1>
  <p class="lead">These are the readable, printable versions of every lesson in the Academy path. For the full experience — XP, progress saving, and boss games between units — use <a href="/academy/">the interactive path</a>.</p>

${sections}

  <section class="card" style="margin-top:2.2rem">
    <a class="btn btn-primary" href="/academy/">Open the interactive path →</a>
    <p class="small" style="margin:.9rem 0 0">Progress, XP and boss games live at <a href="/academy/">/academy/</a>.</p>
  </section>

  <p class="small dim" style="margin-top:2.2rem">Educational content only — not financial advice.</p>

</main>
</body>
</html>
`;
}

/* ── sitemap ───────────────────────────────────────── */
function sitemapXml() {
  const urls = [
    `${SITE}/`,
    `${SITE}/academy/`,
    `${SITE}/academy/lessons/`,
    ...flat.map(x => `${SITE}/academy/lesson/${x.lesson.id}/`),
    `${SITE}/practice/`,
    `${SITE}/prolab/`,
    `${SITE}/cheatsheet/`,
    `${SITE}/candles/anatomy.html`,
    `${SITE}/candles/patterns.html`,
    `${SITE}/patterns/`,
    `${SITE}/markets/`,
    `${SITE}/markets/stocks.html`,
    `${SITE}/markets/options.html`,
    `${SITE}/markets/forex.html`,
    `${SITE}/markets/binary.html`,
    `${SITE}/about.html`
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${LASTMOD}</lastmod></url>`).join('\n')}
</urlset>
`;
}

/* ── write everything ──────────────────────────────── */
let count = 0;
for (const entry of flat) {
  const dir = path.join(ROOT, 'academy', 'lesson', entry.lesson.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), lessonPage(entry));
  count++;
}
fs.mkdirSync(path.join(ROOT, 'academy', 'lessons'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'academy', 'lessons', 'index.html'), lessonsIndexPage());
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml());

console.log(`build-lessons: wrote ${count} lesson pages, academy/lessons/index.html, sitemap.xml (${flat.length} lessons across ${CURRICULUM.units.length} units)`);
