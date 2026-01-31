/**
 * Navigation API - DEPRECATED
 *
 * This endpoint only works in dev mode (Astro static builds prerender it without query params).
 * In production, the sidebar fetches navigation data directly from the CMS API
 * at /api/docs/navigation on the CMS server.
 *
 * Kept as a dev-mode fallback only.
 */

// export const prerender = false; // Only works in hybrid/server mode

import type { APIRoute } from 'astro';
import { getDocuments, getFolderSettings, type Document, type FolderSettingsMap } from '../../lib/cms';

interface FolderItem {
  type: 'folder' | 'file';
  name: string;
  title: string;
  path: string;
  href: string;
  icon?: string;
  order: number;
  children?: FolderItem[];
}

/**
 * Build folder tree structure from flat documents list
 * @param folderSettings - Map of folder paths to their custom settings (label, icon, order)
 */
function buildFolderTree(
  documents: Document[],
  basePath: string,
  collection: string,
  locale: string,
  folderSettings: FolderSettingsMap = {}
): FolderItem[] {
  // Use a map to track all folders by their full path
  const folderMap: Record<string, FolderItem> = {};
  const rootItems: FolderItem[] = [];

  // Sort documents by order
  const sortedDocs = [...documents].sort((a, b) => {
    const orderA = a.sidebar_position ?? a.order_num ?? a.weight ?? 999;
    const orderB = b.sidebar_position ?? b.order_num ?? b.weight ?? 999;
    return orderA - orderB;
  });

  for (const doc of sortedDocs) {
    if (doc.visible === false || doc.visible === 0) continue;
    if (!doc.path) continue;

    // Skip index files - they are archive pages, not menu items
    const filename = doc.path.split('/').pop() || '';
    if (/^index\.mdx?$/i.test(filename)) continue;
    if (doc.type === 'archive') continue;

    // Extract path relative to the base folder
    const fullPath = doc.path.replace(/\.(mdx?|md)$/, '');
    const parts = fullPath.split('/');

    // Find the base path index
    const baseIndex = parts.findIndex(p => p === basePath);
    if (baseIndex === -1) continue;

    // Get parts after the base path
    const relativeParts = parts.slice(baseIndex + 1);
    if (relativeParts.length === 0) continue;

    // Build href - always derive from path to preserve folder hierarchy
    // New URL structure: /{locale}/{path} (no /docs prefix since subdomain indicates docs)
    let href: string;
    if (doc.path) {
      href = doc.path
        .replace(/\.mdx?$/, '')
        .replace(/^src\/content\//, '')
        .replace(/^content\//, '')
        .replace(/^[a-z]{2}\//, '')
        .replace(/^docs\//, '')
        .replace(/^\/+/, '')
        .toLowerCase();
      href = `/${locale}/${href}`;
    } else {
      // Fallback to relative parts
      href = `/${locale}/${basePath}/${relativeParts.join('/')}`.toLowerCase();
    }

    const fileName = relativeParts[relativeParts.length - 1];
    const folderPath = relativeParts.slice(0, -1);

    // Create the file item
    const fileItem: FolderItem = {
      type: 'file',
      name: fileName,
      title: doc.item_name || doc.title,
      path: doc.path,
      href,
      icon: doc.sidebar_icon || doc.icon,
      order: doc.sidebar_position ?? doc.order_num ?? doc.weight ?? 999,
    };

    // If there are folders in the path, ensure folder structure exists
    if (folderPath.length > 0) {
      // Build folder hierarchy
      let currentPath = '';
      for (let i = 0; i < folderPath.length; i++) {
        const folder = folderPath[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${folder}` : folder;

        // Create folder if it doesn't exist
        if (!folderMap[currentPath]) {
          // Build the full folder path for settings lookup
          // The admin stores paths like: content/en/docs/endpoint-management/android
          // where 'docs' is the collection, 'endpoint-management' is basePath, 'android' is currentPath
          const fullFolderPathWithCollection = `content/${locale}/${collection}/${basePath}/${currentPath}`;
          const fullFolderPath = `content/${locale}/${basePath}/${currentPath}`;
          const altFolderPath = `${locale}/${basePath}/${currentPath}`;
          const shortFolderPath = `${basePath}/${currentPath}`;

          // Debug: Log path lookups
          console.log(`Navigation API - Looking up folder settings for: ${fullFolderPathWithCollection} | ${fullFolderPath} | ${altFolderPath} | ${shortFolderPath} | ${currentPath}`);
          console.log(`Navigation API - Available keys in folderSettings:`, Object.keys(folderSettings));

          // Look up folder settings (try multiple path formats)
          // Priority: full path with collection > full path > alt path > short path > just folder name
          const settings = folderSettings[fullFolderPathWithCollection] ||
                          folderSettings[fullFolderPath] ||
                          folderSettings[altFolderPath] ||
                          folderSettings[shortFolderPath] ||
                          folderSettings[currentPath] ||
                          {};

          // Debug: Log if settings were found
          if (Object.keys(settings).length > 0) {
            console.log(`Navigation API - Found settings for folder:`, settings);
          }

          const folderItem: FolderItem = {
            type: 'folder',
            name: folder,
            title: settings.label || formatTitle(folder),
            path: currentPath,
            href: `/${locale}/${basePath}/${currentPath}`,
            icon: settings.icon,
            order: settings.order ?? 0,
            children: [],
          };
          folderMap[currentPath] = folderItem;

          // Add to parent or root
          if (i === 0) {
            rootItems.push(folderItem);
          } else if (folderMap[parentPath]) {
            folderMap[parentPath].children?.push(folderItem);
          }
        }
      }

      // Add file to the deepest folder
      const deepestFolder = folderMap[folderPath.join('/')];
      if (deepestFolder && deepestFolder.children) {
        deepestFolder.children.push(fileItem);
      }
    } else {
      // Root level document
      rootItems.push(fileItem);
    }
  }

  // Sort all levels by order
  const sortItems = (items: FolderItem[]): FolderItem[] => {
    return items.sort((a, b) => a.order - b.order).map(item => ({
      ...item,
      children: item.children ? sortItems(item.children) : undefined,
    }));
  };

  return sortItems(rootItems);
}

/**
 * Format folder name to readable title
 */
function formatTitle(name: string): string {
  return name
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export const GET: APIRoute = async ({ url }) => {
  const collection = url.searchParams.get('collection') || 'docs';
  const folder = url.searchParams.get('folder');
  const locale = url.searchParams.get('locale') || 'en'; // Default to English

  if (!folder) {
    return new Response(JSON.stringify({ error: 'Folder parameter required', items: [] }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('Navigation API - Request params: collection=%s, folder=%s, locale=%s', collection, folder, locale);

  try {
    // Fetch documents and folder settings in parallel
    const [{ documents }, folderSettings] = await Promise.all([
      getDocuments({
        collection,
        locale,
        visible: true,
        limit: 500,
      }),
      getFolderSettings(),
    ]);

    // Debug: Log folder settings received
    console.log('Navigation API - Folder settings received:', JSON.stringify(folderSettings, null, 2));

    // Filter documents that belong to the requested folder
    // Also filter by locale in path to ensure no duplicates from other languages
    const folderDocs = documents.filter(doc => {
      if (!doc.path) return false;
      // Check if path contains the folder
      const hasFolder = doc.path.includes(`/${folder}/`) || doc.path.includes(`${folder}/`);
      // Check if path matches the locale (e.g., content/en/... or /en/)
      const matchesLocale = doc.path.includes(`/${locale}/`) || doc.path.includes(`content/${locale}/`);
      return hasFolder && matchesLocale;
    });

    // Build the tree structure with folder settings
    const items = buildFolderTree(folderDocs, folder, collection, locale, folderSettings);

    return new Response(JSON.stringify({ items }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Navigation API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch navigation', items: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
