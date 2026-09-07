/* ═══════════════════════════════════════════════════════════════
   TheAI101 chart engine v2 — zero dependencies, pure SVG, theme-aware.
   Same public API as v1 (AI.add / ctx.candle / ctx.xat / pat.draw …),
   plus: theme palette resolution, zones, volume, animated reveals.
   Legacy hard-coded colors are translated to the current theme.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const AI = window.AI = window.AI || {};
AI.charts = [];

/* ── theme palette ─────────────────────────────────── */
const LEGACY = {
  '#22c55e':'--green-hi', '#16a34a':'--green', '#ef4444':'--red', '#dc2626':'--red',
  '#22d3ee':'--blue', '#0891b2':'--blue', '#f59e0b':'--yellow', '#d97706':'--yellow',
  '#a78bfa':'--accent', '#7c3aed':'--accent', '#94a3b8':'--ink-3', '#64748b':'--ink-3',
  '#e2e8f0':'--ink-2', '#334155':'--ink-2'
};
function resolve(name){
  if(!name) return getVar('--ink');
  const key = String(name).toLowerCase();
  if(LEGACY[key]) return getVar(LEGACY[key]);
  if(key==='up') return getVar('--green-hi');
  if(key==='down') return getVar('--red-hi');
  if(key==='accent') return getVar('--accent');
  if(key==='dim') return getVar('--ink-3');
  if(key==='ink') return getVar('--ink');
  return name;
}
function getVar(v){
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888';
}

AI.add = function(sel, W, H, pad){
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if(!el) throw new Error('chart not found: '+sel);
  pad = pad || {l:14, r:56, t:16, b:14};
  const ctx = {
    el, W, H, pad,
    y2px:null,
    col:resolve,
    scale:(lo,hi)=>{
      const innerH = H-pad.t-pad.b;
      ctx.y2px = p => pad.t + (hi-p)/(hi-lo)*innerH;
      return ctx.y2px;
    },
    xat:(i,n)=>{
      const innerW = W-pad.l-pad.r;
      return pad.l + (i+0.5)*(innerW/n);
    },
    title(txt, color){
      const t = mk('text',{x:pad.l, y:pad.t-3, fill:resolve(color||'dim'), 'font-size':10.5,
        'font-weight':700, 'letter-spacing':'.08em',
        'font-family':"JetBrains Mono,Consolas,monospace"});
      t.textContent = txt; el.appendChild(t);
    },
    candle(x, o,h,l,c, w, opts){
      opts = opts||{};
      const up = c>=o, col = opts.force ? resolve(opts.force) : getVar(up?'--green-hi':'--red');
      const yO=ctx.y2px(o), yC=ctx.y2px(c), yH=ctx.y2px(h), yL=ctx.y2px(l);
      const bodyTop=Math.min(yO,yC), bodyH=Math.max(1.5,Math.abs(yO-yC));
      const g = mk('g',{class:'cndl'});
      g.appendChild(mk('line',{x1:x,y1:yH,x2:x,y2:bodyTop,stroke:col,'stroke-width':1.6,'stroke-linecap':'round'}));
      g.appendChild(mk('line',{x1:x,y1:bodyTop+bodyH,x2:x,y2:yL,stroke:col,'stroke-width':1.6,'stroke-linecap':'round'}));
      const bw = w||Math.max(6, (W-pad.l-pad.r)/(opts.n||20)*0.62);
      g.appendChild(mk('rect',{x:x-bw/2, y:bodyTop, width:bw, height:bodyH, rx:2,
        fill: opts.hollow? 'none':col, stroke: resolve('--ink'), 'stroke-width':1.4, opacity:opts.op!=null?opts.op:1}));
      el.appendChild(g);
      return g;
    },
    line(x1,y1,x2,y2, color, dash, w){
      const l = mk('line',{x1,y1,x2,y2, stroke:resolve(color||'accent'),'stroke-width':w||1.8,'stroke-linecap':'round'});
      if(dash) l.setAttribute('stroke-dasharray',dash);
      el.appendChild(l); return l;
    },
    zigzag(pts, color){
      const d = pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
      el.appendChild(mk('path',{d, fill:'none', stroke:resolve(color||'accent'),'stroke-width':2,'stroke-linejoin':'round','stroke-linecap':'round'}));
    },
    hline(y, color, label, dash){
      const l = mk('line',{x1:pad.l, y1:y, x2:W-pad.r+30, y2:y, stroke:resolve(color||'accent'),'stroke-width':1.6});
      if(dash) l.setAttribute('stroke-dasharray','5 4');
      el.appendChild(l);
      if(label){
        const t = mk('text',{x:W-pad.r+36, y:y+3.5, fill:resolve(color||'accent'), 'font-size':9.5,
          'font-weight':700,
          'font-family':"JetBrains Mono,Consolas,monospace"});
        t.textContent = label; el.appendChild(t);
      }
    },
    priceRight(y, txt, color){ ctx.hline(y, color, txt); },
    zone(x1, x2, color, opacity){
      el.appendChild(mk('rect',{x:x1, y:pad.t, width:Math.max(0,x2-x1), height:H-pad.t-pad.b,
        fill:resolve(color||'accent'), opacity:opacity!=null?opacity:.08}));
    },
    grid(nx, ny){
      nx=nx||6; ny=ny||4;
      const innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
      for(let i=0;i<=nx;i++){
        const x=pad.l+i*innerW/nx;
        el.appendChild(mk('line',{x1:x,y1:pad.t,x2:x,y2:H-pad.b,stroke:getVar('--line'),'stroke-width':1}));
      }
      for(let j=0;j<=ny;j++){
        const y=pad.t+j*innerH/ny;
        el.appendChild(mk('line',{x1:pad.l,y1:y,x2:W-pad.r,y2:y,stroke:getVar('--line'),'stroke-width':1}));
      }
    }
  };
  const existing = AI.charts.findIndex(c=>c.el===el);
  if(existing>=0) AI.charts.splice(existing,1);
  AI.charts.push({id:sel, el, ctx});
  if(AI.charts.length>60) AI.charts.splice(0, AI.charts.length-60);
  return ctx;
};

