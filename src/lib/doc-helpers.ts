/**
 * Helper functions for document path/slug manipulation.
 * Extracted from [locale]/[...slug].astro to avoid Astro frontmatter compilation issues.
 *
 * Phase 0
 */

import { locales, type Locale } from './i18n';

export function getIndexFolderPath(doc: { path?: string }): string {
  if (!doc.path) return '';
  // Handle index.md/mdx files
  const indexStripped = doc.path.replace(/\/index\.mdx?$/i, '');
  if (indexStripped !== doc.path) return indexStripped;
  // Handle folder-named files (ipados/ipados.md → ipados/)
  if (isFolderNamedFile(doc.path)) {
    const parts = doc.path.replace(/\.mdx?$/, '').split('/');
    parts.pop(); // remove the duplicate filename
    return parts.join('/');
  }
  return doc.path.replace(/\/index\.mdx?$/i, '');
}

export function isIndexFile(doc: { type?: string; path?: string }): boolean {
  if (doc.type === 'archive') return true;
  if (doc.path) {
    const filename = doc.path.split('/').pop() || '';
    if (/^index\.mdx?$/i.test(filename)) return true;
    // Convention: file named same as parent folder acts as folder index
    // e.g. ipados/ipados.md, android/android.md
    if (isFolderNamedFile(doc.path)) return true;
  }
  return false;
}

/** Check if a file is named the same as its parent folder (e.g. ipados/ipados.md) */
function isFolderNamedFile(path: string): boolean {
  const parts = path.replace(/\.mdx?$/, '').split('/');
  if (parts.length < 2) return false;
  const filename = parts[parts.length - 1].toLowerCase();
  const folder = parts[parts.length - 2].toLowerCase();
  return filename === folder;
}

/** Strip duplicate trailing segment when filename matches parent folder */
function stripFolderNamedFile(slug: string): string {
  const parts = slug.split('/');
  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
    parts.pop();
  }
  return parts.join('/');
}

export function extractSlugFromPath(path: string, isIndex: boolean): string {
  let slug = path.replace(/\.mdx?$/, '');
  slug = slug.replace(/^src\/content\//, '');
  slug = slug.replace(/^content\//, '');
  slug = slug.replace(/^[a-z]{2}\//, '');
  slug = slug.replace(/^docs\//, '');
  slug = slug.replace(/^\/+/, '');
  if (isIndex) {
    slug = slug.replace(/\/index$/i, '');
  }
  slug = slug.toLowerCase();
  // Strip duplicate trailing segment for folder-named files (ipados/ipados → ipados)
  slug = stripFolderNamedFile(slug);
  return slug;
}

export function extractLocaleFromPath(path: string): Locale | null {
  const match = path.match(/^(?:src\/content\/|content\/)?([a-z]{2})\//);
  if (match && locales.includes(match[1] as Locale)) {
    return match[1] as Locale;
  }
  return null;
}

export function getPathPattern(doc: { path?: string }): string | null {
  if (doc.path) {
    return doc.path
      .replace(/^src\/content\//, '')
      .replace(/^content\//, '')
      .replace(/^[a-z]{2}\//, '');
  }
  return null;
}

export function getDocSlug(doc: { path?: string; slug?: string; id: string }): string {
  if (doc.path) {
    let slug = doc.path
      .replace(/\.mdx?$/, '')
      .replace(/^src\/content\//, '')
      .replace(/^content\//, '')
      .replace(/^[a-z]{2}\//, '')
      .replace(/^docs\//, '')
      .toLowerCase();
    return stripFolderNamedFile(slug);
  }
  if (doc.slug) {
    return stripFolderNamedFile(doc.slug.replace(/^docs\//, '').toLowerCase());
  }
  return doc.id;
}

export function getDocUrl(doc: { path?: string; slug?: string; id: string }, docLocale: string): string {
  if (doc.path) {
    let url = doc.path
      .replace(/\.mdx?$/, '')
      .replace(/^src\/content\//, '')
      .replace(/^content\//, '')
      .replace(/^[a-z]{2}\//, '')
      .replace(/^docs\//, '')
      .replace(/\/index$/i, '')
      .toLowerCase();
    // Strip duplicate trailing segment for folder-named files (ipados/ipados → ipados)
    url = stripFolderNamedFile(url);
    if (!url.startsWith('/')) url = '/' + url;
    return `/${docLocale}${url}`;
  }
  if (doc.slug) {
    return `/${docLocale}/${stripFolderNamedFile(doc.slug.toLowerCase())}`;
  }
  return `/${docLocale}/${doc.id}`;
}

export function extractHeadings(content: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Array<{ depth: number; slug: string; text: string }> = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim();
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    headings.push({ depth, slug, text });
  }
  return headings;
}

export const isValidSlug = (val: any): val is string =>
  typeof val === 'string' && val.trim() !== '' && val !== 'null';
