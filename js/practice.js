/* ═══════════════════════════════════════════════════════════════
   TheAI101 Live Practice — real market data, zero real money.
   Modes:
     1. Candle Calls — predict the next live candle (ticks aggregated
        into short practice candles, anchored to the real price feed)
     2. Pattern Hunt — algorithmically-verified candlestick patterns
        found in REAL exchange klines (ground truth from candle math)
     3. Trend or Range — classify the last 30 real candles
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const AI = window.AI = window.AI || {};
const $ = id => document.getElementById(id);
const STORE = 'theai101-practice-v1';

let stats = load();
let mode = 'calls';
let sym = 'BTC';
let bucketMs = 15000;

/* live candle state for the calls arena */
const live = {
  sub:null, candles:[], bucket:null, lastPrice:null, lastTickAt:0,
  prediction:null, timer:null, redrawQueued:false, seededWith:null
};

function load(){
  try{
    const raw = localStorage.getItem(STORE);
    if(raw) return Object.assign({calls:{a:0,r:0,s:0,b:0}, pattern:{a:0,r:0,s:0,b:0}, trend:{a:0,r:0,s:0,b:0}}, JSON.parse(raw));
  }catch(_e){}
  return {calls:{a:0,r:0,s:0,b:0}, pattern:{a:0,r:0,s:0,b:0}, trend:{a:0,r:0,s:0,b:0}};
}
function save(){ try{ localStorage.setItem(STORE, JSON.stringify(stats)); }catch(_e){} }
function shuffle(a){
  const x = a.slice();
  for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; }
  return x;
}
function record(k, ok, xp, msg){
  const s = stats[k];
  s.a++;
  if(ok){ s.r++; s.s++; s.b = Math.max(s.b, s.s); toast(`+${xp} XP · ${msg}`, 'bull'); burst(); }
  else { s.s = 0; toast(msg, 'bear'); }
  save(); updateHud();
  // shared XP pool into academy progression
  try{
    const A = JSON.parse(localStorage.getItem('theai101-academy-v2')||'null') || {xp:0,played:0,right:0,streak:0,best:0,done:{}};
    A.played = (A.played||0)+1;
    if(ok){ A.right=(A.right||0)+1; A.streak=(A.streak||0)+1; A.best=Math.max(A.best||0,A.streak); A.xp=(A.xp||0)+xp; }
    else A.streak = 0;
    localStorage.setItem('theai101-academy-v2', JSON.stringify(A));
  }catch(_e){}
}

