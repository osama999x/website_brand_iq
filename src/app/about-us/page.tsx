import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function AboutUsPage() {
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
            <li className="text-neutral-900 font-medium">About Us</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-3">
          About Us
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          BrandIQ is built around everyday style — modern essentials, clean fits, and quality materials.
        </p>

        <div className="border border-neutral-200 p-6 space-y-4 text-sm text-neutral-700">
          <p>
            Replace this content with your brand story, manufacturing details, and what makes your products different.
          </p>
          <p className="text-neutral-500">
            Want to reach us?{" "}
            <Link href="/contact-us" className="underline hover:text-neutral-900 transition-colors">
              Contact Us
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}

