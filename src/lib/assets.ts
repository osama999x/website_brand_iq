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
export function resolveProductImageUrl(value: string | undefined | null): string {
  if (!value || typeof value !== "string") return PLACEHOLDER_PRODUCT_IMAGE;

  const trimmed = value.trim();
  if (!trimmed) return PLACEHOLDER_PRODUCT_IMAGE;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
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
  const fromImages = Array.isArray(api.images)
    ? api.images.find((x) => typeof x === "string" && x.trim())
    : undefined;

  const fromVariant = api.variant?.find(
    (v) => v && typeof v.image === "string" && v.image.trim()
  )?.image;

  const candidates = [api.thumbnail, fromImages, fromVariant].filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0
  );

  return candidates[0];
}
