/**
 * Markdown Processor for Custom Documentation Components
 * Matches the CMS editor's custom syntax and renders to HTML
 */

import { marked } from 'marked';
import { resolveMediaUrl } from './cms';

// Deterministic counter for generating unique IDs (avoids Math.random() for build stability)
let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}${idCounter++}`;
}

// Configure marked for GFM
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Custom renderer to add IDs to headings
// Note: H1 is converted to H2 to ensure only one H1 (the page title) exists
marked.use({
  renderer: {
    heading({ tokens, depth }: { tokens: any[]; depth: number }): string {
      const text = tokens.map((t: any) => t.text || t.raw || '').join('');
      const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      // Convert h1 to h2 in content - page title is the only h1
      const actualDepth = depth === 1 ? 2 : depth;
      return `<h${actualDepth} id="${slug}">${text}</h${actualDepth}>\n`;
    }
  }
});

// Icon SVGs for callouts
const calloutIcons: Record<string, string> = {
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  danger: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  tip: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  note: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
};

// Icon SVGs for cards
const cardIcons: Record<string, string> = {
  'file-text': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
  'code': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  'settings': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  'book': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  'zap': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'globe': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  'database': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`,
  'shield': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  'rocket': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  'users': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  'key': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
  'terminal': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
  'smartphone': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
  'smartphone-2': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/><path d="M12 4h.01"/></svg>`,
  'airbuds-case': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="12" x="4" y="6" rx="4"/><path d="M12 10v4"/></svg>`,
  'laptop': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.2 2.4a.5.5 0 0 1-.45.6H3.25a.5.5 0 0 1-.45-.6L4 16"/></svg>`,
  'monitor': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
  'tablet': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12" y1="18" y2="18"/></svg>`,
  'headphones': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`,
  'tv': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2"/><polyline points="17 2 15 7 12 7 9 2"/></svg>`,
  'watch': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.84a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.84 1h4.32a2 2 0 0 1 2 1.82l.35 3.83"/></svg>`,
  'gamepad': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>`,
  'keyboard': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M18 12h.01"/><path d="M7 16h10"/></svg>`,
  'mouse': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="7"/><line x1="12" x2="12" y1="6" y2="10"/></svg>`,
  'server': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
  'cloud': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a5.5 5.5 0 0 0 0-11h-1.12a8 8 0 0 0-15.38 3 5.5 5.5 0 0 0 0 11h16.5z"/></svg>`,
  'lock': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  'star': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  'heart': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  'bell': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  'mail': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  'phone': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  'video': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`,
  'image': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
};

function getCardIcon(icon: string): string {
  return cardIcons[icon] || cardIcons['file-text'];
}

/**
 * Process custom markdown syntax and convert to HTML
 * Supports: Callouts, Accordions, Tabs, Steps, Cards, API Endpoints
 */
export function processMarkdown(content: string): string {
  if (!content) return '';

  let processed = content;

  // ── HTML Block Stash ────────────────────────────────────────────────
  // Components that render raw HTML (API sections, callouts, etc.) must
  // be stashed before marked.parse() runs, otherwise marked will escape
  // and mangle the HTML tags. After markdown conversion, the placeholders
  // are swapped back with the original HTML.
  const htmlBlocks: Map<string, string> = new Map();
  let blockCounter = 0;
  function stashHtml(html: string): string {
    const id = `\n\n<!--HTML_BLOCK_${blockCounter++}-->\n\n`;
    htmlBlocks.set(id, html);
    return id;
  }

  // Extract and remove frontmatter if present
  let frontmatter: Record<string, any> = {};
  const frontmatterMatch = processed.match(/^---\n([\s\S]*?)\n---\n/);
  if (frontmatterMatch) {
    // Parse YAML frontmatter into key-value pairs
    const fmLines = frontmatterMatch[1].split('\n');
    let currentKey: string | null = null;
    let blockScalar = false;

    for (const line of fmLines) {
      // Indented continuation line (block scalar or list item)
      if (line.startsWith('  ') && currentKey) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
          // YAML list item — append to array
          const val = trimmed.slice(2).replace(/^['"]|['"]$/g, '');
          if (!Array.isArray(frontmatter[currentKey])) {
            frontmatter[currentKey] = [];
          }
          (frontmatter[currentKey] as string[]).push(val);
        } else if (blockScalar) {
          // Block scalar continuation — join with space
          const prev = frontmatter[currentKey];
          frontmatter[currentKey] = prev ? `${prev} ${trimmed}` : trimmed;
        }
        continue;
      }

      const match = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
      if (match) {
        currentKey = match[1];
        const val = match[2].trim();
        if (val === '>-' || val === '>' || val === '|' || val === '|-') {
          // YAML block scalar indicator — value follows on next indented lines
          blockScalar = true;
          frontmatter[currentKey] = '';
        } else {
          blockScalar = false;
          frontmatter[currentKey] = val.replace(/^['"]|['"]$/g, '');
        }
      }
    }
    processed = processed.slice(frontmatterMatch[0].length);
  }

  // For API endpoint pages, render a method badge + path header
  const apiMethod = frontmatter.method;
  const apiPath = frontmatter.path;
  const apiBaseUrl = frontmatter.base_url;
  let apiHeaderHtml = '';
  if (apiMethod && apiPath) {
    const methodLower = apiMethod.toLowerCase();
    const cleanBase = apiBaseUrl ? apiBaseUrl.replace(/^['"]|['"]$/g, '') : '';
    const cleanPath = apiPath.replace(/^['"]|['"]$/g, '');
    const fullPath = cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
    const baseUrlHtml = cleanBase
      ? `<span class="api-endpoint-base">${escapeHtml(cleanBase)}</span>`
      : '';
    apiHeaderHtml = `<div class="api-endpoint-header">
      <span class="api-method-badge method-${methodLower}">${escapeHtml(apiMethod.toUpperCase())}</span>
      <span class="api-endpoint-path" role="button" tabindex="0" title="Click to copy" data-copy-path="${escapeHtml(fullPath)}">${baseUrlHtml}${escapeHtml(cleanPath)}</span>
    </div>`;
  }

  // Strip AUTO block comments (<!-- AUTO:xxx:START --> / <!-- AUTO:xxx:END -->)
  processed = processed.replace(/<!--\s*AUTO:[^>]+-->\n?/g, '');

  // Remove placeholder text for empty API sections (between AUTO blocks)
  processed = processed.replace(/^No parameters\.\s*$/gm, '');
  processed = processed.replace(/^No request body\.\s*$/gm, '');
  processed = processed.replace(/^No responses\.\s*$/gm, '');
  processed = processed.replace(/^Summary coming soon\.\s*$/gm, '');

  // Process callouts (:::info, :::warning, :::danger, :::tip, :::success, :::note)
  processed = processed.replace(
    /:::(info|warning|danger|tip|success|note)\n([\s\S]*?):::/g,
    (_, type, calloutContent) => {
      const icon = calloutIcons[type] || calloutIcons.info;
      return stashHtml(`<div class="callout callout-${type}">
        <div class="callout-icon">${icon}</div>
        <div class="callout-content">${marked.parse(calloutContent.trim()) as string}</div>
      </div>`);
    }
  );

  // Process Accordion (stash to prevent marked from injecting <br> tags)
  processed = processed.replace(
    /<Accordion\s+title="([^"]+)">([\s\S]*?)<\/Accordion>/g,
    (_, title, accordionContent) => {
      return stashHtml(`<div class="doc-accordion" data-accordion><button class="doc-accordion-header" data-accordion-trigger><span>${title}</span><svg class="doc-accordion-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><div class="doc-accordion-content" data-accordion-content>${marked.parse(accordionContent.trim()) as string}</div></div>`);
    }
  );

  // Process Tabs (stash to prevent marked from injecting <br> tags)
  processed = processed.replace(
    /<Tabs>([\s\S]*?)<\/Tabs>/g,
    (_, tabsContent) => {
      const tabMatches = [...tabsContent.matchAll(/<Tab\s+title="([^"]+)">([\s\S]*?)<\/Tab>/g)];
      if (tabMatches.length === 0) return tabsContent;

      const tabId = nextId('tabs-');

      const tabButtons = tabMatches.map((m, i) =>
        `<button class="doc-tab-button${i === 0 ? ' active' : ''}" data-tab-trigger data-tab-index="${i}">${m[1]}</button>`
      ).join('');

      const tabPanels = tabMatches.map((m, i) =>
        `<div class="doc-tab-panel${i === 0 ? ' active' : ''}" data-tab-panel data-tab-index="${i}">${marked.parse(m[2].trim()) as string}</div>`
      ).join('');

      return stashHtml(`<div class="doc-tabs" data-tabs id="${tabId}"><div class="doc-tabs-header">${tabButtons}</div><div class="doc-tabs-content">${tabPanels}</div></div>`);
    }
  );

  // Process Steps (stash to prevent marked from injecting <br> tags)
  processed = processed.replace(
    /<Steps>([\s\S]*?)<\/Steps>/g,
    (_, stepsContent) => {
      const stepMatches = [...stepsContent.matchAll(/<Step\s+title="([^"]+)">([\s\S]*?)<\/Step>/g)];
      if (stepMatches.length === 0) return stepsContent;

      const steps = stepMatches.map((m, i) =>
        `<div class="doc-step"><div class="doc-step-number">${i + 1}</div><div class="doc-step-content"><div class="doc-step-title">${m[1]}</div><div class="doc-step-body">${marked.parse(m[2].trim()) as string}</div></div></div>`
      ).join('');

      return stashHtml(`<div class="doc-steps">${steps}</div>`);
    }
  );

  // Process CardGroup
  processed = processed.replace(
    /<CardGroup\s*(?:cols=\{?(\d+)\}?)?>([\s\S]*?)<\/CardGroup>/g,
    (_, cols, cardsContent) => {
      const colCount = cols || 2;
      return `<div class="doc-card-group cols-${colCount}">${cardsContent}</div>`;
    }
  );

  // Process Card (stash to prevent marked from injecting <br> tags)
  processed = processed.replace(
    /<Card\s+title="([^"]+)"(?:\s+icon="([^"]+)")?(?:\s+href="([^"]+)")?>([\s\S]*?)<\/Card>/g,
    (_, title, icon, href, cardContent) => {
      const iconSvg = getCardIcon(icon || 'file-text');
      const tag = href ? 'a' : 'div';
      const hrefAttr = href ? `href="${href}"` : '';
      const arrowSvg = href ? '<svg class="doc-card-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' : '';

      return stashHtml(`<${tag} class="doc-card" ${hrefAttr}><div class="doc-card-icon">${iconSvg}</div><div class="doc-card-body"><div class="doc-card-title">${title}</div><div class="doc-card-description">${cardContent.trim()}</div></div>${arrowSvg}</${tag}>`);
    }
  );

  // Process APIEndpoint (stash to prevent marked from injecting <br> tags)
  processed = processed.replace(
    /<APIEndpoint\s+method="([^"]+)"\s+path="([^"]+)">([\s\S]*?)<\/APIEndpoint>/g,
    (_, method, path, apiContent) => {
      return stashHtml(`<div class="doc-api-endpoint"><div class="doc-api-header"><span class="doc-api-method method-${method.toLowerCase()}">${method}</span><code class="doc-api-path">${path}</code></div><div class="doc-api-content">${marked.parse(apiContent.trim()) as string}</div></div>`);
    }
  );

  // Process ParameterTable
  processed = processed.replace(
    /<ParameterTable>([\s\S]*?)<\/ParameterTable>/g,
    (_, tableContent) => {
      return `<div class="doc-parameter-table">${tableContent.trim()}</div>`;
    }
  );

  // ── API Reference Components (generated by CMS AUTO blocks) ──────────
  // These render <ApiSecurity>, <ApiParams>, <ApiRequest>, <ApiResponse>
  // from the data-source-runner's buildOperationMarkdown output.
  // Uses balanced brace scanning (not regex) because JSON can contain nested }.

  // Use marker comments (outside stash) to identify request-part blocks
  const REQ_MARK_OPEN = '<!--API_REQ_PART_OPEN-->';
  const REQ_MARK_CLOSE = '<!--API_REQ_PART_CLOSE-->';

  const apiComponents: Array<{
    tag: string;
    attr: string;
    render: (data: any) => string;
    errorLabel: string;
    isRequestPart?: boolean;
  }> = [
    { tag: 'ApiSecurity', attr: 'requirements', render: renderApiSecurity, errorLabel: 'security requirements', isRequestPart: true },
    { tag: 'ApiParams', attr: 'parameters', render: renderApiParams, errorLabel: 'parameters', isRequestPart: true },
    { tag: 'ApiRequest', attr: 'body', render: renderApiRequest, errorLabel: 'request body', isRequestPart: true },
    { tag: 'ApiResponse', attr: 'responses', render: renderApiResponse, errorLabel: 'responses' },
  ];

  for (const comp of apiComponents) {
    const wrapFn = comp.isRequestPart
      ? (data: any) => `${REQ_MARK_OPEN}${stashHtml(comp.render(data))}${REQ_MARK_CLOSE}`
      : (data: any) => stashHtml(comp.render(data));
    processed = processApiComponent(processed, comp.tag, comp.attr, wrapFn, comp.errorLabel);
  }

  // Wrap consecutive request-part blocks in a unified "Request" section
  {
    const firstOpen = processed.indexOf(REQ_MARK_OPEN);
    const lastClose = processed.lastIndexOf(REQ_MARK_CLOSE);

    if (firstOpen !== -1 && lastClose !== -1) {
      const headingHtml = stashHtml(`<h2 class="api-request-heading">Request</h2><div class="api-request-cards">`);
      const closingHtml = stashHtml(`</div>`);

      // Insert heading before first marker, closing after last marker
      processed = processed.slice(0, firstOpen) + headingHtml + processed.slice(firstOpen, lastClose + REQ_MARK_CLOSE.length) + closingHtml + processed.slice(lastClose + REQ_MARK_CLOSE.length);
    }

    // Strip all markers
    processed = processed.replaceAll(REQ_MARK_OPEN, '').replaceAll(REQ_MARK_CLOSE, '');
  }

  // Process ChildGrid - renders a grid of child documents from the current path or a specified path
  // Usage: <ChildGrid /> or <ChildGrid path="device-management/android" /> or <ChildGrid columns={2} />
  processed = processed.replace(
    /<ChildGrid\s*(?:path="([^"]*)")?\s*(?:columns=\{?(\d+)\}?)?\s*(?:filters=(true|false))?\s*\/?\s*>/g,
    (_, path, cols, filters) => {
      const dataPath = path ? ` data-path="${path}"` : '';
      const dataCols = cols ? ` data-columns="${cols}"` : '';
      const dataFilters = filters ? ` data-filters="${filters}"` : '';
      return `<div data-child-grid="true"${dataPath}${dataCols}${dataFilters}></div>`;
    }
  );

  // Process BrowserMockup - wraps content in a Chrome-like browser frame
  // Usage: <BrowserMockup url="https://example.com" theme="light">content</BrowserMockup>
  processed = processed.replace(
    /<BrowserMockup(?:\s+url="([^"]*)")?(?:\s+theme="([^"]*)")?>([\s\S]*?)<\/BrowserMockup>/g,
    (_, url, theme, innerContent) => {
      const displayUrl = url || 'https://example.com';
      const domain = displayUrl.replace(/^https?:\/\//, '').split('/')[0];
      const themeClass = theme === 'dark' ? 'browser-mockup-dark' : theme === 'light' ? 'browser-mockup-light' : 'browser-mockup-auto';

      return `<div class="browser-mockup ${themeClass}">
        <div class="browser-titlebar">
          <div class="browser-traffic-lights">
            <span class="dot dot-close"></span>
            <span class="dot dot-minimize"></span>
            <span class="dot dot-maximize"></span>
          </div>
          <div class="browser-tab">
            <span class="browser-tab-title">${domain}</span>
          </div>
          <div class="browser-tab-spacer"></div>
        </div>
        <div class="browser-toolbar">
          <div class="browser-nav-buttons">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
            <svg class="nav-icon disabled" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" /></svg>
          </div>
          <div class="browser-address-bar">
            <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            <span class="browser-url">${displayUrl}</span>
          </div>
        </div>
        <div class="browser-content">${marked.parse(innerContent.trim()) as string}</div>
      </div>`;
    }
  );

  // Process code blocks with filename (```language title="filename")
  processed = processed.replace(
    /```(\w+)\s+title="([^"]+)"\n([\s\S]*?)```/g,
    (_, language, filename, code) => {
      return `<div class="doc-code-block">
        <div class="doc-code-header">
          <span class="doc-code-filename">${filename}</span>
          <button class="doc-code-copy" data-copy-code>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copy</span>
          </button>
        </div>
        <pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>
      </div>`;
    }
  );

  // Resolve /_r2/ media URLs to full CMS URLs before parsing
  // Handles both markdown images ![alt](/_r2/...) and HTML <img src="/_r2/...">
  processed = processed.replace(
    /(!\[[^\]]*\]\()(\/\_r2\/[^)]+)(\))/g,
    (_, prefix, url, suffix) => `${prefix}${resolveMediaUrl(url)}${suffix}`
  );
  processed = processed.replace(
    /(<img\s[^>]*src=["'])(\/\_r2\/[^"']+)(["'])/g,
    (_, prefix, url, suffix) => `${prefix}${resolveMediaUrl(url)}${suffix}`
  );

  // Convert remaining markdown to HTML using marked
  processed = marked.parse(processed) as string;

  // ── Restore stashed HTML blocks ────────────────────────────────────
  // marked.parse() may have wrapped our placeholders in <p> tags, so we
  // need to handle both the raw placeholder and <p>-wrapped versions.
  for (const [placeholder, html] of htmlBlocks) {
    const trimmedPlaceholder = placeholder.trim();
    // Replace <p>-wrapped version first (marked wraps inline content in <p>)
    processed = processed.replace(`<p>${trimmedPlaceholder}</p>`, html);
    // Then replace the raw placeholder (for block-level contexts)
    processed = processed.replace(trimmedPlaceholder, html);
  }

  // Prepend API method badge header for API endpoint pages
  if (apiHeaderHtml) {
    processed = apiHeaderHtml + processed;
  }

  return processed;
}

