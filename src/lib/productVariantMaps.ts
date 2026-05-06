import type { ApiProductDetail } from "../types/api";
import type { CartItem } from "../store/cartStore";
import type { OrderProductLine } from "../types/order";

function pickSku(row: Record<string, unknown>): string | undefined {
  const v =
    row.sku ??
    row.SKU ??
    row.itemCode ??
    row.barcode ??
    row.productSku ??
    row.variantSku;
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function pickLabel(row: Record<string, unknown>): string | undefined {
  const v = row.name ?? row.size ?? row.sizeName ?? row.label ?? row.title;
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function pickUnitPrice(row: Record<string, unknown>): number | undefined {
  const discounted = row.discountedPrice;
  const actual = row.actualPrice;
  // Prefer discountedPrice only when it's a positive number; otherwise fall back to actualPrice.
  if (typeof discounted === "number" && Number.isFinite(discounted) && discounted > 0) return discounted;
  if (typeof actual === "number" && Number.isFinite(actual) && actual > 0) return actual;

  const v = row.price ?? row.salePrice;
  if (typeof v === "number" && !Number.isNaN(v) && v > 0) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[, ]+/g, "").trim();
    const n = Number(cleaned);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

/**
 * Walks common backend shapes for size rows + SKU (mSafa-style and variants).
 */
export function buildVariantMapsFromDetail(api: ApiProductDetail): {
  sizeToSku: Record<string, string>;
  sizeToPrice: Record<string, number>;
} {
  const sizeToSku: Record<string, string> = {};
  const sizeToPrice: Record<string, number> = {};

  function setRow(labelRaw: string | undefined, sku: string | undefined, unit: number | undefined) {
    if (!labelRaw) return;
    const key = labelRaw.toString().trim().toUpperCase();
    if (!key) return;
    if (sku) sizeToSku[key] = sku;
    if (unit != null && unit > 0) sizeToPrice[key] = unit;
  }

  function ingestSizeRow(row: unknown) {
    if (!row || typeof row !== "object") return;
    const r = row as Record<string, unknown>;
    const label = pickLabel(r);
    const sku = pickSku(r);
    const unit = pickUnitPrice(r);
    setRow(label, sku, unit);
  }

  function ingestSizeArray(arr: unknown) {
    if (!Array.isArray(arr)) return;
    for (const row of arr) ingestSizeRow(row);
  }

  // variant[] → each block may use `size` or `sizes`
  for (const block of api.variant ?? []) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    ingestSizeArray(b.size);
    ingestSizeArray(b.sizes);
  }

  // Root-level arrays sometimes used for stock / SKU lines
  const root = api as Record<string, unknown>;
  const extraKeys = [
    "stock",
    "stocks",
    "inventory",
    "skuList",
    "productVariants",
    "variants",
    "variantList",
  ];
  for (const k of extraKeys) {
    ingestSizeArray(root[k]);
  }

  return { sizeToSku, sizeToPrice };
}

/** Match selected size to map keys (handles spacing / casing). */
export function lookupSkuForSize(
  sizeToSku: Record<string, string>,
  selectedSize: string
): string | undefined {
  const k = selectedSize.trim().toUpperCase();
  if (sizeToSku[k]) return sizeToSku[k];
  const compactSel = k.replace(/\s+/g, "");
  for (const [key, sku] of Object.entries(sizeToSku)) {
    if (key.replace(/\s+/g, "") === compactSel) return sku;
  }
  return undefined;
}

export function lookupPriceForSize(
  sizeToPrice: Record<string, number>,
  selectedSize: string
): number | undefined {
  const k = selectedSize.trim().toUpperCase();
  if (sizeToPrice[k] != null) return sizeToPrice[k];
  const compactSel = k.replace(/\s+/g, "");
  for (const [key, p] of Object.entries(sizeToPrice)) {
    if (key.replace(/\s+/g, "") === compactSel) return p;
  }
  return undefined;
}

function isMongoObjectId(s: string): boolean {
  return /^[a-f0-9]{24}$/i.test(s);
}

/**
 * Builds order lines; refetches productDetail when catalog lines lack SKU (fixes stale cart / API shape).
 */
export async function resolveOrderProductLines(
  items: CartItem[],
  fetchDetail: (productId: string) => Promise<ApiProductDetail>
): Promise<{ ok: true; lines: OrderProductLine[] } | { ok: false; message: string }> {
  const cache = new Map<string, ReturnType<typeof buildVariantMapsFromDetail>>();

  async function mapsFor(slug: string) {
    if (cache.has(slug)) return cache.get(slug)!;
    try {
      const detail = await fetchDetail(slug);
      const m = buildVariantMapsFromDetail(detail);
      cache.set(slug, m);
      return m;
    } catch {
      const empty = { sizeToSku: {}, sizeToPrice: {} };
      cache.set(slug, empty);
      return empty;
    }
  }

  const lines: OrderProductLine[] = [];

  for (const item of items) {
    let sku = item.sku?.trim();
    let price = item.price;

    if (isMongoObjectId(item.slug)) {
      const { sizeToSku, sizeToPrice } = await mapsFor(item.slug);
      if (!sku) {
        sku = lookupSkuForSize(sizeToSku, item.size);
      }
      const vp = lookupPriceForSize(sizeToPrice, item.size);
      if (vp != null && vp > 0) price = vp;

      if (!sku) {
        return {
          ok: false,
          message:
            "Could not match this cart line to a catalog variant (SKU). Your productDetail response may not include sku per variant—check the Network tab—or ask the API to expose sku on each size/stock row.",
        };
      }
    } else if (!sku) {
      sku = `SKU-${item.size.replace(/\s+/g, "-").toUpperCase()}`;
    }

    lines.push({
      productId: item.slug,
      quantity: item.quantity,
      price,
      sku: sku!,
      size: item.size.trim(),
    });
  }

  return { ok: true, lines };
}
