"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCartStore, selectCartCount, selectSubtotal } from "../../store/cartStore";
import type { CreateOrderPayload } from "../../types/order";
import { createOrder } from "../../services/orderService";
import { getProductDetail } from "../../services/homeService";
import { resolveOrderProductLines } from "../../lib/productVariantMaps";
import { calcCartTotals, formatMoney } from "../../lib/pricing";

/* ── Types ──────────────────────────────────────────────────────── */

type PaymentChoice = "cod" | "easypaisa" | "bank";

const PAYMENT_API: Record<PaymentChoice, { paymentMode: string; payment: boolean }> = {
  cod: { paymentMode: "COD", payment: false },
  easypaisa: { paymentMode: "EASYPAISA", payment: true },
  bank: { paymentMode: "BANK_TRANSFER", payment: true },
};

interface FormFields {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

const INITIAL_FIELDS: FormFields = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

/* ── Validation ──────────────────────────────────────────────────── */

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.fullName.trim()) errors.fullName = "Full name is required.";
  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!fields.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!/^\+?[\d\s\-()]{7,15}$/.test(fields.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }
  if (!fields.address.trim()) errors.address = "Address is required.";
  if (!fields.city.trim()) errors.city = "City is required.";
  if (!fields.postalCode.trim()) errors.postalCode = "Postal code is required.";

  return errors;
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const t = full.trim();
  if (!t) return { firstName: "", lastName: "" };
  const i = t.indexOf(" ");
  if (i === -1) return { firstName: t, lastName: "" };
  return { firstName: t.slice(0, i).trim(), lastName: t.slice(i + 1).trim() };
}

function normalizeContact(phone: string): string {
  return phone.replace(/\s+/g, "");
}

/* ── Field component ─────────────────────────────────────────────── */

