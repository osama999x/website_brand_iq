import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/Providers";
import AnnouncementBar from "../components/AnnouncementBar";
import { getAllCategories, getHome } from "../services/homeService";
import type { ApiCategory } from "../types/api";
import type { ApiHero } from "../types/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BrandIQ — Fashion for Everyone",
  description:
    "Discover the latest in fashion for men, women, and juniors. Shop new arrivals, denim, t-shirts, trousers and more.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categories: ApiCategory[] = [];
  let announcement: { enabled?: boolean; messages?: string[] } | null = null;
  try {
    categories = await getAllCategories();
  } catch {
    // use empty list so UI still renders
  }

  try {
    const home = await getHome();
    const heroRaw = home.hero;
    const hero: ApiHero | null = Array.isArray(heroRaw)
      ? heroRaw
          .filter((h) => h && (h.isActive ?? true))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0] ?? null
      : heroRaw ?? null;
    const ann = hero?.announcement;
    if (ann && (ann.enabled ?? false) && Array.isArray(ann.messages) && ann.messages.length > 0) {
      announcement = ann;
    }
  } catch {
    // keep announcement null; UI should still render
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-white text-neutral-900">
        <AnnouncementBar enabled={announcement?.enabled} messages={announcement?.messages} />
        <Providers initialCategories={categories}>{children}</Providers>
      </body>
    </html>
  );
}
