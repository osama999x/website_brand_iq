import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import { parseShopGender } from "../../lib/shopGender";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ gender?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const gender = parseShopGender(params.gender);
  return (
    <Suspense fallback={null}>
      <ProductsClient gender={gender} />
    </Suspense>
  );
}