function Field({
  label,
  id,
  type = "text",
  placeholder,
  value,
  error,
  autoComplete,
  onChange,
}: {
  label: string;
  id: keyof FormFields;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  autoComplete?: string;
  onChange: (id: keyof FormFields, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(id, e.target.value)}
        className={`w-full border px-3.5 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors duration-150 focus:border-neutral-900 ${
          error ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white hover:border-neutral-400"
        }`}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectSubtotal);
  const cartCount = useCartStore(selectCartCount);
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();

  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("cod");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { shipping, total } = calcCartTotals(items);

  /* Redirect to cart if empty */
  useEffect(() => {
    if (!orderPlaced && cartCount === 0) router.replace("/cart");
  }, [cartCount, orderPlaced, router]);

  function handleChange(id: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorId = Object.keys(validationErrors)[0];
      document.getElementById(firstErrorId)?.focus();
      return;
    }

    const { firstName, lastName } = splitFullName(fields.fullName);
    const contact = normalizeContact(fields.phone);
    const email = fields.email.trim();
    const addressLine = fields.address.trim();
    const province = fields.city.trim();
    const zipCode = fields.postalCode.trim();
    const { paymentMode, payment } = PAYMENT_API[paymentChoice];

    setSubmitting(true);
    setSubmitError(null);
    try {
      const resolved = await resolveOrderProductLines(items, getProductDetail);
      if (!resolved.ok) {
        setSubmitError(resolved.message);
        return;
      }

      const payload: CreateOrderPayload = {
        paymentMode,
        payment,
        totalBill: String(total),
        totalAmount: String(total),
        redeemValue: 0,
        channel: "Web View",
        couponCode: "",
        tax: null,
        product: resolved.lines,
        billingAddress: {
          email,
          contact,
          addressLine,
          province,
          zipCode,
          firstName,
          lastName,
        },
        shippingAddress: {
          email,
          contact,
          addressLine,
          province,
          zipCode,
        },
      };

      const created = await createOrder(payload);
      setOrderPlaced(true);
      try {
        sessionStorage.setItem(
          "brandiq-last-order",
          JSON.stringify({
            _id: created._id,
            orderId: created.orderId,
            paymentMode,
            total,
            email,
          })
        );
      } catch {
        // ignore storage errors (private mode, quota, etc.)
      }
      router.push(
        `/order-success?orderId=${encodeURIComponent(created.orderId)}&id=${encodeURIComponent(created._id)}`
      );
      clearCart();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (cartCount === 0) return null;

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-neutral-500">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/cart" className="hover:text-neutral-900 transition-colors">Cart</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-900 font-medium">Checkout</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-8">
          Checkout
        </h1>

        {submitError && (
          <div
            role="alert"
            className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-14 items-start">

            {/* ── Left: Shipping form ─────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-8">

              {/* Section: Contact */}
              <section>
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 mb-4 pb-3 border-b border-neutral-200">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field
                      label="Full Name"
                      id="fullName"
                      placeholder="Ali Hassan"
                      value={fields.fullName}
                      error={errors.fullName}
                      autoComplete="name"
                      onChange={handleChange}
                    />
                  </div>
                  <Field
                    label="Email Address"
                    id="email"
                    type="email"
                    placeholder="ali@example.com"
                    value={fields.email}
                    error={errors.email}
                    autoComplete="email"
                    onChange={handleChange}
                  />
                  <Field
                    label="Phone Number"
                    id="phone"
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={fields.phone}
                    error={errors.phone}
                    autoComplete="tel"
                    onChange={handleChange}
                  />
                </div>
              </section>

              {/* Section: Shipping address */}
              <section>
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 mb-4 pb-3 border-b border-neutral-200">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field
                      label="Street Address"
                      id="address"
                      placeholder="123 Main Street, Block 4"
                      value={fields.address}
                      error={errors.address}
                      autoComplete="street-address"
                      onChange={handleChange}
                    />
                  </div>
                  <Field
                    label="City"
                    id="city"
                    placeholder="Karachi"
                    value={fields.city}
                    error={errors.city}
                    autoComplete="address-level2"
                    onChange={handleChange}
                  />
                  <Field
                    label="Postal Code"
                    id="postalCode"
                    placeholder="75500"
                    value={fields.postalCode}
                    error={errors.postalCode}
                    autoComplete="postal-code"
                    onChange={handleChange}
                  />
                </div>
              </section>

              {/* Section: Payment method (static) */}
              <section>
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 mb-4 pb-3 border-b border-neutral-200">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {(
                    [
                      { key: "cod" as const, label: "Cash on Delivery", recommended: true },
                      { key: "easypaisa" as const, label: "Easy Paisa / Jazz Cash", recommended: false },
                      { key: "bank" as const, label: "Bank Transfer", recommended: false },
                    ] as const
                  ).map(({ key, label, recommended }) => {
                    const inputId = `checkout-payment-${key}`;
                    return (
                      <label
                        key={key}
                        htmlFor={inputId}
                        className={`flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center gap-3 border px-4 py-3.5 transition-colors [-webkit-tap-highlight-color:transparent] ${
                          paymentChoice === key
                            ? "border-neutral-900 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-400 active:bg-neutral-50/80"
                        }`}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                          <input
                            id={inputId}
                            type="radio"
                            name="payment"
                            value={key}
                            checked={paymentChoice === key}
                            onChange={() => setPaymentChoice(key)}
                            className="h-5 w-5 cursor-pointer accent-neutral-900"
                          />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-neutral-800">{label}</span>
                          {recommended ? (
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 border border-green-200 whitespace-nowrap">
                              Recommended
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-neutral-400">
                  Secure payment. Your order details are safe with us.
                </p>
              </section>

              {/* Submit — mobile only, shown below form on small screens */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 ${
                    submitting
                      ? "bg-neutral-400 text-white cursor-not-allowed"
                      : "bg-neutral-900 text-white hover:bg-neutral-700 cursor-pointer"
                  }`}
                >
                  {submitting ? "Placing Order…" : "Place Order"}
                </button>
              </div>
            </div>

            {/* ── Right: Order summary ────────────────────────── */}
            <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-24">
              <div className="border border-neutral-200 p-6">
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 mb-5">
                  Order Summary
                </h2>

                {/* Item list */}
                <ul className="divide-y divide-neutral-100 mb-5">
                  {items.map((item) => (
                    <li
                      key={`${item.productId}-${item.size}`}
                      className="flex gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-14 h-[72px] flex-shrink-0 bg-neutral-100 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover object-center"
                          sizes="56px"
                        />
                        {/* Quantity bubble */}
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 text-white text-[10px] font-bold leading-none">
                          {item.quantity}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 justify-between items-start min-w-0">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-neutral-900 leading-snug line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">Size: {item.size}</p>
                        </div>
                        <p className="text-xs font-bold text-neutral-900 whitespace-nowrap flex-shrink-0">
                          {formatMoney(item.price * item.quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Totals */}
                <dl className="space-y-2.5 text-sm border-t border-neutral-200 pt-4">
                  <div className="flex justify-between">
                    <dt className="text-neutral-600">Subtotal</dt>
                    <dd className="font-semibold text-neutral-900">
                      {formatMoney(subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-600">Shipping</dt>
                    <dd className={`font-semibold ${shipping === 0 ? "text-green-600" : "text-neutral-900"}`}>
                      {shipping === 0 ? "Free" : formatMoney(shipping)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold uppercase tracking-wide text-neutral-900">
                    Total
                  </span>
                  <span className="text-xl font-black text-neutral-900">
                    {formatMoney(total)}
                  </span>
                </div>

                {/* Submit — desktop */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`hidden lg:block mt-6 w-full py-4 text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 ${
                    submitting
                      ? "bg-neutral-400 text-white cursor-not-allowed"
                      : "bg-neutral-900 text-white hover:bg-neutral-700 cursor-pointer"
                  }`}
                >
                  {submitting ? "Placing Order…" : "Place Order"}
                </button>

                <p className="mt-3 text-center text-xs text-neutral-400">
                  By placing your order you agree to our Terms & Privacy Policy.
                </p>
              </div>

              {/* Back to cart */}
              <p className="mt-4 text-center text-xs text-neutral-500">
                <Link
                  href="/cart"
                  className="underline hover:text-neutral-900 transition-colors"
                >
                  ← Back to Cart
                </Link>
              </p>
            </aside>

          </div>
        </form>
      </main>

      <Footer />
    </>
  );
}
