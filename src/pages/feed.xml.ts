/**
 * RSS Feed Generator
 * Provides RSS 2.0 feed for documentation updates
 * Useful for SEO, LLM crawlers, and content syndication
 *
 * Phase 0: Uses getCollection() instead of API call
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAllSettings, resolveMediaUrl } from '../lib/cms';

// Helper to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to format date for RSS (RFC 822)
function formatRssDate(dateString: string | undefined): string {
  if (!dateString) return new Date().toUTCString();
  try {
    return new Date(dateString).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

// Strip HTML tags for plain text description
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

export const GET: APIRoute = async ({ site }) => {
  let settings;

  try {
    settings = await getAllSettings();
  } catch (error) {
    console.error('Failed to fetch settings for RSS feed:', error);
  }

  // Read from local data store — no API call
  const allDocs = await getCollection('docs');

  const siteUrl = settings?.seo?.siteUrl || site?.href || 'https://docs.applivery.com';
  const siteName = settings?.seo?.siteName || 'Documentation';
  const siteDescription = 'Technical documentation and guides';

  // Sort documents by date (newest first), filter to those with dates and visible
  const sortedDocs = allDocs
    .filter(entry => {
      const d = entry.data;
      return d.visible !== false && (d.pub_date || d.date || d.updated_date);
    })
    .sort((a, b) => {
      const dateA = new Date(a.data.updated_date || a.data.pub_date || a.data.date || 0);
      const dateB = new Date(b.data.updated_date || b.data.pub_date || b.data.date || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 50);

  const lastBuildDate = sortedDocs.length > 0
    ? formatRssDate(sortedDocs[0].data.updated_date || sortedDocs[0].data.pub_date || sortedDocs[0].data.date)
    : new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <generator>Astro</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <ttl>60</ttl>
    ${settings?.appearance?.branding?.logo ? `
    <image>
      <url>${new URL(settings.appearance.branding.logo, siteUrl).href}</url>
      <title>${escapeXml(siteName)}</title>
      <link>${siteUrl}</link>
    </image>` : ''}
    ${sortedDocs.map(entry => {
      const doc = entry.data;
      const collection = doc.collection || 'docs';
      const slug = doc.path
        ? doc.path.replace(/\.mdx?$/, '').replace(/^src\/content\//, '').replace(/^content\//, '').replace(/^\/+/, '').toLowerCase()
        : (doc.slug || entry.id);
      const itemUrl = `${siteUrl}/${slug}`;
      const pubDate = formatRssDate(doc.pub_date || doc.date);
      const description = doc.description || doc.tldr || '';

      return `
    <item>
      <title>${escapeXml(doc.title)}</title>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <description>${escapeXml(stripHtml(description))}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(collection)}</category>
      ${doc.section ? `<category>${escapeXml(Array.isArray(doc.section) ? doc.section[0] : doc.section)}</category>` : ''}
      ${doc.author ? `<dc:creator>${escapeXml(doc.author)}</dc:creator>` : ''}
      ${doc.hero_image ? `<enclosure url="${new URL(resolveMediaUrl(doc.hero_image), siteUrl).href}" type="image/jpeg" />` : ''}
    </item>`;
    }).join('')}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
