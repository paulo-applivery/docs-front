/**
 * Markdown Processor for Custom Documentation Components
 * Matches the CMS editor's custom syntax and renders to HTML
 */

import { marked } from 'marked';
import { resolveMediaUrl } from './cms';

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

  // Remove frontmatter if present
  const frontmatterMatch = processed.match(/^---\n[\s\S]*?\n---\n/);
  if (frontmatterMatch) {
    processed = processed.slice(frontmatterMatch[0].length);
  }

  // Process callouts (:::info, :::warning, :::danger, :::tip, :::success, :::note)
  processed = processed.replace(
    /:::(info|warning|danger|tip|success|note)\n([\s\S]*?):::/g,
    (_, type, calloutContent) => {
      const icon = calloutIcons[type] || calloutIcons.info;
      return `<div class="callout callout-${type}">
        <div class="callout-icon">${icon}</div>
        <div class="callout-content">${calloutContent.trim()}</div>
      </div>`;
    }
  );

  // Process Accordion
  processed = processed.replace(
    /<Accordion\s+title="([^"]+)">([\s\S]*?)<\/Accordion>/g,
    (_, title, accordionContent) => {
      return `<div class="doc-accordion" data-accordion>
        <button class="doc-accordion-header" data-accordion-trigger>
          <span>${title}</span>
          <svg class="doc-accordion-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="doc-accordion-content" data-accordion-content>${accordionContent.trim()}</div>
      </div>`;
    }
  );

  // Process Tabs
  processed = processed.replace(
    /<Tabs>([\s\S]*?)<\/Tabs>/g,
    (_, tabsContent) => {
      const tabMatches = [...tabsContent.matchAll(/<Tab\s+title="([^"]+)">([\s\S]*?)<\/Tab>/g)];
      if (tabMatches.length === 0) return tabsContent;

      const tabId = `tabs-${Math.random().toString(36).substring(2, 11)}`;

      const tabButtons = tabMatches.map((m, i) =>
        `<button class="doc-tab-button${i === 0 ? ' active' : ''}" data-tab-trigger data-tab-index="${i}">${m[1]}</button>`
      ).join('');

      const tabPanels = tabMatches.map((m, i) =>
        `<div class="doc-tab-panel${i === 0 ? ' active' : ''}" data-tab-panel data-tab-index="${i}">${m[2].trim()}</div>`
      ).join('');

      return `<div class="doc-tabs" data-tabs id="${tabId}">
        <div class="doc-tabs-header">${tabButtons}</div>
        <div class="doc-tabs-content">${tabPanels}</div>
      </div>`;
    }
  );

  // Process Steps
  processed = processed.replace(
    /<Steps>([\s\S]*?)<\/Steps>/g,
    (_, stepsContent) => {
      const stepMatches = [...stepsContent.matchAll(/<Step\s+title="([^"]+)">([\s\S]*?)<\/Step>/g)];
      if (stepMatches.length === 0) return stepsContent;

      const steps = stepMatches.map((m, i) =>
        `<div class="doc-step">
          <div class="doc-step-number">${i + 1}</div>
          <div class="doc-step-content">
            <div class="doc-step-title">${m[1]}</div>
            <div class="doc-step-body">${m[2].trim()}</div>
          </div>
        </div>`
      ).join('');

      return `<div class="doc-steps">${steps}</div>`;
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

  // Process Card
  processed = processed.replace(
    /<Card\s+title="([^"]+)"(?:\s+icon="([^"]+)")?(?:\s+href="([^"]+)")?>([\s\S]*?)<\/Card>/g,
    (_, title, icon, href, cardContent) => {
      const iconSvg = getCardIcon(icon || 'file-text');
      const tag = href ? 'a' : 'div';
      const hrefAttr = href ? `href="${href}"` : '';
      const arrowSvg = href ? '<svg class="doc-card-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' : '';

      return `<${tag} class="doc-card" ${hrefAttr}>
        <div class="doc-card-icon">${iconSvg}</div>
        <div class="doc-card-body">
          <div class="doc-card-title">${title}</div>
          <div class="doc-card-description">${cardContent.trim()}</div>
        </div>
        ${arrowSvg}
      </${tag}>`;
    }
  );

  // Process APIEndpoint
  processed = processed.replace(
    /<APIEndpoint\s+method="([^"]+)"\s+path="([^"]+)">([\s\S]*?)<\/APIEndpoint>/g,
    (_, method, path, apiContent) => {
      return `<div class="doc-api-endpoint">
        <div class="doc-api-header">
          <span class="doc-api-method method-${method.toLowerCase()}">${method}</span>
          <code class="doc-api-path">${path}</code>
        </div>
        <div class="doc-api-content">${apiContent.trim()}</div>
      </div>`;
    }
  );

  // Process ParameterTable
  processed = processed.replace(
    /<ParameterTable>([\s\S]*?)<\/ParameterTable>/g,
    (_, tableContent) => {
      return `<div class="doc-parameter-table">${tableContent.trim()}</div>`;
    }
  );

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

  return processed;
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