/**
 * Process an API component tag using balanced brace scanning for the JSON attribute.
 * e.g. <ApiParams parameters={...deeply nested JSON...} />
 * Regex can't handle nested braces, so we scan character-by-character.
 */
function processApiComponent(
  input: string,
  tagName: string,
  attrName: string,
  renderFn: (data: any) => string,
  errorLabel: string
): string {
  let result = '';
  let pos = 0;

  while (pos < input.length) {
    // Find the next occurrence of the opening tag
    const tagPattern = `<${tagName}`;
    const tagStart = input.indexOf(tagPattern, pos);
    if (tagStart === -1) {
      result += input.slice(pos);
      break;
    }

    // Append everything before the tag
    result += input.slice(pos, tagStart);

    // Find the attribute assignment: attr={
    const attrPattern = `${attrName}={`;
    const attrStart = input.indexOf(attrPattern, tagStart);
    if (attrStart === -1) {
      // Malformed tag, skip past it
      result += input.slice(tagStart, tagStart + tagPattern.length);
      pos = tagStart + tagPattern.length;
      continue;
    }

    const jsonStart = attrStart + attrPattern.length;

    // Scan for balanced closing brace
    let depth = 1;
    let i = jsonStart;
    let inString = false;
    let escaped = false;

    while (i < input.length && depth > 0) {
      const ch = input[i];
      if (escaped) {
        escaped = false;
        i++;
        continue;
      }
      if (ch === '\\' && inString) {
        escaped = true;
        i++;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
      } else if (!inString) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
      if (depth > 0) i++;
    }

    if (depth !== 0) {
      // Unbalanced braces — skip the tag
      result += `<div class="api-section"><p class="api-parse-error">Could not parse ${errorLabel} (unbalanced braces).</p></div>`;
      pos = tagStart + tagPattern.length;
      continue;
    }

    // Extract the JSON string (everything between the outer { and })
    const jsonStr = input.slice(jsonStart, i);

    // Find the closing /> after the }
    const afterBrace = input.indexOf('/>', i + 1);
    if (afterBrace === -1) {
      pos = i + 1;
      continue;
    }

    // Render the component
    try {
      const data = JSON.parse(jsonStr);
      result += renderFn(data);
    } catch {
      result += `<div class="api-section"><p class="api-parse-error">Could not parse ${errorLabel}.</p></div>`;
    }

    pos = afterBrace + 2; // Skip past />
  }

  return result;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Extract headings from markdown content for TOC
 */
export function extractHeadings(content: string): Array<{ depth: number; slug: string; text: string }> {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Array<{ depth: number; slug: string; text: string }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim();
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    headings.push({ depth, slug, text });
  }

  return headings;
}


