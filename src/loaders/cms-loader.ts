/**
 * Astro Content Layer Loader for DocForge CMS
 *
 * Replaces per-page API fetching with a single bulk fetch.
 * All documents are loaded into Astro's local data store during build.
 * Pages read from the store — zero network calls during rendering.
 *
 * Also fetches API reference docs from the api-docs endpoint and merges
 * them into the same store, so API pages render through the same pipeline.
 *
 * Phase 0, Task 0.1 + API docs integration
 */

import type { Loader } from 'astro/loaders';

export interface CmsLoaderConfig {
  cmsUrl: string;
  apiKey: string;
}

export function cmsLoader(config: CmsLoaderConfig): Loader {
  return {
    name: 'applivery-cms',

    load: async ({ store, meta, parseData, generateDigest, logger }) => {
      const lastSync = meta.get('lastSync');
      logger.info(
        `Fetching documents from CMS (last sync: ${lastSync || 'never'})`,
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        headers['x-api-key'] = config.apiKey;
      }

      // ── Fetch regular documents ──────────────────────────────────────
      const url = `${config.cmsUrl}/api/documents?limit=10000`;
      let documents: any[];

      try {
        const res = await fetch(url, { headers });

        if (!res.ok) {
          throw new Error(`CMS API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        documents = data.documents || [];
        logger.info(
          `Received ${documents.length} documents (total: ${data.total})`,
        );
      } catch (error) {
        logger.error(`Failed to fetch from CMS: ${error}`);
        // On failure, keep the existing store data (graceful degradation)
        if (store.keys().length > 0) {
          logger.warn('Using cached data from previous build');
          return;
        }
        throw error;
      }

      // ── Fetch API reference docs ─────────────────────────────────────
      let apiDocuments: any[] = [];
      try {
        const apiUrl = `${config.cmsUrl}/api/documents/api-docs?limit=10000`;
        const apiRes = await fetch(apiUrl, { headers });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          apiDocuments = apiData.documents || [];
          logger.info(
            `Received ${apiDocuments.length} API docs (total: ${apiData.total})`,
          );
        } else {
          // Non-fatal: API docs endpoint might not exist yet
          logger.warn(`API docs endpoint returned ${apiRes.status} — skipping`);
        }
      } catch (error) {
        logger.warn(`Failed to fetch API docs (non-fatal): ${error}`);
      }

      // Always ensure the /en/api/ index page exists even if the endpoint
      // isn't available yet — so the route is always reachable.
      //
      // When the CMS api-docs endpoint returns real data it includes a proper
      // archive-type index with children.  The fallback below uses type
      // 'article' so it passes through getStaticPaths() without needing
      // children (archive pages are filtered out when they have none).
      const hasApiIndex = apiDocuments.some(
        (d: any) => d.id === 'api-index' || d.slug === 'api',
      );
      const hasApiChildren = apiDocuments.some(
        (d: any) => d.id !== 'api-index' && d.slug !== 'api',
      );
      if (!hasApiIndex) {
        const now = new Date().toISOString();
        apiDocuments.push({
          id: 'api-index',
          title: 'API Reference',
          description:
            'Complete API reference documentation. Browse endpoints organized by resource.',
          content: '',
          collection: 'api',
          locale: 'en',
          // Use 'archive' only when there are child API docs to render;
          // otherwise 'article' so the page is not filtered out by
          // the hasChildren check in getStaticPaths().
          type: hasApiChildren ? 'archive' : 'article',
          path: 'content/en/docs/api/index.md',
          slug: 'api',
          visible: true,
          sidebar_position: 0,
          item_name: 'API Reference',
          sidebar_icon: 'code',
          seo_title: 'API Reference | Documentation',
          schema_type: 'WebAPI',
          show_child_grid: hasApiChildren,
          date: now,
          pub_date: now,
          created_at: now,
          updated_at: now,
        });
      }

      // ── Merge all documents into store ───────────────────────────────
      const allDocuments = [...documents, ...apiDocuments];
      const newIds = new Set<string>();

      for (const doc of allDocuments) {
        const id = String(doc.id);
        if (!id || id === 'undefined') continue;

        newIds.add(id);

        // Generate digest from the full document for change detection
        const digest = generateDigest(doc);
        const existing = store.get(id);

        // Skip unchanged documents (makes warm builds fast)
        if (existing?.digest === digest) continue;

        // Normalize CMS fields to match the schema
        const normalized = normalizeCmsDocument(doc);

        try {
          const data = await parseData({ id, data: normalized });
          store.set({
            id,
            data,
            digest,
            // Store rendered HTML content for direct access
            rendered: { html: doc.content || '' },
          });
        } catch (parseError) {
          logger.warn(
            `Failed to parse document "${doc.title}" (${id}): ${parseError}`,
          );
        }
      }

      // Remove documents deleted from CMS
      let deletedCount = 0;
      for (const oldId of store.keys()) {
        if (!newIds.has(oldId)) {
          store.delete(oldId);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`Removed ${deletedCount} deleted documents from store`);
      }

      meta.set('lastSync', new Date().toISOString());
      logger.info(
        `Store updated: ${newIds.size} documents (${store.keys().length} in store)`,
      );
    },
  };
}

/**
 * Normalize CMS API response fields to match the Astro content schema.
 * The CMS returns raw DB values; we need to coerce types for Zod validation.
 */
function normalizeCmsDocument(doc: any): Record<string, any> {
  return {
    // Core fields
    title: doc.title || 'Untitled',
    description: toStr(doc.description),
    content: doc.content || '',
    collection: doc.collection || 'docs',
    locale: doc.locale || 'en',
    type: doc.type === 'archive' ? 'archive' : 'article',
    path: toStr(doc.path),
    slug: toStr(doc.slug),

    // Navigation — coerce DB integers to proper types
    visible: doc.visible === 0 || doc.visible === false ? false : true,
    sidebar_position: toNumber(doc.sidebar_position),
    order_num: toNumber(doc.order_num),
    weight: toNumber(doc.weight),
    item_name: toStr(doc.item_name),
    icon: toStr(doc.icon),
    sidebar_icon: toStr(doc.sidebar_icon),
    separator: doc.separator === 1 || doc.separator === true,
    show_child_grid: doc.show_child_grid === 0 || doc.show_child_grid === false ? false : true,

    // SEO
    seo_title: toStr(doc.seo_title),
    headline: toStr(doc.headline),
    canonical: toStr(doc.canonical),
    keywords: parseJsonField(doc.keywords),
    target_keyword: toStr(doc.target_keyword),
    noindex: doc.noindex === 1 || doc.noindex === true,
    hero_image: toStr(doc.hero_image),
    image_alt: toStr(doc.image_alt),

    // Dates — only pass valid date strings
    date: toDate(doc.date),
    pub_date: toDate(doc.pub_date),
    updated_date: toDate(doc.updated_date),

    // Taxonomy
    author: toStr(doc.author),
    author_url: toStr(doc.author_url),
    category: parseJsonField(doc.category),
    section: parseJsonField(doc.section),
    translation_key: toStr(doc.translation_key),
    audience: toStr(doc.audience),
    difficulty: toStr(doc.difficulty),
    platform: toStr(doc.platform),
    related: parseJsonField(doc.related),

    // Structured data
    schema_type: toStr(doc.schema_type),
    faqs: parseJsonField(doc.faqs),
    howto: parseJsonField(doc.howto),

    // System
    sha: toStr(doc.sha),
    created_at: toStr(doc.created_at),
    updated_at: toStr(doc.updated_at),

    // Extended metadata (pass through for page rendering)
    reading_time: toNumber(doc.reading_time),
    tldr: toStr(doc.tldr),
    summary: toStr(doc.summary),
    key_takeaways: parseJsonField(doc.key_takeaways),
    featured: doc.featured === 1 || doc.featured === true,

    // Open Graph
    og_title: toStr(doc.og_title),
    og_description: toStr(doc.og_description),
    og_image: toStr(doc.og_image),
  };
}

/** Safely parse a JSON string field (the CMS stores arrays as JSON strings in SQLite) */
function parseJsonField(value: any): any {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value.length > 0 ? value : undefined;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      // JSON.parse("null") returns null — treat as undefined
      if (parsed === null) return undefined;
      return parsed;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** Safely convert to string, returning undefined for null/empty/falsy values */
function toStr(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  if (!s || s === 'null' || s === 'undefined') return undefined;
  return s;
}

/** Safely convert to a valid date string, returning undefined for invalid dates */
function toDate(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  if (!s || s === 'null' || s === 'undefined') return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : s;
}

/** Safely convert to number, returning undefined for non-numeric values */
function toNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}
