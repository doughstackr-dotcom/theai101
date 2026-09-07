/* TheAI101 shared app: ambient glass background + nav/footer + reveal animations */
(function(){
'use strict';
const AI = window.AI = window.AI || {};

const NAV = `
<div class="nav-inner">
  <a class="logo" href="/"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="2" y="6" width="4" height="7" rx="1" fill="#ef4444"/><line x1="4" y1="2" x2="4" y2="15" stroke="#ef4444" stroke-width="1.4"/><rect x="11" y="3" width="4" height="8" rx="1" fill="#22c55e"/><line x1="13" y1="1" x2="13" y2="16" stroke="#22c55e" stroke-width="1.4"/></svg>TheAI<span class="tick">101</span></a>
  <div class="links">
    <a href="/candles/anatomy.html" data-nav="anatomy">Anatomy</a>
    <a href="/candles/patterns.html" data-nav="patterns">Candle Patterns</a>
    <a href="/patterns/" data-nav="chartp">Chart Patterns</a>
    <a href="/candles/practice.html" data-nav="practice">Practice</a>
    <a href="/markets/" data-nav="markets">Markets</a>
    <a href="/shop.html" data-nav="shop">Shop</a>
  </div>
  <a class="cta" href="/shop.html">Get the Desk Mat</a>
</div>`;

const FOOT = `
<div class="foot-inner">
  <div>TheAI101 — learn the charts, wear the charts.</div>
  <div><a href="/markets/">Markets</a> · <a href="/candles/patterns.html">Patterns</a> · <a href="/shop.html">Shop</a> · <a href="/about.html">About</a></div>
  <div>Educational content only — not financial advice.</div>
</div>`;

const BG = `
<div class="ai-bg" aria-hidden="true">
  <div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div><div class="orb o4"></div>
  <div class="ai-grid"></div>
</div>`;

function inject(){
  document.body.insertAdjacentHTML('afterbegin', BG);
  const nav = document.createElement('nav');
  nav.innerHTML = NAV;
  document.body.prepend(nav);
  const path = location.pathname;
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const h = a.getAttribute('href');
    if(path === h || (h !== '/' && path.startsWith(h)) || (h==='/patterns/' && path.startsWith('/patterns')))
      a.classList.add('active');
  });
  if(path === '/' ) document.querySelector('[data-nav="anatomy"]').classList.remove('active');
  const foot = document.createElement('footer');
  foot.innerHTML = FOOT;
  document.body.appendChild(foot);
}

function observe(){
  if(!('IntersectionObserver' in window)){
    document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:.12});
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

document.addEventListener('DOMContentLoaded', ()=>{
  inject();
  observe();
  countUps();
  if(AI.onReady) AI.onReady();
});
})();
