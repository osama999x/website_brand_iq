import type { ApiProductDetail } from "../types/api";
import type { CartItem } from "../store/cartStore";
import type { OrderProductLine } from "../types/order";
import { pickEffectivePrice, type PriceFields } from "./pricing";
import { isCosmeticsCategory, resolveOrderSize } from "./shopGender";

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

function pickUnitPrice(row: Record<string, unknown>, sale?: PriceFields): number | undefined {
  const fields: PriceFields = {
    actualPrice: row.actualPrice as number | undefined,
    discountedPrice: row.discountedPrice as number | null | undefined,
    isDiscount: typeof row.isDiscount === "boolean" ? row.isDiscount : sale?.isDiscount,
    isSale: sale?.isSale,
    discount: sale?.discount,
  };
  const fromPriceFields = pickEffectivePrice(fields);
  if (fromPriceFields > 0) return fromPriceFields;

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
  const sale: PriceFields = {
    isSale: api.isSale === true,
    discount: typeof api.discount === "number" ? api.discount : undefined,
    isDiscount: typeof api.isDiscount === "boolean" ? api.isDiscount : undefined,
  };

  function setRow(labelRaw: string | undefined, sku: string | undefined, unit: number | undefined) {
    if (!labelRaw) return;
    const key = labelRaw.toString().trim().toUpperCase();
    if (!key) return;
    if (sku) sizeToSku[key] = sku;
    if (unit != null && unit > 0) sizeToPrice[key] = unit;
  }

  function ingestSizeRow(row: unknown, variantSale?: PriceFields) {
    if (!row || typeof row !== "object") return;
    const r = row as Record<string, unknown>;
    const label = pickLabel(r);
    const sku = pickSku(r);
    const unit = pickUnitPrice(r, variantSale ?? sale);
    setRow(label, sku, unit);
  }

  function ingestSizeArray(arr: unknown, variantSale?: PriceFields) {
    if (!Array.isArray(arr)) return;
    for (const row of arr) ingestSizeRow(row, variantSale);
  }

  // variant[] → each block may use `size` or `sizes`
  for (const block of api.variant ?? []) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    const variantSale: PriceFields = {
      ...sale,
      isDiscount:
        typeof b.isDiscount === "boolean" ? b.isDiscount : sale.isDiscount,
    };
    ingestSizeArray(b.size, variantSale);
    ingestSizeArray(b.sizes, variantSale);
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

/** Per-color size × SKU × price buckets (same rules as PDP mapper). */
export type ColorSizeBucket = {
  sizes: string[];
  sizeToSku: Record<string, string>;
  sizeToPrice: Record<string, number>;
};

export function buildColorSizeBucketsFromDetail(api: ApiProductDetail): Record<string, ColorSizeBucket> {
  const colorSizeMaps: Record<string, ColorSizeBucket> = {};
  for (const v of api.variant ?? []) {
    const colorName = v?.colorName?.toString().trim();
    if (!colorName) continue;
    const bucket =
      colorSizeMaps[colorName] ??
      (colorSizeMaps[colorName] = {
        sizes: [],
        sizeToSku: {},
        sizeToPrice: {},
      });

    const blockSku = typeof v?.sku === "string" && v.sku.trim() ? v.sku.trim() : undefined;

    for (const s of v?.size ?? []) {
      if (!s || typeof s !== "object") continue;
      const row = s as Record<string, unknown>;
      const label = pickLabel(row);
      if (!label) continue;
      const key = label.toUpperCase();
      if (!bucket.sizes.includes(key)) bucket.sizes.push(key);

      const rowSku = pickSku(row);
      const skuStr = rowSku ?? blockSku;
      if (skuStr) bucket.sizeToSku[key] = skuStr;

      const unit = pickUnitPrice(row);
      if (unit != null && unit > 0) bucket.sizeToPrice[key] = unit;
    }
  }
  return colorSizeMaps;
}

function findBucketKeyInsensitive(
  buckets: Record<string, ColorSizeBucket>,
  color: string
): string | undefined {
  if (Object.prototype.hasOwnProperty.call(buckets, color)) return color;
  const want = color.trim().toLowerCase();
  for (const k of Object.keys(buckets)) {
    if (k.trim().toLowerCase() === want) return k;
  }
  return undefined;
}

function variantBlockSkuForColor(detail: ApiProductDetail, color: string): string | undefined {
  const want = color.trim().toLowerCase();
  for (const v of detail.variant ?? []) {
    const cn = v?.colorName?.toString().trim().toLowerCase();
    if (cn !== want) continue;
    const blockSku = typeof v?.sku === "string" && v.sku.trim() ? v.sku.trim() : undefined;
    if (blockSku) return blockSku;
    const first = v.size?.[0];
    if (first && typeof first === "object") {
      const sk = pickSku(first as Record<string, unknown>);
      if (sk) return sk;
    }
  }
  return undefined;
}

function variantUnitPriceForColor(detail: ApiProductDetail, color: string): number | undefined {
  const want = color.trim().toLowerCase();
  for (const v of detail.variant ?? []) {
    const cn = v?.colorName?.toString().trim().toLowerCase();
    if (cn !== want) continue;
    const first = v.size?.[0];
    if (first && typeof first === "object") {
      const p = pickUnitPrice(first as Record<string, unknown>);
      if (p != null && p > 0) return p;
    }
  }
  return undefined;
}

/**
 * Resolves catalog SKU + unit price from productDetail for a cart line.
 * Supports plain size keys, combined `SIZE (COLOR)` lines, and `ONE SIZE (color)`.
 */
export function resolveSkuPriceFromDetail(
  detail: ApiProductDetail,
  item: Pick<CartItem, "size" | "sku" | "price">
): { sku: string; price: number } | null {
  const trimmedSku = item.sku?.trim();
  if (trimmedSku) return { sku: trimmedSku, price: item.price };

  const trimmedSize = item.size.trim();
  const buckets = buildColorSizeBucketsFromDetail(detail);

  if (!trimmedSize && isCosmeticsCategory(detail.category)) {
    const v0 = detail.variant?.[0];
    const blockSku =
      (typeof v0?.sku === "string" && v0.sku.trim() ? v0.sku.trim() : undefined) ??
      (item.sku?.trim() || undefined);
    if (blockSku) {
      const unit =
        (v0 && typeof v0 === "object" ? pickUnitPrice(v0 as Record<string, unknown>) : undefined) ??
        item.price;
      return { sku: blockSku, price: unit };
    }

    for (const v of detail.variant ?? []) {
      const colorSku = typeof v?.sku === "string" && v.sku.trim() ? v.sku.trim() : undefined;
      if (colorSku) {
        const unit = pickUnitPrice((v ?? {}) as Record<string, unknown>) ?? item.price;
        return { sku: colorSku, price: unit };
      }
    }
  }

  const combo = /^(.+?)\s+\(([^)]+)\)\s*$/.exec(trimmedSize);
  if (combo) {
    const sizePart = combo[1]!.trim();
    const colorPart = combo[2]!.trim();
    const colorKey = findBucketKeyInsensitive(buckets, colorPart);
    if (colorKey) {
      const b = buckets[colorKey];
      let sku = lookupSkuForSize(b.sizeToSku, sizePart);
      if (!sku) sku = variantBlockSkuForColor(detail, colorPart);
      const pr = lookupPriceForSize(b.sizeToPrice, sizePart);
      if (sku) return { sku, price: pr ?? item.price };
    }
  }

  const oneSize = /^ONE SIZE\s*\(([^)]+)\)\s*$/i.exec(trimmedSize);
  if (oneSize) {
    const colorPart = oneSize[1]!.trim();
    const sku = variantBlockSkuForColor(detail, colorPart);
    const pr = variantUnitPriceForColor(detail, colorPart);
    if (sku) return { sku, price: pr ?? item.price };
  }

  if (trimmedSize === "ONE SIZE") {
    const v0 = detail.variant?.[0];
    const blockSku =
      (typeof v0?.sku === "string" && v0.sku.trim() ? v0.sku.trim() : undefined) ??
      (v0?.size?.[0] && typeof v0.size[0] === "object"
        ? pickSku(v0.size[0] as Record<string, unknown>)
        : undefined);
    if (blockSku) {
      const flat = buildVariantMapsFromDetail(detail);
      const prices = Object.values(flat.sizeToPrice).filter((n) => n > 0);
      const pr = prices.length ? Math.min(...prices) : item.price;
      return { sku: blockSku, price: pr };
    }
  }

  const flat = buildVariantMapsFromDetail(detail);
  const sku = lookupSkuForSize(flat.sizeToSku, trimmedSize);
  if (sku) {
    const pr = lookupPriceForSize(flat.sizeToPrice, trimmedSize);
    return { sku, price: pr ?? item.price };
  }

  return null;
}

