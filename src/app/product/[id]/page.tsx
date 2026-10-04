import ProductDetail from '@/components/ProductDetail';
import { getProductByIdOrSlug } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductByIdOrSlug(id);
  if (!product) {
    return { title: 'Product Not Found — ATELIER' };
  }
  return {
    title: `${product.name} — ATELIER / CAISHOP`,
    description: product.description || 'Chi tiết sản phẩm thời trang cao cấp CAISHOP ATELIER.'
  };
}

export default async function SingleProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawProduct = getProductByIdOrSlug(id);
  const product = rawProduct ? JSON.parse(JSON.stringify(rawProduct)) : null;

  return <ProductDetail initialProduct={product} productId={id} />;
}
