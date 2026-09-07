/* ═══════════════════════════════════════════════════════════════
   TheAI101 Pro Labs — options payoff, binary breakeven, risk of ruin.
   Pure client-side educational math, zero dependencies.
   Charts are drawn with the candles.js engine and fully redrawn on
   every input change and on theme toggle (via AI.themeHooks).
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const AI = window.AI = window.AI || {};
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const signedMoney = v => (v < 0 ? '-$' : '+$') + Math.abs(v).toFixed(2);
const dollars = v => '$' + Math.round(v).toLocaleString('en-US');

function mk(t, a){
  const e = document.createElementNS(NS, t);
  for(const k in a) e.setAttribute(k, a[k]);
  return e;
}

/* rAF-safe full redraw scheduler (same pattern as the live arena) */
let rafQueued = false;
function schedule(fn){
  if(rafQueued) return;
  rafQueued = true;
  requestAnimationFrame(()=>{ rafQueued = false; fn(); });
}

function axisText(ctx, x, y, txt, anchor){
  const t = mk('text', {x, y, 'text-anchor': anchor || 'middle', 'class': 'axis-tick'});
  t.textContent = txt;
  ctx.el.appendChild(t);
}
function tag(ctx, x, y, txt, color, anchor){
  const t = mk('text', {x, y, 'text-anchor': anchor || 'start', 'class': 'lab-tag', fill: ctx.col(color)});
  t.textContent = txt;
  ctx.el.appendChild(t);
}

/* ── Lab A: options payoff puzzle ─────────────────────────────── */
const PW = 720, PH = 300, PPAD = {l:46, r:74, t:26, b:26};
const XLO = 60, XHI = 140, YLO = -40, YHI = 40;
let struct = 'long_call';
const isSpread = () => struct === 'bull_spread' || struct === 'bear_spread';
const STRUCT_NAME = {
  long_call: 'Long call', long_put: 'Long put',
  bull_spread: 'Bull call spread', bear_spread: 'Bear put spread'
};
const PLAIN = {
  long_call: 'Pay the premium for the right to buy at the strike. The worst case is the premium itself; above the breakeven, profit tracks the stock dollar for dollar with no cap.',
  long_put: 'Pay the premium for the right to sell at the strike. Losses stop at the premium; profit grows as price falls, maxing out only if the underlying goes to zero.',
  bull_spread: 'Buy the lower call and sell the higher one. The premium collected on the second call makes this cheaper than a plain call, but profit is capped at the strike gap minus what you paid.',
  bear_spread: 'Buy the higher-strike put and sell the lower one. A cheaper bearish bet: the sold put funds part of the bought one, and the payout is capped at the strike gap minus the net premium.'
};

function px(p){ return PPAD.l + (p - XLO) / (XHI - XLO) * (PW - PPAD.l - PPAD.r); }

function payoffDef(K1, K2, prem){
  switch(struct){
    case 'long_call': return {
      pl: s => Math.max(0, s - K1) - prem, be: [K1 + prem],
      formula: 'max(0, S - ' + K1 + ') - ' + prem.toFixed(2)
    };
    case 'long_put': return {
      pl: s => Math.max(0, K1 - s) - prem, be: [K1 - prem],
      formula: 'max(0, ' + K1 + ' - S) - ' + prem.toFixed(2)
    };
    case 'bull_spread': return {
      pl: s => Math.max(0, s - K1) - Math.max(0, s - K2) - prem, be: [K1 + prem],
      formula: 'max(0, S - ' + K1 + ') - max(0, S - ' + K2 + ') - ' + prem.toFixed(2)
    };
    default: return {
      pl: s => Math.max(0, K2 - s) - Math.max(0, K1 - s) - prem, be: [K2 - prem],
      formula: 'max(0, ' + K2 + ' - S) - max(0, ' + K1 + ' - S) - ' + prem.toFixed(2)
    };
  }
}