export function isMongoObjectId(s: string): boolean {
  return /^[a-f0-9]{24}$/i.test(s);
}

/**
 * Builds order lines; refetches productDetail when catalog lines lack SKU (fixes stale cart / API shape).
 */
export async function resolveOrderProductLines(
  items: CartItem[],
  fetchDetail: (productId: string) => Promise<ApiProductDetail>
): Promise<{ ok: true; lines: OrderProductLine[] } | { ok: false; message: string }> {
  const detailCache = new Map<string, ApiProductDetail | false>();

  async function detailFor(slug: string): Promise<ApiProductDetail | false> {
    const hit = detailCache.get(slug);
    if (hit !== undefined) return hit;
    try {
      const d = await fetchDetail(slug);
      detailCache.set(slug, d);
      return d;
    } catch {
      detailCache.set(slug, false);
      return false;
    }
  }

  const lines: OrderProductLine[] = [];

  for (const item of items) {
    let sku = item.sku?.trim();
    let price = item.price;

    if (isMongoObjectId(item.slug)) {
      const detail = await detailFor(item.slug);
      if (detail === false) {
        return {
          ok: false,
          message: "Could not load product catalog for one or more items. Check your connection and try again.",
        };
      }
      const resolved = resolveSkuPriceFromDetail(detail, item);
      if (!resolved) {
        return {
          ok: false,
          message:
            "Could not match this cart line to a catalog variant (SKU). Your productDetail response may not include sku per variant—check the Network tab—or ask the API to expose sku on each size/stock row.",
        };
      }
      sku = resolved.sku;
      price = resolved.price;

      lines.push({
        productId: item.slug,
        quantity: item.quantity,
        price,
        sku: sku!,
        size: resolveOrderSize({ category: detail.category }, item.size),
      });
      continue;
    } else if (!sku) {
      sku = item.size.trim()
        ? `SKU-${item.size.replace(/\s+/g, "-").toUpperCase()}`
        : `SKU-${item.slug.slice(-8).toUpperCase()}`;
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
