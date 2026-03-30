import { serverFetch } from "@/src/lib/server-fetch";
import { getProducts } from "@/src/services/product.service";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string }>;
}>) {
  const { page: pageStr } = await searchParams;
  const page = Number.parseInt(pageStr ?? "1") || 1;

  // Pass serverFetch to the universal service when calling from a Server Component
  const paginated = await getProducts(page, serverFetch);

  return <ProductsClient initialPaginated={paginated} />;
}
