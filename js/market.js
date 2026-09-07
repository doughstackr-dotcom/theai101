/* ═══════════════════════════════════════════════════════════════
   TheAI101 market data — free, keyless, live. Practice only.
   Primary: Binance public REST + WebSocket. Fallback: Coinbase
   Exchange public feed (REST candles + WS ticker). Last resort:
   REST polling. One shared connection multiplexes every subscriber;
   blocked sources are remembered and skipped. Status is always
   shown honestly in the UI ('live', 'syncing', 'offline'). When the
   browser supports BroadcastChannel, tabs elect a single leader that
   runs the feed and shares prices with the other tabs.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const AI = window.AI = window.AI || {};
const market = AI.market = {};

market.symbols = [
  {key:'BTC', binance:'btcusdt', binanceUp:'BTCUSDT', cb:'BTC-USD', label:'Bitcoin'},
  {key:'ETH', binance:'ethusdt', binanceUp:'ETHUSDT', cb:'ETH-USD', label:'Ethereum'},
  {key:'SOL', binance:'solusdt', binanceUp:'SOLUSDT', cb:'SOL-USD', label:'Solana'},
  {key:'DOGE',binance:'dogeusdt',binanceUp:'DOGEUSDT',cb:'DOGE-USD',label:'Dogecoin'},
  {key:'XRP', binance:'xrpusdt', binanceUp:'XRPUSDT', cb:'XRP-USD', label:'XRP'}
];
market.byKey = Object.fromEntries(market.symbols.map(s=>[s.key,s]));
market.intervals = {'1m':1,'5m':5,'15m':15};

const prices = {};
const bus = {
  refs:0, ws:null, pollTimer:null, source:'none', status:'idle', follower:false,
  binanceWSBlocked:false, binanceRestBlocked:false, cbWSBlocked:false,
  handlers:new Set(), statusFns:new Set(), attempts:0
};

function setStatus(s, detail){
  bus.status = s;
  bus.statusFns.forEach(fn=>{ try{fn(s, detail||'');}catch(_e){} });
  document.dispatchEvent(new CustomEvent('ai:market-status',{detail:{status:s, source:bus.source}}));
}
market.getStatus = ()=>({status:bus.status, source:bus.source});
market.onStatus = fn => { bus.statusFns.add(fn); return ()=>bus.statusFns.delete(fn); };
market.getPrice = k => prices[k] || null;

function dispatch(key, p){
  if(!Number.isFinite(p) || p<=0) return;
  prices[key] = p;
  bus.handlers.forEach(h=>{ if(!h.keys || h.keys.has(key)) h.onPrice && h.onPrice(key, p); });
  if(leaderActive) chanPost({t:'price', key, p});   // share with follower tabs
}

/* ── REST klines with failover. Returns [{t,o,h,l,c,v}] ascending ── */
async function binanceKlines(sym, interval, limit){
  const u = `https://api.binance.com/api/v3/klines?symbol=${sym.binanceUp}&interval=${interval}&limit=${limit}`;
  const r = await fetchT(u, 6000);
  if(!r.ok) throw new Error('binance http '+r.status);
  const j = await r.json();
  if(!Array.isArray(j)) throw new Error('bad binance data');
  return j.map(k=>({t:k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5]}));
}
async function coinbaseKlines(sym, interval, limit){
  const gran = market.intervals[interval]*60;
  const u = `https://api.exchange.coinbase.com/products/${sym.cb}/candles?granularity=${gran}`;
  const r = await fetchT(u, 6000);
  if(!r.ok) throw new Error('coinbase http '+r.status);
  const j = await r.json();
  if(!Array.isArray(j)) throw new Error('bad coinbase data');
  return j.slice(0,limit).reverse().map(k=>({t:k[0]*1000, o:+k[3], h:+k[2], l:+k[1], c:+k[4], v:+k[5]}));
}
market.klines = async function(key, interval, limit){
  const sym = market.byKey[key]; if(!sym) throw new Error('unknown symbol');
  limit = Math.min(limit||120, 300);
  if(!bus.binanceRestBlocked){
    try{ const out = await binanceKlines(sym, interval, limit); bus.source='binance'; return out; }
    catch(e){ bus.binanceRestBlocked = true; }
  }
  try{ const out = await coinbaseKlines(sym, interval, limit); bus.source='coinbase'; return out; }
  catch(e){ bus.source='none'; throw new Error('all kline sources failed'); }
};

function fetchT(url, ms){
  const c = new AbortController();
  const t = setTimeout(()=>c.abort(), ms);
  return fetch(url, {signal:c.signal}).finally(()=>clearTimeout(t));
}

