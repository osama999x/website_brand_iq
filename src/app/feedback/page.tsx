"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { createFeedback } from "../../services/feedbackService";

const RATING_OPTIONS = [5, 4, 3, 2, 1] as const;

export default function FeedbackPage() {
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return false;
    if (!email.trim()) return false;
    return true;
  }, [email, rating]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!canSubmit) {
      setError("Please provide a rating and your email.");
      return;
    }

    setSubmitting(true);
    try {
      await createFeedback({
        email: email.trim(),
        rating,
        comments: comments.trim() || undefined,
        channel: "Web",
      });
      setSuccess("Thanks! Your feedback has been submitted.");
      setComments("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit feedback");
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
            <li className="text-neutral-900 font-medium">Feedback</li>
          </ol>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 mb-3">
          Website Feedback
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Tell us what you liked — and what we can improve.
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

          <form onSubmit={onSubmit} className="space-y-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                Email <span className="text-red-500">*</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                Rating <span className="text-red-500">*</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {RATING_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRating(r)}
                    className={`h-11 px-4 border text-sm font-semibold transition-colors ${
                      rating === r
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide uppercase text-neutral-700">
                Comments (optional)
              </span>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="What should we improve?"
                className="min-h-[140px] border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900"
              />
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
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

