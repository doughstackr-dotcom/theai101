/* ═══════════════════════════════════════════════════════════════
   TheAI101 Academy — the learning path.
   7 units of visual lessons, each ending in a check; boss games
   between units; XP, streaks, and a free-play arcade. Zero deps.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const AI = window.AI = window.AI || {};
const $ = id => document.getElementById(id);
const STORE = 'theai101-academy-v2';
const RANKS = ['Candle Rookie','Pattern Scout','Chart Reader','Trap Spotter','Risk Keeper','Live Reader','Arena Master'];
const PROG_DEFAULTS = {xp:0, played:0, right:0, streak:0, best:0, done:{}, missed:[], mastery:{}};

let prog = load();
let current = null;            // open lesson id
let bossState = null;          // active boss run
let freeGame = null;           // free-play game id
const themeFns = [];

function load(){
  let p = null;
  try{
    const raw = localStorage.getItem(STORE);
    if(raw) p = JSON.parse(raw);
  }catch(_e){ p = null; }
  // fresh containers every time so defaults are never aliased
  return Object.assign({}, PROG_DEFAULTS, p||{}, {
    done: Object.assign({}, (p&&p.done)||{}),
    missed: Array.isArray(p&&p.missed) ? p.missed : [],
    mastery: Object.assign({}, (p&&p.mastery)||{})
  });
}
function save(){ try{ localStorage.setItem(STORE, JSON.stringify(prog)); }catch(_e){} }

/* ── wrong-answer review queue + day streak ────────── */
function dayKey(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function bumpDayStreak(){
  const today = dayKey(new Date());
  const ds = prog.dayStreak;
  if(ds && ds.last === today) return; // already counted today
  const yesterday = dayKey(new Date(Date.now()-86400000));
  if(ds && ds.last === yesterday) prog.dayStreak = {last:today, count:(ds.count||0)+1};
  else prog.dayStreak = {last:today, count:1};
  save();
}
function upsertMissed(meta){
  if(!meta || !meta.key) return;
  const hit = prog.missed.find(m=>m.key===meta.key);
  if(hit){
    hit.count = (hit.count||1)+1;
    hit.addedAt = Date.now();
  }else{
    prog.missed.push(Object.assign({addedAt:Date.now(), count:1}, meta));
    while(prog.missed.length>40) prog.missed.shift();
  }
  save(); refreshReviewCard();
}
function bumpMastery(key){
  prog.mastery[key] = (prog.mastery[key]||0)+1;
  if(prog.mastery[key]>=2){
    delete prog.mastery[key];
    prog.missed = prog.missed.filter(m=>m.key!==key);
  }
  save(); refreshReviewCard();
}
function resetMastery(key){ prog.mastery[key] = 0; save(); refreshReviewCard(); }
function refreshReviewCard(){
  const card = document.querySelector('[data-game="review"]');
  const lbl = $('reviewCount');
  const n = prog.missed.length;
  if(card){
    card.hidden = n===0;
    card.disabled = n===0;
  }
  if(lbl) lbl.textContent = n===1 ? '1 card to review' : `${n} cards to review`;
}

/* ── icons ─────────────────────────────────────────── */
const ICONS = {
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3L2.8 9.5l6.4-.8L12 2.8Z"/></svg>',
  candle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="3" x2="8" y2="21"/><rect x="5" y="8" width="6" height="8" rx="1.5" fill="currentColor" fill-opacity=".15"/><line x1="16" y1="4" x2="16" y2="20"/><rect x="13" y="6" width="6" height="9" rx="1.5" fill="currentColor" fill-opacity=".15"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.5l7.5 3v6c0 5-3.2 8.4-7.5 10-4.3-1.6-7.5-5-7.5-10v-6l7.5-3Z"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>'
};

/* ── chart helpers ─────────────────────────────────── */
function drawArr(svg, W, H, pad, arr, opts){
  opts = opts||{};
  svg.innerHTML='';
  const ctx = AI.add(svg, W, H, pad||{l:16,r:52,t:20,b:14});
  ctx.scale(0,100); ctx.grid(6,4);
  if(opts.title) ctx.title(opts.title, 'dim');
  const n = arr.length;
  arr.forEach((k,i)=>ctx.candle(ctx.xat(i,n), k[0],k[1],k[2],k[3], undefined, {n}));
  (opts.lines||[]).forEach(l=>ctx.hline(ctx.y2px(l.y), l.color||'accent', l.label||'', true));
  AI.animate(svg, opts.gap!=null?opts.gap:110);
  return ctx;
}
function drawPat(svg, W, H, pad, name){
  const pat = AI.candles.find(p=>p.name===name); if(!pat) return;
  svg.innerHTML='';
  const ctx = AI.add(svg, W, H, pad||{l:16,r:52,t:20,b:14});
  ctx.scale(0,100); ctx.grid(6,4); ctx.title(pat.name.toUpperCase(), 'dim');
  pat.draw(ctx,W,H,pad||{l:16,r:52,t:20,b:14});
  AI.animate(svg, 110);
}
function drawZig(svg, W, H, pad, name){
  const pat = AI.chartPatterns.find(p=>p.name===name); if(!pat) return;
  svg.innerHTML='';
  const ctx = AI.add(svg, W, H, pad||{l:16,r:16,t:20,b:14});
  AI.drawChartPattern(ctx, W, H, pat);
  const path = svg.querySelector('path');
  if(path && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    path.style.transition = 'stroke-dashoffset 1.1s var(--ease)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ path.style.strokeDashoffset = 0; }));
  }
}
function drawAnatomy(svg, W, H){
  svg.innerHTML='';
  const ctx = AI.add(svg, W, H, {l:16,r:120,t:30,b:16});
  ctx.scale(0,100); ctx.grid(4,4);
  const x = ctx.xat(1,2);
  // faint context candles
  [{o:64,h:68,l:58,c:61},{o:61,h:64,l:52,c:55}].forEach((k,i)=>ctx.candle(ctx.xat(i,4), k.o,k.h,k.l,k.c, undefined, {n:4, op:.35}));
  ctx.candle(x, 42,84,16,70, 46, {});
  const L = (y, txt, side)=>ctx.label(W - ctx.pad.r + 8, ctx.y2px(y)+4, txt, 'dim', 'start');
  ctx.hline(ctx.y2px(84), 'accent', 'HIGH', true);
  ctx.hline(ctx.y2px(16), 'accent', 'LOW', true);
  ctx.hline(ctx.y2px(42), 'dim', 'OPEN', true);
  ctx.hline(ctx.y2px(70), 'up', 'CLOSE', true);
  ctx.label(x, ctx.y2px(56)+4, 'BODY', 'ink');
  ctx.label(x, ctx.y2px(92), 'UPPER WICK', 'ink');
  ctx.label(x, ctx.y2px(9), 'LOWER WICK', 'ink');
}

/* ── curriculum — data lives in js/curriculum.js ───── */
const CURRICULUM = AI.CURRICULUM.units;
const BOSSES = AI.CURRICULUM.bosses;

/* flatten order for unlock logic */
const ORDER = [];
CURRICULUM.forEach(u=>{
  u.lessons.forEach(l=>ORDER.push(l));
  if(BOSSES[u.id]) ORDER.push(BOSSES[u.id]);
});
const UNIT_OF = {};
CURRICULUM.forEach(u=>{ u.lessons.forEach(l=>UNIT_OF[l.id]=u.id); if(BOSSES[u.id]) UNIT_OF[BOSSES[u.id].id]=u.id; });
function idxOf(id){ return ORDER.findIndex(l=>l.id===id); }
function isUnlocked(id){
  const i = idxOf(id);
  return i<=0 || !!prog.done[ORDER[i-1].id];
}

/* ═══ games ═════════════════════════════════════════════════ */
function shuffle(a){ const x=a.slice(); for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function lockChoices(host, correctText, clicked){
  [...host.querySelectorAll('button')].forEach(b=>{
    b.disabled = true;
    const clean = b.textContent.replace(/·.*$/,'').trim();
    if(clean === correctText) b.classList.add('correct');
  });
  if(clicked && !clicked.classList.contains('correct')) clicked.classList.add('wrong');
}

const GAMES = {
  /* Candle Builder — identify the forming candle */
  builder(){ return {
    name:'Candle Builder', tag:'Candle anatomy', xp:40,
    intro:'Watch a candle form, then identify what the candle is telling you.',
    round(board, done){
      const S = pick([
        {answer:'Hammer reversal', tag:'Wick rejection', ctx:'after a downtrend', o:38,h:51,l:14,c:48, why:'The long lower wick says sellers pushed hard, but buyers reclaimed the candle before the close.', pre:[[76,79,66,68],[68,71,58,60],[60,63,49,51],[51,54,40,42]]},
        {answer:'Shooting star rejection', tag:'Top rejection', ctx:'after an uptrend', o:63,h:91,l:55,c:58, why:'The long upper wick says buyers tried to break higher, but sellers rejected the move.', pre:[[30,39,28,37],[37,48,35,46],[46,59,44,57],[57,67,55,64]]},
        {answer:'Doji / indecision', tag:'Stalemate', ctx:'near a decision level', o:55,h:75,l:35,c:55.6, why:'The open and close nearly match. Alone, it means indecision — wait for the break.', pre:[[52,56,44,47],[47,60,46,58],[58,62,52,55],[55,58,50,53]]},
        {answer:'Bullish momentum candle', tag:'Demand control', ctx:'through resistance', o:38,h:73,l:35,c:70, why:'A wide green body closing near the high means buyers controlled most of the round.', pre:[[70,74,64,66],[66,60,56,58],[58,50,46,48],[48,44,38,40]]},
        {answer:'Bearish momentum candle', tag:'Supply control', ctx:'through support', o:70,h:73,l:34,c:37, why:'A wide red body closing near the low means sellers controlled most of the round.', pre:[[34,40,32,38],[38,48,36,46],[46,56,44,54],[54,64,52,62]]}
      ]);
      const choices = ['Bullish momentum candle','Bearish momentum candle','Doji / indecision','Hammer reversal','Shooting star rejection'];
      board.innerHTML = `
        <div class="play-grid">
          <div class="chart-frame game-chart">
            <div class="game-toolbar"><span class="chip neut">${S.tag}</span><span class="small dim">mission: identify the candle ${S.ctx}</span></div>
            <svg id="gChart" viewBox="0 0 640 330" role="img" aria-label="Candle round"></svg>
          </div>
          <div class="mission-card">
            <span class="badge">Candle anatomy</span>
            <h3>What did this candle become?</h3>
            <p class="small">Read the body first, then the wicks. The close tells you who won the candle.</p>
            <div class="choice-stack" data-choices></div>
            <div class="game-result" data-result>Make the call before the answer appears.</div>
          </div>
        </div>`;
      const svg = board.querySelector('#gChart');
      const ctx = AI.add(svg, 640, 330, {l:18,r:70,t:18,b:16});
      ctx.scale(0,100); ctx.grid(6,4);
      S.pre.forEach((k,i)=>ctx.candle(ctx.xat(i,6), k[0],k[1],k[2],k[3], undefined, {n:6, op:.55}));
      ctx.candle(ctx.xat(5,6), S.o,S.h,S.l,S.c, undefined, {n:6});
      ctx.hline(ctx.y2px(S.o), 'dim', 'OPEN', true);
      ctx.hline(ctx.y2px(S.c), S.c>=S.o?'up':'down', 'CLOSE', true);
      AI.animate(svg, 130);
      const host = board.querySelector('[data-choices]');
      const meta = {
        key:'game:builder', type:'quiz',
        q:'What did this candle become?', why:S.why,
        chart:{arr:[...S.pre, [S.o,S.h,S.l,S.c]]}
      };
      const shown = shuffle(choices);
      meta.opts = shown.slice();
      meta.a = shown.indexOf(S.answer);
      shown.forEach(ch=>{
        const b = document.createElement('button');
        b.className='quiz-opt'; b.textContent = ch;
        b.addEventListener('click',()=>{
          const ok = ch === S.answer;
          lockChoices(host, S.answer, b);
          const r = board.querySelector('[data-result]');
          r.className = 'game-result ' + (ok?'ok':'bad');
          r.innerHTML = `${ok?'Correct':'Not this one'} — <b>${S.answer}</b>. ${S.why}`;
          done(ok, meta);
        });
        host.appendChild(b);
      });
    }
  };},

  /* Pattern Hunt — schematic quiz; subset filterable */
  hunt(filter){ return {
    name:'Pattern Hunt', tag:'Recognition', xp:60,
    intro:'Name the setup before the reveal and build recognition streaks.',
    round(board, done){
      const pool = AI.candles.filter(filter||(()=>true));
      const pat = pick(pool);
      const opts = shuffle([pat, ...shuffle(pool.filter(p=>p!==pat)).slice(0,3)]);
      board.innerHTML = `
        <div class="play-grid">
          <div class="chart-frame game-chart">
            <div class="game-toolbar"><span class="chip ${pat.bias==='Bullish'?'bull':pat.bias==='Bearish'?'bear':'neut'}">Scanning chart</span><span class="small dim">trend first, then body, then wicks</span></div>
            <svg id="gChart" viewBox="0 0 680 330" role="img" aria-label="Pattern round"></svg>
          </div>
          <div class="mission-card">
            <span class="badge">Pattern hunt</span>
            <h3>Which setup is this?</h3>
            <p class="small">Use context: trend first, then candle body, then wick rejection, then confirmation.</p>
            <div class="choice-stack" data-choices></div>
            <div class="game-result" data-result>Wait for the candles, then call the pattern.</div>
          </div>
        </div>`;
      const svg = board.querySelector('#gChart');
      const ctx = AI.add(svg, 680, 330, {l:16,r:40,t:20,b:16});
      ctx.scale(0,100); ctx.grid(7,4); ctx.title('NAME THIS PATTERN','dim');
      pat.draw(ctx,680,330,{l:16,r:40,t:20,b:16});
      AI.animate(svg, 120);
      const meta = {key:'game:hunt:'+pat.name, type:'pattern', name:pat.name, fam:'candle'};
      const host = board.querySelector('[data-choices]');
      opts.forEach(o=>{
        const b = document.createElement('button');
        b.className = 'quiz-opt'; b.innerHTML = `${o.name} <span class="dim">· ${o.bias}</span>`;
        b.addEventListener('click',()=>{
          const ok = o === pat;
          lockChoices(host, pat.name, b);
          const r = board.querySelector('[data-result]');
          r.className = 'game-result ' + (ok?'ok':'bad');
          r.innerHTML = `${ok?'Pattern spotted':'Pattern missed'} — <b>${pat.name}</b>. ${pat.see} <span class="dim">${pat.fail}</span>`;
          done(ok, meta);
        });
        host.appendChild(b);
      });
    }
  };},

  /* Shape Match — chart pattern zigzag quiz */
  shape(){ return {
    name:'Shape Match', tag:'Chart structure', xp:60,
    intro:'Read the structure line and name the shape it draws.',
    round(board, done){
      const pool = AI.chartPatterns;
      const pat = pick(pool);
      const opts = shuffle([pat, ...shuffle(pool.filter(p=>p!==pat)).slice(0,3)]);
      board.innerHTML = `
        <div class="play-grid">
          <div class="chart-frame game-chart">
            <div class="game-toolbar"><span class="chip neut">${pat.kind} candidate</span><span class="small dim">peaks, valleys, and squeezes</span></div>
            <svg id="gChart" viewBox="0 0 680 330" role="img" aria-label="Shape round"></svg>
          </div>
          <div class="mission-card">
            <span class="badge">Shape match</span>
            <h3>What structure is drawing itself?</h3>
            <p class="small">Count the peaks. Check which line is flat. Squeezes point somewhere.</p>
            <div class="choice-stack" data-choices></div>
            <div class="game-result" data-result>Read the swings before you name the shape.</div>
          </div>
        </div>`;
      const svg = board.querySelector('#gChart');
      const ctx = AI.add(svg, 680, 330, {l:16,r:40,t:20,b:16});
      AI.drawChartPattern(ctx, 680, 330, pat);
      const path = svg.querySelector('path');
      if(path && !matchMedia('(prefers-reduced-motion: reduce)').matches){
        const len = path.getTotalLength();
        path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
        path.style.transition = 'stroke-dashoffset 1s var(--ease)';
        requestAnimationFrame(()=>requestAnimationFrame(()=>{ path.style.strokeDashoffset = 0; }));
      }
      const meta = {key:'game:shape:'+pat.name, type:'pattern', name:pat.name, fam:'zig'};
      const host = board.querySelector('[data-choices]');
      opts.forEach(o=>{
        const b = document.createElement('button');
        b.className='quiz-opt'; b.innerHTML = `${o.name} <span class="dim">· ${o.bias}</span>`;
        b.addEventListener('click',()=>{
          const ok = o === pat;
          lockChoices(host, pat.name, b);
          const r = board.querySelector('[data-result]');
          r.className = 'game-result ' + (ok?'ok':'bad');
          r.innerHTML = `${ok?'Shape read':'Shape missed'} — <b>${pat.name}</b>. ${pat.see}`;
          done(ok, meta);
        });
        host.appendChild(b);
      });
    }
  };},

  /* Fakeout Detective */
  detective(){ return {
    name:'Fakeout Detective', tag:'Anti-trap', xp:70,
    intro:'Inspect the clues and decide whether the breakout is real, fake, or too extended to chase.',
    round(board, done){
      const S = pick([
        {answer:'Fakeout / liquidity trap', name:'Wick above resistance', level:64,
         clue:['Price poked above resistance but closed back below it.','The breakout candle left a long upper wick.','The next candle rejected the same zone again.'],
         why:'A real breakout should close through the level and hold it. This one only wicked above and snapped back — classic fakeout behavior.',
         candles:[[35,45,32,43],[43,55,40,52],[52,63,49,61],[61,82,58,60],[60,67,54,56],[56,59,45,48]]},
        {answer:'Real breakout', name:'Close and retest', level:58,
         clue:['The candle closed above resistance, not just through it.','The next dip retested the level from above.','Buyers defended old resistance as new support.'],
         why:'The close broke the level and the retest held. That is stronger evidence than a wick-only poke.',
         candles:[[35,42,32,40],[40,48,38,46],[46,57,43,55],[55,70,53,67],[67,70,58,62],[62,77,60,74]]},
        {answer:'Wait for retest', name:'Clean break, no retest yet', level:61,
         clue:['The close is above the level.','The candle is extended far from the breakout area.','There is no retest yet, so chasing creates a wide stop.'],
         why:'The break may be real, but the entry is stretched. The disciplined answer is to wait for a retest or a tighter plan.',
         candles:[[38,45,36,43],[43,53,41,50],[50,61,48,59],[59,84,58,81],[81,88,76,84],[84,90,80,87]]}
      ]);
      board.innerHTML = `
        <div class="play-grid">
          <div class="chart-frame game-chart">
            <div class="game-toolbar"><span class="chip neut">Case file: ${S.name}</span><span class="small dim">tap the clues, then give a verdict</span></div>
            <svg id="gChart" viewBox="0 0 680 330" role="img" aria-label="Detective round"></svg>
          </div>
          <div class="mission-card">
            <span class="badge">Detective mode</span>
            <h3>Is the breakout trustworthy?</h3>
            <div class="clue-grid" data-clues></div>
            <div class="choice-stack" data-choices></div>
            <div class="game-result" data-result>Build the evidence before entering.</div>
          </div>
        </div>`;
      const svg = board.querySelector('#gChart');
      const ctx = AI.add(svg, 680, 330, {l:16,r:96,t:20,b:16});
      ctx.scale(0,100); ctx.grid(7,4); ctx.title('BREAKOUT CASE — CLOSE VS WICK','dim');
      S.candles.forEach((k,i)=>ctx.candle(ctx.xat(i,S.candles.length), k[0],k[1],k[2],k[3], undefined, {n:S.candles.length}));
      ctx.hline(ctx.y2px(S.level), 'yellow', 'RESISTANCE', true);
      AI.animate(svg, 130);
      S.clue.forEach((c,i)=>{
        const b = document.createElement('button');
        b.className='clue-card'; b.innerHTML = `<b>CLUE ${i+1}</b><span>${c}</span>`;
        b.addEventListener('click',()=>b.classList.add('found'));
        board.querySelector('[data-clues]').appendChild(b);
      });
      const host = board.querySelector('[data-choices]');
      const verdicts = shuffle(['Real breakout','Fakeout / liquidity trap','Wait for retest']);
      const meta = {
        key:'game:detective', type:'quiz',
        q:'Is the breakout trustworthy?', why:S.why,
        opts:verdicts.slice(), a:verdicts.indexOf(S.answer),
        chart:{arr:S.candles, lines:[{y:S.level, label:'RESISTANCE'}]}
      };
      verdicts.forEach(ch=>{
        const b = document.createElement('button');
        b.className='quiz-opt'; b.textContent = ch;
        b.addEventListener('click',()=>{
          const ok = ch === S.answer;
          lockChoices(host, S.answer, b);
          board.querySelectorAll('.clue-card').forEach(c=>c.classList.add('found'));
          const r = board.querySelector('[data-result]');
          r.className = 'game-result ' + (ok?'ok':'bad');
          r.innerHTML = `${ok?'Case solved':'Bad verdict'} — <b>${S.answer}</b>. ${S.why}`;
          done(ok, meta);
        });
        host.appendChild(b);
      });
    }
  };},

  /* Stop Samurai */
  samurai(){ return {
    name:'Stop Loss Samurai', tag:'Risk', xp:70,
    intro:'Choose the stop that protects the account and respects the chart structure.',
    round(board, done){
      const S = pick([
        {side:'long', pattern:'Bullish engulfing at support', correct:'Below structure', level:39,
         why:'For a long, the idea is wrong if price breaks below the support that created the reversal.',
         candles:[[64,67,52,55],[55,57,44,47],[47,50,38,40],[39,63,37,60],[60,70,57,68]]},
        {side:'short', pattern:'Shooting star at resistance', correct:'Above structure', level:70,
         why:'For a short, the idea is wrong if price breaks above the rejection high.',
         candles:[[35,45,33,43],[43,55,41,53],[53,68,51,66],[67,86,62,64],[64,67,52,55]]},
        {side:'long', pattern:'Hammer at the range low', correct:'Below structure', level:30,
         why:'The wick low is the rejection. Below it, the "defended floor" story is dead.',
         candles:[[52,56,42,44],[44,48,36,38],[38,44,30,44],[44,58,42,56],[56,64,54,62]]},
        {side:'short', pattern:'Evening star at the range high', correct:'Above structure', level:72,
         why:'The star high is the exhaustion point. Above it, buyers proved the reversal wrong.',
         candles:[[40,50,38,48],[48,60,46,58],[58,72,56,70],[70,76,58,60],[60,62,48,50]]},
        {side:'long', pattern:'Falling wedge breakout', correct:'Below structure', level:34,
         why:'The wedge low is the last defense of the squeeze. Below it the compression failed.',
         candles:[[60,64,50,52],[52,58,44,46],[46,52,38,48],[48,54,34,52],[52,66,50,64]]},
        {side:'short', pattern:'Rising wedge breakdown', correct:'Above structure', level:70,
         why:'The wedge high is where momentum died. Above it, the squeeze resolved up instead.',
         candles:[[40,50,38,48],[48,60,46,58],[58,70,56,68],[68,78,60,62],[62,64,48,50]]}
      ]);
      const labels = S.side==='long' ? ['Inside the noise','Below structure','Random far away'] : ['Inside the noise','Above structure','Random far away'];
      board.innerHTML = `
        <div class="play-grid">
          <div class="chart-frame game-chart">
            <div class="game-toolbar"><span class="chip ${S.side==='long'?'bull':'bear'}">${S.pattern}</span><span class="small dim">structure first, feelings last</span></div>
            <svg id="gChart" viewBox="0 0 680 330" role="img" aria-label="Samurai round"></svg>
          </div>
          <div class="mission-card">
            <span class="badge">Stop placement</span>
            <h3>Where should the stop go?</h3>
            <p class="small">A stop is not a pain limit. It is the price where your trade idea is proven wrong.</p>
            <div class="choice-stack" data-choices></div>
            <div class="game-result" data-result>Choose the shield location.</div>
          </div>
        </div>`;
      const svg = board.querySelector('#gChart');
      const ctx = AI.add(svg, 680, 330, {l:16,r:104,t:20,b:16});
      ctx.scale(0,100); ctx.grid(7,4); ctx.title('STOP SAMURAI — STRUCTURE FIRST','dim');
      S.candles.forEach((k,i)=>ctx.candle(ctx.xat(i,S.candles.length), k[0],k[1],k[2],k[3], undefined, {n:S.candles.length}));
      ctx.hline(ctx.y2px(S.level), S.side==='long'?'up':'down', S.side==='long'?'SUPPORT':'RESISTANCE', true);
      AI.animate(svg, 125);
      const host = board.querySelector('[data-choices]');
      const shown = shuffle(labels);
      const meta = {
        key:'game:samurai', type:'quiz',
        q:'Where should the stop go?', why:S.why,
        opts:shown.slice(), a:shown.indexOf(S.correct),
        chart:{arr:S.candles, lines:[{y:S.level, label:S.side==='long'?'SUPPORT':'RESISTANCE'}]}
      };
      shown.forEach(ch=>{
        const b = document.createElement('button');
        b.className='quiz-opt'; b.textContent = ch;
        b.addEventListener('click',()=>{
          const ok = ch === S.correct;
          lockChoices(host, S.correct, b);
          const c2 = AI.add(svg, 680, 330, {l:16,r:104,t:20,b:16});
          c2.scale(0,100);
          c2.hline(c2.y2px(S.side==='long'? S.level-5 : S.level+5), 'blue', 'SMART STOP', true);
          const r = board.querySelector('[data-result]');
          r.className = 'game-result ' + (ok?'ok':'bad');
          r.innerHTML = `${ok?'Shield held':'Shield cracked'} — <b>${S.correct}</b>. ${S.why}`;
          done(ok, meta);
        });
        host.appendChild(b);
      });
    }
  };}
};
GAMES.huntSingles = ()=>GAMES.hunt(p=>['Doji','Hammer','Shooting Star','Marubozu'].includes(p.name));
GAMES.huntMulti = ()=>GAMES.hunt(p=>!['Doji','Hammer','Shooting Star','Marubozu'].includes(p.name));

/* Review Queue — spaced-repetition lite over the rounds you missed */
GAMES.review = ()=>({
  name:'Review Queue', tag:'Spaced repetition', xp:60,
  intro:'The rounds you missed come back until you clear each one twice.',
  round(board, done){
    if(!prog.missed.length){
      board.innerHTML = '<div class="game-result ok">Queue is empty — nothing to review right now.</div>';
      return;
    }
    const entry = pick(prog.missed);
    board.innerHTML = `
      <div class="play-grid">
        <div class="chart-frame game-chart">
          <div class="game-toolbar"><span class="chip neut">Review · missed ${entry.count||1}×</span><span class="small dim">clear it twice to retire the card</span></div>
          <svg id="gChart" viewBox="0 0 680 330" role="img" aria-label="Review round"></svg>
        </div>
        <div class="mission-card">
          <span class="badge">Review queue</span>
          <h3 data-q></h3>
          <div class="choice-stack" data-choices></div>
          <div class="game-result" data-result>Take the rep again — slowly this time.</div>
        </div>
      </div>`;
    const svg = board.querySelector('#gChart');
    const host = board.querySelector('[data-choices]');
    const qEl = board.querySelector('[data-q]');
    const r = board.querySelector('[data-result]');
    function settle(ok, correctText, whyHtml){
      if(ok) bumpMastery(entry.key);
      else resetMastery(entry.key);
      r.className = 'game-result ' + (ok?'ok':'bad');
      r.innerHTML = `${ok?'Review cleared':'Still slippery'} — <b>${correctText}</b>. ${whyHtml}`;
    }

    if(entry.type==='pattern'){
      const fam = entry.fam==='zig' ? AI.chartPatterns : AI.candles;
      const pat = fam.find(p=>p.name===entry.name);
      if(!pat){ // stale card (pattern no longer exists) — retire it
        prog.missed = prog.missed.filter(m=>m.key!==entry.key);
        delete prog.mastery[entry.key];
        save(); refreshReviewCard();
        board.innerHTML = '<div class="game-result neut">That card went stale and was retired. Hit Next round for the next one.</div>';
        return;
      }
      qEl.textContent = 'Which setup is this?';
      if(entry.fam==='zig'){
        const ctx = AI.add(svg, 680, 330, {l:16,r:40,t:20,b:16});
        AI.drawChartPattern(ctx, 680, 330, pat);
        const path = svg.querySelector('path');
        if(path && !matchMedia('(prefers-reduced-motion: reduce)').matches){
          const len = path.getTotalLength();
          path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
          path.style.transition = 'stroke-dashoffset 1s var(--ease)';
          requestAnimationFrame(()=>requestAnimationFrame(()=>{ path.style.strokeDashoffset = 0; }));
        }
      }else{
        const ctx = AI.add(svg, 680, 330, {l:16,r:40,t:20,b:16});
        ctx.scale(0,100); ctx.grid(7,4); ctx.title('REVIEW — NAME THIS PATTERN','dim');
        pat.draw(ctx,680,330,{l:16,r:40,t:20,b:16});
        AI.animate(svg, 120);
      }
      shuffle([pat, ...shuffle(fam.filter(p=>p!==pat)).slice(0,3)]).forEach(o=>{
        const b = document.createElement('button');
        b.className = 'quiz-opt'; b.innerHTML = `${o.name} <span class="dim">· ${o.bias}</span>`;
        b.addEventListener('click',()=>{
          const ok = o === pat;
          lockChoices(host, pat.name, b);
          settle(ok, pat.name, entry.fam==='zig' ? pat.see : `${pat.see} <span class="dim">${pat.fail}</span>`);
          done(ok);
        });
        host.appendChild(b);
      });
    }else{
      qEl.textContent = entry.q || 'Pop quiz';
      if(entry.chart && entry.chart.arr){
        drawArr(svg, 680, 330, {l:16,r:96,t:20,b:16}, entry.chart.arr, entry.chart);
      }else{
        const ctx = AI.add(svg, 680, 330, {l:16,r:40,t:20,b:16});
        ctx.scale(0,100); ctx.grid(6,4); ctx.title('NO CHART ON THIS CARD — READ THE WORDS','dim');
      }
      const correctText = entry.opts[entry.a];
      shuffle(entry.opts).forEach(ch=>{
        const b = document.createElement('button');
        b.className = 'quiz-opt'; b.textContent = ch;
        b.addEventListener('click',()=>{
          const ok = ch === correctText;
          lockChoices(host, correctText, b);
          settle(ok, correctText, entry.why||'');
          done(ok);
        });
        host.appendChild(b);
      });
    }
  }
});

/* ═══ HUD ═══════════════════════════════════════════════════ */
function levelInfo(){
  const lvl = Math.floor(prog.xp/400)+1;
  const base = (lvl-1)*400, next = lvl*400;
  return {lvl, base, next, rank:RANKS[Math.min(RANKS.length-1,lvl-1)], pct:Math.max(0,Math.min(100,(prog.xp-base)/(next-base)*100))};
}
function updateHud(){
  const el = {
    level:$('hudLevel'), rank:$('hudRank'), xp:$('hudXp'), next:$('hudNext'),
    fill:$('hudXpFill'), streak:$('hudStreak'), acc:$('hudAcc'), played:$('hudPlayed'),
    done:$('hudDone'), total:$('hudTotal')
  };
  if(!el.level) return;
  const info = levelInfo();
  el.level.textContent = info.lvl;
  el.rank.textContent = info.rank;
  el.xp.textContent = prog.xp;
  el.next.textContent = info.next;
  el.fill.style.transform = `scaleX(${info.pct/100})`;
  el.streak.textContent = prog.streak;
  el.acc.textContent = prog.played ? `${Math.round(prog.right/prog.played*100)}%` : '—';
  el.played.textContent = `${prog.played} round${prog.played===1?'':'s'}`;
  el.done.textContent = Object.keys(prog.done).length;
  el.total.textContent = ORDER.length;
  const days = $('hudDays');
  if(days) days.textContent = (prog.dayStreak && prog.dayStreak.count) || 1;
  refreshReviewCard();
}
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
function confetti(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className='confetti';
  const cols = ['var(--accent)','var(--green-hi)','var(--yellow)','var(--red-hi)'];
  for(let i=0;i<42;i++){
    const s = document.createElement('i');
    s.style.left = Math.random()*100+'vw';
    s.style.background = cols[i%4];
    s.style.setProperty('--t', (1.6+Math.random()*1.4)+'s');
    s.style.setProperty('--d', (Math.random()*.5)+'s');
    s.style.setProperty('--r', (Math.random()*720-360)+'deg');
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(()=>box.remove(), 3600);
}
function recordRound(ok, xp, msg, meta){
  if(!ok && meta && meta.key) upsertMissed(meta);
  prog.played++;
  if(ok){
    prog.right++; prog.streak++;
    prog.best = Math.max(prog.best, prog.streak);
    prog.xp += xp;
    toast(`+${xp} XP · ${msg}`, 'bull');
    burst();
  }else{
    prog.streak = 0;
    toast(msg, 'bear');
  }
  save(); updateHud();
}

/* ═══ path map ══════════════════════════════════════════════ */
function nodeIcon(l){
  if(l.game==='samurai') return ICONS.shield;
  if(l.game==='detective') return ICONS.eye;
  if(l.game==='shape') return ICONS.target;
  if(l.game) return ICONS.star;
  return ICONS.book;
}
function renderPath(){
  const host = $('pathMap'); if(!host) return;
  host.innerHTML = '';
  CURRICULUM.forEach(u=>{
    const lessons = u.lessons.map(l=>Object.assign({},l)).concat(BOSSES[u.id]?[BOSSES[u.id]]:[]);
    const uDone = lessons.every(l=>prog.done[l.id]);
    const block = document.createElement('div');
    block.className = 'unit-block';
    block.innerHTML = `
      <div class="unit-head">
        <span class="unit-no">U${CURRICULUM.indexOf(u)+1}</span>
        <b>${u.title}</b>
        <small>${u.tag}${uDone?' · cleared':''}</small>
      </div>
      <div class="unit-nodes"></div>`;
    const nodes = block.querySelector('.unit-nodes');
    lessons.forEach((l,i)=>{
      const done = !!prog.done[l.id];
      const unlocked = isUnlocked(l.id);
      const isCurrent = unlocked && !done;
      const nextInLine = isCurrent && !lessons.slice(0,i).some(x=>isUnlocked(x.id)&&!prog.done[x.id]);
      const b = document.createElement('button');
      b.className = 'node' + (done?' done':'') + (nextInLine?' current':'') + (l.game?' boss':'') + (!unlocked?' locked':'');
      b.innerHTML = `
        <span class="dot">${done?ICONS.check:(unlocked?nodeIcon(l):ICONS.lock)}</span>
        <span class="node-txt"><b>${l.title}</b><small>${l.blurb}</small></span>
        <span class="node-xp">${done?'DONE':`+${l.xp} XP`}</span>`;
      if(unlocked){
        b.setAttribute('aria-label', `Open lesson: ${l.title}`);
        b.addEventListener('click',()=>openLesson(l.id));
      }else{
        b.disabled = true;
        b.title = 'Finish the previous lesson to unlock';
      }
      nodes.appendChild(b);
    });
    host.appendChild(block);
  });
}

/* ═══ lesson player ═════════════════════════════════════════ */
function openLesson(id){
  const l = ORDER.find(x=>x.id===id);
  if(!l || !isUnlocked(id)) return;
  current = id;
  const shell = $('lessonShell');
  shell.hidden = false;
  const i = idxOf(id);
  $('lessonNo').textContent = l.game ? 'BOSS STAGE' : `LESSON ${i+1} OF ${ORDER.length}`;
  $('lessonTitle').textContent = l.title;
  $('lessonDesc').textContent = l.blurb;
  const prog_bar = $('lessonProgress');
  prog_bar.innerHTML = ORDER.map(x=>`<i class="${prog.done[x.id]?'ok':''} ${x.id===id?'on':''}"></i>`).join('');

  if(l.game) startBoss(l);
  else renderLessonBody(l);

  const titleEl = $('lessonTitle');
  titleEl.setAttribute('tabindex','-1');
  titleEl.focus({preventScroll:true});

  shell.scrollIntoView({behavior:'smooth', block:'start'});
}
function renderLessonBody(l){
  const body = $('lessonBody');
  body.innerHTML = `
    <div class="lesson-steps" data-steps></div>
    <div class="check-panel">
      <h4>Quick check</h4>
      <div data-checks></div>
      <div class="lesson-footer">
        <button class="btn btn-ghost btn-sm" data-close>Back to path</button>
        <button class="btn btn-primary" data-complete hidden>Complete lesson · +${l.xp} XP</button>
      </div>
    </div>`;
  const steps = body.querySelector('[data-steps]');
  l.steps.forEach((s,si)=>{
    const d = document.createElement('div');
    d.className = 'lesson-step';
    d.setAttribute('data-reveal','');
    d.innerHTML = `<h4><span class="stepnum">${si+1}</span>${s.h}</h4><p>${s.p}</p>${s.table?renderTable(s.table):''}${s.c?'<div class="lesson-chart"><svg viewBox="0 0 560 240" role="img"></svg></div>':''}`;
    steps.appendChild(d);
    if(s.c){
      const svg = d.querySelector('svg');
      drawSpec(svg, s.c);
      themeFns.push(()=>{ if(current===l.id && document.body.contains(svg)) drawSpec(svg, s.c, true); });
    }
  });
  // checks
  const checksHost = body.querySelector('[data-checks]');
  const answered = new Set();
  l.check.forEach((q,qi)=>{
    const wrap = document.createElement('div');
    wrap.style.margin = '0 0 .9rem';
    wrap.innerHTML = `<p style="font-weight:800;margin:.2rem 0 .5rem">${qi+1}. ${q.q}</p><div class="quiz-opts" style="margin:.4rem 0 0"></div><p class="small dim" data-why hidden style="margin:.4rem 0 0"></p>`;
    const opts = wrap.querySelector('.quiz-opts');
    q.opts.forEach((o,oi)=>{
      const b = document.createElement('button');
      b.className='quiz-opt'; b.textContent=o;
      b.addEventListener('click',()=>{
        if(answered.has(qi)) return;
        answered.add(qi);
        if(oi!==q.a){
          upsertMissed({key:'check:'+l.id+':'+qi, type:'quiz', q:q.q, opts:q.opts.slice(), a:q.a, why:q.why});
        }
        [...opts.children].forEach((bb,j)=>{
          bb.disabled = true;
          if(j===q.a) bb.classList.add('correct');
          else if(j===oi) bb.classList.add('wrong');
        });
        const why = wrap.querySelector('[data-why]');
        why.hidden = false;
        why.innerHTML = (oi===q.a?'<b class="up">Correct.</b> ':'<b class="down">Not quite.</b> ') + q.why;
        if(answered.size===l.check.length){
          const btn = body.querySelector('[data-complete]');
          if(prog.done[l.id]) { btn.hidden = true; markDoneNote(body, l); }
          else btn.hidden = false;
        }
      });
      opts.appendChild(b);
    });
    checksHost.appendChild(wrap);
  });
  body.querySelector('[data-complete]').addEventListener('click',()=>{
    completeLesson(l);
  });
  body.querySelector('[data-close]').addEventListener('click',closeLesson);
  observeReveals();
}
function markDoneNote(body, l){
  if(body.querySelector('[data-doneNote]')) return;
  const btn = body.querySelector('[data-complete]');
  if(!btn) return;
  const n = document.createElement('p');
  n.setAttribute('data-doneNote','');
  n.className = 'small';
  n.style.cssText = 'margin:.6rem 0 0;font-weight:800;color:var(--green)';
  n.textContent = 'Already completed — replay freely.';
  btn.after(n);
}
function renderTable(rows){
  const [head, ...rest] = rows;
  return `<table><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rest.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function drawSpec(svg, c, instant){
  const W = 560, H = 240;
  if(c.fn==='anatomy') return drawAnatomy(svg, W, H);
  if(c.pat) return drawPat(svg, W, H, undefined, c.pat);
  if(c.zig) return drawZig(svg, W, H, undefined, c.zig);
  if(c.arr) return drawArr(svg, W, H, undefined, c.arr, c);
}
function completeLesson(l){
  if(prog.done[l.id]) return;
  prog.done[l.id] = true;
  prog.xp += l.xp;
  save(); updateHud();
  confetti();
  toast(`Lesson complete: ${l.title} · +${l.xp} XP`, 'bull');
  const btn = document.querySelector('#lessonBody [data-complete]');
  if(btn) btn.hidden = true;
  markDoneNote(document.getElementById('lessonBody'), l);
  renderPath();
  const i = idxOf(l.id);
  const next = ORDER[i+1];
  const f = $('lessonFooterNext');
  if(next){
    f.hidden = false;
    f.textContent = `Next: ${next.title} →`;
    f.onclick = ()=>openLesson(next.id);
  }else{
    f.hidden = false;
    f.textContent = 'Graduate to Live Practice →';
    f.onclick = ()=>{ location.href = '/practice/'; };
  }
}

/* ── boss stages (games with a pass target) ── */
function startBoss(l){
  bossState = {l, right:0, round:0};
  $('lessonBody').innerHTML = `
    <div class="panel" style="box-shadow:var(--shadow-sm)">
      <div class="game-shell-head">
        <div>
          <span class="badge">BOSS · ${l.need}/${l.total} TO PASS</span>
          <h2 style="margin:.4rem 0">${l.title}</h2>
          <p class="lead" style="font-size:1rem">${l.blurb}</p>
        </div>
        <div class="round-meter mono"><span>SCORE</span><b data-score>0/${l.need}</b></div>
      </div>
      <div class="game-board" data-board aria-live="polite"></div>
      <div class="lesson-footer">
        <button class="btn btn-ghost btn-sm" data-close>Back to path</button>
        <button class="btn btn-primary" data-next-boss hidden>Next round →</button>
        <button class="btn btn-primary" data-boss-done hidden>Claim ${l.xp} XP & continue</button>
      </div>
    </div>`;
  $('lessonBody').querySelector('[data-close]').addEventListener('click',closeLesson);
  runBossRound();
}
function runBossRound(){
  const st = bossState; if(!st) return;
  const l = st.l;
  const board = $('lessonBody').querySelector('[data-board]');
  const game = GAMES[l.game]();
  game.round(board, (ok, meta)=>{
    st.round++;
    if(ok) st.right++;
    recordRound(ok, Math.round(l.xp/l.total/2), ok?game.tag+' rep':'boss rep missed', meta);
    const score = $('lessonBody').querySelector('[data-score]');
    score.textContent = `${st.right}/${l.need}`;
    const passed = st.right >= l.need;
    const finished = st.round >= l.total;
    const nb = $('lessonBody').querySelector('[data-next-boss]');
    const fin = $('lessonBody').querySelector('[data-boss-done]');
    if(finished || passed){
      nb.hidden = true;
      if(passed){
        fin.hidden = false;
        fin.onclick = ()=>{ const b=bossState; bossState=null; completeLesson(b.l); };
      }else{
        nb.hidden = false;
        nb.textContent = `Retry — need ${l.need - st.right} more`;
        nb.onclick = ()=>{ bossState.right=0; bossState.round=0; runBossRound(); };
      }
    }else{
      nb.hidden = false;
      nb.onclick = runBossRound;
    }
  });
}

/* ── free play arcade ── */
function startFreeGame(id){
  freeGame = id;
  const shell = $('freeShell');
  shell.hidden = false;
  const game = GAMES[id]();
  $('freeTitle').textContent = game.name;
  $('freeDesc').textContent = game.intro;
  const board = $('freeBoard');
  board.innerHTML = '';
  const settle = (ok, meta)=>{
    if(id==='review') recordRound(ok, 30, ok?'review cleared':'review missed');
    else recordRound(ok, Math.round(game.xp/2), ok?'free-play rep':'free-play miss', meta);
  };
  game.round(board, settle);
  $('freeNext').onclick = ()=>{ board.innerHTML=''; game.round(board, settle); };
  shell.scrollIntoView({behavior:'smooth', block:'start'});
}

function observeReveals(){
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:.08});
  document.querySelectorAll('[data-reveal]:not(.in)').forEach(el=>io.observe(el));
}
function closeLesson(){
  current = null; bossState = null;
  $('lessonShell').hidden = true;
  $('lessonFooterNext').hidden = true;
  renderPath();
  $('path').scrollIntoView({behavior:'smooth', block:'start'});
}

/* ═══ boot ══════════════════════════════════════════════════ */
AI.onReady = function(){
  bumpDayStreak();
  renderPath();
  updateHud();
  $('resetArcade').addEventListener('click',()=>{
    prog = {xp:0,played:0,right:0,streak:0,best:0,done:{},missed:[],mastery:{}};
    save(); updateHud(); renderPath();
    if(current) closeLesson();
    toast('Progress reset. Fresh chart, fresh mind.', 'neut');
  });
  document.querySelectorAll('[data-game]').forEach(btn=>{
    btn.addEventListener('click',()=>startFreeGame(btn.dataset.game));
  });
  // Escape closes the open lesson, then the free-play shell
  document.addEventListener('keydown',(e)=>{
    if(e.key !== 'Escape') return;
    const ls = $('lessonShell'), fs = $('freeShell');
    if(ls && !ls.hidden){ closeLesson(); return; }
    if(fs && !fs.hidden){ fs.hidden = true; freeGame = null; }
  });
  // deep link: /academy/#u2l3
  if(location.hash && location.hash.length>1){
    const id = decodeURIComponent(location.hash.slice(1));
    const target = ORDER.find(l=>l.id===id);
    if(target){
      if(isUnlocked(id)){
        setTimeout(()=>openLesson(id), 250);
      }else{
        const prev = ORDER[idxOf(id)-1];
        renderPath();
        toast(`Finish "${prev.title}" to unlock "${target.title}".`, 'neut');
        const sec = $('path');
        if(sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
      }
    }
  }
  AI.themeHooks.push(()=>renderPath());
};
})();
