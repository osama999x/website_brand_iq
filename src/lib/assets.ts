export const PLACEHOLDER_PRODUCT_IMAGE =
  "https://placehold.co/600x800/e2e8f0/64748b?text=Product";

export function getAssetBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!base) return null;
  return base.replace(/\/$/, "");
}

/** Normalize backend paths (`images/…`, `/images/…`, full URL with embedded path). */
export function normalizeAssetPath(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  if (trimmed.startsWith("/images/")) return trimmed.slice(1);
  if (trimmed.startsWith("images/")) return trimmed;

  const idx = trimmed.indexOf("images/");
  if (idx >= 0) return trimmed.slice(idx);

  return trimmed;
}

/**
 * Turns API thumbnail paths into absolute URLs for next/image.
 * Listing + PDP should both use this (never gate on http/https only).
 */
function isInlineImageDataUrl(value: string): boolean {
  return /^data:image\/[a-z0-9+.-]+;base64,/i.test(value);
}

function isPathBasedAsset(value: string): boolean {
  if (value.startsWith("http://") || value.startsWith("https://")) return true;
  return normalizeAssetPath(value).startsWith("images/");
}

export function resolveProductImageUrl(value: string | undefined | null): string {
  if (!value || typeof value !== "string") return PLACEHOLDER_PRODUCT_IMAGE;

  const trimmed = value.trim();
  if (!trimmed) return PLACEHOLDER_PRODUCT_IMAGE;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Home/list API often embeds thumbnail as base64; PDP may use images/ paths instead.
  if (isInlineImageDataUrl(trimmed)) {
    return trimmed;
  }

  const path = normalizeAssetPath(trimmed);
  if (path.startsWith("images/")) {
    const base = getAssetBaseUrl();
    if (base) return `${base}/${path}`;
  }

  return PLACEHOLDER_PRODUCT_IMAGE;
}

/** First usable image from a list API product (thumbnail, images[], variant image). */
export function pickListProductImageSource(api: {
  thumbnail?: string | null;
  images?: unknown;
  variant?: Array<{ image?: string | null } | null> | null;
}): string | undefined {
  const candidates: string[] = [];

  if (Array.isArray(api.images)) {
    for (const x of api.images) {
      if (typeof x === "string" && x.trim()) candidates.push(x.trim());
    }
  }

  const fromVariant = api.variant?.find(
    (v) => v && typeof v.image === "string" && v.image.trim()
  )?.image;
  if (fromVariant?.trim()) candidates.push(fromVariant.trim());

  if (typeof api.thumbnail === "string" && api.thumbnail.trim()) {
    candidates.push(api.thumbnail.trim());
  }

  if (candidates.length === 0) return undefined;

  // Prefer CDN/path URLs over huge inline base64 when the API sends both.
  const pathBased = candidates.find((c) => isPathBasedAsset(c));
  if (pathBased) return pathBased;

  return candidates[0];
}
