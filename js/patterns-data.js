/* TheAI101 pattern library — data + draw functions for candlesticks & chart patterns */
(function(){
'use strict';
const AI = window.AI = window.AI || {};

// ── helpers ──────────────────────────────────────────
function drawSeq(ctx, arr, n){
  const total = n || arr.length;
  arr.forEach((k,i)=> ctx.candle(ctx.xat(i,total), k.o,k.h,k.l,k.c, undefined, {n:total}));
}
// noise candles before/after a pattern
function noise(ctx, seed, n, lo, hi, drift, offset, total){
  const g = AI.gen(seed, n, lo, hi, drift);
  g.forEach((k,i)=> ctx.candle(ctx.xat(offset+i,total), k.o,k.h,k.l,k.c, undefined, {n:total}));
}

// ── CANDLESTICK PATTERNS ─────────────────────────────
AI.candles = [
{
  name:'Bullish Engulfing', bias:'Bullish', trend:'Appears in a downtrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:78,h:82,l:74,c:70},{o:70,h:73,l:66,c:62},{o:62,h:65,l:58,c:55},
      {o:55,h:58,l:52,c:47},
      {o:49,h:52,l:44,c:44},                       // small red
      {o:43,h:61,l:41,c:58},                       // big green engulfs it
      {o:59,h:68,l:56,c:66}                        // confirmation
    ]);
  },
  see:'A small red candle gets completely swallowed by the next candle\'s bigger green body — open below, close above.',
  means:'Sellers pushed price down, buyers took over entirely within one session. Momentum flipped.',
  how:'Enter on the next candle\'s open (or a break above the engulfing body). Stop just under the engulfing low. First target: the recent swing high.',
  fail:'A tiny green candle in a wide range, or one appearing in a sideways market, is noise — the engulfing body should be clearly larger and the downtrend real.'
},
{
  name:'Bearish Engulfing', bias:'Bearish', trend:'Appears in an uptrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:24,h:34,l:22,c:32},{o:32,h:42,l:30,c:40},{o:40,h:49,l:38,c:47},
      {o:47,h:54,l:45,c:52},
      {o:47,h:55,l:45,c:52},                       // small green
      {o:55,h:57,l:38,c:40},                       // big red engulfs it
      {o:40,h:42,l:29,c:32}                        // confirmation
    ]);
  },
  see:'A small green candle is swallowed whole by the next candle\'s bigger red body.',
  means:'Buyers had control, then sellers erased the entire session — and more — in one candle.',
  how:'Enter short (or exit longs) on the next open. Stop just above the engulfing high. Target the prior swing low.',
  fail:'Same trap as the bullish twin: the body must visibly dwarf the prior candle, and it should appear after a real advance, not mid-chop.'
},
{
  name:'Hammer', bias:'Bullish', trend:'Ends a downtrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:78,h:80,l:68,c:70},{o:70,h:72,l:60,c:62},{o:62,h:64,l:53,c:55},{o:55,h:57,l:45,c:47},
      {o:46,h:55,l:28,c:53},                       // hammer: long lower wick
      {o:53,h:62,l:51,c:60},{o:60,h:70,l:58,c:68}
    ]);
  },
  see:'A candle with a little body at the top and a long lower wick 2–3× the body — sellers dove, buyers slammed the door.',
  means:'The low was rejected. Demand stepped in and erased most of the sell-off before the close.',
  how:'Enter above the hammer\'s high (aggressive) or above the next candle\'s high (conservative). Stop under the wick low.',
  fail:'Without the preceding downtrend it\'s just a candle. A close near the low, or a wick that gets broken days later, kills the signal.'
},
{
  name:'Shooting Star', bias:'Bearish', trend:'Ends an uptrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:20,h:30,l:18,c:28},{o:28,h:38,l:26,c:36},{o:36,h:46,l:34,c:44},{o:44,h:54,l:42,c:52},
      {o:53,h:78,l:44,c:46},                       // star: long upper wick
      {o:46,h:48,l:36,c:38},{o:38,h:40,l:28,c:30}
    ]);
  },
  see:'Small body at the bottom, long upper wick — a rally that was fully rejected from above.',
  means:'Supply overwhelmed demand at the highs. The bloom came off the rally intraday.',
  how:'Enter below the star\'s low. Stop above the wick high. Target the base of the move.',
  fail:'In a strong uptrend this is often just a pause — wait for the next candle to confirm lower before acting.'
},
{
  name:'Doji', bias:'Neutral', trend:'Any trend — a warning light',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:22,h:32,l:20,c:30},{o:30,h:40,l:28,c:38},{o:38,h:47,l:36,c:45},{o:45,h:52,l:43,c:50},
      {o:50,h:62,l:38,c:50.5},                     // doji: open ≈ close
      {o:51,h:62,l:49,c:60},{o:60,h:68,l:58,c:66}
    ]);
  },
  see:'Open and close are (nearly) identical, so the body is a thin line — the wicks show both sides fought to a draw.',
  means:'Indecision. On its own it predicts nothing — what matters is which side breaks out next.',
  how:'Don\'t trade the doji — trade the break: long above its high, short below its low, stop on the other side.',
  fail:'In low volume or tight ranges dojis are everywhere and mean nothing. Long-legged dojis at extremes are the meaningful ones.'
},
{
  name:'Morning Star', bias:'Bullish', trend:'Ends a downtrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:66,h:68,l:56,c:58},{o:58,h:60,l:49,c:51},{o:51,h:53,l:42,c:44},
      {o:42,h:45,l:35,c:38},                       // star (small, gapped down)
      {o:39,h:57,l:37,c:54},                       // big green recovery
      {o:55,h:65,l:53,c:63}
    ]);
  },
  see:'Three candles: a strong red, a small-bodied pause (the "star"), then a strong green that climbs back into the first body.',
  means:'Selling pressure exhausted itself in the middle candle — the third confirms the reversal.',
  how:'Enter on the third candle\'s close or next open. Stop below the star\'s low. It\'s a slower, more reliable reversal than a single hammer.',
  fail:'If the third candle fails to close past the midpoint of the first, the "star" was just a rest stop in the downtrend.'
},
{
  name:'Evening Star', bias:'Bearish', trend:'Ends an uptrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:34,h:46,l:32,c:44},{o:44,h:54,l:42,c:52},{o:52,h:61,l:50,c:59},
      {o:61,h:66,l:58,c:63},                       // star
      {o:60,h:62,l:44,c:46},                       // big red collapse
      {o:46,h:48,l:36,c:38}
    ]);
  },
  see:'The mirror of morning star: strong green, small pause on top, strong red back into the first body.',
  means:'The last buyers bought the top of the move and are now underwater.',
  how:'Enter short on the third candle\'s close. Stop above the star\'s high.',
  fail:'Needs the uptrend and the full three-candle structure — a single red candle after a pause is not an evening star.'
},
{
  name:'Three White Soldiers', bias:'Bullish', trend:'Ends a downtrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:44,h:46,l:35,c:37},{o:37,h:39,l:29,c:31},
      {o:32,h:41,l:30,c:39},{o:39,h:50,l:37,c:48},{o:48,h:59,l:46,c:57}
    ]);
  },
  see:'Three consecutive strong green candles, each opening inside the prior body and closing near its high — a steady stair-step advance.',
  means:'Persistent demand across multiple sessions — not a one-candle spike, a regime change.',
  how:'Enter on a pullback to the first soldier\'s body rather than chasing the third. Stop under the first soldier\'s low.',
  fail:'If each candle\'s body shrinks or upper wicks grow, buyers are tiring. After a huge drop, this can be a dead-cat bounce — check the bigger trend.'
},
{
  name:'Three Black Crows', bias:'Bearish', trend:'Ends an uptrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:40,h:49,l:38,c:47},{o:47,h:56,l:45,c:54},
      {o:53,h:56,l:44,c:46},{o:46,h:48,l:36,c:38},{o:38,h:40,l:28,c:30}
    ]);
  },
  see:'Three long red candles stair-stepping down, each opening inside the prior body and closing near its low.',
  means:'Relentless supply. Each day\'s attempt to rally is sold before the close.',
  how:'Enter short on a bounce into the first crow\'s body. Stop above its high.',
  fail:'Three red candles in a range are just noise — crows matter at the top of an extended advance.'
},
{
  name:'Bullish Harami', bias:'Bullish', trend:'Ends a downtrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:78,h:80,l:70,c:72},{o:72,h:74,l:62,c:64},{o:64,h:66,l:52,c:54},
      {o:62,h:64,l:40,c:42},                       // long red "mother"
      {o:46,h:56,l:44,c:54},                       // small green inside the body
      {o:56,h:66,l:54,c:64}
    ]);
  },
  see:'A very long red candle ("the mother") followed by a small candle whose entire body fits inside the mother\'s body. "Harami" = pregnant in Japanese.',
  means:'The selling stalled — the small body shows the balance of power shifting, gently.',
  how:'It\'s an early warning, not a trigger. Buy a break above the mother\'s high, or the small candle\'s high. Stop below the mother\'s low.',
  fail:'A harami in the middle of a range means nothing. The longer the mother candle, the stronger the signal.'
},
{
  name:'Bearish Harami', bias:'Bearish', trend:'Ends an uptrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:26,h:38,l:24,c:36},{o:36,h:50,l:34,c:48},{o:48,h:62,l:46,c:60},
      {o:42,h:63,l:40,c:60},                       // long green mother
      {o:54,h:56,l:44,c:46},                       // small red inside
      {o:46,h:48,l:36,c:38}
    ]);
  },
  see:'Long green mother candle, then a small red candle fully inside its body.',
  means:'Buying momentum stalled inside one session — the reversal candidate.',
  how:'Sell/short a break below the small candle\'s low. Stop above the mother\'s high.',
  fail:'Same as its twin: needs a trend to reverse. Inside bodies in chop are coin flips.'
},
{
  name:'Tweezer Bottom', bias:'Bullish', trend:'Ends a downtrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:62,h:64,l:52,c:54},{o:54,h:56,l:44,c:46},{o:46,h:48,l:36,c:38},
      {o:44,h:47,l:30,c:37},                       // first tweezer: low 30
      {o:38,h:46,l:30.5,c:44},                     // second: matching low
      {o:45,h:55,l:43,c:53}
    ]);
  },
  see:'Two adjacent candles whose lows land on (almost) the same price — a double-test of the same floor.',
  means:'The level rejected sellers twice. Support is real, someone is defending it.',
  how:'Enter above the second candle\'s high. Stop a hair below the shared low — if it breaks, you\'re wrong.',
  fail:'Wicks must genuinely match — "close enough" across a wide range isn\'t a tweezer. Best at obvious support (prior lows, round numbers).'
},
{
  name:'Tweezer Top', bias:'Bearish', trend:'Ends an uptrend',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:38,h:48,l:36,c:46},{o:46,h:57,l:44,c:55},{o:55,h:64,l:53,c:62},
      {o:62,h:71,l:61,c:70},                       // first: high 71
      {o:70,h:71.5,l:66,c:64},                     // second: matching high
      {o:64,h:66,l:54,c:56}
    ]);
  },
  see:'Two back-to-back candles with matching highs — a double-tap on the same ceiling.',
  means:'Resistance held twice. Sellers are parked at that price.',
  how:'Enter below the second candle\'s low. Stop just above the shared high.',
  fail:'Needs a real ceiling (prior high, resistance zone). Two matching highs mid-range is coincidence.'
},
{
  name:'Marubozu', bias:'Bullish or Bearish', trend:'Any — a statement candle',
  draw(ctx,W,H,pad){ ctx.scale(0,100);
    drawSeq(ctx,[
      {o:50,h:52,l:44,c:45},{o:45,h:47,l:38,c:40},
      {o:20,h:80,l:20,c:80},   // green marubozu — opens at low, closes at high, no wicks
      {o:80,h:80,l:20,c:20}    // red marubozu — the mirror
    ]);
  },
  see:'A full-bodied candle with no wicks (or barely any): green opens at the low and closes at the high; red does the opposite.',
  means:'One side controlled 100% of the session. Green = pure demand, red = pure supply.',
  how:'A green marubozu breaking a resistance level is a textbook breakout entry; the stop goes below the candle\'s low (which is also its open).',
  fail:'A marubozu at the very end of an extended move can be a blow-off/cluster of stop-losses — the reversal candle often follows within days.'
}
];