function renderPayoff(){
  const K1 = +$('payK').value;
  const rawK2 = +$('payK2').value;
  const K2 = Math.max(rawK2, K1 + 5);
  if(rawK2 !== K2) $('payK2').value = String(K2);
  const prem = +$('payPrem').value;
  $('payKV').textContent = '$' + K1;
  $('payK2V').textContent = '$' + K2;
  $('payPremV').textContent = '$' + prem + '.00';

  const def = payoffDef(K1, K2, prem);
  const svg = $('paySvg');
  svg.innerHTML = '';
  const ctx = AI.add(svg, PW, PH, PPAD);
  const y2 = ctx.scale(YLO, YHI);
  const y = v => y2(clamp(v, YLO, YHI));

  ctx.grid(8, 4);
  [-40, -20, 0, 20, 40].forEach(v => axisText(ctx, PPAD.l - 8, y2(v) + 3.5, v > 0 ? '+' + v : String(v), 'end'));
  [60, 80, 100, 120, 140].forEach(p => axisText(ctx, px(p), PH - 8, String(p)));

  ctx.hline(y2(0), 'dim', '0', true);
  ctx.line(px(100), PPAD.t, px(100), PH - PPAD.b, 'dim', '3 3', 1.2);
  tag(ctx, px(100), PPAD.t + 11, 'SPOT 100', 'dim', 'middle');

  const pts = [];
  for(let s = XLO; s <= XHI; s++) pts.push([px(s), y(def.pl(s))]);
  ctx.zigzag(pts, 'accent');

  def.be.forEach(b => {
    if(b < XLO || b > XHI) return;
    ctx.el.appendChild(mk('circle', {cx: px(b), cy: y2(0), r: 4.5, fill: ctx.col('accent'),
      stroke: ctx.col('ink'), 'stroke-width': 1.5}));
    const right = px(b) > PW - 150;
    tag(ctx, px(b) + (right ? -8 : 8), y2(0) - 10, 'BE $' + b, 'accent', right ? 'end' : 'start');
  });
  ctx.title('P/L PER SHARE AT EXPIRY ($)', 'dim');

  let beTxt, winTxt;
  const loseTxt = '$' + prem.toFixed(2) + ' (the premium, no matter what)';
  if(struct === 'long_call'){
    beTxt = '$' + (K1 + prem);
    winTxt = 'Unlimited — no cap on the upside';
  } else if(struct === 'long_put'){
    beTxt = '$' + (K1 - prem);
    winTxt = '$' + (K1 - prem).toFixed(2) + ' — if price goes to zero';
  } else {
    const best = (K2 - K1) - prem;
    beTxt = '$' + (struct === 'bull_spread' ? K1 + prem : K2 - prem);
    winTxt = (best < 0 ? '-$' : '$') + Math.abs(best).toFixed(2) +
      ' — at ' + (struct === 'bull_spread' ? '$' + K2 + ' or above' : '$' + K1 + ' or below') +
      (best <= 0 ? ' (even the best case loses)' : '');
  }
  $('payName').textContent = STRUCT_NAME[struct];
  $('payFacts').innerHTML =
    '<div><b>Breakeven at expiry</b>' + beTxt + '</div>' +
    '<div><b>Max profit</b>' + winTxt + '</div>' +
    '<div><b>Max loss</b>' + loseTxt + '</div>' +
    '<div><b>In plain English</b>' + PLAIN[struct] + '</div>';
  $('payCap').textContent = 'Formula: P/L = ' + def.formula + ' per share. Spot reference fixed at 100.';
}

function bindPayoff(){
  document.querySelectorAll('#payTgl button').forEach(btn => {
    btn.addEventListener('click', () => {
      struct = btn.dataset.v;
      document.querySelectorAll('#payTgl button').forEach(b => b.classList.toggle('on', b === btn));
      $('payK2Row').hidden = !isSpread();
      $('payPremLabel').textContent = isSpread() ? 'Net premium' : 'Premium';
      schedule(renderPayoff);
    });
  });
  ['payK', 'payK2', 'payPrem'].forEach(id => $(id).addEventListener('input', () => schedule(renderPayoff)));
}

/* ── Lab B: binary breakeven ──────────────────────────────────── */
function renderBinary(){
  const payout = +$('binPay').value / 100;
  const wr = +$('binWr').value;
  const ev = (wr / 100) * payout - (1 - wr / 100);
  const beWr = 100 / (1 + payout);
  const gap = wr - beWr;

  $('binPayV').textContent = $('binPay').value + '%';
  $('binWrV').textContent = wr + '%';
  const evEl = $('binEv');
  evEl.textContent = signedMoney(ev);
  evEl.style.color = ev > 0.0001 ? 'var(--green)' : ev < -0.0001 ? 'var(--red)' : '';
  $('binBe').textContent = beWr.toFixed(1) + '%';
  $('binWrHud').textContent = wr + '%';
  const gapEl = $('binGap');
  gapEl.textContent = (gap >= 0 ? '+' : '') + gap.toFixed(1) + ' pts';
  gapEl.style.color = gap >= 0 ? 'var(--green)' : 'var(--red)';

  const v = $('binVerdict');
  const gapAbs = Math.abs(gap).toFixed(1);
  if(Math.abs(ev) < 0.005){
    v.className = 'game-result';
    v.textContent = 'Dead even. Your win rate sits exactly on the ' + beWr.toFixed(1) + '% break-even line — on average you expect to keep every dollar you stake, and no more.';
  } else if(ev < 0){
    v.className = 'game-result bad';
    v.textContent = 'You are losing $' + Math.abs(ev).toFixed(2) + ' per $1 on average. A ' + $('binPay').value +
      '% payout demands a ' + beWr.toFixed(1) + '% win rate just to break even — your ' + wr + '% is ' + gapAbs +
      ' points short, a bleed of about $' + (Math.abs(ev) * 100).toFixed(0) + ' per $100 staked.';
  } else {
    v.className = 'game-result ok';
    v.textContent = 'You are +$' + ev.toFixed(2) + ' per $1 on average. Your ' + wr + '% win rate clears the ' +
      beWr.toFixed(1) + '% break-even by ' + gapAbs + ' points — a real edge, before fees.';
  }
}

