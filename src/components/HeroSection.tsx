import Image from "next/image";
import Link from "next/link";

interface HeroSectionProps {
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

const FALLBACK_IMAGE = "https://placehold.co/1600x900/1a1a2e/e2e8f0.png?text=DENIM+SS26";

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

export default function HeroSection({ campaign, hero }: HeroSectionProps) {
  const heroPoster = ensureAbsoluteMediaUrl(hero?.poster);
  const heroVideo = ensureAbsoluteMediaUrl(hero?.video);
  const imageSrc = heroPoster ?? campaign?.banner ?? FALLBACK_IMAGE;

  const headline = hero?.headline ?? campaign?.campaignName ?? "Denim";
  const subline = hero?.subheadline ?? "Spring Summer 2026";
  const labelLine =
    hero?.labels?.filter(Boolean).join(" • ") || "New Collection";

  const ctaHref = hero?.cta?.href?.trim() || "/products";
  const ctaText = hero?.cta?.text?.trim() || "Shop Now";

  const overlayOpacity = clampOpacity(hero?.theme?.overlayOpacity);
  const overlayColor = hero?.theme?.overlayColor?.trim();
  const textColor = hero?.theme?.textColor?.trim();

  return (
    <section className="relative w-full h-[90vh] min-h-[500px] overflow-hidden">
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
        <Image
          src={imageSrc}
          alt={headline}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      )}

      {/* Overlay */}
      {overlayColor && overlayOpacity != null ? (
        <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      )}

      {/* Text content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-20 px-6 text-center"
        style={textColor ? { color: textColor } : undefined}
      >
        <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase mb-4 text-neutral-300">
          {labelLine}
        </p>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-none mb-4">
          {headline}
        </h1>
        <p className="text-xl sm:text-2xl font-light tracking-[0.15em] uppercase mb-8 text-neutral-200">
          {subline}
        </p>
        <Link
          href={ctaHref}
          className="inline-block bg-white text-neutral-900 text-sm font-bold tracking-[0.2em] uppercase px-10 py-4 transition-all duration-300 hover:bg-neutral-900 hover:text-white border border-white"
        >
          {ctaText}
        </Link>
      </div>
    </section>
  );
}
