"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-20 w-20 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function OrderSuccessPage() {
  const [query] = useState<{ orderId?: string; id?: string }>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return {
        orderId: sp.get("orderId") ?? undefined,
        id: sp.get("id") ?? undefined,
      };
    } catch {
      return {};
    }
  });

  const [details] = useState<{
    _id?: string;
    orderId?: string;
    paymentMode?: string;
    total?: number;
    email?: string;
  } | null>(() => {
    try {
      const raw = sessionStorage.getItem("brandiq-last-order");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        _id: typeof parsed._id === "string" ? parsed._id : undefined,
        orderId: typeof parsed.orderId === "string" ? parsed.orderId : undefined,
        paymentMode: typeof parsed.paymentMode === "string" ? parsed.paymentMode : undefined,
        total: typeof parsed.total === "number" ? parsed.total : undefined,
        email: typeof parsed.email === "string" ? parsed.email : undefined,
      };
    } catch {
      return null;
    }
  });

  const orderId = query.orderId ?? details?.orderId;
  const refId = query.id ?? details?._id;

  return (
    <>
      <Navbar />

      <main className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="w-full max-w-lg text-center">

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <CheckCircleIcon />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900 mb-3">
            Order Confirmed!
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Thank you for shopping with BrandIQ. Your order has been received
            and is being prepared for dispatch.
          </p>

          {/* Order details card */}
          <div className="border border-neutral-200 divide-y divide-neutral-100 text-left mb-8">

            {/* Order number — highlighted row */}
            <div className="flex items-center justify-between px-5 py-4 bg-neutral-50">
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-500">
                Order Number
              </span>
              <span className="text-sm font-black tracking-widest text-neutral-900 font-mono">
                {orderId || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-neutral-500">Status</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                Confirmed
              </span>
            </div>

            {refId ? (
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-neutral-500">Reference</span>
                <span className="text-xs font-semibold text-neutral-900 font-mono">
                  {refId}
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-neutral-500">Estimated Delivery</span>
              <span className="text-sm font-semibold text-neutral-900">3–5 Business Days</span>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-neutral-500">Payment</span>
              <span className="text-sm font-semibold text-neutral-900">
                {details?.paymentMode ?? "—"}
              </span>
            </div>

            {details?.total != null ? (
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-neutral-500">Total</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {details.total.toLocaleString("en-PK")}</span>
              </div>
            ) : null}

            {details?.email ? (
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-neutral-500">Email</span>
                <span className="text-sm font-semibold text-neutral-900">{details.email}</span>
              </div>
            ) : null}
          </div>

          <p className="text-xs text-neutral-400 mb-8">
            A confirmation email will be sent to your inbox shortly.
            <br />
            Keep your order number handy for tracking.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/products"
              className="w-full sm:w-auto inline-block bg-neutral-900 text-white text-xs font-bold tracking-[0.2em] uppercase px-10 py-4 hover:bg-neutral-700 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              href={orderId ? `/track-order?orderId=${encodeURIComponent(orderId)}` : "/track-order"}
              className="w-full sm:w-auto inline-block border border-neutral-300 text-neutral-700 text-xs font-bold tracking-[0.2em] uppercase px-10 py-4 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            >
              Track Order
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-block border border-neutral-300 text-neutral-700 text-xs font-bold tracking-[0.2em] uppercase px-10 py-4 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
