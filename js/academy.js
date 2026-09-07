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

let prog = load();
let current = null;            // open lesson id
let bossState = null;          // active boss run
let freeGame = null;           // free-play game id
const themeFns = [];

function load(){
  try{
    const raw = localStorage.getItem(STORE);
    if(raw) return Object.assign({xp:0, played:0, right:0, streak:0, best:0, done:{}}, JSON.parse(raw));
  }catch(_e){}
  return {xp:0, played:0, right:0, streak:0, best:0, done:{}};
}
function save(){ try{ localStorage.setItem(STORE, JSON.stringify(prog)); }catch(_e){} }

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

/* ── curriculum ────────────────────────────────────── */
function patternLesson(name, extra){
  const pat = AI.candles.find(p=>p.name===name);
  return {
    steps:[
      {h:'What you see', p:pat.see, c:{pat:name}},
      {h:'What it means', p:pat.means},
      {h:'How it is traded', p:pat.how},
      {h:'How it fails', p:pat.fail}
    ],
    check: extra && extra.check || [
      {q:`A ${name.replace('Bullish ','').replace('Bearish ','')} appears. What should you confirm first?`,
       opts:['That the context matches — trend and location','That your position size is doubled','That the next 10 candles agree','Nothing — the candle is enough'],
       a:0, why:'A pattern is a setup, not a promise. Context — the trend it appears in and the level it appears at — is what turns a candle into a signal.'}
    ]
  };
}

