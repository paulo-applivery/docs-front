/**
 * Cloudflare Pages Function — MCP HTTP Endpoint
 *
 * Exposes Applivery documentation as MCP tools for AI assistants (Claude.ai, etc.)
 * Runs on the front-end deployment at /mcp
 *
 * Environment variables (set in Cloudflare Pages dashboard):
 *   CMS_URL     — CMS backend URL (required)
 *   SITE_URL    — Public docs site URL (default: https://docs.applivery.com)
 *   CMS_API_KEY — CMS API key (optional)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  CMS_URL: string;
  SITE_URL?: string;
  CMS_API_KEY?: string;
}

/** Cloudflare Pages Function context */
interface CFContext {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
  next: () => Promise<Response>;
}

interface Document {
  id: string;
  path: string;
  title: string;
  description?: string;
  content: string;
  collection: string;
  locale: string;
  type: "article" | "archive";
  updated_date?: string;
  pub_date?: string;
}

interface DocumentsResponse {
  documents: Document[];
  total: number;
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// CMS Client
// ---------------------------------------------------------------------------

class CmsClient {
  constructor(
    private baseUrl: string,
    private apiKey?: string,
  ) {}

  private async request<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      headers["x-api-key"] = this.apiKey;
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, { method: "GET", headers });
    if (!res.ok) throw new Error(`CMS API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async getDocuments(
    options: Record<string, string | number | boolean | undefined> = {},
  ): Promise<DocumentsResponse> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) params.append(key, String(value));
    }
    const qs = params.toString();
    return this.request<DocumentsResponse>(qs ? `/api/documents?${qs}` : "/api/documents");
  }

  async getDocumentByPath(path: string, locale?: string): Promise<Document | null> {
    const params = new URLSearchParams({ path });
    if (locale) params.append("locale", locale);
    try {
      const result = await this.request<DocumentsResponse>(`/api/documents?${params}`);
      return result.documents?.[0] ?? null;
    } catch {
      return null;
    }
  }

  async searchDocuments(
    query: string,
    options: { collection?: string; locale?: string; limit?: number } = {},
  ): Promise<DocumentsResponse> {
    return this.getDocuments({
      search: query,
      locale: options.locale ?? "en",
      collection: options.collection,
      limit: options.limit ?? 10,
      visible: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripMarkdown(md: string): string {
  return md
    .replace(/^---[\s\S]*?---\n*/m, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_~`]+/g, "")
    .replace(/>\s+/g, "")
    .replace(/\|.*\|/g, "")
    .replace(/-{3,}/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function docUrl(doc: Document, siteUrl: string): string {
  const locale = doc.locale || "en";
  let slug = doc.path || "";
  slug = slug.replace(/^content\/[a-z]{2}\//, "");
  slug = slug.replace(/\.(mdx?|md)$/, "");
  slug = slug.replace(/\/index$/, "");
  return `${siteUrl}/${locale}/${slug}`;
}

// ---------------------------------------------------------------------------
// MCP Server (tools)
// ---------------------------------------------------------------------------

function createMcpServer(client: CmsClient, siteUrl: string): McpServer {
  const server = new McpServer({ name: "applivery-docs", version: "1.0.0" });

  server.tool(
    "search_docs",
    "Search Applivery documentation by keyword or phrase. Returns matching pages with titles, descriptions, and content excerpts.",
    {
      query: z.string().describe("Search query text"),
      collection: z.string().optional().describe("Filter by collection (e.g., docs, glossary, api)"),
      locale: z.string().optional().default("en").describe("Locale code (en, es, fr, de, pt, it, ja, zh, ko)"),
      limit: z.number().min(1).max(20).optional().default(10).describe("Maximum number of results"),
    },
    async ({ query, collection, locale, limit }) => {
      const result = await client.searchDocuments(query, { collection, locale, limit });
      const items = result.documents.map((doc) => {
        const excerpt = stripMarkdown(doc.content || "").slice(0, 300);
        return {
          title: doc.title,
          path: doc.path,
          description: doc.description || "",
          excerpt: excerpt + (excerpt.length >= 300 ? "..." : ""),
          url: docUrl(doc, siteUrl),
          collection: doc.collection,
          locale: doc.locale,
        };
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ results: items, total: result.total }, null, 2) }],
      };
    },
  );

  server.tool(
    "get_doc_page",
    "Get the full content of a specific documentation page by its path. Returns the complete page content in markdown format.",
    {
      path: z.string().describe("Document path (e.g., 'docs/device-management/android/enrollment')"),
      locale: z.string().optional().default("en").describe("Locale code"),
    },
    async ({ path, locale }) => {
      const doc = await client.getDocumentByPath(path, locale);
      if (!doc) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Document not found", path, locale }) }],
          isError: true,
        };
      }
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            title: doc.title,
            description: doc.description || "",
            content: doc.content,
            url: docUrl(doc, siteUrl),
            collection: doc.collection,
            locale: doc.locale,
            updated: doc.updated_date || doc.pub_date || null,
          }, null, 2),
        }],
      };
    },
  );

  server.tool(
    "list_docs",
    "List available documentation pages. Optionally filter by collection or locale. Returns page titles and paths for navigation.",
    {
      collection: z.string().optional().describe("Filter by collection (e.g., docs, glossary, api)"),
      locale: z.string().optional().default("en").describe("Locale code"),
      limit: z.number().min(1).max(100).optional().default(50).describe("Maximum number of results"),
      offset: z.number().min(0).optional().default(0).describe("Pagination offset"),
    },
    async ({ collection, locale, limit, offset }) => {
      const result = await client.getDocuments({ collection, locale, limit, offset, visible: true });
      const items = result.documents.map((doc) => ({
        title: doc.title,
        path: doc.path,
        description: doc.description || "",
        collection: doc.collection,
        locale: doc.locale,
        url: docUrl(doc, siteUrl),
      }));
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ documents: items, total: result.total, hasMore: offset + limit < result.total }, null, 2),
        }],
      };
    },
  );

  return server;
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, mcp-session-id, mcp-protocol-version",
};

function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ---------------------------------------------------------------------------
// Request handler (Cloudflare Pages Function)
// ---------------------------------------------------------------------------

export const onRequest = async (context: CFContext): Promise<Response> => {
  // CORS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const cmsUrl = context.env.CMS_URL;
  const siteUrl = context.env.SITE_URL || "https://docs.applivery.com";
  const apiKey = context.env.CMS_API_KEY;

  if (!cmsUrl) {
    return addCorsHeaders(
      new Response(JSON.stringify({ error: "CMS_URL environment variable is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  const client = new CmsClient(cmsUrl, apiKey);
  const server = createMcpServer(client, siteUrl);

  // Stateless mode — each request creates a fresh transport + server
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(context.request);
  return addCorsHeaders(response);
};
