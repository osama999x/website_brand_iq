import type { ShopGender } from "../lib/shopGender";

export interface Product {
  id: number;
  name: string;
  fit: string;
  gender: "Men" | "Women" | "Juniors" | "Unisex" | "Cosmetics";
  /** API category gender slug (e.g. cosmetics) for size/cart rules */
  categoryGender?: ShopGender;
  price: number;
  /** Original price (for strike-through display when discounted) */
  compareAtPrice?: number;
  /** Per-unit tax amount from API (if any) */
  taxAmount?: number;
  /** Whether tax should be applied (if provided by API) */
  isTaxable?: boolean;
  image: string;
  images: string[];
  category: string;
  isNew: boolean;
  slug: string;
  description: string;
  /** Optional long-form description from API product detail */
  longDescription?: string;
  /** Optional size guide text from API product detail */
  sizeGuide?: string;
  /** Optional size/fit text from API product detail */
  sizeFit?: string;
  /** Optional delivery/returns text from API product detail */
  deliveryReturns?: string;
  /** Color variants (when API returns variant blocks without sizes, or as an optional selector). */
  colors?: Array<{
    name: string;
    hex?: string;
    sku?: string;
    price?: number;
    /** Original price for this color (strike-through when discounted) */
    compareAtPrice?: number;
  }>;
  /** For color+size products: per-color size maps and available sizes */
  colorSizeMaps?: Record<
    string,
    {
      sizes: string[];
      sizeToSku: Record<string, string>;
      sizeToPrice: Record<string, number>;
      sizeToCompareAtPrice: Record<string, number>;
    }
  >;
  /** Single-variant fallback SKU when no size/color selection exists */
  baseSku?: string;
  sizes: string[];
  /** API catalog: uppercase size label → variant SKU for orders */
  sizeToSku?: Record<string, string>;
  /** API catalog: uppercase size label → unit price for that variant */
  sizeToPrice?: Record<string, number>;
  /** API catalog: uppercase size label → original (actual) price for strike-through */
  sizeToCompareAtPrice?: Record<string, number>;
}