/* ── shared live bus ── */
function binanceWS(){
  const streams = market.symbols.map(s=>`${s.binance}@miniTicker`).join('/');
  const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
  bus.ws = ws;
  ws.onopen = ()=>{ bus.source='binance'; bus.attempts=0; setStatus('live'); };
  ws.onmessage = e=>{
    try{
      const m = JSON.parse(e.data);
      const d = m.data || m;
      if(d.e === 'miniTicker' || (d.s && d.c)){
        const s = market.symbols.find(x=>x.binanceUp === d.s);
        if(s) dispatch(s.key, parseFloat(d.c));
      }
    }catch(_e){}
  };
  ws.onerror = ()=>{ try{ws.close();}catch(_e){} };
  ws.onclose = (ev)=>{
    if(bus.ws !== ws) return;
    bus.ws = null;
    // 451 = geo-blocked; skip binance forever once it refuses
    bus.binanceWSBlocked = true;
    nextLink('binance refused' + (ev&&ev.code?' ('+ev.code+')':''));
  };
}
function coinbaseWS(){
  const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
  bus.ws = ws;
  ws.onopen = ()=>{
    ws.send(JSON.stringify({type:'subscribe', product_ids:market.symbols.map(s=>s.cb), channels:['ticker']}));
    bus.source='coinbase'; bus.attempts=0; setStatus('live');
  };
  ws.onmessage = e=>{
    try{
      const m = JSON.parse(e.data);
      if(m.type==='ticker' && m.price){
        const s = market.symbols.find(x=>x.cb === m.product_id);
        if(s) dispatch(s.key, parseFloat(m.price));
      }
    }catch(_e){}
  };
  ws.onerror = ()=>{ try{ws.close();}catch(_e){} };
  ws.onclose = ()=>{
    if(bus.ws !== ws) return;
    bus.ws = null;
    bus.cbWSBlocked = true;
    nextLink('coinbase refused');
  };
}
function nextLink(why){
  if(bus.refs<=0) return;
  if(bus.source!=='coinbase' && !bus.cbWSBlocked){ bus.source='coinbase'; bus.attempts++; setStatus('syncing'); coinbaseWS(); return; }
  startPolling();
}
function startPolling(){
  if(bus.pollTimer || bus.refs<=0) return;
  bus.source='rest'; setStatus('syncing');
  let failures = 0;
  const poll = async ()=>{
    let any = false;
    for(const s of market.symbols){
      try{
        const u = `https://api.exchange.coinbase.com/products/${s.cb}/ticker`;
        const r = await fetchT(u, 5000);
        const j = await r.json();
        if(j && j.price){ dispatch(s.key, parseFloat(j.price)); any = true; }
      }catch(e){ /* keep going */ }
    }
    if(any){ failures = 0; setStatus('live'); }
    else if(++failures >= 2) setStatus('offline');
  };
  poll();
  bus.pollTimer = setInterval(poll, 8000);
}
function startBus(){
  if(bus.ws || bus.pollTimer) return;
  bus.attempts = 0;
  setStatus('syncing');
  if(!bus.binanceWSBlocked) binanceWS();
  else if(!bus.cbWSBlocked) coinbaseWS();
  else startPolling();
}
function stopBus(){
  if(bus.ws){ const w = bus.ws; bus.ws = null; try{w.onclose=null; w.onerror=null; w.onmessage=null; w.close();}catch(_e){} }
  if(bus.pollTimer){ clearInterval(bus.pollTimer); bus.pollTimer=null; }
  bus.source='none';
  setStatus('idle');
}

/* ── cross-tab sharing: one tab leads the live feed, others listen ──
   Protocol over BroadcastChannel('theai101-market'):
   hello  — "any leader out there?"           present — leader's answer
   price  — leader -> followers price update  bye     — a tab is leaving
   The first subscribing tab runs a 400ms election; if a leader answers
   it follows (and takes over if the leader goes quiet), otherwise it
   leads and answers future hellos. Channel errors never break prices. */
const TAB_ID = 't' + Math.random().toString(36).slice(2) + Date.now().toString(36);
let chan = null;           // BroadcastChannel once opened
let electionTimer = null;  // 'hello' collection window
let followerWatch = null;  // 12s "no price from leader" watchdog
let byeTimer = null;       // jittered re-election after a leader leaves
let electionWait = false;  // true while collecting 'present' replies
let sawPresent = false;    // a leader answered our 'hello'
let leaderActive = false;  // this tab runs the feed and answers hellos

