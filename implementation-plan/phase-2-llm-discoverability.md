# Phase 2: LLM Discoverability

> **Priority: HIGH** — low effort, high impact on AI search visibility.
> Depends on: Phase 0 (need content data available for generation)

---

## Context

Your site has solid foundations (robots.txt, llms.txt, sitemap, OG tags) but several issues reduce effectiveness:
- `robots.txt` is missing key AI crawlers and has a wrong user-agent
- `llms.txt` doesn't follow the actual spec format
- No JSON-LD structured data on content pages
- No visible freshness signals (last-updated dates)
- No auto-generated `llms-full.txt`

---

## Tasks

- [ ] **2.1** Fix `robots.txt` — add missing crawlers and fix user-agents
  - **Add** `OAI-SearchBot` (ChatGPT Search — distinct from GPTBot)
  - **Add** `Applebot-Extended` (Apple Intelligence)
  - **Add** `Google-Extended` (Gemini model training)
  - **Add** `CCBot` (Common Crawl — feeds LLM pre-training corpora)
  - **Fix** `Claude-Web` → `ClaudeBot` (correct user-agent string)
  - **Fix** Sitemap URL: currently `docs.applivery.io`, should match `astro.config.mjs` site
  ```
  # Missing entries to add:
  User-agent: OAI-SearchBot
  Allow: /

  User-agent: Applebot-Extended
  Allow: /

  User-agent: Google-Extended
  Allow: /

  User-agent: CCBot
  Allow: /

  # Fix existing:
  # Claude-Web → ClaudeBot
  User-agent: ClaudeBot
  Allow: /
  ```

- [ ] **2.2** Rewrite `llms.txt` to comply with the llmstxt.org spec
  - Current format uses non-standard YAML-like syntax (`> Key: Value`)
  - Spec requires: H1 title, blockquote summary, H2 sections, Markdown link lists
  - Must contain actual URLs to key pages
  ```markdown
  # Applivery Documentation

  > Complete technical documentation for Applivery's MDM, app distribution,
  > and endpoint management platforms. Covers iOS, Android, and Windows
  > device management, platform administration, and API reference.

  ## Getting Started

  - [Platform Overview](https://docs.applivery.com/en/docs/platform/getting-started/overview): Initial setup and configuration
  - [Android Management](https://docs.applivery.com/en/docs/device-management/android/overview): Android enterprise device management
  - [Apple Management](https://docs.applivery.com/en/docs/device-management/apple/overview): iOS and macOS device management

  ## Documentation

  - [Device Management](https://docs.applivery.com/en/docs/device-management): Full MDM documentation
  - [Platform](https://docs.applivery.com/en/docs/platform): Admin console guides
  - [API Reference](https://docs.applivery.com/en/docs/api): REST API documentation

  ## Optional

  - [Academy](https://docs.applivery.com/en/academy): Tutorials and courses
  - [Glossary](https://docs.applivery.com/en/glossary): Technical terminology
  - [Product Updates](https://docs.applivery.com/en/product-updates): Changelog
  ```

- [ ] **2.3** Auto-generate `llms.txt`, `llms-full.txt`, and `llms-small.txt` at build time
  - Create a build script or Astro integration that runs after content is loaded
  - **`llms.txt`** — Table of contents: page title + URL + one-line description for every page
  - **`llms-full.txt`** — Full content of all docs concatenated as Markdown (for RAG ingestion)
  - **`llms-small.txt`** — Hierarchy only: section headings and page titles (for token-limited agents)
  - Source data: `getCollection('docs')` from Content Layer (Phase 0)
  - Output to `dist/` during build or use `public/` with a pre-build script
  - Consider `@4hse/astro-llms-txt` Astro integration as a starting point

- [ ] **2.4** Add JSON-LD structured data to every content page
  - Render in `<head>` of BaseLayout.astro or DocLayout.astro — **must be server-rendered**
  - AI crawlers do NOT execute JavaScript; client-rendered JSON-LD is invisible to them
  - Schema types by page:
    | Page type | Schema | Key fields |
    |-----------|--------|------------|
    | Documentation | `TechArticle` | datePublished, dateModified, author, publisher, headline |
    | Tutorial | `HowTo` | name, step[].name, step[].text (from `howto` frontmatter) |
    | FAQ | `FAQPage` | mainEntity[].name, mainEntity[].acceptedAnswer (from `faqs`) |
    | All pages | `BreadcrumbList` | itemListElement (from URL path segments) |
    | Homepage | `WebSite` + `Organization` | Already partially implemented |
  ```astro
  <!-- In DocLayout.astro <head> -->
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": document.data.seo_title || document.data.title,
    "description": document.data.description,
    "datePublished": document.data.pub_date || document.data.date,
    "dateModified": document.data.updated_date || document.data.updated_at,
    "author": {
      "@type": "Organization",
      "name": "Applivery",
      "url": "https://www.applivery.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Applivery",
      "logo": { "@type": "ImageObject", "url": "https://docs.applivery.com/logo.png" }
    },
    "mainEntityOfPage": canonicalUrl
  })} />
  ```

- [ ] **2.5** Add visible "Last updated" dates on every page
  - Display `updated_date` or `updated_at` prominently in the doc page header
  - Use `<time datetime="2026-02-13T...">` for machine readability
  - LLMs show strong recency bias: 65% of citations target content under 1 year old
  - Textual cue: "Last updated February 13, 2026" visible to both humans and crawlers

---

## Evidence: Why This Matters

| Signal | Impact | Confidence |
|--------|--------|------------|
| JSON-LD `dateModified` | Microsoft confirmed it helps Bing Copilot/LLMs interpret content | **Proven** |
| Correct robots.txt | GPTBot, ClaudeBot, etc. respect it; wrong user-agents = invisible | **Proven** |
| llms.txt (spec-compliant) | IDE agents (Cursor, Cline) read it; major LLM crawlers unconfirmed | **Useful, unconfirmed** |
| llms-full.txt | RAG pipelines and coding assistants actively ingest it | **Proven for dev tools** |
| Visible update dates | 65% of LLM citations target content < 1 year old | **Proven** |

---

## Validation Criteria

- [ ] `robots.txt` includes all 10+ AI crawler user-agents with correct names
- [ ] `llms.txt` passes validation at llmstxt.org (H1, blockquote, H2 sections, link lists)
- [ ] `llms-full.txt` is auto-generated at build and contains all doc content
- [ ] Every content page has `<script type="application/ld+json">` in the static HTML
- [ ] Google Rich Results Test validates the structured data
- [ ] Every doc page shows a visible "Last updated" date
