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

const withCollectionPrefix = (slug: string, collection?: string): string => {
  if (!collection || collection === 'docs') return slug;
  if (slug.includes('/')) return slug;
  return `${collection}/${slug}`;
};

export function getDocSlug(doc: { path?: string; slug?: string; id: string; collection?: string }): string {
  if (doc.path) {
    // When path exists, derive slug entirely from path (authoritative source)
    let pathSlug = doc.path
      .replace(/\.mdx?$/, '')
      .replace(/^src\/content\//, '')
      .replace(/^content\//, '')
      .replace(/^[a-z]{2}\//, '')
      .replace(/^docs\//, '')
      .toLowerCase();
    pathSlug = stripFolderNamedFile(pathSlug);
    return pathSlug;
  }
  if (doc.slug) {
    return stripFolderNamedFile(withCollectionPrefix(doc.slug.replace(/^docs\//, '').toLowerCase(), doc.collection));
  }
  return withCollectionPrefix(doc.id, doc.collection);
}

export function getDocUrl(doc: { path?: string; slug?: string; id: string; collection?: string }, docLocale: string): string {
  if (doc.path) {
    let url = doc.path
      .replace(/\.mdx?$/, '')
      .replace(/^src\/content\//, '')
      .replace(/^content\//, '')
      .replace(/^[a-z]{2}\//, '')
      .replace(/^docs\//, '')
      .replace(/\/index$/i, '')
      .toLowerCase();
    url = stripFolderNamedFile(url);

    if (!url.startsWith('/')) url = '/' + url;
    return `/${docLocale}${url}`;
  }
  if (doc.slug) {
    return `/${docLocale}/${stripFolderNamedFile(withCollectionPrefix(doc.slug.toLowerCase(), doc.collection))}`;
  }
  return `/${docLocale}/${withCollectionPrefix(doc.id, doc.collection)}`;
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