// ═══════════════════════════════════════════════════════════════════════
// API Reference Component Renderers
// Converts the CMS-generated <ApiSecurity>, <ApiParams>, <ApiRequest>,
// <ApiResponse> component tags into beautiful, accessible HTML.
// ═══════════════════════════════════════════════════════════════════════

const apiIcons = {
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  params: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  request: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  response: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
};

/**
 * Resolve composite schemas (allOf, oneOf, anyOf) into a flat schema
 * with merged properties. This allows us to render property tables
 * instead of dumping raw JSON.
 */
function resolveSchema(schema: any): any {
  if (!schema) return schema;

  // allOf: merge all sub-schemas into one
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const merged: any = { type: 'object', properties: {}, required: [] };
    for (const sub of schema.allOf) {
      const resolved = resolveSchema(sub);
      if (resolved.properties) {
        Object.assign(merged.properties, resolved.properties);
      }
      if (resolved.required) {
        merged.required.push(...resolved.required);
      }
      // Inherit description from sub-schemas if parent doesn't have one
      if (resolved.description && !merged.description) {
        merged.description = resolved.description;
      }
    }
    if (merged.required.length === 0) delete merged.required;
    if (Object.keys(merged.properties).length === 0) delete merged.properties;
    return merged;
  }

  // oneOf / anyOf: render each variant's properties as a combined view
  if (schema.oneOf || schema.anyOf) {
    const variants = schema.oneOf || schema.anyOf;
    if (Array.isArray(variants)) {
      // If all variants are objects with properties, merge them showing all possible fields
      const allProperties: any = {};
      const allRequired: string[] = [];
      let allAreObjects = true;

      for (const variant of variants) {
        const resolved = resolveSchema(variant);
        if (resolved.properties) {
          Object.assign(allProperties, resolved.properties);
          if (resolved.required) allRequired.push(...resolved.required);
        } else {
          allAreObjects = false;
        }
      }

      if (allAreObjects && Object.keys(allProperties).length > 0) {
        return {
          type: 'object',
          properties: allProperties,
          required: allRequired.length > 0 ? allRequired : undefined,
          description: schema.description,
        };
      }
    }
  }

  return schema;
}

