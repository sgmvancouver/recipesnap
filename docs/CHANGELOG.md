# Changelog

## [v1.1.0] - 2026-04-07
### Optimized Latency & Accuracy
- **Parallel Extraction:** Rewrote `extractorService.js` to fire all 4 search results in parallel, resolving as soon as **2 successful recipes** are returned.
- **Improved Discovery:** Added `google-search` tool and **keyword filtering** to prevent hallucinated recipes (no more coffee for chicken queries).
- **Core Reliability:** Moved following April 2026 retired model 404s from `gemini-1.5-flash` to **`gemini-2.5-flash`** and **`gemini-2.0-flash`**.
- **UI Rewrite:** Changed all "Extract" labels to **"Extract/Search"** to better reflect the new query-first functionality in the Header, Footer, and Mobile Nav.

## [v1.0.0] - 2026-04-06
### Initial Release
- Core AI Extraction app with React & Netlify Functions.
- Gemini 1.5 Flash (legacy) integration.
- Mobile-first "Recipe Snap" aesthetic.
