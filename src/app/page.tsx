import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ProductGrid from "../components/ProductGrid";
import Footer from "../components/Footer";
import { getHome } from "../services/homeService";
import { mapApiProductsToProducts } from "../types/api";
import type { ApiHero } from "../types/api";

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

  try {
    const params = (await searchParams) ?? {};
    const gender = params.gender;
    const data = await getHome(gender);

    const heroRaw = data.hero;
    const heroList = Array.isArray(heroRaw) ? heroRaw : heroRaw ? [heroRaw] : [];
    const activeSorted = heroList
      .filter((h) => h && (h.isActive == null || h.isActive === true))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    hero = activeSorted[0];

    const apiProducts =
      (data.featuredProducts?.length ? data.featuredProducts : null) ??
      (data.allProducts?.length ? data.allProducts : null) ??
      flattenCategoryProducts(data);

    const genderHint =
      gender === "women" ? "Women" : gender === "juniors" ? "Juniors" : gender === "men" ? "Men" : undefined;

    // Build product-ID → gender from the categories payload so each card
    // shows the correct gender instead of defaulting to "Men" for every product.
    const productGenderMap: Record<string, "Men" | "Women" | "Juniors"> = {};
    for (const cat of data.categories ?? []) {
      const catGender: "Men" | "Women" | "Juniors" =
        cat.gender === "women" ? "Women" : cat.gender === "juniors" ? "Juniors" : "Men";
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
  } catch {
    // API unavailable: ProductGrid and HeroSection use default/static content
  }

  return (
    <main>
      <Navbar />
      <HeroSection
        campaign={campaign}
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
      <ProductGrid products={featuredProducts} />
      <Footer />
    </main>
  );
}
