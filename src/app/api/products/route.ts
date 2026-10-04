import { NextResponse } from 'next/server';
import { getAllProductsWithVariants, createProduct, CreateProductInput } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true' || searchParams.get('all') === 'true';
    const products = await getAllProductsWithVariants(includeInactive);
    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateProductInput;

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: 'Tên sản phẩm không được để trống.' }, { status: 400 });
    }

    if (!body.variants || !Array.isArray(body.variants) || body.variants.length === 0) {
      return NextResponse.json({ success: false, message: 'Cần có ít nhất một biến thể màu sắc, kích cỡ và giá.' }, { status: 400 });
    }

    const result = await createProduct(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Lỗi tạo sản phẩm' }, { status: 500 });
  }
}