function bindBinary(){
  ['binPay', 'binWr'].forEach(id => $(id).addEventListener('input', () => schedule(renderBinary)));
}

/* ── Lab C: Portfolio Tycoon (risk of ruin) ───────────────────── */
const TW = 720, TH = 300, TPAD = {l:52, r:74, t:26, b:26};
const START = 10000, N_ACCTS = 200, N_TRADES = 100;
let sim = null;

function tx(t){ return TPAD.l + t / N_TRADES * (TW - TPAD.l - TPAD.r); }

function runSim(){
  const riskPct = +$('tyRisk').value / 100;
  const p = +$('tyWr').value / 100;
  const avgR = +$('tyR').value;
  const finals = [], curves = [];
  let ruinCount = 0;
  for(let a = 0; a < N_ACCTS; a++){
    let eq = START, below = false;
    const path = [eq];
    for(let t = 0; t < N_TRADES; t++){
      const risk = eq * riskPct;
      eq = Math.random() < p ? eq + risk * avgR : eq - risk;
      if(eq < 0) eq = 0;
      if(eq < START / 2) below = true;
      path.push(eq);
    }
    finals.push(eq);
    curves.push(path);
    if(below) ruinCount++;
  }
  const sorted = finals.slice().sort((a, b) => a - b);
  const idx = new Set();
  while(idx.size < 5) idx.add(Math.floor(Math.random() * N_ACCTS));
  sim = {
    samples: [...idx].map(i => curves[i]),
    stats: {
      med: (sorted[N_ACCTS / 2 - 1] + sorted[N_ACCTS / 2]) / 2,
      best: sorted[N_ACCTS - 1],
      worst: sorted[0],
      ruinN: ruinCount
    }
  };
  renderTycoon();
}

function pctOfStart(v){ return v >= 100 ? Math.round(v / 100) + '%' : (v / 100).toFixed(1) + '%'; }

function renderTycoon(){
  if(!sim) return;
  const svg = $('tySvg');
  svg.innerHTML = '';
  const ctx = AI.add(svg, TW, TH, TPAD);
  const y2 = ctx.scale(0, START * 2);
  ctx.grid(5, 4);
  [0, 5000, 10000, 15000, 20000].forEach(v => axisText(ctx, TPAD.l - 8, y2(v) + 3.5, '$' + (v / 1000) + 'k', 'end'));
  [0, 20, 40, 60, 80, 100].forEach(t => axisText(ctx, tx(t), TH - 8, String(t)));
  ctx.hline(y2(START), 'dim', 'START', true);
  ctx.hline(y2(START / 2), '#ef4444', 'RUIN 50%', true);
  const cols = ['accent', 'up', 'down', '#f59e0b', '#22d3ee'];
  sim.samples.forEach((path, i) => {
    ctx.zigzag(path.map((v, t) => [tx(t), y2(clamp(v, 0, START * 2))]), cols[i % cols.length]);
  });
  ctx.title('EQUITY PER ACCOUNT OVER 100 TRADES ($)', 'dim');

  const st = sim.stats;
  $('tyMed').textContent = pctOfStart(st.med);
  $('tyMedS').textContent = dollars(st.med) + ' final equity';
  $('tyBest').textContent = pctOfStart(st.best);
  $('tyBestS').textContent = dollars(st.best);
  $('tyWorst').textContent = pctOfStart(st.worst);
  $('tyWorstS').textContent = dollars(st.worst);
  $('tyRuin').textContent = Math.round(st.ruinN / N_ACCTS * 100) + '%';
  $('tyRuinS').textContent = st.ruinN + ' of ' + N_ACCTS + ' accounts ever fell below $5,000';
  $('tyCap').textContent = 'Each line is one of ' + N_ACCTS + ' accounts risking ' + $('tyRisk').value +
    '% per trade for ' + N_TRADES + ' trades. The chart clips at $20,000 — some lucky runs exit the top.';
}

function syncTycoonOut(){
  $('tyRiskV').textContent = (+$('tyRisk').value).toFixed(1) + '%';
  $('tyWrV').textContent = $('tyWr').value + '%';
  $('tyRV').textContent = '+' + (+$('tyR').value).toFixed(2).replace(/\.?0+$/, '') + 'R';
}

function bindTycoon(){
  ['tyRisk', 'tyWr', 'tyR'].forEach(id => $(id).addEventListener('input', syncTycoonOut));
  $('tyRun').addEventListener('click', runSim);
  syncTycoonOut();
}

/* ── wiring ───────────────────────────────────────────────────── */
function renderAll(){
  renderPayoff();
  renderBinary();
  renderTycoon();
}
AI.themeHooks.push(renderAll);

function boot(){
  bindPayoff();
  bindBinary();
  bindTycoon();
  renderPayoff();
  renderBinary();
  runSim();
}

/* app.js calls AI.onReady() at DOMContentLoaded (it loads before us);
   fall back to our own listener if the hook was already claimed. */
if(document.readyState === 'loading'){
  if(typeof AI.onReady === 'function') document.addEventListener('DOMContentLoaded', boot);
  else AI.onReady = boot;
} else {
  boot();
}
})();
