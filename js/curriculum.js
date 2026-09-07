/* ═══════════════════════════════════════════════════════════════
   TheAI101 curriculum data — shared by the academy runtime and the
   lesson-page build script (tools/build-lessons.mjs). UMD-safe.
   Requires js/patterns-data.js to be loaded first (patternLesson
   resolves names against AI.candles at load time).
   ═══════════════════════════════════════════════════════════════ */
(function(root){
'use strict';
const AI = root.AI = root.AI || {};

/* ── curriculum ────────────────────────────────────── */
function patternLesson(name, extra){
  const pat = AI.candles.find(p=>p.name===name);
  return {
    steps:[
      {h:'What you see', p:pat.see, c:{pat:name}},
      {h:'What it means', p:pat.means},
      {h:'How it is traded', p:pat.how},
      {h:'What comes next', p:pat.next, c:{arr:pat.tail.concat(pat.after), title:'TYPICAL FOLLOW-THROUGH'}},
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

AI.CURRICULUM = { units: CURRICULUM, bosses: BOSSES };
})(typeof window!=='undefined' ? window : globalThis);
