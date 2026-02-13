# Phase 3: Sitemap & Freshness Accuracy

> **Priority: MEDIUM** — incorrect freshness signals actively harm crawl behavior.
> Depends on: Phase 0 (need per-page dates from Content Layer)

---

## Context

Sitemaps are the primary way search engines (and indirectly LLMs) discover your pages. Inaccurate `<lastmod>` timestamps teach crawlers to ignore your freshness signals entirely. Your current setup has two concrete problems:

1. `@astrojs/sitemap` likely sets `<lastmod>` to the build date for ALL pages (no per-page dates)
2. `robots.txt` points to `docs.applivery.io` but the site is `docs.applivery.com`

---

## Tasks

- [ ] **3.1** Fix sitemap `<lastmod>` to use per-page dates
  - Use `@astrojs/sitemap`'s `serialize` option to inject per-page `lastmod`
  - Source: `updated_date` or `pub_date` from each document's CMS data
  - For pages without dates, omit `<lastmod>` entirely (better than a wrong date)
  - Implementation approach:
    1. During build, create a map of URL → lastmod from `getCollection('docs')`
    2. Pass to sitemap integration via `serialize` callback
  ```typescript
  // In astro.config.mjs
  sitemap({
    serialize(item) {
      // pageLastModMap populated during build
      const lastmod = pageLastModMap.get(item.url);
      if (lastmod) {
        item.lastmod = lastmod;
      } else {
        delete item.lastmod; // Omit rather than guess
      }
      return item;
    },
    i18n: { /* existing config */ }
  })
  ```
  - Alternative: build a custom sitemap generator as an Astro page route (`src/pages/sitemap.xml.ts`) for full control

- [ ] **3.2** Fix sitemap URL mismatch
  - `robots.txt` line 63: `Sitemap: https://docs.applivery.io/sitemap-index.xml`
  - `astro.config.mjs` line 11: `site: 'https://docs.applivery.com'`
  - **These must match.** Decide which is canonical and update the other.
  - If `docs.applivery.com` is correct: update robots.txt
  - If `docs.applivery.io` is correct: update astro.config.mjs

- [ ] **3.3** Validate canonical URLs across locales
  - Every page should have `<link rel="canonical" href="...">` pointing to itself
  - Pages with `translation_key` should have `<link rel="alternate" hreflang="es" href="...">` for each locale variant
  - Verify the `@astrojs/sitemap` i18n config generates correct hreflang in the sitemap
  - Cross-check: canonical URL in HTML matches the URL in the sitemap

- [ ] **3.4** Add sitemap split for large site
  - At 9,000 pages, the sitemap may approach the 50,000 URL / 50MB limit per file
  - `@astrojs/sitemap` auto-generates a sitemap index + split files
  - Verify the split works correctly and all pages are included
  - Consider splitting by locale: `/sitemap-en.xml`, `/sitemap-es.xml`, etc.

- [ ] **3.5** Validate sitemap completeness
  - After build, compare the number of URLs in the sitemap vs pages in `dist/`
  - Ensure no pages are missing (especially dynamically generated ones)
  - Ensure `noindex` pages are excluded from the sitemap
  - Add a build-time check or CI step that counts and reports

---

## Why Accurate Freshness Matters

- Crawlers learn from your `<lastmod>` behavior. If every page shows today's date on every build, crawlers learn the signal is meaningless and reduce recrawl frequency.
- Google's John Mueller has repeatedly stated that inaccurate lastmod is worse than no lastmod.
- AI crawlers (GPTBot, ClaudeBot) use sitemap-based recrawl cadence to determine content freshness.
- RAG systems (ChatGPT Search, Perplexity) surface recent content preferentially.

---

## Validation Criteria

- [ ] Sitemap `<lastmod>` matches each page's actual `updated_date` from CMS
- [ ] Pages without dates have no `<lastmod>` (rather than build date)
- [ ] `robots.txt` Sitemap URL matches `astro.config.mjs` site URL
- [ ] All 9 locales have hreflang alternates in sitemap
- [ ] Every page has a matching canonical URL in both HTML and sitemap
- [ ] Sitemap contains all published, visible, non-noindex pages
- [ ] Total URL count in sitemap matches expected page count (~9,000)
