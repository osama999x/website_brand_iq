"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { cancelOrder, getOrderTracking } from "../../services/orderService";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("orderId") ?? "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof getOrderTracking>> | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = orderNumber.trim();
    if (!value) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);
    try {
      const data = await getOrderTracking(value);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch tracking details");
    } finally {
      setLoading(false);
    }
  }

  async function onCancelOrder() {
    if (!result?.order?.orderId) return;
    setCanceling(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await cancelOrder(result.order.orderId);
      setSuccess(response.msg || "Order canceled successfully.");
      const refreshed = await getOrderTracking(result.order.orderId);
      setResult(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel order");
    } finally {
      setCanceling(false);
    }
  }

  const canCancelPending = result?.order.status === "Pending" && result.order.isDeliver === false;
  const canCancelAfterDispatch = result?.order.status === "Delivered" && result.order.isDeliver === true;
  const canCancel = Boolean(canCancelPending || canCancelAfterDispatch);

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
            <li className="text-neutral-900 font-medium">Track Order</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-3">
          Track Order
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Enter your order number to see the latest status.
        </p>

        <div className="border border-neutral-200 p-6">
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch">
            <label className="flex-1">
              <span className="sr-only">Order number</span>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. 45641"
                className="w-full border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-900"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="bg-neutral-900 text-white text-xs font-bold tracking-[0.2em] uppercase px-7 py-3.5 hover:bg-neutral-700 transition-colors"
            >
              {loading ? "Tracking…" : "Track"}
            </button>
          </form>

          {error && (
            <div className="mt-6 border-t border-neutral-200 pt-5">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 border-t border-neutral-200 pt-5">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 border-t border-neutral-200 pt-5">
              <div className="border border-neutral-200 divide-y divide-neutral-100">
                <div className="flex items-center justify-between px-5 py-4 bg-neutral-50">
                  <span className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-500">
                    Order ID
                  </span>
                  <span className="text-sm font-black tracking-widest text-neutral-900 font-mono">
                    {result.order.orderId}
                  </span>
                </div>

                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-neutral-500">Status</span>
                  <span className="text-sm font-semibold text-neutral-900">{result.order.status}</span>
                </div>

                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-neutral-500">Placed On</span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {new Date(result.order.placedOn).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-neutral-500">Courier</span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {result.order.courierType ?? "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-neutral-500">Tracking ID</span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {result.order.trackingId ?? "—"}
                  </span>
                </div>
              </div>

              <h2 className="mt-8 text-xs font-bold tracking-[0.2em] uppercase text-neutral-900">
                Timeline
              </h2>
              <ol className="mt-3 border border-neutral-200 divide-y divide-neutral-100">
                {result.timeline.length > 0 ? (
                  result.timeline.map((t, idx) => (
                    <li key={`${t.time}-${idx}`} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900">{t.status}</p>
                          {t.message ? (
                            <p className="mt-1 text-sm text-neutral-600">{t.message}</p>
                          ) : null}
                          {t.deliveryPartner ? (
                            <p className="mt-1 text-xs text-neutral-400">
                              Partner: {t.deliveryPartner}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-xs text-neutral-500 whitespace-nowrap">
                          {new Date(t.time).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-5 py-4 text-sm text-neutral-500">No timeline events yet.</li>
                )}
              </ol>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onCancelOrder}
                  disabled={!canCancel || canceling}
                  className="border border-neutral-900 bg-neutral-900 text-white text-xs font-bold tracking-[0.2em] uppercase px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 hover:border-neutral-700 transition-colors"
                >
                  {canceling ? "Canceling..." : "Cancel Order"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

