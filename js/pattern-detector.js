/* ═══════════════════════════════════════════════════════════════
   TheAI101 pattern detector — finds textbook candlestick patterns
   algorithmically in real OHLC data, so live practice rounds have
   verifiable ground truth. Pure candle math, no libraries.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const AI = window.AI = window.AI || {};
const D = AI.detect = {};

function body(k){ return Math.abs(k.c-k.o); }
function range(k){ return Math.max(1e-12, k.h-k.l); }
function upperW(k){ return k.h - Math.max(k.o,k.c); }
function lowerW(k){ return Math.min(k.o,k.c) - k.l; }
function isGreen(k){ return k.c >= k.o; }

function avgBody(cs, end, n){
  let s=0, c=0;
  for(let i=Math.max(0,end-n); i<end; i++){ s+=body(cs[i]); c++; }
  return c? s/c : 0;
}
function avgRange(cs, end, n){
  let s=0, c=0;
  for(let i=Math.max(0,end-n); i<end; i++){ s+=range(cs[i]); c++; }
  return c? s/c : 1e-12;
}
/* trend context: net move over `n` closes measured in average ranges */
function trend(cs, end, n){
  const a = avgRange(cs, end, 10);
  const i0 = Math.max(0, end-n);
  return (cs[end-1].c - cs[i0].c) / a;   // >0 up, <0 down
}

/* returns a match or null at index i (pattern terminates at i) */
function matchAt(cs, i){
  const k = cs[i], p = cs[i-1], p2 = cs[i-2];
  if(!k || !p) return null;
  const ab = avgBody(cs, i, 10), ar = avgRange(cs, i, 10);
  const b = body(k), r = range(k), uw = upperW(k), lw = lowerW(k);
  const upCtx = trend(cs, i, 6) >= 1.0;    // recent advance
  const dnCtx = trend(cs, i, 6) <= -1.0;   // recent decline
  const out = [];

  // Doji — indecision (no trend requirement)
  if(b <= r*0.08 && r >= ar*0.5)
    out.push({name:'Doji', bias:'Neutral', conf:.62});

  // Hammer — long lower wick rejecting a decline
  if(dnCtx && b>0 && lw >= b*2 && uw <= b*0.9 && b <= r*0.38)
    out.push({name:'Hammer', bias:'Bullish', conf:Math.min(.95, .6 + lw/r*.3)});

  // Shooting star — long upper wick rejecting a rally
  if(upCtx && b>0 && uw >= b*2 && lw <= b*0.9 && b <= r*0.38)
    out.push({name:'Shooting Star', bias:'Bearish', conf:Math.min(.95, .6 + uw/r*.3)});

  // Engulfing — current body swallows prior body, opposite colors
  if(b > ab*0.9){
    if(!isGreen(p) && isGreen(k) && k.c >= p.o && k.o <= p.c && b > body(p))
      out.push({name:'Bullish Engulfing', bias:'Bullish', conf:Math.min(.95, .62 + b/Math.max(body(p),1e-9)*.12)});
    if(isGreen(p) && !isGreen(k) && k.c <= p.o && k.o >= p.c && b > body(p))
      out.push({name:'Bearish Engulfing', bias:'Bearish', conf:Math.min(.95, .62 + b/Math.max(body(p),1e-9)*.12)});
  }

  // Morning / Evening star — strong reversal, small pause, strong confirmation
  if(p2){
    const bmid = body(p), b3 = body(k);
    if(!isGreen(p2) && isGreen(k) && bmid < ab*0.7 && b3 > ab &&
       k.c > (p2.o+p2.c)/2 && dnCtx)
      out.push({name:'Morning Star', bias:'Bullish', conf:.8});
    if(isGreen(p2) && !isGreen(k) && bmid < ab*0.7 && b3 > ab &&
       k.c < (p2.o+p2.c)/2 && upCtx)
      out.push({name:'Evening Star', bias:'Bearish', conf:.8});
  }

  // Tweezers — matching extreme on adjacent candles
  if(Math.abs(k.l - p.l) <= ar*0.12 && !isGreen(p) && isGreen(k) && dnCtx)
    out.push({name:'Tweezer Bottom', bias:'Bullish', conf:.7});
  if(Math.abs(k.h - p.h) <= ar*0.12 && isGreen(p) && !isGreen(k) && upCtx)
    out.push({name:'Tweezer Top', bias:'Bearish', conf:.7});

  // Three soldiers / crows — stair-step momentum ending a move
  if(i>=3){
    const a1=cs[i-2], a2=cs[i-1], a3=k;
    if(isGreen(a1)&&isGreen(a2)&&isGreen(a3) && a3.c>a2.c && a2.c>a1.c && dnCtx &&
       body(a1)>ab*0.8 && body(a2)>ab*0.8 && body(a3)>ab*0.8)
      out.push({name:'Three White Soldiers', bias:'Bullish', conf:.78});
    if(!isGreen(a1)&&!isGreen(a2)&&!isGreen(a3) && a3.c<a2.c && a2.c<a1.c && upCtx &&
       body(a1)>ab*0.8 && body(a2)>ab*0.8 && body(a3)>ab*0.8)
      out.push({name:'Three Black Crows', bias:'Bearish', conf:.78});
  }

  if(!out.length) return null;
  out.sort((x,y)=>y.conf-x.conf);
  const best = out[0];
  return Object.assign({i}, best);
}

/* scan a full series; returns all matches */
D.scan = function(cs){
  const out = [];
  for(let i=3; i<cs.length; i++){
    const m = matchAt(cs, i);
    if(m) out.push(m);
  }
  return out;
};

/* strongest high-confidence match inside the last `within` candles */
D.findRecent = function(cs, within){
  const start = Math.max(3, cs.length - (within||15));
  let best = null;
  for(let i=start; i<cs.length; i++){
    const m = matchAt(cs, i);
    if(m && (!best || m.conf > best.conf)) best = m;
  }
  return best;
};

/* trend-or-range classification for the live drill */
D.classify = function(cs){
  const n = Math.min(30, cs.length);
  const seg = cs.slice(-n);
  const ar = avgRange(cs, cs.length, 14) || 1e-12;
  const move = (seg[seg.length-1].c - seg[0].c) / ar;
  // chop: how much of the path is backtracking
  let path = 0;
  for(let i=1;i<seg.length;i++) path += Math.abs(seg[i].c - seg[i-1].c);
  const net = Math.abs(move);
  const efficiency = path>0 ? net*ar/path : 0;
  if(efficiency < .32) return 'Range';
  return move > 0 ? 'Uptrend' : 'Downtrend';
};

D.trendScore = function(cs){ return trend(cs, cs.length, 10); };
})();
