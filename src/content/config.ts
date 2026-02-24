/**
 * Astro Content Collections Configuration
 *
 * The "docs" collection uses the CMS loader to fetch all documents at build time.
 * All other collections are loaded through the same loader (the CMS API returns
 * documents from every collection) and are distinguished by the `collection` field.
 */

import { defineCollection, z } from 'astro:content';
import { cmsLoader } from '../loaders/cms-loader';

// Base frontmatter schema matching the specification
const baseSchema = z.object({
  // Required
  title: z.string(),

  // Organization
  collection: z.enum(['docs', 'api', 'academy', 'insights', 'glossary', 'answers', 'about', 'product-updates', 'roadmap']).optional(),
  locale: z.enum(['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'zh', 'ko']).default('en'),
  type: z.enum(['article', 'archive']).default('article'),

  // System / CMS metadata
  path: z.string().optional(),
  order_num: z.number().optional(),
  sha: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),

  // Navigation
  sidebar_position: z.number().optional(),
  order: z.number().optional(),
  weight: z.number().optional(),
  visible: z.boolean().default(true),
  separator: z.boolean().optional(),
  item_name: z.string().optional(),
  icon: z.string().optional(),
  sidebar_icon: z.string().optional(),
  show_child_grid: z.boolean().optional(),

  // SEO Basic
  description: z.string().optional(),
  seo_title: z.string().optional(),
  headline: z.string().optional(),
  canonical: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  target_keyword: z.string().optional(),
  noindex: z.boolean().optional(),

  // Open Graph
  og_title: z.string().optional(),
  og_description: z.string().optional(),
  og_image: z.string().optional(),

  // Media
  hero_image: z.string().optional(),
  image_alt: z.string().optional(),

  // Dates
  date: z.coerce.date().optional(),
  pub_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),

  // Taxonomy
  author: z.string().optional(),
  author_url: z.string().optional(),
  category: z.array(z.string()).optional(),
  section: z.array(z.string()).optional(),
  slug: z.string().optional(),
  translation_key: z.string().optional(),

  // Context (free-form strings — CMS values vary)
  audience: z.string().optional(),
  difficulty: z.string().optional(),
  platform: z.string().optional(),
  related: z.array(z.string()).optional(),

  // Content metadata
  featured: z.boolean().optional(),
  reading_time: z.number().optional(),
  tldr: z.string().optional(),
  summary: z.string().optional(),
  key_takeaways: z.array(z.string()).optional(),

  // Structured Data (includes WebAPI for API reference pages)
  schema_type: z.string().optional(),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  howto: z.object({
    name: z.string(),
    steps: z.array(z.object({
      name: z.string(),
      text: z.string(),
    })),
  }).optional(),

  // Draft status
  draft: z.boolean().default(false),
});

// Docs collection — uses CMS loader to fetch all documents at build time
const docsCollection = defineCollection({
  loader: cmsLoader({
    cmsUrl: import.meta.env.CMS_URL || 'http://localhost:3000',
    apiKey: import.meta.env.CMS_API_KEY || '',
  }),
  schema: baseSchema,
});

export const collections = {
  docs: docsCollection,
};