/* staggered candle reveal; respects reduced motion */
AI.animate = function(svg, gap){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  [...svg.querySelectorAll('g.cndl')].forEach((g,i)=>{
    g.style.opacity = '0';
    g.style.transform = 'translateY(10px) scale(.95)';
    g.style.transformOrigin = 'center bottom';
    g.style.transition = `opacity .24s var(--ease) ${i*gap}ms, transform .24s var(--ease) ${i*gap}ms`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ g.style.opacity='1'; g.style.transform='translateY(0) scale(1)'; }));
  });
};

/* Deterministic OHLC walk for "noise" candles around a trend */
AI.gen = function(seed, n, lo, hi, drift){
  let s = seed>>>0 || 42;
  const rnd = ()=> (s = (s*1664525+1013904223)>>>0) / 4294967296;
  const out=[]; let p = lo + (hi-lo)*(0.3+0.4*rnd());
  for(let i=0;i<n;i++){
    p += drift!==undefined? drift : (hi-lo)*(rnd()-0.5)*0.22;
    p = Math.max(lo, Math.min(hi, p));
    const o = p + (hi-lo)*(rnd()-0.5)*0.1;
    const c = p + (hi-lo)*(rnd()-0.5)*0.16;
    const h = Math.max(o,c) + (hi-lo)*rnd()*0.1;
    const l = Math.min(o,c) - (hi-lo)*rnd()*0.1;
    out.push({o,h,l,c});
  }
  return out;
};

/* re-render hook: modules register to redraw on theme change */
AI.themeHooks = [];
AI.onThemeChange = function(){ AI.themeHooks.forEach(fn=>{ try{fn();}catch(_e){} }); };

AI.renderAll = function(){ if(AI.onReady) AI.onReady(); };

function mk(tag, attrs){
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
})();
