/**
 * Astro Content Layer Configuration
 *
 * Uses a custom CMS loader to fetch all documents in a single API call.
 * Replaces the per-page API fetching pattern that couldn't scale beyond ~200 docs.
 *
 * Phase 0, Task 0.2
 */

import { defineCollection, z } from 'astro:content';
import { cmsLoader } from '../loaders/cms-loader';

/**
 * Single unified collection for all CMS documents.
 * Documents are differentiated by the `collection` field (docs, academy, glossary, etc.)
 * rather than separate Astro collections — the CMS stores everything in one table.
 */
const docs = defineCollection({
  loader: cmsLoader({
    cmsUrl: import.meta.env.CMS_URL || 'http://localhost:3000',
    apiKey: import.meta.env.CMS_API_KEY || '',
  }),
  schema: z.object({
    // Core
    title: z.string(),
    description: z.string().optional(),
    content: z.string().default(''),
    collection: z.string().default('docs'),
    locale: z.string().default('en'),
    type: z.enum(['article', 'archive']).default('article'),
    path: z.string().optional(),
    slug: z.string().optional(),

    // Navigation
    visible: z.boolean().default(true),
    sidebar_position: z.number().optional(),
    order_num: z.number().optional(),
    weight: z.number().optional(),
    item_name: z.string().optional(),
    icon: z.string().optional(),
    sidebar_icon: z.string().optional(),
    separator: z.boolean().optional(),

    // SEO
    seo_title: z.string().optional(),
    canonical: z.string().optional(),
    keywords: z.any().optional(),
    hero_image: z.string().optional(),
    image_alt: z.string().optional(),

    // Dates — accept strings (CMS returns ISO strings)
    date: z.string().optional(),
    pub_date: z.string().optional(),
    updated_date: z.string().optional(),

    // Taxonomy
    author: z.string().optional(),
    category: z.any().optional(),
    section: z.any().optional(),
    translation_key: z.string().optional(),
    audience: z.string().optional(),
    difficulty: z.string().optional(),
    platform: z.string().optional(),
    related: z.any().optional(),

    // Structured data
    schema_type: z.string().optional(),
    faqs: z.any().optional(),
    howto: z.any().optional(),

    // System
    sha: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),

    // Extended metadata (used in page rendering)
    headline: z.string().optional(),
    target_keyword: z.string().optional(),
    reading_time: z.number().optional(),
    tldr: z.string().optional(),
    summary: z.string().optional(),
    key_takeaways: z.any().optional(),
    noindex: z.boolean().optional(),
    featured: z.boolean().optional(),

    // Open Graph
    og_title: z.string().optional(),
    og_description: z.string().optional(),
    og_image: z.string().optional(),

    // Author
    author_url: z.string().optional(),
  }),
});

export const collections = { docs };
