/**
 * RSS Feed Generator
 * Provides RSS 2.0 feed for documentation updates
 * Useful for SEO, LLM crawlers, and content syndication
 */

import type { APIRoute } from 'astro';
import { getDocuments, getAllSettings, resolveMediaUrl } from '../lib/cms';

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
  // Fetch settings and documents
  let settings;
  let documents: Awaited<ReturnType<typeof getDocuments>>['documents'] = [];

  try {
    const [settingsResult, docsResult] = await Promise.all([
      getAllSettings(),
      getDocuments({ limit: 100, visible: true }),
    ]);
    settings = settingsResult;
    documents = docsResult.documents;
  } catch (error) {
    console.error('Failed to fetch data for RSS feed:', error);
    return new Response('Error generating feed', { status: 500 });
  }

  const siteUrl = settings?.seo?.siteUrl || site?.href || 'https://docs.applivery.io';
  const siteName = settings?.seo?.siteName || 'Documentation';
  const siteDescription = 'Technical documentation and guides';

  // Sort documents by date (newest first)
  const sortedDocs = documents
    .filter(doc => doc.pub_date || doc.date || doc.updated_date)
    .sort((a, b) => {
      const dateA = new Date(a.updated_date || a.pub_date || a.date || 0);
      const dateB = new Date(b.updated_date || b.pub_date || b.date || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 50); // Limit to 50 items

  // Find the most recent update date
  const lastBuildDate = sortedDocs.length > 0
    ? formatRssDate(sortedDocs[0].updated_date || sortedDocs[0].pub_date || sortedDocs[0].date)
    : new Date().toUTCString();

  // Build RSS feed
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
    ${sortedDocs.map(doc => {
      const collection = doc.collection || 'docs';
      const slug = doc.path
        ? doc.path.replace(/\.mdx?$/, '').replace(/^src\/content\//, '').replace(/^content\//, '').replace(/^\/+/, '').toLowerCase()
        : (doc.slug || doc.id);
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
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};
