/**
 * Astro Content Layer Loader for DocForge CMS
 *
 * Replaces per-page API fetching with a single bulk fetch.
 * All documents are loaded into Astro's local data store during build.
 * Pages read from the store — zero network calls during rendering.
 *
 * Phase 0, Task 0.1
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

      // Single bulk fetch — replaces ~18,000 per-page API calls
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
        if (store.keys().next().done === false) {
          logger.warn('Using cached data from previous build');
          return;
        }
        throw error;
      }

      const newIds = new Set<string>();

      for (const doc of documents) {
        const id = doc.id;
        if (!id) continue;

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
        `Store updated: ${newIds.size} documents (${documents.length - [...store.keys()].length + newIds.size} changed)`,
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
    description: doc.description || undefined,
    content: doc.content || '',
    collection: doc.collection || 'docs',
    locale: doc.locale || 'en',
    type: doc.type === 'archive' ? 'archive' : 'article',
    path: doc.path || undefined,
    slug: doc.slug || undefined,

    // Navigation — coerce DB integers to proper types
    visible: doc.visible === 0 || doc.visible === false ? false : true,
    sidebar_position: toNumber(doc.sidebar_position),
    order_num: toNumber(doc.order_num),
    weight: toNumber(doc.weight),
    item_name: doc.item_name || undefined,
    icon: doc.icon || undefined,
    sidebar_icon: doc.sidebar_icon || undefined,
    separator: doc.separator === 1 || doc.separator === true,

    // SEO
    seo_title: doc.seo_title || undefined,
    canonical: doc.canonical || undefined,
    keywords: parseJsonField(doc.keywords),
    hero_image: doc.hero_image || undefined,
    image_alt: doc.image_alt || undefined,

    // Dates — keep as strings, schema will coerce
    date: doc.date || undefined,
    pub_date: doc.pub_date || undefined,
    updated_date: doc.updated_date || undefined,

    // Taxonomy
    author: doc.author || undefined,
    category: parseJsonField(doc.category),
    section: parseJsonField(doc.section),
    translation_key: doc.translation_key || undefined,
    audience: doc.audience || undefined,
    difficulty: doc.difficulty || undefined,
    platform: doc.platform || undefined,
    related: parseJsonField(doc.related),

    // Structured data
    schema_type: doc.schema_type || undefined,
    faqs: parseJsonField(doc.faqs),
    howto: parseJsonField(doc.howto),

    // System
    sha: doc.sha || undefined,
    created_at: doc.created_at || undefined,
    updated_at: doc.updated_at || undefined,

    // Extended metadata (pass through for page rendering)
    headline: doc.headline || undefined,
    target_keyword: doc.target_keyword || undefined,
    reading_time: toNumber(doc.reading_time),
    tldr: doc.tldr || undefined,
    summary: doc.summary || undefined,
    key_takeaways: parseJsonField(doc.key_takeaways),
    noindex: doc.noindex === 1 || doc.noindex === true,
    featured: doc.featured === 1 || doc.featured === true,

    // Open Graph
    og_title: doc.og_title || undefined,
    og_description: doc.og_description || undefined,
    og_image: doc.og_image || undefined,

    // Author
    author_url: doc.author_url || undefined,
  };
}

/** Safely parse a JSON string field (the CMS stores arrays as JSON strings in SQLite) */
function parseJsonField(value: any): any {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch {
      // If it's a plain string, return as-is (might be a comma-separated list)
      return undefined;
    }
  }
  return undefined;
}

/** Safely convert to number, returning undefined for non-numeric values */
function toNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}
