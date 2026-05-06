import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const FAQS = [
  { q: "How long does delivery take?", a: "Typically 3–5 business days (varies by city)." },
  { q: "Can I exchange an item?", a: "Yes, if it meets eligibility rules in Returns & Exchanges." },
  { q: "How do I contact support?", a: "Use the Contact Us page and we’ll get back to you." },
];

export default function FaqsPage() {
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
            <li className="text-neutral-900 font-medium">FAQs</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-3">FAQs</h1>
        <p className="text-sm text-neutral-500 mb-8">Quick answers to common questions.</p>

        <div className="border border-neutral-200 divide-y divide-neutral-100">
          {FAQS.map((item) => (
            <details key={item.q} className="p-6 group">
              <summary className="cursor-pointer select-none text-sm font-semibold text-neutral-900">
                {item.q}
              </summary>
              <p className="mt-3 text-sm text-neutral-600">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-sm text-neutral-500">
          Need more help?{" "}
          <Link href="/contact-us" className="underline hover:text-neutral-900 transition-colors">
            Contact Us
          </Link>
          .
        </p>
      </main>

      <Footer />
    </>
  );
}

