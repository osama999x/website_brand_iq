import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ProductGallery from "../../../components/ProductGallery";
import ProductInfo from "../../../components/ProductInfo";
import ProductCard from "../../../components/ProductCard";
import products from "../../../data/products";
import { getProductDetail, getRelatedProductsMapped } from "../../../services/homeService";
import type { Product } from "../../../data/products";
import { mapApiProductDetailToProduct } from "../../../types/api";

/** Slug is a Mongo ObjectId when from API (24 hex chars) */
const isMongoId = (s: string) => /^[a-f0-9]{24}$/i.test(s);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (isMongoId(slug)) {
    try {
      const apiProduct = await getProductDetail(slug);
      return {
        title: `${apiProduct.name} | BrandIQ`,
        description: apiProduct.description ?? apiProduct.title ?? apiProduct.name,
      };
    } catch {
      // fallback to mock
    }
  }
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: "Product | BrandIQ" };
  return {
    title: `${product.name} | BrandIQ`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let product = products.find((p) => p.slug === slug);

  if (isMongoId(slug)) {
    try {
      const apiProduct = await getProductDetail(slug);
      product = mapApiProductDetailToProduct(apiProduct);
    } catch {
      // keep mock fallback
    }
  }

  if (!product) notFound();

  let relatedProducts: Product[] = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);
  if (relatedProducts.length === 0) {
    relatedProducts = products.filter((p) => p.id !== product.id).slice(0, 4);
  }

  if (isMongoId(slug)) {
    try {
      const data = await getRelatedProductsMapped(slug, { page: 1, limit: 4 });
      if (data.products.length > 0) relatedProducts = data.products;
    } catch {
      // keep mock related
    }
  }

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="py-4">
          <ol className="flex items-center gap-1.5 text-xs text-neutral-500">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/products" className="hover:text-neutral-900 transition-colors">
                All Products
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-900 font-medium truncate max-w-[180px]">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Product layout: gallery (left) + info (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-14 pb-16 lg:pb-24">
          {/* Left — Image gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Right — Product info */}
          <div className="lg:py-2">
            <ProductInfo product={product} />
          </div>
        </div>

        {/* You may also like */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-neutral-200 pt-14 pb-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-neutral-500 mb-1.5">
                  Explore more
                </p>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                  You May Also Like
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline-block text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 border-b-2 border-neutral-900 pb-0.5 hover:text-neutral-500 hover:border-neutral-500 transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
              {relatedProducts.map((p) => (
                <ProductCard key={`${p.id}-${p.slug}`} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
