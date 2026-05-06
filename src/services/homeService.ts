import { apiClient } from "../lib/api";
import type {
  ApiWrapper,
  HomeResponse,
  PaginatedResponse,
  ApiProduct,
  ApiCategory,
  ApiProductDetail,
} from "../types/api";
import { mapApiProductsToProducts } from "../types/api";
import type { Product } from "../data/products";

/** Query params for list endpoints */
export interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "popular";
  minPrice?: number;
  maxPrice?: number;
  isSale?: boolean;
  inStock?: boolean;
  /** Keyword search (backend accepts `q` or `keyword`; we send `q`). */
  keyword?: string;
}

function buildListParams(params: ListParams = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (params.page != null) out.page = params.page;
  if (params.limit != null) out.limit = params.limit;
  if (params.sortBy != null) out.sortBy = params.sortBy;
  if (params.minPrice != null) out.minPrice = params.minPrice;
  if (params.maxPrice != null) out.maxPrice = params.maxPrice;
  if (params.isSale === true) out.isSale = "true";
  if (params.inStock === true) out.inStock = "true";
  if (params.keyword != null && String(params.keyword).trim()) out.q = String(params.keyword).trim();
  return out;
}

/** GET /all — home screen data */
export async function getHome(gender?: string, filters?: ListParams): Promise<HomeResponse> {
  const res = await apiClient<ApiWrapper<HomeResponse>>("all", {
    params: {
      ...(gender ? { gender } : {}),
      ...buildListParams(filters),
    },
  });
  return res.data;
}

async function getNewArrivals(params?: ListParams) {
  const res = await apiClient<ApiWrapper<PaginatedResponse<ApiProduct>>>("newArrivals", {
    params: buildListParams(params),
  });
  return res.data;
}

async function getProductsByCategory(categoryId: string, params?: ListParams) {
  const res = await apiClient<ApiWrapper<PaginatedResponse<ApiProduct>>>("productsByCategory", {
    params: { categoryId, ...buildListParams(params) },
  });
  return res.data;
}

async function getProductsBySubCategory(subCategoryId: string, params?: ListParams) {
  const res = await apiClient<ApiWrapper<PaginatedResponse<ApiProduct>>>("productsBySubCategory", {
    params: { subCategoryId, ...buildListParams(params) },
  });
  return res.data;
}

async function getRelatedProducts(productId: string, params?: ListParams) {
  const res = await apiClient<ApiWrapper<PaginatedResponse<ApiProduct>>>("relatedProducts", {
    params: { productId, ...buildListParams(params) },
  });
  return res.data;
}

/** GET /getAllCategories */
export async function getAllCategories(gender?: string): Promise<ApiCategory[]> {
  const res = await apiClient<ApiWrapper<ApiCategory[]>>("getAllCategories", {
    params: gender ? { gender } : undefined,
  });
  return res.data;
}

/** GET /productDetail */
export async function getProductDetail(productId: string): Promise<ApiProductDetail> {
  const res = await apiClient<ApiWrapper<ApiProductDetail>>("productDetail", {
    params: { productId },
  });
  return res.data;
}

/** Helpers that return frontend Product[] for drop-in use in UI */
export async function getNewArrivalsMapped(params?: ListParams): Promise<{
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  products: Product[];
}> {
  const data = await getNewArrivals(params);
  return { ...data, products: mapApiProductsToProducts(data.products) };
}

export async function getProductsByCategoryMapped(
  categoryId: string,
  params?: ListParams
): Promise<{
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  products: Product[];
}> {
  const data = await getProductsByCategory(categoryId, params);
  return { ...data, products: mapApiProductsToProducts(data.products) };
}

export async function getProductsBySubCategoryMapped(
  subCategoryId: string,
  params?: ListParams
): Promise<{
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  products: Product[];
}> {
  const data = await getProductsBySubCategory(subCategoryId, params);
  return { ...data, products: mapApiProductsToProducts(data.products) };
}

export async function getRelatedProductsMapped(
  productId: string,
  params?: ListParams
): Promise<{
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  products: Product[];
}> {
  const data = await getRelatedProducts(productId, params);
  return { ...data, products: mapApiProductsToProducts(data.products) };
}
