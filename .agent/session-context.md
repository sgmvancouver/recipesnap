# Session Handoff Notes

## Context (2026-04-07 @ 04:44)
The **Recipe Grabber** app has been significantly optimized for the **April 2026** Gemini API environment. We reached a major milestone with **Discovery-as-a-Service**.

### 🛠️ Key Architectural Decisions
- **Early-Exit Parallelism:** We fire 4 extractions simultaneously but resolve the promise as soon as **2 successful recipes** are returned. This prevents the "slowest site" from lagging the entire UI.
- **Strict Discovery:** `discovery.js` now uses a keyword-matching filter. If the search query is "chicken" and the model returns "coffee," it is instantly discarded. This fixed a major hallucination report.
- **Model fleet update:** Moved from `gemini-1.5-flash` (retired) to **`gemini-2.5-flash`** as the primary model for both Discovery and Extraction.

### 🍱 Terminology
- All primary labels and buttons now use the combined phrase **"Extract/Search"** in the Header, Mobile Nav, and Footer to bridge the gap between "Recipe Scraper" and "Recipe Search."

### 📝 TODO / Next Actions
1. **Save/Filter Categories:** The UI has space for categories (Breakfast, Dinner, etc.), but the backend data needs to be sorted into folders or tags in the `localStorage`.
2. **PostHog Audit:** Verify `posthog.capture` is hitting for the `extract_multiple` and `discovery` events.
3. **Stripe Integration:** Prepare for Phase 4 (Monetization) once core stability is 100%.

### ⚠️ Current Quirks
- Some sites (like NYT Cooking) may still hit 403/Forbidden if they detect the proxy. `jina.ai` is the primary fallback for these.