const CURRICULUM = [
{ id:'u1', title:'Chart Basics', tag:'Read a chart without fear', lessons:[
  { id:'u1l1', title:'What a chart actually is', blurb:'Scoreboards, timeframes, and the only three questions that matter.', xp:60,
    steps:[
      {h:'A chart is a scoreboard', p:'Every trade is a tug-of-war between buyers and sellers. A price chart just draws the score over time: higher means buyers won that stretch, lower means sellers did.', c:{arr:[[50,56,47,54],[54,60,52,58],[58,66,55,64],[64,60,50,52],[52,48,40,42],[42,50,40,49],[49,58,47,56],[56,52,44,46],[46,54,44,53],[53,62,51,60]], title:'PRICE OVER TIME — UP STRETCHES, DOWN STRETCHES'}},
      {h:'Timeframes: same market, different zoom', p:'Each candle summarizes one slice of time — 1 minute, 15 minutes, 1 day. The market is the same; the zoom changes. Beginners should start on higher timeframes where there is less noise.', c:{arr:[[40,44,38,42],[42,52,40,50],[50,58,48,56],[56,66,54,64],[64,74,62,72],[72,80,70,78]], title:'EACH CANDLE = ONE SLICE OF TIME', gap:150}},
      {h:'Only three questions', p:'Every good read answers the same three things: <b>Which direction is the trend?</b> <b>Where are the levels?</b> <b>Who won the last candle?</b> Everything on this site trains those three questions.', c:{arr:[[70,74,64,66],[66,70,60,62],[62,66,50,52],[52,56,42,44],[44,54,42,52],[52,62,50,60]], title:'TREND DOWN · LEVEL ~44 · LAST CANDLE WON BY BUYERS', lines:[{y:44,label:'LEVEL'}]}}
    ],
    check:[
      {q:'A green candle means…', opts:['The price closed above where it opened','Everyone made money','The market will keep rising','Volume was high'], a:0, why:'Green simply says buyers won that slice of time: the close finished above the open. It says nothing about the next candle.'},
      {q:'You are new and overwhelmed by a 1-minute chart. The best first move is…', opts:['Zoom out to a higher timeframe','Trade faster','Add more indicators','Refresh the page'], a:0, why:'Higher timeframes show clearer structure with less noise. Speed comes later; clarity comes first.'}
    ]},
  { id:'u1l2', title:'Anatomy of a candle', blurb:'Open, high, low, close — and why the wicks tell the truth.', xp:60,
    steps:[
      {h:'One candle, four prices', p:'Each candle packs four numbers: where trading <b>opened</b>, the <b>high</b>, the <b>low</b>, and where it <b>closed</b>. The body stretches from open to close; the wicks reach the extremes.', c:{fn:'anatomy'}},
      {h:'The close is the verdict', p:'The close is the most important price on the candle. If buyers push price up all session but it closes near the open, the "rally" changed nothing. Always ask: <b>where did it end?</b>'},
      {h:'Wicks are rejection receipts', p:'A long lower wick means sellers dove and buyers slapped the price back up before the candle closed. The market visited that price and said no. That memory matters at levels.', c:{arr:[[55,58,40,56],[56,57,48,55]], title:'LONG LOWER WICK = THE LOW WAS REJECTED'}}
    ],
    check:[
      {q:'The body of a candle spans…', opts:['Open to close','High to low','Volume to price','Yesterday to today'], a:0, why:'Open-to-close is the body. The wicks only show how far price traveled beyond it.'},
      {q:'A candle with a tiny body and a very long lower wick just fell to a support level. Most likely story?', opts:['Sellers tried to break it and buyers rejected the low','Buyers gave up','Nothing — candles are random','The market is closed'], a:0, why:'A long lower wick at support is a rejection receipt: sellers pushed down, buyers defended. That is the seed of a hammer, which you meet in Unit 2.'}
    ]},
  { id:'u1l3', title:'Bodies, wicks, and conviction', blurb:'Big bodies mean one side dominated. Small bodies mean a stalemate.', xp:60,
    steps:[
      {h:'Big body = conviction', p:'A wide body with almost no wicks means one side controlled the whole session. Green: demand ran the show. Red: supply did. These are <b>momentum candles</b>.', c:{arr:[[40,76,38,74]], title:'FULL-BODY GREEN — PURE DEMAND', gap:150}},
      {h:'Small body = stalemate', p:'A candle that opens and closes nearly at the same price is a draw — indecision. On its own it predicts nothing; what matters is which side breaks out next.', c:{arr:[[52,64,40,53]], title:'OPEN ≈ CLOSE — A DRAW', gap:150}},
      {h:'Size is relative', p:'"Big" only means something next to recent candles. Compare every body to the last 10 candles, not to your feelings. This habit becomes automatic once you have seen a few hundred charts.'}
    ],
    check:[
      {q:'A huge green candle just printed mid-range with no level nearby. You should…', opts:['Note the momentum but wait for a level','Buy instantly','Assume the trend reversed','Sell everything'], a:0, why:'Momentum without location is just energy. Energy at a level is a setup. Patience between the two is what Unit 5 builds on.'}
    ]}
]},
{ id:'u2', title:'Single-Candle Signals', tag:'The vocabulary of one candle', lessons:[
  Object.assign({ id:'u2l1', title:'The Doji — indecision', blurb:'Open meets close. The market holds its breath.', xp:60 }, patternLesson('Doji', {check:[
    {q:'A doji prints at a major resistance level after a long rally. Correct read?', opts:['Momentum is stalling here — watch which side breaks','Buy immediately — dojis are bullish','The trend is guaranteed to reverse','Dojis only matter on Mondays'], a:0, why:'A doji at an extreme is a warning light, not a signal. The trade is the break of the doji, not the candle itself.'}
  ]})),
  Object.assign({ id:'u2l2', title:'The Hammer — rejection of the low', blurb:'Sellers dove, buyers slammed the door.', xp:60 }, patternLesson('Hammer', {check:[
    {q:'What turns "a candle with a long lower wick" into a hammer?', opts:['It appears after a downtrend, with the close near the top','It is green','It has no upper wick at all','It prints on high timeframe only'], a:0, why:'Context and shape together: the same wick in an uptrend is just noise. The hammer is a rejection of lows in a decline.'}
  ]})),
  Object.assign({ id:'u2l3', title:'The Shooting Star — rejection of the high', blurb:'The rally that got slapped back.', xp:60 }, patternLesson('Shooting Star', {check:[
    {q:'A shooting star appears mid-uptrend with no level in sight. Best action?', opts:['Wait — a star means most at a level or the end of a move','Short with full size immediately','Ignore all stars forever','Buy the dip'], a:0, why:'In a strong uptrend a lone star is often just a pause. Location first, candle second.'}
  ]})),
  Object.assign({ id:'u2l4', title:'The Marubozu — the statement candle', blurb:'No wicks, no debate: one side took the whole session.', xp:60 }, patternLesson('Marubozu', {check:[
    {q:'A green marubozu blasts through a resistance level. The textbook play is…', opts:['The breakout entry, stop below the candle low','Buy the next ten candles blindly','Short against it','Do nothing, ever'], a:0, why:'A full-body candle closing through a level is the cleanest breakout print. The invalidation is simple: back below the candle low means the break failed.'}
  ]}))
]},
{ id:'u3', title:'Multi-Candle Stories', tag:'Two and three candles arguing', lessons:[
  { id:'u3l1', title:'Engulfing — one side swallows the other', blurb:'The most reliable two-candle reversal story.', xp:60,
    steps:[
      {h:'The bullish story', p:'A small red candle, then a green candle whose body swallows it whole. Sellers pressed, buyers answered with everything. That is a momentum flip in one bar.', c:{pat:'Bullish Engulfing'}},
      {h:'The bearish mirror', p:'Same script inverted after a rally: a big red body swallows the small green one. Late buyers are suddenly underwater.', c:{pat:'Bearish Engulfing'}},
      {h:'Quality control', p:'The engulfing body must clearly dwarf the swallowed one, and the pattern needs a real trend behind it. A "kind of big" candle in sideways chop is not an engulfing — it is a coin flip.', c:{arr:[[50,55,45,48],[48,60,46,58],[58,63,55,61]], title:'CHOP — SMALL BODIES ARE NOT A SIGNAL', gap:150}}
    ],
    check:[
      {q:'A bullish engulfing works best when it appears…', opts:['After a clear decline, ideally at support','In the middle of a tight range','Only on 1-minute charts','After three green candles'], a:0, why:'Trend + location: the story is "sellers had control, buyers took it back." No prior decline means no story.'}
    ]},
  { id:'u3l2', title:'Morning & Evening Stars', blurb:'The three-act reversal: pressure, pause, confirmation.', xp:60,
    steps:[
      {h:'Act one, two, three', p:'A strong candle continues the trend, a small-bodied candle pauses (the star), then a strong candle snaps back into the first body. Three candles, one complete argument.', c:{pat:'Morning Star'}},
      {h:'The evening mirror', p:'After a rally: strong green, small pause on top, strong red back into the first body. The last buyers of the move are now the fuel of the drop.', c:{pat:'Evening Star'}},
      {h:'Why three beats one', p:'Each candle removes an excuse: the first proves the trend existed, the pause proves it stalled, the third proves the flip. More evidence, fewer traps — at the cost of a later entry.'}
    ],
    check:[
      {q:'The third candle of a morning star must…', opts:['Close well into the body of the first candle','Be the biggest candle ever printed','Gap down','Be red'], a:0, why:'Confirmation is the point: without a strong close back into the first body, the "star" was just a rest stop.'}
    ]},
  { id:'u3l3', title:'Harami & Tweezers', blurb:'Inside bodies and matching extremes: quieter, earlier warnings.', xp:60,
    steps:[
      {h:'The harami (pregnant candle)', p:'A very long candle, then a small one whose whole body fits inside it. The storm stopped mid-sentence. It is an early warning, not an entry trigger.', c:{pat:'Bullish Harami'}},
      {h:'Tweezers — the double tap', p:'Two adjacent candles whose lows (bottom) or highs (top) match almost exactly. The same price was tested twice and held. Best next to obvious levels.', c:{pat:'Tweezer Bottom'}}
    ],
    check:[
      {q:'A bullish harami appears. The textbook treatment is…', opts:['A warning to watch — buy only a break above the mother candle','An instant all-in buy','Proof the uptrend is back','A reason to delete the chart'], a:0, why:'Haramis shift the balance of power; the trigger comes when price actually breaks the mother candle high.'}
    ]},
  { id:'u3l4', title:'Soldiers & Crows', blurb:'Three candles of relentless stair-stepping.', xp:60,
    steps:[
      {h:'Three white soldiers', p:'Three strong green candles, each opening inside the prior body and closing near its high. Not a spike — a regime change with receipts.', c:{pat:'Three White Soldiers'}},
      {h:'Three black crows', p:'The bearish twin after a rally: every bounce gets sold before the close, three days running.', c:{pat:'Three Black Crows'}},
      {h:'The fatigue check', p:'If each new body shrinks or the wicks grow, the march is tiring. Strongest when they end the opposite move — three green candles in the middle of a range are just traffic.'}
    ],
    check:[
      {q:'Three shrinking green candles after a huge drop most likely mean…', opts:['A weak bounce — check the bigger trend before trusting it','Guaranteed reversal','Time to short instantly','Nothing observable'], a:0, why:'Momentum that fades candle by candle is a bounce until proven otherwise. Context outranks the count.'}
    ]}
]},
{ id:'u4', title:'Chart Patterns', tag:'Structure: levels, trends, and shapes', lessons:[
  { id:'u4l1', title:'Support & resistance', blurb:'Floors, ceilings, and the memory of price.', xp:60,
    steps:[
      {h:'Levels are memories', p:'Where price stalled or reversed before, it tends to react again — orders pile up at remembered prices. Support is a floor being defended; resistance is a ceiling being sold.', c:{arr:[[30,38,28,36],[36,52,34,50],[50,54,40,42],[42,50,40,49],[49,56,47,54],[54,60,52,58]], title:'PRIOR HIGH BECOMES THE NEXT CEILING', lines:[{y:52,label:'RESISTANCE',color:'red'}]}},
      {h:'Roles flip at a break', p:'When a ceiling finally breaks, it often becomes the new floor — old resistance turns support. That flip is the backbone of retest trading in Unit 5.', c:{arr:[[40,46,38,44],[44,58,42,56],[56,60,50,52],[52,56,48,55],[55,64,53,62]], title:'BROKEN CEILING (56) NOW ACTS AS A FLOOR', lines:[{y:56,label:'FLIPPED LEVEL',color:'green'}]}}
    ],
    check:[
      {q:'Price broke above resistance and came back to touch it from above. This level is now often…', opts:['Support — buyers defend old ceilings','Stronger resistance than before','Irrelevant','A guarantee'], a:0, why:'The role flip is the whole basis of the retest entry: old resistance, once broken, is defended by the buyers who created the break.'}
    ]},
  { id:'u4l2', title:'Trends: higher highs, lower lows', blurb:'Trend is the water you swim in. Names come later.', xp:60,
    steps:[
      {h:'What a trend is', p:'An uptrend is a staircase of higher highs and higher lows. A downtrend is the mirror. Range is a hallway: price bounces between two walls with no staircase at all.', c:{arr:[[20,28,18,26],[26,34,24,32],[32,38,28,36],[36,44,34,42],[42,50,40,48]], title:'UPTREND — HIGHER HIGHS, HIGHER LOWS', gap:130}},
      {h:'Trendline intuition', p:'Lay a line under the lows of an uptrend (or over the highs of a downtrend). The third touch makes it a line worth watching; the break of it is the trend asking a question.'},
      {h:'Trade with the water', p:'Beginner rule that survives contact with real markets: patterns against the trend fail more. A hammer in an uptrend pullback is a trade; the same wick against a freight-train downtrend is a hope.'}
    ],
    check:[
      {q:'A "range" market means…', opts:['Price bounces between two horizontal walls','Price only goes up','No candles print','Trendlines do not exist'], a:0, why:'Ranges are hallways: defined walls, no staircase. Breakout trades in Unit 5 live at the edges of exactly this structure.'}
    ]},
  { id:'u4l3', title:'Double tops & double bottoms', blurb:'The M and the W: a level tested twice, then a verdict.', xp:60,
    steps:[
      {h:'The M (double top)', p:'Price rallies to a peak, sells off, and rallies back to nearly the same price — then fails again. Two failed attempts at the same ceiling weaken the buyers behind it.', c:{zig:'Double Top'}},
      {h:'The W (double bottom)', p:'The mirror: two defenses of the same floor, then a breakout through the middle bump. The seller who could not make a new low is in trouble.', c:{zig:'Double Bottom'}},
      {h:'The trigger and the trap', p:'The trade is the break of the valley (or bump) between the two peaks — not the second touch itself. And the two extremes must genuinely match: a clearly higher second high is a different animal.'}
    ],
    check:[
      {q:'The double top trade triggers when…', opts:['Price breaks below the low between the two peaks','The first peak prints','Price touches the ceiling twice','Volume disappears'], a:0, why:'The second peak only sets the stage. The verdict is the break of the middle low.'}
    ]},
  { id:'u4l4', title:'Head & Shoulders', blurb:'Three peaks, a neckline, and a fading heartbeat.', xp:60,
    steps:[
      {h:'The shape', p:'Left shoulder, higher head, right shoulder about level with the left. The valleys between them draw the neckline. It is a double top with a middle attempt that overstayed its welcome.', c:{zig:'Head & Shoulders'}},
      {h:'Why it forms', p:'Each rally after the head is weaker — buyers keep showing up with less money. The neckline break is the moment the market admits it.', c:{zig:'Inverse Head & Shoulders'}},
      {h:'The inverse twin', p:'Upside-down after a downtrend: three troughs, a neckline across the peaks, and a break up as the buy trigger.'}
    ],
    check:[
      {q:'The classic H&S entry is…', opts:['A close below the neckline','The top of the head','The left shoulder high','The first valley'], a:0, why:'The neckline is the verdict line. Everything before the break is a suspect lineup, not a conviction.'}
    ]},
  { id:'u4l5', title:'Triangles — compression before release', blurb:'Flat tops, rising bottoms, and squeezes.', xp:60,
    steps:[
      {h:'Ascending: squeeze up', p:'A flat ceiling with rising lows — buyers pay more each time while sellers defend one price. Compression usually releases upward.', c:{zig:'Ascending Triangle'}},
      {h:'Descending: squeeze down', p:'A flat floor with lower highs pressing into it. Supply gets more aggressive each bounce. Mirror logic, bearish release — though about a third break up, so demand a decisive close.', c:{zig:'Descending Triangle'}},
      {h:'The universal tell', p:'Inside any triangle, volume and range tend to dry up. A "breakout" on rising range before the real break is often the fake — Unit 5 makes you a detective for exactly this.'}
    ],
    check:[
      {q:'An ascending triangle is a bet that…', opts:['Rising demand breaks the flat ceiling','The ceiling gets stronger','Price stops moving forever','Lows will collapse'], a:0, why:'Rising lows against a flat top is buyers accepting worse prices to get in — the squeeze resolves up more often than not.'}
    ]},
  { id:'u4l6', title:'Flags, wedges & the cup', blurb:'Pauses, dying momentum, and slow rotations.', xp:60,
    steps:[
      {h:'The bull flag', p:'A near-vertical rally (the pole), then a tight, slightly falling drift (the flag) — profit-taking, not selling. The break above the flag continues the pole.', c:{zig:'Bull Flag'}},
      {h:'Wedges — momentum dying', p:'Both lines rise but lows rise faster (rising wedge): each push costs more for less. The break usually comes through the steeper line, downward.', c:{zig:'Rising Wedge'}},
      {h:'Cup & handle', p:'A rounded U base, then a small drift near the rim — the final shakeout before breakout. A V-shaped cup is too violent to be accumulation; the handle deeper than a third of the cup is a failed setup.', c:{zig:'Cup & Handle'}}
    ],
    check:[
      {q:'A flag that drifts down more than half the pole with rising volume is probably…', opts:['Turning into a top, not a flag','A stronger flag','A guarantee of breakout','A cup forming'], a:0, why:'A flag is a calm pause on fading interest. Real selling pressure during the drift invalidates the continuation idea.'}
    ]}
]},
{ id:'u5', title:'Traps & Breakouts', tag:'Where beginners lose money — and how not to', lessons:[
  { id:'u5l1', title:'What a breakout really is', blurb:'A level loses a fight in public.', xp:60,
    steps:[
      {h:'The honest definition', p:'A breakout is a close beyond a level that mattered — not a wick, not a hope. Levels with many touches and visible reactions are the ones worth breaking.', c:{arr:[[40,46,38,44],[44,50,42,48],[48,56,46,54],[54,68,52,66]], title:'CLOSE ABOVE THE LEVEL — A REAL BREAK', lines:[{y:56,label:'BROKEN',color:'red'}]}},
      {h:'Why breakouts attract crowds', p:'Stop orders and FOMO pile just beyond obvious levels. That crowd is the liquidity that makes fakeouts profitable — for someone else. Knowing the trap exists is half the escape.'}
    ],
    check:[
      {q:'The strongest evidence of a real breakout is…', opts:['A decisive close beyond the level','A long wick through it','You feel excited','The level was tested once'], a:0, why:'Closes commit; wicks visit. A wick through a level that snaps back is the anatomy of a fakeout.'}
    ]},
  { id:'u5l2', title:'Fakeouts & liquidity', blurb:'The poke, the snap-back, and who it feeds.', xp:60,
    steps:[
      {h:'Anatomy of a fakeout', p:'Price pokes above resistance, leaves a long upper wick, and closes back below. Everyone who bought the poke is now trapped — their selling adds fuel to the fall.', c:{arr:[[35,45,32,43],[43,55,40,52],[52,63,49,61],[61,82,58,60],[60,67,54,56]], title:'WICK ABOVE, CLOSE BELOW — THE FAKEOUT', lines:[{y:64,label:'RESISTANCE',color:'red'}]}},
      {h:'Think in stops, not signals', p:'Obvious levels have obvious stop placements just beyond them. The market pokes those stops, fills large orders into them, and continues. It is not a conspiracy; it is an order book.'}
    ],
    check:[
      {q:'A candle wicks far above resistance but closes below it. Most useful conclusion?', opts:['The break was rejected — trapped longs may sell','The breakout succeeded','Support is broken','Nothing observable'], a:0, why:'A wick visit with a close back inside is rejection. The trapped breakout buyers become the next source of selling.'}
    ]},
  { id:'u5l3', title:'Retests & confirmation', blurb:'Let the level prove it flipped before you pay for it.', xp:60,
    steps:[
      {h:'The retest script', p:'Break, then pullback to the old level from the new side. If it holds — old ceiling as new floor — the break earned trust. Entry on the hold, stop just on the wrong side of the level.', c:{arr:[[35,42,32,40],[40,48,38,46],[46,57,44,55],[55,70,53,68],[68,71,58,62],[62,66,57,65]], title:'BREAK, RETEST, HOLD — THE SCRIPT', lines:[{y:57,label:'RETEST ZONE',color:'green'}]}},
      {h:'When there is no retest', p:'Some breaks run without looking back. Chasing them means a wide stop and worse math. The disciplined answer is: wait for the next retest, or let the trade go. Missed money is safer than lost money.'}
    ],
    check:[
      {q:'Price broke out and is now stretched far from the level with no pullback. You should…', opts:['Wait for a retest or skip the trade','Market-buy the top','Short the trend immediately','Double your size'], a:0, why:'The retest is both entry and evidence. Skipping a stretched chase costs nothing; catching the reversal costs real money.'}
    ]}
]},
{ id:'u6', title:'Risk Comes First', tag:'Survive first, profit second', lessons:[
  { id:'u6l1', title:'Stops are structure', blurb:'Where the idea is wrong — not where fear lives.', xp:60,
    steps:[
      {h:'The only honest place', p:'A stop belongs where your read is <b>proven wrong</b>: below the swing low that created a long setup, above the high that created a short. Anywhere else is a pain tolerance, not a plan.', c:{arr:[[64,67,52,55],[55,57,44,47],[47,50,38,40],[39,63,37,60]], title:'LONG SETUP — THE IDEA DIES BELOW THE LOW (37)', lines:[{y:36,label:'STOP',color:'red'}]}},
      {h:'Tight vs wide', p:'A stop inside the noise gets hit by traffic even when the idea was right. A stop a mile away makes every loss enormous. Structure decides the stop; position size adapts to the stop.'}
    ],
    check:[
      {q:'You go long on a hammer at support. The structural stop goes…', opts:['Just below the hammer wick / support low','A fixed 2% away, ignoring the chart','Above the hammer high','Wherever feels brave'], a:0, why:'If that low breaks, the rejection story is false. That is the definition of "idea proven wrong."'},
      {q:'A stop that is too tight (inside the noise) mainly causes…', opts:['Getting knocked out by random wiggle','Bigger wins','Better sleep','Free entries'], a:0, why:'Noise will visit your stop before the idea gets its chance. Room to breathe, sized down to afford it.'}
    ]},
  { id:'u6l2', title:'R-multiples: the honest scoreboard', blurb:'Wins and losses in units of risk.', xp:60,
    steps:[
      {h:'Think in R', p:'1R = the amount you risk per trade (distance to your stop, in money). A win of 2R means you made twice what you risked. Judge months, not trades: ten trades at +1R with four losers at -1R is a +6R month.', table:[['Outcome','R','Example ($100 risk)'],['Full stop-out','-1R','-$100'],['Scratch / time stop','0R','$0'],['Target one','+2R','+$200'],['Runner','+3.4R','+$340']]},
      {h:'Win rate is not the point', p:'A 40% win rate with 2R winners is comfortably profitable; an 80% win rate with -3R losers is a slow bleed. What matters is the <b>average R</b> across many trades — expectancy.'}
    ],
    check:[
      {q:'You risk $50 and make $150. In R terms that is…', opts:['+3R','+1.5R','+$150R','50%'], a:0, why:'150 ÷ 50 = 3. R-multiples keep every trade comparable no matter the size.'},
      {q:'Which trader is most likely profitable over 100 trades?', opts:['35% wins averaging +2.5R, losses -1R','90% wins with -5R losses','50% wins at +0.3R, losses -1R','One 100R winner out of 100 losers'], a:0, why:'0.35×2.5 − 0.65×1 = +0.225R per trade. Positive expectancy, sustained, is the only formula that matters.'}
    ]},
  { id:'u6l3', title:'The 1% rule', blurb:'Size so that being wrong is boring.', xp:60,
    steps:[
      {h:'The arithmetic', p:'Risk at most 1% of the account per trade. With a $2,000 account that is $20 of risk. If your stop is $5 away (per share/unit), the position is $20 ÷ $5 = 4 units. The chart sets the stop; the rule sets the size.'},
      {h:'Why 1%', p:'Because losing streaks are normal, not bad luck. Ten losses in a row at 1% is a -9.6% dent; at 10% per trade it is ruin. Survival is the strategy that lets skill compound.'},
      {h:'Practice like it matters', p:'In the practice arena, keep a fake account and honor a fake 1% rule. The habits you rehearse with pretend money are the ones that appear when money is real.'}
    ],
    check:[
      {q:'Account $1,000, 1% rule, stop distance $2 per unit. Position size is…', opts:['5 units','50 units','500 units','1 unit'], a:0, why:'$10 risk ÷ $2 per unit = 5 units. Small enough to survive, big enough to matter.'}
    ]}
]},
{ id:'u7', title:'The Live Lab', tag:'Real data, zero money', lessons:[
  { id:'u7l1', title:'Reading a live chart', blurb:'The same three questions, now in real time.', xp:60,
    steps:[
      {h:'What changes when data is live', p:'The last candle is still forming — its close can move until the clock runs out. Everything you learned applies; you just watch answers update in real time. That uncertainty is the actual skill being trained.'},
      {h:'Where the data comes from', p:'Live Practice connects to public, keyless exchange feeds (Binance, with Coinbase as backup) — the same prices traders watch, streamed to your browser for practice only. No account, no deposits, no real money anywhere.'},
      {h:'Your first live read', p:'Open the arena, pick a coin, and just narrate: trend? nearest level? who is winning the current candle? Predict the next candle. Then watch what actually happens. That loop — call, watch, review — is the whole game.'}
    ],
    check:[
      {q:'On a live chart, the last candle…', opts:['Can still change until it closes','Is always green','Is the most reliable pattern','Cannot be read'], a:0, why:'A forming candle is a draft. Its close is the verdict — which is why timing entries near the close matters.'}
    ]},
  { id:'u7l2', title:'The pre-call script', blurb:'A 10-second checklist before every prediction.', xp:60,
    steps:[
      {h:'The script', p:'<b>1.</b> Trend: up, down, or range? <b>2.</b> Level: what is the nearest floor/ceiling? <b>3.</b> Candle: who won the last complete one? <b>4.</b> Call: does the next candle follow the script or fight it? <b>5.</b> Write the call before the reveal.'},
      {h:'Why writing it matters', p:'A call you said out loud can be graded. A vague feeling cannot. The arena tracks your accuracy and streak precisely so your eye gets honest feedback instead of memories that flatter you.'}
    ],
    check:[
      {q:'The most important habit the script builds is…', opts:['Deciding before the outcome is known','Trading bigger','Predicting every candle','Ignoring trends'], a:0, why:'Committing to a call first is what makes the review honest. Feedback after commitment is how eyes get trained.'}
    ]},
  { id:'u7l3', title:'Keep the streak honest', blurb:'Small samples lie. Routines do not.', xp:60,
    steps:[
      {h:'Judge batches, not moments', p:'Ten predictions mean almost nothing. Fifty to a hundred rounds start to mean something. Log a session, note accuracy, and look for drift: are you better on trending days? On higher timeframes?'},
      {h:'What practice can and cannot do', p:'Practice builds pattern recognition, discipline, and calm. It cannot make markets predictable — nobody can. The skill being trained is reading structure and managing decisions, and it transfers to every market you ever touch.'}
    ],
    check:[
      {q:'After 15 arena rounds you are at 80%. The honest conclusion is…', opts:['A promising start — keep logging; 15 is a small sample','You have mastered the market','Predictions are guaranteed now','Time to trade rent money'], a:0, why:'Small samples flatter everyone. The number that matters is the one across hundreds of logged rounds.'}
    ]}
]}
];

