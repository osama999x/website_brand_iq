import Link from "next/link";
import type { ShopGender } from "../lib/shopGender";

const clothing: Array<{
  index: string;
  label: string;
  href: string;
  gender: ShopGender;
  note: string;
}> = [
  { index: "01", label: "Men", href: "/?gender=men", gender: "men", note: "Denim, shirts, tailoring" },
  { index: "02", label: "Women", href: "/?gender=women", gender: "women", note: "Dresses, knits, denim" },
  { index: "03", label: "Juniors", href: "/?gender=juniors", gender: "juniors", note: "Everyday pieces" },
];

const perks = ["Free delivery over PKR 5,000", "30-day returns", "Secure checkout"];

export default function ShopDepartments({ active }: { active?: ShopGender }) {
  const beautyActive = active === "cosmetics";

  return (
    <section className="border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2 flex items-end justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-neutral-500">Clothing</p>
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400">Beauty</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {clothing.map((dept) => {
          const isActive = active === dept.gender;
          return (
            <Link
              key={dept.gender}
              href={dept.href}
              className={`dept-3d group relative flex min-h-[168px] sm:min-h-[200px] flex-col justify-between p-5 sm:p-6 border ${
                isActive
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-neutral-50 text-neutral-900 border-neutral-200 hover:bg-neutral-900 hover:text-white hover:border-neutral-900"
              }`}
            >
              <span className={`text-[11px] tracking-[0.22em] ${isActive ? "text-neutral-400" : "text-neutral-400 group-hover:text-neutral-500"}`}>
                {dept.index}
              </span>
              <div>
                <h2 className="font-display text-4xl sm:text-5xl font-medium leading-none tracking-tight">
                  {dept.label}
                </h2>
                <p className={`mt-3 text-xs tracking-wide ${isActive ? "text-neutral-300" : "text-neutral-500 group-hover:text-neutral-300"}`}>
                  {dept.note}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
                  Shop
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                </span>
              </div>
            </Link>
          );
        })}

        <Link
          href="/?gender=cosmetics"
          className={`dept-3d dept-3d-beauty group relative col-span-2 lg:col-span-1 flex min-h-[168px] sm:min-h-[200px] flex-col justify-between p-5 sm:p-6 border ${
            beautyActive
              ? "bg-[#2c2420] text-[#f6f0ea] border-[#2c2420]"
              : "bg-[#f6f0ea] text-[#2c2420] border-[#e7ddd3] hover:bg-[#2c2420] hover:text-[#f6f0ea] hover:border-[#2c2420]"
          }`}
        >
          <span className={`text-[11px] tracking-[0.22em] uppercase ${beautyActive ? "text-[#cbbfb4]" : "text-[#a8988c] group-hover:text-[#cbbfb4]"}`}>
            Cosmetics
          </span>
          <div>
            <h2 className="font-display text-4xl sm:text-5xl font-medium leading-none tracking-tight">Beauty</h2>
            <p className={`mt-3 text-xs tracking-wide ${beautyActive ? "text-[#e4d8ce]" : "text-[#8d7b70] group-hover:text-[#e4d8ce]"}`}>
              Color, care, and finish
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
              Shop beauty
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </span>
          </div>
        </Link>
      </div>
      <div className="border-t border-neutral-200">
        <ul className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 text-[11px] font-medium tracking-[0.18em] uppercase text-neutral-500">
          {perks.map((perk, i) => (
            <li key={perk} className="flex items-center">
              {i > 0 ? (
                <span className="hidden sm:inline mx-4 text-neutral-300" aria-hidden>
                  ·
                </span>
              ) : null}
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
