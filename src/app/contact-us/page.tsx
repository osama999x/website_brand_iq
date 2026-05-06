"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ContactUsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

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
            <li className="text-neutral-900 font-medium">Contact Us</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-3">
          Contact Us
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Send us a message and we’ll get back to you as soon as possible.
        </p>

        <div className="border border-neutral-200 p-6">
          {sent ? (
            <div className="text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">Thanks! Your message is ready to send.</p>
              <p className="mt-2 text-neutral-500">
                This form is currently frontend-only (no backend submit endpoint configured yet).
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
                    placeholder="Your name"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
                    placeholder="you@example.com"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[140px] border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
                  placeholder="How can we help?"
                />
              </label>
              <button
                type="submit"
                className="bg-neutral-900 text-white text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-neutral-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

