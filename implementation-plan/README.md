# Implementation Plan: LLM/SEO Architecture for docs.applivery.com

> Revisit this document at each interaction to track progress and next steps.
> Scale target: **1,000 docs x 9 locales = 9,000 pages**

---

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Challenged / modified from original recommendation

---

## Phases Overview

| Phase | File | Priority | Status |
|-------|------|----------|--------|
| 0 | [phase-0-build-architecture.md](./phase-0-build-architecture.md) | **BLOCKER** | [x] Code complete, build validation pending |
| 1 | [phase-1-cicd-pipeline.md](./phase-1-cicd-pipeline.md) | URGENT | [~] Code done, manual steps remain (1.7, 1.8) |
| 2 | [phase-2-llm-discoverability.md](./phase-2-llm-discoverability.md) | HIGH | [ ] |
| 3 | [phase-3-sitemap-freshness.md](./phase-3-sitemap-freshness.md) | MEDIUM | [ ] |
| 4 | [phase-4-performance-crawlers.md](./phase-4-performance-crawlers.md) | MEDIUM | [ ] |

**Phase 0 is new** — added after discovering the current architecture cannot build 1,000 docs. It must be completed before anything else.

---

## Audit of the Original 4 Recommendations

### Recommendation 1: "Stay fully static, leverage Astro content collection caching"

**Verdict: [!] Partially wrong — you're NOT using Astro content collections.**

Your Astro site fetches all content from the CMS API at build time via `getStaticPaths()` -> `getDocuments({ limit: 1000 })`. The `src/content/` directory has 1 starter file. Content lives in D1, not local Markdown.

At 1,000 docs x 9 locales, the current `getStaticPaths` approach makes **18,000+ API calls** (per-page refetches for content, translations, children). At 100-300ms each, that's **30-90 minutes** — far beyond Cloudflare's 20-minute build limit.

The fix: Astro 5's Content Layer with a custom CMS loader. One API call, local data store, zero network during rendering.

### Recommendation 2: "Skip the branch/PR ceremony for content"

**Verdict: [x] Already done.** CMS commits directly via Octokit.

### Recommendation 3: "Build only on content-affecting changes (path filtering)"

**Verdict: [!] No CI/CD pipeline exists to filter.** Must create CI first. And since content comes from CMS API (not git files), the trigger should be a webhook, not path filtering.

### Recommendation 4: "Parallel build optimization for 200+ pages"

**Verdict: [!] Replaced by Content Layer approach.** At 9,000 pages, the bottleneck isn't Astro's single-threaded rendering — it's the N+1 API call pattern. Content Layer eliminates this entirely. Astro renders 35-127 pages/second once data is local; the 9,000 pages render in 1-4 minutes.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-13 | Added Phase 0 (Content Layer) | Current API-per-page approach cannot build 1,000 docs within Cloudflare's 20-min limit |
| 2026-02-13 | Content Layer over local .mdx files | CMS stays source of truth; loader caches locally; no file sync needed |
| 2026-02-13 | Challenged all 4 original recommendations | See audit above |
| 2026-02-13 | Prioritized build architecture over SEO | No point optimizing SEO if the site can't build |
| 2026-02-13 | Phase 1 code complete | Workflow, headers, deploy util created. CMS trigger/publish/sync wired. Manual steps: GH secrets + CF project |
| 2026-02-13 | Extracted shared deploy util | `triggerDeployWebhook()` was duplicated in trigger.post.ts and publish.post.ts — now in `server/utils/deploy.ts` |
| 2026-02-13 | Deploy triggers after sync too | sync-batch.post.ts now fires deploy webhook on last batch when content changed |
| 2026-02-13 | Phase 0 code complete | CMS loader, content config, all page routes rewritten to use Content Layer. Zero API calls during rendering |
| 2026-02-13 | Single `docs` collection replaces 8 | All document types (docs, academy, glossary, etc.) in one loader-backed collection, differentiated by `collection` field |
| 2026-02-13 | Precomputed translation/path maps | `translationMap` and `pathPatternMap` built once in `getStaticPaths`, passed via props — no per-page lookups |
| 2026-02-13 | Removed `@astrojs/node` | Unused adapter (output is `static`), removed 18 packages |

---

## Quick Reference: AI Crawlers & Build Constraints

| Fact | Source |
|------|--------|
| AI crawlers do NOT execute JavaScript | 500M+ GPTBot fetches analyzed, zero JS execution |
| 65% of LLM citations target content < 1 year old | Seer Interactive study |
| GPTBot is now the #3 crawler overall (305% growth) | Cloudflare 2025 report |
| No major AI platform confirms reading llms.txt | As of Feb 2026 |
| Schema.org helps Microsoft's LLMs (confirmed) | Fabrice Canel, SMX Munich 2025 |
| Sub-200ms TTFB improves crawl completeness | 107K page study |
| Cloudflare Pages build timeout: 20 minutes | Cloudflare docs |
| Cloudflare Pages file limit: 20,000 (free) / 100,000 (paid) | Cloudflare docs |
| Astro Content Layer: 5x faster builds, 50% less memory | Astro team benchmarks |
| Astro rendering throughput: 35-127 pages/second | Real-world benchmarks |
