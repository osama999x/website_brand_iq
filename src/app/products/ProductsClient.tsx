"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import FilterSidebar from "../../components/FilterSidebar";
import ProductCard from "../../components/ProductCard";
import Skeleton from "../../components/ui/Skeleton";
import defaultProducts from "../../data/products";
import Link from "next/link";
import {
  getNewArrivalsMapped,
  getProductsByCategoryMapped,
  getProductsBySubCategoryMapped,
  getHome,
} from "../../services/homeService";
import { mapApiProductsToProducts } from "../../types/api";
import type { Product } from "../../data/products";
import type { ApiFilterOptions } from "../../types/api";

type SortOption = "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

/** Map frontend sort to API sortBy */
const SORT_TO_API: Record<SortOption, "newest" | "price_asc" | "price_desc"> = {
  newest: "newest",
  "price-asc": "price_asc",
  "price-desc": "price_desc",
};

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h18M7 10h10M11 16h2"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5 pointer-events-none"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ProductsClient({ gender }: { gender?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(gender ?? null);
  const [keyword, setKeyword] = useState<string>("");
  const [filterOptions, setFilterOptions] = useState<ApiFilterOptions | null>(null);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [total, setTotal] = useState(defaultProducts.length);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function sameFilterOptions(a: ApiFilterOptions | null, b: ApiFilterOptions | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.categories.length !== b.categories.length) return false;
    if (a.subcategories.length !== b.subcategories.length) return false;
    if (a.genders.length !== b.genders.length) return false;
    // Cheap structural check (ids are stable)
    const aCat0 = a.categories[0]?._id;
    const bCat0 = b.categories[0]?._id;
    const aSub0 = a.subcategories[0]?._id;
    const bSub0 = b.subcategories[0]?._id;
    return aCat0 === bCat0 && aSub0 === bSub0;
  }

  useEffect(() => {
    setSelectedGender(gender ?? null);
  }, [gender]);

  useEffect(() => {
    // Keep it Suspense-free: read query from window on mount + URL changes.
    const read = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const q = (sp.get("q") ?? sp.get("keyword") ?? "").trim();
        setKeyword(q);
      } catch {
        setKeyword("");
      }
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const pageTitle = useMemo(() => {
    if (keyword) return `Search results for “${keyword}”`;
    return "All Products";
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = {
      page: 1,
      limit: 24,
      sortBy: SORT_TO_API[sort],
      ...(keyword ? { keyword } : {}),
    } as const;

    const run = async () => {
      try {
        // When searching, use the home/all endpoint (supports keyword) and ignore category/subcategory filters.
        if (!keyword && subCategoryId) {
          const data = await getProductsBySubCategoryMapped(subCategoryId, params);
          if (!cancelled) {
            setProducts(data.products);
            setTotal(data.total);
          }
        } else if (!keyword && categoryId) {
          const data = await getProductsByCategoryMapped(categoryId, params);
          if (!cancelled) {
            setProducts(data.products);
            setTotal(data.total);
          }
        } else {
          // For top-level listing (no category selection), align with navbar gender filter
          // using GET /home/all?gender=...
          try {
            const data = await getHome(selectedGender ?? undefined, params);
            if (!cancelled) {
              const next = data.filterOptions ?? null;
              setFilterOptions((prev) => (sameFilterOptions(prev, next) ? prev : next));
            }
            const apiProducts =
              data.featuredProducts?.length
                ? data.featuredProducts
                : data.allProducts?.length
                  ? data.allProducts
                  : data.categories
                      .flatMap((c) => c.subCategory ?? [])
                      .flatMap((s) => s.products ?? []);

            const genderHint =
              selectedGender === "women"
                ? "Women"
                : selectedGender === "juniors"
                  ? "Juniors"
                  : selectedGender === "men"
                    ? "Men"
                    : undefined;
            const mapped = apiProducts?.length ? mapApiProductsToProducts(apiProducts, genderHint) : [];
            if (!cancelled) {
              setProducts(mapped.length ? mapped : defaultProducts);
              setTotal(mapped.length ? mapped.length : defaultProducts.length);
            }
          } catch {
            // fallback to old endpoint if home/all isn't available
            const data = await getNewArrivalsMapped(params);
            if (!cancelled) {
              setProducts(data.products);
              setTotal(data.total);
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load products");
          setProducts(defaultProducts);
          setTotal(defaultProducts.length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    categoryId,
    subCategoryId,
    sort,
    selectedGender,
    keyword,
  ]);

  function handleCategoryChange(catId: string | null, subId: string | null) {
    setCategoryId(catId);
    setSubCategoryId(subId);
  }

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="py-4">
          <ol className="flex items-center gap-1.5 text-xs text-neutral-500">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-900 font-medium">All Products</li>
          </ol>
        </nav>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{total} items</p>
        </div>

        {/* Layout: sidebar + content */}
        <div className="flex gap-8 pb-20">
          {/* Filter sidebar */}
          <FilterSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            selectedCategoryId={categoryId}
            selectedSubCategoryId={subCategoryId}
            onCategoryChange={handleCategoryChange}
            filterOptions={filterOptions}
            selectedGender={selectedGender}
            onGenderChange={(g) => {
              setSelectedGender(g);
              // reset category selection when gender changes (prevents mismatched category lists)
              setCategoryId(null);
              setSubCategoryId(null);
            }}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Mobile: filter toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 border border-neutral-300 px-3 py-2 text-xs font-semibold tracking-wide uppercase text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <FilterIcon />
                Filters
              </button>

              {/* Desktop: results count */}
              <p className="hidden lg:block text-sm text-neutral-500">
                Showing{" "}
                <span className="font-semibold text-neutral-900">{products.length}</span>{" "}
                products
              </p>

              {/* Sort dropdown */}
              <div className="relative flex items-center gap-2 ml-auto">
                <label
                  htmlFor="sort-select"
                  className="text-xs font-semibold tracking-wide uppercase text-neutral-500 whitespace-nowrap hidden sm:block"
                >
                  Sort by
                </label>
                <div className="relative">
                  <select
                    id="sort-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="appearance-none border border-neutral-300 bg-white text-sm text-neutral-900 font-medium pl-3 pr-8 py-2 cursor-pointer hover:border-neutral-900 transition-colors focus:outline-none focus:border-neutral-900"
                  >
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <option key={key} value={key}>
                        {SORT_LABELS[key]}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                    <ChevronDown />
                  </span>
                </div>
              </div>
            </div>

            {/* Active sort indicator (UI only) */}
            {sort !== "newest" && (
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-medium px-3 py-1.5">
                  {SORT_LABELS[sort]}
                  <button
                    onClick={() => setSort("newest")}
                    aria-label="Clear sort"
                    className="text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer leading-none"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-[3/4]" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                {products.map((product) => (
                  <ProductCard key={`${product.id}-${product.slug}`} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

