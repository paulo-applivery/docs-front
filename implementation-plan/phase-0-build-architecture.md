# Phase 0: Build Architecture — Content Layer Migration

> **Priority: BLOCKER** — the current architecture cannot build 1,000 docs.
> Must be completed before all other phases.

---

## The Problem

Your `[locale]/[...slug].astro` page currently makes multiple API calls **per page** during build:

1. `getStaticPaths()` calls `getDocuments({ limit: 1000 })` — 1 API call
2. Each page calls `getDocument(documentId)` if content is missing — **up to 9,000 calls**
3. Each page calls `getDocuments({ limit: 2000 })` to find translations — **up to 9,000 calls**
4. Each index page calls `getDocuments()` to find children — **hundreds of calls**

At 1,000 docs x 9 locales = 9,000 pages:
- **~18,000 API calls** at 100-300ms each = **30-90 minutes**
- Cloudflare Pages build timeout: **20 minutes**
- **The build will fail.**

---

## The Solution: Astro 5 Content Layer with Custom CMS Loader

Replace per-page API fetching with a single bulk fetch that populates a local data store. Pages read from the store — zero network calls during rendering.

**Expected build times:**
- Cold build (first time): 3-5 minutes
- Warm build (cached store): 1-3 minutes
- Well within the 20-minute limit

---

## Tasks

- [x] **0.1** Create custom Content Layer loader for CMS API
  - **File**: `src/loaders/cms-loader.ts`
  - Single API call: `GET /api/documents?limit=10000`
  - Stores all documents in Astro's data store (`node_modules/.astro/data-store.json`)
  - Uses `generateDigest()` for change detection between builds
  - Graceful degradation: on API failure, keeps cached data from previous build
  - Normalizes CMS DB types (integers → booleans, JSON strings → arrays)

- [x] **0.2** Update `src/content/config.ts` to use the loader
  - Replaced 8 separate `type: 'content'` collections with single loader-backed collection
  - Schema matches CMS Document interface with Zod validation
  - Documents differentiated by `collection` field (docs, academy, glossary, etc.)
  - **File**: `src/content/config.ts`

- [x] **0.3** Rewrite `[locale]/[...slug].astro` to use `getCollection()`
  - Replaced `getDocuments()` API calls with `getCollection('docs')`
  - All data is local — zero network calls during rendering
  - Precomputes translation lookup (group by `translation_key`) once in `getStaticPaths`
  - Precomputes path pattern lookup for translation fallback
  - Passes `allDocs`, `translationMap`, `pathPatternMap` via props — no per-page refetch
  - Child documents, ChildGrid, archive pages all use local store
  - **File**: `src/pages/[locale]/[...slug].astro`

- [x] **0.4** Update other page routes to use `getCollection()`
  - `[...slug].astro` — legacy redirect now uses `getCollection('docs')` + deduplicates slugs
  - `feed.xml.ts` — RSS feed now uses `getCollection('docs')` instead of `getDocuments()`
  - `[collection]/index.astro` — already static (hardcoded collection names, no API calls)
  - `api/navigation.ts` — deprecated, dev-mode only, left as-is
  - **Files**: `src/pages/[...slug].astro`, `src/pages/feed.xml.ts`

- [x] **0.5** CMS `/api/documents` endpoint supports bulk fetch — **ALREADY WORKED**
  - Default limit is 2000, but accepts any integer (no hardcoded max)
  - `limit=10000` works without code changes
  - Auth: supports both session and API key (`getAuthFromSessionOrApiKey`)
  - Response: `{ documents, total, limit, offset }`
  - **No changes needed**

- [x] **0.6** Build environment configured — **DONE IN PHASE 1**
  - `NODE_OPTIONS="--max-old-space-size=4096"` in `deploy.yml`
  - `src/loaders/**` included in push trigger paths
  - **File**: `.github/workflows/deploy.yml`

- [x] **0.7** Data store cached in CI — **DONE IN PHASE 1**
  - `node_modules/.astro/` cached between builds via `actions/cache@v4`
  - Key: `astro-data-${{ hashFiles('package-lock.json') }}`
  - Warm builds skip unchanged documents via `digest` comparison
  - **File**: `.github/workflows/deploy.yml`

- [x] **0.8** Remove unused `@astrojs/node` from package.json — **DONE**
  - Not imported anywhere, output is `static`
  - Ran `npm uninstall @astrojs/node` — removed 18 packages

---

## Phase 0 → Phase 1 Integration Verification

| Connection Point | Phase 0 | Phase 1 | Status |
|------------------|---------|---------|--------|
| Env vars | Loader reads `CMS_URL`, `CMS_API_KEY` via `import.meta.env` | Workflow injects from `${{ secrets.CMS_URL }}`, `${{ secrets.CMS_API_KEY }}` | ✅ Matched |
| Env prefix | `astro.config.mjs`: `vite.envPrefix: ['PUBLIC_', 'CMS_']` | Vars prefixed `CMS_` exposed to `import.meta.env` | ✅ Matched |
| Data store cache | Loader writes to `node_modules/.astro/data-store.json` | Workflow caches `node_modules/.astro/` | ✅ Matched |
| Build command | `astro build` invokes Content Layer → loader fetches once | `npm run build` → `astro check && astro build` | ✅ Matched |
| Deploy trigger | CMS publish/sync → `tryTriggerDeploy()` | Workflow: `repository_dispatch: [cms_content_update]` | ✅ Matched |
| Loader path trigger | Loader at `src/loaders/**` | Workflow push paths include `src/loaders/**` | ✅ Matched |

---

## Architecture Before vs After

**Before (current — N+1 API calls):**
```
getStaticPaths()
  └── GET /api/documents (1 call)

Per page (x 9,000):
  ├── GET /api/documents/{id}    (content fetch)
  ├── GET /api/documents?locale=  (translations)
  └── GET /api/documents?path=    (children, index pages)

Total: ~18,000 API calls
Build time: 30-90 minutes (FAILS on Cloudflare)
```

**After (Content Layer — 1 API call):**
```
Content Layer loader (runs once before build):
  └── GET /api/documents?limit=10000 (1 call)
  └── Stores in local data-store.json

getStaticPaths()
  └── getCollection('docs') — reads from local store
  └── Precomputes: translationMap, pathPatternMap

Per page (x 9,000):
  └── Uses props from getStaticPaths — zero API calls
  └── Child docs, translations, ChildGrid — all from local store

Total: 1 API call
Build time: 3-5 minutes (cold), 1-3 minutes (cached)
```

---

## Validation Criteria

- [ ] `npm run build` completes in under 10 minutes with 1,000 test documents
- [ ] Zero API calls during page rendering (only the loader makes network requests)
- [ ] Warm build (no content changes) completes in under 3 minutes
- [ ] All 9 locales generate correct pages
- [ ] Translation links work correctly via precomputed lookup
- [ ] Index/archive pages correctly list child documents
- [ ] ChildGrid placeholders resolve from local store
- [ ] RSS feed generates from local store
- [ ] Legacy redirect routes use local store