const products: Product[] = [
  {
    id: 1,
    name: "Quarter Zip-Up Polo Shirt",
    fit: "Regular Fit",
    gender: "Men",
    price: 3990,
    image: "https://placehold.co/600x800/d1d5db/374151?text=Polo+Shirt",
    images: [
      "https://placehold.co/600x800/d1d5db/374151?text=Polo+Shirt",
      "https://placehold.co/600x800/e5e7eb/374151?text=Polo+Front",
      "https://placehold.co/600x800/f3f4f6/374151?text=Polo+Back",
      "https://placehold.co/600x800/cbd5e1/374151?text=Polo+Detail",
    ],
    category: "T-Shirts & Polos",
    isNew: true,
    slug: "quarter-zip-up-polo-shirt",
    description:
      "A classic quarter zip-up polo shirt in a regular fit. Made from premium cotton blend fabric with a textured finish. Features a stand-up collar and zip placket for a smart casual look.",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 2,
    name: "Cropped Graphic T-Shirt",
    fit: "Boxy Fit",
    gender: "Men",
    price: 3290,
    image: "https://placehold.co/600x800/e5e7eb/374151?text=Graphic+Tee",
    images: [
      "https://placehold.co/600x800/e5e7eb/374151?text=Graphic+Tee",
      "https://placehold.co/600x800/d1d5db/374151?text=Tee+Front",
      "https://placehold.co/600x800/f9fafb/374151?text=Tee+Back",
      "https://placehold.co/600x800/e2e8f0/374151?text=Tee+Detail",
    ],
    category: "T-Shirts & Polos",
    isNew: false,
    slug: "cropped-graphic-t-shirt",
    description:
      "A bold cropped graphic tee in a relaxed boxy fit. Features an oversized screen-printed graphic on the chest. Cut slightly shorter for a contemporary streetwear silhouette.",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 3,
    name: "Baggy Fit Jeans",
    fit: "Baggy Fit",
    gender: "Men",
    price: 6490,
    image: "https://placehold.co/600x800/bfdbfe/1e3a5f?text=Baggy+Jeans",
    images: [
      "https://placehold.co/600x800/bfdbfe/1e3a5f?text=Baggy+Jeans",
      "https://placehold.co/600x800/dbeafe/1e3a5f?text=Jeans+Front",
      "https://placehold.co/600x800/eff6ff/1e3a5f?text=Jeans+Back",
      "https://placehold.co/600x800/cfe2ff/1e3a5f?text=Jeans+Detail",
    ],
    category: "Denim",
    isNew: true,
    slug: "baggy-fit-jeans-men",
    description:
      "A super baggy fit jean crafted from sturdy denim fabric. Features a five-pocket construction, zip fly with button closure, and a relaxed through the seat and thigh with a straight leg opening.",
    sizes: ["30", "32", "34", "36", "38"],
  },
  {
    id: 4,
    name: "Slim Fit Jeans",
    fit: "Slim Fit",
    gender: "Men",
    price: 5990,
    image: "https://placehold.co/600x800/dbeafe/1e40af?text=Slim+Jeans",
    images: [
      "https://placehold.co/600x800/dbeafe/1e40af?text=Slim+Jeans",
      "https://placehold.co/600x800/bfdbfe/1e40af?text=Slim+Front",
      "https://placehold.co/600x800/eff6ff/1e40af?text=Slim+Back",
      "https://placehold.co/600x800/e0f2fe/1e40af?text=Slim+Detail",
    ],
    category: "Denim",
    isNew: false,
    slug: "slim-fit-jeans-men",
    description:
      "Classic slim fit jeans in a versatile indigo blue wash. A timeless silhouette that fits close to the body from waist to ankle. Five-pocket construction with zip fly.",
    sizes: ["30", "32", "34", "36", "38"],
  },
  {
    id: 5,
    name: "Cropped Embroidered T-Shirt",
    fit: "Regular Fit",
    gender: "Women",
    price: 3290,
    image: "https://placehold.co/600x800/fce7f3/831843?text=Cropped+Tee",
    images: [
      "https://placehold.co/600x800/fce7f3/831843?text=Cropped+Tee",
      "https://placehold.co/600x800/fdf2f8/831843?text=Tee+Front",
      "https://placehold.co/600x800/fbcfe8/831843?text=Tee+Back",
      "https://placehold.co/600x800/fce7f3/9d174d?text=Embroidery",
    ],
    category: "T-Shirts",
    isNew: true,
    slug: "cropped-embroidered-t-shirt",
    description:
      "A feminine cropped tee with delicate embroidery detailing at the chest. Made from soft jersey fabric in a regular fit. Pairs perfectly with high-waist bottoms.",
    sizes: ["XS", "S", "M", "L"],
  },
  {
    id: 6,
    name: "High Rise Wide Leg Jeans",
    fit: "Wide Leg Fit",
    gender: "Women",
    price: 5990,
    image: "https://placehold.co/600x800/e0f2fe/0c4a6e?text=Wide+Leg",
    images: [
      "https://placehold.co/600x800/e0f2fe/0c4a6e?text=Wide+Leg",
      "https://placehold.co/600x800/bae6fd/0c4a6e?text=Wide+Front",
      "https://placehold.co/600x800/f0f9ff/0c4a6e?text=Wide+Back",
      "https://placehold.co/600x800/cffafe/0c4a6e?text=Wide+Detail",
    ],
    category: "Denim",
    isNew: false,
    slug: "high-rise-wide-leg-jeans",
    description:
      "A flattering high-rise wide leg jean with a relaxed, flowing silhouette. Cut straight from hip to hem for an elongating effect. Features a zip fly with button closure.",
    sizes: ["24", "26", "28", "30", "32"],
  },
  {
    id: 7,
    name: "Terry Wide Leg Trousers",
    fit: "Wide Leg Fit",
    gender: "Women",
    price: 6490,
    image: "https://placehold.co/600x800/f3f4f6/111827?text=Trousers",
    images: [
      "https://placehold.co/600x800/f3f4f6/111827?text=Trousers",
      "https://placehold.co/600x800/e5e7eb/111827?text=Trousers+Front",
      "https://placehold.co/600x800/f9fafb/111827?text=Trousers+Back",
      "https://placehold.co/600x800/d1d5db/111827?text=Waistband",
    ],
    category: "Trousers",
    isNew: true,
    slug: "terry-wide-leg-trousers",
    description:
      "Elevated wide-leg trousers crafted from soft terry fabric. Features an elasticated waistband and side pockets. A relaxed yet polished everyday essential.",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: 8,
    name: "Slogan Print Jogger Trousers",
    fit: "Relaxed Fit",
    gender: "Men",
    price: 5490,
    image: "https://placehold.co/600x800/d1fae5/064e3b?text=Joggers",
    images: [
      "https://placehold.co/600x800/d1fae5/064e3b?text=Joggers",
      "https://placehold.co/600x800/a7f3d0/064e3b?text=Joggers+Front",
      "https://placehold.co/600x800/ecfdf5/064e3b?text=Joggers+Back",
      "https://placehold.co/600x800/bbf7d0/064e3b?text=Print+Detail",
    ],
    category: "Trousers",
    isNew: false,
    slug: "slogan-print-jogger-trousers",
    description:
      "Comfortable relaxed fit jogger trousers with a bold slogan print down the leg. Features an elasticated waistband with drawstring, ribbed cuffs, and side pockets.",
    sizes: ["S", "M", "L", "XL"],
  },
];

export default products;
