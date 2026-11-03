"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ShopGender } from "../lib/shopGender";

interface HeroSectionProps {
  /** Active department. Cosmetics uses the beauty stage instead of apparel copy. */
  shop?: ShopGender;
  /** Optional campaign from API for banner image and headline */
  campaign?: { banner?: string; campaignName?: string };
  hero?: {
    video?: string;
    poster?: string;
    labels?: string[];
    headline?: string;
    subheadline?: string;
    cta?: { text?: string; href?: string };
    theme?: { overlayColor?: string; overlayOpacity?: number; textColor?: string };
  };
}

const FALLBACK_IMAGE = "https://placehold.co/1600x900/14141c/14141c.png";
const BEAUTY_FALLBACK = "https://placehold.co/1600x900/2c2420/2c2420.png";

function getAssetBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!base) return null;
  return base.replace(/\/$/, "");
}

function ensureAbsoluteMediaUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("images/")) {
    const base = getAssetBaseUrl();
    if (base) return `${base}/${trimmed}`;
  }
  return undefined;
}

function clampOpacity(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export default function HeroSection({ shop, campaign, hero }: HeroSectionProps) {
  const beauty = shop === "cosmetics";
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const heroPoster = ensureAbsoluteMediaUrl(hero?.poster);
  const heroVideo = ensureAbsoluteMediaUrl(hero?.video);
  const imageSrc = heroPoster ?? campaign?.banner ?? (beauty ? BEAUTY_FALLBACK : FALLBACK_IMAGE);

  const headline = hero?.headline ?? campaign?.campaignName ?? (beauty ? "Beauty" : "Denim");
  const subline = hero?.subheadline ?? (beauty ? "Color and care" : "Spring Summer 2026");
  const labelLine =
    hero?.labels?.filter(Boolean).join(" • ") || (beauty ? "Cosmetics" : "New Collection");

  const ctaHref = hero?.cta?.href?.trim() || (beauty ? "/products?gender=cosmetics" : "/products");
  const ctaText = hero?.cta?.text?.trim() || (beauty ? "Shop Beauty" : "Shop Now");

  const overlayOpacity = clampOpacity(hero?.theme?.overlayOpacity);
  const overlayColor = hero?.theme?.overlayColor?.trim();
  const textColor = hero?.theme?.textColor?.trim();

  return (
    <section
      className="relative w-full h-[90vh] min-h-[500px] overflow-hidden"
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        e.currentTarget.style.setProperty("--hx", `${(x * -10).toFixed(2)}deg`);
        e.currentTarget.style.setProperty("--hy", `${(y * 6).toFixed(2)}deg`);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--hx", "0deg");
        e.currentTarget.style.setProperty("--hy", "0deg");
      }}
    >
      {/* Background video (preferred) or image (fallback) */}
      {heroVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={heroPoster}
        >
          <source src={heroVideo} />
        </video>
      ) : (
        <div className="hero-kenburns absolute inset-0">
          <Image
            src={imageSrc}
            alt={headline}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      )}

      {/* Overlay */}
      {overlayColor && overlayOpacity != null ? (
        <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      )}

      {/* Text content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-20 px-6 text-center text-white"
        style={textColor ? { color: textColor } : undefined}
      >
        <p className="hero-rise text-xs sm:text-sm font-semibold tracking-[0.28em] uppercase mb-4 text-neutral-300">
          {labelLine}
        </p>
        <h1
          className="hero-rise font-display text-6xl sm:text-8xl lg:text-9xl font-medium uppercase tracking-tight leading-[0.9] mb-4"
          style={{ animationDelay: "90ms" }}
        >
          <span className="hero-depth">{headline}</span>
        </h1>
        <p
          className="hero-rise text-lg sm:text-2xl font-light tracking-[0.18em] uppercase mb-8 text-neutral-200"
          style={{ animationDelay: "180ms" }}
        >
          {subline}
        </p>
        <Link
          href={ctaHref}
          className="hero-rise group inline-flex items-center gap-3 bg-white text-neutral-900 text-xs sm:text-sm font-semibold tracking-[0.22em] uppercase px-10 py-4 transition-colors duration-300 hover:bg-neutral-900 hover:text-white border border-white"
          style={{ animationDelay: "280ms" }}
        >
          {ctaText}
          <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
