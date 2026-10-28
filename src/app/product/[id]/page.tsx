import ProductDetail from '@/components/ProductDetail';
import { getProductByIdOrSlug } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductByIdOrSlug(id);
  if (!product) {
    return { title: "Product Not Found — DE'GENT" };
  }
  return {
    title: `${product.name} — DE'GENT`,
    description: product.description || "Chi tiết sản phẩm thời trang cao cấp DE'GENT."
  };
}

export default async function SingleProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawProduct = await getProductByIdOrSlug(id);
  const product = rawProduct ? JSON.parse(JSON.stringify(rawProduct)) : null;

  return <ProductDetail initialProduct={product} productId={id} />;
}
