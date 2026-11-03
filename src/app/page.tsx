import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ShopDepartments from "../components/ShopDepartments";
import ProductGrid from "../components/ProductGrid";
import Footer from "../components/Footer";
import { getHome } from "../services/homeService";
import { mapApiProductsToProducts } from "../types/api";
import type { ApiHero } from "../types/api";
import { parseShopGender, toProductGenderLabel, type ProductGenderLabel } from "../lib/shopGender";

function pickHero(list: ApiHero[], shop?: ReturnType<typeof parseShopGender>) {
  const active = list
    .filter((h) => h && (h.isActive == null || h.isActive === true))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const genderOf = (h: ApiHero) => (h.gender ?? "").toLowerCase();
  if (shop) {
    const match = active.find((h) => genderOf(h) === shop);
    if (match) return match;
    if (shop === "cosmetics") return undefined;
    return active.find((h) => genderOf(h) !== "cosmetics") ?? active[0];
  }
  return active.find((h) => !genderOf(h) || genderOf(h) === "unisex") ?? active.find((h) => genderOf(h) !== "cosmetics") ?? active[0];
}

/** Always refetch catalog — do not serve a cached home product grid with old prices. */
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ gender?: string }>;
}

function flattenCategoryProducts(data: Awaited<ReturnType<typeof getHome>>) {
  const out = data.categories
    .flatMap((c) => c.subCategory ?? [])
    .flatMap((s) => s.products ?? []);
  return out;
}

export default async function Home({ searchParams }: PageProps) {
  let featuredProducts: Awaited<ReturnType<typeof mapApiProductsToProducts>> | undefined;
  let campaign: { banner?: string; campaignName?: string } | undefined;
  let hero: ApiHero | undefined;
  let activeGender: ReturnType<typeof parseShopGender> = undefined;
  let loadError: string | null = null;

  try {
    const params = (await searchParams) ?? {};
    activeGender = parseShopGender(params.gender);
    const data = await getHome(activeGender);

    const heroRaw = data.hero;
    const heroList = Array.isArray(heroRaw) ? heroRaw : heroRaw ? [heroRaw] : [];
    hero = pickHero(heroList, activeGender);

    const apiProducts =
      (data.featuredProducts?.length ? data.featuredProducts : null) ??
      (data.allProducts?.length ? data.allProducts : null) ??
      flattenCategoryProducts(data);

    const genderHint = toProductGenderLabel(activeGender);

    const productGenderMap: Record<string, ProductGenderLabel> = {};
    for (const cat of data.categories ?? []) {
      const catGender = toProductGenderLabel(cat.gender) ?? "Men";
      for (const sub of cat.subCategory ?? []) {
        for (const prod of sub.products ?? []) {
          productGenderMap[prod._id] = catGender;
        }
      }
    }

    if (apiProducts?.length)
      featuredProducts = mapApiProductsToProducts(apiProducts, genderHint, productGenderMap);

    const first = data.campaigns?.[0];
    if (first) {
      campaign = {
        banner: first.banner,
        campaignName: first.campaignName,
      };
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load home data";
    // Gender tabs must not fall back to mock apparel when the API fails.
    featuredProducts = activeGender ? [] : undefined;
  }

  return (
    <main>
      <Navbar />
      <HeroSection
        shop={activeGender}
        campaign={activeGender === "cosmetics" ? undefined : campaign}
        hero={
          hero
            ? {
                video: hero.video,
                poster: hero.poster,
                labels: hero.labels,
                headline: hero.headline,
                subheadline: hero.subheadline,
                cta: hero.cta,
                theme: hero.theme,
              }
            : undefined
        }
      />
      <ShopDepartments active={activeGender} />
      {loadError && activeGender ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-red-700 border border-red-200 bg-red-50 px-4 py-3">
            {loadError}
            {activeGender === "cosmetics"
              ? " — cosmetics may not be enabled on this API yet. Use your local backend or deploy cosmetics support to production."
              : null}
          </p>
        </div>
      ) : null}
      <ProductGrid
        shop={activeGender}
        products={featuredProducts}
        emptyMessage={
          loadError && activeGender
            ? "Could not load products for this tab."
            : activeGender === "cosmetics" && featuredProducts?.length === 0
              ? "No cosmetics products available yet. Check back soon."
              : undefined
        }
      />
      <Footer />
    </main>
  );
}
