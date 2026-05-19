import type { NextConfig } from "next";
import { deriveAssetBaseFromApiUrl } from "./src/lib/assets";

function resolveAssetBaseUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const api = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (api) return deriveAssetBaseFromApiUrl(api) ?? undefined;
  return undefined;
}

function assetRemotePattern():
  | { protocol: "http" | "https"; hostname: string; port?: string; pathname: string }
  | undefined {
  const base = resolveAssetBaseUrl();
  if (!base) return undefined;
  try {
    const u = new URL(base);
    const protocol = u.protocol.replace(":", "") as "http" | "https";
    return {
      protocol,
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/**",
    };
  } catch {
    return undefined;
  }
}

const assetPattern = assetRemotePattern();

const nextConfig: NextConfig = {
  images: {
    // Avoid Next Image Optimizer SSRF restrictions for localhost/private IP assets
    // while still using next/image for layout and responsive behavior.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3015",
        pathname: "/images/**",
      },
      ...(assetPattern ? [assetPattern] : []),
    ],
  },
};

export default nextConfig;
