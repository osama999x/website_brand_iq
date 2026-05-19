/**
 * Backend API response shapes (from home services).
 * Products from list endpoints have variant stripped and flat actualPrice, discountedPrice, etc.
 */

export interface ApiProduct {
  _id: string;
  name: string;
  thumbnail?: string;
  images?: string[];
  title?: string;
  actualPrice: number;
  discountedPrice?: number | null;
  promotionPrice?: number | null;
  promotionDiscount?: number | null;
  dealPrice?: number;
  isFeatured?: boolean;
  isDiscount?: boolean;
  isDeal?: boolean;
  discount?: number;
  category?: string;
  subcategory?: string;
  variant?: Array<{
    actualPrice?: number;
    discountedPrice?: number;
    image?: string;
    size?: Array<{ size?: string; actualPrice?: number; discountedPrice?: number }>;
  }>;
  [key: string]: unknown;
}

/** Product detail payload from /productDetail */
export interface ApiProductDetail {
  _id: string;
  name: string;
  title?: string;
  description?: string;
  longDescription?: string;
  sizeGuide?: string;
  sizeFit?: string;
  deliveryReturns?: string;
  thumbnail?: string;
  images?: string[];
  category?: { _id: string; name: string; gender?: string };
  subcategory?: { _id: string; name: string };
  isFeatured?: boolean;
  taxAmount?: number;
  isTaxable?: boolean;
  actualPrice?: number;
  discountedPrice?: number | null;
  promotionPrice?: number | null;
  promotionDiscount?: number | null;
  variant?: Array<{
    colorName?: string;
    colorHex?: string;
    sku?: string;
    actualPrice?: number;
    discountedPrice?: number | null;
    size?: Array<{
      name?: string;
      /** Some APIs use `size` instead of `name` for the label */
      size?: string;
      /** Must match catalog for order placement */
      sku?: string;
      actualPrice?: number;
      discountedPrice?: number;
      quantity?: number;
    }>;
  }>;
  [key: string]: unknown;
}

export interface ApiCategory {
  _id: string;
  name: string;
  icon?: string;
  thumbnail?: string;
  description?: string;
  productCount?: number;
  subCategory?: Array<{
    _id: string;
    name: string;
    icon?: string;
    thumbnail?: string;
    description?: string;
    products?: ApiProduct[];
  }>;
}

export interface ApiCampaign {
  _id: string;
  campaignName?: string;
  description?: string;
  banner?: string;
  activeFrom?: string;
  activeTo?: string;
  [key: string]: unknown;
}

