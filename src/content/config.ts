/**
 * Astro Content Collections Configuration
 * Defines schemas for hybrid approach (GitHub content + CMS metadata)
 */

import { defineCollection, z } from 'astro:content';

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

  // Navigation
  sidebar_position: z.number().optional(),
  order: z.number().optional(),
  weight: z.number().optional(),
  visible: z.boolean().default(true),
  separator: z.boolean().optional(),
  item_name: z.string().optional(),
  icon: z.string().optional(),
  sidebar_icon: z.string().optional(),

  // SEO Basic
  description: z.string().optional(),
  seo_title: z.string().optional(),
  headline: z.string().optional(),
  canonical: z.string().url().optional(),
  keywords: z.array(z.string()).optional(),

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
  category: z.array(z.string()).optional(),
  section: z.array(z.string()).optional(),
  slug: z.string().optional(),
  translation_key: z.string().optional(),

  // Context
  audience: z.enum(['developers', 'beginners', 'advanced']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  platform: z.enum(['web', 'ios', 'android', 'windows']).optional(),
  related: z.array(z.string()).optional(),

  // Content metadata
  featured: z.boolean().optional(),
  reading_time: z.number().optional(),
  tldr: z.string().optional(),

  // Structured Data
  schema_type: z.enum(['Article', 'HowTo', 'FAQPage']).optional(),
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

// Docs collection
const docsCollection = defineCollection({
  type: 'content',
  schema: baseSchema,
});

// Academy collection (tutorials, courses)
const academyCollection = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    duration: z.string().optional(),
    prerequisites: z.array(z.string()).optional(),
    objectives: z.array(z.string()).optional(),
  }),
});

// Insights collection (blog posts, articles)
const insightsCollection = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    tags: z.array(z.string()).optional(),
  }),
});

// Glossary collection
const glossaryCollection = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    term: z.string(),
    definition: z.string().optional(),
    aliases: z.array(z.string()).optional(),
  }),
});

// Answers collection (FAQ-style)
const answersCollection = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    question: z.string().optional(),
    short_answer: z.string().optional(),
  }),
});

// About pages
const aboutCollection = defineCollection({
  type: 'content',
  schema: baseSchema,
});

// Product Updates / Changelog
const productUpdatesCollection = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    version: z.string().optional(),
    release_date: z.coerce.date().optional(),
    breaking_changes: z.boolean().optional(),
    features: z.array(z.string()).optional(),
    fixes: z.array(z.string()).optional(),
  }),
});

// Roadmap
const roadmapCollection = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']).optional(),
    target_date: z.coerce.date().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  }),
});

export const collections = {
  docs: docsCollection,
  academy: academyCollection,
  insights: insightsCollection,
  glossary: glossaryCollection,
  answers: answersCollection,
  about: aboutCollection,
  'product-updates': productUpdatesCollection,
  roadmap: roadmapCollection,
};
