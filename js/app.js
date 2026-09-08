/* ═══════════════════════════════════════════════════════════════
   TheAI101 shared shell — nav, footer, live ticker, ambient bg,
   theme (light default / night arcade), reveal animations.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const AI = window.AI = window.AI || {};

const CANDLE_SVG = (g, r)=>`<svg width="46" height="86" viewBox="0 0 46 86" fill="none">
  <rect x="14" y="26" width="18" height="34" rx="4" stroke="${g}" stroke-width="3"/>
  <line x1="23" y1="8" x2="23" y2="26" stroke="${g}" stroke-width="3" stroke-linecap="round"/>
  <line x1="23" y1="60" x2="23" y2="80" stroke="${g}" stroke-width="3" stroke-linecap="round"/>
</svg>`;

const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4L19 19M19 5l-1.6 1.6M6.6 17.4L5 19"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>';
const MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

const NAV = `
<div class="nav-inner">
  <a class="logo" href="/"><span class="mark"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="2.5" y="7" width="4" height="6.5" rx="1.2" fill="#fff"/><line x1="4.5" y1="3" x2="4.5" y2="16" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><rect x="11" y="3.5" width="4" height="7.5" rx="1.2" fill="#1c1207"/><line x1="13" y1="1.5" x2="13" y2="16.5" stroke="#1c1207" stroke-width="1.6" stroke-linecap="round"/></svg></span>TheAI<span class="tick" style="color:var(--accent)">101</span></a>
  <div class="links" id="navLinks">
    <a href="/candles/anatomy.html" data-nav="anatomy">Start here</a>
    <a href="/academy/" data-nav="academy">Academy</a>
    <a href="/practice/" data-nav="practice-live">Live Practice</a>
    <a href="/candles/patterns.html" data-nav="patterns">Patterns</a>
    <a href="/patterns/" data-nav="chartp">Chart Shapes</a>
    <a href="/markets/" data-nav="markets">Markets</a>
    <a href="/brokers/" data-nav="brokers">Brokers</a>
    <a href="/prolab/" data-nav="prolab">Pro Labs</a>
    <a href="/cheatsheet/" data-nav="cheatsheet">Cheat sheet</a>
    <a href="https://trading-101.printify.me" data-nav="shop" target="_blank" rel="noopener">Shop</a>
  </div>
  <button class="theme-toggle" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false" style="margin-left:auto;display:none">${MENU}</button>
  <a class="cta" href="/academy/">Start learning</a>
  <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle night mode" title="Night mode"></button>
</div>`;

const FOOT = `
<div class="foot-inner">
  <div><b style="font-family:var(--disp)">TheAI101</b> — learn the charts, wear the charts.</div>
  <div><a href="/candles/anatomy.html">Start here</a> · <a href="/academy/">Academy</a> · <a href="/practice/">Live Practice</a> · <a href="/candles/patterns.html">Patterns</a> · <a href="/markets/">Markets</a> · <a href="/brokers/">Brokers</a> · <a href="/prolab/">Pro Labs</a> · <a href="/cheatsheet/">Cheat sheet</a> · <a href="https://trading-101.printify.me" target="_blank" rel="noopener">Shop</a> · <a href="/about.html">About</a></div>
  <div>Educational content only — not financial advice. Market data for practice only.</div>
</div>`;

const BG = `
<div class="ai-bg" aria-hidden="true">
  <div class="grid"></div>
  <div class="dcandle d1">${CANDLE_SVG('currentColor')}</div>
  <div class="dcandle d2">${CANDLE_SVG('currentColor')}</div>
  <div class="dcandle d3">${CANDLE_SVG('currentColor')}</div>
  <div class="dcandle d4">${CANDLE_SVG('currentColor')}</div>
</div>`;

/* ── Live ticker ── */
function initTicker(){
  const host = document.getElementById('aiTicker');
  if(!host || !AI.market) return;
  const keys = AI.market.symbols.map(s=>s.key);
  const track = host.querySelector('.ticker-track');
  function itemHTML(k){
    return `<span class="ticker-item" data-sym="${k}"><b>${k}-USD</b><span class="v flat">—</span><span class="d"></span></span>`;
  }
  track.innerHTML = [0,1].map(()=>keys.map(itemHTML).join('')).join('');
  // the second copy exists only to loop the marquee — hide it from screen readers
  track.querySelectorAll('.ticker-item').forEach((el,i)=>{ if(i >= keys.length) el.setAttribute('aria-hidden','true'); });
  const apply = (k, p)=>{
    const prev = parseFloat(track.querySelector(`.ticker-item[data-sym="${k}"] .v`).dataset.p || '0');
    const dir = prev && p !== prev ? (p > prev ? 'up':'down') : 'flat';
    track.querySelectorAll(`.ticker-item[data-sym="${k}"]`).forEach(el=>{
      const v = el.querySelector('.v'); v.dataset.p = p;
      v.textContent = AI.market.fmt(p);
      v.className = 'v ' + dir;
      el.querySelector('.d').textContent = dir==='up' ? '▲' : dir==='down' ? '▼' : '';
    });
  };
  AI.market.onStatus((s)=>{
    const pill = host.querySelector('.ticker-live');
    if(!pill) return;
    pill.classList.remove('off','err');
    if(s==='live') pill.innerHTML = '<i></i>LIVE';
    else if(s==='syncing'||s==='idle') pill.innerHTML = '<i></i>SYNCING';
    else { pill.classList.add('err'); pill.innerHTML = '<i></i>OFFLINE'; }
  });
  AI.market.subscribe(keys, {onPrice: apply});
}