// ── CHART PATTERNS ───────────────────────────────────
AI.chartPatterns = [
{
  name:'Head & Shoulders', bias:'Bearish', kind:'Reversal',
  pts:[[0,28],[8,58],[16,42],[30,80],[42,44],[54,66],[62,46],[74,16]],
  see:'Three peaks: left shoulder, a higher head, right shoulder ≈ left. The valleys between them trace the "neckline."',
  means:'Each rally is weaker than the last — buyers are losing interest at progressively lower highs after the head.',
  how:'The classic trigger: price breaking below the neckline. Measured target: head-to-neckline height projected down from the break.',
  fail:'A descending (flat) neckline that tilts up steeply, or heavy volume on the right shoulder rally, weakens the setup.'
},
{
  name:'Inverse Head & Shoulders', bias:'Bullish', kind:'Reversal',
  pts:[[0,72],[8,42],[16,58],[30,20],[42,56],[54,34],[62,54],[74,84]],
  see:'The upside-down twin: three troughs — shoulder, deeper head, shoulder — with a neckline across the peaks.',
  means:'Sellers tried three times; the second attempt made the low and the third couldn\'t. Downtrend exhausted.',
  how:'Buy the neckline break (or the retest of it from above). Target: head-to-neckline height projected up.',
  fail:'Neckline breaking and recapturing repeatedly, or shrinking volume into the breakout, are yellow flags.'
},
{
  name:'Double Top', bias:'Bearish', kind:'Reversal',
  pts:[[0,30],[12,62],[24,44],[38,63],[52,46],[66,18]],
  see:'Price rallies to a peak, sells off, rallies again to roughly the same price ("M" shape), then breaks down through the middle low.',
  means:'A ceiling proved twice. The second failed test usually pulls late buyers out with the break.',
  how:'Short the break of the valley between the peaks. Target: peak-to-valley height projected down. Stop above the peaks.',
  fail:'The two peaks must be at similar prices — a clearly higher second high is not a double top. Breaks often retest the valley from below.'
},
{
  name:'Double Bottom', bias:'Bullish', kind:'Reversal',
  pts:[[0,70],[12,38],[24,56],[38,37],[52,58],[66,82]],
  see:'The "W": a drop, a bounce, a retest of nearly the same low, then a breakout through the middle high.',
  means:'The floor held twice — sellers couldn\'t make a new low on the retest.',
  how:'Buy the break of the middle peak. Target: bottom-to-middle height projected up. Stop below the lows.',
  fail:'Second low far below the first = new downtrend, not a double bottom. Watch for the retest of the breakout level.'
},
{
  name:'Ascending Triangle', bias:'Bullish', kind:'Continuation',
  pts:[[0,30],[10,64],[18,48],[30,70],[40,54],[50,71],[60,58],[68,70],[76,62],[86,88]],
  see:'A flat resistance line across the highs while the lows step upward — buyers pay more each time, sellers defend one price.',
  means:'Rising demand is compressing against fixed supply. The squeeze usually resolves upward.',
  how:'Enter on a close above the flat top; the measured move adds the triangle\'s tallest height to the breakout point.',
  fail:'Volume should dry up inside the triangle. A break below the rising lows invalidates it — that\'s a failed ascending triangle.'
},
{
  name:'Descending Triangle', bias:'Bearish', kind:'Continuation',
  pts:[[0,72],[10,38],[20,58],[30,33],[42,50],[52,34],[62,44],[72,33],[82,42],[92,12]],
  see:'Flat floor of support, lower highs pressing down into it — mirror of the ascending triangle.',
  means:'Supply gets more aggressive each rally while buyers defend a single failing level.',
  how:'Short the break of the flat support. Measured target: the triangle\'s height below the break.',
  fail:'These can break upward ~⅓ of the time — demand a decisive close below support with volume before committing.'
},
{
  name:'Bull Flag', bias:'Bullish', kind:'Continuation',
  pts:[[0,20],[8,38],[16,58],[24,78],[30,70],[36,75],[42,66],[48,71],[54,62],[62,80],[74,94]],
  see:'A near-vertical rally (the pole), then a small, tight downward-drifting channel (the flag) on fading volume.',
  means:'A controlled pause: profit-taking without real selling. The trend is catching its breath, not reversing.',
  how:'Buy the break above the flag\'s upper boundary. Target: the pole\'s height added to the breakout. Stop below the flag low.',
  fail:'If the flag drifts down more than ~half the pole, or volume climbs during the drift, it may be a top forming, not a flag.'
},
{
  name:'Bear Flag', bias:'Bearish', kind:'Continuation',
  pts:[[0,80],[8,62],[16,42],[24,22],[30,30],[36,25],[42,34],[48,29],[54,38],[62,20],[74,6]],
  see:'A sharp drop (the pole), then a small upward-drifting consolidation before the next leg down.',
  means:'The bounce is short-covering, not buying. Once it exhausts, the downtrend resumes.',
  how:'Short the break below the flag\'s lower boundary. Target: pole height below the break. Stop above the flag high.',
  fail:'A flag that keeps climbing past the pole\'s start has flipped into a reversal — stand aside.'
},
{
  name:'Rising Wedge', bias:'Bearish', kind:'Reversal (usually)',
  pts:[[0,30],[10,50],[20,42],[32,62],[42,54],[54,72],[62,66],[72,78],[80,74],[88,48]],
  see:'Both trendlines rise, but the lows rise faster — the range squeezes toward a point as the pattern matures.',
  means:'Each push up costs more effort for less gain. Momentum is dying even as price grinds higher.',
  how:'Short the break of the lower (steeper) trendline. Wedges usually break toward the flat side — down.',
  fail:'A wedge can run a long time; entering before the break is guessing. A break up through the top invalidates the idea.'
},
{
  name:'Falling Wedge', bias:'Bullish', kind:'Reversal (usually)',
  pts:[[0,70],[10,50],[20,58],[32,38],[42,46],[54,28],[62,34],[72,22],[80,26],[88,52]],
  see:'Both lines fall while the highs fall faster — selling pressure contracts into an apex.',
  means:'Downside momentum is bleeding out; lower highs are getting shallower.',
  how:'Buy the break above the upper (steeper) trendline. Target: wedge height at the widest point.',
  fail:'Falling wedges in strong downtrends can resolve down — the break must be decisive, ideally on a volume pop.'
},
{
  name:'Cup & Handle', bias:'Bullish', kind:'Continuation',
  pts:[[0,68],[8,62],[18,46],[30,32],[42,30],[54,36],[66,48],[76,62],[82,66],[88,56],[94,74]],
  see:'A rounded "U" base (the cup) followed by a small downward drift (the handle) near the old high.',
  means:'A slow, orderly rotation from sellers back to buyers — the handle is the final shakeout before breakout.',
  how:'Buy the break above the handle\'s high (which sits under the rim). Target: cup depth added to the rim.',
  fail:'A V-shaped cup is too violent to be accumulation, and a handle deeper than ~⅓ of the cup is a failed setup.'
}
];

// generic chart-pattern renderer (zigzag on a framed chart)
AI.drawChartPattern = function(ctx, W, H, pat){
  ctx.scale(0,100);
  ctx.title(pat.name.toUpperCase(), '#64748b');
  const px = pat.pts.map(p=>[ctx.pad.l + p[0]/100*(W-ctx.pad.l-ctx.pad.r), ctx.y2px(p[1])]);
  ctx.zigzag(px, pat.bias==='Bullish' ? '#22c55e' : pat.bias==='Bearish' ? '#ef4444' : '#a78bfa');
};
})();
