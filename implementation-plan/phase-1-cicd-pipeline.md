# Phase 1: CI/CD Pipeline

> **Priority: URGENT** — nothing deploys automatically without this.
> Depends on: Phase 0 (build must work first)

---

## Context

There is no `.github/workflows/` directory. No automated builds. No deploy triggers. Content changes sit in GitHub / the CMS database until someone manually runs `npm run build`. This must be automated.

Since content comes from the CMS API (not git files), the primary trigger should be a **webhook from the CMS** — not a git push path filter.

---

## Tasks

- [x] **1.1** Create `.github/workflows/deploy.yml`
  - Primary trigger: `repository_dispatch` event with type `cms_content_update`
  - Secondary trigger: push to `main` for code changes (layouts, components, config, public assets)
  - Manual trigger via `workflow_dispatch`
  - Concurrency group with `cancel-in-progress: true` for debouncing
  - Build: `npm ci && npm run build` with `NODE_OPTIONS="--max-old-space-size=4096"`
  - Deploy: `wrangler pages deploy dist --project-name=docforge-web`
  - Cache: `node_modules/.astro/` for Content Layer data store
  - **File**: `docs-front/.github/workflows/deploy.yml`

- [x] **1.2** CMS build trigger endpoint — **ALREADY EXISTED**
  - `POST /api/deploy/trigger` in docs-cms already supports `repository_dispatch`
  - Uses `event_type: "cms_content_update"` (matched in workflow)
  - Reads deploy settings from DB (`settings.category = 'deploy'`)
  - Supports: `github-actions`, `vercel`, `netlify`, `cloudflare`, `custom` providers
  - **Refactored**: Extracted `triggerDeployWebhook()` into shared `server/utils/deploy.ts`
  - **File**: `docs-cms/server/api/deploy/trigger.post.ts` (refactored to use shared util)

- [x] **1.3** Wire trigger into CMS publish and sync flows
  - `publish.post.ts` already called deploy after publish — **refactored** to use shared `tryTriggerDeploy()`
  - `sync-batch.post.ts` now triggers deploy on last batch when content changed (created/updated/deleted > 0)
  - Deploy only fires when `autoTrigger !== false` in deploy settings
  - **Files modified**:
    - `docs-cms/server/utils/deploy.ts` (NEW — shared deploy utility)
    - `docs-cms/server/api/github/publish.post.ts` (refactored)
    - `docs-cms/server/api/github/sync-batch.post.ts` (added trigger)

- [x] **1.4** Add `_headers` file for Cloudflare Pages cache rules
  - Hashed `/_astro/*` assets: `immutable, max-age=1y`
  - HTML pages: `max-age=0, must-revalidate` (always fresh)
  - SEO/discovery files (robots.txt, sitemap, llms.txt): `max-age=1h`
  - Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
  - **File**: `docs-front/public/_headers`

- [x] **1.5** CMS deploy settings UI — **ALREADY EXISTED**
  - `pages/settings/deploy.vue` already has full UI: provider selection, webhook URL, auto-trigger toggle, test deploy button
  - No changes needed

- [x] **1.6** Deploy debouncing via GitHub Actions concurrency
  - `concurrency: { group: deploy, cancel-in-progress: true }` in workflow
  - Multiple rapid CMS publishes cancel in-flight builds, only the latest runs
  - No CMS-side debouncing needed with this approach

- [ ] **1.7** Add GitHub Actions secrets *(manual step — requires repo admin)*
  - `CMS_URL` — production CMS URL
  - `CMS_API_KEY` — API key for build-time document fetching
  - `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Pages deploy permission
  - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID
  - `SITE_URL` — `https://docs.applivery.com` (as a GitHub variable, not secret)

- [ ] **1.8** Create Cloudflare Pages project *(manual step — requires Cloudflare admin)*
  - Create project in Cloudflare dashboard or via `wrangler pages project create docforge-web`
  - Custom domain: `docs.applivery.com`
  - Build output directory: `dist`
  - No Cloudflare build — we deploy pre-built from GitHub Actions

---

## Build Budget at Scale

| Metric | Free Plan | Pro Plan |
|--------|-----------|----------|
| Monthly builds (GitHub Actions) | 2,000 min/month | 3,000 min/month |
| Monthly deploys (Cloudflare) | 500 | 5,000 |
| Build time per deploy | ~3-5 min | ~3-5 min |
| Max deploys at 5 min each | 400/month (GH) | 600/month (GH) |

At 10 content updates/day = 300 deploys/month, free plans are sufficient. With debouncing, this drops to ~100-150 deploys/month.

---

## Validation Criteria

- [ ] Push to `main` triggers a build and deploys to Cloudflare Pages
- [ ] CMS publish triggers a build via `repository_dispatch`
- [ ] CMS sync triggers a build after last batch completes
- [ ] Build completes in under 10 minutes
- [ ] Data store cache persists between builds (warm builds are faster)
- [ ] Multiple rapid edits don't trigger excessive builds (concurrency cancels old builds)
- [ ] Build failures are visible via GitHub Actions UI
- [ ] Cache headers serve correctly on deployed site
