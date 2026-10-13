# JaneStreetTradingComp / Market Lab

The original repository was empty. This implementation chooses an educational seeded single-asset market-making simulator as its purpose. It is unaffiliated with Jane Street and does not reproduce official competition rules.

Integer-cent accounting, deterministic tape, price/time priority, partial fills, resting orders, cancellations, worst-case inventory limits, cash/equity/P&L, action replay, persistence and JSON export.

## Run

Requires Python 3 and Node 22+ for tests. No packages, external assets, API keys, or installation required.

```sh
python3 -m http.server 8080
# open http://localhost:8080
node --test tests/*.test.js
```

Serve over HTTP; opening the file directly does not load ES modules reliably. All resources use relative paths, including static hosting under a repository prefix.

## Boundaries

Synthetic market only. No exchange, competition scoring, fees, interest, real order placement, or live data. External order flow is seeded; only your resting quotes are shown. Cash borrowing is allowed and shown; inventory is bounded. No investment recommendations.

Data stays in localStorage on the current origin. No network requests beyond the app assets. A failed storage write is announced in the interface. Domain logic is isolated in `engine.js`, with Node regression tests. Browser acceptance covers actual controls, reload persistence, exports, desktop and mobile; `scripts/browser-check.cjs` accepts an externally installed Playwright core and Chromium through environment variables.

```sh
PLAYWRIGHT_CORE_PATH=/absolute/path/to/playwright-core CHROMIUM_PATH=/absolute/path/to/chromium node scripts/browser-check.cjs
```

The browser runner starts its own server on port 3188, checks 1440px and 390px views, and captures temporary screenshots under `/tmp` for inspection.
