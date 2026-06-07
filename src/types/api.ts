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
  isSale?: boolean;
  isDeal?: boolean;
  discount?: number;
  category?: string;
  subcategory?: string;
  variant?: Array<{
    colorName?: string;
    colorHex?: string;
    sku?: string;
    actualPrice?: number;
    discountedPrice?: number | null;
    isDiscount?: boolean;
    image?: string;
    size?: Array<{
      size?: string;
      actualPrice?: number;
      discountedPrice?: number | null;
      isDiscount?: boolean;
    }>;
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
  isSale?: boolean;
  discount?: number;
  isDiscount?: boolean;
  variant?: Array<{
    colorName?: string;
    colorHex?: string;
    sku?: string;
    actualPrice?: number;
    discountedPrice?: number | null;
    isDiscount?: boolean;
    size?: Array<{
      name?: string;
      /** Some APIs use `size` instead of `name` for the label */
      size?: string;
      /** Must match catalog for order placement */
      sku?: string;
      actualPrice?: number;
      discountedPrice?: number;
      isDiscount?: boolean;
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
  gender?: string;
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
import {
  pickCompareAtPrice,
  pickEffectivePrice,
  type PriceFields,
} from "../lib/pricing";

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

function productSaleContext(api: ApiProductDetail | ApiProduct): PriceFields {
  return {
    isSale: api.isSale === true,
    discount: typeof api.discount === "number" ? api.discount : undefined,
    isDiscount: typeof api.isDiscount === "boolean" ? api.isDiscount : undefined,
  };
}

/** Same price rules on home, PLP, and PDP — variant rows beat stale product-level prices. */
export function resolveCatalogProductPrice(api: ApiProductDetail | ApiProduct): number {
  const variantBlocks = api.variant ?? [];
  const variantPrices = variantBlocks
    .map((v) => pickEffectivePrice(variantPriceFields(api, v ?? {})))
    .filter((n) => n > 0);
  const sizePrices = variantBlocks
    .flatMap((v) => v?.size ?? [])
    .map((s) => pickEffectivePrice(variantPriceFields(api, s)))
    .filter((n) => n > 0);

  if (variantBlocks.length > 0) {
    const fromVariants = [...variantPrices, ...sizePrices];
    if (fromVariants.length > 0) return Math.min(...fromVariants);
  }

  const fromRoot = pickEffectivePrice(variantPriceFields(api, api));
  if (fromRoot > 0) return fromRoot;

  if (variantPrices.length > 0) return Math.min(...variantPrices);
  return 0;
}

function mapListProductColors(api: ApiProduct): Product["colors"] | undefined {
  const colors = (api.variant ?? [])
    .map((v) => {
      const name = v?.colorName?.toString().trim();
      if (!name) return null;
      const fields = variantPriceFields(api, v);
      const unit = pickEffectivePrice(fields);
      const compare = pickCompareAtPrice(fields);
      return {
        name,
        hex: v?.colorHex,
        sku: v?.sku,
        ...(unit > 0 ? { price: unit } : {}),
        ...(compare != null && unit > 0 && compare > unit ? { compareAtPrice: compare } : {}),
      };
    })
    .filter(Boolean) as NonNullable<Product["colors"]>;
  return colors?.length ? colors : undefined;
}

function variantPriceFields(
  api: ApiProductDetail | ApiProduct,
  row: {
    actualPrice?: number | null;
    discountedPrice?: number | null;
    isDiscount?: boolean;
  }
): PriceFields {
  const sale = productSaleContext(api);
  return {
    actualPrice: row.actualPrice,
    discountedPrice: row.discountedPrice,
    isSale: sale.isSale,
    discount: sale.discount,
    isDiscount:
      typeof row.isDiscount === "boolean" ? row.isDiscount : sale.isDiscount,
  };
}

/**
 * Maps backend API product to frontend Product shape so existing UI components work unchanged.
 * Uses _id for slug (and derived numeric id); defaults missing fields.
 */
function mapApiProductToProduct(api: ApiProduct, genderHint?: Product["gender"]): Product {
  const id = numericIdFromString(api._id);
  const slug = api._id.toString();
  const price = resolveCatalogProductPrice(api);
  const colors = mapListProductColors(api);
  const image = ensureAbsoluteAssetUrl(pickListProductImageSource(api));
  const sizes: string[] =
    api.variant?.[0]?.size?.map((s) => s.size ?? "M").filter(Boolean) ??
    ["S", "M", "L", "XL"];

  const rootCompareAtPrice = pickCompareAtPrice(variantPriceFields(api, api));

  return {
    id,
    name: api.name ?? "Product",
    fit: "Regular Fit",
    gender: genderHint ?? "Men",
    price,
    ...(rootCompareAtPrice ? { compareAtPrice: rootCompareAtPrice } : {}),
    image,
    images: [image],
    category: (api.category != null ? String(api.category) : "General"),
    isNew: Boolean(api.isFeatured),
    slug,
    description: (api.title as string) ?? api.name ?? "",
    sizes,
    ...(colors?.length ? { colors } : {}),
  };
}

export function mapApiProductsToProducts(
  apiProducts: ApiProduct[],
  genderHint?: Product["gender"],
  genderMap?: Record<string, Product["gender"]>
): Product[] {
  return apiProducts.map((p) => mapApiProductToProduct(p, genderMap?.[p._id] ?? genderHint));
}

export function mapApiProductDetailToProduct(api: ApiProductDetail): Product {
  const id = numericIdFromString(api._id);
  const slug = api._id.toString();

  const { sizeToSku, sizeToPrice } = buildVariantMapsFromDetail(api);

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
      const compare = pickCompareAtPrice(variantPriceFields(api, s));
      if (compare != null) sizeToCompareAtPrice[key] = compare;
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

      const sizeFields = variantPriceFields(api, s);
      const unit = pickEffectivePrice(sizeFields);
      if (unit > 0) bucket.sizeToPrice[key] = unit;

      const compare = pickCompareAtPrice(sizeFields);
      if (compare != null) bucket.sizeToCompareAtPrice[key] = compare;
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
        const fields = variantPriceFields(api, v);
        const unit = pickEffectivePrice(fields);
        const compare = pickCompareAtPrice(fields);
        return {
          name,
          hex: v?.colorHex,
          sku: v?.sku,
          ...(unit > 0 ? { price: unit } : {}),
          ...(compare != null && unit > 0 && compare > unit ? { compareAtPrice: compare } : {}),
        };
      })
      .filter(Boolean) as NonNullable<Product["colors"]>;

  const computedPrice = resolveCatalogProductPrice(api);

  const variantBlocks = api.variant ?? [];
  const productCompare = pickCompareAtPrice(variantPriceFields(api, api));
  const singleVariantCompare =
    variantBlocks.length === 1 ? pickCompareAtPrice(variantPriceFields(api, variantBlocks[0]!)) : undefined;
  const compareAtPrice = productCompare ?? singleVariantCompare;

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
