import { unstable_noStore as noStore } from "next/cache";

const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url || !url.trim()) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  return url.replace(/\/$/, "");
};

/**
 * Root for `/api/v1/*` routes (e.g. order). Derived from NEXT_PUBLIC_API_BASE_URL
 * when it ends with `/home`, so one env works for home + order.
 */
export function getApiV1Root(): string {
  return getBaseUrl().replace(/\/home$/i, "");
}

export interface ApiClientOptions extends Omit<RequestInit, "body" | "cache"> {
  body?: Record<string, unknown> | unknown[];
  params?: Record<string, string | number | boolean | undefined>;
  /** If set, used instead of NEXT_PUBLIC_API_BASE_URL (path is appended to this base). */
  baseUrl?: string;
  /**
   * Next.js / fetch cache. Defaults to `no-store` so home/list prices match productDetail
   * after portal updates (avoids stale Data Cache on `/`).
   */
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

/**
 * Base HTTP client. Appends path to NEXT_PUBLIC_API_BASE_URL, supports query params.
 * Returns parsed JSON; throws on non-2xx or invalid JSON.
 */
export async function apiClient<T = unknown>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  noStore();
  const { params, body, baseUrl, cache = "no-store", next, ...init } = options;
  const base = (baseUrl ?? getBaseUrl()).replace(/\/$/, "");
  const pathWithLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  let url = `${base}${pathWithLeadingSlash}`;

  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    ...(init.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...init,
    headers,
    cache,
    ...(next !== undefined ? { next } : {}),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data?.msg) message = data.msg;
    } catch {
      // ignore
    }
    throw new Error(message || `HTTP ${res.status}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON response");
  }
}
