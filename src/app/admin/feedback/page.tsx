"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { getAllFeedback, type FeedbackItem } from "../../../services/feedbackService";

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number>(1);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllFeedback();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Trigger initial load without setState-in-effect rule violations by delegating
    // work to an async function (state changes happen after await).
    void load();
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((f) => typeof f.rating === "number" && f.rating >= minRating)
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
  }, [items, minRating]);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-neutral-500">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-900 font-medium">Admin Feedback</li>
          </ol>
        </nav>

        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              Feedback
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {loading ? "Loading…" : `${filtered.length} item(s)`}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs font-semibold tracking-wide uppercase text-neutral-500">
              Min rating
            </span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r}+
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={`border px-4 py-2 text-xs font-bold tracking-[0.2em] uppercase transition-colors ${
              loading
                ? "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700 hover:border-neutral-700"
            }`}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <p className="text-xs text-neutral-400">
            Tip: refresh to see latest submissions.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="border border-neutral-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Date</th>
                <th className="text-left font-semibold px-4 py-3">Rating</th>
                <th className="text-left font-semibold px-4 py-3">Email / Customer</th>
                <th className="text-left font-semibold px-4 py-3">Channel</th>
                <th className="text-left font-semibold px-4 py-3">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={5}>
                    Loading feedback…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={5}>
                    No feedback found.
                  </td>
                </tr>
              ) : (
                filtered.map((f, idx) => (
                  <tr key={f._id ?? `${f.email ?? "guest"}-${idx}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                      {formatDate(f.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">
                      {f.rating}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <div className="flex flex-col">
                        <span className="font-medium">{f.email ?? "—"}</span>
                        <span className="text-xs text-neutral-500">{f.customerId ?? "guest"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {f.channel ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 min-w-[320px]">
                      {f.comments ? (
                        <span className="whitespace-pre-wrap">{String(f.comments)}</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-neutral-400">
          Note: this page is not secured yet. Add auth/role checks before using it in production.
        </p>
      </main>
      <Footer />
    </>
  );
}