/* ── theme ── */
function initTheme(){
  let saved = null;
  try{ saved = localStorage.getItem('theai101-theme'); }catch(_e){}
  const theme = saved === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  syncThemeBtn();
}
function syncThemeBtn(){
  const btn = document.getElementById('themeToggle');
  if(btn) btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'light' ? MOON : SUN;
}
function toggleTheme(){
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try{ localStorage.setItem('theai101-theme', next); }catch(_e){}
  syncThemeBtn();
  if(AI.onThemeChange) AI.onThemeChange();
}

function inject(){
  document.body.insertAdjacentHTML('afterbegin', BG);
  const ticker = document.createElement('div');
  ticker.className = 'ticker'; ticker.id = 'aiTicker';
  ticker.innerHTML = `<div class="ticker-track"></div><div class="ticker-live"><i></i>SYNCING</div>`;
  document.body.prepend(ticker);
  const nav = document.createElement('nav');
  nav.innerHTML = NAV;
  document.body.prepend(nav);
  const path = location.pathname;
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const h = a.getAttribute('href');
    if(h.startsWith('http')) return;
    if(path === h || (h !== '/' && path.startsWith(h)) || (h==='/patterns/' && path.startsWith('/patterns')))
      a.classList.add('active');
  });
  const foot = document.createElement('footer');
  foot.innerHTML = FOOT;
  document.body.appendChild(foot);

  const tbtn = document.getElementById('themeToggle');
  tbtn.addEventListener('click', toggleTheme);
  syncThemeBtn();
  const mbtn = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  const mq = window.matchMedia('(max-width: 700px)');
  function syncMenu(){ mbtn.style.display = mq.matches ? 'grid' : 'none'; }
  syncMenu();
  if(mq.addEventListener) mq.addEventListener('change', syncMenu);
  mbtn.addEventListener('click', ()=>{
    const open = links.classList.toggle('open');
    mbtn.setAttribute('aria-expanded', open ? 'true':'false');
  });
}

function observe(){
  if(!('IntersectionObserver' in window)){
    document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:.1});
  document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));
}

function countUps(){
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1]||'').length;
    const t0 = performance.now(), dur = 1200;
    function tick(t){
      const k = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-k,3);
      el.textContent = (target*e).toFixed(dec);
      if(k<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ── analytics (Plausible, only when enabled in js/config.js) ── */
try{
  if(window.AI_CONFIG && window.AI_CONFIG.plausibleDomain){
    const s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', window.AI_CONFIG.plausibleDomain);
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
  }
}catch(_e){}

document.addEventListener('DOMContentLoaded', ()=>{
  initTheme();
  inject();
  observe();
  countUps();
  initTicker();
  if(AI.onReady) AI.onReady();
});
})();
