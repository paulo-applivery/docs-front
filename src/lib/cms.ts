/**
 * CMS Client Library
 * Handles communication with DocForge CMS API
 */

const CMS_URL = import.meta.env.CMS_URL || "http://localhost:3000";
const CMS_API_KEY = import.meta.env.CMS_API_KEY || "";

/**
 * Resolve media URLs that start with /_r2/ to full CMS URLs
 * The /_r2/ paths are served by the CMS backend, not the static frontend
 */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') return '';
  if (trimmed.startsWith('/_r2/')) {
    return `${CMS_URL}${trimmed}`;
  }
  return trimmed;
}

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
  cache?: RequestCache;
}

async function cmsRequest<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method = "GET", body, cache = "no-store" } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (CMS_API_KEY) {
    headers["Authorization"] = `Bearer ${CMS_API_KEY}`;
    headers["x-api-key"] = CMS_API_KEY;
  }

  const response = await fetch(`${CMS_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache,
  });

  if (!response.ok) {
    throw new Error(`CMS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Types based on specification
export interface Document {
  id: string;
  path: string;
  title: string;
  description?: string;
  content: string;
  collection: string;
  locale: string;
  type: "article" | "archive";

  // Navigation
  sidebar_position?: number;
  order?: number;
  order_num?: number;
  weight?: number;
  visible?: boolean | number;
  separator?: boolean;
  item_name?: string;
  icon?: string;
  sidebar_icon?: string;

  // SEO Basic
  seo_title?: string;
  canonical?: string;
  keywords?: string[];

  // Media
  hero_image?: string;
  image_alt?: string;

  // Dates
  date?: string;
  pub_date?: string;
  updated_date?: string;

  // Taxonomy
  author?: string;
  category?: string[];
  section?: string[];
  slug?: string;
  translation_key?: string;

  // Context
  audience?: string;
  difficulty?: string;
  platform?: string;
  related?: string[];

  // Structured Data
  schema_type?: string;
  faqs?: Array<{ question: string; answer: string }>;
  howto?: {
    name: string;
    steps: Array<{ name: string; text: string }>;
  };

  // Extended Metadata (from CMS)
  headline?: string;
  target_keyword?: string;
  secondary_keywords?: string[];
  author_url?: string;
  author_credentials?: string;
  organization?: string;
  fact_checker?: string;
  intent?: string;
  reading_time?: number;
  word_count?: number;
  confidence_level?: string;
  limitations?: string;
  summary?: string;
  tldr?: string;
  main_topics?: string[];
  entities?: string[];
  related_queries?: string[];
  key_takeaways?: string[];
  answer_target?: string;
  content_scope?: string;
  prerequisites?: string[];
  related_articles?: string[];
  see_also?: string[];
  update_frequency?: string;
  evergreen?: boolean;
  featured?: boolean;
  noindex?: boolean;
  robots?: string;

  // Open Graph
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;

  // Twitter Cards
  twitter_card?: string;
  twitter_site?: string;

  // Structured Data
  faq_items?: Array<{ question: string; answer: string }>;
  breadcrumb?: string[];
  sources?: string[];
  translations?: Array<{ locale: string; path: string }>;

  // System
  sha?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentsResponse {
  documents: Document[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentResponse {
  document: Document;
}

export interface GetDocumentsOptions {
  collection?: string;
  locale?: string;
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
  visible?: boolean;
}

/**
 * Fetch documents from CMS with optional filters
 */
export async function getDocuments(
  options: GetDocumentsOptions = {},
): Promise<DocumentsResponse> {
  const params = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  const endpoint = query ? `/api/documents?${query}` : "/api/documents";

  return cmsRequest<DocumentsResponse>(endpoint);
}

/**
 * Fetch a single document by ID
 */
export async function getDocument(id: string): Promise<DocumentResponse> {
  return cmsRequest<DocumentResponse>(`/api/documents/${id}`);
}

/**
 * Fetch document by path
 */
export async function getDocumentByPath(
  path: string,
): Promise<DocumentResponse> {
  const params = new URLSearchParams({ path });
  return cmsRequest<DocumentResponse>(`/api/documents?${params}`);
}

// Settings Types
export interface GitHubSettings {
  owner: string;
  repo: string;
  branch: string;
  contentPath: string;
  connectedAt: string;
  connectedBy: string;
}

export interface AISettings {
  provider: "openai" | "anthropic" | "google" | "custom";
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface BrandingSettings {
  logo: string;
  logoDark: string;
  logoIcon: string;
  logoIconDark?: string;
  logoWidth: number;
  logoHeight: number;
}

export interface ColorSettings {
  // Light mode - Core
  primary: string;
  background: string;
  accent: string;
  text: string;
  // Light mode - Container & Surface
  surface?: string;
  backgroundSecondary?: string;
  backgroundTertiary?: string;
  // Light mode - Buttons
  buttonBg?: string;
  buttonBgHover?: string;
  buttonText?: string;
  // Light mode - Menu states
  menuItemHoverBg?: string;
  menuItemHoverText?: string;
  menuItemActiveBg?: string;
  menuItemActiveText?: string;
  menu_item_hover_bg?: string;
  menu_item_hover_text?: string;
  menuHoverBackground?: string;
  menuHoverText?: string;
  menu_hover_background?: string;
  menu_hover_text?: string;
  // Light mode - Borders
  border?: string;
  borderLight?: string;
  // Light mode - Text variants
  textSecondary?: string;
  textTertiary?: string;
  textMuted?: string;
  // Light mode - Code blocks
  codeBlockBg?: string;
  codeBlockText?: string;
  // Light mode - Inline code
  inlineCodeBg?: string;
  inlineCodeText?: string;

  // Dark mode - Core
  darkPrimary?: string;
  darkBackground?: string;
  darkAccent?: string;
  darkText?: string;
  dark_primary?: string;
  dark_background?: string;
  dark_accent?: string;
  dark_text?: string;
  // Dark mode - Container & Surface
  darkSurface?: string;
  darkBackgroundSecondary?: string;
  darkBackgroundTertiary?: string;
  // Dark mode - Buttons
  darkButtonBg?: string;
  darkButtonBgHover?: string;
  darkButtonText?: string;
  // Dark mode - Menu states
  darkMenuItemHoverBg?: string;
  darkMenuItemHoverText?: string;
  darkMenuItemActiveBg?: string;
  darkMenuItemActiveText?: string;
  dark_menu_item_hover_bg?: string;
  dark_menu_item_hover_text?: string;
  darkMenuHoverBackground?: string;
  darkMenuHoverText?: string;
  dark_menu_hover_background?: string;
  dark_menu_hover_text?: string;
  // Dark mode - Borders
  darkBorder?: string;
  darkBorderLight?: string;
  // Dark mode - Text variants
  darkTextSecondary?: string;
  darkTextTertiary?: string;
  darkTextMuted?: string;
  // Dark mode - Code blocks
  darkCodeBlockBg?: string;
  darkCodeBlockText?: string;
  // Dark mode - Inline code
  darkInlineCodeBg?: string;
  darkInlineCodeText?: string;
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  codeFont: string;
}

export interface AppearanceSettings {
  theme?: "light" | "dark" | "system";
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  // New structure from CMS
  branding?: BrandingSettings;
  colors?: ColorSettings;
  typography?: TypographySettings;
}

export interface ContentSettings {
  defaultLocale: string;
  supportedLocales: string[];
  defaultCollection: string;
  collections: CollectionConfig[];
}

export interface CollectionConfig {
  name: string;
  label: string;
  path: string;
  icon?: string;
  visible?: boolean;
}

export interface SEOSettings {
  siteName: string;
  siteUrl: string;
  titleTemplate: string;
  defaultOgImage: string;
  ogLogoUrl?: string;
  twitterHandle: string;
  googleSiteVerification: string;
  analyticsId: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
  external?: boolean;
}

// New navigation types matching admin panel
export interface TopMenuChild {
  id: string;
  type: "folder" | "link";
  folder?: string;
  label: string;
  navigation?: "1-level" | "2-level" | "3-level";
  path?: string;
  href?: string;
  external?: boolean;
}

export interface TopMenuItem {
  id: string;
  type: "multiple_menus" | "folder" | "link";
  label: string;
  folder?: string;
  navigation?: "1-level" | "2-level" | "3-level";
  children?: TopMenuChild[];
  href?: string;
  external?: boolean;
}

export interface TopMenuConfig {
  alignment: "left" | "center" | "right";
  items: TopMenuItem[];
}

export interface SideMenuItem {
  id: string;
  type:
    | "anchor"
    | "tab"
    | "dropdown"
    | "group"
    | "language"
    | "product"
    | "version"
    | "page";
  label: string;
  icon?: string;
  color?: string;
  href?: string;
  hidden?: boolean;
  path?: string;
  children?: SideMenuItem[];
  languages?: string[];
  versions?: string[];
  products?: Array<{ name: string; href: string }>;
  // Content source fields (for folder-based navigation)
  folder?: string; // Folder path to load navigation from
  collection?: string; // Collection to fetch documents from
  defaultActive?: boolean; // Whether this item is active by default (for products)
}

export interface SideMenuConfig {
  mode: "auto" | "manual";
  autoTreeCollection?: string;
  autoTreeBasePath?: string;
  autoTreeSortBy?: string;
  autoTreeMaxDepth?: number;
  items: SideMenuItem[];
}

export interface NavigationConfig {
  topMenu: TopMenuConfig;
  sideMenu: SideMenuConfig;
}

export interface NavigationSettings {
  // New format from admin
  topMenu?: TopMenuConfig;
  sideMenu?: SideMenuConfig;
  // Legacy format
  header?: NavigationItem[];
  footer?: {
    links: Array<{
      title: string;
      items: NavigationItem[];
    }>;
    social: Array<{
      name: string;
      url: string;
      icon: string;
    }>;
  };
}

export interface PrivacySettings {
  privacySettings?: {
    enableAnalytics?: boolean;
    shareAnonymousData?: boolean;
    cookieConsent?: "none" | "simple" | "detailed";
    cookiePosition?: "footer" | "bottom-right" | "bottom-left";
  };
}

// Home Page Settings Types
export interface LocalizedText {
  en: string;
  es?: string;
  fr?: string;
  de?: string;
  pt?: string;
  it?: string;
  ja?: string;
  zh?: string;
  ko?: string;
  [key: string]: string | undefined;
}

export interface QuickLink {
  id: string;
  label: LocalizedText;
  href: string;
  icon?: string;
  external?: boolean;
}

export interface HeaderNavItem {
  id: string;
  label: LocalizedText;
  href: string;
  external?: boolean;
}

export interface FooterSocialLink {
  id: string;
  name: string;
  url: string;
  icon: "github" | "twitter" | "linkedin" | "discord" | "youtube";
}

export interface HomeSettings {
  // Hero Section
  hero?: {
    title?: LocalizedText;
    highlightedWord?: LocalizedText;
    subtitle?: LocalizedText;
    searchPlaceholder?: LocalizedText;
    ctaButton?: {
      label?: LocalizedText;
      href?: string;
    };
  };
  // Quick Links (below search)
  quickLinks?: QuickLink[];
  // Header Navigation
  headerNav?: HeaderNavItem[];
  // Featured Articles Section
  featuredArticles?: {
    enabled?: boolean;
    title?: LocalizedText;
    maxItems?: number;
  };
  // Footer
  footer?: {
    tagline?: LocalizedText;
    socialLinks?: FooterSocialLink[];
  };
}

export interface McpSettings {
  packageName?: string;
  cmsUrl?: string;
  remoteUrl?: string;
  title?: string;
  description?: string;
  nodeVersion?: string;
  docsUrl?: string;
  editors?: {
    cursor?: { enabled?: boolean };
    vscode?: { enabled?: boolean };
    cline?: { enabled?: boolean };
    windsurf?: { enabled?: boolean };
    claudeCode?: { enabled?: boolean };
  };
}

export type SettingsCategory =
  | "github"
  | "ai"
  | "appearance"
  | "content"
  | "seo"
  | "navigation"
  | "privacy"
  | "home"
  | "mcp";

export interface SettingsResponse<T> {
  settings: T;
  category: SettingsCategory;
}

/**
 * Fetch settings by category
 */
export async function getSettings<T>(category: SettingsCategory): Promise<T> {
  return cmsRequest<T>(`/api/settings?category=${category}`);
}

/**
 * Get all site settings for build (cached — settings are global and don't change per page)
 */
let _settingsCache: Awaited<ReturnType<typeof _fetchAllSettings>> | null = null;

async function _fetchAllSettings() {
  const [appearance, content, seo, navigation, privacy, home] =
    await Promise.all([
      getSettings<AppearanceSettings>("appearance").catch(() => null),
      getSettings<ContentSettings>("content").catch(() => null),
      getSettings<SEOSettings>("seo").catch(() => null),
      getSettings<NavigationSettings>("navigation").catch(() => null),
      getSettings<PrivacySettings>("privacy").catch(() => null),
      getSettings<HomeSettings>("home").catch(() => null),
    ]);

  return {
    appearance,
    content,
    seo,
    navigation,
    privacy,
    home,
  };
}

export async function getAllSettings() {
  if (!_settingsCache) {
    _settingsCache = await _fetchAllSettings();
  }
  return _settingsCache;
}

/**
 * Build navigation tree from documents
 */
export function buildNavigationTree(documents: Document[]): NavigationItem[] {
  const visibleDocs = documents
    .filter((doc) => doc.visible !== false)
    .sort(
      (a, b) =>
        (a.sidebar_position ?? a.order ?? 999) -
        (b.sidebar_position ?? b.order ?? 999),
    );

  return visibleDocs.map((doc) => {
    // Always derive URL from path to preserve folder hierarchy
    let href: string;
    if (doc.path) {
      href = doc.path
        .replace(/\.mdx?$/, "")
        .replace(/^src\/content\//, "")
        .replace(/^content\//, "")
        .replace(/^[a-z]{2}\//, "")
        .replace(/^docs\//, "")
        .toLowerCase();
      href = `/${doc.locale || "en"}/${href}`;
    } else {
      href = `/${doc.collection}/${doc.slug || doc.id}`;
    }
    return {
      label: doc.item_name || doc.title,
      href,
      icon: doc.sidebar_icon || doc.icon,
    };
  });
}

/**
 * Group documents by collection
 */
export function groupByCollection(
  documents: Document[],
): Record<string, Document[]> {
  return documents.reduce(
    (acc, doc) => {
      const collection = doc.collection || "docs";
      if (!acc[collection]) {
        acc[collection] = [];
      }
      acc[collection].push(doc);
      return acc;
    },
    {} as Record<string, Document[]>,
  );
}

/**
 * Get related documents
 */
export async function getRelatedDocuments(
  document: Document,
  limit = 5,
): Promise<Document[]> {
  if (!document.related_articles?.length && !document.related?.length) {
    return [];
  }

  const relatedIds = [
    ...(document.related_articles || []),
    ...(document.related || []),
  ].slice(0, limit);

  const { documents } = await getDocuments({
    collection: document.collection,
    locale: document.locale,
    limit: limit * 2,
  });

  return documents
    .filter(
      (doc) =>
        relatedIds.includes(doc.id) ||
        relatedIds.includes(doc.slug || "") ||
        relatedIds.includes(doc.translation_key || ""),
    )
    .slice(0, limit);
}

// Folder Settings Types
export interface FolderSettings {
  label?: string;
  icon?: string;
  order?: number;
}

export interface FolderSettingsMap {
  [path: string]: FolderSettings;
}

export interface FolderSettingsResponse {
  folderSettings: FolderSettingsMap;
}

/**
 * Fetch all folder settings from CMS (cached per build)
 * Used by navigation to apply custom labels, icons, and order to folders
 */
let _folderSettingsCache: FolderSettingsMap | null = null;

export async function getFolderSettings(): Promise<FolderSettingsMap> {
  if (_folderSettingsCache) return _folderSettingsCache;
  try {
    const response = await cmsRequest<FolderSettingsResponse>(
      "/api/folders/all-settings",
    );
    _folderSettingsCache = response.folderSettings || {};
    return _folderSettingsCache;
  } catch (error) {
    console.error("CMS: Failed to fetch folder settings:", error);
    return {};
  }
}
