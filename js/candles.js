/* TheAI101 candle engine — zero dependencies, pure SVG
   El: window.AI.charts = [{id, el, W, H, pad}]
   Exposed: AI.add(id) → ctx with candle(), line(), zigzag(), label(), priceRight(), title() */
(function(){
'use strict';
const AI = window.AI = window.AI || {};
AI.charts = [];

AI.add = function(sel, W, H, pad){
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if(!el) throw new Error('chart not found: '+sel);
  pad = pad || {l:14, r:56, t:16, b:14};
  const ctx = {
    el, W, H, pad,
    y2px:null,
    scale:(lo,hi)=>{ // map price domain to pixel mapper (top=high)
      const innerH = H-pad.t-pad.b;
      ctx.y2px = p => pad.t + (hi-p)/(hi-lo)*innerH;
      return ctx.y2px;
    },
    xat:(i,n)=>{ // x pixel for index i of n candles (priceRight space reserved)
      const innerW = W-pad.l-pad.r;
      return pad.l + (i+0.5)*(innerW/n);
    },
    title(txt, color){
      const t = mk('text',{x:pad.l, y:pad.t-2, fill:color||'#94a3b8', 'font-size':11,
        'font-family':'JetBrains Mono,Consolas,monospace'});
      t.textContent = txt; el.appendChild(t);
    },
    candle(x, o,h,l,c, w, opts){
      opts = opts||{};
      const up = c>=o, col = opts.force || (up? '#22c55e':'#ef4444');
      const yO=ctx.y2px(o), yC=ctx.y2px(c), yH=ctx.y2px(h), yL=ctx.y2px(l);
      const bodyTop=Math.min(yO,yC), bodyH=Math.max(1.5,Math.abs(yO-yC));
      const g = mk('g',{class:'cndl'});
      g.appendChild(mk('line',{x1:x,y1:yH,x2:x,y2:bodyTop,stroke:col,'stroke-width':1.4}));
      g.appendChild(mk('line',{x1:x,y1:bodyTop+bodyH,x2:x,y2:yL,stroke:col,'stroke-width':1.4}));
      const bw = w||Math.max(6, (W-pad.l-pad.r)/ (opts.n||20) *0.62);
      g.appendChild(mk('rect',{x:x-bw/2, y:bodyTop, width:bw, height:bodyH, rx:1.5,
        fill: opts.hollow? 'none':col, stroke:col, 'stroke-width':1.4, opacity:opts.op!=null?opts.op:1}));
      el.appendChild(g);
      return g;
    },
    line(x1,y1,x2,y2, color, dash, w){
      const l = mk('line',{x1,y1,x2,y2, stroke:color||'#22d3ee','stroke-width':w||1.6});
      if(dash) l.setAttribute('stroke-dasharray',dash);
      el.appendChild(l); return l;
    },
    zigzag(pts, color){
      const d = pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
      el.appendChild(mk('path',{d, fill:'none', stroke:color||'#a78bfa','stroke-width':1.6,'stroke-linejoin':'round'}));
    },
    hline(y, color, label, dash){
      const l = mk('line',{x1:pad.l, y1:y, x2:W-pad.r+30, y2:y, stroke:color,'stroke-width':1.3});
      if(dash) l.setAttribute('stroke-dasharray','5 4');
      el.appendChild(l);
      if(label){
        const t = mk('text',{x:W-pad.r+36, y:y+3.5, fill:color, 'font-size':10,
          'font-family':'JetBrains Mono,Consolas,monospace'});
        t.textContent = label; el.appendChild(t);
      }
    },
    label(x,y,txt,color,anchor){
      const t = mk('text',{x,y, fill:color||'#94a3b8','font-size':10.5,
        'font-family':'JetBrains Mono,Consolas,monospace','text-anchor':anchor||'middle'});
      t.textContent = txt; el.appendChild(t); return t;
    },
    priceRight(y, txt, color){
      ctx.hline(y, color, txt);
    },
    grid(nx, ny){
      nx=nx||6; ny=ny||4;
      const innerW=W-pad.l-pad.r, innerH=H-pad.t-pad.b;
      for(let i=0;i<=nx;i++){
        const x=pad.l+i*innerW/nx;
        el.appendChild(mk('line',{x1:x,y1:pad.t,x2:x,y2:H-pad.b,stroke:'#141c2c','stroke-width':1}));
      }
      for(let j=0;j<=ny;j++){
        const y=pad.t+j*innerH/ny;
        el.appendChild(mk('line',{x1:pad.l,y1:y,x2:W-pad.r,y2:y,stroke:'#141c2c','stroke-width':1}));
      }
    }
  };
  AI.charts.push({id:sel, el, ctx});
  return ctx;
};

// Deterministic OHLC walk for "noise" candles around a trend
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

AI.renderAll = function(){ if(AI.onReady) AI.onReady(); };

function mk(tag, attrs){
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
})();