/* ── toasts / bursts (same look as academy) ── */
function toast(msg, tone){
  const t = document.createElement('div');
  t.className = `arcade-toast ${tone||'neut'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(), 260); }, 2200);
}
function burst(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className='xp-burst';
  for(let i=0;i<14;i++){
    const s=document.createElement('i');
    s.style.setProperty('--x', `${Math.cos(i/14*Math.PI*2)*90}px`);
    s.style.setProperty('--y', `${Math.sin(i/14*Math.PI*2)*70}px`);
    s.style.setProperty('--d', `${i*18}ms`);
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(()=>box.remove(), 900);
}

/* ── status ── */
function setStatus(s){
  const el = $('liveStatus');
  if(!el) return;
  el.className = 'live-dot' + (s==='live'?'':s==='offline'?' err':' off');
  el.innerHTML = `<i></i>${s==='live'?'LIVE FEED':s==='offline'?'FEED OFFLINE':'SYNCING'}`;
}
AI.market.onStatus(setStatus);

/* ═══ MODE: candle calls ═════════════════════════════════════ */
async function seedCalls(){
  live.candles = []; live.bucket = null; live.prediction = null;
  try{
    const kl = await AI.market.klines(sym, '1m', 30);
    live.seededWith = kl[kl.length-1] ? kl[kl.length-1].t : null;
    live.candles = kl;
    drawCalls();
    $('callsErr').hidden = true;
  }catch(e){
    $('callsErr').hidden = false;
  }
}
function onTick(key, price){
  if(key !== sym) return;
  live.lastPrice = price; live.lastTickAt = Date.now();
  const now = Date.now();
  if(!live.bucket) live.bucket = {t0: now, o:price, h:price, l:price, c:price};
  const b = live.bucket;
  b.h = Math.max(b.h, price); b.l = Math.min(b.l, price); b.c = price;
  if(now - b.t0 >= bucketMs){
    live.candles.push({t:b.t0, o:b.o, h:b.h, l:b.l, c:b.c});
    gradeCall(b);
    live.candles = live.candles.slice(-40);
    live.bucket = {t0: now, o:price, h:price, l:price, c:price};
  }
  drawCalls();
}
function gradeCall(b){
  const dir = b.c >= b.o ? 'up':'down';
  const box = $('callsResult');
  if(!live.prediction){
    box.className = 'game-result';
    box.innerHTML = `No call locked — the candle closed <b>${dir.toUpperCase()}</b>. Lock a call before the close to score it.`;
    return;
  }
  const ok = live.prediction === dir;
  record('calls', ok, 40, ok?'Live call hit':'Live call missed');
  box.className = 'game-result ' + (ok?'ok':'bad');
  box.innerHTML = `${ok?'Correct call':'Missed call'} — candle closed <b>${dir.toUpperCase()}</b> (open ${AI.market.fmt(b.o)}, close ${AI.market.fmt(b.c)}).`;
  live.prediction = null;
  [...document.querySelectorAll('[data-dir]')].forEach(x=>x.classList.remove('selected'));
}
function drawCalls(){
  if(live.redrawQueued) return;
  live.redrawQueued = true;
  requestAnimationFrame(()=>{ live.redrawQueued = false; renderCalls(); });
}
function renderCalls(){
  const svg = $('callsChart'); if(!svg) return;
  const all = [...live.candles.slice(-28), ...(live.bucket?[live.bucket]:[])];
  if(!all.length) return;
  svg.innerHTML = '';
  const prices = all.flatMap(k=>[k.o,k.h,k.l,k.c]);
  let lo = Math.min(...prices), hi = Math.max(...prices);
  const padPx = (hi-lo)*0.12 || lo*0.0004;
  lo -= padPx; hi += padPx;
  const ctx = AI.add(svg, 720, 340, {l:16,r:96,t:20,b:16});
  ctx.scale(lo,hi); ctx.grid(7,4);
  ctx.title(`${sym}-USD · PRACTICE CANDLES · LIVE PRICE`, 'dim');
  const n = Math.max(20, all.length);
  all.forEach((k,i)=>ctx.candle(ctx.xat(i,n), k.o,k.h,k.l,k.c, undefined, {n}));
  if(live.bucket){
    const y = ctx.y2px(live.bucket.o);
    ctx.hline(y, 'dim', 'OPEN', true);
    const remain = Math.max(0, 1-(Date.now()-live.bucket.t0)/bucketMs);
    const fill = $('callsTimerFill');
    if(fill) fill.style.transform = `scaleX(${remain})`;
    const txt = $('callsTimer');
    if(txt) txt.textContent = `${Math.ceil((bucketMs-(Date.now()-live.bucket.t0))/1000)}s to close`;
    const p = $('callsPrice');
    if(p){ p.textContent = AI.market.fmt(live.bucket.c); p.className = live.bucket.c>=live.bucket.o?'up':'down'; }
  }
  const last = svg.querySelector('g.cndl:last-of-type');
  if(last) last.classList.add('hot-candle');
}
function startCalls(){
  stopStream();
  live.candles = []; live.bucket = null; live.prediction = null;
  renderCalls();
  seedCalls();
  live.sub = AI.market.subscribe([sym], {onPrice:(k,p)=>onTick(k,p)});
}
function stopStream(){ if(live.sub){ live.sub.close(); live.sub = null; } }

/* ═══ MODE: real pattern hunt ════════════════════════════════ */
const HUNT_NAMES = ['Bullish Engulfing','Bearish Engulfing','Hammer','Shooting Star','Doji','Morning Star','Evening Star','Tweezer Bottom','Tweezer Top','Three White Soldiers','Three Black Crows'];
let hunting = false;
async function hunt(){
  if(hunting) return;
  hunting = true;
  const symSel = $('huntSymbol').value, iv = $('huntInterval').value;
  const board = $('huntBoard');
  board.innerHTML = `<div class="panel" style="box-shadow:var(--shadow-sm)"><p class="lead">Scanning real ${symSel}-USD ${iv} candles for a clean pattern…</p></div>`;
  let found = null, candles = null, tries = 0;
  const plans = [[symSel,iv],[symSel, iv==='5m'?'15m':'5m'],[symSel==='BTC'?'ETH':symSel==='ETH'?'SOL':'BTC', iv]];
  while(!found && tries < plans.length){
    const [s,i] = plans[tries++];
    try{
      const kl = await AI.market.klines(s, i, 300);
      const m = AI.detect.findRecent(kl, 22);
      if(m && m.conf >= .6){ found = m; candles = kl; $('huntSymbol').value = s; $('huntInterval').value = i; }
    }catch(e){ break; }
  }
  hunting = false;
  if(!found){
    board.innerHTML = `<div class="panel" style="box-shadow:var(--shadow-sm)">
      <span class="badge">QUIET TAPE</span>
      <h3 style="margin:.5rem 0">No clean pattern in the recent window</h3>
      <p class="small">Real markets are mostly noise — that is normal and worth seeing. Scan again, or switch symbol/interval.</p>
      <button class="btn btn-primary btn-sm" style="margin-top:.7rem" onclick="document.getElementById('huntScan').click()">Scan again</button>
    </div>`;
    return;
  }
  renderHunt(candles, found, iv);
}
function renderHunt(kl, m, iv){
  const start = Math.max(0, m.i - 21);
  const seg = kl.slice(start, Math.min(kl.length, m.i+3));
  const offset = start;
  const board = $('huntBoard');
  board.innerHTML = `
    <div class="play-grid">
      <div class="chart-frame game-chart">
        <div class="game-toolbar"><span class="live-dot"><i></i>REAL DATA</span><span class="small dim">${$('huntSymbol').value}-USD · ${iv} candles · exchange feed</span></div>
        <svg id="huntChart" viewBox="0 0 720 340" role="img" aria-label="Real market pattern"></svg>
        <div class="cap">Last candles of a real chart — one pattern just completed.</div>
      </div>
      <div class="mission-card">
        <span class="badge">Pattern hunt · real data</span>
        <h3>Which pattern just completed?</h3>
        <p class="small">Verified by candle math on live exchange klines — a real answer, not a schematic.</p>
        <div class="choice-stack" data-choices></div>
        <div class="game-result" data-result>Read trend first, then the final candles.</div>
        <div class="ctrl"><button class="btn btn-ghost btn-sm" id="huntAgain">Scan another chart</button></div>
      </div>
    </div>`;
  const svg = board.querySelector('#huntChart');
  drawSeries(svg, seg, {
    title:`REAL CHART — PATTERN AT THE RIGHT EDGE`,
    hlIndex: m.i - offset
  });
  const pat = AI.candles.find(p=>p.name===m.name);
  const decoys = shuffle(HUNT_NAMES.filter(n=>n!==m.name)).slice(0,3).map(n=>AI.candles.find(p=>p.name===n)).filter(Boolean);
  const host = board.querySelector('[data-choices]');
  shuffle([pat, ...decoys]).forEach(o=>{
    const b = document.createElement('button');
    b.className = 'quiz-opt'; b.innerHTML = `${o.name} <span class="dim">· ${o.bias}</span>`;
    b.addEventListener('click',()=>{
      const ok = o.name === m.name;
      [...host.children].forEach(x=>{ x.disabled = true; if(x.textContent.startsWith(m.name)) x.classList.add('correct'); else if(x===b&&!ok) x.classList.add('wrong'); });
      const r = board.querySelector('[data-result]');
      r.className = 'game-result ' + (ok?'ok':'bad');
      r.innerHTML = `${ok?'Spotted in the wild':'It was'} <b>${m.name}</b> — confidence ${Math.round(m.conf*100)}%. ${pat.see} <span class="dim">${pat.means}</span>`;
      if(ok){ drawSeries(svg, seg, {title:'REAL CHART — PATTERN MARKED', hlIndex:m.i-offset, mark:true}); }
      record('pattern', ok, 60, ok?'Real pattern spotted':'Real pattern missed');
    });
    host.appendChild(b);
  });
  board.querySelector('#huntAgain').addEventListener('click', hunt);
}
function drawSeries(svg, candles, opts){
  opts = opts||{};
  svg.innerHTML = '';
  const lo = Math.min(...candles.map(k=>k.l)), hi = Math.max(...candles.map(k=>k.h));
  const padPx = (hi-lo)*0.1 || hi*0.0005;
  const ctx = AI.add(svg, 720, 340, {l:16,r:100,t:20,b:16});
  ctx.scale(lo-padPx, hi+padPx); ctx.grid(7,4);
  ctx.title(opts.title||'REAL CANDLES','dim');
  const n = candles.length;
  candles.forEach((k,i)=>{
    const hot = opts.hlIndex!=null && i >= opts.hlIndex;
    ctx.candle(ctx.xat(i,n), k.o,k.h,k.l,k.c, undefined, {n, op: hot?1:.78, force: opts.mark&&i>=opts.hlIndex?'accent':undefined});
  });
  if(opts.mark && opts.hlIndex!=null){
    const x1 = ctx.xat(Math.max(0,opts.hlIndex-1), n) - (ctx.W-ctx.pad.l-ctx.pad.r)/n/2;
    const x2 = ctx.W - ctx.pad.r + 26;
    ctx.zone(x1, x2, 'accent', .12);
    ctx.label(ctx.xat(opts.hlIndex, n), ctx.pad.t+10, opts.title.includes('MARKED')?'PATTERN':'', 'accent');
  }
  AI.animate(svg, 26);
}

/* ═══ MODE: trend or range ═══════════════════════════════════ */
async function trendDrill(){
  const symSel = $('trendSymbol').value, iv = $('trendInterval').value;
  const board = $('trendBoard');
  board.innerHTML = `<div class="panel" style="box-shadow:var(--shadow-sm)"><p class="lead">Pulling the last 30 real ${symSel}-USD ${iv} candles…</p></div>`;
  let kl;
  try{ kl = await AI.market.klines(symSel, iv, 60); }
  catch(e){
    board.innerHTML = `<div class="panel"><span class="badge">FEED ERROR</span><p class="small">Could not reach the market data feed. It may be blocked on this network — try again shortly.</p></div>`;
    return;
  }
  const verdict = AI.detect.classify(kl);
  const seg = kl.slice(-30);
  const score = AI.detect.trendScore(kl);
  const boardHTML = `
    <div class="play-grid">
      <div class="chart-frame game-chart">
        <div class="live-dot"><i></i>REAL DATA</div>
        <svg id="trendChart" viewBox="0 0 720 340" role="img" aria-label="Real market trend"></svg>
        <div class="cap">The last 30 real candles. Classify the regime.</div>
      </div>
      <div class="mission-card">
        <span class="badge">Trend or range</span>
        <h3>What regime is this market in?</h3>
        <p class="small">Ask: are highs and lows stepping (trend) or bouncing between walls (range)?</p>
        <div class="choice-stack" data-choices></div>
        <div class="game-result" data-result>Make the call before revealing.</div>
        <div class="ctrl"><button class="btn btn-ghost btn-sm" id="trendAgain">Draw a new chart</button></div>
      </div>
    </div>`;
  board.innerHTML = boardHTML;
  drawSeries(board.querySelector('#trendChart'), seg, {title:'LAST 30 REAL CANDLES'});
  const host = board.querySelector('[data-choices]');
  ['Uptrend','Downtrend','Range'].forEach(ch=>{
    const b = document.createElement('button');
    b.className = 'quiz-opt'; b.textContent = ch;
    b.addEventListener('click',()=>{
      const ok = ch === verdict;
      [...host.children].forEach(x=>{ x.disabled = true; if(x.textContent===verdict) x.classList.add('correct'); else if(x===b&&!ok) x.classList.add('wrong'); });
      const r = board.querySelector('[data-result]');
      r.className = 'game-result ' + (ok?'ok':'bad');
      r.innerHTML = `${ok?'Clean read':'The tape said'} <b>${verdict}</b>. Net move over the window: ${score>0?'+':''}${score.toFixed(1)} average-candle ranges. ${verdict==='Range'?'Path efficiency was low: most movement backtracked on itself.':'Directional efficiency was high: the move kept its gains.'}`;
      record('trend', ok, 40, ok?'Regime read correctly':'Regime read missed');
    });
    host.appendChild(b);
  });
  board.querySelector('#trendAgain').addEventListener('click', trendDrill);
}

/* ═══ HUD ════════════════════════════════════════════════════ */
function updateHud(){
  const s = stats[mode] || {a:0,r:0,s:0,b:0};
  if($('hudRounds')) $('hudRounds').textContent = s.a;
  if($('hudAcc')) $('hudAcc').textContent = s.a? Math.round(s.r/s.a*100)+'%':'—';
  if($('hudStreak')) $('hudStreak').textContent = s.s;
  if($('hudBest')) $('hudBest').textContent = s.b;
}
function switchMode(m){
  mode = m;
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on', b.dataset.mode===m));
  $('callsPanel').hidden = m!=='calls';
  $('patternPanel').hidden = m!=='pattern';
  $('trendPanel').hidden = m!=='trend';
  if(m==='calls' && !live.sub) startCalls();
  updateHud();
}

/* ═══ boot ═══════════════════════════════════════════════════ */
function fillSelect(id){
  const sel = $(id);
  if(!sel || sel.options.length) return;
  AI.market.symbols.forEach(s=>{
    const o = document.createElement('option');
    o.value = s.key; o.textContent = `${s.key} · ${s.label}`;
    sel.appendChild(o);
  });
}
AI.onReady = function(){
  fillSelect('huntSymbol'); fillSelect('trendSymbol');
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>switchMode(b.dataset.mode)));
  document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>{
    if(!live.bucket || live.prediction) return;
    live.prediction = b.dataset.dir;
    [...document.querySelectorAll('[data-dir]')].forEach(x=>x.classList.toggle('selected', x===b));
    const box = $('callsResult');
    box.className = 'game-result ok';
    box.textContent = `Locked ${b.dataset.dir.toUpperCase()}. The call scores when this candle closes.`;
  }));
  document.querySelectorAll('[data-csym]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-csym]').forEach(x=>x.classList.toggle('on', x===b));
    sym = b.dataset.csym;
    startCalls();
  }));
  document.querySelectorAll('[data-civ]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-civ]').forEach(x=>x.classList.toggle('on', x===b));
    bucketMs = parseInt(b.dataset.civ,10)*1000;
    startCalls();
  }));
  $('huntScan').addEventListener('click', hunt);
  $('trendGo').addEventListener('click', trendDrill);
  live.timer = setInterval(()=>{ if(mode==='calls') renderCalls(); }, 1000);
  AI.themeHooks.push(()=>{ if(mode==='calls') renderCalls(); });
  switchMode('calls');
};
window.addEventListener('beforeunload', stopStream);
})();
