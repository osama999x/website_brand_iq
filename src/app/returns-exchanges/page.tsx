"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { returnOrder, type ReturnOrderProductLine } from "../../services/orderService";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function ReturnsExchangesPage() {
  const [orderId, setOrderId] = useState("");
  const [shipmentType, setShipmentType] = useState<"pickup" | "dropoff">("pickup");
  const [isOrderReturn, setIsOrderReturn] = useState(true);
  const [exchangeReason, setExchangeReason] = useState("");
  const [lines, setLines] = useState<ReturnOrderProductLine[]>([
    { productId: "", quantity: 1, price: 0, sku: "", size: "" },
  ]);
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!orderId.trim()) return false;
    if (!exchangeReason.trim()) return false;
    if (!shipmentType) return false;
    if (!Array.isArray(lines) || lines.length === 0) return false;
    return lines.every((l) => l.productId.trim() && l.sku.trim() && l.size.trim() && l.quantity > 0);
  }, [exchangeReason, lines, orderId, shipmentType]);

  function updateLine(idx: number, patch: Partial<ReturnOrderProductLine>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: 1, price: 0, sku: "", size: "" }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError("Please fill required fields (order id, reason, shipment type, and return items).");
      return;
    }

    setSubmitting(true);
    try {
      const dataUrls = images.length ? await Promise.all(images.map(fileToDataUrl)) : [];
      const res = await returnOrder({
        orderId: orderId.trim(),
        isOrderReturn,
        shipmentType,
        exchangeReason: exchangeReason.trim(),
        returnProduct: lines.map((l) => ({
          productId: l.productId.trim(),
          quantity: Number(l.quantity) || 1,
          price: Number(l.price) || 0,
          sku: l.sku.trim(),
          size: l.size.trim(),
        })),
        ...(dataUrls.length ? { images: dataUrls } : {}),
      });
      setSuccess(res.msg || "Order return request has been submitted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit return request");
    } finally {
      setSubmitting(false);
    }
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
            <li className="text-neutral-900 font-medium">Returns &amp; Exchanges</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-3">
          Returns &amp; Exchanges
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Submit a return or exchange request using your order ID.
        </p>

        <div className="border border-neutral-200 p-6">
          {error ? (
            <div className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mb-5 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                  Order ID <span className="text-red-500">*</span>
                </span>
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 16081"
                  className="border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                  Shipment Type <span className="text-red-500">*</span>
                </span>
                <select
                  value={shipmentType}
                  onChange={(e) => setShipmentType(e.target.value as "pickup" | "dropoff")}
                  className="border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
                >
                  <option value="pickup">Pickup</option>
                  <option value="dropoff">Dropoff</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isOrderReturn"
                type="checkbox"
                checked={isOrderReturn}
                onChange={(e) => setIsOrderReturn(e.target.checked)}
                className="h-4 w-4 accent-neutral-900"
              />
              <label htmlFor="isOrderReturn" className="text-sm text-neutral-700">
                This is a return request (unchecked = exchange)
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                Reason <span className="text-red-500">*</span>
              </span>
              <textarea
                value={exchangeReason}
                onChange={(e) => setExchangeReason(e.target.value)}
                placeholder="e.g. Size issue"
                className="min-h-[110px] border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
              />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900">
                  Return Items <span className="text-red-500">*</span>
                </h2>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs font-semibold underline text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  + Add item
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {lines.map((l, idx) => (
                  <div key={idx} className="border border-neutral-200 p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                          Product ID <span className="text-red-500">*</span>
                        </span>
                        <input
                          value={l.productId}
                          onChange={(e) => updateLine(idx, { productId: e.target.value })}
                          className="border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                          SKU <span className="text-red-500">*</span>
                        </span>
                        <input
                          value={l.sku}
                          onChange={(e) => updateLine(idx, { sku: e.target.value })}
                          className="border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                          Size <span className="text-red-500">*</span>
                        </span>
                        <input
                          value={l.size}
                          onChange={(e) => updateLine(idx, { size: e.target.value })}
                          placeholder='e.g. M or ONE SIZE (RED)'
                          className="border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                          Quantity <span className="text-red-500">*</span>
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                          className="border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                          Price
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={l.price}
                          onChange={(e) => updateLine(idx, { price: Number(e.target.value) })}
                          className="border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                        />
                      </label>
                    </div>

                    {lines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-xs font-semibold text-red-600 underline hover:text-red-700 transition-colors"
                      >
                        Remove item
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                Images (optional)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files ?? []))}
                className="text-sm"
              />
              {/* <p className="text-xs text-neutral-400">
                Images are sent as base64 strings (as your API expects).
              </p> */}
            </label>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`w-full py-4 text-xs font-bold tracking-[0.2em] uppercase transition-colors ${
                !canSubmit || submitting
                  ? "bg-neutral-300 text-neutral-600 cursor-not-allowed"
                  : "bg-neutral-900 text-white hover:bg-neutral-700"
              }`}
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </form>

          <p className="mt-6 text-xs text-neutral-400">
            Need help? Visit{" "}
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