function chanPost(msg){
  if(!chan) return;
  try{ chan.postMessage(msg); }catch(_e){}
}
function armFollowerWatch(){
  if(followerWatch) clearTimeout(followerWatch);
  followerWatch = setTimeout(followerStalled, 12000);
}
function clearChanTimers(){
  if(electionTimer){ clearTimeout(electionTimer); electionTimer=null; }
  if(followerWatch){ clearTimeout(followerWatch); followerWatch=null; }
  if(byeTimer){ clearTimeout(byeTimer); byeTimer=null; }
  electionWait = false;
}
function stopFollowerMode(){
  bus.follower = false;
  if(followerWatch){ clearTimeout(followerWatch); followerWatch=null; }
}
function startElection(){
  if(!chan) return;
  sawPresent = false;
  electionWait = true;
  chanPost({t:'hello', id:TAB_ID});
  if(electionTimer) clearTimeout(electionTimer);
  electionTimer = setTimeout(()=>{
    electionTimer = null; electionWait = false;
    if(bus.refs<=0){ stopFeed(); return; }
    if(sawPresent){                       // another tab leads — listen to it
      leaderActive = false;
      bus.follower = true;
      if(bus.status !== 'syncing') setStatus('syncing');
      armFollowerWatch();
    }else{                                // no leader — run the feed here
      bus.follower = false;
      leaderActive = true;
      startBus();
    }
  }, 400);
}
function followerStalled(){
  followerWatch = null;
  if(bus.refs<=0 || !bus.follower) return;
  bus.follower = false;                   // leader went quiet — re-elect
  startElection();
}
function onChanMsg(ev){
  try{
    const m = ev && ev.data;
    if(!m || typeof m !== 'object' || m.id === TAB_ID) return;  // never react to ourselves
    if(m.t === 'hello'){
      if(leaderActive) chanPost({t:'present', id:TAB_ID});
    }else if(m.t === 'present'){
      if(electionWait) sawPresent = true;
    }else if(m.t === 'price'){
      if(bus.follower && market.byKey[m.key] && Number.isFinite(m.p) && m.p>0){
        if(bus.status !== 'live') setStatus('live');
        dispatch(m.key, m.p);
        armFollowerWatch();
      }
    }else if(m.t === 'bye'){
      if(bus.follower && !byeTimer){      // leader left — re-elect, staggered
        stopFollowerMode();
        if(bus.status === 'live') setStatus('syncing');
        byeTimer = setTimeout(()=>{
          byeTimer = null;
          if(bus.refs>0 && chan && !bus.follower && !leaderActive) startElection();
        }, 250 + Math.random()*250);
      }
    }
  }catch(_e){}
}
function onPageHide(){ chanPost({t:'bye', id:TAB_ID}); }
function onPageShow(ev){
  if(!chan || !ev || !ev.persisted || bus.refs<=0) return;
  if(leaderActive){ leaderActive = false; stopBus(); }   // bfcache restore:
  stopFollowerMode();                                    // our role may be stale
  startElection();
}
function startFeed(){
  if(bus.follower || leaderActive || chan) return;        // already organized
  if(typeof BroadcastChannel === 'undefined'){ startBus(); return; }
  try{
    chan = new BroadcastChannel('theai101-market');
    chan.onmessage = onChanMsg;
  }catch(_e){ chan = null; startBus(); return; }
  try{ window.addEventListener('pagehide', onPageHide); }catch(_e){}
  try{ window.addEventListener('pageshow', onPageShow); }catch(_e){}
  startElection();
}
function stopFeed(){
  const wasLeader = leaderActive;
  clearChanTimers();
  leaderActive = false;
  bus.follower = false;
  if(chan){
    chanPost({t:'bye', id:TAB_ID});
    try{ chan.close(); }catch(_e){}
    chan = null;
  }
  try{ window.removeEventListener('pagehide', onPageHide); }catch(_e){}
  try{ window.removeEventListener('pageshow', onPageShow); }catch(_e){}
  if(wasLeader) stopBus();
  else { bus.source='none'; setStatus('idle'); }
}

/* subscribe(keys, {onPrice(key, price)}) -> {close()} */
market.subscribe = function(keys, handlers){
  const h = {keys:new Set(keys), onPrice:handlers && handlers.onPrice};
  bus.handlers.add(h);
  bus.refs++;
  // catch new subscribers up with the freshest prices immediately
  if(h.onPrice) keys.forEach(k=>{ if(prices[k]) h.onPrice(k, prices[k]); });
  startFeed();
  return { close(){
    bus.handlers.delete(h);
    bus.refs = Math.max(0, bus.refs-1);
    if(bus.refs===0) stopFeed();
  }};
};

/* ── helpers ── */
market.fmt = function(n){
  if(!Number.isFinite(n)) return '—';
  const d = n>=1000?2 : n>=100?2 : n>=1?3 : 5;
  return n.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:d});
};
market.pct = function(a,b){
  if(!Number.isFinite(a)||!Number.isFinite(b)||b===0) return 0;
  return (a-b)/b*100;
};
})();
