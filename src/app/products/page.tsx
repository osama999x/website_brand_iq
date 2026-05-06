import { Suspense } from "react";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ gender?: string }>;
}) {
  const params = (await searchParams) ?? {};
  return (
    <Suspense fallback={null}>
      <ProductsClient gender={params.gender} />
    </Suspense>
  );
}