/* boss + final nodes appended to units */
const BOSSES = {
  u1:{id:'u1boss', title:'Candle Gauntlet', blurb:'Four candles. Read three correctly to clear the unit.', xp:120, game:'builder', need:3, total:4},
  u2:{id:'u2boss', title:'Signal Sprint', blurb:'Single-candle signals, quick-fire. Three of four to pass.', xp:120, game:'huntSingles', need:3, total:4},
  u3:{id:'u3boss', title:'Story Seeker', blurb:'Multi-candle stories only. Three of four to pass.', xp:120, game:'huntMulti', need:3, total:4},
  u4:{id:'u4boss', title:'Shape Match', blurb:'Name the chart structure. Four of five to pass.', xp:120, game:'shape', need:4, total:5},
  u5:{id:'u5boss', title:'Detective Cases', blurb:'Three breakout cases. Read two correctly to pass.', xp:120, game:'detective', need:2, total:3},
  u6:{id:'u6boss', title:'Stop Samurai', blurb:'Three setups, three stops. Two clean shields to pass.', xp:120, game:'samurai', need:2, total:3}
};

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
      shuffle(choices).forEach(ch=>{
        const b = document.createElement('button');
        b.className='quiz-opt'; b.textContent = ch;
        b.addEventListener('click',()=>{
          const ok = ch === S.answer;
          lockChoices(host, S.answer, b);
          const r = board.querySelector('[data-result]');
          r.className = 'game-result ' + (ok?'ok':'bad');
          r.innerHTML = `${ok?'Correct':'Not this one'} — <b>${S.answer}</b>. ${S.why}`;
          done(ok);
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
          done(ok);
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
          done(ok);
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
      shuffle(['Real breakout','Fakeout / liquidity trap','Wait for retest']).forEach(ch=>{
        const b = document.createElement('button');
        b.className='quiz-opt'; b.textContent = ch;
        b.addEventListener('click',()=>{
          const ok = ch === S.answer;
          lockChoices(host, S.answer, b);
          board.querySelectorAll('.clue-card').forEach(c=>c.classList.add('found'));
          const r = board.querySelector('[data-result]');
          r.className = 'game-result ' + (ok?'ok':'bad');
          r.innerHTML = `${ok?'Case solved':'Bad verdict'} — <b>${S.answer}</b>. ${S.why}`;
          done(ok);
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
      shuffle(labels).forEach(ch=>{
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
          done(ok);
        });
        host.appendChild(b);
      });
    }
  };}
};
GAMES.huntSingles = ()=>GAMES.hunt(p=>['Doji','Hammer','Shooting Star','Marubozu'].includes(p.name));
GAMES.huntMulti = ()=>GAMES.hunt(p=>!['Doji','Hammer','Shooting Star','Marubozu'].includes(p.name));

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
function recordRound(ok, xp, msg){
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
  game.round(board, (ok)=>{
    st.round++;
    if(ok) st.right++;
    recordRound(ok, Math.round(l.xp/l.total/2), ok?game.tag+' rep':'boss rep missed');
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
  game.round(board, (ok)=>{ recordRound(ok, Math.round(game.xp/2), ok?'free-play rep':'free-play miss'); });
  $('freeNext').onclick = ()=>{ board.innerHTML=''; game.round(board, (ok)=>recordRound(ok, Math.round(game.xp/2), ok?'free-play rep':'free-play miss')); };
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
  renderPath();
  updateHud();
  $('resetArcade').addEventListener('click',()=>{
    prog = {xp:0,played:0,right:0,streak:0,best:0,done:{}};
    save(); updateHud(); renderPath();
    if(current) closeLesson();
    toast('Progress reset. Fresh chart, fresh mind.', 'neut');
  });
  document.querySelectorAll('[data-game]').forEach(btn=>{
    btn.addEventListener('click',()=>startFreeGame(btn.dataset.game));
  });
  // deep link: /academy/#u2l3
  if(location.hash && location.hash.length>1){
    const id = decodeURIComponent(location.hash.slice(1));
    if(ORDER.some(l=>l.id===id)) setTimeout(()=>openLesson(id), 250);
  }
  AI.themeHooks.push(()=>renderPath());
};
})();
