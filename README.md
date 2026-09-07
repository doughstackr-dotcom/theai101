# TheAI101 — Visual Trading School

Learn the charts, wear the charts. A game-like trading curriculum for visual learners, plus a live-data practice arena and functional trader gear.

https://theai101.shop

## What's inside

- **Academy** (`/academy/`) — a 7-unit learning path (32 nodes): chart basics, single-candle signals, multi-candle stories, chart patterns, traps & breakouts, risk, and the live lab. Every lesson ends in a quick check; every unit ends in a **boss game** (Candle Gauntlet, Signal Sprint, Story Seeker, Shape Match, Detective Cases, Stop Samurai). XP, levels, streaks, and unlock progression persist in localStorage.
- **Live Practice** (`/practice/`) — real market data, zero real money:
  - *Candle Calls*: predict the next practice candle (15s/30s/1m) built from the live price stream.
  - *Pattern Hunt · Real*: a candle-math detector (`js/pattern-detector.js`) scans real exchange klines; rounds are only served when a clean pattern is verified in the actual data.
  - *Trend or Range*: classify the regime of the last 30 real candles.
- **Pattern explorer** (`/candles/patterns.html`) — all 14 candlestick patterns drawn by code with entry/stop/target overlays, plus chart shapes at `/patterns/`.
- **Markets** (`/markets/`) — stocks, options, forex, and binary options explainers.
- **Shop** — Printify desk gear (desk mats, posters, pads) that double as reference tools.

## Market data

Free, keyless, public feeds only — for practice, never for trading:

1. Binance public REST + WebSocket (primary)
2. Coinbase Exchange public REST candles + WS ticker (automatic failover)
3. REST polling (last resort)

`js/market.js` multiplexes every subscriber onto one shared connection, remembers geo-blocked sources (Binance returns 451 in some regions), and reports honest status (`LIVE` / `SYNCING` / `OFFLINE`) in the ticker pill.

## Stack

Zero dependencies, no build step: hand-written HTML/CSS/JS with a small SVG chart engine (`js/candles.js`, theme-aware). Static hosting on GitHub Pages. Fonts: Bricolage Grotesque, Nunito, JetBrains Mono.

## Design system

"Paper Arcade": warm paper canvas, 2px ink borders, hard offset shadows, tactile press states, sticker chips, light theme by default with a persisted Night Arcade mode. Reduced-motion and no-backdrop fallbacks included. Asset links carry `?v=` cache busters.

## Educational only

Nothing here is financial advice, a signal, or a promise of profit. The arena never accepts deposits or places orders.
