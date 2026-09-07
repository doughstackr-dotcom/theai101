/* ═══════════════════════════════════════════════════════════════
   TheAI101 lesson pages — chart enhancer.
   Static lesson pages (academy/lesson/<id>/) embed their chart spec
   as <svg data-chart='{json}'>; this script draws them with the
   /js/candles.js engine, mirroring the academy.js renderers
   (drawArr / drawPat / drawZig / drawAnatomy).
   Content is fully readable without JS — this only adds the visuals.
   Requires: js/candles.js and js/patterns-data.js loaded first.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const AI = window.AI = window.AI || {};

/* the engine has no ctx.label — small local SVG-text helper */
function label(ctx, x, y, txt, tone){
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', x); t.setAttribute('y', y);
  t.setAttribute('fill', ctx.col ? ctx.col(tone || 'ink') : 'currentColor');
  t.setAttribute('font-size', '10');
  t.setAttribute('font-weight', '700');
  t.setAttribute('font-family', 'JetBrains Mono,Consolas,monospace');
  t.setAttribute('text-anchor', 'middle');
  t.textContent = txt;
  ctx.el.appendChild(t);
}

/* {arr:[[o,h,l,c],...], title?, lines?:[{y,label,color?}], gap?} */
function drawArr(svg, c){
  const W = 560, H = 240, pad = {l:16, r:52, t:20, b:14};
  svg.innerHTML = '';
  const ctx = AI.add(svg, W, H, pad);
  ctx.scale(0, 100); ctx.grid(6, 4);
  if(c.title) ctx.title(c.title, 'dim');
  const n = c.arr.length;
  c.arr.forEach((k,i)=>ctx.candle(ctx.xat(i,n), k[0], k[1], k[2], k[3], undefined, {n}));
  (c.lines||[]).forEach(l=>ctx.hline(ctx.y2px(l.y), l.color||'accent', l.label||'', true));
  AI.animate(svg, c.gap != null ? c.gap : 110);
}

/* {pat:'Hammer'} — candlestick pattern from AI.candles */
function drawPat(svg, name){
  const pat = (AI.candles||[]).find(p=>p.name===name);
  if(!pat) return;
  const W = 560, H = 240, pad = {l:16, r:52, t:20, b:14};
  svg.innerHTML = '';
  const ctx = AI.add(svg, W, H, pad);
  ctx.scale(0, 100); ctx.grid(6, 4); ctx.title(pat.name.toUpperCase(), 'dim');
  pat.draw(ctx, W, H, pad);
  AI.animate(svg, 110);
}

/* {zig:'Bull Flag'} — chart pattern from AI.chartPatterns */
function drawZig(svg, name){
  const pat = (AI.chartPatterns||[]).find(p=>p.name===name);
  if(!pat) return;
  const W = 560, H = 240;
  svg.innerHTML = '';
  const ctx = AI.add(svg, W, H, {l:16, r:16, t:20, b:14});
  AI.drawChartPattern(ctx, W, H, pat);
  const path = svg.querySelector('path');
  if(path && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    path.style.transition = 'stroke-dashoffset 1.1s var(--ease)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ path.style.strokeDashoffset = 0; }));
  }
}

/* {fn:'anatomy'} — labeled single candle (mirrors academy.js drawAnatomy) */
function drawAnatomy(svg){
  const W = 560, H = 240, pad = {l:16, r:120, t:30, b:16};
  svg.innerHTML = '';
  const ctx = AI.add(svg, W, H, pad);
  ctx.scale(0, 100); ctx.grid(4, 4);
  const x = ctx.xat(1, 2);
  /* faint context candles */
  [{o:64,h:68,l:58,c:61},{o:61,h:64,l:52,c:55}].forEach((k,i)=>ctx.candle(ctx.xat(i,4), k.o,k.h,k.l,k.c, undefined, {n:4, op:.35}));
  ctx.candle(x, 42, 84, 16, 70, 46, {});
  ctx.hline(ctx.y2px(84), 'accent', 'HIGH', true);
  ctx.hline(ctx.y2px(16), 'accent', 'LOW', true);
  ctx.hline(ctx.y2px(42), 'dim', 'OPEN', true);
  ctx.hline(ctx.y2px(70), 'up', 'CLOSE', true);
  label(ctx, x, ctx.y2px(56) + 4, 'BODY', 'ink');
  label(ctx, x, ctx.y2px(92), 'UPPER WICK', 'ink');
  label(ctx, x, ctx.y2px(9), 'LOWER WICK', 'ink');
}

function drawSpec(svg, c){
  if(!c) return;
  try{
    if(c.fn === 'anatomy') return drawAnatomy(svg);
    if(c.pat) return drawPat(svg, c.pat);
    if(c.zig) return drawZig(svg, c.zig);
    if(c.arr) return drawArr(svg, c);
  }catch(_e){ /* a chart must never break the page */ }
}

function renderAll(){
  if(!AI.add) return; // candles.js missing — stay silent, content is static
  document.querySelectorAll('svg[data-chart]').forEach(svg=>{
    let spec;
    try{ spec = JSON.parse(svg.getAttribute('data-chart')); }
    catch(_e){ return; }
    drawSpec(svg, spec);
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', renderAll);
}else{
  renderAll();
}
})();