/** Render a schema type as a human-readable badge */
function schemaTypeBadge(schema: any): string {
  if (!schema) return '<span class="api-type">any</span>';

  if (schema.enum) {
    return `<span class="api-type api-type-enum">enum</span>`;
  }
  if (schema.type === 'array') {
    const itemType = schema.items?.type || 'any';
    return `<span class="api-type api-type-array">${escapeHtml(itemType)}[]</span>`;
  }
  if (schema.type === 'object' || schema.properties) {
    return `<span class="api-type api-type-object">object</span>`;
  }
  if (schema.oneOf || schema.anyOf || schema.allOf) {
    const keyword = schema.oneOf ? 'oneOf' : schema.anyOf ? 'anyOf' : 'allOf';
    return `<span class="api-type api-type-union">${keyword}</span>`;
  }
  const type = schema.type || 'any';
  const format = schema.format ? ` &lt;${escapeHtml(schema.format)}&gt;` : '';
  return `<span class="api-type api-type-${type}">${escapeHtml(type)}${format}</span>`;
}

/** Recursively render object properties as nested rows matching the card-style layout */
function renderSchemaProperties(schema: any, depth: number = 0, maxDepth: number = 4): string {
  if (!schema || depth > maxDepth) return '';

  // Resolve composite schemas at this level too
  const resolved = resolveSchema(schema);
  const properties = resolved.properties || {};
  const required = new Set(resolved.required || []);
  const rows: string[] = [];

  for (const [name, rawProp] of Object.entries(properties) as [string, any][]) {
    const prop = (rawProp.allOf || rawProp.oneOf || rawProp.anyOf) ? resolveSchema(rawProp) : rawProp;
    const isRequired = required.has(name);
    const deprecated = (rawProp.deprecated || prop.deprecated) ? ' <span class="api-param-deprecated">deprecated</span>' : '';

    // Type display: "object", "array [object]", "string", etc.
    let typeDisplay = prop.type || rawProp.type || 'any';
    if (typeDisplay === 'array' && (prop.items?.type || rawProp.items?.type)) {
      typeDisplay = `array [${prop.items?.type || rawProp.items?.type}]`;
    }

    // Constraints
    const constraints: string[] = [];
    const s = rawProp.schema || rawProp;
    if (s.maxLength !== undefined) constraints.push(`&le; ${s.maxLength} characters`);
    if (s.minLength !== undefined) constraints.push(`&ge; ${s.minLength} characters`);
    if (s.pattern) constraints.push(`Match pattern: <code>${escapeHtml(s.pattern)}</code>`);
    if (s.format) constraints.push(`Format: ${escapeHtml(s.format)}`);
    if (s.minimum !== undefined) constraints.push(`&ge; ${s.minimum}`);
    if (s.maximum !== undefined) constraints.push(`&le; ${s.maximum}`);

    const description = rawProp.description || prop.description;
    const enumVals = rawProp.enum || prop.enum;
    const defVal = rawProp.default !== undefined ? rawProp.default : prop.default;

    // Check if this property has nested children (object or array of objects)
    const hasNestedObj = (prop.type === 'object' || prop.properties) && prop.properties;
    const hasNestedArr = prop.type === 'array' && prop.items;
    const resolvedItems = hasNestedArr ? resolveSchema(prop.items) : null;
    const hasChildren = hasNestedObj || (resolvedItems && resolvedItems.properties);

    // Required/optional badge
    const requiredLabel = isRequired
      ? '<span class="api-bp-required">required</span>'
      : '<span class="api-bp-optional">optional</span>';

    // Build meta content (description, constraints, enum, default)
    let metaHtml = '';
    if (description) metaHtml += `<div class="api-bp-desc">${escapeHtml(description)}</div>`;
    if (constraints.length > 0) metaHtml += `<div class="api-bp-constraints">${constraints.join(' &middot; ')}</div>`;
    if (enumVals) metaHtml += `<div class="api-bp-enum">${enumVals.map((v: any) => `<code>${escapeHtml(String(v))}</code>`).join(' ')}</div>`;
    if (defVal !== undefined) metaHtml += `<div class="api-bp-default">Default: <code>${escapeHtml(String(defVal))}</code></div>`;

    const nestId = hasChildren ? `bp-${depth}-${name.replace(/[^a-zA-Z0-9]/g, '')}` : '';

    if (hasChildren) {
      // Collapsible row with nested children
      const childHtml = hasNestedObj
        ? renderSchemaProperties(prop, depth + 1, maxDepth)
        : renderSchemaProperties(resolvedItems!, depth + 1, maxDepth);

      rows.push(`<div class="api-bp-row api-bp-row-nested" data-bp-collapsible data-bp-id="${nestId}">
        <div class="api-bp-row-main">
          <button class="api-bp-toggle" data-bp-trigger aria-expanded="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <span class="api-bp-name">${escapeHtml(name)}</span>
          <span class="api-bp-type">${escapeHtml(typeDisplay)}</span>
          <span class="api-bp-spacer"></span>
          ${requiredLabel}
          ${deprecated}
        </div>
        ${metaHtml ? `<div class="api-bp-meta">${metaHtml}</div>` : ''}
        <div class="api-bp-children" data-bp-content>
          ${childHtml}
        </div>
      </div>`);
    } else {
      // Leaf row (no children)
      rows.push(`<div class="api-bp-row">
        <div class="api-bp-row-main">
          <span class="api-bp-name">${escapeHtml(name)}</span>
          <span class="api-bp-type">${escapeHtml(typeDisplay)}</span>
          <span class="api-bp-spacer"></span>
          ${requiredLabel}
          ${deprecated}
        </div>
        ${metaHtml ? `<div class="api-bp-meta">${metaHtml}</div>` : ''}
      </div>`);
    }
  }

  return rows.join('');
}

