import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function StoreLocatorPage() {
  return (
    <>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-neutral-500">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-900 font-medium">Store Locator</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-3">
          Store Locator
        </h1>
        <p className="text-sm text-neutral-500 mb-8">Find a store near you.</p>

        <div className="border border-neutral-200 p-6 space-y-3 text-sm text-neutral-700">
          <p>This is a placeholder page. Add store addresses, hours, and a map integration if needed.</p>
          <p className="text-neutral-500">
            If you want an interactive map, we can integrate Google Maps or Mapbox (frontend-only) or power it with a
            store-locations API (backend).
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}