export interface ApiHero {
  _id: string;
  gender?: string;
  video?: string;
  poster?: string;
  labels?: string[];
  headline?: string;
  subheadline?: string;
  cta?: { text?: string; href?: string };
  theme?: { overlayColor?: string; overlayOpacity?: number; textColor?: string };
  announcement?: { enabled?: boolean; messages?: string[] };
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ApiFilterCategory {
  _id: string;
  name: string;
  icon?: string;
  gender?: string;
}

export interface ApiFilterSubcategory {
  _id: string;
  name: string;
  icon?: string;
  category: string;
}

export interface ApiPriceRange {
  id: string;
  label: string;
  min: number | null;
  max: number | null;
}

export interface ApiFilterOptions {
  categories: ApiFilterCategory[];
  subcategories: ApiFilterSubcategory[];
  genders: string[];
  priceRanges: ApiPriceRange[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  products: T[];
}

export interface HomeResponse {
  hero?: ApiHero | ApiHero[];
  filterOptions?: ApiFilterOptions;
  categories: ApiCategory[];
  /** Some deployments return allProducts, others return featuredProducts */ 
  allProducts?: ApiProduct[];
  featuredProducts?: ApiProduct[];
  campaigns: ApiCampaign[];
}

/** Standard API wrapper: { msg, data } */
export interface ApiWrapper<T> {
  msg: string;
  data: T;
}

/** Frontend Product type (from src/data/products) — imported for mapper return type */
import type { Product } from "../data/products";
import { pickListProductImageSource, resolveProductImageUrl } from "../lib/assets";
import { buildVariantMapsFromDetail } from "../lib/productVariantMaps";

function numericIdFromString(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n = Math.imul(31, n) + s.charCodeAt(i);
  }
  return Math.abs(n) % 2147483647;
}

function ensureAbsoluteAssetUrl(value: string | undefined | null): string {
  return resolveProductImageUrl(value);
}

function pickEffectivePrice(input: {
  discountedPrice?: number | null;
  actualPrice?: number | null;
}): number {
  const d = input.discountedPrice;
  if (typeof d === "number" && Number.isFinite(d) && d > 0) return d;
  const a = input.actualPrice;
  if (typeof a === "number" && Number.isFinite(a) && a > 0) return a;
  return 0;
}

/**
 * Maps backend API product to frontend Product shape so existing UI components work unchanged.
 * Uses _id for slug (and derived numeric id); defaults missing fields.
 */
function mapApiProductToProduct(api: ApiProduct, genderHint?: Product["gender"]): Product {
  const id = numericIdFromString(api._id);
  const slug = api._id.toString();
  const price = pickEffectivePrice({ discountedPrice: api.discountedPrice, actualPrice: api.actualPrice });
  const image = ensureAbsoluteAssetUrl(pickListProductImageSource(api));
  const sizes: string[] =
    api.variant?.[0]?.size?.map((s) => s.size ?? "M").filter(Boolean) ??
    ["S", "M", "L", "XL"];

  return {
    id,
    name: api.name ?? "Product",
    fit: "Regular Fit",
    gender: genderHint ?? "Men",
    price,
    image,
    images: [image],
    category: (api.category != null ? String(api.category) : "General"),
    isNew: Boolean(api.isFeatured),
    slug,
    description: (api.title as string) ?? api.name ?? "",
    sizes,
  };
}

export function mapApiProductsToProducts(apiProducts: ApiProduct[], genderHint?: Product["gender"]): Product[] {
  return apiProducts.map((p) => mapApiProductToProduct(p, genderHint));
}

export function mapApiProductDetailToProduct(api: ApiProductDetail): Product {
  const id = numericIdFromString(api._id);
  const slug = api._id.toString();

  const { sizeToSku, sizeToPrice } = buildVariantMapsFromDetail(api);

  const variantBlockPrices = (api.variant ?? [])
    .map((v) =>
      pickEffectivePrice({
        discountedPrice: v?.discountedPrice ?? null,
        actualPrice: v?.actualPrice ?? null,
      })
    )
    .filter((n) => typeof n === "number" && Number.isFinite(n) && n > 0);
  const minVariantBlockPrice =
    variantBlockPrices.length > 0 ? Math.min(...variantBlockPrices) : 0;

  const sizeNamesFromVariant =
    (api.variant ?? [])
      .flatMap((v) => v?.size ?? [])
      .map((s) => s?.name ?? s?.size)
      .filter(Boolean) as string[];

  const sizeToCompareAtPrice: Record<string, number> = {};
  for (const v of api.variant ?? []) {
    for (const s of v?.size ?? []) {
      const label = (s?.name ?? s?.size)?.toString().trim();
      if (!label) continue;
      const key = label.toUpperCase();
      const actual = s?.actualPrice;
      if (typeof actual === "number" && Number.isFinite(actual) && actual > 0) {
        sizeToCompareAtPrice[key] = actual;
      }
    }
  }

  const colorSizeMaps: NonNullable<Product["colorSizeMaps"]> = {};
  for (const v of api.variant ?? []) {
    const colorName = v?.colorName?.toString().trim();
    if (!colorName) continue;
    const bucket =
      colorSizeMaps[colorName] ??
      (colorSizeMaps[colorName] = {
        sizes: [],
        sizeToSku: {},
        sizeToPrice: {},
        sizeToCompareAtPrice: {},
      });

    for (const s of v?.size ?? []) {
      const label = (s?.name ?? s?.size)?.toString().trim();
      if (!label) continue;
      const key = label.toUpperCase();
      if (!bucket.sizes.includes(key)) bucket.sizes.push(key);

      const sku = (s as { sku?: unknown })?.sku;
      const skuStr = typeof sku === "string" && sku.trim() ? sku.trim() : v?.sku;
      if (skuStr) bucket.sizeToSku[key] = skuStr;

      const unit = pickEffectivePrice({
        discountedPrice: (s as { discountedPrice?: unknown }).discountedPrice as number | null | undefined,
        actualPrice: (s as { actualPrice?: unknown }).actualPrice as number | null | undefined,
      });
      if (unit > 0) bucket.sizeToPrice[key] = unit;

      const actual = (s as { actualPrice?: unknown })?.actualPrice;
      if (typeof actual === "number" && Number.isFinite(actual) && actual > 0) {
        bucket.sizeToCompareAtPrice[key] = actual;
      }
    }
  }

  const sizeNames =
    sizeNamesFromVariant.length > 0
      ? sizeNamesFromVariant
      : Object.keys(sizeToSku).length > 0
        ? Object.keys(sizeToSku)
        : Object.keys(sizeToPrice).length > 0
          ? Object.keys(sizeToPrice)
          : undefined;

  const colors =
    (api.variant ?? [])
      .map((v) => {
        const name = v?.colorName?.toString().trim();
        if (!name) return null;
        const unit = pickEffectivePrice({
          discountedPrice: v?.discountedPrice ?? null,
          actualPrice: v?.actualPrice ?? null,
        });
        const compare =
          typeof v?.actualPrice === "number" && Number.isFinite(v.actualPrice) && v.actualPrice > 0
            ? v.actualPrice
            : undefined;
        return {
          name,
          hex: v?.colorHex,
          sku: v?.sku,
          ...(unit > 0 ? { price: unit } : {}),
          ...(compare && unit > 0 && compare > unit ? { compareAtPrice: compare } : {}),
        };
      })
      .filter(Boolean) as NonNullable<Product["colors"]>;

  const firstVariantSize =
    (api.variant ?? []).flatMap((v) => v?.size ?? [])[0] ?? undefined;
  const computedPrice =
    pickEffectivePrice({ discountedPrice: api.discountedPrice, actualPrice: api.actualPrice }) ||
    pickEffectivePrice({
      discountedPrice: firstVariantSize?.discountedPrice,
      actualPrice: firstVariantSize?.actualPrice,
    }) ||
    minVariantBlockPrice;

  // Only trust product-level actualPrice for compare-at. Do not use variant[0].actualPrice
  // when multiple variant blocks exist — that is another color/SKU's list price and creates
  // false "was" prices when the headline uses the minimum variant price (e.g. Red 45 vs green 450).
  const variantBlocks = api.variant ?? [];
  const compareAtPrice =
    typeof api.actualPrice === "number" && Number.isFinite(api.actualPrice) && api.actualPrice > 0
      ? api.actualPrice
      : variantBlocks.length === 1 &&
          typeof variantBlocks[0]?.actualPrice === "number" &&
          Number.isFinite(variantBlocks[0]!.actualPrice) &&
          (variantBlocks[0]!.actualPrice ?? 0) > 0
        ? (variantBlocks[0]!.actualPrice as number)
        : undefined;

  const baseSku =
    (api.variant?.length === 1 &&
    !(api.variant?.[0]?.colorName?.toString().trim()) &&
    ((api.variant?.[0]?.size?.length ?? 0) === 0) &&
    api.variant?.[0]?.sku
      ? api.variant[0].sku
      : undefined) ?? undefined;

  const rawImages: string[] = [];
  if (Array.isArray(api.images)) {
    for (const x of api.images) {
      if (typeof x === "string" && x.trim()) rawImages.push(x.trim());
    }
  }
  const thumb =
    typeof api.thumbnail === "string" && api.thumbnail.trim() ? api.thumbnail.trim() : "";
  if (thumb && !rawImages.includes(thumb)) rawImages.unshift(thumb);
  if (rawImages.length === 0 && thumb) rawImages.push(thumb);

  const image = ensureAbsoluteAssetUrl(thumb || rawImages[0]);
  const images = (rawImages.length ? rawImages : [thumb || ""]).map((x) =>
    ensureAbsoluteAssetUrl(x)
  );

  const genderRaw = api.category?.gender;
  const gender: Product["gender"] =
    genderRaw === "women" ? "Women" : genderRaw === "juniors" ? "Juniors" : "Men";

  return {
    id,
    name: api.name ?? "Product",
    fit: "Regular Fit",
    gender,
    price: computedPrice,
    ...(compareAtPrice && compareAtPrice > computedPrice ? { compareAtPrice } : {}),
    ...(typeof api.taxAmount === "number" && Number.isFinite(api.taxAmount) && api.taxAmount > 0
      ? { taxAmount: api.taxAmount }
      : {}),
    ...(typeof api.isTaxable === "boolean" ? { isTaxable: api.isTaxable } : {}),
    image,
    images: images.length ? images : [image],
    category: api.category?.name ?? "General",
    isNew: Boolean(api.isFeatured),
    slug,
    description: api.description ?? api.title ?? api.name ?? "",
    ...(api.longDescription ? { longDescription: api.longDescription } : {}),
    ...(api.sizeGuide ? { sizeGuide: api.sizeGuide } : {}),
    ...(api.sizeFit ? { sizeFit: api.sizeFit } : {}),
    ...(api.deliveryReturns ? { deliveryReturns: api.deliveryReturns } : {}),
    ...(colors?.length ? { colors } : {}),
    ...(baseSku ? { baseSku } : {}),
    // IMPORTANT: do NOT fallback to fake sizes. If API provides none, hide the size selector.
    sizes: sizeNames?.length ? sizeNames.map((s) => s.toString().toUpperCase()) : [],
    ...(Object.keys(sizeToSku).length > 0 ? { sizeToSku } : {}),
    ...(Object.keys(sizeToPrice).length > 0 ? { sizeToPrice } : {}),
    ...(Object.keys(sizeToCompareAtPrice).length > 0 ? { sizeToCompareAtPrice } : {}),
    ...(Object.keys(colorSizeMaps).length > 0 ? { colorSizeMaps } : {}),
  };
}