/** Generate a representative JSON example from a schema */
function generateSchemaExample(schema: any, seen = new WeakSet()): any {
  if (!schema || typeof schema !== 'object') return undefined;
  if (seen.has(schema)) return {};
  seen.add(schema);

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  if (schema.allOf) {
    const merged: any = {};
    for (const part of schema.allOf) {
      const ex = generateSchemaExample(part, seen);
      if (ex && typeof ex === 'object' && !Array.isArray(ex)) Object.assign(merged, ex);
    }
    return merged;
  }
  if (schema.oneOf?.[0]) return generateSchemaExample(schema.oneOf[0], seen);
  if (schema.anyOf?.[0]) return generateSchemaExample(schema.anyOf[0], seen);
  if (schema.enum?.length) return schema.enum[0];

  const type = schema.type;
  if (type === 'object' || schema.properties) {
    const obj: any = {};
    if (schema.properties) {
      for (const [key, val] of Object.entries(schema.properties)) {
        obj[key] = generateSchemaExample(val as any, seen);
      }
    } else {
      return {};
    }
    return obj;
  }
  if (type === 'array') {
    const itemEx = schema.items ? generateSchemaExample(schema.items, seen) : 'string';
    return [itemEx];
  }
  if (type === 'string') {
    if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
    if (schema.format === 'date') return '2024-01-01';
    if (schema.format === 'email') return 'user@example.com';
    if (schema.format === 'uri' || schema.format === 'url') return 'https://example.com';
    if (schema.format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000';
    return 'string';
  }
  if (type === 'number' || type === 'integer') return 0;
  if (type === 'boolean') return true;
  if (type === 'null') return null;

  return 'string';
}

/** Syntax-highlight a JSON string for the example panel */
function highlightJsonHtml(json: string): string {
  let result = escapeHtml(json);
  // Keys
  result = result.replace(
    /(&quot;(?:\\.|[^&])*?&quot;)\s*:/g,
    '<span class="api-json-key">$1</span>:'
  );
  // String values
  result = result.replace(
    /:\s*(&quot;(?:\\.|[^&])*?&quot;)/g,
    ': <span class="api-json-string">$1</span>'
  );
  // Booleans and null
  result = result.replace(
    /:\s*(true|false|null)\b/g,
    ': <span class="api-json-keyword">$1</span>'
  );
  // Numbers
  result = result.replace(
    /:\s*(\d+(?:\.\d+)?)\b/g,
    ': <span class="api-json-number">$1</span>'
  );
  return result;
}

/** Render a JSON schema as a tabbed viewer (Params tab | Example tab) */
function renderSchemaBlock(schema: any, label: string, contentType?: string): string {
  if (!schema) return '';

  // Resolve composite schemas (allOf, oneOf, anyOf) into flat properties
  const resolved = resolveSchema(schema);

  const hasProperties = resolved.properties && Object.keys(resolved.properties).length > 0;
  const hasItems = resolved.type === 'array' && resolved.items;

  let propsHtml = '';
  let exampleSource = schema;

  if (hasProperties) {
    propsHtml = renderSchemaProperties(resolved);
    exampleSource = resolved;
  } else if (hasItems && hasItems.properties) {
    propsHtml = `<div class="api-schema-label">Array of:</div>${renderSchemaProperties(resolved.items)}`;
    exampleSource = resolved;
  } else if (hasItems) {
    const resolvedItems = resolveSchema(resolved.items);
    if (resolvedItems.properties) {
      propsHtml = `<div class="api-schema-label">Array of:</div>${renderSchemaProperties(resolvedItems)}`;
      exampleSource = resolved;
    }
  }

  if (propsHtml) {
    let exampleJson: string;
    try {
      const example = generateSchemaExample(exampleSource);
      exampleJson = JSON.stringify(example, null, 4);
    } catch {
      exampleJson = '{}';
    }

    const mimeType = contentType || 'application/json';
    const tabId = nextId('bp-tab-');

    return `<div class="api-body-params">
      <div class="api-body-header">
        <div class="api-body-header-left">
          <span class="api-body-title">${escapeHtml(label)}</span>
          <code class="api-body-mime">${escapeHtml(mimeType)}</code>
        </div>
      </div>
      <div class="api-bp-tabs" data-bp-tabs id="${tabId}">
        <div class="api-bp-tabs-bar">
          <button class="api-bp-tab active" data-bp-tab data-bp-tab-index="0">Params</button>
          <button class="api-bp-tab" data-bp-tab data-bp-tab-index="1">Example</button>
        </div>
        <div class="api-bp-tab-panel active" data-bp-panel data-bp-tab-index="0">
          <div class="api-bp-props">${propsHtml}</div>
        </div>
        <div class="api-bp-tab-panel" data-bp-panel data-bp-tab-index="1">
          <pre class="api-bp-example-code"><code>${highlightJsonHtml(exampleJson)}</code></pre>
        </div>
      </div>
    </div>`;
  }

  // Fallback: show the schema as formatted JSON
  const json = JSON.stringify(schema, null, 2);
  if (json.length > 20) {
    return `<div class="api-schema-block">
      <pre class="api-schema-json"><code>${escapeHtml(json)}</code></pre>
    </div>`;
  }

  return `<div class="api-schema-block">${schemaTypeBadge(schema)}</div>`;
}

// ─── ApiSecurity ─────────────────────────────────────────────────────
function renderApiSecurity(requirements: any[]): string {
  if (!Array.isArray(requirements) || requirements.length === 0) return '';

  // Map well-known auth scheme names to their header/param placement
  const schemeInfo: Record<string, { location: string; paramName: string; example: string }> = {
    ApiKeyAuth: { location: 'header', paramName: 'authorization', example: 'Authorization: Bearer <token>' },
    BearerAuth: { location: 'header', paramName: 'authorization', example: 'Authorization: Bearer <token>' },
    BasicAuth: { location: 'header', paramName: 'authorization', example: 'Authorization: Basic <credentials>' },
    OAuth2: { location: 'header', paramName: 'authorization', example: 'Authorization: Bearer <token>' },
  };

  const cards = requirements.map((req) => {
    const entries = Object.entries(req);
    return entries.map(([scheme, scopes]: [string, any]) => {
      const info = schemeInfo[scheme] || { location: 'header', paramName: 'authorization', example: 'Authorization: Bearer <token>' };

      const scopeHtml = Array.isArray(scopes) && scopes.length > 0
        ? `<div class="api-auth-scopes">
            <span class="api-auth-scopes-label">Scopes:</span>
            ${scopes.map((s: string) => `<code class="api-auth-scope-badge">${escapeHtml(s)}</code>`).join('')}
          </div>`
        : '';

      return `<div class="api-request-card" data-collapsible>
        <button class="api-request-card-toggle" data-collapsible-trigger aria-expanded="true">
          ${apiIcons.chevron}
          <span class="api-request-card-title">Authorization</span>
        </button>
        <div class="api-request-card-body" data-collapsible-content>
          <div class="api-auth-detail">
            <span class="api-auth-location">Add parameter in ${escapeHtml(info.location)}</span>
            <code class="api-auth-param-name">${escapeHtml(info.paramName)}</code>
          </div>
          <div class="api-auth-example">
            <span class="api-auth-example-label">Example:</span>
            <code class="api-auth-example-value">${escapeHtml(info.example)}</code>
          </div>
          ${scopeHtml}
        </div>
      </div>`;
    }).join('');
  }).join('');

  return cards;
}

// ─── ApiParams ───────────────────────────────────────────────────────
function renderApiParams(parameters: any[]): string {
  if (!Array.isArray(parameters) || parameters.length === 0) return '';

  // Group by location: path, query, header, cookie
  const groups: Record<string, any[]> = {};
  for (const param of parameters) {
    const loc = param.in || 'query';
    if (!groups[loc]) groups[loc] = [];
    groups[loc].push(param);
  }

  const locationLabels: Record<string, string> = {
    path: 'Path Params',
    query: 'Query Params',
    header: 'Header Params',
    cookie: 'Cookie Params',
  };

  const locationOrder = ['path', 'query', 'header', 'cookie'];

  const cards = locationOrder
    .filter((loc) => groups[loc])
    .map((loc) => {
      const params = groups[loc];
      const rows = params.map((p: any) => {
        const typeName = p.schema?.type || 'any';
        const requiredLabel = p.required
          ? '<span class="api-param-required">required</span>'
          : '<span class="api-param-optional">optional</span>';

        // Constraints: pattern, maxLength, minLength, format, enum
        const constraints: string[] = [];
        if (p.schema?.maxLength !== undefined) constraints.push(`&le; ${p.schema.maxLength} characters`);
        if (p.schema?.minLength !== undefined) constraints.push(`&ge; ${p.schema.minLength} characters`);
        if (p.schema?.pattern) constraints.push(`Match pattern: <code>${escapeHtml(p.schema.pattern)}</code>`);
        if (p.schema?.format) constraints.push(`Format: ${escapeHtml(p.schema.format)}`);

        const constraintsHtml = constraints.length > 0
          ? `<div class="api-param-constraints">${constraints.join(' &middot; ')}</div>`
          : '';

        const desc = p.description
          ? `<div class="api-param-description">${escapeHtml(p.description)}</div>`
          : '';

        const defaultVal = p.schema?.default !== undefined
          ? `<div class="api-param-default">Default: <code>${escapeHtml(String(p.schema.default))}</code></div>`
          : '';

        const enumValues = p.schema?.enum
          ? `<div class="api-param-enum">${p.schema.enum.map((v: any) => `<code class="api-param-enum-value">${escapeHtml(String(v))}</code>`).join('')}</div>`
          : '';

        const deprecated = p.deprecated ? '<span class="api-param-deprecated">deprecated</span>' : '';

        return `<div class="api-param-row">
          <div class="api-param-left">
            <span class="api-param-name">${escapeHtml(p.name)}</span>
            <span class="api-param-type">${escapeHtml(typeName)}</span>
            ${deprecated}
          </div>
          <div class="api-param-right">
            ${requiredLabel}
          </div>
          ${desc || constraintsHtml || defaultVal || enumValues ? `<div class="api-param-meta">
            ${desc}${constraintsHtml}${defaultVal}${enumValues}
          </div>` : ''}
        </div>`;
      }).join('');

      return `<div class="api-request-card" data-collapsible>
        <button class="api-request-card-toggle" data-collapsible-trigger aria-expanded="true">
          ${apiIcons.chevron}
          <span class="api-request-card-title">${locationLabels[loc] || loc}</span>
        </button>
        <div class="api-request-card-body" data-collapsible-content>
          ${rows}
        </div>
      </div>`;
    }).join('');

  return cards;
}

// ─── ApiRequest ──────────────────────────────────────────────────────
function renderApiRequest(body: any): string {
  if (!body) return '';

  const content = body.content || {};
  const mediaTypes = Object.keys(content);
  if (mediaTypes.length === 0) return '';

  const requiredBadge = body.required ? '<span class="api-required">required</span>' : '';
  const desc = body.description ? `<p class="api-request-desc">${escapeHtml(body.description)}</p>` : '';

  // Build tabs if multiple content types, otherwise render directly
  let bodyContent: string;

  if (mediaTypes.length === 1) {
    const mt = mediaTypes[0];
    const schema = content[mt]?.schema;
    bodyContent = `${desc}
    ${schema ? renderSchemaBlock(schema, 'Body Params', mt) : ''}`;
  } else {
    const tabId = nextId('req-');
    const tabs = mediaTypes.map((mt, i) =>
      `<button class="api-tab-btn${i === 0 ? ' active' : ''}" data-tab-trigger data-tab-index="${i}">${escapeHtml(mt)}</button>`
    ).join('');

    const panels = mediaTypes.map((mt, i) => {
      const schema = content[mt]?.schema;
      return `<div class="api-tab-panel${i === 0 ? ' active' : ''}" data-tab-panel data-tab-index="${i}">
        ${schema ? renderSchemaBlock(schema, mt, mt) : '<p>No schema defined.</p>'}
      </div>`;
    }).join('');

    bodyContent = `${desc}
    <div class="api-tabs" data-tabs id="${tabId}">
      <div class="api-tabs-bar">${tabs} ${requiredBadge}</div>
      <div class="api-tabs-panels">${panels}</div>
    </div>`;
  }

  return `<div class="api-request-card api-request-body-card" id="request-body" data-collapsible>
    <button class="api-request-card-toggle" data-collapsible-trigger aria-expanded="true">
      ${apiIcons.chevron}
      <span class="api-request-card-title">Request Body</span>
      ${requiredBadge}
    </button>
    <div class="api-request-card-body" data-collapsible-content>${bodyContent}</div>
  </div>`;
}

// ─── ApiResponse ─────────────────────────────────────────────────────
function renderApiResponse(responses: any): string {
  if (!responses || typeof responses !== 'object') return '';

  const statusCodes = Object.keys(responses).sort();
  if (statusCodes.length === 0) return '';

  const statusClasses: Record<string, string> = {
    '1': 'status-info',
    '2': 'status-success',
    '3': 'status-redirect',
    '4': 'status-client-error',
    '5': 'status-server-error',
  };

  const statusLabels: Record<string, string> = {
    '200': 'OK', '201': 'Created', '202': 'Accepted', '204': 'No Content',
    '301': 'Moved Permanently', '302': 'Found', '304': 'Not Modified',
    '400': 'Bad Request', '401': 'Unauthorized', '403': 'Forbidden',
    '404': 'Not Found', '409': 'Conflict', '422': 'Unprocessable Entity',
    '429': 'Too Many Requests', '500': 'Internal Server Error',
    '502': 'Bad Gateway', '503': 'Service Unavailable',
  };

  const items = statusCodes.map((code) => {
    const resp = responses[code];
    const statusClass = statusClasses[code[0]] || 'status-info';
    const label = statusLabels[code] || '';
    const desc = resp.description ? escapeHtml(resp.description) : label;

    // Get response schema from content
    const content = resp.content || {};
    const mediaTypes = Object.keys(content);
    let schemaHtml = '';

    if (mediaTypes.length > 0) {
      const primaryType = mediaTypes[0];
      const schema = content[primaryType]?.schema;
      if (schema) {
        schemaHtml = renderSchemaBlock(schema, `${code} Response`, primaryType);
      }
    }

    // Response headers
    let headersHtml = '';
    if (resp.headers && Object.keys(resp.headers).length > 0) {
      const headerRows = Object.entries(resp.headers).map(([name, header]: [string, any]) => {
        return `<div class="api-prop-row">
          <div class="api-prop-name-col"><code class="api-prop-name">${escapeHtml(name)}</code></div>
          <div class="api-prop-type-col">${schemaTypeBadge(header.schema)}</div>
          <div class="api-prop-desc-col">${header.description ? `<div class="api-prop-desc">${escapeHtml(header.description)}</div>` : ''}</div>
        </div>`;
      }).join('');
      headersHtml = `<div class="api-response-headers">
        <div class="api-param-group-label">Response Headers</div>
        <div class="api-schema-props">${headerRows}</div>
      </div>`;
    }

    const hasContent = schemaHtml || headersHtml;

    return `<div class="api-response-item" data-accordion>
      <button class="api-response-status" data-accordion-trigger>
        <span class="api-status-code ${statusClass}">${escapeHtml(code)}</span>
        <span class="api-status-desc">${desc}</span>
        ${hasContent ? `<span class="api-response-chevron">${apiIcons.chevron}</span>` : ''}
      </button>
      ${hasContent ? `<div class="api-response-content" data-accordion-content>${schemaHtml}${headersHtml}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="api-section api-responses" id="responses">
    <div class="api-section-header">
      <h3 id="responses">${apiIcons.response} Responses</h3>
    </div>
    <div class="api-section-body">${items}</div>
  </div>`;
}
