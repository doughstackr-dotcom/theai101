/* TheAI101 Academy Arcade — playable trading education games */
(function(){
'use strict';
const AI = window.AI = window.AI || {};
const STORE = 'theai101-academy-arcade-v1';
const RANKS = ['Candle Rookie','Pattern Scout','Chart Reader','Risk Manager','Market Strategist','Arena Master','TheAI101 Pro'];
const $ = id => document.getElementById(id);

let stats = loadStats();
let activeGame = 'builder';
let localRound = 0;
let cleanup = null;
let heroTimer = null;
const arena = {
  timer:null, ws:null, feedAttempted:false, live:false, lastFeedPrice:null, lastFeedAt:0,
  price:64250, candles:[], current:null, ticks:0, maxTicks:14, prediction:null
};

AI.onReady = function(){
  renderHeroChart();
  updateHud();
  bindGameMap();
  $('resetArcade').addEventListener('click', resetStats);
  switchGame('builder', false);
};

function loadStats(){
  try{
    const raw = localStorage.getItem(STORE);
    if(raw) return Object.assign({xp:0,played:0,right:0,streak:0,best:0}, JSON.parse(raw));
  }catch(_e){}
  return {xp:0,played:0,right:0,streak:0,best:0};
}
function saveStats(){ try{ localStorage.setItem(STORE, JSON.stringify(stats)); }catch(_e){} }
function levelInfo(){
  const level = Math.floor(stats.xp/500)+1;
  const base = (level-1)*500;
  const next = level*500;
  const rank = RANKS[Math.min(RANKS.length-1, Math.floor((level-1)/2))];
  return {level, base, next, rank, pct:Math.max(0, Math.min(100, (stats.xp-base)/(next-base)*100))};
}
function updateHud(){
  const info = levelInfo();
  $('hudLevel').textContent = info.level;
  $('hudRank').textContent = info.rank;
  $('hudXp').textContent = stats.xp;
  $('hudNext').textContent = info.next;
  $('hudXpFill').style.transform = `scaleX(${info.pct/100})`;
  $('hudStreak').textContent = `${stats.streak} 🔥`;
  $('hudAcc').textContent = stats.played ? `${Math.round(stats.right/stats.played*100)}%` : '—';
  $('hudPlayed').textContent = `${stats.played} round${stats.played===1?'':'s'}`;
}
function resetStats(){
  stats = {xp:0,played:0,right:0,streak:0,best:0};
  saveStats(); updateHud();
  toast('Progress reset. Fresh chart, fresh mind.', 'neut');
}
function completeRound(correct, xp, message){
  stats.played += 1;
  if(correct){
    stats.right += 1;
    stats.streak += 1;
    stats.best = Math.max(stats.best, stats.streak);
    stats.xp += xp;
    toast(`+${xp} XP · ${message}`, 'bull');
    burst();
  }else{
    stats.streak = 0;
    toast(message, 'bear');
  }
  saveStats(); updateHud();
}

function bindGameMap(){
  document.querySelectorAll('.game-card').forEach(btn=>{
    btn.addEventListener('click',()=>switchGame(btn.dataset.game, true));
  });
}
function switchGame(game, scroll){
  if(cleanup){ cleanup(); cleanup = null; }
  activeGame = game;
  document.querySelectorAll('.game-card').forEach(btn=>{
    const on = btn.dataset.game === game;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  localRound += 1;
  $('roundLabel').textContent = localRound;
  if(game === 'builder') renderBuilder();
  else if(game === 'hunt') renderPatternHunt();
  else if(game === 'detective') renderDetective();
  else if(game === 'samurai') renderSamurai();
  else if(game === 'arena') renderArena();
  else renderLocked(game);
  if(scroll) $('play').scrollIntoView({behavior:'smooth', block:'start'});
}
function setMeta(badge,title,desc){
  $('gameBadge').textContent = badge;
  $('gameTitle').textContent = title;
  $('gameDesc').textContent = desc;
}

function renderHeroChart(){
  const svg = $('arcadeHeroChart'); if(!svg) return;
  if(heroTimer) clearInterval(heroTimer);
  let tick = 0;
  const draw = ()=>{
    svg.innerHTML = '';
    const ctx = AI.add('#arcadeHeroChart',560,300,{l:16,r:46,t:16,b:18});
    ctx.scale(0,100); ctx.grid(7,4);
    const candles=[]; let p=42;
    for(let i=0;i<22;i++){
      const wave = Math.sin((i+tick*.2)*.9)*4 + Math.cos((i+tick*.15)*.35)*2;
      const o = p;
      const c = Math.max(14, Math.min(88, p + wave*.18 + (i%5===0?5:-1.2)));
      const h = Math.max(o,c) + 5 + (i%4);
      const l = Math.min(o,c) - 5 - (i%3);
      candles.push({o,h,l,c}); p = c + 1.2;
    }
    candles.forEach((k,i)=>ctx.candle(ctx.xat(i,candles.length), k.o,k.h,k.l,k.c, undefined, {n:candles.length}));
    const y = ctx.y2px(66 + Math.sin(tick*.35)*7);
    ctx.hline(y, '#22d3ee', 'TARGET ZONE', true);
    [...svg.querySelectorAll('g.cndl')].forEach((g,i)=>{
      g.style.opacity = '.38';
      g.style.transform = 'translateY(8px)';
      g.style.transformOrigin = 'center bottom';
      g.style.transition = `opacity 220ms var(--ease-out), transform 220ms var(--ease-out)`;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        g.style.opacity = '1'; g.style.transform = 'translateY(0)';
      }));
      if(i === candles.length-1) g.classList.add('hot-candle');
    });
    tick++;
  };
  draw(); heroTimer = setInterval(draw, 2600);
}

const builderScenarios = [
  {answer:'Hammer reversal', tag:'Wick rejection', trend:'after a downtrend', o:38,h:51,l:14,c:48, why:'The long lower wick says sellers pushed hard, but buyers reclaimed the candle before the close.'},
  {answer:'Shooting star rejection', tag:'Top rejection', trend:'after an uptrend', o:63,h:91,l:55,c:58, why:'The long upper wick says buyers tried to break higher, but sellers rejected the move.'},
  {answer:'Doji / indecision', tag:'Stalemate', trend:'near a decision level', o:55,h:75,l:35,c:55.6, why:'The open and close nearly match. Alone, it means indecision — wait for the break.'},
  {answer:'Bullish momentum candle', tag:'Demand control', trend:'through resistance', o:38,h:73,l:35,c:70, why:'A wide green body closing near the high means buyers controlled most of the round.'},
  {answer:'Bearish momentum candle', tag:'Supply control', trend:'through support', o:70,h:73,l:34,c:37, why:'A wide red body closing near the low means sellers controlled most of the round.'}
];
const builderChoices = ['Bullish momentum candle','Bearish momentum candle','Doji / indecision','Hammer reversal','Shooting star rejection'];

function renderBuilder(){
  setMeta('BEGINNER','Candle Builder','Watch a candle form, then identify what the candle is telling you.');
  const scenario = pick(builderScenarios);
  const board = $('gameBoard');
  board.innerHTML = `
    <div class="play-grid">
      <div class="chart-frame game-chart">
        <div class="game-toolbar"><span class="chip neut">${scenario.tag}</span><button class="btn btn-ghost btn-sm" data-next-builder>New candle</button></div>
        <svg id="builderChart" viewBox="0 0 640 340" role="img" aria-label="Candle builder chart"></svg>
        <div class="cap">Mission: identify the candle ${scenario.trend}.</div>
      </div>
      <div class="mission-card">
        <span class="badge">Candle anatomy</span>
        <h3>What did this candle become?</h3>
        <p class="small">Read the body first, then the wicks. The close tells you who won the candle.</p>
        <div class="choice-stack" id="builderChoices"></div>
        <div class="game-result" id="builderResult">Make the call before the answer appears.</div>
      </div>
    </div>`;
  const ctx = AI.add('#builderChart',640,340,{l:18,r:72,t:18,b:18});
  ctx.scale(0,100); ctx.grid(6,4);
  const before = scenario.answer.includes('Shooting') ?
    [{o:30,h:39,l:28,c:37},{o:37,h:48,l:35,c:46},{o:46,h:59,l:44,c:57},{o:57,h:67,l:55,c:64}] :
    [{o:76,h:79,l:66,c:68},{o:68,h:71,l:58,c:60},{o:60,h:63,l:49,c:51},{o:51,h:54,l:40,c:42}];
  before.forEach((k,i)=>ctx.candle(ctx.xat(i,7), k.o,k.h,k.l,k.c, undefined, {n:7, op:.72}));
  ctx.candle(ctx.xat(5,7), scenario.o, scenario.h, scenario.l, scenario.c, undefined, {n:7});
  ctx.hline(ctx.y2px(scenario.o), '#94a3b8', 'OPEN', true);
  ctx.hline(ctx.y2px(scenario.c), scenario.c>=scenario.o?'#22c55e':'#ef4444', 'CLOSE', true);
  animateCandles($('builderChart'), 150);
  const host = $('builderChoices');
  builderChoices.forEach(choice=>{
    const b = document.createElement('button');
    b.className = 'quiz-opt'; b.textContent = choice;
    b.addEventListener('click',()=>answerBuilder(b, choice, scenario));
    host.appendChild(b);
  });
  board.querySelector('[data-next-builder]').addEventListener('click',()=>switchGame('builder', false));
}
function answerBuilder(btn, choice, scenario){
  const ok = choice === scenario.answer;
  lockChoices('builderChoices', scenario.answer, btn);
  $('builderResult').className = 'game-result ' + (ok?'ok':'bad');
  $('builderResult').innerHTML = `${ok?'✔ Correct':'✘ Not this one'} — <b>${scenario.answer}</b>. ${scenario.why}`;
  completeRound(ok, 40, ok?'Candle read cleanly':'Missed candle anatomy — replay it.');
}

function renderPatternHunt(){
  setMeta('CORE SKILL','Pattern Hunt','Name the setup before the reveal and build recognition streaks.');
  const patterns = AI.candles.filter(p=>p.name !== 'Marubozu');
  const pat = pick(patterns);
  const opts = shuffle([pat, ...shuffle(patterns.filter(p=>p!==pat)).slice(0,3)]);
  const board = $('gameBoard');
  board.innerHTML = `
    <div class="play-grid">
      <div class="chart-frame game-chart scanner-wrap">
        <div class="game-toolbar"><span class="chip ${chipClass(pat.bias)}">Scanning chart...</span><button class="btn btn-ghost btn-sm" data-next-hunt>New setup</button></div>
        <svg id="huntChart" viewBox="0 0 680 340" role="img" aria-label="Pattern hunt chart"></svg>
        <div class="scanner-line" aria-hidden="true"></div>
        <div class="cap">Mission: identify the pattern hiding in the candles.</div>
      </div>
      <div class="mission-card">
        <span class="badge">Pattern hunt</span>
        <h3>Which setup is this?</h3>
        <p class="small">Use context: trend first, then candle body, then wick rejection, then confirmation.</p>
        <div class="choice-stack" id="huntChoices"></div>
        <div class="game-result" id="huntResult">Wait for the final candle, then call the pattern.</div>
      </div>
    </div>`;
  const ctx = AI.add('#huntChart',680,340,{l:16,r:38,t:18,b:18});
  ctx.scale(0,100); ctx.grid(7,4); ctx.title('PATTERN HUNT — ACTIVE RECALL', '#64748b');
  pat.draw(ctx,680,340,{l:16,r:38,t:18,b:18});
  animateCandles($('huntChart'), 140);
  opts.forEach(o=>{
    const b = document.createElement('button');
    b.className = 'quiz-opt'; b.innerHTML = `${o.name} <span class="dim">· ${o.bias}</span>`;
    b.addEventListener('click',()=>answerHunt(b, o, pat));
    $('huntChoices').appendChild(b);
  });
  board.querySelector('[data-next-hunt]').addEventListener('click',()=>switchGame('hunt', false));
}
function answerHunt(btn, selected, pat){
  const ok = selected === pat;
  lockChoices('huntChoices', pat.name, btn);
  $('huntResult').className = 'game-result ' + (ok?'ok':'bad');
  $('huntResult').innerHTML = `${ok?'✔ Pattern spotted':'✘ Pattern missed'} — <b>${pat.name}</b>. ${pat.see} <span class="dim">${pat.fail}</span>`;
  completeRound(ok, 60, ok?'Pattern locked in':'The chart trapped your eye — review the clue.');
}

const detectiveScenarios = [
  {answer:'Fakeout / liquidity trap', name:'Wick above resistance', level:64,
   clue:['Price poked above resistance but closed back below it.','The breakout candle left a long upper wick.','The next candle rejected the same zone again.'],
   why:'A real breakout should close through the level and hold it. This one only wicked above and snapped back — classic fakeout behavior.',
   candles:[{o:35,h:45,l:32,c:43},{o:43,h:55,l:40,c:52},{o:52,h:63,l:49,c:61},{o:61,h:82,l:58,c:60},{o:60,h:67,l:54,c:56},{o:56,h:59,l:45,c:48}]},
  {answer:'Real breakout', name:'Close and retest', level:58,
   clue:['The candle closed above resistance, not just through it.','The next dip retested the level from above.','Buyers defended old resistance as new support.'],
   why:'The close broke the level and the retest held. That is stronger evidence than a wick-only poke.',
   candles:[{o:35,h:42,l:32,c:40},{o:40,h:48,l:38,c:46},{o:46,h:57,l:43,c:55},{o:55,h:70,l:53,c:67},{o:67,h:70,l:58,c:62},{o:62,h:77,l:60,c:74}]},
  {answer:'Wait for retest', name:'Clean break, no retest yet', level:61,
   clue:['The close is above the level.','The candle is extended far from the breakout area.','There is no retest yet, so chasing creates a wide stop.'],
   why:'The break may be real, but the entry is stretched. The disciplined answer is to wait for a retest or a tighter plan.',
   candles:[{o:38,h:45,l:36,c:43},{o:43,h:53,l:41,c:50},{o:50,h:61,l:48,c:59},{o:59,h:84,l:58,c:81},{o:81,h:88,l:76,c:84},{o:84,h:90,l:80,c:87}]}
];
function renderDetective(){
  setMeta('ANTI-TRAP','Fakeout Detective','Inspect the clues and decide whether the breakout is real, fake, or too extended to chase.');
  const s = pick(detectiveScenarios);
  const board = $('gameBoard');
  board.innerHTML = `
    <div class="play-grid">
      <div class="chart-frame game-chart evidence-board">
        <div class="game-toolbar"><span class="chip neut">Case file: ${s.name}</span><button class="btn btn-ghost btn-sm" data-next-detective>New case</button></div>
        <svg id="detectiveChart" viewBox="0 0 680 340" role="img" aria-label="Fakeout detective chart"></svg>
        <div class="cap">Tap clue cards, then deliver your verdict.</div>
      </div>
      <div class="mission-card">
        <span class="badge">Detective mode</span>
        <h3>Is the breakout trustworthy?</h3>
        <div class="clue-grid" id="clues"></div>
        <div class="choice-stack" id="detectiveChoices"></div>
        <div class="game-result" id="detectiveResult">Build the evidence before entering.</div>
      </div>
    </div>`;
  const ctx = AI.add('#detectiveChart',680,340,{l:16,r:96,t:18,b:18});
  ctx.scale(0,100); ctx.grid(7,4); ctx.title('BREAKOUT CASE — CLOSE VS WICK', '#64748b');
  s.candles.forEach((k,i)=>ctx.candle(ctx.xat(i,s.candles.length), k.o,k.h,k.l,k.c, undefined, {n:s.candles.length}));
  ctx.hline(ctx.y2px(s.level), '#f59e0b', 'RESISTANCE', true);
  drawVolumeBars($('detectiveChart'), s.candles, 680, 340);
  animateCandles($('detectiveChart'), 160);
  s.clue.forEach((clue,i)=>{
    const b = document.createElement('button');
    b.className = 'clue-card'; b.innerHTML = `<b>CLUE ${i+1}</b><span>${clue}</span>`;
    b.addEventListener('click',()=>b.classList.toggle('found'));
    $('clues').appendChild(b);
  });
  ['Real breakout','Fakeout / liquidity trap','Wait for retest'].forEach(choice=>{
    const b = document.createElement('button');
    b.className = 'quiz-opt'; b.textContent = choice;
    b.addEventListener('click',()=>answerDetective(b, choice, s));
    $('detectiveChoices').appendChild(b);
  });
  board.querySelector('[data-next-detective]').addEventListener('click',()=>switchGame('detective', false));
}
function answerDetective(btn, choice, s){
  const ok = choice === s.answer;
  lockChoices('detectiveChoices', s.answer, btn);
  document.querySelectorAll('.clue-card').forEach(c=>c.classList.add('found'));
  $('detectiveResult').className = 'game-result ' + (ok?'ok':'bad');
  $('detectiveResult').innerHTML = `${ok?'✔ Case solved':'✘ Bad verdict'} — <b>${s.answer}</b>. ${s.why}`;
  completeRound(ok, 70, ok?'Trap avoided':'The market set a trap — slow down.');
}

const samuraiScenarios = [
  {side:'long', pattern:'Bullish engulfing at support', correct:'Below structure', level:39,
   why:'For a long trade, the idea is wrong if price breaks below the support/swing low that created the reversal.',
   candles:[{o:64,h:67,l:52,c:55},{o:55,h:57,l:44,c:47},{o:47,h:50,l:38,c:40},{o:39,h:63,l:37,c:60},{o:60,h:70,l:57,c:68}]},
  {side:'short', pattern:'Shooting star at resistance', correct:'Above structure', level:70,
   why:'For a short trade, the idea is wrong if price breaks above the rejection high/resistance zone.',
   candles:[{o:35,h:45,l:33,c:43},{o:43,h:55,l:41,c:53},{o:53,h:68,l:51,c:66},{o:67,h:86,l:62,c:64},{o:64,h:67,l:52,c:55}]}
];
function renderSamurai(){
  setMeta('RISK','Stop Loss Samurai','Choose the stop that protects the account and respects the chart structure.');
  const s = pick(samuraiScenarios);
  const board = $('gameBoard');
  const labels = s.side === 'long' ? ['Inside noise','Below structure','Random far away'] : ['Inside noise','Above structure','Random far away'];
  board.innerHTML = `
    <div class="play-grid">
      <div class="chart-frame game-chart samurai-stage">
        <div class="game-toolbar"><span class="chip ${s.side==='long'?'bull':'bear'}">${s.pattern}</span><button class="btn btn-ghost btn-sm" data-next-samurai>New setup</button></div>
        <svg id="samuraiChart" viewBox="0 0 680 340" role="img" aria-label="Stop loss placement chart"></svg>
        <div class="shield" aria-hidden="true">🛡️</div>
        <div class="cap">Mission: put the stop where the setup is invalid — not where fear feels comfortable.</div>
      </div>
      <div class="mission-card">
        <span class="badge">Stop placement</span>
        <h3>Where should the stop go?</h3>
        <p class="small">A stop is not a pain limit. It is the price where your trade idea is proven wrong.</p>
        <div class="choice-stack" id="samuraiChoices"></div>
        <div class="game-result" id="samuraiResult">Choose the shield location.</div>
      </div>
    </div>`;
  const ctx = AI.add('#samuraiChart',680,340,{l:16,r:106,t:18,b:18});
  ctx.scale(0,100); ctx.grid(7,4); ctx.title('STOP LOSS SAMURAI — STRUCTURE FIRST', '#64748b');
  s.candles.forEach((k,i)=>ctx.candle(ctx.xat(i,s.candles.length), k.o,k.h,k.l,k.c, undefined, {n:s.candles.length}));
  ctx.hline(ctx.y2px(s.level), s.side==='long'?'#22c55e':'#ef4444', s.side==='long'?'SUPPORT':'RESISTANCE', true);
  animateCandles($('samuraiChart'), 145);
  labels.forEach(choice=>{
    const b=document.createElement('button'); b.className='quiz-opt'; b.textContent=choice;
    b.addEventListener('click',()=>answerSamurai(b, choice, s));
    $('samuraiChoices').appendChild(b);
  });
  board.querySelector('[data-next-samurai]').addEventListener('click',()=>switchGame('samurai', false));
}
function answerSamurai(btn, choice, s){
  const ok = choice === s.correct;
  lockChoices('samuraiChoices', s.correct, btn);
  const ctx = AI.add('#samuraiChart',680,340,{l:16,r:106,t:18,b:18});
  ctx.scale(0,100);
  const y = ctx.y2px(s.side==='long' ? s.level-4 : s.level+4);
  ctx.hline(y, '#22d3ee', 'SMART STOP', true);
  $('samuraiResult').className = 'game-result ' + (ok?'ok':'bad');
  $('samuraiResult').innerHTML = `${ok?'✔ Shield held':'✘ Shield cracked'} — <b>${s.correct}</b>. ${s.why}`;
  completeRound(ok, 70, ok?'Capital protected':'Stop placement needs structure.');
}

function renderArena(){
  setMeta('LIVE-STYLE','Market Arena','Lock a prediction before the training candle closes, then review the result.');
  const board = $('gameBoard');
  board.innerHTML = `
    <div class="play-grid">
      <div class="chart-frame game-chart arena-stage">
        <div class="game-toolbar"><span class="chip bull" id="arenaFeed">Training feed</span><button class="btn btn-ghost btn-sm" data-next-arena>Restart round</button></div>
        <svg id="arenaChart" viewBox="0 0 700 340" role="img" aria-label="Market Arena chart"></svg>
        <div class="cap" id="arenaCap">Lock UP or DOWN before the candle closes.</div>
      </div>
      <div class="mission-card">
        <span class="badge">Market Arena</span>
        <h3>Predict the next candle</h3>
        <div class="arena-timer"><i id="arenaTimerFill"></i><b id="arenaTimerText">14 ticks</b></div>
        <div class="arena-price mono"><span>BTC-USD</span><b id="arenaPrice">—</b></div>
        <div class="choice-row">
          <button class="btn btn-primary" data-predict="up">UP / Green</button>
          <button class="btn btn-ghost" data-predict="down">DOWN / Red</button>
        </div>
        <div class="game-result" id="arenaResult">No real money. This is decision training only.</div>
      </div>
    </div>`;
  board.querySelector('[data-next-arena]').addEventListener('click',startArenaRound);
  board.querySelectorAll('[data-predict]').forEach(b=>b.addEventListener('click',()=>lockArenaPrediction(b.dataset.predict)));
  cleanup = ()=>{ if(arena.timer) clearInterval(arena.timer); arena.timer=null; };
  startArenaRound();
}
function startArenaRound(){
  if(arena.timer) clearInterval(arena.timer);
  connectCoinbaseFeed();
  arena.price = recentLivePrice() || arena.price || 64250;
  seedArenaCandles(arena.price, false);
  arena.current = {o:arena.price, h:arena.price, l:arena.price, c:arena.price};
  arena.ticks = 0; arena.prediction = null;
  if($('arenaResult')) $('arenaResult').className='game-result';
  if($('arenaResult')) $('arenaResult').textContent='Read the forming candle, then lock your direction.';
  document.querySelectorAll('[data-predict]').forEach(b=>{ b.disabled=false; b.classList.remove('selected'); });
  drawArenaChart();
  arena.timer = setInterval(arenaStep, 650);
}
function connectCoinbaseFeed(){
  if(arena.feedAttempted) return;
  arena.feedAttempted = true;
  try{
    const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    arena.ws = ws;
    ws.onopen = ()=> ws.send(JSON.stringify({type:'subscribe', product_ids:['BTC-USD'], channels:['ticker']}));
    ws.onmessage = e => {
      try{
        const m = JSON.parse(e.data);
        const p = parseFloat(m.price);
        if(Number.isFinite(p)){
          arena.lastFeedPrice = p; arena.lastFeedAt = Date.now(); arena.live = true;
          if(arena.current && arena.ticks < 2 && Math.abs(p-arena.current.o)/Math.max(1, arena.current.o) > .02){
            arena.price = p;
            seedArenaCandles(p, true);
            arena.current = {o:p, h:p, l:p, c:p};
            drawArenaChart();
          }
          if($('arenaFeed')) $('arenaFeed').textContent = 'Live-anchored feed';
        }
      }catch(_e){}
    };
    ws.onerror = ()=>{ arena.live=false; if($('arenaFeed')) $('arenaFeed').textContent='Training feed'; };
  }catch(_e){ arena.live=false; }
}
function recentLivePrice(){
  return arena.lastFeedPrice && Date.now()-arena.lastFeedAt < 5000 ? arena.lastFeedPrice : null;
}
function seedArenaCandles(base, force){
  if(arena.candles.length && !force) return;
  const scale = Math.max(1, base * 0.00011);
  const seeded = [];
  let p = base - scale * 4;
  for(let i=0;i<16;i++){
    const o = p;
    const step = Math.sin(i*.82) * scale*.9 + (((i*37)%11)-5) * scale*.18;
    const c = Math.max(100, o + step);
    const h = Math.max(o,c) + scale*(.55 + (i%4)*.12);
    const l = Math.min(o,c) - scale*(.5 + (i%3)*.13);
    seeded.push({o,h,l,c});
    p = c;
  }
  arena.candles = seeded;
}
function arenaStep(){
  const live = recentLivePrice();
  const base = live || arena.price;
  const scale = Math.max(1, base * 0.000035);
  const drift = Math.sin((stats.played + arena.ticks)*.7)*scale*2.4;
  const randomish = ((stats.xp + arena.ticks*7919) % 17 - 8) * scale*.38;
  const next = Math.max(100, base + drift + randomish);
  arena.price = next;
  arena.current.c = next;
  arena.current.h = Math.max(arena.current.h, next);
  arena.current.l = Math.min(arena.current.l, next);
  arena.ticks += 1;
  drawArenaChart();
  if(arena.ticks >= arena.maxTicks) finishArenaRound();
}
function lockArenaPrediction(dir){
  if(!arena.current || arena.ticks >= arena.maxTicks) return;
  arena.prediction = dir;
  document.querySelectorAll('[data-predict]').forEach(b=>b.classList.toggle('selected', b.dataset.predict===dir));
  $('arenaResult').className = 'game-result ok';
  $('arenaResult').textContent = `Locked ${dir.toUpperCase()}. Now wait for the candle close.`;
}
function finishArenaRound(){
  if(arena.timer) clearInterval(arena.timer); arena.timer=null;
  const dir = arena.current.c >= arena.current.o ? 'up' : 'down';
  arena.candles.push(Object.assign({}, arena.current));
  arena.candles = arena.candles.slice(-22);
  document.querySelectorAll('[data-predict]').forEach(b=>b.disabled=true);
  if(!arena.prediction){
    $('arenaResult').className = 'game-result bad';
    $('arenaResult').innerHTML = `No prediction locked. The candle closed <b>${dir.toUpperCase()}</b>.`;
    return;
  }
  const ok = arena.prediction === dir;
  $('arenaResult').className = 'game-result ' + (ok?'ok':'bad');
  $('arenaResult').innerHTML = `${ok?'✔ Correct read':'✘ Wrong read'} — candle closed <b>${dir.toUpperCase()}</b>. Open ${fmt(arena.current.o)}, close ${fmt(arena.current.c)}.`;
  completeRound(ok, 80, ok?'Arena prediction hit':'Arena round missed — read the close.');
}
function drawArenaChart(){
  const svg = $('arenaChart'); if(!svg || !arena.current) return;
  svg.innerHTML='';
  const all = [...arena.candles.slice(-16), arena.current];
  const prices = all.flatMap(k=>[k.o,k.h,k.l,k.c]);
  let lo = Math.min(...prices), hi = Math.max(...prices);
  if(hi-lo < 20){ hi += 10; lo -= 10; }
  const ctx = AI.add('#arenaChart',700,340,{l:16,r:96,t:18,b:18});
  ctx.scale(lo,hi); ctx.grid(7,4); ctx.title('MARKET ARENA — BTC-USD', '#64748b');
  all.forEach((k,i)=>ctx.candle(ctx.xat(i,Math.max(18,all.length)), k.o,k.h,k.l,k.c, undefined, {n:Math.max(18,all.length)}));
  const y = ctx.y2px(arena.current.o);
  ctx.hline(y, '#94a3b8', 'OPEN', true);
  const remain = Math.max(0, arena.maxTicks-arena.ticks);
  if($('arenaTimerFill')) $('arenaTimerFill').style.transform = `scaleX(${remain/arena.maxTicks})`;
  if($('arenaTimerText')) $('arenaTimerText').textContent = `${remain} ticks`;
  if($('arenaPrice')) $('arenaPrice').textContent = fmt(arena.current.c);
  const last = svg.querySelector('g.cndl:last-of-type');
  if(last) last.classList.add('hot-candle');
}

function renderLocked(game){
  const copy = {
    options:['PRO LAB','Options Payoff Puzzle','Build calls, puts, and spreads until the payoff curve makes sense.'],
    binary:['MATH LAB','Binary Breakeven Lab','Change payout and win rate to see why 50% is not enough.'],
    tycoon:['STOCKS LAB','Portfolio Tycoon','Grow a virtual account by surviving volatility, concentration, and bad decisions.']
  }[game] || ['COMING SOON','Locked Mode','This mode is on the roadmap.'];
  setMeta(copy[0], copy[1], copy[2]);
  $('gameBoard').innerHTML = `
    <div class="locked-preview">
      <div class="lock-orb">🔒</div>
      <h3>${copy[1]} is next on the build list</h3>
      <p class="lead">The slot is visible so the academy feels like a full game map, but the playable v1 focuses on the five modes we can teach well immediately.</p>
      <div class="grid g3">
        <div class="card"><b class="mono small up">VISUAL FIRST</b><p class="small">Every concept gets a chart, diagram, or payoff shape.</p></div>
        <div class="card"><b class="mono small up">INSTANT FEEDBACK</b><p class="small">Users make a decision before the answer is revealed.</p></div>
        <div class="card"><b class="mono small up">NO REAL MONEY</b><p class="small">Practice is virtual and educational only.</p></div>
      </div>
      <button class="btn btn-primary" data-back-builder>Play Candle Builder instead</button>
    </div>`;
  $('gameBoard').querySelector('[data-back-builder]').addEventListener('click',()=>switchGame('builder', true));
}

function drawVolumeBars(svg, candles, W, H){
  const NS='http://www.w3.org/2000/svg';
  const base = H-24, width = (W-120)/candles.length*.45;
  candles.forEach((k,i)=>{
    const vol = 12 + Math.abs(k.c-k.o)*1.4 + (i%2)*6;
    const x = 22 + (i+.5)*(W-120)/candles.length;
    const rect = document.createElementNS(NS,'rect');
    rect.setAttribute('x', x-width/2); rect.setAttribute('y', base-vol);
    rect.setAttribute('width', width); rect.setAttribute('height', vol);
    rect.setAttribute('rx', 2); rect.setAttribute('fill', k.c>=k.o?'#22c55e':'#ef4444'); rect.setAttribute('opacity', .28);
    svg.appendChild(rect);
  });
}
function animateCandles(svg, gap){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  [...svg.querySelectorAll('g.cndl')].forEach((g,i)=>{
    g.style.opacity = '0';
    g.style.transform = 'translateY(12px) scale(.96)';
    g.style.transformOrigin = 'center bottom';
    g.style.transition = `opacity 220ms var(--ease-out) ${i*gap}ms, transform 220ms var(--ease-out) ${i*gap}ms`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ g.style.opacity='1'; g.style.transform='translateY(0) scale(1)'; }));
  });
}
function lockChoices(hostId, correctText, clicked){
  const host = $(hostId);
  [...host.querySelectorAll('button')].forEach(b=>{
    b.disabled = true;
    const clean = b.textContent.replace(/·.*$/,'').trim();
    if(clean === correctText) b.classList.add('correct');
  });
  if(clicked && !clicked.classList.contains('correct')) clicked.classList.add('wrong');
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function chipClass(bias){ return bias==='Bullish'?'bull':bias==='Bearish'?'bear':'neut'; }
function fmt(n){ return Number(n).toLocaleString(undefined,{maximumFractionDigits:n>1000?2:4}); }
function toast(msg, tone){
  const t = document.createElement('div');
  t.className = `arcade-toast ${tone||'neut'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(), 240); }, 2100);
}
function burst(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
})();
