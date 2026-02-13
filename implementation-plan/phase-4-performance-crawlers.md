# Phase 4: Performance for AI Crawlers

> **Priority: MEDIUM** — your static Astro + Cloudflare Pages stack is already near-optimal.
> Depends on: Phase 0 (site must build), Phase 1 (site must deploy)

---

## Context

Static HTML served from Cloudflare's CDN is the ideal setup for AI crawlers. AI crawlers do NOT execute JavaScript, impose tight timeouts (1-5 seconds), and need sub-200ms TTFB. Astro's static output on Cloudflare Pages already delivers this. This phase is mostly about verification and minor tuning.

---

## Tasks

- [ ] **4.1** Verify TTFB < 200ms on Cloudflare Pages
  - Test from multiple regions using `curl -o /dev/null -w "%{time_starttransfer}" https://docs.applivery.com/en/...`
  - Static HTML from CDN should be 20-80ms. If it's slower, check:
    - Cloudflare cache rules (HTML should be cached at edge)
    - Any Cloudflare Workers intercepting requests
  - Target: < 100ms for HTML pages

- [ ] **4.2** Verify all content is in static HTML (not behind JS hydration)
  - Use `curl` or `view-source:` to check that documentation text appears in the raw HTML
  - Astro islands (React components like `AIChat`, `SearchButton`) hydrate client-side — that's fine for interactive features, not for content
  - **Check specifically**: table of contents, code blocks, callouts, embedded examples
  - If any content is rendered via React islands, convert to Astro components (server-rendered)

- [ ] **4.3** Configure cache headers
  - Cloudflare Pages sets defaults, but verify:
    | Resource | Cache-Control | Rationale |
    |----------|--------------|-----------|
    | HTML pages | `public, max-age=3600` (1hr) | Fresh enough for content, reduces origin hits |
    | `/_astro/*` assets | `public, max-age=31536000, immutable` | Hashed filenames, never change |
    | `llms.txt` / `llms-full.txt` | `public, max-age=86400` (24hr) | Updated on each build |
    | `sitemap*.xml` | `public, max-age=86400` (24hr) | Updated on each build |
    | `robots.txt` | `public, max-age=86400` (24hr) | Rarely changes |
  - Use `_headers` file in `public/` for Cloudflare Pages:
  ```
  /_astro/*
    Cache-Control: public, max-age=31536000, immutable

  /llms.txt
    Cache-Control: public, max-age=86400

  /llms-full.txt
    Cache-Control: public, max-age=86400

  /sitemap*.xml
    Cache-Control: public, max-age=86400
  ```

- [ ] **4.4** Monitor AI crawler traffic
  - Check Cloudflare Analytics for bot traffic from GPTBot, ClaudeBot, PerplexityBot
  - Ensure crawlers are not being rate-limited or challenged by Cloudflare's bot protection
  - If using Cloudflare Bot Management: whitelist known AI crawler IPs or user-agents
  - GPTBot alone generates traffic rivaling 7.7% of all crawlers — it's significant

- [ ] **4.5** Optimize page weight for AI crawlers
  - AI crawlers process billions of pages — leaner HTML = more of your site gets crawled
  - At 1,000 docs x 9 locales = 9,000 pages, keep HTML lean:
    - Ensure Tailwind purges unused CSS (should be automatic with `@astrojs/tailwind`)
    - Inline only critical CSS; load the rest externally
    - Remove any `console.log` or debug output in production builds
  - Astro's `build.inlineStylesheets: 'auto'` is already set — good default

- [ ] **4.6** Remove unused `@astrojs/node` adapter
  - Listed in `package.json` but not used in `astro.config.mjs` (output is `static`)
  - Dead dependency — remove to reduce `npm ci` time in CI

---

## What Does NOT Matter for AI Crawlers

These are common optimization targets that specifically do NOT help with AI crawler performance:

| Metric | Why it doesn't matter |
|--------|----------------------|
| CLS (Cumulative Layout Shift) | Visual metric — crawlers don't render |
| LCP (Largest Contentful Paint) | Rendering metric — crawlers don't render JS |
| FID / INP (Interaction metrics) | Crawlers don't interact with the page |
| Image lazy loading | Crawlers don't load images (except Googlebot-Image) |
| Font loading strategy | Crawlers don't render fonts |

These metrics still matter for **Google Search rankings** (which indirectly feed LLM training data), but they have zero direct impact on AI crawler behavior.

---

## Cloudflare Pages Limits at Scale

| Constraint | Your situation (9,000 pages) | Limit |
|-----------|------------------------------|-------|
| Files per deployment | ~12,000-15,000 (HTML + assets) | 20,000 (free) / 100,000 (paid) |
| Max file size | Largest HTML page ~50-200KB | 25 MiB |
| Build time | 3-5 min (with Content Layer) | 20 min |
| Memory | ~2-4 GB | ~8 GB |
| Redirects | 1 (root → /en/) | 2,000 static + 100 dynamic |
| Header rules | 4-5 (cache rules above) | 100 |

You're well within all limits on the free plan. The only constraint to watch is the 20,000 file limit — if assets grow significantly, upgrade to paid.

---

## Validation Criteria

- [ ] TTFB < 100ms for HTML pages from Cloudflare CDN (measured from 3+ regions)
- [ ] `curl -s https://docs.applivery.com/en/docs/...` returns full doc content in raw HTML
- [ ] `_headers` file produces correct Cache-Control headers (test with `curl -I`)
- [ ] Cloudflare Analytics shows AI crawler traffic is not being blocked/challenged
- [ ] `@astrojs/node` removed from package.json
- [ ] Total deployment file count is under 20,000
